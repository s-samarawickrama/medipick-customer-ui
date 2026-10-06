import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Animated, StatusBar, Image, Platform
} from 'react-native';
import { useNavigation, useIsFocused, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Store, Clock, Package, Navigation2, FileText, Pill, Receipt, Camera, Star, ChevronRight, Phone, MessageCircle } from 'lucide-react-native';
import { useTheme, ThemeColors } from '../../context/ThemeContext';
import { FONTS } from '../../theme/typography';
import { useOrders } from '../../context/OrderContext';
import { useCart } from '../../context/CartContext';
import { MainStackParamList } from '../../navigation/MainNavigator';
import { Order } from '../../types';
import { Loader2 } from 'lucide-react-native';


type Nav = NativeStackNavigationProp<MainStackParamList>;

// ─── Status config ───────────────────────────────────────────────
function getStatusHeadline(state: string): string {
  if (state === 'COMPLETED')                     return 'Order Completed';
  if (state === 'CANCELLED' || state === 'CLOSED' || state === 'REJECTED') return 'Order Declined';
  if (state === 'READY_FOR_PICKUP')              return 'Ready for Counter Pickup';
  if (state === 'PREPARING')                     return 'Pharmacist is Packaging';
  if (state === 'WAITING_CUSTOMER_CONFIRMATION') return 'Quote Ready to Review';
  if (state === 'WAITING_PHARMACY_CONFIRMATION') return 'Under Pharmacist Review';
  if (state === 'REUPLOAD_REQUESTED')            return 'Action Required';
  if (state === 'ISSUE_REPORTED')                return 'Issue Reported';
  return 'Order Confirmed';
}

function getStatusSub(state: string): string {
  if (state === 'COMPLETED')                     return 'You have successfully picked up this order';
  if (state === 'CANCELLED' || state === 'CLOSED' || state === 'REJECTED') return 'This order was cancelled or declined';
  if (state === 'READY_FOR_PICKUP')              return 'Show your OTP code at the pharmacy counter';
  if (state === 'PREPARING')                     return 'Your medicines are being carefully prepared';
  if (state === 'WAITING_CUSTOMER_CONFIRMATION') return 'Tap to view and confirm your quote';
  if (state === 'WAITING_PHARMACY_CONFIRMATION') return 'Waiting for pharmacy to send a quote';
  if (state === 'REUPLOAD_REQUESTED')            return 'The pharmacist requested a clearer photo';
  if (state === 'ISSUE_REPORTED')                return 'Pharmacy is reviewing your reported issue';
  return 'Your prescription has been received';
}

const showAlert = (title: string, message: string) => {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
  } else {
    // @ts-ignore - dynamic require for native Alert
    const { Alert } = require('react-native');
    Alert.alert(title, message);
  }
};

// ─── Active Order Card ─────────────────────────────────────────
const ActiveOrderCard = ({
  order,
  onPress,
  onAction,
  onReorder,
  onReportIssue,
}: {
  order: Order;
  onPress: () => void;
  onAction: () => void;
  onReorder?: () => void;
  onReportIssue?: () => void;
}) => {
  const { colors } = useTheme();
  const s = makeStyles(colors);
  const isReady = order.state === 'READY_FOR_PICKUP';
  const isQuote = order.state === 'WAITING_CUSTOMER_CONFIRMATION';
  const isCompleted = order.state === 'COMPLETED';
  const isCancelled = ['CANCELLED', 'CLOSED', 'REJECTED'].includes(order.state);
  const isActive = !isCompleted && !isCancelled;
  const isRecentCompleted = isCompleted && !order.refundStatus && !order.rejectReason && new Date(order.createdAt).getTime() > Date.now() - 24 * 3600 * 1000;

  // Dynamic Card Styles
  let cardBg = colors.surfaceWhite;
  let cardBorder = colors.borderSoft;
  
  if (isReady) {
    cardBg = colors.surfaceElevated;
    cardBorder = colors.softLime;
  } else if (isCompleted) {
    cardBorder = '#D1FAE5';
  } else if (isCancelled) {
    cardBorder = '#FECACA';
  } else if (order.state === 'REUPLOAD_REQUESTED') {
    cardBorder = colors.borderSoft;
  }

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[s.activeCard, { backgroundColor: cardBg, borderColor: cardBorder }]}
    >
      {/* Header Row: Pharmacy info + Live badge */}
      <View style={s.activeCardHeaderRow}>
        <View style={s.pharmAvatar}>
          {order.pharmacy?.image ? (
            <Image source={require('../../utils/imageMapper').getLocalImage(order.pharmacy.image)} style={s.pharmAvatarImage} />
          ) : (
            <Store color={colors.midTeal} size={20} strokeWidth={2} />
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.pharmName}>{order.pharmacy?.name ?? 'MediPick Pharmacy'}</Text>
          <Text style={s.pharmType}>
            {order.orderType === 'PRESCRIPTION' ? 'Prescription Order'
              : order.orderType === 'MIXED' ? 'Prescription & Pharmacy Items' : 'Pharmacy Items'}
          </Text>
        </View>
        
        {isActive ? (
          <View style={[s.liveBadgePill, isReady && s.liveBadgePillReady]}>
            <View style={s.liveDotSmall} />
            <Text style={s.liveBadgeText}>{isReady ? 'Ready' : 'Live'}</Text>
          </View>
        ) : isCompleted ? (
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {order.refundStatus === 'REFUNDED' && (
              <View style={[s.liveBadgePill, { backgroundColor: colors.surfaceSubtle }]}>
                <Text style={[s.liveBadgeText, { color: colors.textMuted }]}>Refunded</Text>
              </View>
            )}
            {!!order.rejectReason && (
              <View style={[s.liveBadgePill, { backgroundColor: colors.errorLight }]}>
                <Text style={[s.liveBadgeText, { color: colors.error }]}>Rejected</Text>
              </View>
            )}
            <View style={[s.liveBadgePill, { backgroundColor: colors.successLight }]}>
              <Text style={[s.liveBadgeText, { color: colors.success }]}>Completed</Text>
            </View>
          </View>
        ) : (
          <View style={[s.liveBadgePill, { backgroundColor: colors.errorLight }]}>
            <Text style={[s.liveBadgeText, { color: colors.error }]}>Declined</Text>
          </View>
        )}
      </View>

      {/* Status headline */}
      <View style={s.statusBlock}>
        <View style={s.statusTextCol}>
          <Text style={[s.statusHeadline, isReady && { color: colors.midTeal }, (isCancelled || order.state === 'REUPLOAD_REQUESTED') && { color: colors.error }]}>
            {getStatusHeadline(order.state)}
          </Text>
          <Text style={s.statusSub}>{getStatusSub(order.state)}</Text>
        </View>
        <ChevronRight color={colors.textMuted} size={20} strokeWidth={2.5} style={{ opacity: 0.5 }} />
      </View>

      {/* Footer */}
      <View style={s.activeCardFooter}>
        <View style={{ minWidth: 80, justifyContent: 'center' }}>
          <Text style={s.footerLabel}>Total</Text>
          <Text style={s.footerPrice}>LKR {(order.totalAmount || 0).toLocaleString()}</Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, justifyContent: 'flex-end' }}>
          {isReady ? (
            <TouchableOpacity style={[s.footerBtn, s.btnTeal]} onPress={(e) => { e.stopPropagation(); onAction(); }}>
              <Text style={[s.footerBtnText, s.btnTealText]}>Show Pickup Code</Text>
            </TouchableOpacity>
          ) : isQuote ? (
            <TouchableOpacity style={[s.footerBtn, s.btnPurple]} onPress={(e) => { e.stopPropagation(); onAction(); }}>
              <Text style={[s.footerBtnText, s.btnPurpleText]}>Review Quote</Text>
            </TouchableOpacity>
          ) : isCompleted ? (
            <>
              {isRecentCompleted && onReportIssue && (
                <TouchableOpacity style={[s.footerBtn, s.btnLightGray]} onPress={(e) => { e.stopPropagation(); onReportIssue(); }}>
                  <Text style={[s.footerBtnText, s.btnLightGrayText]}>Report Issue</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={[s.footerBtn, s.btnTeal]} onPress={(e) => { e.stopPropagation(); onReorder?.(); }}>
                <Text style={[s.footerBtnText, s.btnTealText]}>Reorder</Text>
              </TouchableOpacity>
            </>
          ) : isCancelled || order.state === 'WAITING_PHARMACY_CONFIRMATION' ? (
            <View />
          ) : order.state === 'REUPLOAD_REQUESTED' ? (
            <TouchableOpacity style={[s.footerBtn, { backgroundColor: '#EF4444', borderColor: '#EF4444', borderWidth: 1 }]} onPress={(e) => { e.stopPropagation(); onAction(); }}>
              <Text style={[s.footerBtnText, { color: '#FFFFFF' }]}>Re-upload</Text>
            </TouchableOpacity>
          ) : order.state === 'ISSUE_REPORTED' ? (
            <TouchableOpacity style={[s.footerBtn, { backgroundColor: '#EF4444' }]} onPress={(e) => { e.stopPropagation(); onAction(); }}>
              <Text style={[s.footerBtnText, { color: '#FFF' }]}>Message Pharmacy</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={[s.footerBtn, s.btnGray]} onPress={(e) => { e.stopPropagation(); onAction(); }}>
              <Text style={[s.footerBtnText, s.btnGrayText]}>Track Order</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

export const OrdersScreen = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute<any>();
  const isFocused = useIsFocused();
  const { colors } = useTheme();
  const [tab, setTab] = useState<'active' | 'completed' | 'cancelled'>('active');
  const opacity = useRef(new Animated.Value(0)).current;
  const s = makeStyles(colors);

  useEffect(() => {
    if (route.params?.initialTab) {
      setTab(route.params.initialTab);
      // Clear the param so it doesn't force this tab on subsequent normal visits
      navigation.setParams({ initialTab: undefined });
    }
  }, [route.params?.initialTab, navigation]);

  useEffect(() => {
    StatusBar.setBarStyle('dark-content');
    Animated.timing(opacity, { toValue: 1, duration: 280, useNativeDriver: true }).start();
  }, []);

  const { orders, isLoading, fetchOrders } = useOrders();
  
  useEffect(() => {
    if (isFocused) {
      fetchOrders();
    }
  }, [isFocused]);

  const activeOrders    = orders.filter((o) => !['COMPLETED', 'CANCELLED', 'CLOSED', 'REJECTED'].includes(o.state));
  const completedOrders = orders.filter((o) => o.state === 'COMPLETED');
  const cancelledOrders = orders.filter((o) => ['CANCELLED', 'CLOSED', 'REJECTED'].includes(o.state));

  const displayed =
    tab === 'active' ? activeOrders :
    tab === 'completed' ? completedOrders :
    cancelledOrders;

  const goToOrderDetails = (o: Order) => {
    if (o.state === 'WAITING_CUSTOMER_CONFIRMATION') {
      navigation.navigate('Quotation', { orderId: o.id });
      return;
    }
    navigation.navigate('OrderDetails', { orderId: o.id });
  };

  const goToTracker = (o: Order) => {
    if (['READY_FOR_PICKUP', 'PREPARING', 'CONFIRMED', 'SUBMITTED'].includes(o.state)) {
      navigation.navigate('ReadyForPickup', { orderId: o.id });
    } else if (o.state === 'WAITING_CUSTOMER_CONFIRMATION') {
      navigation.navigate('Quotation', { orderId: o.id });
    } else if (o.state === 'REUPLOAD_REQUESTED') {
      navigation.navigate('UploadPrescription', { pharmacyId: o.pharmacy?.id, pharmacyName: o.pharmacy?.name });
    } else if (o.state === 'ISSUE_REPORTED') {
      navigation.navigate('PharmacyChat', { orderId: o.id });
    }
  };

  const { processReorder } = useCart();

  const handleReorder = async (summaryOrder: Order) => {
    if (summaryOrder.pharmacy && summaryOrder.pharmacy.isOpen === false) {
      showAlert('Pharmacy Closed', 'This pharmacy is currently closed. Please try again later.');
      return;
    }

    try {
      const { getOrder } = require('../../api/ordersApi');
      const order = await getOrder(summaryOrder.id);

    const validItems: any[] = [];
    let hasOutOfStock = false;

    if (order.items && order.items.length > 0) {
      order.items.forEach((oi: any) => {
        const fullMed = oi.medicine;
        if (fullMed) {
          const isAvailableAtPharmacy = fullMed.availableAtPharmacyIds?.includes(order.pharmacy!.id) ?? true;
          const isOutOfStockAtPharmacy = fullMed.outOfStockPharmacyIds?.includes(order.pharmacy!.id) ?? false;
          
          if (fullMed.inStock && isAvailableAtPharmacy && !isOutOfStockAtPharmacy) {
            validItems.push({
              medicine: fullMed,
              quantity: oi.quantity,
              pharmacy: order.pharmacy
            });
          } else {
            hasOutOfStock = true;
          }
        }
      });
    }

    let attachedRx = undefined;
    if (order.prescriptionId) {
      attachedRx = {
        image: order.prescriptionId,
        note: 'Reorder from previous prescription',
        pharmacyId: order.pharmacy!.id,
        pharmacyName: order.pharmacy!.name
      };
    }

    if (validItems.length === 0 && !attachedRx) {
      showAlert('Cannot Reorder', 'None of the items from your previous order are currently available.');
      return;
    }

    if (hasOutOfStock) {
      if (Platform.OS === 'web') {
        const proceed = window.confirm('Some items from this order are out of stock and could not be added. Proceed to cart with available items?');
        if (!proceed) return;
        processReorder(validItems, attachedRx);
        navigation.navigate('MultiStoreCart');
      } else {
        const { Alert } = require('react-native');
        Alert.alert(
          'Items Out of Stock',
          'Some items from this order are out of stock and could not be added. Proceed to cart with available items?',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Proceed to Cart', 
              onPress: () => {
                processReorder(validItems, attachedRx);
                navigation.navigate('MultiStoreCart');
              }
            }
          ]
        );
      }
    } else {
      processReorder(validItems, attachedRx);
      navigation.navigate('MultiStoreCart');
    }
    } catch (e) {
      console.warn('Failed to fetch full order for reorder:', e);
      showAlert('Error', 'Could not load order details for reordering.');
    }
  };

  return (
    <View style={s.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bgWarm} />

      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>Orders</Text>
        {activeOrders.length > 0 && (
          <View style={s.headerLiveBadge}>
            <View style={s.headerLiveDot} />
            <Text style={s.headerLiveText}>{activeOrders.length} Live</Text>
          </View>
        )}
      </View>

      {/* Tabs */}
      <View style={s.tabsRow}>
        {(
          [
            { key: 'active',    label: 'Active',    count: activeOrders.length },
            { key: 'completed', label: 'Completed', count: completedOrders.length },
            { key: 'cancelled', label: 'Declined',  count: cancelledOrders.length },
          ] as { key: 'active' | 'completed' | 'cancelled'; label: string; count: number }[]
        ).map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[s.tabBtn, tab === t.key && s.tabBtnActive]}
            onPress={() => setTab(t.key)}
            activeOpacity={0.8}
          >
            <Text style={[s.tabText, tab === t.key && s.tabTextActive]}>{t.label}</Text>
            {t.count > 0 && (
              <View style={[s.tabCountBadge, tab === t.key && s.tabCountBadgeActive]}>
                <Text style={[s.tabCountText, tab === t.key && s.tabCountTextActive]}>{t.count}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <Animated.ScrollView
        style={{ flex: 1, opacity }}
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 }}>
            <Loader2 color={colors.midTeal} size={32} style={{ opacity: 0.8 }} />
            <Text style={{ fontFamily: FONTS.medium, color: colors.textMuted, marginTop: 12 }}>Loading orders...</Text>
          </View>
        ) : (
          <>
            {displayed.map((o) => (
              <ActiveOrderCard 
                key={o.id} 
                order={o} 
                onPress={() => goToOrderDetails(o)} 
                onAction={() => goToTracker(o)} 
                onReorder={() => handleReorder(o)}
                onReportIssue={o.state === 'COMPLETED' ? () => navigation.navigate('ReportIssue', { orderId: o.id }) : undefined}
              />
            ))}

            {displayed.length === 0 && (
              <View style={s.emptyWrap}>
                <Package color={colors.textMuted} size={44} strokeWidth={1.5} />
                <Text style={s.emptyTitle}>No {tab} orders</Text>
                <Text style={s.emptySub}>Your pharmacy orders will appear here</Text>
              </View>
            )}
          </>
        )}
      </Animated.ScrollView>
    </View>
  );
};

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgWarm },

  header: {
    backgroundColor: colors.bgWarm, paddingTop: 52, paddingBottom: 14,
    paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center',
    borderBottomWidth: 1, borderBottomColor: colors.borderSoft,
  },
  headerTitle: { fontFamily: FONTS.black, fontSize: 26, color: colors.textDark, letterSpacing: -0.6, flex: 1 },
  headerLiveBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: colors.successLight, paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20, borderWidth: 1, borderColor: colors.success,
  },
  headerLiveDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: colors.midTeal },
  headerLiveText: { fontFamily: FONTS.bold, fontSize: 12, color: colors.midTeal },

  // Tabs
  tabsRow: {
    flexDirection: 'row', gap: 8, paddingHorizontal: 20,
    paddingVertical: 12, backgroundColor: colors.surfaceWhite,
    borderBottomWidth: 1, borderBottomColor: colors.borderSoft,
  },
  tabBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1.5,
    borderColor: colors.borderSoft, backgroundColor: colors.bgWarm,
  },
  tabBtnActive: { borderColor: colors.midTeal, backgroundColor: colors.midTeal },
  tabText: { fontFamily: FONTS.bold, fontSize: 13, color: colors.textMuted },
  tabTextActive: { color: '#fff' },
  tabCountBadge: {
    backgroundColor: colors.surfaceSubtle, borderRadius: 10,
    paddingHorizontal: 6, paddingVertical: 1, minWidth: 18, alignItems: 'center',
  },
  tabCountBadgeActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
  tabCountText: { fontFamily: FONTS.black, fontSize: 10, color: colors.textMuted },
  tabCountTextActive: { color: '#fff' },

  scroll: { padding: 16, paddingBottom: 100, gap: 16 },

  // ── Active Order Card ───────────────────────────────────────
  activeCard: {
    borderRadius: 18,
    borderWidth: 1.5,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 2,
    marginBottom: 16, overflow: 'hidden',
  },
  activeCardHeaderRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12,
  },
  pharmAvatar: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: colors.surfaceSubtle, justifyContent: 'center', alignItems: 'center',
  },
  pharmAvatarImage: { width: '100%', height: '100%', borderRadius: 14 },
  pharmAvatarText: { fontFamily: FONTS.black, fontSize: 16, color: colors.textMuted },
  pharmName: { fontFamily: FONTS.bold, fontSize: 15, color: colors.textDark },
  pharmType: { fontFamily: FONTS.medium, fontSize: 12, color: colors.textMuted, marginTop: 2 },
  
  liveBadgePill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.surfaceSubtle, paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 12,
  },
  liveBadgePillReady: { backgroundColor: colors.limeWhisper },
  liveDotSmall: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.midTeal },
  liveBadgeText: { fontFamily: FONTS.bold, fontSize: 10, color: colors.midTeal },

  statusBlock: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingBottom: 20 },
  statusIconWrapper: {
    width: 48, height: 48, borderRadius: 16, backgroundColor: colors.surfaceSubtle,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: colors.borderSoft,
  },
  statusTextCol: { flex: 1 },
  statusHeadline: {
    fontFamily: FONTS.extrabold, fontSize: 16, color: colors.textDark,
    letterSpacing: -0.3, marginBottom: 2,
  },
  statusSub: { fontFamily: FONTS.medium, fontSize: 13, color: colors.textMuted },

  activeCardFooter: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    borderTopWidth: 1, borderTopColor: colors.borderSoft,
    backgroundColor: colors.surfaceSubtle,
    borderBottomLeftRadius: 18, borderBottomRightRadius: 18,
  },
  footerLabel: { fontFamily: FONTS.medium, fontSize: 12, color: colors.textMuted },
  footerPrice: { fontFamily: FONTS.black, fontSize: 16, color: colors.textDark },
  
  footerBtn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  footerBtnText: { fontFamily: FONTS.bold, fontSize: 13 },
  btnTeal: { backgroundColor: colors.midTeal },
  btnTealText: { color: '#FFFFFF' },
  btnPurple: { backgroundColor: colors.deepPlum },
  btnPurpleText: { color: '#FFFFFF' },
  btnGray: { backgroundColor: '#0F172A' },
  btnGrayText: { color: '#FFFFFF' },
  btnLightGray: { backgroundColor: colors.borderSoft },
  btnLightGrayText: { color: colors.textDark },

  // ── History Cards ─────────────────────────────────────────────
  historyCard: {
    backgroundColor: colors.surfaceWhite, borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: colors.borderSoft, gap: 10,
    shadowColor: '#0F172A', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.02, shadowRadius: 8, elevation: 1,
  },
  historyCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  historyAvatar: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: colors.bgWarm, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: colors.borderSoft,
  },
  historyAvatarImage: { width: '100%', height: '100%', borderRadius: 11 },
  historyPharmName: { fontFamily: FONTS.bold, fontSize: 14, color: colors.textDark },
  historyMeta: { fontFamily: FONTS.medium, fontSize: 12, color: colors.textMuted, marginTop: 2 },
  doneChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.limeWhisper, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999,
  },
  doneChipText: { fontFamily: FONTS.bold, fontSize: 11, color: colors.midTeal },
  cancelChip: {
    backgroundColor: colors.surfaceSubtle, paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 999, borderWidth: 1, borderColor: colors.borderSoft,
  },
  cancelChipText: { fontFamily: FONTS.bold, fontSize: 11, color: colors.textMuted },
  reorderBtn: {
    alignSelf: 'flex-end', backgroundColor: colors.bgWarm,
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 10, borderWidth: 1, borderColor: colors.borderSoft,
  },
  reorderBtnText: { fontFamily: FONTS.bold, fontSize: 12, color: colors.textDark },

  // ── Empty ─────────────────────────────────────────────────────
  emptyWrap: { alignItems: 'center', paddingTop: 80, gap: 10 },
  emptyTitle: { fontFamily: FONTS.bold, fontSize: 17, color: colors.textDark },
  emptySub: { fontFamily: FONTS.regular, fontSize: 13, color: colors.textMuted, textAlign: 'center' },
});



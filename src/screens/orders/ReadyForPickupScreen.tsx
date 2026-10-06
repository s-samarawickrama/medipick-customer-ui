import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Animated,
  TouchableOpacity, StatusBar, Pressable, Alert
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ChevronLeft, MessageSquare, AlertTriangle, ShieldCheck,
  Star, PhoneCall, Wallet, CreditCard, CheckCircle2, Clock, Check
} from 'lucide-react-native';
import { Button } from '../../components/common/Button';
import { RateExperienceScreen } from '../../components/common/RateExperienceScreen';
import { StripePaymentModal } from '../../components/common/StripePaymentModal';
import { useTheme, ThemeColors } from '../../context/ThemeContext';
import { FONTS } from '../../theme/typography';
import { useOrders } from '../../context/OrderContext';
import { getOrder, Order } from '../../api/ordersApi';
import { MainStackParamList } from '../../navigation/MainNavigator';
import { Loader2 } from 'lucide-react-native';

import { PaymentMethodSelector } from '../../components/common/PaymentMethodSelector';

import { useAuth } from '../../context/AuthContext';

type Nav   = NativeStackNavigationProp<MainStackParamList>;
type Route = RouteProp<MainStackParamList, 'ReadyForPickup'>;

export const ReadyForPickupScreen = () => {
  const { isDark, colors } = useTheme();
  const s = makeStyles(colors);
  const navigation = useNavigation<Nav>();
  const route      = useRoute<Route>();
  
  console.log('[ReadyForPickupScreen] Rendered. route params:', route.params);
  
  const { requestPickupExtension, cancelOrder, completeOrder, addChatMessage } = useOrders();
  
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // We map the backend state to our local UI state PREPARING | READY | COMPLETED
  const [orderState, setOrderState]           = useState<'PREPARING' | 'READY' | 'COMPLETED'>('PREPARING');
  const [prepSecondsLeft, setPrepSecondsLeft] = useState<number>(5);
  const [payMethod, setPayMethod]             = useState<'counter' | 'stripe'>('counter');
  const [isPaidOnline, setIsPaidOnline]       = useState<boolean>(route.params?.isPaidOnline ?? false);
  const [showStripeModal, setShowStripeModal] = useState(false);
  const [showRateModal, setShowRateModal]     = useState(false);

  const opacity   = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.95)).current;

  const [error, setError] = useState<string | null>(null);

  // Fetch exact order from backend
  useEffect(() => {
    let mounted = true;
    const fetchIt = async () => {
      try {
        if (!route.params?.orderId) return;
        const data = await getOrder(route.params.orderId);
        if (mounted) {
          setOrder(data as unknown as Order);
          if (data.state === 'COMPLETED') {
            setOrderState('COMPLETED');
          } else if (data.state === 'READY_FOR_PICKUP') {
            setOrderState('READY');
          }
          if (data.isPaid || data.paymentMethod === 'ONLINE') {
            setIsPaidOnline(true);
          }
        }
      } catch (e: any) {
        console.warn('Failed to get pickup order:', e);
        if (mounted) {
          setError(e.message || 'Failed to load order details.');
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    fetchIt();
    return () => { mounted = false; };
  }, [route.params?.orderId]);

  const handleMockComplete = async () => {
    if (orderState !== 'READY' || !order) return;
    try {
      await completeOrder(order.id);
      setOrderState('COMPLETED');
      Alert.alert(
        "Demo Simulation", 
        "Pharmacist scanned your OTP at the counter. Order is now picked up and completed!",
        [{ text: 'OK', onPress: () => setShowRateModal(true) }]
      );
    } catch (e) {
      console.warn('Failed to complete order:', e);
    }
  };

  // Auto-transition from PREPARING to READY for demonstration
  useEffect(() => {
    StatusBar.setBarStyle('dark-content');
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.spring(cardScale, { toValue: 1, useNativeDriver: true, speed: 20 }),
    ]).start();

    // Prevent starting the PREPARING -> READY interval if we are already READY or COMPLETED
    if (orderState === 'READY' || orderState === 'COMPLETED' || error || !order) return;

    const interval = setInterval(() => {
      setPrepSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          
          // Actually update the backend state so it stops looping permanently!
          const { updateOrderState } = require('../../api/ordersApi');
          updateOrderState(order.id, 'READY_FOR_PICKUP').catch((e: any) => console.warn(e));
          
          // Add automated system notification to the chat!
          addChatMessage(order.id, {
            senderRole: 'SYSTEM',
            senderName: 'MediPick Automated System',
            text: `Your order is Ready for Pick Up at ${order.pharmacy?.name || 'the counter'}! Please show your OTP code: ${order.pickupOtp || '849201'}.`
          });
          
          setOrderState('READY');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [orderState, error, order]);

  const handleCancelOrder = () => {
    Alert.alert(
      'Late Cancellation Warning',
      'You are cancelling an order while the pharmacist is preparing it. Proceeding will add 1 Strike to your account. 3 Strikes will limit your ability to pay at the counter.\n\nDo you want to proceed?',
      [
        { text: 'Keep Order', style: 'cancel' },
        { 
          text: 'Cancel Order (Add Strike)', 
          style: 'destructive',
          onPress: async () => {
            if (!order) return;
            await cancelOrder(order.id);
            // Strikes managed by backend automatically
            Alert.alert('Order Cancelled', 'Your order has been cancelled and 1 Strike has been recorded.', [
              { text: 'OK', onPress: () => navigation.goBack() }
            ]);
          }
        }
      ]
    );
  };

  const handleExtendPickup = async () => {
    if (!order) return;
    await requestPickupExtension(order.id);
    navigation.navigate('PharmacyChat', { orderId: order.id });
  };

  if (isLoading) {
    return (
      <View style={[s.screen, { justifyContent: 'center', alignItems: 'center' }]}>
        <Loader2 color={colors.midTeal} size={32} />
        <Text style={{ marginTop: 12, fontFamily: FONTS.medium, color: colors.textMuted }}>Fetching order status...</Text>
      </View>
    );
  }

  if (error || !order) {
    return (
      <View style={[s.screen, { justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
        <Text style={{ fontFamily: FONTS.bold, color: '#EF4444', fontSize: 16, marginBottom: 8 }}>{error || 'Order not found'}</Text>
        <TouchableOpacity style={{ padding: 12, backgroundColor: colors.midTeal, borderRadius: 8 }} onPress={() => navigation.goBack()}>
          <Text style={{ color: '#fff', fontFamily: FONTS.bold }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const otp = order.pickupOtp ?? '849201';

  return (
    <View style={s.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bgWarm} />
      
      {/* Top Header */}
      <View style={s.topZone}>
        <View style={s.nav}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.75}>
            <ChevronLeft color={colors.textDark} size={20} strokeWidth={2.5} />
          </TouchableOpacity>
          <Text style={s.navTitle}>{orderState === 'PREPARING' ? 'Preparing Order...' : orderState === 'COMPLETED' ? 'Order Picked Up' : 'Ready for Pick Up'}</Text>
          <View style={{ width: 36 }} />
        </View>
      </View>

      <Animated.ScrollView
        style={{ opacity }}
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Live Order Tracker Bar */}
        <View style={s.trackerCard}>
          <View style={s.trackerHeader}>
            <Text style={s.trackerTitle}>Order Tracker</Text>
            {orderState === 'PREPARING' ? (
              <View style={[s.liveBadge, { backgroundColor: '#FEF3C7' }]}>
                <View style={[s.liveDot, { backgroundColor: '#D97706' }]} />
                <Text style={[s.liveText, { color: '#B45309' }]}>Preparing ({prepSecondsLeft}s)</Text>
              </View>
            ) : orderState === 'COMPLETED' ? (
              <View style={[s.liveBadge, { backgroundColor: colors.limeWhisper }]}>
                <View style={[s.liveDot, { backgroundColor: colors.midTeal }]} />
                <Text style={[s.liveText, { color: colors.midTeal }]}>Pickup Completed</Text>
              </View>
            ) : (
              <View style={s.liveBadge}>
                <View style={s.liveDot} />
                <Text style={s.liveText}>Ready for Counter Pickup</Text>
              </View>
            )}
          </View>

          <View style={s.stepperCol}>
            {/* Segment 1: Confirmed -> Preparing */}
             <View style={[
              s.vStepLine, { top: 28 }, 
              (orderState === 'PREPARING' || orderState === 'READY' || orderState === 'COMPLETED') && s.vStepLineDone
            ]} />
            
            {/* Segment 2: Preparing -> Ready */}
            <View style={[
              s.vStepLine, { top: 76 }, 
              (orderState === 'READY' || orderState === 'COMPLETED') && s.vStepLineDone,
              orderState === 'PREPARING' && s.vStepLineActiveToFuture
            ]} />

            {/* Step 1: Confirmed */}
            <View style={s.vStepItem}>
              <View style={[s.vStepDot, s.vStepDotDone]}>
                <Check color={colors.midTeal} size={14} strokeWidth={3} />
              </View>
              <View style={s.vStepTextContainer}>
                <Text style={s.vStepTitleDone}>Order Confirmed</Text>
                <Text style={s.vStepSub}>Your prescription has been accepted</Text>
              </View>
            </View>

            {/* Step 2: Preparing */}
            <View style={s.vStepItem}>
              {orderState === 'PREPARING' ? (
                <View style={[s.vStepDot, s.vStepDotActive]}>
                  <Clock color="#fff" size={14} strokeWidth={2.5} />
                </View>
              ) : (
                <View style={[s.vStepDot, s.vStepDotDone]}>
                  <Check color={colors.midTeal} size={14} strokeWidth={3} />
                </View>
              )}
              <View style={s.vStepTextContainer}>
                <Text style={orderState === 'PREPARING' ? s.vStepTitleActive : s.vStepTitleDone}>Pharmacist Preparing</Text>
                <Text style={s.vStepSub}>Packaging your items safely</Text>
              </View>
            </View>

            {/* Step 3: Ready */}
            <View style={s.vStepItem}>
              {orderState === 'COMPLETED' ? (
                <View style={[s.vStepDot, s.vStepDotDone]}>
                  <Check color={colors.midTeal} size={14} strokeWidth={3} />
                </View>
              ) : orderState === 'READY' ? (
                <View style={[s.vStepDot, s.vStepDotActive]}>
                  <Clock color="#fff" size={14} strokeWidth={2.5} />
                </View>
              ) : (
                <View style={s.vStepDot}>
                  <Clock color="#94A3B8" size={14} strokeWidth={2.5} />
                </View>
              )}
              <View style={s.vStepTextContainer}>
                <Text style={orderState === 'COMPLETED' ? s.vStepTitleDone : orderState === 'READY' ? s.vStepTitleActive : s.vStepTitle}>
                  {orderState === 'COMPLETED' ? 'Picked Up' : 'Ready for Pickup'}
                </Text>
                <Text style={s.vStepSub}>
                  {orderState === 'COMPLETED' ? 'Order completed successfully' : 'Waiting for you at the counter'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Ticket Pass Card */}
        <Animated.View style={[s.ticket, { transform: [{ scale: cardScale }] }]}>
          <View style={s.ticketBadge}>
            <ShieldCheck color={colors.midTeal} size={14} strokeWidth={2.5} />
            <Text style={s.ticketBadgeText}>Order #{order.orderNumber || 'MP123456'}</Text>
          </View>

          {orderState === 'PREPARING' ? (
            <View style={{ alignItems: 'center', paddingVertical: 16, gap: 10 }}>
              <View style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: isDark ? colors.limeWhisper : '#EAF7E7',
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                <Clock color={colors.midTeal} size={22} strokeWidth={2.2} />
              </View>
              <Text style={{ fontFamily: FONTS.black, fontSize: 16, color: colors.textDark, textAlign: 'center' }}>
                Pharmacist is Packaging Your Order
              </Text>
              <Text style={{ fontFamily: FONTS.medium, fontSize: 12, color: colors.textMuted, textAlign: 'center', lineHeight: 18, paddingHorizontal: 10 }}>
                The licensed pharmacy staff is assembling your items. Your 6-digit counter pickup OTP will display automatically once ready (in {prepSecondsLeft}s).
              </Text>
            </View>
          ) : orderState === 'COMPLETED' ? (
            <View style={{ alignItems: 'center', paddingVertical: 16, gap: 10 }}>
              <View style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: isDark ? colors.limeWhisper : '#EAF7E7',
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                <CheckCircle2 color={colors.midTeal} size={22} strokeWidth={2.2} />
              </View>
              <Text style={{ fontFamily: FONTS.black, fontSize: 16, color: colors.textDark, textAlign: 'center' }}>
                Pickup Completed
              </Text>
              <Text style={{ fontFamily: FONTS.medium, fontSize: 12, color: colors.textSecondary, textAlign: 'center', lineHeight: 18, paddingHorizontal: 10 }}>
                Thank you! Your order has been successfully picked up from the pharmacy counter.
              </Text>
            </View>
          ) : (
            <TouchableOpacity 
              activeOpacity={0.9} 
              onPress={handleMockComplete}
              style={{ width: '100%', alignItems: 'center' }}
            >
              <Text style={s.ticketHint}>Show this 6-digit OTP code at pharmacy counter</Text>
              <Text style={{ fontFamily: FONTS.medium, fontSize: 11, color: colors.midTeal, marginTop: 2, marginBottom: 8, opacity: 0.8 }}>(Demo: Tap here to simulate counter scan)</Text>
              {/* 6-Digit OTP */}
              <View style={s.otpContainer}>
                <View style={s.otpRow}>
                  {otp.split('').map((d, i) => (
                    <View key={i} style={[s.otpCell, { backgroundColor: isDark ? colors.limeWhisper : '#EAF7E7', borderColor: isDark ? '#D6EDA0' : '#B7D99A' }]}>
                      <Text style={[s.otpDigit, { color: colors.midTeal }]}>{d}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </TouchableOpacity>
          )}
        </Animated.View>

        {/* Pharmacy Details Box */}
        <View style={s.pharmacyBox}>
          <View style={{ flex: 1 }}>
            <Text style={s.pharmName}>{order.pharmacy?.name || 'MediCare Central Pharmacy'}</Text>
            <Text style={s.pharmSub}>Online · Ready for Pickup</Text>
          </View>

          <View style={s.contactRow}>
            <TouchableOpacity 
              style={s.chatIconBtn} 
              onPress={() => navigation.navigate('PharmacyChat', { orderId: order.id })}
            >
              <MessageSquare color={colors.midTeal} size={18} strokeWidth={2} />
            </TouchableOpacity>

            <TouchableOpacity style={s.callIconBtn}>
              <PhoneCall color={colors.midTeal} size={18} strokeWidth={2} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Payment Method & Actions */}
        {orderState === 'READY' && (
          <>
            {/* Payment Method Selector */}
            <View style={s.paySection}>
              {isPaidOnline ? (
                <View style={s.paidCard}>
                  <CheckCircle2 color={colors.midTeal} size={22} strokeWidth={2.5} />
                  <View style={{ flex: 1 }}>
                    <Text style={s.paidTitle}>Payment Completed</Text>
                    <Text style={s.paidSub}>LKR {order.totalAmount || 500} paid via Stripe Online</Text>
                  </View>
                </View>
              ) : (
                <>
                  <View style={[s.paidCard, { backgroundColor: isDark ? 'rgba(52, 211, 153, 0.1)' : '#F0FDF4', borderColor: isDark ? 'rgba(52, 211, 153, 0.2)' : '#DCFCE7' }]}>
                    <Wallet color={colors.midTeal} size={22} strokeWidth={2.5} />
                    <View style={{ flex: 1 }}>
                      <Text style={s.paidTitle}>Pay at Counter</Text>
                      <Text style={s.paidSub}>Please pay LKR {order.totalAmount || 500} upon pickup</Text>
                    </View>
                  </View>
                  
                  <Button
                    title="Switch to Pay Online"
                    variant="outline"
                    icon={<CreditCard color={colors.midTeal} size={16} strokeWidth={2} />}
                    style={{ marginTop: 12 }}
                    onPress={() => setShowStripeModal(true)}
                  />
                </>
              )}
            </View>

            {/* Actions for READY state */}
            {isPaidOnline ? (
              <Button
                title="Request Time Extension"
                variant="secondary"
                onPress={handleExtendPickup}
                style={{ marginTop: 12 }}
              />
            ) : (
              <Text style={{ textAlign: 'center', marginTop: 12, marginBottom: 12, fontSize: 12, color: colors.textMuted, paddingHorizontal: 10 }}>
                Cannot extend pickup time automatically for unpaid orders. Message the pharmacy to request an extension.
              </Text>
            )}
          </>
        )}

        {/* Mock Completion Demo Button */}
        {orderState === 'READY' && (
          <Button
            title="Simulate Pickup at Counter (Demo)"
            variant="primary"
            style={{ marginTop: 12, backgroundColor: colors.textDark }}
            onPress={handleMockComplete}
          />
        )}

        {/* Rate Experience (Completed Screen Primary CTA) */}
        {orderState === 'COMPLETED' && !order.rating && (
          <Button
            title="Rate Experience"
            variant="primary"
            icon={<Star color="#fff" size={16} strokeWidth={2.5} />}
            onPress={() => setShowRateModal(true)}
            style={{ marginTop: 12 }}
          />
        )}
        
        {/* Submitted Rating Display */}
        {orderState === 'COMPLETED' && order.rating && (
          <View style={{ marginTop: 12, padding: 16, backgroundColor: colors.surfaceWhite, borderRadius: 12, borderWidth: 1, borderColor: colors.borderSoft }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Star color="#F59E0B" fill="#F59E0B" size={18} />
              <Text style={{ fontFamily: FONTS.bold, fontSize: 16, color: colors.textDark, marginLeft: 8 }}>
                {order.rating.overall} / 5
              </Text>
              <Text style={{ fontFamily: FONTS.medium, fontSize: 13, color: colors.midTeal, marginLeft: 'auto' }}>
                Thank you for rating!
              </Text>
            </View>
            {order.rating.comment ? (
              <Text style={{ fontFamily: FONTS.regular, fontSize: 13, color: colors.textSecondary }}>
                "{order.rating.comment}"
              </Text>
            ) : null}
          </View>
        )}

        {/* Cancel Order (Only if preparing or ready) */}
        {(orderState === 'PREPARING' || orderState === 'READY') && (
          <Button
            title="Cancel Order"
            variant="ghost"
            onPress={handleCancelOrder}
            textStyle={{ color: colors.error }}
            style={{ marginTop: 24 }}
          />
        )}
      </Animated.ScrollView>

      {/* Rating Modal */}
      <RateExperienceScreen
        visible={showRateModal}
        onClose={() => {
          setShowRateModal(false);
          // Navigate to Orders list, explicitly opening the 'Completed' tab
          navigation.navigate('Tabs', { screen: 'Orders', params: { initialTab: 'completed' } });
        }}
        pharmacyName={order.pharmacy?.name || 'MediCare Central Pharmacy'}
        orderId={order.id}
      />

      {/* Stripe Payment Modal */}
      <StripePaymentModal
        visible={showStripeModal}
        amount={order.totalAmount || 500}
        onClose={() => setShowStripeModal(false)}
        onSuccess={async () => {
          setShowStripeModal(false);
          setIsPaidOnline(true);
          try {
            const { updatePaymentMethod } = require('../../api/ordersApi');
            await updatePaymentMethod(order.id, 'ONLINE');
          } catch(e) {}
        }}
      />
    </View>
  );
};

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgWarm },
  topZone: {
    paddingTop: 52, paddingBottom: 12, paddingHorizontal: 20,
    backgroundColor: colors.bgWarm,
    borderBottomWidth: 1, borderBottomColor: colors.borderSoft,
  },
  nav: { flexDirection: 'row', alignItems: 'center' },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: colors.surfaceWhite,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: colors.borderSoft,
  },
  navTitle: { flex: 1, textAlign: 'center', fontFamily: FONTS.black, fontSize: 18, color: colors.textDark },
  scroll: { padding: 20, paddingBottom: 60, gap: 14 },

  ticket: {
    backgroundColor: colors.surfaceWhite, borderRadius: 20, padding: 20,
    borderWidth: 1.5, borderColor: colors.borderSoft, gap: 14, alignItems: 'center',
    shadowColor: '#0F172A', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04, shadowRadius: 14, elevation: 3,
  },
  ticketBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.limeWhisper, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999,
  },
  ticketBadgeText: { fontFamily: FONTS.bold, fontSize: 12, color: colors.midTeal },
  ticketHint: { fontFamily: FONTS.medium, fontSize: 13, color: colors.textMuted, textAlign: 'center' },

  otpContainer: { width: '100%', alignItems: 'center' },
  otpRow: { flexDirection: 'row', gap: 8, justifyContent: 'center' },
  otpCell: {
    width: 44, height: 50, borderRadius: 12,
    backgroundColor: colors.limeWhisper, borderWidth: 1.5, borderColor: '#D6EDA0',
    justifyContent: 'center', alignItems: 'center',
  },
  otpDigit: { fontFamily: FONTS.black, fontSize: 22, color: colors.midTeal },

  pharmacyBox: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.surfaceWhite, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: colors.borderSoft, gap: 12,
  },
  pharmName: { fontFamily: FONTS.bold, fontSize: 14, color: colors.textDark },
  pharmSub: { fontFamily: FONTS.medium, fontSize: 12, color: colors.textMuted, marginTop: 2 },
  contactRow: { flexDirection: 'row', gap: 8 },
  chatIconBtn: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: colors.limeWhisper, justifyContent: 'center', alignItems: 'center',
  },
  callIconBtn: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: colors.midTealLight, justifyContent: 'center', alignItems: 'center',
  },

  // Payment section
  paySection: { gap: 10 },
  paySectionTitle: { fontFamily: FONTS.bold, fontSize: 14, color: colors.textDark },
  payOption: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.surfaceWhite, borderRadius: 14, padding: 14,
    borderWidth: 1.5, borderColor: colors.borderSoft,
  },
  payOptionSelected: { borderColor: colors.midTeal, backgroundColor: colors.midTealLight },
  payOptionTitle: { fontFamily: FONTS.bold, fontSize: 14, color: colors.textDark },
  payOptionSub: { fontFamily: FONTS.regular, fontSize: 11, color: colors.textMuted, marginTop: 1 },
  radioDot: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: colors.borderSoft, backgroundColor: colors.surfaceWhite,
  },
  radioDotSelected: { borderColor: colors.midTeal, backgroundColor: colors.midTeal },

  paidCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.limeWhisper, borderRadius: 14, padding: 14,
    borderWidth: 1.5, borderColor: '#D6EDA0',
  },
  paidTitle: { fontFamily: FONTS.bold, fontSize: 14, color: colors.midTeal },
  paidSub: { fontFamily: FONTS.medium, fontSize: 12, color: colors.textDark, marginTop: 2 },

  // Tracker Card
  trackerCard: {
    backgroundColor: colors.surfaceWhite, borderRadius: 18, padding: 16,
    borderWidth: 1.5, borderColor: colors.borderSoft, gap: 14,
  },
  trackerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  trackerTitle: { fontFamily: FONTS.bold, fontSize: 14, color: colors.textDark },
  liveBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.limeWhisper, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
  },
  liveDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: colors.midTeal },
  liveText: { fontFamily: FONTS.bold, fontSize: 11, color: colors.midTeal },

  stepperCol: { position: 'relative', marginTop: 10, gap: 20 },
  vStepLine: { position: 'absolute', left: 13, width: 2, height: 20, backgroundColor: '#F1F5F9' },
  vStepLineDone: { backgroundColor: colors.limeWhisper },
  vStepLineActiveToFuture: { 
    borderStyle: 'dashed', borderWidth: 1, borderColor: '#CBD5E1', 
    backgroundColor: 'transparent', width: 1, left: 13.5
  },
  
  vStepItem: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  vStepDot: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: '#F1F5F9', // light gray for future
    justifyContent: 'center', alignItems: 'center', zIndex: 2,
  },
  vStepDotDone: { backgroundColor: colors.limeWhisper },
  vStepDotActive: { backgroundColor: colors.midTeal },

  vStepTextContainer: { flex: 1, justifyContent: 'center' },
  vStepTitle: { fontFamily: FONTS.medium, fontSize: 13, color: colors.textMuted },
  vStepTitleDone: { fontFamily: FONTS.bold, fontSize: 13, color: colors.textDark },
  vStepTitleActive: { fontFamily: FONTS.bold, fontSize: 14, color: colors.midTeal },
  vStepSub: { fontFamily: FONTS.regular, fontSize: 11, color: colors.textMuted, marginTop: 2 },
});

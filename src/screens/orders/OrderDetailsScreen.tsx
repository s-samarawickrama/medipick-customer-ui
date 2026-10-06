import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated, TouchableOpacity, StatusBar, Image, Platform, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChevronLeft, MapPin, Receipt, ShieldCheck, CheckCircle2, XCircle, Clock, ChevronRight, FileText, Plus, Phone, MessageCircle, Star } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme, ThemeColors } from '../../context/ThemeContext';
import { FONTS } from '../../theme/typography';
import { useAuth } from '../../context/AuthContext';
import { useOrders } from '../../context/OrderContext';
import { useCart } from '../../context/CartContext';

import { MainStackParamList } from '../../navigation/MainNavigator';
import { Button } from '../../components/common/Button';
import { updateOrderState } from '../../api/ordersApi';
import { RateExperienceScreen } from '../../components/common/RateExperienceScreen';
import { AlertTriangle } from 'lucide-react-native';

type Nav = NativeStackNavigationProp<MainStackParamList>;
type Route = RouteProp<MainStackParamList, 'OrderDetails'>;

const showAlert = (title: string, message: string, buttons?: any[]) => {
  if (Platform.OS === 'web') {
    if (buttons && buttons.length > 1) {
       const destructive = buttons.find(b => b.style === 'destructive');
       if (destructive && destructive.onPress) {
         if (window.confirm(`${title}\n\n${message}`)) {
           destructive.onPress();
         }
       }
    } else {
      window.alert(`${title}\n\n${message}`);
    }
  } else {
    // @ts-ignore - dynamic require for native Alert
    const { Alert } = require('react-native');
    Alert.alert(title, message, buttons);
  }
};

export const OrderDetailsScreen = () => {
  const { isDark, colors } = useTheme();
  const s = makeStyles(colors);
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const opacity = useRef(new Animated.Value(0)).current;
  const { orders, cancelOrder, updatePaymentMethodContext, fetchOrders } = useOrders();
  const [showRateModal, setShowRateModal] = useState(false);

  const orderId = route.params?.orderId;
  const order = orders.find((o) => o.id === orderId) ?? orders[0];

  useEffect(() => {
    StatusBar.setBarStyle('dark-content');
    Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }).start();
  }, []);

  const isCompleted = order.state === 'COMPLETED';
  const isCancelled = ['CANCELLED', 'CLOSED', 'REJECTED'].includes(order.state);
  const isReupload  = order.state === 'REUPLOAD_REQUESTED';
  const isQuote     = order.state === 'WAITING_CUSTOMER_CONFIRMATION';
  const isRecentCompleted = isCompleted && !order.refundStatus && !order.rejectReason && new Date(order.createdAt).getTime() > Date.now() - 24 * 3600 * 1000;
  const isActive = !isCompleted && !isCancelled;
  const isIssue = order.state === 'ISSUE_REPORTED' || order.state === 'UNDER_REVIEW';

  useEffect(() => {
    // If the order enters the quote review phase, redirect to the QuotationScreen automatically
    // so the user doesn't have to click an extra button.
    if (isQuote) {
      navigation.replace('Quotation', { orderId: order.id });
    }
  }, [isQuote, order.id, navigation]);

  const { processReorder } = useCart();

  const handleReorder = () => {
    if (!order) return;
    if (order.pharmacy && order.pharmacy.isOpen === false) {
      showAlert('Pharmacy Closed', 'This pharmacy is currently closed. Please try again later.');
      return;
    }

    const validItems: any[] = [];
    let hasOutOfStock = false;

    if (order.items && order.items.length > 0) {
      order.items.forEach((oi) => {
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
    if (order.prescriptionUri) {
      attachedRx = {
        image: order.prescriptionUri,
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
      showAlert('Items Out of Stock', 'Some items from this order are currently out of stock and could not be added.');
    }

    processReorder(validItems, attachedRx);
    navigation.navigate('Tabs', { screen: 'Cart' });
  };

  const handleCancelOrder = () => {
    if (['PREPARING', 'READY_FOR_PICKUP'].includes(order.state)) {
      showAlert(
        'Late Cancellation Warning',
        'You are cancelling an order after the pharmacy has already accepted and started processing it. Proceeding will add 1 Strike to your account. 3 Strikes will limit your ability to pay at the counter.\n\nDo you want to proceed?',
        [
          { text: 'Keep Order', style: 'cancel' },
          { 
            text: 'Cancel Order (Add Strike)', 
            style: 'destructive',
            onPress: () => {
              if (order) cancelOrder(order.id);
              // Strikes are managed by backend automatically when cancellation rules apply
              showAlert('Order Cancelled', 'Your order has been cancelled and 1 Strike has been recorded.');
              navigation.goBack();
            }
          }
        ]
      );
    } else {
      // Normal cancellation
      showAlert(
        'Cancel Order',
        'Are you sure you want to cancel this order? No strike will be recorded.',
        [
          { text: 'No', style: 'cancel' },
          { 
            text: 'Yes, Cancel', 
            style: 'destructive',
            onPress: () => {
              if (order) cancelOrder(order.id);
              showAlert('Order Cancelled', 'Your order was successfully cancelled.');
              navigation.goBack();
            }
          }
        ]
      );
    }
  };

  const handleTogglePaymentMethod = async () => {
    try {
      const newMethod = order.paymentMethod === 'ONLINE' ? 'PAY_AT_COUNTER' : 'ONLINE';
      await updatePaymentMethodContext(order.id, newMethod);
      showAlert('Success', `Payment method changed to ${newMethod === 'ONLINE' ? 'Pay Online' : 'Pay at Pharmacy'}`);
    } catch (e: any) {
      showAlert('Error', e?.response?.data?.message || 'Failed to update payment method.');
    }
  };

  return (
    <View style={s.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bgWarm} />
      
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.75}>
          <ChevronLeft color={colors.textDark} size={20} strokeWidth={2.5} />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={s.headerTitle}>Order {order.orderNumber}</Text>
          <View style={s.statusTag}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: isCompleted ? colors.midTeal : isCancelled ? '#EF4444' : colors.midTeal }} />
            <Text style={s.statusTagText}>
              {isCompleted ? 'Completed' : isCancelled ? 'Declined' : 'Live'}
            </Text>
          </View>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <Animated.ScrollView
        style={{ flex: 1, opacity }}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Issue Reported Banner */}
        {isIssue && (
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 12,
            backgroundColor: colors.errorLight, borderRadius: 16, padding: 14,
            borderWidth: 1, borderColor: colors.error, marginBottom: 16,
          }}>
            <AlertTriangle color={colors.error} size={24} strokeWidth={2} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: FONTS.bold, fontSize: 13, color: colors.error }}>
                Issue Reported
              </Text>
              <Text style={{ fontFamily: FONTS.medium, fontSize: 11, color: colors.textSecondary, marginTop: 1, opacity: 0.9 }}>
                The pharmacy is reviewing your issue and will respond shortly via chat.
              </Text>
            </View>
          </View>
        )}

        {/* Rejection / Reupload / Refund Banner */}
        {(isCancelled || isReupload || order.rejectReason || order.refundStatus) && (
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 12,
            backgroundColor: (isCancelled || order.rejectReason) ? colors.errorLight : colors.surfaceWhite,
            borderRadius: 16, padding: 14,
            borderWidth: 1, borderColor: (isCancelled || order.rejectReason) ? colors.error : colors.borderSoft,
            marginBottom: 16,
          }}>
            <FileText color={(isCancelled || order.rejectReason) ? colors.error : colors.midTeal} size={24} strokeWidth={2} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: FONTS.bold, fontSize: 13, color: (isCancelled || order.rejectReason) ? colors.error : colors.textDark }}>
                {isReupload ? 'Action Required: Image Unclear' : order.refundStatus === 'REFUNDED' ? 'Refund Issued' : order.rejectReason ? 'Refund Request Declined' : 'Order Declined'}
              </Text>
              <Text style={{ fontFamily: FONTS.medium, fontSize: 11, color: colors.textSecondary, marginTop: 1, opacity: 0.9 }}>
                {isReupload && <Text style={{ color: colors.error, fontFamily: FONTS.bold }}>23h 59m remaining to re-upload. </Text>}
                {order.rejectReason || (order.refundStatus === 'REFUNDED' ? 'The pharmacy has reviewed your issue and processed a full refund.' : '')}
              </Text>
            </View>
            {isReupload && (
              <TouchableOpacity
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 4,
                  backgroundColor: colors.error, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
                }}
                onPress={() => navigation.navigate('UploadPrescription', { pharmacyId: order.pharmacy?.id, pharmacyName: order.pharmacy?.name })}
              >
                <Plus color="#FFF" size={14} strokeWidth={3} />
                <Text style={{ fontFamily: FONTS.bold, fontSize: 12, color: '#FFFFFF' }}>Re-upload</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Confirm Quote Banner */}
        {isQuote && (
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 12,
            backgroundColor: isDark ? colors.plumLight : '#EDE7F6',
            borderRadius: 16, padding: 14,
            borderWidth: 1, borderColor: isDark ? colors.deepPlum : '#D7C6E9', marginBottom: 16,
          }}>
            <Clock color={isDark ? '#F5D6FF' : colors.deepPlum} size={24} strokeWidth={2} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: FONTS.bold, fontSize: 13, color: isDark ? '#E9D5FF' : colors.deepPlum }}>Quote Ready for Review</Text>
              <Text style={{ fontFamily: FONTS.medium, fontSize: 11, color: isDark ? '#D8B4E2' : colors.textSecondary, marginTop: 1, opacity: 0.9 }}>
                <Text style={{ color: isDark ? colors.warning : '#B45309', fontFamily: FONTS.bold }}>23h 59m remaining </Text>
                to confirm before auto-cancellation.
              </Text>
            </View>
          </View>
        )}





        {/* Pharmacy Info */}
        <TouchableOpacity 
          style={s.card} 
          activeOpacity={0.7}
          onPress={() => {
            if (order.pharmacy?.id) {
              navigation.navigate('Tabs', { 
                screen: 'Browse', 
                params: { initialMode: 'pharmacies', storeId: order.pharmacy.id } 
              });
            }
          }}
        >
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Pharmacy</Text>
          </View>
          <View style={s.pharmacyRow}>
            {order.pharmacy?.image ? (
              <Image source={typeof order.pharmacy.image === 'string' ? { uri: order.pharmacy.image } : order.pharmacy.image} style={s.pharmAvatar} />
            ) : (
              <View style={[s.pharmAvatar, { backgroundColor: colors.limeWhisper }]} />
            )}
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={s.pharmName}>{order.pharmacy?.name}</Text>
                <ShieldCheck color={colors.midTeal} size={13} strokeWidth={2.5} />
              </View>
              <Text style={s.pharmAddress}>{order.pharmacy?.address}</Text>
            </View>
            {isActive ? (
              <View style={{ flexDirection: 'row', gap: 8, marginRight: 4 }}>
                <TouchableOpacity 
                  style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.limeWhisper, justifyContent: 'center', alignItems: 'center' }}
                  onPress={(e) => { e.stopPropagation(); showAlert('Call', 'Calling pharmacy...'); }}
                >
                  <Phone color={colors.midTeal} size={16} strokeWidth={2.5} />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.limeWhisper, justifyContent: 'center', alignItems: 'center' }}
                  onPress={(e) => { e.stopPropagation(); showAlert('Chat', 'Opening chat...'); }}
                >
                  <MessageCircle color={colors.midTeal} size={16} strokeWidth={2.5} />
                </TouchableOpacity>
              </View>
            ) : (
              <ChevronRight color={colors.borderSoft} size={20} />
            )}
          </View>
        </TouchableOpacity>

        {/* Prescription Images (if applicable) */}
        {(order.orderType === 'PRESCRIPTION' || order.orderType === 'MIXED') && (
          <View style={s.card}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>Uploaded Prescriptions</Text>
            </View>
            <View style={s.prescriptionGrid}>
              <TouchableOpacity 
                style={s.prescriptionPlaceholder}
                activeOpacity={0.7}
                onPress={() => showAlert('Prescription', 'Opening high-res prescription image viewer...')}
              >
                <FileText color={colors.midTeal} size={28} style={{ opacity: 0.5 }} />
                <Text style={s.prescriptionPlaceholderText}>Page 1</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={s.prescriptionPlaceholder}
                activeOpacity={0.7}
                onPress={() => showAlert('Prescription', 'Opening high-res prescription image viewer...')}
              >
                <FileText color={colors.midTeal} size={28} style={{ opacity: 0.5 }} />
                <Text style={s.prescriptionPlaceholderText}>Page 2</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Order Items */}
        <View style={s.card}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Order Items</Text>
          </View>
          <View style={s.itemsList}>
            {order.items && order.items.length > 0 ? (
              order.items.map((item, index) => (
                <View key={index} style={s.itemRow}>
                  <View style={s.itemQtyBox}>
                    <Text style={s.itemQty}>{item.quantity}x</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.itemName}>{item.medicine.name}</Text>
                    {item.medicine.genericName && (
                      <Text style={s.itemSub}>{item.medicine.genericName}</Text>
                    )}
                    {item.isSubstitute && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                        <View style={{ paddingHorizontal: 6, paddingVertical: 2, backgroundColor: colors.limeWhisper, borderRadius: 4, borderWidth: 1, borderColor: '#D6EDA0' }}>
                          <Text style={{ fontFamily: FONTS.bold, fontSize: 10, color: colors.midTeal }}>Generic Substitute</Text>
                        </View>
                        {item.originalPrescribed && (
                          <Text style={{ fontFamily: FONTS.medium, fontSize: 10, color: colors.textMuted }}>
                            for {item.originalPrescribed}
                          </Text>
                        )}
                      </View>
                    )}
                  </View>
                  <Text style={s.itemPrice}>LKR {item.price * item.quantity}</Text>
                </View>
              ))
            ) : (
              <Text style={s.noItemsText}>Prescription-only order or items not listed.</Text>
            )}
          </View>

          {order.allowGenericSubstitutions && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, padding: 12, backgroundColor: isDark ? colors.plumLight : colors.limeWhisper, borderRadius: 8 }}>
              <CheckCircle2 color={colors.midTeal} size={16} strokeWidth={2.5} />
              <Text style={{ fontFamily: FONTS.medium, fontSize: 12, color: colors.textDark }}>
                Generic substitutions allowed by you
              </Text>
            </View>
          )}

          {/* Totals - Hide during quoting phase to avoid confusion */}
          {!isQuote && order.state !== 'WAITING_PHARMACY_CONFIRMATION' && (
            <>
              <View style={s.totalsDivider} />
              <View style={s.totalsRow}>
                <Text style={s.totalsLabel}>Subtotal</Text>
                <Text style={s.totalsValue}>LKR {order.totalMrp}</Text>
              </View>
              <View style={s.totalsRow}>
                <Text style={s.totalsLabel}>Discount</Text>
                <Text style={[s.totalsValue, { color: colors.midTeal }]}>- LKR {order.totalMrp - order.totalAmount}</Text>
              </View>
              <View style={[s.totalsRow, { marginTop: 12 }]}>
                <Text style={s.grandTotalLabel}>Total {order.isPaid ? 'Paid' : 'Amount'}</Text>
                <Text style={s.grandTotalValue}>LKR {order.totalAmount}</Text>
              </View>

              {/* Payment Method Section */}
              <View style={s.totalsDivider} />
              <View style={s.totalsRow}>
                <Text style={s.totalsLabel}>Payment Method</Text>
                <Text style={[s.totalsValue, { color: colors.midTealDark }]}>
                  {order.paymentMethod === 'ONLINE' ? 'Pay Online' : 'Pay at Pharmacy'}
                </Text>
              </View>
              
              {!order.isPaid && isActive && (
                <View style={{ marginTop: 12, gap: 8 }}>
                  {order.paymentMethod === 'ONLINE' && (
                    <Button 
                      title="Pay Now" 
                      variant="primary" 
                      onPress={() => showAlert('Pay Now', 'Redirecting to payment gateway...')} 
                    />
                  )}
                  <Button 
                    title={order.paymentMethod === 'ONLINE' ? "Switch to Pay at Pharmacy" : "Switch to Pay Online"} 
                    variant="secondary" 
                    onPress={handleTogglePaymentMethod} 
                  />
                </View>
              )}
            </>
          )}

        </View>

        {/* Rating Section */}
        {isCompleted && (
          <View style={s.card}>
            <View style={[s.sectionHeader, { marginBottom: 8 }]}>
              <Text style={s.sectionTitle}>Your Rating</Text>
            </View>
            {order.rating ? (
              <View style={{ gap: 12 }}>
                {/* Overall Rating & Comment */}
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                  <View style={{ flexDirection: 'row', gap: 4, marginTop: 2 }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        color={star <= (order.rating?.overall ?? 0) ? '#F59E0B' : colors.borderSoft}
                        fill={star <= (order.rating?.overall ?? 0) ? '#F59E0B' : 'transparent'}
                        size={18}
                        strokeWidth={2}
                      />
                    ))}
                  </View>
                  {order.rating.comment && (
                    <Text style={{ fontFamily: FONTS.medium, fontSize: 13, color: colors.textSecondary, flex: 1, lineHeight: 20 }}>
                      "{order.rating.comment}"
                    </Text>
                  )}
                </View>

                {/* Sub Ratings (if they exist) */}
                {order.rating.service !== undefined && (
                  <View style={{ marginTop: 8, padding: 12, backgroundColor: colors.surfaceSubtle, borderRadius: 8, gap: 8 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ fontFamily: FONTS.regular, fontSize: 13, color: colors.textSecondary }}>Pharmacy Service</Text>
                      <View style={{ flexDirection: 'row', gap: 2 }}>
                        {[1, 2, 3, 4, 5].map((s) => <Star key={s} size={12} fill={s <= order.rating!.service ? '#F59E0B' : 'transparent'} color={s <= order.rating!.service ? '#F59E0B' : colors.borderSoft} />)}
                      </View>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ fontFamily: FONTS.regular, fontSize: 13, color: colors.textSecondary }}>Product Availability</Text>
                      <View style={{ flexDirection: 'row', gap: 2 }}>
                        {[1, 2, 3, 4, 5].map((s) => <Star key={s} size={12} fill={s <= order.rating!.availability ? '#F59E0B' : 'transparent'} color={s <= order.rating!.availability ? '#F59E0B' : colors.borderSoft} />)}
                      </View>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ fontFamily: FONTS.regular, fontSize: 13, color: colors.textSecondary }}>Counter Pick-up</Text>
                      <View style={{ flexDirection: 'row', gap: 2 }}>
                        {[1, 2, 3, 4, 5].map((s) => <Star key={s} size={12} fill={s <= order.rating!.pickup ? '#F59E0B' : 'transparent'} color={s <= order.rating!.pickup ? '#F59E0B' : colors.borderSoft} />)}
                      </View>
                    </View>
                  </View>
                )}
              </View>
            ) : (
              <Button 
                title="Rate Your Experience" 
                variant="secondary" 
                icon={<Star color={colors.midTeal} size={16} />}
                onPress={() => setShowRateModal(true)} 
              />
            )}
          </View>
        )}

        {/* Actions */}
        <View style={s.actionsWrapper}>
          {isActive ? (
            <>
              {order.state === 'WAITING_PHARMACY_CONFIRMATION' ? (
                <TouchableOpacity 
                  style={{ backgroundColor: colors.bgWarm, padding: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 12, borderWidth: 1, borderColor: colors.borderSubtle, flexDirection: 'row', gap: 12 }}
                  onPress={async () => {
                    try {
                      await updateOrderState(order.id, 'WAITING_CUSTOMER_CONFIRMATION');
                      await fetchOrders();
                    } catch (e) {
                      console.error("Failed to simulate pharmacy quote:", e);
                    }
                  }}
                  activeOpacity={0.8}
                >
                  <ActivityIndicator size="small" color={colors.midTeal} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.textDark, fontFamily: FONTS.semiBold, fontSize: 14 }}>Pharmacy is Preparing Quote</Text>
                    <Text style={{ color: colors.textMuted, fontFamily: FONTS.regular, fontSize: 12, marginTop: 2 }}>You will be notified once the price is ready.</Text>
                  </View>
                </TouchableOpacity>
              ) : isIssue ? (
                <Button 
                  title="Message Pharmacy"
                  variant="primary" 
                  onPress={() => navigation.navigate('PharmacyChat', { orderId: order.id })} 
                  style={{ backgroundColor: '#EF4444' }}
                />
              ) : (
                <Button 
                  title={order.state === 'WAITING_CUSTOMER_CONFIRMATION' ? "Review Quotation" : "Track Order Status"}
                  variant="primary" 
                  onPress={() => {
                    if (order.state === 'WAITING_CUSTOMER_CONFIRMATION') {
                      navigation.navigate('Quotation', { orderId: order.id });
                    } else {
                      navigation.navigate('ReadyForPickup', { orderId: order.id });
                    }
                  }} 
                />
              )}
              
              {!isIssue && (
                <Button
                  title="Cancel Order"
                  variant="ghost"
                  onPress={handleCancelOrder}
                  textStyle={{ color: colors.error }}
                  style={{ marginTop: 12 }}
                />
              )}
            </>
          ) : isCompleted ? (
            <>
              <Button title="Reorder Items" variant="primary" onPress={handleReorder} />
              {isRecentCompleted && (
                <Button
                  title="Report an Issue"
                  variant="ghost"
                  onPress={() => navigation.navigate('ReportIssue', { orderId: order.id })}
                  textStyle={{ color: colors.error }}
                  style={{ marginTop: 8 }}
                />
              )}
            </>
          ) : null}
        </View>

      </Animated.ScrollView>

      {/* Rating Modal */}
      <RateExperienceScreen
        visible={showRateModal}
        onClose={() => setShowRateModal(false)}
        pharmacyName={order.pharmacy?.name || 'MediCare Central Pharmacy'}
        orderId={order.id}
      />
    </View>
  );
};

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgWarm },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 52, paddingBottom: 14, paddingHorizontal: 20,
    backgroundColor: colors.bgWarm, borderBottomWidth: 1, borderBottomColor: colors.borderSoft,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: colors.surfaceWhite,
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.borderSoft,
  },
  headerCenter: { alignItems: 'center', gap: 4 },
  headerTitle: { fontFamily: FONTS.black, fontSize: 16, color: colors.textDark },
  statusTag: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 100, backgroundColor: colors.surfaceSubtle, flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusTagCompleted: {},
  statusTagCancelled: {},
  statusTagActive: {},
  statusTagText: { fontFamily: FONTS.bold, fontSize: 13, color: colors.midTealDark },

  scrollContent: { padding: 16, paddingBottom: 60, gap: 16 },

  card: {
    backgroundColor: colors.surfaceWhite, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: colors.borderSoft,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  sectionTitle: { fontFamily: FONTS.bold, fontSize: 15, color: colors.textDark },

  pharmacyRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pharmAvatar: { width: 50, height: 50, borderRadius: 12 },
  pharmName: { fontFamily: FONTS.bold, fontSize: 16, color: colors.textDark },
  pharmAddress: { fontFamily: FONTS.medium, fontSize: 13, color: colors.textMuted, marginTop: 2 },

  prescriptionGrid: { flexDirection: 'row', gap: 12 },
  prescriptionPlaceholder: {
    width: 80, height: 100, borderRadius: 12, backgroundColor: colors.limeWhisper,
    borderWidth: 1, borderColor: colors.borderSoft, overflow: 'hidden',
    justifyContent: 'center', alignItems: 'center', gap: 8,
  },
  prescriptionPlaceholderText: { fontFamily: FONTS.bold, fontSize: 11, color: colors.midTeal },

  itemsList: { gap: 16 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  itemQtyBox: {
    width: 32, height: 32, borderRadius: 8, backgroundColor: colors.limeWhisper,
    justifyContent: 'center', alignItems: 'center',
  },
  itemQty: { fontFamily: FONTS.black, fontSize: 13, color: colors.midTeal },
  itemName: { fontFamily: FONTS.bold, fontSize: 14, color: colors.textDark },
  itemSub: { fontFamily: FONTS.medium, fontSize: 12, color: colors.textMuted },
  itemPrice: { fontFamily: FONTS.black, fontSize: 14, color: colors.textDark },
  noItemsText: { fontFamily: FONTS.medium, fontSize: 13, color: colors.textMuted, fontStyle: 'italic' },

  totalsDivider: { height: 1, backgroundColor: colors.borderSoft, marginVertical: 16 },
  totalsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  totalsLabel: { fontFamily: FONTS.medium, fontSize: 13, color: colors.textMuted },
  totalsValue: { fontFamily: FONTS.bold, fontSize: 13, color: colors.textDark },
  grandTotalLabel: { fontFamily: FONTS.black, fontSize: 15, color: colors.textDark },
  grandTotalValue: { fontFamily: FONTS.black, fontSize: 18, color: colors.midTeal },

  actionsWrapper: { marginTop: 10, gap: 10 },
});

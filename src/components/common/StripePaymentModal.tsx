import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  TextInput, ActivityIndicator, Pressable, ScrollView,
  KeyboardAvoidingView, Platform
} from 'react-native';
import { X, CreditCard, Lock, CheckCircle2, ShieldCheck, Check } from 'lucide-react-native';
import { useTheme, ThemeColors } from '../../context/ThemeContext';
import { FONTS } from '../../theme/typography';

interface StripePaymentModalProps {
  visible: boolean;
  amount: number;
  onClose: () => void;
  onSuccess: () => void;
}

export const StripePaymentModal: React.FC<StripePaymentModalProps> = ({
  visible,
  amount,
  onClose,
  onSuccess,
}) => {
  const { colors } = useTheme();
  const s = makeStyles(colors);
  const [cardNumber, setCardNumber]   = useState('4242 4242 4242 4242');
  const [expiry, setExpiry]           = useState('12 / 28');
  const [cvc, setCvc]                 = useState('123');
  const [postalCode, setPostalCode]   = useState('00300');
  const [saveLink, setSaveLink]       = useState(true);
  const [loading, setLoading]         = useState(false);
  const [isSuccess, setIsSuccess]     = useState(false);

  const handlePay = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onSuccess();
      }, 1200);
    }, 1400);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={[s.overlay, Platform.OS === 'web' && { height: '100vh', width: '100vw', position: 'fixed', top: 0, left: 0, zIndex: 9999 } as any]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Pressable style={{ flex: 1, height: '100%', width: '100%', position: 'absolute' }} onPress={onClose} />
        <Pressable style={s.sheet} onPress={(e) => e.stopPropagation()}>
          {/* Top Bar */}
          <View style={s.topBar}>
            <View style={s.stripeBranding}>
              <Text style={s.stripeBrandText}>Powered by </Text>
              <Text style={s.stripeLogoText}>stripe</Text>
            </View>
            <TouchableOpacity style={s.closeBtn} onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X color={colors.textMuted} size={18} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          {isSuccess ? (
            <View style={s.successBox}>
              <View style={s.successIconCircle}>
                <Check color="#FFFFFF" size={28} strokeWidth={3.5} />
              </View>
              <Text style={s.successTitle}>Payment Complete</Text>
              <Text style={s.successSub}>LKR {amount.toLocaleString()} paid via Stripe</Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
              {/* Order Summary Line */}
              <View style={s.amountRow}>
                <Text style={s.payToText}>MediCare Central Pharmacy</Text>
                <Text style={s.amountText}>LKR {amount.toLocaleString()}.00</Text>
              </View>

              {/* Express Checkout (Apple Pay / GPay) */}
              <TouchableOpacity style={s.expressBtn} onPress={handlePay} activeOpacity={0.88}>
                <Text style={s.expressText}>Pay with </Text>
                <Text style={s.appleLogo}>Pay</Text>
              </TouchableOpacity>

              <View style={s.dividerRow}>
                <View style={s.dividerLine} />
                <Text style={s.dividerText}>Or pay with card</Text>
                <View style={s.dividerLine} />
              </View>

              {/* Official Stripe Unified Card Field */}
              <View style={s.stripeCardBox}>
                {/* Card Number */}
                <View style={s.cardInputRow}>
                  <TextInput
                    style={s.cardNumberInput}
                    value={cardNumber}
                    onChangeText={setCardNumber}
                    placeholder="Card number"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="numeric"
                  />
                  <View style={s.cardBadgesRow}>
                    <View style={[s.cardChip, { backgroundColor: '#1A1F71' }]}>
                      <Text style={s.cardChipText}>VISA</Text>
                    </View>
                    <View style={[s.cardChip, { backgroundColor: '#EB001B' }]}>
                      <Text style={s.cardChipText}>MC</Text>
                    </View>
                  </View>
                </View>

                <View style={s.cardBoxDivider} />

                {/* Expiry, CVC & Zip in 1 row */}
                <View style={s.cardBottomRow}>
                  <TextInput
                    style={[s.cardSubInput, { flex: 1.2 }]}
                    value={expiry}
                    onChangeText={setExpiry}
                    placeholder="MM / YY"
                    placeholderTextColor={colors.textMuted}
                  />
                  <View style={s.verticalDivider} />
                  <TextInput
                    style={[s.cardSubInput, { flex: 1 }]}
                    value={cvc}
                    onChangeText={setCvc}
                    placeholder="CVC"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="numeric"
                    secureTextEntry
                  />
                  <View style={s.verticalDivider} />
                  <TextInput
                    style={[s.cardSubInput, { flex: 1 }]}
                    value={postalCode}
                    onChangeText={setPostalCode}
                    placeholder="ZIP"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
              </View>

              {/* Link by Stripe 1-Click Save */}
              <TouchableOpacity
                style={s.linkCheckRow}
                onPress={() => setSaveLink(!saveLink)}
                activeOpacity={0.8}
              >
                <View style={[s.checkbox, saveLink && s.checkboxChecked]}>
                  {saveLink && <Check color="#FFFFFF" size={12} strokeWidth={3.5} />}
                </View>
                <Text style={s.linkCheckText}>
                  Save info for 1-click checkout with <Text style={s.linkBold}>Link</Text>
                </Text>
              </TouchableOpacity>

              {/* Official Stripe Indigo Pay Button */}
              <TouchableOpacity
                style={[s.stripePayBtn, loading && s.stripePayBtnLoading]}
                onPress={handlePay}
                disabled={loading}
                activeOpacity={0.9}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <View style={s.payBtnInner}>
                    <Lock color="#FFFFFF" size={14} strokeWidth={2.5} />
                    <Text style={s.stripePayBtnText}>Pay LKR {amount.toLocaleString()}.00</Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Secure Footer */}
              <View style={s.footer}>
                <Lock color={colors.textMuted} size={12} strokeWidth={2} />
                <Text style={s.footerText}>Secured by Stripe · Terms & Privacy</Text>
              </View>
            </ScrollView>
          )}
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center', padding: 20,
  },
  sheet: {
    backgroundColor: colors.surfaceWhite, borderRadius: 20,
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 28, maxHeight: '88%',
  },
  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: colors.borderSoft,
  },
  stripeBranding: { flexDirection: 'row', alignItems: 'center' },
  stripeBrandText: { fontFamily: FONTS.medium, fontSize: 12, color: colors.textMuted },
  stripeLogoText: { fontFamily: FONTS.black, fontSize: 15, color: colors.midTeal, letterSpacing: -0.5 },
  closeBtn: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: colors.surfaceSubtle,
    justifyContent: 'center', alignItems: 'center',
  },

  content: { paddingTop: 16, gap: 14 },

  amountRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingBottom: 4,
  },
  payToText: { fontFamily: FONTS.bold, fontSize: 14, color: colors.textSecondary },
  amountText: { fontFamily: FONTS.black, fontSize: 20, color: colors.midTeal },

  expressBtn: {
    backgroundColor: '#000000', borderRadius: 10, height: 46,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
  },
  expressText: { fontFamily: FONTS.medium, fontSize: 14, color: '#FFFFFF' },
  appleLogo: { fontFamily: FONTS.bold, fontSize: 17, color: '#FFFFFF' },

  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 2 },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.borderSoft },
  dividerText: { fontFamily: FONTS.medium, fontSize: 12, color: colors.textMuted },

  // Unified Stripe Card Box
  stripeCardBox: {
    backgroundColor: colors.surfaceSubtle, borderRadius: 10, borderWidth: 1, borderColor: colors.borderSoft,
    shadowColor: colors.midTeal, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6,
  },
  cardInputRow: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, height: 46,
  },
  cardNumberInput: {
    flex: 1, fontFamily: FONTS.bold, fontSize: 14, color: colors.textDark,
  },
  cardBadgesRow: { flexDirection: 'row', gap: 4 },
  cardChip: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  cardChipText: { fontFamily: FONTS.black, fontSize: 9, color: '#FFFFFF' },

  cardBoxDivider: { height: 1, backgroundColor: colors.borderSoft },

  cardBottomRow: { flexDirection: 'row', alignItems: 'center', height: 44, paddingHorizontal: 12 },
  cardSubInput: { fontFamily: FONTS.bold, fontSize: 13, color: colors.textDark },
  verticalDivider: { width: 1, height: 24, backgroundColor: colors.borderSoft, marginHorizontal: 8 },

  linkCheckRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  checkbox: {
    width: 18, height: 18, borderRadius: 4, borderWidth: 1.5, borderColor: colors.borderSoft,
    justifyContent: 'center', alignItems: 'center', backgroundColor: colors.surfaceSubtle,
  },
  checkboxChecked: { backgroundColor: colors.midTeal, borderColor: colors.midTeal },
  linkCheckText: { fontFamily: FONTS.medium, fontSize: 12, color: colors.textSecondary },
  linkBold: { fontFamily: FONTS.bold, color: colors.midTeal },

  // Brand Teal Primary CTA
  stripePayBtn: {
    backgroundColor: colors.midTeal, borderRadius: 10, height: 48,
    justifyContent: 'center', alignItems: 'center', marginTop: 4,
    shadowColor: colors.midTeal, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8,
  },
  stripePayBtnLoading: { opacity: 0.75 },
  payBtnInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stripePayBtnText: { fontFamily: FONTS.bold, fontSize: 15, color: '#FFFFFF' },

  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 4 },
  footerText: { fontFamily: FONTS.medium, fontSize: 11, color: colors.textMuted },

  successBox: { alignItems: 'center', justifyContent: 'center', paddingVertical: 36, gap: 12 },
  successIconCircle: {
    width: 60, height: 60, borderRadius: 30, backgroundColor: '#10B981',
    justifyContent: 'center', alignItems: 'center',
  },
  successTitle: { fontFamily: FONTS.black, fontSize: 20, color: colors.textDark },
  successSub: { fontFamily: FONTS.medium, fontSize: 13, color: colors.textMuted },
});

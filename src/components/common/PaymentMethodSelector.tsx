import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Wallet, CreditCard } from 'lucide-react-native';
import { useTheme, ThemeColors } from '../../context/ThemeContext';
import { FONTS } from '../../theme/typography';

interface PaymentMethodSelectorProps {
  selectedMethod: 'counter' | 'stripe';
  onSelect: (method: 'counter' | 'stripe') => void;
  title?: string;
  disabled?: boolean;
}

export const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  selectedMethod,
  onSelect,
  title = 'Payment Method',
  disabled = false,
}) => {
  const { colors } = useTheme();
  const s = makeStyles(colors);

  return (
    <View style={s.container}>
      {title ? <Text style={s.sectionTitle}>{title}</Text> : null}

      <View style={[s.optionsWrap, disabled && { opacity: 0.5 }]} pointerEvents={disabled ? 'none' : 'auto'}>
        {/* Option 1: Pay at Counter */}
        <Pressable
          style={[s.optionCard, selectedMethod === 'counter' && s.optionSelected]}
          onPress={() => onSelect('counter')}
        >
          <View style={[s.iconBox, selectedMethod === 'counter' && s.iconBoxSelected]}>
            <Wallet color={selectedMethod === 'counter' ? colors.midTeal : colors.textMuted} size={20} strokeWidth={2} />
          </View>

          <View style={s.textWrap}>
            <Text style={s.optionTitle}>Pay at Counter</Text>
            <Text style={s.optionSub}>Cash or card upon pickup</Text>
          </View>

          <View style={[s.radioOuter, selectedMethod === 'counter' && s.radioOuterSelected]}>
            {selectedMethod === 'counter' && <View style={s.radioInner} />}
          </View>
        </Pressable>

        {/* Option 2: Pay Online via Stripe */}
        <Pressable
          style={[s.optionCard, selectedMethod === 'stripe' && s.optionSelected]}
          onPress={() => onSelect('stripe')}
        >
          <View style={[s.iconBox, selectedMethod === 'stripe' && s.iconBoxSelected]}>
            <CreditCard color={selectedMethod === 'stripe' ? colors.midTeal : colors.textMuted} size={20} strokeWidth={2} />
          </View>

          <View style={s.textWrap}>
            <Text style={s.optionTitle}>Pay Online</Text>
            <Text style={s.optionSub}>Stripe — fast & queue-free</Text>
          </View>

          <View style={[s.radioOuter, selectedMethod === 'stripe' && s.radioOuterSelected]}>
            {selectedMethod === 'stripe' && <View style={s.radioInner} />}
          </View>
        </Pressable>
      </View>
    </View>
  );
};

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { gap: 10 },
  sectionTitle: { fontFamily: FONTS.bold, fontSize: 13, color: colors.textMuted, letterSpacing: 0.4 },
  optionsWrap: { gap: 10 },
  optionCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.surfaceWhite, borderRadius: 16, padding: 14,
    borderWidth: 1.5, borderColor: colors.borderSoft,
  },
  optionSelected: {
    borderColor: colors.midTeal, backgroundColor: colors.midTealLight,
  },
  iconBox: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: colors.bgWarm,
    justifyContent: 'center', alignItems: 'center',
  },
  iconBoxSelected: { backgroundColor: colors.surfaceWhite },
  textWrap: { flex: 1 },
  optionTitle: { fontFamily: FONTS.bold, fontSize: 14, color: colors.textDark },
  optionSub: { fontFamily: FONTS.medium, fontSize: 11, color: colors.textMuted, marginTop: 1 },
  radioOuter: {
    width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.borderSoft,
    justifyContent: 'center', alignItems: 'center', backgroundColor: colors.surfaceWhite,
  },
  radioOuterSelected: { borderColor: colors.midTeal },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.midTeal },
});

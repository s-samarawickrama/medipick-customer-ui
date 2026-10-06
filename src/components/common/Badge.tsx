import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme, ThemeColors } from '../../context/ThemeContext';

interface BadgeProps {
  label: string;
  variant?: 'success' | 'warning' | 'info' | 'purple' | 'danger' | 'lime';
  icon?: React.ReactNode;
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({ label, variant = 'lime', icon, style }) => {
  const { colors } = useTheme();

  const getBadgeStyle = () => {
    switch (variant) {
      case 'success': return { bg: '#DCFCE7', text: '#15803D', border: '#86EFAC' };
      case 'warning': return { bg: '#FEF3C7', text: '#B45309', border: '#FDE68A' };
      case 'info': return { bg: '#E0F2FE', text: '#0369A1', border: '#BAE6FD' };
      case 'purple': return { bg: '#F3E8FF', text: '#6B21A8', border: '#E9D5FF' };
      case 'danger': return { bg: '#FEE2E2', text: '#B91C1C', border: '#FCA5A5' };
      case 'lime':
      default:
        return { bg: '#EDF4DE', text: colors.deepIndigo, border: colors.softLime };
    }
  };

  const styleConfig = getBadgeStyle();

  return (
    <View style={[styles.badge, { backgroundColor: styleConfig.bg, borderColor: styleConfig.border }, style]}>
      {icon}
      <Text style={[styles.text, { color: styleConfig.text }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});

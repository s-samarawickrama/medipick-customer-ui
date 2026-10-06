import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme, ThemeColors } from '../../context/ThemeContext';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'flat' | 'elevated' | 'bordered';
}

export const Card: React.FC<CardProps> = ({ children, style, variant = 'elevated' }) => {
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  return (
    <View
      style={[
        styles.card,
        variant === 'bordered' && styles.bordered,
        variant === 'elevated' && styles.elevated,
        style,
      ]}
    >
      {children}
    </View>
  );
};

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 18,
    marginVertical: 6,
  },
  bordered: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  elevated: {
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
});

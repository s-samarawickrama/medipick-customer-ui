import React, { useRef } from 'react';
import {
  Animated,
  TouchableWithoutFeedback,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { useTheme, ThemeColors } from '../../context/ThemeContext';
import { FONTS } from '../../theme/typography';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'plum' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'lg' | 'md' | 'sm';
  isLoading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'lg',
  isLoading = false,
  disabled = false,
  style,
  textStyle,
  icon,
  iconRight,
  fullWidth = true,
}) => {
  const { colors } = useTheme();
  const s = makeStyles(colors);
  const scale = useRef(new Animated.Value(1)).current;

  const pressIn = () => {
    Animated.spring(scale, {
      toValue: 0.98,
      useNativeDriver: true,
      speed: 60,
      bounciness: 0,
    }).start();
  };

  const pressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 40,
      bounciness: 2,
    }).start();
  };

  const variantStyle = {
    primary:   { bg: colors.midTeal,      text: '#FFFFFF', border: 'transparent' },
    espresso:  { bg: colors.peacockBlue,   text: '#FFFFFF', border: 'transparent' },
    plum:      { bg: colors.deepPlum,     text: '#FFFFFF', border: 'transparent' },
    secondary: { bg: colors.limeWhisper,  text: colors.midTeal, border: '#D6EDA0' },
    outline:   { bg: 'transparent',       text: colors.midTeal, border: colors.midTeal },
    ghost:     { bg: 'transparent',       text: colors.textSecondary, border: 'transparent' },
    danger:    { bg: colors.error,        text: '#FFFFFF', border: 'transparent' },
  }[variant] || { bg: colors.midTeal, text: '#FFFFFF', border: 'transparent' };

  const disabledStyle = {
    bg: colors.surfaceSubtle,
    text: colors.textMuted,
    border: colors.borderSoft,
  };

  const sizeStyle = {
    lg: { height: 52, px: 20, font: 16, radius: 14 },
    md: { height: 44, px: 16, font: 14, radius: 12 },
    sm: { height: 36, px: 12, font: 13, radius: 10 },
  }[size];

  const isDisabled = disabled || isLoading;

  return (
    <TouchableWithoutFeedback
      onPress={onPress}
      onPressIn={pressIn}
      onPressOut={pressOut}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <Animated.View style={[
        s.base,
        {
          height: sizeStyle.height,
          paddingHorizontal: sizeStyle.px,
          borderRadius: sizeStyle.radius,
          backgroundColor: isDisabled ? disabledStyle.bg : variantStyle.bg,
          borderWidth: variant === 'outline' || variant === 'secondary' ? 1.5 : 0,
          borderColor: isDisabled ? disabledStyle.border : variantStyle.border,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
          transform: [{ scale }],
        },
        style,
      ]}>
        {isLoading ? (
          <ActivityIndicator color={isDisabled ? disabledStyle.text : variantStyle.text} size="small" />
        ) : (
          <>
            {icon ? <View style={s.icon}>{icon}</View> : null}
            <Text style={[
              s.label,
              {
                fontFamily: FONTS.bold,
                fontSize: sizeStyle.font,
                color: isDisabled ? disabledStyle.text : variantStyle.text,
              },
              textStyle,
            ]}>
              {title}
            </Text>
            {iconRight ? <View style={s.icon}>{iconRight}</View> : null}
          </>
        )}
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  icon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    textAlign: 'center',
    letterSpacing: -0.2,
  },
});

import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
  Animated,
  TouchableWithoutFeedback,
  ViewStyle,
} from 'react-native';
import { useTheme, ThemeColors } from '../../context/ThemeContext';
import { FONTS } from '../../theme/typography';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
  containerStyle?: ViewStyle;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  icon,
  containerStyle,
  style,
  ...props
}) => {
  const { colors } = useTheme();
  const s = makeStyles(colors);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const borderAnim = useRef(new Animated.Value(0)).current;

  const onFocus = () => {
    setFocused(true);
    Animated.timing(borderAnim, {
      toValue: 1,
      duration: 150,
      useNativeDriver: false,
    }).start();
    props.onFocus?.({} as any);
  };

  const onBlur = () => {
    setFocused(false);
    Animated.timing(borderAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: false,
    }).start();
    props.onBlur?.({} as any);
  };

  const borderColor = error
    ? colors.error
    : borderAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [colors.border, colors.primary],
      });

  return (
    <TouchableWithoutFeedback onPress={() => inputRef.current?.focus()}>
      <View style={[s.wrap, containerStyle]}>
        {label ? <Text style={s.label}>{label}</Text> : null}
        <Animated.View style={[s.field, { borderColor }]}>
          {icon ? <View style={s.iconSlot}>{icon}</View> : null}
          <TextInput
            ref={inputRef}
            style={[s.input, icon ? { paddingLeft: 0 } : null, style as any]}
            placeholderTextColor={colors.textMuted}
            onFocus={onFocus}
            onBlur={onBlur}
            {...props}
          />
        </Animated.View>
        {error ? (
          <Text style={s.error}>{error}</Text>
        ) : helperText ? (
          <Text style={s.helper}>{helperText}</Text>
        ) : null}
      </View>
    </TouchableWithoutFeedback>
  );
};

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  wrap: {
    marginBottom: 16,
  },
  label: {
    fontFamily: FONTS.medium,
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderRadius: 10,
    overflow: 'hidden',
  },
  iconSlot: {
    paddingLeft: 13,
    paddingRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: 48,
    paddingHorizontal: 13,
    fontFamily: FONTS.regular,
    fontSize: 15,
    color: colors.textPrimary,
    outlineStyle: 'none' as any,
    outlineWidth: 0 as any,
  },
  error: {
    fontFamily: FONTS.medium,
    fontSize: 12,
    color: colors.error,
    marginTop: 5,
  },
  helper: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 5,
    lineHeight: 16,
  },
});

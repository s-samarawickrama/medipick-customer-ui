import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { useTheme, ThemeColors } from '../../context/ThemeContext';
import { SPACING } from '../../theme/spacing';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  variant?: 'light' | 'dark';
}

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title,
  subtitle,
  onBack,
  rightAction,
  variant = 'light',
}) => {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const isDark = variant === 'dark';

  return (
    <View style={[styles.container, isDark && styles.darkContainer]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={isDark ? colors.peacockBlue : colors.white}
      />
      <View style={styles.row}>
        {onBack ? (
          <TouchableOpacity
            style={[styles.backBtn, isDark && styles.backBtnDark]}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ChevronLeft
              color={isDark ? colors.white : colors.deepIndigo}
              size={22}
              strokeWidth={2.5}
            />
          </TouchableOpacity>
        ) : (
          <View style={styles.spacer} />
        )}

        <View style={styles.titleBlock}>
          <Text
            style={[styles.title, isDark && styles.titleDark]}
            numberOfLines={1}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text
              style={[styles.subtitle, isDark && styles.subtitleDark]}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>

        <View style={styles.rightSlot}>
          {rightAction ?? <View style={styles.spacer} />}
        </View>
      </View>
    </View>
  );
};

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    paddingTop: SPACING[3],
    paddingBottom: SPACING[3],
    paddingHorizontal: SPACING[4],
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  darkContainer: {
    backgroundColor: colors.peacockBlue,
    borderBottomColor: 'transparent',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backBtnDark: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  titleBlock: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.deepIndigo,
    letterSpacing: -0.2,
  },
  titleDark: {
    color: colors.white,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 1,
  },
  subtitleDark: {
    color: 'rgba(255,255,255,0.65)',
  },
  spacer: {
    width: 36,
  },
  rightSlot: {
    width: 36,
    alignItems: 'flex-end',
  },
});

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme, ThemeColors } from '../../context/ThemeContext';
import { Clock } from 'lucide-react-native';

interface CountdownTimerProps {
  targetIsoDate: string;
  label?: string;
  onExpire?: () => void;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({ targetIsoDate, label = 'Remaining Time:', onExpire }) => {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number; isExpired: boolean }>({
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false,
  });

  useEffect(() => {
    const calculateTime = () => {
      const target = new Date(targetIsoDate).getTime();
      const now = new Date().getTime();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, isExpired: true });
        if (onExpire) onExpire();
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds, isExpired: false });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [targetIsoDate]);

  if (timeLeft.isExpired) {
    return (
      <View style={[styles.container, styles.expiredContainer]}>
        <Clock color={colors.error} size={16} />
        <Text style={styles.expiredText}>Expired</Text>
      </View>
    );
  }

  const formatPad = (num: number) => String(num).padStart(2, '0');

  return (
    <View style={styles.container}>
      <Clock color={colors.deepIndigo} size={16} />
      <Text style={styles.labelText}>{label}</Text>
      <Text style={styles.timerText}>
        {formatPad(timeLeft.hours)}h {formatPad(timeLeft.minutes)}m {formatPad(timeLeft.seconds)}s
      </Text>
    </View>
  );
};

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.limeWhisper,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  expiredContainer: {
    backgroundColor: '#FEE2E2',
  },
  labelText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.deepIndigo,
  },
  timerText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.deepIndigo,
  },
  expiredText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.error,
  },
});

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ChevronLeft, RotateCcw } from 'lucide-react-native';
import { TextInput } from 'react-native';
import { Button } from '../../components/common/Button';
import { useTheme, ThemeColors } from '../../context/ThemeContext';
import { FONTS } from '../../theme/typography';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { verifyOtp as apiVerifyOtp, resendOtp as apiResendOtp } from '../../api/authApi';
import { useAuth } from '../../context/AuthContext';

type Props = NativeStackScreenProps<AuthStackParamList, 'OTP'>;

export const OTPScreen: React.FC<Props> = ({ navigation, route }) => {
  const { isDark, colors } = useTheme();
  const s = makeStyles(colors);
  const { phone } = route.params;
  const { reloadUser } = useAuth();
  const [otp,      setOtp]      = useState('');
  const [otpErr,   setOtpErr]   = useState('');
  const [loading,  setLoading]  = useState(false);
  const [seconds,  setSeconds]  = useState(59);
  const [canResend, setCanResend] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  const opacity = useRef(new Animated.Value(0)).current;
  const slideY  = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.spring(slideY, { toValue: 0, useNativeDriver: true, speed: 26 }),
    ]).start();

    const t = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) { clearInterval(t); setCanResend(true); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const handleVerify = async () => {
    if (otp.length < 6) { setOtpErr('Enter 6-digit code'); return; }
    setOtpErr('');
    setLoading(true);
    try {
      await apiVerifyOtp({ phoneNumber: phone, otp });
      await reloadUser();
    } catch (e: any) {
      if (e.code === 'ACCOUNT_LOCKED') {
        setIsLocked(true);
        setOtpErr(e.message);
        setCanResend(false);
      } else {
        setOtpErr(e.message || 'Invalid code');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    setCanResend(false);
    try {
      await apiResendOtp(phone);
      setSeconds(59);
      const t = setInterval(() => {
        setSeconds((s) => {
          if (s <= 1) { clearInterval(t); setCanResend(true); return 0; }
          return s - 1;
        });
      }, 1000);
    } catch (e: any) {
      setOtpErr(e.message || 'Failed to resend code');
      setCanResend(true);
    }
  };

  return (
    <KeyboardAvoidingView style={s.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.bgWarm} />

      <View style={s.nav}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.75}>
          <ChevronLeft color={colors.peacockBlue} size={20} strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      <Animated.View style={[s.content, { opacity, transform: [{ translateY: slideY }] }]}>

        <View style={s.heading}>
          <Text style={s.title}>Enter Code</Text>
          <Text style={s.desc}>
            Sent to <Text style={s.phone}>{phone}</Text>
          </Text>
        </View>

        <View style={s.otpContainer}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <View key={i} style={[
              s.otpBox, 
              otp.length > i && s.otpBoxFilled,
              !!otpErr && s.otpBoxError,
              isLocked && { borderColor: colors.borderSoft, backgroundColor: colors.bgWarm }
            ]}>
              <Text style={s.otpText}>{otp[i] || ''}</Text>
            </View>
          ))}
          <TextInput
            style={s.hiddenOtpInput}
            keyboardType="number-pad"
            maxLength={6}
            value={otp}
            onChangeText={(val) => {
              const numericVal = val.replace(/[^0-9]/g, '');
              setOtp(numericVal);
              if (otpErr && !isLocked) setOtpErr('');
            }}
            editable={!isLocked && !loading}
            autoFocus
            caretHidden
            selectionColor="transparent"
          />
        </View>
        {!!otpErr && <Text style={s.errorText}>{otpErr}</Text>}

        <Button
          title="Verify"
          onPress={handleVerify}
          isLoading={loading}
          style={{ marginBottom: 20 }}
        />

        <TouchableOpacity
          style={s.resendRow}
          onPress={handleResend}
          disabled={!canResend}
          activeOpacity={canResend ? 0.7 : 1}
        >
          <RotateCcw color={canResend ? colors.deepTeal : colors.textMuted} size={14} strokeWidth={2} />
          <Text style={[s.resendText, canResend && s.resendActive]}>
            {canResend
              ? 'Resend Code'
              : `Resend in 0:${String(seconds).padStart(2, '0')}`}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </KeyboardAvoidingView>
  );
};

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgWarm },
  nav: { paddingTop: 52, paddingHorizontal: 20, paddingBottom: 8 },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: colors.surfaceSubtle,
    justifyContent: 'center', alignItems: 'center',
  },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 20 },
  heading: { marginBottom: 28 },
  title: { fontFamily: FONTS.black, fontSize: 30, color: colors.textDark, letterSpacing: -0.6, marginBottom: 6 },
  desc: { fontFamily: FONTS.medium, fontSize: 14, color: colors.textMuted },
  phone: { fontFamily: FONTS.bold, color: colors.textDark },
  resendRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12 },
  resendText: { fontFamily: FONTS.medium, fontSize: 14, color: colors.textMuted },
  resendActive: { color: colors.midTeal, fontFamily: FONTS.bold },

  otpContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, position: 'relative' },
  otpBox: { 
    width: 48, height: 56, borderRadius: 12, backgroundColor: colors.surfaceSubtle,
    borderWidth: 1.5, borderColor: colors.borderSoft, justifyContent: 'center', alignItems: 'center'
  },
  otpBoxFilled: { borderColor: colors.softLime, backgroundColor: colors.limeWhisper },
  otpBoxError: { borderColor: colors.error, backgroundColor: colors.errorLight },
  otpText: { fontFamily: FONTS.black, fontSize: 24, color: colors.textDark },
  hiddenOtpInput: { position: 'absolute', width: '100%', height: '100%', color: 'transparent', backgroundColor: 'transparent' },
  errorText: { fontFamily: FONTS.medium, fontSize: 13, color: colors.error, marginTop: -12, marginBottom: 16 },
});

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Phone, User, Mail, ChevronLeft } from 'lucide-react-native';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { useTheme, ThemeColors } from '../../context/ThemeContext';
import { FONTS } from '../../theme/typography';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { requestOtp } from '../../api/authApi';
import { isValidPhoneNumber, normalizePhoneNumber } from '../../utils/phone';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const { colors } = useTheme();
  const s = makeStyles(colors);

  const [phone,   setPhone]   = useState('');
  const [surname, setSurname] = useState('');
  const [email,   setEmail]   = useState('');
  const [phoneErr,   setPhoneErr]   = useState('');
  const [surnameErr, setSurnameErr] = useState('');
  const [emailErr,   setEmailErr]   = useState('');
  const [loading,    setLoading]    = useState(false);

  const opacity = useRef(new Animated.Value(0)).current;
  const slideY  = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    StatusBar.setBarStyle('dark-content');
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 340, useNativeDriver: true }),
      Animated.spring(slideY, { toValue: 0, useNativeDriver: true, speed: 24 }),
    ]).start();
  }, []);

  const validate = () => {
    let ok = true;
    const cleanedPhone = normalizePhoneNumber(phone.trim());

    if (!isValidPhoneNumber(cleanedPhone)) {
      setPhoneErr('Use valid Sri Lankan mobile number');
      ok = false;
    } else setPhoneErr('');

    if (!surname.trim() || surname.trim().length < 2) {
      setSurnameErr('Enter surname');
      ok = false;
    } else setSurnameErr('');

    if (email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        setEmailErr('Enter a valid email address');
        ok = false;
      } else {
        setEmailErr('');
      }
    } else {
      setEmailErr('');
    }
    
    return ok;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    const cleanedPhone = normalizePhoneNumber(phone.trim());
    try {
      await requestOtp({
        phoneNumber: cleanedPhone,
        surname: surname.trim(),
        email: email.trim() || undefined,
      });
      navigation.navigate('OTP', { phone: cleanedPhone, surname: surname.trim() });
    } catch (e: any) {
      setPhoneErr(e.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={s.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />
      <ScrollView
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[s.inner, { opacity, transform: [{ translateY: slideY }] }]}>

          {/* Top Bar with Back Button */}
          <View style={s.topBar}>
            <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.75}>
              <ChevronLeft color={colors.textDark} size={20} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          {/* Header */}
          <View style={s.header}>
            <Text style={s.title}>Sign in</Text>
            <Text style={s.subtitle}>Enter your details to receive a verification code</Text>
          </View>

          {/* Form */}
          <View style={s.form}>
            <Input
              label="Phone number"
              placeholder="e.g. 0771234567"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              error={phoneErr}
              icon={<Phone color={colors.textMuted} size={16} strokeWidth={2} />}
            />
            <Input
              label="Surname"
              placeholder="e.g. Perera"
              value={surname}
              onChangeText={setSurname}
              autoCapitalize="words"
              error={surnameErr}
              icon={<User color={colors.textMuted} size={16} strokeWidth={2} />}
            />
            <Input
              label="Email (optional)"
              placeholder="For order receipts"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              error={emailErr}
              icon={<Mail color={colors.textMuted} size={16} strokeWidth={2} />}
            />
          </View>

          <Button
            title="Continue"
            onPress={handleSubmit}
            isLoading={loading}
          />

          {/* Footer links */}
          <View style={s.footer}>
            <Text style={s.footerText}>
              By continuing, you agree to our{' '}
              <Text
                style={s.footerLink}
                onPress={() => navigation.navigate('LegalDoc', { type: 'terms' })}
              >
                Terms of Service
              </Text>
              {' '}and{' '}
              <Text
                style={s.footerLink}
                onPress={() => navigation.navigate('LegalDoc', { type: 'privacy' })}
              >
                Privacy Policy
              </Text>
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgWarm },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 52, paddingBottom: 40 },
  inner: { flex: 1 },
  topBar: { marginBottom: 20 },
  backBtn: {
    width: 38, height: 38, borderRadius: 12, backgroundColor: colors.surfaceWhite,
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.borderSoft,
  },
  header: { marginBottom: 28 },
  title: { fontFamily: FONTS.black, fontSize: 32, color: colors.peacockBlue, letterSpacing: -0.8, marginBottom: 6 },
  subtitle: { fontFamily: FONTS.medium, fontSize: 14, color: colors.textMuted },
  form: { marginBottom: 16 },
  footer: { marginTop: 'auto', paddingTop: 32, alignItems: 'center' },
  footerText: { fontFamily: FONTS.regular, fontSize: 12, color: colors.textMuted, textAlign: 'center' },
  footerLink: { fontFamily: FONTS.semibold, color: colors.deepTeal, textDecorationLine: 'underline' },
});

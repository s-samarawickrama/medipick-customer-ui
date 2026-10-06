import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  StatusBar,
  Pressable,
  Alert,
  Image,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ArrowRight, ShoppingBag } from 'lucide-react-native';
import { useTheme, ThemeColors } from '../../context/ThemeContext';
import { FONTS } from '../../theme/typography';
import { AuthStackParamList } from '../../navigation/AuthNavigator';

type Props = NativeStackScreenProps<AuthStackParamList, 'Splash'>;

export const SplashScreen: React.FC<Props> = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const s = makeStyles(colors, isDark);
  const logoOp    = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.9)).current;
  const contentOp = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    StatusBar.setBarStyle('dark-content');
    Animated.sequence([
      Animated.parallel([
        Animated.timing(logoOp, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(logoScale, { toValue: 1, useNativeDriver: true, speed: 20 }),
      ]),
      Animated.timing(contentOp, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  }, []);

  const openTerms = () => {
    navigation.navigate('LegalDoc', { type: 'terms' });
  };

  const openPrivacy = () => {
    navigation.navigate('LegalDoc', { type: 'privacy' });
  };

  return (
    <View style={s.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bgWarm} />

      {/* Main Center Brand Logo & Title */}
      <Animated.View style={[s.centerBrand, { opacity: logoOp, transform: [{ scale: logoScale }] }]}>
        <View style={s.logoCircle}>
          <Image 
            source={require('../../../assets/images/medipick_bag.png')} 
            style={{ width: 90, height: 90 }} 
            resizeMode="contain" 
          />
        </View>
        <Text style={s.brandName}>MediPick</Text>
        <Text style={s.tagline}>Smart pharmacy quotes & instant pickup</Text>
      </Animated.View>

      {/* Bottom Action Area with Mid Teal & Soft Lime CTA */}
      <Animated.View style={[s.bottomArea, { opacity: contentOp }]}>
        <Pressable
          style={({ pressed }) => [s.getStartedBtn, pressed && s.btnPressed]}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={s.btnText}>Get Started</Text>
        </Pressable>

        <Text style={s.termsText}>
          By continuing, you agree to MediPick's{' '}
          <Text style={s.linkText} onPress={openTerms}>Terms of Service</Text>
          {' '}and{' '}
          <Text style={s.linkText} onPress={openPrivacy}>Privacy Policy</Text>.
        </Text>
      </Animated.View>
    </View>
  );
};

const makeStyles = (colors: ThemeColors, isDark: boolean) => StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bgWarm,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 120,
    paddingBottom: 48,
  },
  centerBrand: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoCircle: {
    width: 140,
    height: 140,
    borderRadius: 36,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    overflow: 'hidden',
  },
  brandName: {
    fontFamily: FONTS.black,
    fontSize: 40,
    color: colors.midTeal,
    letterSpacing: -1,
    marginBottom: 6,
  },
  tagline: {
    fontFamily: FONTS.medium,
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  bottomArea: {
    gap: 16,
    alignItems: 'center',
  },
  getStartedBtn: {
    backgroundColor: colors.midTeal,
    height: 54,
    borderRadius: 16,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: colors.midTeal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 3,
  },
  btnPressed: {
    opacity: 0.92,
  },
  btnText: {
    fontFamily: FONTS.bold,
    fontSize: 16,
    color: '#FFFFFF',
  },
  termsText: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  linkText: {
    fontFamily: FONTS.semibold,
    color: colors.midTeal,
    textDecorationLine: 'underline',
  },
});

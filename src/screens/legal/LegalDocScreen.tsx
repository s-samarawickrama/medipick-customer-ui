import React, { useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Animated, StatusBar,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChevronLeft, Shield, FileText, HelpCircle } from 'lucide-react-native';
import { useTheme, ThemeColors } from '../../context/ThemeContext';
import { FONTS } from '../../theme/typography';
import { MainStackParamList } from '../../navigation/MainNavigator';

type Nav = NativeStackNavigationProp<MainStackParamList>;
type Route = RouteProp<MainStackParamList, 'LegalDoc'>;

export const LegalDocScreen = () => {
  const { isDark, colors } = useTheme();
  const s = makeStyles(colors);
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const type = route.params?.type ?? 'terms';

  const opacity = useRef(new Animated.Value(0)).current;
  const slideY  = useRef(new Animated.Value(14)).current;

  useEffect(() => {
    StatusBar.setBarStyle('dark-content');
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 280, useNativeDriver: true }),
      Animated.spring(slideY, { toValue: 0, useNativeDriver: true, speed: 26 }),
    ]).start();
  }, []);

  const isTerms = type === 'terms';
  const isPrivacy = type === 'privacy';
  const isFaq = type === 'faq';
  const title = isTerms ? 'Terms of Service' : isPrivacy ? 'Privacy Policy' : 'Help Center & FAQ';

  return (
    <View style={s.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bgWarm} />

      {/* Header */}
      <View style={s.nav}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.75}>
          <ChevronLeft color={colors.textDark} size={20} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={s.navTitle}>{title}</Text>
        <View style={{ width: 36 }} />
      </View>

      <Animated.ScrollView
        style={{ opacity, transform: [{ translateY: slideY }] }}
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Banner */}
        <View style={s.heroCard}>
          <View style={s.iconCircle}>
            {isTerms ? (
              <FileText color={colors.midTeal} size={24} strokeWidth={2} />
            ) : isPrivacy ? (
              <Shield color={colors.midTeal} size={24} strokeWidth={2} />
            ) : (
              <HelpCircle color={colors.midTeal} size={24} strokeWidth={2} />
            )}
          </View>
          <Text style={s.heroTitle}>{title}</Text>
          <Text style={s.heroSub}>
            {isFaq ? 'Find answers to common questions below' : 'Last updated: July 2026 · MediPick Platform'}
          </Text>
        </View>

        {isTerms ? (
          <View style={s.contentCard}>
            <Text style={s.sectionHeader}>1. Acceptance of Terms</Text>
            <Text style={s.paragraph}>
              By accessing or using the MediPick client application, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
            </Text>

            <Text style={s.sectionHeader}>2. Pharmacy Orders & Pickup</Text>
            <Text style={s.paragraph}>
              MediPick partners with licensed local pharmacies. All counter pickup orders require presenting your unique 6-digit OTP pickup code at the designated pharmacy counter.
            </Text>

            <Text style={s.sectionHeader}>3. Doctor Prescriptions</Text>
            <Text style={s.paragraph}>
              Prescription uploads must contain clear, legible images of valid doctor prescriptions with visible registration details. Our automated verification AI assists licensed pharmacy staff in reviewing uploaded documents.
            </Text>

            <Text style={s.sectionHeader}>4. User Responsibilities</Text>
            <Text style={s.paragraph}>
              You agree to provide accurate medical information and contact details. Misuse of the platform or fraudulent prescription submissions will result in immediate account termination.
            </Text>
          </View>
        ) : isPrivacy ? (
          <View style={s.contentCard}>
            <Text style={s.sectionHeader}>1. Data Collection & Privacy</Text>
            <Text style={s.paragraph}>
              We collect minimal personal data required for pharmacy fulfillment, including phone numbers, pickup locations, and prescription images submitted for quotes.
            </Text>

            <Text style={s.sectionHeader}>2. Medical Record Security</Text>
            <Text style={s.paragraph}>
              All prescription documents uploaded to MediPick are encrypted end-to-end and stored securely. Your data is accessible solely by licensed partner pharmacy staff fulfilling your order.
            </Text>

            <Text style={s.sectionHeader}>3. Third-Party Sharing</Text>
            <Text style={s.paragraph}>
              MediPick never sells or monetizes user health data. We share order details exclusively with the selected partner pharmacies fulfilling your specific medicine request.
            </Text>

            <Text style={s.sectionHeader}>4. Your Rights</Text>
            <Text style={s.paragraph}>
              You retain full rights to request deletion of your order history, profile data, or uploaded prescription images at any time through account settings or customer support.
            </Text>
          </View>
        ) : (
          <View style={s.contentCard}>
            <Text style={s.sectionHeader}>How does Prescription Matching work?</Text>
            <Text style={s.paragraph}>
              Upload a valid doctor's prescription. Our AI checks it and sends it to nearby partner pharmacies. You will receive competitive quotes and can choose the best offer for pickup.
            </Text>

            <Text style={s.sectionHeader}>Do I pay on the app or at the pharmacy?</Text>
            <Text style={s.paragraph}>
              You pay directly at the pharmacy counter when you present your 6-digit OTP code to collect your medication. The app is completely free to use for requesting quotes!
            </Text>

            <Text style={s.sectionHeader}>Can I cancel an active order?</Text>
            <Text style={s.paragraph}>
              Yes, you can cancel an order any time before the pharmacy prepares it. Just tap "Cancel Order" in the order tracking screen.
            </Text>

            <Text style={s.sectionHeader}>Need Human Support?</Text>
            <Text style={s.paragraph}>
              Call us anytime at 1-800-MEDIPICK or use the chat tab in the app to speak to a licensed pharmacy technician.
            </Text>
          </View>
        )}
      </Animated.ScrollView>
    </View>
  );
};

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgWarm },
  nav: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: 52, paddingBottom: 12, paddingHorizontal: 20,
    backgroundColor: colors.bgWarm, borderBottomWidth: 1, borderBottomColor: colors.borderSoft,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: colors.surfaceWhite,
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.borderSoft,
  },
  navTitle: { flex: 1, textAlign: 'center', fontFamily: FONTS.black, fontSize: 16, color: colors.textDark },
  scroll: { padding: 20, paddingBottom: 60, gap: 14 },

  heroCard: {
    backgroundColor: colors.surfaceWhite, borderRadius: 20, padding: 20,
    borderWidth: 1, borderColor: colors.borderSoft, alignItems: 'center', gap: 6,
  },
  iconCircle: {
    width: 52, height: 52, borderRadius: 16, backgroundColor: colors.limeWhisper,
    justifyContent: 'center', alignItems: 'center', marginBottom: 4,
  },
  heroTitle: { fontFamily: FONTS.black, fontSize: 20, color: colors.textDark, textAlign: 'center' },
  heroSub: { fontFamily: FONTS.medium, fontSize: 12, color: colors.textMuted, textAlign: 'center' },

  contentCard: {
    backgroundColor: colors.surfaceWhite, borderRadius: 20, padding: 20,
    borderWidth: 1, borderColor: colors.borderSoft, gap: 10,
  },
  sectionHeader: { fontFamily: FONTS.black, fontSize: 15, color: colors.textDark, marginTop: 6 },
  paragraph: { fontFamily: FONTS.regular, fontSize: 13, color: colors.textSecondary, lineHeight: 20 },
});

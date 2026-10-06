import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Animated, StatusBar, Pressable, Modal, TextInput, Alert, Switch,
  KeyboardAvoidingView, Platform
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ShieldCheck, Phone, Mail, ChevronRight, LogOut, Bell, HelpCircle, FileText, Lock, Heart, MapPin, CreditCard, X, AlertTriangle } from 'lucide-react-native';
import { Button } from '../../components/common/Button';
import { COLORS } from '../../theme/colors';
import { FONTS } from '../../theme/typography';
import { MainStackParamList } from '../../navigation/MainNavigator';
import { useAuth } from '../../context/AuthContext';
import { useTheme, ThemeColors } from '../../context/ThemeContext';
import { Moon } from 'lucide-react-native';
import { initiatePhoneChange, verifyPhoneChange, updatePreferences } from '../../api/usersApi';
import { maskPhoneNumber, isValidPhoneNumber, normalizePhoneNumber } from '../../utils/phone';

type Nav = NativeStackNavigationProp<MainStackParamList>;

export const ProfileScreen = () => {
  const navigation = useNavigation<Nav>();
  const opacity = useRef(new Animated.Value(0)).current;
  const { user, logout, reloadUser } = useAuth();
  const { isDark, toggleTheme, colors } = useTheme();
  const s = makeStyles(colors);

  const [newPhone, setNewPhone]           = useState('');
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [phoneStep, setPhoneStep]         = useState<'input' | 'otp'>('input');
  const [otp, setOtp]                     = useState('');
  const [loading, setLoading]             = useState(false);

  const [showNotifModal, setShowNotifModal] = useState(false);

  if (!user) return null;

  useEffect(() => {
    StatusBar.setBarStyle('dark-content');
    Animated.timing(opacity, { toValue: 1, duration: 280, useNativeDriver: true }).start();
  }, []);

  const closePhoneModal = () => {
    setShowPhoneModal(false);
    setPhoneStep('input');
    setOtp('');
  };

  const handleUpdatePhone = async () => {
    if (phoneStep === 'input') {
      const normalized = normalizePhoneNumber(newPhone.trim());
      if (!isValidPhoneNumber(normalized)) {
        Alert.alert('Invalid Number', 'Please enter a valid Sri Lankan phone number.');
        return;
      }
      setLoading(true);
      try {
        await initiatePhoneChange({ newPhoneNumber: normalized });
        setPhoneStep('otp');
      } catch (e: any) {
        Alert.alert('Error', e.message || 'Failed to request phone change');
      } finally {
        setLoading(false);
      }
    } else {
      if (otp.length < 6) {
        Alert.alert('Invalid OTP', 'Please enter a 6-digit verification code.');
        return;
      }
      setLoading(true);
      try {
        const normalized = normalizePhoneNumber(newPhone.trim());
        await verifyPhoneChange({ newPhoneNumber: normalized, otp });
        await reloadUser();
        setNewPhone('');
        setOtp('');
        setPhoneStep('input');
        setShowPhoneModal(false);
        Alert.alert('Phone Updated', 'Your phone number has been updated successfully.');
      } catch (e: any) {
        Alert.alert('Verification Failed', e.message || 'Incorrect OTP');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleTogglePush = async (val: boolean) => {
    try {
      await updatePreferences({ pushNotificationsEnabled: val });
      await reloadUser();
    } catch (e: any) {
      console.warn('Failed to update push pref', e);
    }
  };

  const handleToggleEmail = async (val: boolean) => {
    try {
      await updatePreferences({ emailReceiptsEnabled: val });
      await reloadUser();
    } catch (e: any) {
      console.warn('Failed to update email pref', e);
    }
  };

  return (
    <View style={s.screen}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.bgWarm} />

      <Animated.ScrollView
        style={{ opacity }}
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Hero Card */}
        <View style={s.profileCard}>
          <View style={s.cardTop}>
            <View style={s.avatarCircle}>
              <Text style={s.avatarText}>P</Text>
            </View>

            <View style={{ flex: 1 }}>
              <View style={s.nameRow}>
                <Text style={s.userName}>{user.surname || 'Perera'}</Text>
                <View style={s.verifiedTag}>
                  <ShieldCheck color={colors.midTeal} size={13} strokeWidth={2.5} />
                  <Text style={s.verifiedText}>Verified</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 }}>
                <Text style={s.userPhone}>{maskPhoneNumber(user.phoneNumber)}</Text>
                {user.strikes > 0 && (
                  <View style={s.strikeTag}>
                    <AlertTriangle color={colors.warning} size={12} strokeWidth={2.5} />
                    <Text style={s.strikeText}>{user.strikes}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* MY ACCOUNT */}
        <View style={s.sectionWrap}>
          <Text style={s.sectionTitle}>MY ACCOUNT</Text>
          <View style={s.menuCard}>
            <Pressable 
              style={s.menuItem}
              onPress={() => (navigation as any).navigate('Favorites')}
            >
              <View style={s.menuIconBox}>
                <Heart color={colors.midTeal} size={18} strokeWidth={2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.menuLabel}>Favorite Pharmacies</Text>
                <Text style={s.menuSub}>Quick access to your saved stores</Text>
              </View>
              <ChevronRight color={colors.textMuted} size={16} strokeWidth={2} />
            </Pressable>
          </View>
        </View>

        {/* PREFERENCES */}
        <View style={s.sectionWrap}>
          <Text style={s.sectionTitle}>PREFERENCES</Text>
          <View style={s.menuCard}>
            <View style={s.switchRowItem}>
              <View style={s.menuIconBox}>
                <Moon color={colors.midTeal} size={18} strokeWidth={2} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={s.menuLabel}>Dark Mode</Text>
                <Text style={s.menuSub}>Toggle dark theme</Text>
              </View>
              <Switch value={isDark} onValueChange={toggleTheme} trackColor={{ false: '#CBD5E1', true: colors.midTeal }} />
            </View>

            <Pressable style={[s.menuItem, s.menuBorder]} onPress={() => setShowPhoneModal(true)}>
              <View style={s.menuIconBox}>
                <Phone color={colors.midTeal} size={18} strokeWidth={2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.menuLabel}>Change Phone Number</Text>
                <Text style={s.menuSub}>{maskPhoneNumber(user.phoneNumber)}</Text>
              </View>
              <ChevronRight color={colors.textMuted} size={16} strokeWidth={2} />
            </Pressable>

            <Pressable style={[s.menuItem, s.menuBorder]} onPress={() => setShowNotifModal(true)}>
              <View style={s.menuIconBox}>
                <Bell color={colors.midTeal} size={18} strokeWidth={2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.menuLabel}>Notification Settings</Text>
                <Text style={s.menuSub}>Order alerts & SMS updates</Text>
              </View>
              <ChevronRight color={colors.textMuted} size={16} strokeWidth={2} />
            </Pressable>
          </View>
        </View>

        {/* SUPPORT & LEGAL */}
        <View style={s.sectionWrap}>
          <Text style={s.sectionTitle}>SUPPORT & LEGAL</Text>
          <View style={s.menuCard}>
            <Pressable style={s.menuItem} onPress={() => navigation.navigate('LegalDoc', { type: 'terms' })}>
              <View style={s.menuIconBox}>
                <FileText color={colors.midTeal} size={18} strokeWidth={2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.menuLabel}>Terms of Service</Text>
                <Text style={s.menuSub}>User agreement & policies</Text>
              </View>
              <ChevronRight color={colors.textMuted} size={16} strokeWidth={2} />
            </Pressable>

            <Pressable style={[s.menuItem, s.menuBorder]} onPress={() => navigation.navigate('LegalDoc', { type: 'privacy' })}>
              <View style={s.menuIconBox}>
                <Lock color={colors.midTeal} size={18} strokeWidth={2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.menuLabel}>Privacy Policy</Text>
                <Text style={s.menuSub}>Data protection & security</Text>
              </View>
              <ChevronRight color={colors.textMuted} size={16} strokeWidth={2} />
            </Pressable>

            <Pressable style={[s.menuItem, s.menuBorder]} onPress={() => navigation.navigate('LegalDoc', { type: 'faq' })}>
              <View style={s.menuIconBox}>
                <HelpCircle color={colors.midTeal} size={18} strokeWidth={2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.menuLabel}>Help center</Text>
                <Text style={s.menuSub}>FAQ and chat support</Text>
              </View>
              <ChevronRight color={colors.textMuted} size={16} strokeWidth={2} />
            </Pressable>
          </View>
        </View>

        {/* Sign Out */}
        <TouchableOpacity 
          style={s.signOutBtn} 
          activeOpacity={0.6}
          onPress={() => {
            logout();
            if (Platform.OS === 'web') {
              window.alert('You have been successfully signed out.');
            } else {
              Alert.alert('Sign Out', 'You have been successfully signed out.');
            }
          }}
        >
          <LogOut color={colors.error} size={18} strokeWidth={2.5} />
          <Text style={s.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={s.versionText}>MediPick · Licensed Pharmacy Network</Text>
      </Animated.ScrollView>

      {/* Change Phone Modal */}
      <Modal visible={showPhoneModal} animationType="slide" transparent onRequestClose={closePhoneModal}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={s.modalOverlay}
        >
          <View style={s.modalCard}>
            <TouchableOpacity style={s.closeBtn} onPress={closePhoneModal}>
              <X color={colors.textDark} size={18} strokeWidth={2.5} />
            </TouchableOpacity>

            <Text style={s.modalTitle}>{phoneStep === 'input' ? 'Change Phone Number' : 'Verify New Number'}</Text>
            <Text style={s.modalSub}>
              {phoneStep === 'input' ? `Current number: ${maskPhoneNumber(user.phoneNumber)}` : `Enter the 6-digit code sent to ${newPhone}`}
            </Text>

            {phoneStep === 'input' ? (
              <TextInput
                style={s.textInput}
                placeholder="Enter new phone number..."
                placeholderTextColor={colors.textMuted}
                keyboardType="phone-pad"
                value={newPhone}
                onChangeText={setNewPhone}
                autoFocus
              />
            ) : (
              <View style={s.otpContainer}>
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <View key={i} style={[s.otpBox, otp.length > i && s.otpBoxFilled]}>
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
                  }}
                  autoFocus
                />
              </View>
            )}

            <Button
              title={phoneStep === 'input' ? 'Send OTP' : 'Verify & Update'}
              variant="primary"
              onPress={handleUpdatePhone}
              style={{ marginTop: 6 }}
              isLoading={loading}
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Notification Settings Modal */}
      <Modal visible={showNotifModal} animationType="slide" transparent onRequestClose={() => setShowNotifModal(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <TouchableOpacity style={s.closeBtn} onPress={() => setShowNotifModal(false)}>
              <X color={colors.textDark} size={18} strokeWidth={2.5} />
            </TouchableOpacity>

            <Text style={s.modalTitle}>Notification Preferences</Text>

            <View style={s.switchRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.switchTitle}>Push Notifications</Text>
                <Text style={s.switchSub}>Real-time order quote and pickup alerts</Text>
              </View>
              <Switch value={user.pushNotificationsEnabled} onValueChange={handleTogglePush} trackColor={{ false: '#CBD5E1', true: colors.midTeal }} />
            </View>

            <View style={s.switchRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.switchTitle}>Email Receipts</Text>
                <Text style={s.switchSub}>Get invoices & summaries via email</Text>
              </View>
              <Switch value={user.emailReceiptsEnabled} onValueChange={handleToggleEmail} trackColor={{ false: '#CBD5E1', true: colors.midTeal }} />
            </View>

            <Button
              title="Save Preferences"
              variant="primary"
              onPress={() => {
                setShowNotifModal(false);
                Platform.OS === 'web' ? window.alert('Notification settings saved.') : Alert.alert('Saved', 'Notification settings saved.');
              }}
              style={{ marginTop: 10 }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgWarm },
  scroll: { padding: 16, paddingTop: 56, paddingBottom: 100, gap: 16 },

  profileCard: {
    backgroundColor: colors.surfaceWhite, borderRadius: 20, padding: 18,
    borderWidth: 1.5, borderColor: colors.borderSoft, gap: 16,
    shadowColor: '#0F172A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatarCircle: {
    width: 54, height: 54, borderRadius: 27,
    backgroundColor: colors.midTeal, justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontFamily: FONTS.black, fontSize: 22, color: '#FFFFFF' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  userName: { fontFamily: FONTS.black, fontSize: 20, color: colors.textDark, letterSpacing: -0.4 },
  userPhone: { fontFamily: FONTS.medium, fontSize: 13, color: colors.textMuted, marginTop: 2 },
  verifiedTag: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.limeWhisper, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999,
    borderWidth: 1, borderColor: '#D6EDA0', // Could make these dynamic too
  },
  verifiedText: { fontFamily: FONTS.bold, fontSize: 11, color: colors.midTeal },
  strikeTag: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.warningLight, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999,
    borderWidth: 1, borderColor: '#FDE68A',
  },
  strikeText: { fontFamily: FONTS.bold, fontSize: 10, color: colors.warning },

  sectionWrap: { gap: 8 },
  sectionTitle: { fontFamily: FONTS.bold, fontSize: 11, color: colors.textMuted, letterSpacing: 0.8 },
  menuCard: {
    backgroundColor: colors.surfaceWhite, borderRadius: 16,
    borderWidth: 1, borderColor: colors.borderSoft, overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14,
  },
  switchRowItem: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14,
  },
  menuBorder: { borderTopWidth: 1, borderTopColor: colors.borderSoft },
  menuIconBox: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: colors.limeWhisper, justifyContent: 'center', alignItems: 'center',
  },
  menuLabel: { fontFamily: FONTS.bold, fontSize: 14, color: colors.textDark },
  menuSub: { fontFamily: FONTS.regular, fontSize: 12, color: colors.textMuted, marginTop: 1 },

  signOutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 18, marginTop: 4,
  },
  signOutText: { fontFamily: FONTS.bold, fontSize: 14, color: colors.error },
  versionText: { fontFamily: FONTS.medium, fontSize: 11, color: colors.textMuted, textAlign: 'center', marginTop: 4 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: colors.surfaceWhite, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, gap: 12, position: 'relative',
  },
  closeBtn: {
    position: 'absolute', top: 16, right: 16,
    width: 32, height: 32, borderRadius: 16, backgroundColor: colors.bgWarm,
    justifyContent: 'center', alignItems: 'center', zIndex: 10,
  },
  modalTitle: { fontFamily: FONTS.black, fontSize: 20, color: colors.textDark },
  modalSub: { fontFamily: FONTS.medium, fontSize: 13, color: colors.textMuted },
  textInput: {
    width: '100%', backgroundColor: colors.bgWarm, borderRadius: 14,
    borderWidth: 1, borderColor: colors.borderSoft, paddingHorizontal: 14, height: 48,
    fontFamily: FONTS.medium, fontSize: 14, color: colors.textDark,
    outlineStyle: 'none' as any, outlineWidth: 0 as any,
  },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  switchTitle: { fontFamily: FONTS.bold, fontSize: 14, color: colors.textDark },
  switchSub: { fontFamily: FONTS.medium, fontSize: 12, color: colors.textMuted, marginTop: 2 },
  
  otpContainer: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 10, position: 'relative' },
  otpBox: { 
    width: 46, height: 56, borderRadius: 12, backgroundColor: colors.bgWarm,
    borderWidth: 1, borderColor: colors.borderSoft, justifyContent: 'center', alignItems: 'center'
  },
  otpBoxFilled: { borderColor: colors.softLime, backgroundColor: colors.limeWhisper },
  otpText: { fontFamily: FONTS.black, fontSize: 22, color: colors.textDark },
  hiddenOtpInput: { position: 'absolute', width: '100%', height: '100%', opacity: 0 },
});

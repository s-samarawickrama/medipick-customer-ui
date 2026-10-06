import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Image,
  Modal,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useOrders } from '../../context/OrderContext';
import {
  ChevronLeft,
  AlertTriangle,
  Clock,
  Camera,
  Image as ImageIcon,
  X,
  Plus,
  CheckCircle2,
  MessageSquare,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { useTheme, ThemeColors } from '../../context/ThemeContext';
import { FONTS } from '../../theme/typography';
import { MainStackParamList } from '../../navigation/MainNavigator';

type Nav = NativeStackNavigationProp<MainStackParamList>;
type Route = RouteProp<MainStackParamList, 'ReportIssue'>;

const ISSUE_TYPES = [
  'Missing medicine',
  'Wrong medicine',
  'Damaged / Expired',
  'Wrong quantity',
  'Other',
];

export const ReportIssueScreen = () => {
  const { isDark, colors } = useTheme();
  const styles = makeStyles(colors, isDark);
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { reportIssue } = useOrders();
  const orderId = route.params?.orderId;
  const [issueType, setIssueType] = useState('');
  const [description, setDescription] = useState('');
  const [attachedPhotos, setAttachedPhotos] = useState<string[]>([]);
  const [pickerModalVisible, setPickerModalVisible] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const opacity = useRef(new Animated.Value(0)).current;
  const slideY = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    StatusBar.setBarStyle(isDark ? 'light-content' : 'dark-content');
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 320, useNativeDriver: true }),
      Animated.spring(slideY, { toValue: 0, useNativeDriver: true, speed: 22 }),
    ]).start();
  }, []);

  const requestPermission = async (type: 'camera' | 'gallery'): Promise<boolean> => {
    if (Platform.OS === 'web') return true;
    try {
      if (type === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        return status === 'granted';
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        return status === 'granted';
      }
    } catch {
      return false;
    }
  };

  const handlePickImage = async (source: 'camera' | 'gallery') => {
    setPickerModalVisible(false);

    try {
      const ok = await requestPermission(source);
      if (!ok) return;

      let result;
      if (source === 'camera') {
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.85,
          allowsEditing: true,
          aspect: [4, 3],
          exif: false,
        });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.85,
          allowsEditing: true,
          aspect: [4, 3],
          exif: false,
          selectionLimit: 1,
        });
      }

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setAttachedPhotos((prev) => [...prev, result.assets[0].uri]);
      }
    } catch {
      // silently fail if picker is unavailable
    }
  };

  const handleRemovePhoto = (index: number) => {
    setAttachedPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!issueType || !description.trim()) return;
    setIsLoading(true);
    setTimeout(() => {
      if (orderId) {
        reportIssue(orderId, issueType, description);
      }
      setIsLoading(false);
      setSubmitted(true);
    }, 1200);
  };

  if (submitted) {
    return (
      <View style={styles.screen}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.bgWarm} />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
            <ChevronLeft color={colors.midTeal} size={20} strokeWidth={2.5} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Issue Reported</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.successScreen}>
          <View style={styles.successIcon}>
            <AlertTriangle color={colors.warning} size={40} strokeWidth={2} />
          </View>
          <Text style={styles.successTitle}>Report Submitted</Text>
          <Text style={styles.successDesc}>
            Your issue{attachedPhotos.length > 0 ? ` and ${attachedPhotos.length} photo(s)` : ''} have been sent to the pharmacy team. You'll get a response within 24 hours.
          </Text>
          <Button
            title="Go to Orders"
            variant="primary"
            onPress={() => navigation.navigate('Tabs', { screen: 'Orders' })}
            style={{ marginTop: 24 }}
          />
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.bgWarm} />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <ChevronLeft color={colors.midTeal} size={20} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Report Issue</Text>
        <View style={{ width: 36 }} />
      </View>

      <Animated.ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        style={{ opacity, transform: [{ translateY: slideY }] }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Pharmacovigilance & Support Card */}
        <View style={styles.warningCard}>
          <View style={styles.warningHeaderRow}>
            <View style={styles.warningIconBadge}>
              <AlertTriangle color={colors.warning} size={16} strokeWidth={2.5} />
            </View>
            <Text style={styles.warningTitle}>Pharmacy Support</Text>
            <View style={{ flex: 1 }} />
            <View style={styles.orderBadgePill}>
              <Text style={styles.orderBadgeText}>#MP123456</Text>
            </View>
          </View>
          <Text style={styles.warningText}>
            Report dispensing errors, missing items, or adverse drug reactions below. For medical emergencies, please contact emergency services immediately.
          </Text>
          <Button
            title="Chat with Pharmacist"
            variant="outline"
            size="sm"
            icon={<MessageSquare color={colors.midTeal} size={16} strokeWidth={2.2} />}
            fullWidth={false}
            onPress={() => navigation.navigate('PharmacyChat', { orderId: orderId || '' })}
            style={{ marginTop: 12, alignSelf: 'flex-start' }}
          />
        </View>

        {/* Issue Type Chip Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Select Issue Type</Text>
          <View style={styles.issueGrid}>
            {ISSUE_TYPES.map((t) => {
              const active = issueType === t;
              return (
                <TouchableOpacity
                  key={t}
                  style={[styles.issueChip, active && styles.issueChipActive]}
                  onPress={() => setIssueType(t)}
                  activeOpacity={0.8}
                >
                  {active && <CheckCircle2 color="#FFFFFF" size={14} strokeWidth={2.5} />}
                  <Text style={[styles.issueChipText, active && styles.issueChipTextActive]}>
                    {t}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Description Input */}
        <View style={styles.section}>
          <Input
            label="Details & Comments"
            placeholder="Explain what was wrong with your order..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            style={{ height: 100, textAlignVertical: 'top', paddingTop: 12 }}
          />
        </View>

        {/* Photo Evidence Hero Zone */}
        <View style={styles.section}>
          <View style={styles.photoHeaderRow}>
            <Text style={styles.sectionLabel}>Photo Evidence (Optional)</Text>
            {attachedPhotos.length > 0 && (
              <Text style={styles.photoCountText}>{attachedPhotos.length} Attached</Text>
            )}
          </View>

          {attachedPhotos.length === 0 ? (
            /* Hero-style upload zone matching UploadPrescription visual quality */
            <>
              <TouchableOpacity style={styles.cameraZone} onPress={() => handlePickImage('camera')} activeOpacity={0.88}>
                <View style={[styles.cameraCircle, { backgroundColor: 'transparent', overflow: 'visible', padding: 0 }]}>
                  <Image source={require('../../../assets/images/prescription_camera.png')} style={{ width: 64, height: 64, transform: [{ scale: 1.6 }] }} resizeMode="cover" />
                </View>
                <Text style={styles.cameraTitle}>Attach Photo Evidence</Text>
                <Text style={styles.cameraSub}>Take a photo to show the issue clearly</Text>
              </TouchableOpacity>

              <View style={styles.orRow}>
                <View style={styles.orLine} />
                <Text style={styles.orText}>OR</Text>
                <View style={styles.orLine} />
              </View>

              <TouchableOpacity style={styles.fileBtn} onPress={() => handlePickImage('gallery')} activeOpacity={0.8}>
                <ImageIcon color={colors.midTeal} size={20} strokeWidth={2.2} />
                <Text style={styles.fileBtnText}>Upload from Gallery</Text>
              </TouchableOpacity>
            </>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photoList}>
              {attachedPhotos.map((uri, idx) => (
                <View key={idx} style={styles.photoThumbWrap}>
                  <Image source={{ uri }} style={styles.photoThumb} resizeMode="cover" />
                  <TouchableOpacity
                    style={styles.removePhotoBadge}
                    onPress={() => handleRemovePhoto(idx)}
                    activeOpacity={0.8}
                  >
                    <X color="#FFFFFF" size={12} strokeWidth={3} />
                  </TouchableOpacity>
                </View>
              ))}

              {attachedPhotos.length < 3 && (
                <TouchableOpacity
                  style={styles.addMorePhotoBtn}
                  onPress={() => setPickerModalVisible(true)}
                  activeOpacity={0.8}
                >
                  <Plus color={colors.midTeal} size={22} strokeWidth={2.5} />
                  <Text style={styles.addMoreText}>Add</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          )}
        </View>

        {/* Submit Button */}
        <Button
          title="Submit Report"
          variant="danger"
          onPress={handleSubmit}
          isLoading={isLoading}
          disabled={!issueType || !description.trim()}
          style={{ marginTop: 8 }}
        />

        <Text style={styles.footNote}>
          Your report will be sent to MediCare Central Pharmacy for resolution.
        </Text>
      </Animated.ScrollView>
    </KeyboardAvoidingView>
  );
};

const makeStyles = (colors: ThemeColors, isDark: boolean) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgWarm },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 52, paddingBottom: 12, paddingHorizontal: 20,
    backgroundColor: colors.bgWarm,
    borderBottomWidth: 1, borderBottomColor: colors.borderSoft,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: colors.surfaceWhite,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: colors.borderSoft,
  },
  headerTitle: {
    flex: 1, textAlign: 'center', fontSize: 16,
    fontFamily: FONTS.bold, color: colors.textDark,
  },
  scroll: { padding: 16, paddingBottom: 60, gap: 16 },

  warningCard: {
    backgroundColor: colors.surfaceWhite,
    borderRadius: 16, padding: 14, gap: 8,
    borderWidth: 1, borderColor: colors.borderSoft,
  },
  warningHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  warningIconBadge: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: isDark ? colors.warningLight : '#FEF3C7',
    justifyContent: 'center', alignItems: 'center',
  },
  warningTitle: { fontSize: 14, fontFamily: FONTS.bold, color: colors.textDark },
  orderBadgePill: {
    backgroundColor: colors.bgWarm, paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 8, borderWidth: 1, borderColor: colors.borderSoft,
  },
  orderBadgeText: { fontSize: 11, fontFamily: FONTS.bold, color: colors.midTeal },
  warningText: { fontSize: 12, fontFamily: FONTS.medium, color: colors.textMuted, lineHeight: 18 },

  section: { gap: 8 },
  sectionLabel: { fontSize: 13, fontFamily: FONTS.bold, color: colors.textDark },
  issueGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  issueChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20,
    backgroundColor: colors.surfaceWhite,
    borderWidth: 1, borderColor: colors.borderSoft,
  },
  issueChipActive: {
    backgroundColor: colors.midTeal, borderColor: colors.midTeal,
    shadowColor: colors.midTeal, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2, shadowRadius: 6, elevation: 2,
  },
  issueChipText: { fontSize: 13, fontFamily: FONTS.bold, color: colors.textSecondary },
  issueChipTextActive: { color: '#FFFFFF', fontFamily: FONTS.bold },

  photoHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  photoCountText: { fontSize: 12, fontFamily: FONTS.bold, color: colors.midTeal },

  // ── Hero Upload Zone (like UploadPrescription) ──
  cameraZone: {
    backgroundColor: colors.surfaceWhite, borderRadius: 18, padding: 32,
    alignItems: 'center', gap: 8,
    borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.deepTeal,
  },
  cameraCircle: {
    width: 68, height: 68, borderRadius: 34,
    backgroundColor: colors.limeWhisper, justifyContent: 'center', alignItems: 'center',
    marginBottom: 4,
  },
  cameraTitle: { fontFamily: FONTS.black, fontSize: 18, color: colors.peacockBlue },
  cameraSub: { fontFamily: FONTS.medium, fontSize: 13, color: colors.textMuted, textAlign: 'center' },

  orRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 8 },
  orLine: { flex: 1, height: 1, backgroundColor: colors.borderSoft },
  orText: { fontFamily: FONTS.bold, fontSize: 11, color: colors.textMuted },

  fileBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: colors.surfaceWhite, borderRadius: 12,
    borderWidth: 1.5, borderColor: colors.borderSoft, height: 50, paddingHorizontal: 15,
  },
  fileBtnText: { fontFamily: FONTS.bold, fontSize: 14, color: colors.peacockBlue },

  photoList: { flexDirection: 'row', gap: 12, paddingVertical: 4 },
  photoThumbWrap: { position: 'relative', width: 76, height: 76, borderRadius: 14, overflow: 'visible' },
  photoThumb: { width: 76, height: 76, borderRadius: 14, borderWidth: 1, borderColor: colors.borderSoft },
  removePhotoBadge: {
    position: 'absolute', top: -6, right: -6,
    backgroundColor: colors.error,
    width: 22, height: 22, borderRadius: 11,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: colors.surfaceWhite, elevation: 3,
  },
  addMorePhotoBtn: {
    width: 76, height: 76, borderRadius: 14,
    borderWidth: 1.5, borderColor: colors.borderSoft, borderStyle: 'dashed',
    backgroundColor: colors.surfaceWhite,
    justifyContent: 'center', alignItems: 'center', gap: 2,
  },
  addMoreText: { fontSize: 10, fontFamily: FONTS.bold, color: colors.midTeal },
  footNote: {
    fontSize: 12, fontFamily: FONTS.medium, color: colors.textMuted,
    textAlign: 'center', lineHeight: 17,
  },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(15,23,42,0.45)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: colors.surfaceWhite,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, paddingBottom: Platform.OS === 'ios' ? 36 : 24, gap: 12,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 4 },
  modalTitle: { fontSize: 16, fontFamily: FONTS.black, color: colors.textDark },
  modalOption: {
    flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14,
    borderRadius: 14, backgroundColor: colors.bgWarm,
    borderWidth: 1, borderColor: colors.borderSoft,
  },
  modalOptionIcon: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: colors.limeWhisper, justifyContent: 'center', alignItems: 'center',
  },
  modalOptionTitle: { fontSize: 14, fontFamily: FONTS.bold, color: colors.textDark },
  modalOptionSub: { fontSize: 12, fontFamily: FONTS.medium, color: colors.textMuted, marginTop: 1 },
  cancelBtn: { paddingVertical: 12, alignItems: 'center', marginTop: 4 },
  cancelBtnText: { fontSize: 14, fontFamily: FONTS.bold, color: colors.textMuted },

  // Success state
  successScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  successIcon: {
    width: 88, height: 88, borderRadius: 30,
    backgroundColor: isDark ? colors.warningLight : '#FEF3C7',
    justifyContent: 'center', alignItems: 'center', marginBottom: 20,
  },
  successTitle: { fontSize: 24, fontFamily: FONTS.black, color: colors.textDark, marginBottom: 10, letterSpacing: -0.5 },
  successDesc: { fontSize: 14, fontFamily: FONTS.medium, color: colors.textMuted, textAlign: 'center', lineHeight: 21 },
});

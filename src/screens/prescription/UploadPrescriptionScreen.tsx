import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Animated,
  TouchableOpacity, StatusBar, TextInput, Image, Platform, Pressable, Alert,
  KeyboardAvoidingView, Modal,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ChevronLeft, ChevronRight, Camera, ImagePlus, CheckCircle2,
  Trash2, MessageSquare, AlertCircle, ShoppingBag, Plus, Minus, Check, Store, Search, X, Info, CheckSquare, Square
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { Button } from '../../components/common/Button';
import { useTheme, ThemeColors } from '../../context/ThemeContext';
import { FONTS } from '../../theme/typography';
import { MainStackParamList } from '../../navigation/MainNavigator';

import { useCart } from '../../context/CartContext';
import { MedicineItem } from '../../types';
import { listMedicines } from '../../api/medicinesApi';
import { getLocalImage } from '../../utils/imageMapper';

const FUN_3D_BAG = require('../../../assets/images/clay_bag_white.png');

type Nav = NativeStackNavigationProp<MainStackParamList>;
type Route = RouteProp<MainStackParamList, 'UploadPrescription'>;

export const UploadPrescriptionScreen = () => {
  const { isDark, colors } = useTheme();
  const s = makeStyles(colors, isDark);
  const navigation = useNavigation<Nav>();
  const route      = useRoute<Route>();
  const targetPharmacyId   = route.params?.pharmacyId;
  const targetPharmacyName = route.params?.pharmacyName;
  const { setAttachedPrescription, addToCart } = useCart();

  const [note, setNote]                   = useState('');
  const [image, setImage]                 = useState<string | null>(null);
  const [allowGenericSubstitutions, setAllowGenericSubstitutions] = useState(false);
  
  // Track extra items quantity dictionary: { [itemId]: quantity }
  const [selectedItemQtys, setSelectedItemQtys] = useState<Record<string, number>>(
    route.params?.initialSelectedExtraItems || {}
  );

  const [itemSearchQuery, setItemSearchQuery] = useState('');
  const [apiCatalog, setApiCatalog] = useState<any[]>([]);
  const [detailModalItem, setDetailModalItem] = useState<any | null>(null);
  const [currentPage, setCurrentPage]         = useState(1);
  const ITEMS_PER_PAGE = 4;

  const opacity = useRef(new Animated.Value(0)).current;
  const slideY  = useRef(new Animated.Value(14)).current;

  useEffect(() => {
    let isMounted = true;
    listMedicines().then((res) => {
      if (isMounted && res?.data) {
        const formatted = res.data.map((m: any) => ({
          id: m.id,
          name: m.name,
          dosage: m.dosage || 'Standard',
          price: `LKR ${(m.pharmacyPrice || m.mrpPrice || 0).toFixed(2)}`,
          image: m.image,
          description: m.description || m.genericName || 'Prescription / OTC Item',
          category: m.category,
        }));
        setApiCatalog(formatted);
      }
    }).catch((err) => console.log('Error fetching catalog:', err));
    return () => { isMounted = false; };
  }, []);

  // OTC Catalog items for extra requested items
  const catalogList = [
    ...apiCatalog,
  ];

  const filteredCatalog = catalogList.filter((item) =>
    item.name.toLowerCase().includes(itemSearchQuery.trim().toLowerCase()) ||
    (item.dosage && item.dosage.toLowerCase().includes(itemSearchQuery.trim().toLowerCase()))
  );

  const totalPages = Math.max(1, Math.ceil(filteredCatalog.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedCatalog = filteredCatalog.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [itemSearchQuery]);


  const setItemQty = (id: string, delta: number) => {
    setSelectedItemQtys((prev) => {
      const current = prev[id] || 0;
      const next = current + delta;
      if (next <= 0) {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      }
      return { ...prev, [id]: next };
    });
  };

  useEffect(() => {
    StatusBar.setBarStyle('dark-content');
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 280, useNativeDriver: true }),
      Animated.spring(slideY, { toValue: 0, useNativeDriver: true, speed: 26 }),
    ]).start();
  }, []);

  const requestPermission = async (type: 'camera' | 'gallery'): Promise<boolean> => {
    if (Platform.OS === 'web') return true;
    if (type === 'camera') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      return status === 'granted';
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      return status === 'granted';
    }
  };

  const takePhoto = async () => {
    try {
      const ok = await requestPermission('camera');
      if (!ok) {
        if (Platform.OS === 'web') {
          window.alert('Camera permission denied.');
        } else {
          Alert.alert('Permission Denied', 'Camera permission is required.');
        }
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.85,
        allowsEditing: true,
        aspect: [4, 3],
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImage(result.assets[0].uri);
      }
    } catch (e) {
      console.log('Error taking photo:', e);
    }
  };

  const pickFromGallery = async () => {
    try {
      const ok = await requestPermission('gallery');
      if (!ok) {
        if (Platform.OS === 'web') {
          window.alert('Gallery permission denied.');
        } else {
          Alert.alert('Permission Denied', 'Gallery permission is required.');
        }
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.85,
        allowsEditing: true,
        aspect: [4, 3],
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImage(result.assets[0].uri);
      }
    } catch (e) {
      console.log('Error picking gallery photo:', e);
    }
  };

  const clearImage = () => setImage(null);

  const proceed = () => {
    if (!image) {
      if (Platform.OS === 'web') {
        window.alert('Please take a photo or upload an image of your prescription first.');
      } else {
        Alert.alert('Missing Prescription', 'Please take a photo or upload an image of your prescription first.');
      }
      return;
    }

    if (targetPharmacyId && targetPharmacyName) {
      setAttachedPrescription({
        image,
        note,
        pharmacyId: targetPharmacyId,
        pharmacyName: targetPharmacyName,
        allowGenericSubstitutions,
      });

      // Add all selected OTC items to the cart
      Object.entries(selectedItemQtys).forEach(([itemId, qty]) => {
        const item = catalogList.find((c) => c.id === itemId);
        if (item) {
          // Add it 'qty' times
          for (let i = 0; i < qty; i++) {
            addToCart({
              id: item.id,
              name: item.name,
              genericName: item.name,
              mrpPrice: parseFloat(item.price.replace(/[^\d.]/g, '')) || 0,
              pharmacyPrice: parseFloat(item.price.replace(/[^\d.]/g, '')) || 0,
              isRxRequired: false,
              image: item.image,
              dosage: item.dosage,
              category: (item.category as MedicineItem['category']) || 'Cold & Flu',
              inStock: true,
            }, {
              id: targetPharmacyId,
              name: targetPharmacyName,
              address: 'Pharmacy Address',
              distance: 'Distance'
            });
          }
        }
      });

      navigation.navigate('AIQualityCheck', {
        clarityScore: 94,
        pharmacyId: targetPharmacyId,
        pharmacyName: targetPharmacyName,
        nextScreen: 'MultiStoreCart',
      });
    } else {
      Alert.alert('Error', 'No pharmacy selected for this prescription.');
    }
  };

  const totalSelectedItemsCount = Object.values(selectedItemQtys).reduce((a, b) => a + b, 0);

  const totalSelectedPrice = Object.entries(selectedItemQtys).reduce((total, [id, qty]) => {
    const item = catalogList.find((c) => c.id === id);
    if (item && item.price) {
      const priceNum = parseFloat(item.price.replace(/[^\d.]/g, '')) || 0;
      return total + (priceNum * qty);
    }
    return total;
  }, 0);

  return (
    <KeyboardAvoidingView
      style={s.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.bgWarm} />
      <View style={s.nav}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.75} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <ChevronLeft color={colors.peacockBlue} size={20} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={s.navTitle}>{targetPharmacyName ? `Upload to ${targetPharmacyName}` : 'Upload Prescription'}</Text>
        <View style={{ width: 36 }} />
      </View>

      {totalSelectedItemsCount > 0 && (
        <View style={[s.targetBanner, { justifyContent: 'center', backgroundColor: colors.midTeal }]}>
          <Text style={{ fontFamily: FONTS.bold, fontSize: 14, color: colors.white }}>
            Cart Total: <Text style={{ fontFamily: FONTS.black }}>LKR {totalSelectedPrice.toFixed(2)}</Text> ({totalSelectedItemsCount} item{totalSelectedItemsCount !== 1 ? 's' : ''})
          </Text>
        </View>
      )}

      <Animated.ScrollView
        style={{ opacity, transform: [{ translateY: slideY }] }}
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Photo Preview or Camera Zone */}
        {image ? (
          <View style={s.previewContainer}>
            <Image source={{ uri: image }} style={s.previewImage} resizeMode="cover" />
            <View style={s.floatingIconOverlay}>
              <TouchableOpacity style={s.iconActionBtn} onPress={takePhoto} activeOpacity={0.8}>
                <Camera color="#FFFFFF" size={18} strokeWidth={2.2} />
              </TouchableOpacity>
              <TouchableOpacity style={s.iconActionBtn} onPress={pickFromGallery} activeOpacity={0.8}>
                <ImagePlus color="#FFFFFF" size={18} strokeWidth={2.2} />
              </TouchableOpacity>
              <TouchableOpacity style={[s.iconActionBtn, s.iconActionBtnDelete]} onPress={clearImage} activeOpacity={0.8}>
                <Trash2 color="#EF4444" size={18} strokeWidth={2.2} />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            <TouchableOpacity style={s.cameraZone} onPress={takePhoto} activeOpacity={0.88}>
              <View style={[s.cameraCircle, { backgroundColor: 'transparent', overflow: 'visible', padding: 0 }]}>
                <Image source={require('../../../assets/images/prescription_camera.png')} style={{ width: 64, height: 64, transform: [{ scale: 1.6 }] }} resizeMode="cover" />
              </View>
              <Text style={s.cameraTitle}>Take Prescription Photo</Text>
              <Text style={s.cameraSub}>Hold camera steady under bright lighting</Text>
            </TouchableOpacity>

            <View style={s.orRow}>
              <View style={s.orLine} />
              <Text style={s.orText}>OR</Text>
              <View style={s.orLine} />
            </View>

            <TouchableOpacity style={s.fileBtn} onPress={pickFromGallery} activeOpacity={0.8}>
              <ImagePlus color={colors.midTeal} size={20} strokeWidth={2.2} />
              <Text style={s.fileBtnText}>Upload from Gallery</Text>
            </TouchableOpacity>
          </>
        )}

        {!!image && (
          <>
            {/* Prescription Instructions / Notes Card */}
            <View style={s.noteContainer}>
              <View style={s.noteHeaderRow}>
                <MessageSquare color={colors.midTeal} size={16} strokeWidth={2.2} />
                <Text style={s.noteTitle}>Prescription Instructions for Pharmacist</Text>
              </View>
              <TextInput
                style={s.noteInput}
                placeholder="E.g. Only need the first 2 items listed, or 1-week supply..."
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={2}
                textAlignVertical="top"
                value={note}
                onChangeText={setNote}
              />
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                gap: 12,
                backgroundColor: allowGenericSubstitutions
                  ? (isDark ? '#1A2E1A' : colors.limeWhisper)
                  : colors.surfaceWhite,
                borderRadius: 14,
                padding: 14,
                borderWidth: 1,
                borderColor: allowGenericSubstitutions ? '#8BC34A' : colors.borderSoft,
                marginBottom: 16,
              }}
              onPress={() => setAllowGenericSubstitutions(v => !v)}
            >
              <View style={{ marginTop: 2 }}>
                {allowGenericSubstitutions
                  ? <CheckSquare color={colors.midTeal} size={22} strokeWidth={2.5} />
                  : <Square color={colors.borderSoft} size={22} strokeWidth={2.5} />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: FONTS.bold, fontSize: 13, color: colors.textDark }}>
                  Allow Generic Substitutions
                </Text>
                <Text style={{ fontFamily: FONTS.medium, fontSize: 11, color: colors.textMuted, marginTop: 3, lineHeight: 16 }}>
                  If a prescribed medicine is unavailable, the pharmacist may suggest a clinically equivalent generic alternative.{'\n'}
                  <Text style={{ fontFamily: FONTS.bold, color: colors.warning }}>⚠ Price may differ</Text>
                  {' '}— the pharmacy will quote before you pay.
                </Text>
              </View>
            </TouchableOpacity>
          </>
        )}
        <View style={s.extraItemsContainer}>
          <View style={s.extraHeaderBanner}>
            <View style={{ width: 56, height: 56, justifyContent: 'center', alignItems: 'center', backgroundColor: 'transparent', overflow: 'visible' }}>
              <Image source={require('../../../assets/images/clay_bag_white.png')} style={{ width: 56, height: 56, transform: [{ scale: 1.6 }] }} resizeMode="cover" />
            </View>
            <View style={{ flex: 1, gap: 3 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              </View>
              <Text style={s.catchyTitle}>Need anything else?</Text>
              <Text style={s.catchySub}>
                {targetPharmacyName 
                  ? `Add OTC essentials straight from ${targetPharmacyName}'s shelves to your pickup order!`
                  : "Add everyday essentials to get quotes for everything in one go!"}
              </Text>
            </View>
          </View>

            {/* Search Bar */}
            <View style={s.extraSearchBar}>
              <Search color={colors.textMuted} size={16} strokeWidth={2} />
              <TextInput
                style={s.extraSearchInput}
                placeholder="Search items (e.g. Panadol, Bandages)..."
                placeholderTextColor={colors.textMuted}
                value={itemSearchQuery}
                onChangeText={setItemSearchQuery}
              />
              {itemSearchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setItemSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <X color={colors.textMuted} size={16} strokeWidth={2} />
                </TouchableOpacity>
              )}
            </View>

            {itemSearchQuery.trim().length > 0 && filteredCatalog.length === 0 && (
              <View style={{ alignItems: 'center', marginVertical: 20 }}>
                <Image source={FUN_3D_BAG} style={{ width: 64, height: 64, opacity: 0.8, marginBottom: 12 }} resizeMode="contain" />
                <Text style={{ fontSize: 16, color: colors.textMuted, fontFamily: FONTS.medium, textAlign: 'center' }}>No medicines found for "{itemSearchQuery.trim()}"</Text>
              </View>
            )}

            {/* Premium 2-Column Grid Items List (Paginated) */}
            <View style={s.extraGrid}>
              {paginatedCatalog.map((item) => {
                const qty = selectedItemQtys[item.id] || 0;
                const isSelected = qty > 0;

                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[s.gridCard, isSelected && s.gridCardSelected]}
                    onPress={() => setDetailModalItem(item)}
                    activeOpacity={0.93}
                  >
                    {/* Image Box — same as Browse productImgBox */}
                    <View style={[s.gridImgBox, isSelected && s.gridImgBoxSelected]}>
                      <View style={{ width: '100%', height: '100%', borderRadius: 8, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' }}>
                        {item.image ? (
                          <Image
                            source={typeof item.image === 'string' && (item.image.startsWith('http') || item.image.startsWith('data:')) ? { uri: item.image } : getLocalImage(item.image) || (typeof item.image === 'string' ? { uri: item.image } : item.image)}
                            style={{ width: '100%', height: '100%', transform: [{ scale: 1.25 }] }}
                            resizeMode="cover"
                          />
                        ) : (
                          <Image source={FUN_3D_BAG} style={{ width: 44, height: 44 }} resizeMode="contain" />
                        )}
                      </View>
                      {/* Info overlay top-right */}
                      <TouchableOpacity
                        style={s.gridInfoBadge}
                        onPress={() => setDetailModalItem(item)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Info color="rgba(255,255,255,0.9)" size={13} strokeWidth={2.5} />
                      </TouchableOpacity>
                    </View>

                    {/* Name & Dosage */}
                    <Text style={s.gridProdName} numberOfLines={2}>{item.name}</Text>
                    <Text style={s.gridProdDosage} numberOfLines={1}>{item.dosage || 'Standard'}</Text>

                    {/* Footer: Price + Stepper */}
                    <View style={s.gridCardFooter}>
                      <View style={{ gap: 1 }}>
                        <Text style={s.gridProdPricePrefix}>Price</Text>
                        <Text style={s.gridProdPrice}>{item.price}</Text>
                      </View>
                      {isSelected ? (
                        <View style={s.gridStepperBox}>
                          <TouchableOpacity
                            style={s.gridStepBtn}
                            onPress={(e) => { e.stopPropagation?.(); setItemQty(item.id, -1); }}
                            activeOpacity={0.7}
                          >
                            <Minus color={colors.midTeal} size={12} strokeWidth={3} />
                          </TouchableOpacity>
                          <Text style={s.gridStepQty}>{qty}</Text>
                          <TouchableOpacity
                            style={s.gridStepBtn}
                            onPress={(e) => { e.stopPropagation?.(); setItemQty(item.id, 1); }}
                            activeOpacity={0.7}
                          >
                            <Plus color={colors.midTeal} size={12} strokeWidth={3} />
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={s.gridAddCircle}
                          onPress={(e) => { e.stopPropagation?.(); setItemQty(item.id, 1); }}
                          activeOpacity={0.85}
                        >
                          <Plus color="#FFF" size={14} strokeWidth={3} />
                        </TouchableOpacity>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Pagination Controls */}
            {filteredCatalog.length > ITEMS_PER_PAGE && (
              <View style={s.paginationContainer}>
                <Text style={s.paginationInfoText}>
                  Showing {startIndex + 1}–{Math.min(startIndex + ITEMS_PER_PAGE, filteredCatalog.length)} of {filteredCatalog.length} items
                </Text>
                <View style={s.paginationRow}>
                  <TouchableOpacity
                    style={[s.pageNavBtn, currentPage === 1 && s.pageNavBtnDisabled]}
                    disabled={currentPage === 1}
                    onPress={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    activeOpacity={0.7}
                  >
                    <ChevronLeft color={currentPage === 1 ? colors.borderSoft : colors.midTeal} size={16} strokeWidth={2.5} />
                  </TouchableOpacity>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <TouchableOpacity
                      key={pageNum}
                      style={[s.pageNumberBtn, pageNum === currentPage && s.pageNumberBtnActive]}
                      onPress={() => setCurrentPage(pageNum)}
                      activeOpacity={0.7}
                    >
                      <Text style={[s.pageNumberText, pageNum === currentPage && s.pageNumberTextActive]}>
                        {pageNum}
                      </Text>
                    </TouchableOpacity>
                  ))}

                  <TouchableOpacity
                    style={[s.pageNavBtn, currentPage === totalPages && s.pageNavBtnDisabled]}
                    disabled={currentPage === totalPages}
                    onPress={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    activeOpacity={0.7}
                  >
                    <ChevronRight color={currentPage === totalPages ? colors.borderSoft : colors.midTeal} size={16} strokeWidth={2.5} />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          <Button
            title="Continue to Quality Check"
            onPress={proceed}
            disabled={!image}
            style={{ marginTop: 4 }}
          />
      </Animated.ScrollView>

      {/* Product Details Modal */}
      <Modal visible={!!detailModalItem} animationType="slide" transparent onRequestClose={() => setDetailModalItem(null)}>
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <TouchableOpacity style={s.modalCloseBtn} onPress={() => setDetailModalItem(null)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <X color={colors.textDark} size={18} strokeWidth={2.5} />
            </TouchableOpacity>

            {detailModalItem && (
              <>
                <View style={s.modalImgBox}>
                  {detailModalItem.image ? (
                    <Image source={detailModalItem.image} style={s.modalImg} resizeMode="cover" />
                  ) : (
                    <ShoppingBag color={colors.midTeal} size={48} strokeWidth={2} />
                  )}
                </View>

                <Text style={s.modalTitle}>{detailModalItem.name}</Text>
                {detailModalItem.dosage && <Text style={s.modalDosage}>{detailModalItem.dosage}</Text>}

                <View style={s.modalPriceBadge}>
                  <Text style={s.modalPriceText}>{detailModalItem.price}</Text>
                </View>

                <Text style={s.modalDesc}>{detailModalItem.description}</Text>

                {/* Quantity Control in Modal */}
                <View style={s.modalFooterRow}>
                  <View style={s.modalQtyBox}>
                    <TouchableOpacity
                      style={s.modalQtyBtn}
                      onPress={() => setItemQty(detailModalItem.id, -1)}
                    >
                      <Minus color={colors.midTeal} size={16} strokeWidth={3} />
                    </TouchableOpacity>
                    <Text style={s.modalQtyText}>{selectedItemQtys[detailModalItem.id] || 0}</Text>
                    <TouchableOpacity
                      style={s.modalQtyBtn}
                      onPress={() => setItemQty(detailModalItem.id, 1)}
                    >
                      <Plus color={colors.midTeal} size={16} strokeWidth={3} />
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    style={s.modalAddDoneBtn}
                    onPress={() => setDetailModalItem(null)}
                  >
                    <Text style={s.modalAddDoneText}>Done</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const makeStyles = (colors: ThemeColors, isDark: boolean) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgWarm },
  nav: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: 52, paddingBottom: 12, paddingHorizontal: 20,
    backgroundColor: colors.surfaceWhite,
    borderBottomWidth: 1, borderBottomColor: colors.borderSoft,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: colors.surfaceSubtle, justifyContent: 'center', alignItems: 'center',
  },
  navTitle: { flex: 1, textAlign: 'center', fontFamily: FONTS.bold, fontSize: 16, color: colors.peacockBlue },
  scroll: { padding: 16, paddingBottom: 60, gap: 14 },

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

  orRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  orLine: { flex: 1, height: 1, backgroundColor: colors.borderSoft },
  orText: { fontFamily: FONTS.bold, fontSize: 11, color: colors.textMuted },

  fileBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: colors.surfaceWhite, borderRadius: 12,
    borderWidth: 1.5, borderColor: colors.borderSoft, height: 50, paddingHorizontal: 15,
  },
  fileBtnText: { fontFamily: FONTS.bold, fontSize: 14, color: colors.peacockBlue },

  previewContainer: {
    backgroundColor: colors.surfaceWhite, borderRadius: 18,
    overflow: 'hidden', borderWidth: 1.5, borderColor: colors.deepTeal,
    position: 'relative',
  },
  previewImage: { width: '100%', height: 220 },
  floatingIconOverlay: {
    position: 'absolute', bottom: 12, right: 12,
    flexDirection: 'row', gap: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.75)', padding: 6, borderRadius: 16,
  },
  iconActionBtn: {
    width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  iconActionBtnDelete: {
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
  },

  // Extra OTC Items Card
  extraItemsContainer: {
    backgroundColor: colors.surfaceWhite, borderRadius: 18, padding: 16,
    borderWidth: 1.5, borderColor: colors.borderSoft, gap: 12,
  },
  browseStoreBtn: {
    backgroundColor: colors.limeWhisper,
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(20, 184, 166, 0.2)',
  },
  browseStoreBtnText: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    color: colors.deepTeal,
  },
  extraHeaderBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  catchyIconBox: {
    width: 42, height: 42, borderRadius: 12,
    backgroundColor: colors.limeWhisper, justifyContent: 'center', alignItems: 'center',
  },
  needMedsBadge: {
    backgroundColor: '#FFF7ED', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
    borderWidth: 1, borderColor: '#FED7AA',
  },
  needMedsBadgeText: { fontFamily: FONTS.extrabold, fontSize: 8, color: '#EA580C', letterSpacing: 0.5 },
  catchyTitle: { fontFamily: FONTS.black, fontSize: 16, color: colors.peacockBlue, letterSpacing: -0.3 },
  catchySub: { fontFamily: FONTS.medium, fontSize: 11, color: colors.textMuted, lineHeight: 16 },

  totalBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.limeWhisper, paddingHorizontal: 16, paddingVertical: 14,
    borderRadius: 12, borderWidth: 1, borderColor: '#D6EDA0',
    marginTop: 4, marginBottom: 4,
  },
  totalBannerText: { fontFamily: FONTS.bold, fontSize: 14, color: colors.deepTeal },
  totalBannerPrice: { fontFamily: FONTS.black, fontSize: 16, color: colors.peacockBlue },

  extraSearchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.surfaceSubtle, borderRadius: 12, paddingHorizontal: 12, height: 42,
    borderWidth: 1, borderColor: colors.borderSoft,
  },
  extraSearchInput: { flex: 1, fontFamily: FONTS.medium, fontSize: 13, color: colors.textDark, height: '100%' },
  addCustomBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: colors.midTeal, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14,
  },
  addCustomBtnText: { fontFamily: FONTS.bold, fontSize: 13, color: '#FFFFFF' },
  // 2-col grid — matches Browse productCard/productImgBox exactly
  extraGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  gridCard: {
    width: '47.5%', backgroundColor: colors.surfaceWhite, borderRadius: 20, padding: 12,
    borderWidth: 1, borderColor: colors.borderSoft, gap: 4,
  },
  gridCardSelected: { borderColor: '#D6EDA0', backgroundColor: colors.limeWhisper },
  gridImgBox: {
    height: 120, backgroundColor: colors.limeWhisper, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center', position: 'relative', marginBottom: 6, padding: 6,
    overflow: 'hidden',
  },
  gridImgBoxSelected: { backgroundColor: '#EDF9E6' },
  gridInfoBadge: {
    position: 'absolute', top: 7, right: 7,
    backgroundColor: 'rgba(15,23,42,0.38)', borderRadius: 10, padding: 4,
  },
  gridProdName: { fontFamily: FONTS.bold, fontSize: 13, color: colors.textDark, lineHeight: 17 },
  gridProdDosage: { fontFamily: FONTS.medium, fontSize: 11, color: colors.textMuted },
  gridCardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 6 },
  gridProdPricePrefix: { fontFamily: FONTS.medium, fontSize: 10, color: colors.textMuted },
  gridProdPrice: { fontFamily: FONTS.black, fontSize: 13, color: colors.textDark },
  gridStepperBox: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.limeWhisper, borderRadius: 10, paddingHorizontal: 6, height: 30,
    borderWidth: 1, borderColor: '#D6EDA0',
  },
  gridStepBtn: { width: 18, height: 18, justifyContent: 'center', alignItems: 'center' },
  gridStepQty: { fontFamily: FONTS.black, fontSize: 12, color: colors.midTeal },
  gridAddCircle: {
    width: 30, height: 30, borderRadius: 10, backgroundColor: colors.midTeal,
    justifyContent: 'center', alignItems: 'center',
  },

  paginationContainer: {
    alignItems: 'center',
    marginTop: 14,
    gap: 8,
  },
  paginationInfoText: {
    fontFamily: FONTS.medium,
    fontSize: 12,
    color: colors.textMuted,
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pageNavBtn: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: colors.surfaceSubtle,
    justifyContent: 'center', alignItems: 'center',
  },
  pageNavBtnDisabled: {
    opacity: 0.4,
  },
  pageNumberBtn: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: colors.surfaceSubtle,
    justifyContent: 'center', alignItems: 'center',
  },
  pageNumberBtnActive: {
    backgroundColor: colors.midTeal,
  },
  pageNumberText: {
    fontFamily: FONTS.bold,
    fontSize: 13,
    color: colors.textMuted,
  },
  pageNumberTextActive: {
    color: '#FFFFFF',
  },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.45)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: colors.surfaceWhite, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, paddingBottom: Platform.OS === 'ios' ? 36 : 24, gap: 10, position: 'relative',
  },
  modalCloseBtn: {
    position: 'absolute', top: 16, right: 16, width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.surfaceSubtle, justifyContent: 'center', alignItems: 'center', zIndex: 10,
  },
  modalImgBox: {
    height: 180, backgroundColor: colors.limeWhisper, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center', marginVertical: 6,
    overflow: 'hidden', borderWidth: 1, borderColor: '#D6EDA0',
  },
  modalImg: { width: '100%', height: '100%' },
  modalTitle: { fontFamily: FONTS.black, fontSize: 18, color: colors.textDark },
  modalDosage: { fontFamily: FONTS.bold, fontSize: 13, color: colors.textMuted },
  modalPriceBadge: {
    alignSelf: 'flex-start', backgroundColor: colors.limeWhisper,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
    borderWidth: 1, borderColor: '#D6EDA0',
  },
  modalPriceText: { fontFamily: FONTS.black, fontSize: 13, color: colors.midTeal },
  modalDesc: { fontFamily: FONTS.regular, fontSize: 13, color: colors.textSecondary, lineHeight: 20, marginVertical: 4 },
  modalFooterRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
  modalQtyBox: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.surfaceSubtle, borderRadius: 12, paddingHorizontal: 12, height: 44,
    borderWidth: 1, borderColor: colors.borderSoft,
  },
  modalQtyBtn: { width: 28, height: 28, justifyContent: 'center', alignItems: 'center' },
  modalQtyText: { fontFamily: FONTS.black, fontSize: 15, color: colors.midTeal },
  modalAddDoneBtn: {
    flex: 1, backgroundColor: colors.midTeal, borderRadius: 12, height: 44,
    justifyContent: 'center', alignItems: 'center',
  },
  modalAddDoneText: { fontFamily: FONTS.bold, fontSize: 14, color: '#FFF' },

  noteContainer: {
    backgroundColor: colors.surfaceWhite, borderRadius: 16, padding: 14,
    borderWidth: 1.5, borderColor: colors.borderSoft, gap: 8,
  },
  noteHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  noteTitle: { fontFamily: FONTS.bold, fontSize: 13, color: colors.peacockBlue },
  noteInput: {
    backgroundColor: colors.surfaceSubtle, borderRadius: 12, padding: 12,
    fontFamily: FONTS.medium, fontSize: 13, color: colors.textDark,
    minHeight: 70, borderWidth: 1, borderColor: colors.borderSoft,
  },
  targetBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.limeWhisper, paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#D6EDA0',
  },
  targetBannerText: { fontFamily: FONTS.medium, fontSize: 13, color: colors.deepTeal },
});

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, TextInput, StatusBar, Pressable, Modal,
  KeyboardAvoidingView, Platform, Image, Linking, Dimensions, ActivityIndicator
} from 'react-native';
import { Search, Pill, X, ShoppingBag, Store, Star, MapPin, Check, Plus, Minus, ChevronLeft, ChevronRight, PhoneCall, MessageSquare, ShoppingCart, FileText, Clock, Heart, Navigation, Phone, Camera } from 'lucide-react-native';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme, ThemeColors } from '../../context/ThemeContext';
import { FONTS } from '../../theme/typography';
import { listMedicines, getMedicine } from '../../api/medicinesApi';
import { pharmacyService } from '../../services/pharmacyService';
import { MedicineItem as Medicine, Pharmacy } from '../../types';
import { MainStackParamList } from '../../navigation/MainNavigator';
import { MapPreview } from '../../components/MapPreview';
import { useCart } from '../../context/CartContext';
import { MedicineCard } from '../../components/common/MedicineCard';
import { getLocalImage } from '../../utils/imageMapper';
import { useLocation } from '../../context/LocationContext';

const FUN_3D_BAG = require('../../../assets/images/clay_bag_white.png');

type Nav = NativeStackNavigationProp<MainStackParamList>;
type BrowseRoute = RouteProp<MainStackParamList, 'Browse'>;
const MED_CATEGORIES = ['All', 'Chronic', 'Cold & Flu', 'Vitamins', 'First Aid', 'Supplements', 'Skincare', 'Personal Care', 'Baby Care'];

export const BrowseOTCScreen = () => {
  const { isDark, colors } = useTheme();
  const s = makeStyles(colors);
  const navigation = useNavigation<Nav>();
  const route = useRoute<BrowseRoute>();
  const { cartItems: globalCart, addToCart, updateQuantity, subtotal } = useCart();
  const { coords } = useLocation();

  const [mode,             setMode]             = useState<'meds' | 'pharmacies'>('meds');
  const [query,            setQuery]            = useState('');
  const [medCategory,      setMedCategory]      = useState('All');
  const [pharmacySort,     setPharmacySort]     = useState<'distance' | 'rating'>('distance');
  const [activeStore,      setActiveStore]      = useState<Pharmacy | null>(null);
  const [storeQuery,       setStoreQuery]       = useState('');
  const [selectedMedModal, setSelectedMedModal] = useState<Medicine | null>(null);
  const [storeInfoModal,   setStoreInfoModal]   = useState(false);
  const [selectedMedForStores, setSelectedMedForStores] = useState<Medicine | null>(null);
  
  const [debouncedQuery,   setDebouncedQuery]   = useState('');
  const [debouncedStoreQuery, setDebouncedStoreQuery] = useState('');
  
  const [meds, setMeds] = useState<Medicine[]>([]);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [storeMedsList, setStoreMedsList] = useState<Medicine[]>([]);
  
  const [isMedsLoading, setIsMedsLoading] = useState(false);
  const [isPharmaciesLoading, setIsPharmaciesLoading] = useState(false);
  const [isStoreMedsLoading, setIsStoreMedsLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 4;

  const opacity = useRef(new Animated.Value(0)).current;
  const heartScale = useRef(new Animated.Value(1)).current;
  const categoryScrollRef = useRef<ScrollView>(null);
  const chipPositions = useRef<Record<string, number>>({});

  useEffect(() => {
    if (mode === 'meds') {
      setTimeout(() => {
        if (chipPositions.current[medCategory] !== undefined) {
          categoryScrollRef.current?.scrollTo({
            x: Math.max(0, chipPositions.current[medCategory] - 20),
            animated: true,
          });
        }
      }, 150);
    }
  }, [medCategory, mode]);

  const triggerHeartAnimation = () => {
    Animated.sequence([
      Animated.spring(heartScale, { toValue: 1.3, useNativeDriver: true }),
      Animated.spring(heartScale, { toValue: 1, useNativeDriver: true })
    ]).start();
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [mode, query, medCategory, pharmacySort, storeQuery, activeStore]);

  useEffect(() => {
    StatusBar.setBarStyle('dark-content');
    Animated.timing(opacity, { toValue: 1, duration: 280, useNativeDriver: true }).start();
  }, []);

  // Debounce effects
  useEffect(() => {
    const handler = setTimeout(() => { setDebouncedQuery(query); }, 500);
    return () => clearTimeout(handler);
  }, [query]);

  useEffect(() => {
    const handler = setTimeout(() => { setDebouncedStoreQuery(storeQuery); }, 500);
    return () => clearTimeout(handler);
  }, [storeQuery]);

  useFocusEffect(
    useCallback(() => {
      const storeId = route.params?.storeId;
      const category = route.params?.category;
      const initialMode = route.params?.initialMode;
      const medId = route.params?.medId;

      if (storeId) {
        // Fetch pharmacy by ID
        pharmacyService.getPharmacyById(storeId, coords?.latitude, coords?.longitude).then((res) => {
          if (res) {
            setActiveStore(res);
            setMode('pharmacies');
          }
        }).catch(console.error);
      } else if (category) {
        setMedCategory(category);
        setMode('meds');
        setActiveStore(null);
      } else if (initialMode) {
        setMode(initialMode);
        setActiveStore(null);
      } else {
        setActiveStore(null);
      }

      if (medId) {
        getMedicine(medId).then((med) => {
          if (med) {
            if (initialMode === 'pharmacies') {
              setSelectedMedForStores(med as unknown as Medicine);
            } else {
              setSelectedMedModal(med as unknown as Medicine);
            }
          }
        }).catch(console.error);
      } else {
        setSelectedMedForStores(null);
      }
    }, [route.params])
  );

  // Fetch global meds
  useEffect(() => {
    if (mode !== 'meds' || activeStore) return;
    const fetchMeds = async () => {
      setIsMedsLoading(true);
      try {
        const res = await listMedicines({ search: debouncedQuery, category: medCategory === 'All' ? undefined : (medCategory as any) });
        setMeds(res.data);
      } catch (e) {
        console.error(e);
      } finally {
        setIsMedsLoading(false);
      }
    };
    fetchMeds();
  }, [mode, activeStore, debouncedQuery, medCategory]);

  // Fetch pharmacies
  useEffect(() => {
    if (mode !== 'pharmacies' || activeStore) return;
    const fetchPharmacies = async () => {
      setIsPharmaciesLoading(true);
      try {
        const res = await pharmacyService.getPharmacies({ search: debouncedQuery, latitude: coords?.latitude, longitude: coords?.longitude });
        let data = res.data;
        if (selectedMedForStores) {
          data = data.filter(p => selectedMedForStores.availableAtPharmacyIds?.includes(p.id));
        }
        // Safe distance parser: extracts numeric part from strings like "0.8 km" or "500 m"
        const parseDist = (d: any) => {
          if (!d || typeof d !== 'string') return typeof d === 'number' ? d : 9999;
          const n = parseFloat(d);
          return isNaN(n) ? 9999 : (d.includes(' m') && !d.includes('km') ? n / 1000 : n);
        };
        setPharmacies(data.sort((a, b) => {
          if (pharmacySort === 'distance') return parseDist(a.distance) - parseDist(b.distance);
          return ((b as any).popularity || b.rating) - ((a as any).popularity || a.rating);
        }));
      } catch (e) {
        console.error(e);
      } finally {
        setIsPharmaciesLoading(false);
      }
    };
    fetchPharmacies();
  }, [mode, activeStore, debouncedQuery, pharmacySort, selectedMedForStores, coords]);

  // Fetch store meds
  useEffect(() => {
    if (!activeStore) return;
    const fetchStoreMeds = async () => {
      setIsStoreMedsLoading(true);
      try {
        const res = await listMedicines({ search: debouncedStoreQuery, category: medCategory === 'All' ? undefined : (medCategory as any), pharmacyId: activeStore.id });
        setStoreMedsList(res.data);
      } catch (e) {
        console.error(e);
      } finally {
        setIsStoreMedsLoading(false);
      }
    };
    fetchStoreMeds();
  }, [activeStore, debouncedStoreQuery, medCategory]);

  const totalMedPages = Math.max(1, Math.ceil(meds.length / ITEMS_PER_PAGE));
  const medStartIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedMeds = meds.slice(medStartIndex, medStartIndex + ITEMS_PER_PAGE);

  const totalPharmPages = Math.max(1, Math.ceil(pharmacies.length / ITEMS_PER_PAGE));
  const pharmStartIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedPharmacies = pharmacies.slice(pharmStartIndex, pharmStartIndex + ITEMS_PER_PAGE);

  const totalStoreMedPages = Math.max(1, Math.ceil(storeMedsList.length / ITEMS_PER_PAGE));
  const storeMedStartIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedStoreMeds = storeMedsList.slice(storeMedStartIndex, storeMedStartIndex + ITEMS_PER_PAGE);

  const cartItems = globalCart.reduce((acc, item) => {
    // Only map quantities for the currently viewed store so they don't bleed across stores!
    if (activeStore && item.pharmacy.id !== activeStore.id) return acc;
    acc[item.medicine.id] = item.quantity;
    return acc;
  }, {} as Record<string, number>);

  const totalCartCount = activeStore 
    ? globalCart.filter(c => c.pharmacy.id === activeStore.id).reduce((sum, item) => sum + item.quantity, 0)
    : globalCart.reduce((sum, item) => sum + item.quantity, 0);

  const incrementQty = (med: Medicine) => {
    if (!activeStore) return;
    if (cartItems[med.id]) {
      updateQuantity(med.id, activeStore.id, 1);
    } else {
      addToCart(med, { 
        id: activeStore.id, 
        name: activeStore.name, 
        address: activeStore.address, 
        distance: activeStore.distance,
        image: activeStore.image
      });
    }
  };

  const decrementQty = (medId: string) => {
    if (!activeStore) return;
    updateQuantity(medId, activeStore.id, -1);
  };

  // Render Quantity Stepper Button (- 1 +)
  const renderQtyStepper = (med: Medicine) => {
    const qty = cartItems[med.id] || 0;
    
    const isOutOfStockAtStore = activeStore && med.outOfStockPharmacyIds?.includes(activeStore.id);
    if (!med.inStock || med.isRxRequired || (activeStore && !activeStore.isOpen) || isOutOfStockAtStore) {
      return <View style={{ width: 32, height: 32 }} />;
    }

    if (qty === 0) {
      return (
        <TouchableOpacity
          style={s.addBtnInitial}
          onPress={(e) => { e.stopPropagation(); incrementQty(med); }}
          activeOpacity={0.8}
        >
          <Plus color="#FFFFFF" size={16} strokeWidth={2.8} />
        </TouchableOpacity>
      );
    }

    return (
      <View style={s.stepperBox}>
        <TouchableOpacity
          style={s.stepperBtn}
          onPress={(e) => { e.stopPropagation(); decrementQty(med.id); }}
          activeOpacity={0.8}
        >
          <Minus color={colors.midTeal} size={14} strokeWidth={3} />
        </TouchableOpacity>

        <Text style={s.stepperQtyText}>{qty}</Text>

        <TouchableOpacity
          style={s.stepperBtn}
          onPress={(e) => { e.stopPropagation(); incrementQty(med); }}
          activeOpacity={0.8}
        >
          <Plus color={colors.midTeal} size={14} strokeWidth={3} />
        </TouchableOpacity>
      </View>
    );
  };

  // Pagination UI Generator
  const renderPagination = (totalItems: number, totalPages: number, startIndex: number) => {
    if (totalItems === 0) return null;
    return (
      <View style={s.paginationContainer}>
        <Text style={s.paginationInfoText}>
          Showing {startIndex + 1}–{Math.min(startIndex + ITEMS_PER_PAGE, totalItems)} of {totalItems} items
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
    );
  };

  // Dedicated Uber Eats Style Pharmacy Storefront Page View
  if (activeStore) {
    return (
      <View style={s.screen}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.bgWarm} />

        {/* Store Header */}
        <View style={s.storeHeader}>
          <TouchableOpacity 
            style={s.backBtn} 
            onPress={() => {
              setActiveStore(null);
              setStoreQuery('');
              navigation.setParams({ storeId: undefined, category: undefined, initialMode: undefined });
            }} 
            activeOpacity={0.75}
          >
            <ChevronLeft color={colors.textDark} size={20} strokeWidth={2.5} />
          </TouchableOpacity>
          <Text style={s.storeHeaderTitle} numberOfLines={1}>{activeStore.name}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <TouchableOpacity
              style={s.headerCartBtn}
              onPress={async () => {
                Animated.sequence([
                  Animated.timing(heartScale, { toValue: 1.6, duration: 150, useNativeDriver: true }),
                  Animated.spring(heartScale, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true })
                ]).start();
                try {
                  const result = await pharmacyService.toggleFavorite(activeStore);
                  setActiveStore({ ...activeStore, isFavorite: result.isFavorite, favoriteId: result.favoriteId });
                } catch (e) {
                  console.warn('Failed to toggle favorite', e);
                }
              }}
              activeOpacity={0.8}
            >
              <Animated.View style={{ transform: [{ scale: heartScale }] }}>
                <Heart 
                  color={activeStore.isFavorite ? '#EF4444' : colors.textDark} 
                  size={22} 
                  strokeWidth={2} 
                  fill={activeStore.isFavorite ? '#EF4444' : 'transparent'} 
                />
              </Animated.View>
            </TouchableOpacity>
            <TouchableOpacity
              style={s.headerCartBtn}
              onPress={() => navigation.navigate('MultiStoreCart')}
              activeOpacity={0.8}
            >
              <ShoppingCart color={colors.textDark} size={20} strokeWidth={2} />
              {totalCartCount > 0 && (
                <View style={s.cartBadgeTop}>
                  <Text style={s.cartBadgeTopText}>{totalCartCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView contentContainerStyle={s.storeScroll} showsVerticalScrollIndicator={false}>
          {/* Uber Eats Full-Bleed Store Cover Image */}
          <View style={s.storeCoverHero}>
            {activeStore.image ? (
              <Image source={getLocalImage(activeStore.image) || (typeof activeStore.image === 'string' ? { uri: activeStore.image } : activeStore.image)} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
            ) : (
              <View style={s.mapGridGraphic}>
                <Store color={colors.midTeal} size={40} strokeWidth={2.5} />
              </View>
            )}

            {/* Live Open / Closed Badge */}
            <View style={[s.mapBadgeOpen, !activeStore.isOpen && { backgroundColor: colors.surfaceWhite }]}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: activeStore.isOpen ? '#10B981' : '#EF4444' }} />
              <Text style={[s.mapBadgeOpenText, !activeStore.isOpen && { color: colors.textDark }]}>
                {activeStore.isOpen ? 'Open Now' : 'Closed'}
              </Text>
            </View>
          </View>

          {/* Store Info & Content Sheet Overlapping the Cover */}
          <View style={s.sheetContent}>
            <View style={s.storeMainInfoCard}>
            <Text style={s.storeMainName}>{activeStore.name}</Text>

            <View style={s.storeMetaBadgeRow}>
              <Star color="#F59E0B" size={14} fill="#F59E0B" />
              <Text style={s.metaPillText}>{activeStore.rating} ({activeStore.ratingCount}+ ratings) • {activeStore.distance} • {activeStore.estimatedResponseTime}</Text>
            </View>

            {/* Clickable Info & Map Button */}
            <TouchableOpacity
              style={s.infoMapBtn}
              onPress={() => setStoreInfoModal(true)}
              activeOpacity={0.8}
            >
              <MapPin color={colors.textDark} size={18} strokeWidth={2} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={s.infoMapBtnTitle}>Store Info & Details</Text>
                <Text style={s.infoMapBtnSub} numberOfLines={1}>{activeStore.address}</Text>
              </View>
              <ChevronRight color={colors.borderSoft} size={20} />
            </TouchableOpacity>
          </View>

          <View style={{ paddingHorizontal: 20, gap: 14, paddingTop: 4 }}>
            {/* Quick Contact Buttons */}
            <View style={s.storeContactRow}>
              <TouchableOpacity
                style={s.contactBtn}
                onPress={() => navigation.navigate('PharmacyChat', { orderId: 'general-inquiry' })}
                activeOpacity={0.8}
              >
                <MessageSquare color={colors.midTeal} size={16} strokeWidth={2} />
                <Text style={s.contactBtnText}>Chat with Store</Text>
              </TouchableOpacity>

              <TouchableOpacity style={s.contactBtn} activeOpacity={0.8}>
                <PhoneCall color={colors.midTeal} size={16} strokeWidth={2} />
                <Text style={s.contactBtnText}>Call Pharmacy</Text>
              </TouchableOpacity>
            </View>

            {/* Store-Specific Prescription Attachment Card */}
            <TouchableOpacity
              style={[s.attachRxCard, !activeStore.isOpen && { opacity: 0.6 }]}
              onPress={() => {
                if (!activeStore.isOpen) return;
                navigation.navigate('UploadPrescription', {
                  pharmacyId: activeStore.id,
                  pharmacyName: activeStore.name,
                });
              }}
              activeOpacity={activeStore.isOpen ? 0.88 : 1}
            >
              <FileText color={colors.midTeal} size={20} strokeWidth={2} />
              <View style={{ flex: 1 }}>
                <Text style={s.attachRxTitle}>Have a Prescription for this Pharmacy?</Text>
                <Text style={s.attachRxSub}>Attach your prescription image directly to this store's order</Text>
              </View>
              <View style={s.attachRxBtn}>
                <Plus color="#FFF" size={14} strokeWidth={3} />
                <Text style={s.attachRxBtnText}>Attach</Text>
              </View>
            </TouchableOpacity>
          {/* Search Store's Medicine Stock */}
          <View style={s.storeSearchBar}>
            <Search color={colors.textMuted} size={18} strokeWidth={2.5} />
            <TextInput
              style={s.searchInput}
              placeholder={`Search in ${activeStore.name}...`}
              placeholderTextColor={colors.textMuted}
              value={storeQuery}
              onChangeText={setStoreQuery}
            />
            {storeQuery.length > 0 && (
              <TouchableOpacity onPress={() => setStoreQuery('')}>
                <X color={colors.textMuted} size={15} strokeWidth={2} />
              </TouchableOpacity>
            )}
          </View>
          </View>

          {/* Categories Horizontal List (Store Specific) */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 8, gap: 10, marginTop: 14 }}>
            {MED_CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat}
                style={[s.chip, medCategory === cat && s.chipActive]}
                onPress={() => setMedCategory(cat)}
                activeOpacity={0.8}
              >
                <Text style={[s.chipText, medCategory === cat && s.chipTextActive]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={{ paddingHorizontal: 20, gap: 14, marginTop: 4 }}>
            {/* Store Available Medicines Grid */}
            <Text style={s.sectionTitleText}>Available In Store ({storeMedsList.length})</Text>
            {isStoreMedsLoading ? (
              <View style={{ height: 150, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={colors.midTeal} />
                <Text style={{ marginTop: 12, fontFamily: FONTS.medium, color: colors.textMuted }}>Loading inventory...</Text>
              </View>
            ) : storeMedsList.length === 0 ? (
              <View style={{ height: 150, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontFamily: FONTS.bold, color: colors.textDark, fontSize: 16 }}>No items found</Text>
              </View>
            ) : (
              <>
                <View style={s.productGrid}>
                  {paginatedStoreMeds.map((med) => (
                    <MedicineCard
                      key={med.id}
                      med={med}
                      onPress={() => setSelectedMedModal(med)}
                      isGlobal={false}
                      activePharmacyId={activeStore?.id}
                      forceOutOfStockBadge={activeStore ? med.outOfStockPharmacyIds?.includes(activeStore.id) : false}
                      actionComponent={renderQtyStepper(med)}
                    />
                  ))}
                </View>
                {renderPagination(storeMedsList.length, totalStoreMedPages, storeMedStartIndex)}
              </>
            )}
          </View>
          </View>
        </ScrollView>

        {/* Uber Eats Bottom Floating Cart Bar */}
        {totalCartCount > 0 && (
          <View style={s.floatingCartWrap}>
            <TouchableOpacity
              style={s.floatingCartBar}
              activeOpacity={0.88}
              onPress={() => navigation.navigate('MultiStoreCart')}
            >
              <View style={s.cartCountPill}>
                <Text style={s.cartCountText}>{totalCartCount}</Text>
              </View>
              <Text style={s.floatingCartText}>View Order Cart</Text>
              <Text style={s.floatingCartTotal}>LKR {subtotal}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Item Detail Sheet Modal */}
        {selectedMedModal && (
          <Modal visible={!!selectedMedModal} animationType="slide" transparent onRequestClose={() => setSelectedMedModal(null)}>
            <KeyboardAvoidingView style={s.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
              <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setSelectedMedModal(null)} />
              <View style={s.modalCard}>
                <TouchableOpacity style={s.closeModalBtn} onPress={() => setSelectedMedModal(null)}>
                  <X color={colors.textDark} size={18} strokeWidth={2.5} />
                </TouchableOpacity>

                <View style={s.modalHeroImg}>
                  {selectedMedModal.image ? (
                    <Image source={getLocalImage(selectedMedModal.image) || (typeof selectedMedModal.image === 'string' ? { uri: selectedMedModal.image } : selectedMedModal.image)} style={{ width: '100%', height: '100%', borderRadius: 16 }} resizeMode="cover" />
                  ) : (
                    <Image source={FUN_3D_BAG} style={{ width: 96, height: 96 }} resizeMode="contain" />
                  )}
                </View>

                <Text style={s.modalTitle}>{selectedMedModal.name}</Text>
                <Text style={s.modalGeneric}>{selectedMedModal.genericName} · {selectedMedModal.dosage}</Text>

                <View style={s.modalPriceRow}>
                  <Text style={s.modalPrice}>LKR {activeStore ? (selectedMedModal.pharmacyDiscounts?.[activeStore.id] ?? selectedMedModal.pharmacyPrice) : selectedMedModal.pharmacyPrice}</Text>
                  <Text style={s.modalMrp}>LKR {selectedMedModal.mrpPrice}</Text>
                </View>

                <Text style={s.descHeading}>Description & Dosage Instructions</Text>
                <Text style={s.descBody}>{(selectedMedModal as any).description || 'Fast-acting medicine supplied by licensed partner pharmacies.'}</Text>

                {!selectedMedModal.inStock ? (
                  <View style={[s.modalAddBtn, { backgroundColor: colors.borderSoft }]}>
                    <Text style={[s.modalAddBtnText, { color: colors.textMuted }]}>Out of Stock</Text>
                  </View>
                ) : selectedMedModal.isRxRequired ? (
                  <TouchableOpacity
                    style={[s.modalAddBtn, { backgroundColor: colors.midTeal }]}
                    onPress={() => {
                      navigation.navigate('UploadPrescription', { pharmacyId: activeStore.id, pharmacyName: activeStore.name });
                      setSelectedMedModal(null);
                    }}
                    activeOpacity={0.88}
                  >
                    <Text style={[s.modalAddBtnText, { color: colors.textInverse }]}>Prescription Required - Upload</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={s.modalAddBtn}
                    onPress={() => {
                      incrementQty(selectedMedModal);
                      setSelectedMedModal(null);
                    }}
                    activeOpacity={0.88}
                  >
                    <Text style={s.modalAddBtnText}>Add Item to Cart · LKR {activeStore ? (selectedMedModal.pharmacyDiscounts?.[activeStore.id] ?? selectedMedModal.pharmacyPrice) : selectedMedModal.pharmacyPrice}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </KeyboardAvoidingView>
          </Modal>
        )}
        {/* Uber Eats Store Info & Google Maps Location Sheet Modal */}
        {storeInfoModal && (
          <Modal visible={storeInfoModal} animationType="slide" transparent onRequestClose={() => setStoreInfoModal(false)}>
            <View style={s.modalOverlay}>
              <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setStoreInfoModal(false)} />
              <View style={[s.modalCard, { gap: 14 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                  <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: colors.limeWhisper, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
                    {activeStore.image ? (
                      <Image source={getLocalImage(activeStore.image) || (typeof activeStore.image === 'string' ? { uri: activeStore.image } : activeStore.image)} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                    ) : (
                      <Text style={{ fontSize: 18, fontFamily: FONTS.black, color: colors.midTeal }}>{activeStore.name.charAt(0)}</Text>
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: FONTS.black, fontSize: 18, color: colors.textDark }} numberOfLines={1}>{activeStore.name}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                      <Star color="#F59E0B" size={12} fill="#F59E0B" />
                      <Text style={{ fontSize: 13, fontFamily: FONTS.semibold, color: colors.textDark }}>{activeStore.rating}</Text>
                      <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: colors.borderSoft }} />
                      <Text style={{ fontSize: 12, fontFamily: FONTS.medium, color: colors.textMuted }}>{activeStore.distance} • {activeStore.estimatedResponseTime || '15 mins'}</Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity onPress={async () => {
                      try {
                        const result = await pharmacyService.toggleFavorite(activeStore);
                        setActiveStore({ ...activeStore, isFavorite: result.isFavorite, favoriteId: result.favoriteId });
                      } catch (e) {
                        console.warn('Failed to toggle favorite', e);
                      }
                    }} style={{ width: 32, height: 32, justifyContent: 'center', alignItems: 'center' }}>
                      <Heart color={activeStore.isFavorite ? "#EF4444" : colors.textMuted} size={16} fill={activeStore.isFavorite ? "#EF4444" : "transparent"} strokeWidth={activeStore.isFavorite ? 0 : 2.5} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setStoreInfoModal(false)} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.bgWarm, justifyContent: 'center', alignItems: 'center' }}>
                      <X color={colors.textDark} size={18} strokeWidth={2.5} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Map Component with Web Fallback */}
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={{ borderRadius: 12, overflow: 'hidden', width: '100%', maxWidth: 600, alignSelf: 'center' }}
                  onPress={() => {
                    const url = `https://www.google.com/maps/dir/?api=1&destination=${activeStore.latitude},${activeStore.longitude}`;
                    Linking.openURL(url);
                  }}
                >
                  <MapPreview
                    latitude={activeStore.latitude}
                    longitude={activeStore.longitude}
                    name={activeStore.name}
                    address={activeStore.address}
                  />
                  <View style={{
                    position: 'absolute', bottom: 12, right: 12,
                    backgroundColor: colors.peacockBlue, paddingHorizontal: 12, paddingVertical: 8,
                    borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 6,
                    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 3,
                  }}>
                    <Navigation color="#FFF" size={14} strokeWidth={2.5} />
                    <Text style={{ fontFamily: FONTS.bold, fontSize: 12, color: '#FFF' }}>Get Directions</Text>
                  </View>
                </TouchableOpacity>

                {/* Key Store Specs */}
                <View style={{ gap: 12 }}>
                  {/* Action Buttons */}
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <TouchableOpacity style={{ flex: 1, backgroundColor: colors.limeWhisper, padding: 12, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
                      <Phone color={colors.midTeal} size={16} strokeWidth={2.5} />
                      <Text style={{ fontFamily: FONTS.bold, fontSize: 13, color: colors.midTeal }}>Call Store</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={{ flex: 1, backgroundColor: colors.bgWarm, padding: 12, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
                      <Clock color={colors.textDark} size={16} strokeWidth={2.5} />
                      <Text style={{ fontFamily: FONTS.bold, fontSize: 13, color: colors.textDark }}>8 AM - 10 PM</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Uber Eats Style Info Rows */}
                  <View style={{ gap: 0, backgroundColor: colors.surfaceWhite, borderRadius: 14, borderWidth: 1, borderColor: colors.borderSoft, overflow: 'hidden' }}>
                    
                    {/* Prep Time & Distance Row */}
                    <View style={{ flexDirection: 'row', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.borderSubtle }}>
                      <View style={{ flex: 1, borderRightWidth: 1, borderRightColor: '#F8FAFC' }}>
                        <Text style={{ fontFamily: FONTS.medium, fontSize: 12, color: colors.textMuted, marginBottom: 4 }}>Prep Time</Text>
                        <Text style={{ fontFamily: FONTS.bold, fontSize: 14, color: colors.textDark }}>{activeStore.estimatedResponseTime || '15 mins'}</Text>
                      </View>
                      <View style={{ flex: 1, paddingLeft: 16 }}>
                        <Text style={{ fontFamily: FONTS.medium, fontSize: 12, color: colors.textMuted, marginBottom: 4 }}>Distance</Text>
                        <Text style={{ fontFamily: FONTS.bold, fontSize: 14, color: colors.textDark }}>{activeStore.distance}</Text>
                      </View>
                    </View>

                    {/* Address Row */}
                    <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: colors.borderSubtle }}>
                      <Text style={{ fontFamily: FONTS.medium, fontSize: 12, color: colors.textMuted, marginBottom: 4 }}>Location</Text>
                      <Text style={{ fontFamily: FONTS.bold, fontSize: 14, color: colors.textDark }}>{activeStore.address}</Text>
                    </View>

                    {/* Legal Credentials (Folded) */}
                    <View style={{ padding: 16, backgroundColor: colors.surfaceSubtle }}>
                      <Text style={{ fontFamily: FONTS.medium, fontSize: 11, color: colors.textMuted, marginBottom: 8 }}>STORE CREDENTIALS</Text>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                        <Text style={{ fontFamily: FONTS.medium, fontSize: 12, color: colors.textDark }}>NMRA License</Text>
                        <Text style={{ fontFamily: FONTS.bold, fontSize: 12, color: colors.textDark }}>{activeStore.nmraLicense || 'PH-2024-8891'}</Text>
                      </View>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ fontFamily: FONTS.medium, fontSize: 12, color: colors.textDark }}>Pharmacist</Text>
                        <Text style={{ fontFamily: FONTS.bold, fontSize: 12, color: colors.textDark }}>{activeStore.pharmacistName || 'SLMC Verified'}</Text>
                      </View>
                    </View>
                  </View>
                </View>

                <TouchableOpacity
                  style={s.modalAddBtn}
                  onPress={() => setStoreInfoModal(false)}
                  activeOpacity={0.88}
                >
                  <Text style={s.modalAddBtnText}>Browse Store Catalog</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}
      </View>
    );
  }

  return (
    <View style={s.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bgWarm} />

      {/* Header */}
      <View style={s.header}>
        <Text style={s.title}>Browse Store</Text>
        <TouchableOpacity 
          style={s.headerCartBtn} 
          onPress={() => navigation.navigate('MultiStoreCart')}
          activeOpacity={0.8}
        >
          <ShoppingCart color={colors.textDark} size={20} strokeWidth={2} />
          {totalCartCount > 0 && (
            <View style={s.cartBadgeTop}>
              <Text style={s.cartBadgeTopText}>{totalCartCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Segmented Mode Switcher: Medicines vs Partner Pharmacies */}
      <View style={s.modeSwitcherWrap}>
        <View style={s.modeSwitcher}>
          <TouchableOpacity
            style={[s.modeBtn, mode === 'meds' && s.modeBtnActive]}
            onPress={() => setMode('meds')}
            activeOpacity={0.85}
          >
            <Pill color={mode === 'meds' ? colors.midTeal : colors.textMuted} size={16} strokeWidth={2.2} />
            <Text style={[s.modeText, mode === 'meds' && s.modeTextActive]}>Medicines</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.modeBtn, mode === 'pharmacies' && s.modeBtnActive]}
            onPress={() => setMode('pharmacies')}
            activeOpacity={0.85}
          >
            <Store color={mode === 'pharmacies' ? colors.midTeal : colors.textMuted} size={16} strokeWidth={2.2} />
            <Text style={[s.modeText, mode === 'pharmacies' && s.modeTextActive]}>Pharmacies</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Input */}
      <View style={s.searchBar}>
        <Search color={colors.textMuted} size={18} strokeWidth={2.5} />
        <TextInput
          style={s.searchInput}
          placeholder={mode === 'meds' ? "Search medicines across all stores..." : "Search pharmacies & locations..."}
          placeholderTextColor={colors.textMuted}
          value={query}
          onChangeText={setQuery}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')}>
            <X color={colors.textMuted} size={15} strokeWidth={2} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Row */}
      {mode === 'meds' ? (
        <View style={s.chipsWrapper}>
          <ScrollView ref={categoryScrollRef} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipsContainer}>
            {MED_CATEGORIES.map((c) => (
              <TouchableOpacity
                key={c}
                onLayout={(e) => { chipPositions.current[c] = e.nativeEvent.layout.x; }}
                style={[s.chip, medCategory === c && s.chipActive]}
                onPress={() => setMedCategory(c)}
                activeOpacity={0.8}
              >
                <Text style={[s.chipText, medCategory === c && s.chipTextActive]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      ) : (
        <View style={s.pharmacyFilterRow}>
          <Text style={s.filterLabel}>Sort by:</Text>
          <TouchableOpacity
            style={[s.sortTag, pharmacySort === 'distance' && s.sortTagActive]}
            onPress={() => setPharmacySort('distance')}
          >
            <MapPin color={pharmacySort === 'distance' ? colors.midTeal : colors.textMuted} size={13} strokeWidth={2.2} />
            <Text style={[s.sortText, pharmacySort === 'distance' && s.sortTextActive]}>Nearest Distance</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.sortTag, pharmacySort === 'rating' && s.sortTagActive]}
            onPress={() => setPharmacySort('rating')}
          >
            <Star color={pharmacySort === 'rating' ? '#F59E0B' : colors.textMuted} size={13} strokeWidth={2.2} fill={pharmacySort === 'rating' ? '#F59E0B' : 'transparent'} />
            <Text style={[s.sortText, pharmacySort === 'rating' && s.sortTextActive]}>Highest Rated</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Content List */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[s.scrollContent, { paddingBottom: totalCartCount > 0 ? 140 : 100 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {mode === 'meds' ? (
          /* Medicines 2-Column Product Grid */
          <View>
            {isMedsLoading ? (
              <View style={{ height: 200, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={colors.midTeal} />
                <Text style={{ marginTop: 12, fontFamily: FONTS.medium, color: colors.textMuted }}>Searching medicines...</Text>
              </View>
            ) : meds.length === 0 ? (
              <View style={{ height: 200, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontFamily: FONTS.bold, color: colors.textDark, fontSize: 16 }}>No medicines found</Text>
                <Text style={{ fontFamily: FONTS.medium, color: colors.textMuted, marginTop: 4 }}>Try a different search term or category</Text>
              </View>
            ) : (
              <>
                <View style={s.productGrid}>
                  {paginatedMeds.map((med) => (
                    <MedicineCard
                      key={med.id}
                      med={med}
                      onPress={() => setSelectedMedModal(med)}
                      isGlobal={true}
                      onStoreSelectPress={() => {
                        setSelectedMedForStores(med);
                        setMode('pharmacies');
                      }}
                    />
                  ))}
                </View>
                {renderPagination(meds.length, totalMedPages, medStartIndex)}
              </>
            )}
          </View>
        ) : (
          /* Partner Pharmacies List */
          <View>
            {isPharmaciesLoading ? (
              <View style={{ height: 200, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={colors.midTeal} />
                <Text style={{ marginTop: 12, fontFamily: FONTS.medium, color: colors.textMuted }}>Finding pharmacies...</Text>
              </View>
            ) : pharmacies.length === 0 ? (
              <View style={{ height: 200, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontFamily: FONTS.bold, color: colors.textDark, fontSize: 16 }}>No pharmacies found</Text>
                <Text style={{ fontFamily: FONTS.medium, color: colors.textMuted, marginTop: 4 }}>Try a different search term</Text>
              </View>
            ) : (
              <>
                <View style={s.pharmacyList}>
                  {paginatedPharmacies.map((p) => (
                    <BrowsePharmacyCard key={p.id} p={p} onPress={() => setActiveStore(p)} s={s} colors={colors} />
                  ))}
                </View>
                {renderPagination(pharmacies.length, totalPharmPages, pharmStartIndex)}
              </>
            )}
          </View>
        )}
      </ScrollView>

      {/* Uber Eats Bottom Floating Cart Bar */}
      {totalCartCount > 0 && (
        <View style={s.floatingCartWrap}>
          <TouchableOpacity
            style={s.floatingCartBar}
            activeOpacity={0.88}
            onPress={() => navigation.navigate('MultiStoreCart')}
          >
            <View style={s.cartCountPill}>
              <Text style={s.cartCountText}>{totalCartCount}</Text>
            </View>
            <Text style={s.floatingCartText}>View Order Cart</Text>
            <Text style={s.floatingCartTotal}>LKR {subtotal}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Item Detail Sheet Modal */}
      {selectedMedModal && (
        <Modal visible={!!selectedMedModal} animationType="slide" transparent onRequestClose={() => setSelectedMedModal(null)}>
          <KeyboardAvoidingView style={s.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setSelectedMedModal(null)} />
            <View style={s.modalCard}>
              <TouchableOpacity style={s.closeModalBtn} onPress={() => setSelectedMedModal(null)}>
                <X color={colors.textDark} size={18} strokeWidth={2.5} />
              </TouchableOpacity>

              <View style={s.modalHeroImg}>
                <View style={{ width: '100%', height: '100%', borderRadius: 12, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' }}>
                  {selectedMedModal.image ? (
                    <Image source={getLocalImage(selectedMedModal.image) || (typeof selectedMedModal.image === 'string' ? { uri: selectedMedModal.image } : selectedMedModal.image)} style={{ width: '100%', height: '100%', transform: [{ scale: 1.25 }] }} resizeMode="cover" />
                  ) : (
                    <Image source={FUN_3D_BAG} style={{ width: 96, height: 96 }} resizeMode="contain" />
                  )}
                </View>
              </View>

              <Text style={s.modalTitle}>{selectedMedModal.name}</Text>
              <Text style={s.modalGeneric}>{selectedMedModal.genericName} · {selectedMedModal.dosage}</Text>

              <View style={s.modalPriceRow}>
                <Text style={s.modalPrice}>LKR {activeStore ? (selectedMedModal.pharmacyDiscounts?.[activeStore.id] ?? selectedMedModal.pharmacyPrice) : selectedMedModal.pharmacyPrice}</Text>
                <Text style={s.modalMrp}>LKR {selectedMedModal.mrpPrice}</Text>
              </View>

              <Text style={s.descHeading}>Description & Dosage Instructions</Text>
              <Text style={s.descBody}>{(selectedMedModal as any).description || 'Fast-acting medicine supplied by licensed partner pharmacies.'}</Text>

              {/* Modal Action Button */}
              {selectedMedModal.isRxRequired ? (
                <TouchableOpacity
                  style={[s.modalAddBtn, { backgroundColor: colors.midTeal }]}
                  onPress={() => {
                    navigation.navigate('SelectPharmacy');
                    setSelectedMedModal(null);
                  }}
                  activeOpacity={0.88}
                >
                  <Text style={[s.modalAddBtnText, { color: colors.textInverse }]}>Prescription Required - Select Store</Text>
                </TouchableOpacity>
              ) : !activeStore ? (
                <TouchableOpacity
                  style={s.modalAddBtn}
                  onPress={() => {
                    setSelectedMedForStores(selectedMedModal);
                    setMode('pharmacies');
                    setSelectedMedModal(null);
                  }}
                  activeOpacity={0.88}
                >
                  <Text style={s.modalAddBtnText}>View Available Stores</Text>
                </TouchableOpacity>
              ) : !activeStore.isOpen ? (
                <View style={[s.modalAddBtn, { backgroundColor: colors.borderSoft }]}>
                  <Text style={[s.modalAddBtnText, { color: colors.textMuted }]}>Pharmacy is Closed</Text>
                </View>
              ) : (!selectedMedModal.inStock || selectedMedModal.outOfStockPharmacyIds?.includes(activeStore.id)) ? (
                <View style={[s.modalAddBtn, { backgroundColor: colors.borderSoft }]}>
                  <Text style={[s.modalAddBtnText, { color: colors.textMuted }]}>Out of Stock</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={s.modalAddBtn}
                  onPress={() => {
                    incrementQty(selectedMedModal);
                    setSelectedMedModal(null);
                  }}
                  activeOpacity={0.88}
                >
                  <Text style={s.modalAddBtnText}>Add Item to Cart · LKR {activeStore ? (selectedMedModal.pharmacyDiscounts?.[activeStore.id] ?? selectedMedModal.pharmacyPrice) : selectedMedModal.pharmacyPrice}</Text>
                </TouchableOpacity>
              )}
            </View>
          </KeyboardAvoidingView>
        </Modal>
      )}

      {/* Uber Eats Store Info & Google Maps Location Sheet Modal */}
      {(() => {
        if (!activeStore || !storeInfoModal) return null;
        const store = activeStore as Pharmacy;
        return (
        <Modal visible={storeInfoModal} animationType="slide" transparent onRequestClose={() => setStoreInfoModal(false)}>
          <View style={s.modalOverlay}>
            <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setStoreInfoModal(false)} />
            <View style={[s.modalCard, { gap: 14 }]}>
              <TouchableOpacity style={s.closeModalBtn} onPress={() => setStoreInfoModal(false)}>
                <X color={colors.textDark} size={18} strokeWidth={2.5} />
              </TouchableOpacity>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: colors.limeWhisper, justifyContent: 'center', alignItems: 'center' }}>
                  <Store color={colors.midTeal} size={22} strokeWidth={2} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: FONTS.black, fontSize: 18, color: colors.textDark }}>{store.name}</Text>
                  <Text style={{ fontFamily: FONTS.medium, fontSize: 12, color: colors.textMuted }}>Verified Partner Pharmacy</Text>
                </View>
              </View>

              {/* Map Preview Graphic */}
              <View style={{ height: 140, borderRadius: 16, backgroundColor: colors.surfaceSubtle, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
                <MapPin color={colors.midTeal} size={36} strokeWidth={2.5} />
                <Text style={{ fontFamily: FONTS.bold, fontSize: 13, color: colors.textDark, marginTop: 6 }}>{store.address}</Text>
                <Text style={{ fontFamily: FONTS.medium, fontSize: 11, color: colors.textMuted }}>Google Maps Location · {store.distance} away</Text>
              </View>

              {/* Key Store Specs */}
              <View style={{ backgroundColor: colors.surfaceSubtle, borderRadius: 14, padding: 12, gap: 8 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontFamily: FONTS.medium, fontSize: 12, color: colors.textMuted }}>Pharmacy License</Text>
                  <Text style={{ fontFamily: FONTS.bold, fontSize: 12, color: colors.textDark }}>{store.nmraLicense || 'PH-2024-8891'}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontFamily: FONTS.medium, fontSize: 12, color: colors.textMuted }}>Supervising Pharmacist</Text>
                  <Text style={{ fontFamily: FONTS.bold, fontSize: 12, color: colors.textDark }}>{store.pharmacistName || 'SLMC Verified'}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontFamily: FONTS.medium, fontSize: 12, color: colors.textMuted }}>Hours</Text>
                  <Text style={{ fontFamily: FONTS.bold, fontSize: 12, color: '#10B981' }}>Open 8:00 AM - 10:00 PM</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontFamily: FONTS.medium, fontSize: 12, color: colors.textMuted }}>Fulfillment Mode</Text>
                  <Text style={{ fontFamily: FONTS.bold, fontSize: 12, color: colors.midTeal }}>Counter Pickup & Rx Quote Matching</Text>
                </View>
              </View>

              <TouchableOpacity
                style={s.modalAddBtn}
                onPress={() => setStoreInfoModal(false)}
                activeOpacity={0.88}
              >
                <Text style={s.modalAddBtnText}>Browse Store Catalog</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        );
      })()}
    </View>
  );
};

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgWarm },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: colors.bgWarm, paddingTop: 52, paddingBottom: 10, paddingHorizontal: 20,
  },
  title: { fontFamily: FONTS.black, fontSize: 24, color: colors.textDark, letterSpacing: -0.5 },
  headerCartBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.surfaceWhite,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: colors.borderSoft,
    position: 'relative',
  },
  cartBadgeTop: {
    position: 'absolute', top: -3, right: -3,
    backgroundColor: colors.midTeal, width: 18, height: 18, borderRadius: 9,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5, borderColor: colors.surfaceWhite,
  },
  cartBadgeTopText: { fontFamily: FONTS.black, fontSize: 9, color: '#FFFFFF' },

  modeSwitcherWrap: { paddingHorizontal: 20, marginBottom: 10 },
  modeSwitcher: {
    flexDirection: 'row', backgroundColor: colors.surfaceWhite, borderRadius: 14,
    padding: 4, borderWidth: 1, borderColor: colors.borderSoft,
  },
  modeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    height: 38, borderRadius: 10,
  },
  modeBtnActive: { backgroundColor: colors.limeWhisper, borderWidth: 1, borderColor: '#D6EDA0' },
  modeText: { fontFamily: FONTS.bold, fontSize: 13, color: colors.textMuted },
  modeTextActive: { color: colors.midTeal },

  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 20, marginBottom: 12,
    backgroundColor: colors.surfaceWhite, borderRadius: 16, borderWidth: 1, borderColor: colors.borderSoft,
    paddingHorizontal: 16, height: 48,
  },
  searchInput: {
    flex: 1, fontFamily: FONTS.medium, fontSize: 14, color: colors.textDark,
    outlineStyle: 'none' as any, outlineWidth: 0 as any,
  },

  chipsWrapper: { paddingBottom: 12 },
  chipsContainer: { paddingHorizontal: 20, gap: 8, alignItems: 'center' },
  chip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: colors.surfaceWhite, borderWidth: 1, borderColor: colors.borderSoft,
  },
  chipActive: { backgroundColor: colors.midTeal, borderColor: colors.midTeal },
  chipText: { fontFamily: FONTS.bold, fontSize: 13, color: colors.textMuted },
  chipTextActive: { color: '#FFFFFF' },

  pharmacyFilterRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingBottom: 12 },
  filterLabel: { fontFamily: FONTS.bold, fontSize: 12, color: colors.textMuted },
  sortTag: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12,
    backgroundColor: colors.surfaceWhite, borderWidth: 1, borderColor: colors.borderSoft,
  },
  sortTagActive: { backgroundColor: colors.midTealLight, borderColor: colors.midTeal },
  sortText: { fontFamily: FONTS.bold, fontSize: 12, color: colors.textMuted },
  sortTextActive: { color: colors.midTeal },

  scrollContent: { paddingHorizontal: 20, paddingBottom: 100 },

  // Product Grid
  productGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  productCard: {
    width: '47.5%', backgroundColor: colors.surfaceWhite, borderRadius: 20, padding: 12,
    borderWidth: 1, borderColor: colors.borderSoft, gap: 4,
  },
  productImgBox: {
    height: 140, backgroundColor: colors.limeWhisper, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center', position: 'relative', marginBottom: 6,
    padding: 6,
  },
  discTag: {
    position: 'absolute', top: 8, left: 8, backgroundColor: colors.midTeal,
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6,
  },
  discTagText: { fontFamily: FONTS.extrabold, fontSize: 9, color: '#FFFFFF' },
  rxBadge: {
    backgroundColor: '#F5D7FF',
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6,
  },
  rxBadgeText: { fontFamily: FONTS.bold, fontSize: 9, color: colors.deepPlum },
  oosBadge: {
    backgroundColor: colors.borderSoft,
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6,
    alignSelf: 'flex-start',
  },
  oosBadgeText: { fontFamily: FONTS.bold, fontSize: 9, color: colors.textMuted },
  prodName: { fontFamily: FONTS.bold, fontSize: 14, color: colors.textDark },
  prodGeneric: { fontFamily: FONTS.medium, fontSize: 11, color: colors.textMuted },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 4 },
  prodPricePrefix: { fontFamily: FONTS.medium, fontSize: 10, color: colors.textMuted },
  prodPrice: { fontFamily: FONTS.black, fontSize: 14, color: colors.textDark },
  prodMrp: { fontFamily: FONTS.regular, fontSize: 11, color: colors.textMuted, textDecorationLine: 'line-through' },
  
  // Uber Eats Quantity Stepper Controls (- 1 +)
  addBtnInitial: {
    width: 32, height: 32, borderRadius: 10, backgroundColor: colors.midTeal,
    justifyContent: 'center', alignItems: 'center',
  },
  stepperBox: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.limeWhisper, borderRadius: 10, paddingHorizontal: 6, height: 32,
    borderWidth: 1, borderColor: '#D6EDA0',
  },
  stepperBtn: { width: 22, height: 22, justifyContent: 'center', alignItems: 'center' },
  stepperQtyText: { fontFamily: FONTS.black, fontSize: 14, color: colors.midTeal, paddingHorizontal: 2 },

  // Pharmacies List
  pharmacyList: { gap: 12 },
  pharmacyCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: colors.surfaceWhite, borderRadius: 18, padding: 16,
    borderWidth: 1, borderColor: colors.borderSoft,
  },
  pharmAvatar: {
    width: 44, height: 44, borderRadius: 14, backgroundColor: colors.limeWhisper,
    justifyContent: 'center', alignItems: 'center',
  },
  pharmInitial: { fontFamily: FONTS.black, fontSize: 18, color: colors.midTeal },
  pharmName: { fontFamily: FONTS.bold, fontSize: 15, color: colors.textDark },
  pharmAddr: { fontFamily: FONTS.medium, fontSize: 12, color: colors.textMuted },
  pharmMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  metaText: { fontFamily: FONTS.bold, fontSize: 12, color: colors.textDark },
  sep: { color: colors.textMuted, fontSize: 10 },
  viewStorePill: {
    backgroundColor: colors.limeWhisper, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
    borderWidth: 1, borderColor: '#D6EDA0',
  },
  viewStoreText: { fontFamily: FONTS.bold, fontSize: 11, color: colors.midTeal },

  // Store Front Page View
  storeHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: 52, paddingBottom: 12, paddingHorizontal: 20,
    backgroundColor: colors.bgWarm, borderBottomWidth: 1, borderBottomColor: colors.borderSoft,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: colors.surfaceWhite,
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.borderSoft,
  },
  storeHeaderTitle: { flex: 1, textAlign: 'center', fontFamily: FONTS.black, fontSize: 16, color: colors.textDark },
  storeScroll: { paddingBottom: 100 },
  storeCoverHero: {
    height: 240, backgroundColor: colors.limeWhisper,
    overflow: 'hidden', justifyContent: 'center', alignItems: 'center', position: 'relative',
  },
  sheetContent: {
    backgroundColor: colors.surfaceWhite, borderTopLeftRadius: 32, borderTopRightRadius: 32,
    marginTop: -32, shadowColor: '#1C1917',
    shadowOpacity: 0.05, shadowRadius: 16, shadowOffset: { width: 0, height: -4 }, elevation: 6,
    paddingBottom: 40, minHeight: Dimensions.get('window').height,
  },
  storeMainInfoCard: {
    padding: 24, paddingBottom: 16,
    gap: 10,
  },
  mapGridGraphic: { alignItems: 'center', gap: 4 },
  mapBadgeOpen: {
    position: 'absolute', top: 12, left: 12,
    backgroundColor: colors.surfaceWhite, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
  },
  mapBadgeOpenText: { fontFamily: FONTS.bold, fontSize: 11, color: colors.textDark },
  storeMainName: { fontFamily: FONTS.black, fontSize: 22, color: colors.textDark },
  storeMetaBadgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  metaPillText: { fontFamily: FONTS.medium, fontSize: 13, color: colors.textDark },
  infoMapBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'transparent',
    paddingVertical: 14, borderTopWidth: 1, borderTopColor: colors.borderSoft, marginTop: 4,
  },
  infoMapBtnTitle: { fontFamily: FONTS.bold, fontSize: 14, color: colors.textDark },
  infoMapBtnSub: { fontFamily: FONTS.medium, fontSize: 12, color: colors.textMuted },
  // Store Attach Prescription Card
  attachRxCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.limeWhisper, borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: '#D6EDA0', marginTop: 4,
  },
  attachRxTitle: { fontFamily: FONTS.bold, fontSize: 13, color: colors.midTeal },
  attachRxSub: { fontFamily: FONTS.medium, fontSize: 11, color: colors.textMuted, marginTop: 1 },
  attachRxBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.midTeal, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10,
  },
  attachRxBtnText: { fontFamily: FONTS.bold, fontSize: 12, color: '#FFFFFF' },
  storeSearchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.surfaceWhite, borderRadius: 16, borderWidth: 1, borderColor: colors.borderSoft,
    paddingHorizontal: 16, height: 48,
  },
  storeContactRow: { flexDirection: 'row', gap: 10, marginTop: 8, width: '100%' },
  contactBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: colors.limeWhisper, height: 42, borderRadius: 12, borderWidth: 1, borderColor: '#D6EDA0',
  },
  contactBtnText: { fontFamily: FONTS.bold, fontSize: 12, color: colors.midTeal },
  sectionTitleText: { fontFamily: FONTS.black, fontSize: 16, color: colors.textDark, marginTop: 6 },

  // Floating Uber Eats Bottom Cart Bar
  floatingCartWrap: {
    position: 'absolute', bottom: 20, left: 20, right: 20,
    shadowColor: '#0F172A', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 16, elevation: 6,
  },
  floatingCartBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.midTeal, borderRadius: 18, height: 54, paddingHorizontal: 16,
  },
  cartCountPill: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center', alignItems: 'center',
  },
  cartCountText: { fontFamily: FONTS.black, fontSize: 13, color: '#FFFFFF' },
  floatingCartText: { fontFamily: FONTS.bold, fontSize: 15, color: '#FFFFFF' },
  floatingCartTotal: { fontFamily: FONTS.black, fontSize: 15, color: '#FFFFFF' },

  // Item Detail Sheet Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.4)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: colors.surfaceWhite, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, gap: 12, position: 'relative',
  },
  closeModalBtn: {
    position: 'absolute', top: 16, right: 16, width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.bgWarm, justifyContent: 'center', alignItems: 'center', zIndex: 10,
  },
  modalHeroImg: { height: 160, padding: 6, borderRadius: 16, backgroundColor: colors.limeWhisper, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  modalTitle: { fontFamily: FONTS.black, fontSize: 20, color: colors.textDark },
  modalGeneric: { fontFamily: FONTS.medium, fontSize: 13, color: colors.textMuted },
  modalPriceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 4 },
  modalPrice: { fontFamily: FONTS.black, fontSize: 22, color: colors.midTeal },
  modalMrp: { fontFamily: FONTS.medium, fontSize: 14, color: colors.textMuted, textDecorationLine: 'line-through' },
  descHeading: { fontFamily: FONTS.bold, fontSize: 13, color: colors.textDark, marginTop: 4 },
  descBody: { fontFamily: FONTS.regular, fontSize: 13, color: colors.textSecondary, lineHeight: 18 },
  modalAddBtn: {
    backgroundColor: colors.midTeal, borderRadius: 16, height: 50,
    justifyContent: 'center', alignItems: 'center', marginTop: 10,
  },
  modalAddBtnText: { fontFamily: FONTS.bold, fontSize: 14, color: '#FFFFFF' },

  selectStoreBadgeBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: colors.limeWhisper, borderRadius: 10, paddingVertical: 8, marginTop: 8,
    borderWidth: 1, borderColor: '#D6EDA0',
  },
  selectStoreBadgeText: { fontFamily: FONTS.bold, fontSize: 11, color: colors.midTeal },

  paginationContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
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
});

const BrowsePharmacyCard = ({ p, onPress, s, colors }: any) => {
  const [isFav, setIsFav] = useState(p.isFavorite);
  const [favId, setFavId] = useState(p.favoriteId);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    setIsFav(p.isFavorite);
    setFavId(p.favoriteId);
  }, [p.isFavorite, p.favoriteId]);

  const handleFavorite = async (e: any) => {
    e.stopPropagation();
    
    // Animate the heart
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.6, duration: 150, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true })
    ]).start();

    try {
      const result = await pharmacyService.toggleFavorite(p, isFav, favId);
      setIsFav(result.isFavorite);
      setFavId(result.favoriteId);
    } catch (error) {
      console.warn('[BrowsePharmacyCard] Favorite toggle failed', error);
    }
  };

  return (
    <Pressable
      style={({ pressed }) => [s.pharmacyCard, pressed && { opacity: 0.92 }]}
      onPress={onPress}
    >
      <View style={s.pharmAvatar}>
        {p.image ? (
          <Image source={getLocalImage(p.image) || (typeof p.image === 'string' ? { uri: p.image } : p.image)} style={{ width: '100%', height: '100%', borderRadius: 14 }} resizeMode="cover" />
        ) : (
          <Text style={s.pharmInitial}>{p.name[0]}</Text>
        )}
      </View>

      <View style={{ flex: 1, gap: 2 }}>
        <Text style={s.pharmName}>{p.name}</Text>
        <Text style={s.pharmAddr}>{p.address}</Text>

        <View style={s.pharmMetaRow}>
          <Star color="#F59E0B" size={12} fill="#F59E0B" />
          <Text style={s.metaText}>{p.rating}</Text>
          <Text style={s.sep}>·</Text>
          <MapPin color={colors.textMuted} size={11} strokeWidth={2} />
          <Text style={s.metaText}>{p.distance}</Text>
        </View>
      </View>

      <View style={{ alignItems: 'flex-end', justifyContent: 'space-between', alignSelf: 'stretch' }}>
        <TouchableOpacity 
          onPress={handleFavorite} 
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          activeOpacity={0.7}
        >
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <Heart 
              color={isFav ? colors.error : colors.textMuted} 
              size={18} 
              fill={isFav ? colors.error : 'transparent'} 
            />
          </Animated.View>
        </TouchableOpacity>

        <View style={[s.viewStorePill, { marginTop: 'auto', backgroundColor: p.isOpen ? colors.bgWarm : colors.borderSoft }]}>
          <Text style={[s.viewStoreText, !p.isOpen && { color: colors.textMuted }]}>
            {p.isOpen ? 'Visit Store' : 'Closed'}
          </Text>
        </View>
      </View>
    </Pressable>
  );
};

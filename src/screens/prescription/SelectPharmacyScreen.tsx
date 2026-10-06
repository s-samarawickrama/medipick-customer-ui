
import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Modal,
  TouchableOpacity, Animated, StatusBar, Pressable, Image, TextInput,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ChevronLeft, Star, MapPin, ChevronRight, Navigation,
  Home, Store, Search, X, ChevronDown,
} from 'lucide-react-native';
import { useTheme, ThemeColors } from '../../context/ThemeContext';
import { useLocation } from '../../context/LocationContext';
import { FONTS } from '../../theme/typography';
import { listPharmacies, Pharmacy } from '../../api/pharmaciesApi';
import { getLocalImage } from '../../utils/imageMapper';
import { ActivityIndicator } from 'react-native';
import { MainStackParamList } from '../../navigation/MainNavigator';

type Nav = NativeStackNavigationProp<MainStackParamList>;
type Route = RouteProp<MainStackParamList, 'SelectPharmacy'>;

type DeliveryMode = 'home' | 'pickup';

const DELIVERY_ADDRESSES = [
  'Colombo 03 · Kollupitiya',
  'Colombo 07 · Cinnamon Gardens',
  'Colombo 05 · Havelock Town',
  'Dehiwala · Station Road',
  'Mount Lavinia · Beach Road',
];

export const SelectPharmacyScreen = () => {
  const { isDark, colors } = useTheme();
  const s = makeStyles(colors, isDark);
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();

  const opacity = useRef(new Animated.Value(0)).current;
  const slideY = useRef(new Animated.Value(14)).current;

  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [sortBy, setSortBy] = useState<'nearest' | 'rating'>('nearest');
  const [deliveryAddress, setDeliveryAddress] = useState('Colombo 03 · Kollupitiya');
  const [addressModalVisible, setAddressModalVisible] = useState(false);
  const [addressSearch, setAddressSearch] = useState('');

  useEffect(() => {
    StatusBar.setBarStyle(isDark ? 'light-content' : 'dark-content');
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 280, useNativeDriver: true }),
      Animated.spring(slideY, { toValue: 0, useNativeDriver: true, speed: 26 }),
    ]).start();
  }, []);

  const { coords, locationName } = useLocation();

  useEffect(() => {
    let isMounted = true;
    const fetchPharmacies = async () => {
      try {
        setLoading(true);
        const res = await listPharmacies({
          sort: sortBy === 'nearest' ? 'distance' : 'rating',
          latitude: coords?.latitude,
          longitude: coords?.longitude,
        });
        if (isMounted) {
          setPharmacies(res.data || []);
        }
      } catch (err) {
        console.error('Failed to load pharmacies:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    fetchPharmacies();
    return () => { isMounted = false; };
  }, [sortBy, coords?.latitude, coords?.longitude]);

  const selectPharmacy = (id: string, name: string) => {
    navigation.navigate('UploadPrescription', { pharmacyId: id, pharmacyName: name });
  };

  const filteredAddresses = DELIVERY_ADDRESSES.filter((a) =>
    a.toLowerCase().includes(addressSearch.trim().toLowerCase())
  );

  return (
    <View style={s.screen}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.bgWarm} />
      <View style={s.nav}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.75} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <ChevronLeft color={colors.midTeal} size={20} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={s.navTitle}>Select Pharmacy</Text>
        <View style={{ width: 36 }} />
      </View>

      <Animated.ScrollView
        style={{ opacity, transform: [{ translateY: slideY }] }}
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.counterRow}>
          <Text style={s.counterTitle}>Upload Prescription</Text>
          <Text style={s.counterSubtitle}>Choose a trusted pharmacy to fulfill your order.</Text>
        </View>

        {/* ── Location + Sort ── */}
        <View style={s.deliverySortRow}>
          <View style={s.deliveryAddressPill}>
            <Navigation color={colors.midTeal} size={14} strokeWidth={2.5} />
            <Text style={s.deliveryAddressLabel}>Your Location</Text>
            <Text style={s.deliveryAddressValue} numberOfLines={1}>{locationName.split(' · ')[0]}</Text>
            <ChevronDown color={colors.midTeal} size={16} strokeWidth={2.5} />
          </View>

          <View style={s.sortToggle}>
            <TouchableOpacity
              style={[s.sortBtn, sortBy === 'nearest' && s.sortBtnActive]}
              onPress={() => setSortBy('nearest')}
            >
              <Text style={[s.sortBtnText, sortBy === 'nearest' && s.sortBtnTextActive]}>Nearest</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.sortBtn, sortBy === 'rating' && s.sortBtnActive]}
              onPress={() => setSortBy('rating')}
            >
              <Text style={[s.sortBtnText, sortBy === 'rating' && s.sortBtnTextActive]}>Top Rated</Text>
            </TouchableOpacity>
          </View>
        </View>

        {loading ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.midTeal} />
          </View>
        ) : pharmacies.length === 0 ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <Text style={{ color: colors.textMuted, fontFamily: FONTS.medium }}>No pharmacies available</Text>
          </View>
        ) : (
          [...pharmacies]
            .sort((a, b) => {
              if (sortBy === 'rating') {
                return b.rating - a.rating;
              }
              const distA = parseFloat(a.distance) || 0;
              const distB = parseFloat(b.distance) || 0;
              return distA - distB;
            })
            .map((p) => {
              const isTopRated = p.rating >= 4.5;
              const imgSource = p.image
                ? typeof p.image === 'string' && (p.image.startsWith('http') || p.image.startsWith('data:'))
                  ? { uri: p.image }
                  : getLocalImage(p.image) || { uri: p.image }
                : null;

            return (
              <Pressable
                key={p.id}
                style={({ pressed }) => [
                  s.card,
                  pressed && { transform: [{ scale: 0.98 }] },
                  !p.isOpen && { opacity: 0.6 }
                ]}
                onPress={() => p.isOpen && selectPharmacy(p.id, p.name)}
              >
                <View style={s.cardTop}>
                  <View style={s.logoBox}>
                    {imgSource ? (
                      <Image source={imgSource} style={s.logoImg} resizeMode="cover" />
                    ) : (
                      <Text style={s.logoText}>{p.name.charAt(0)}</Text>
                    )}
                  </View>
                  <View style={s.cardInfo}>
                    <View style={s.nameBadgeRow}>
                      <Text style={s.pharmacyName} numberOfLines={1}>{p.name}</Text>
                      {isTopRated && (
                        <View style={s.badgeTop}>
                          <Text style={s.badgeTextTop}>TOP RATED</Text>
                        </View>
                      )}
                    </View>
                    <Text style={s.pharmacyAddress} numberOfLines={1}>{p.address}</Text>

                    <View style={s.ratingRow}>
                      <Star color="#F59E0B" size={13} fill="#F59E0B" />
                      <Text style={s.ratingText}>{p.rating}</Text>
                      <Text style={s.sep}>·</Text>
                      <MapPin color={colors.textMuted} size={11} strokeWidth={2.5} />
                      <Text style={s.metaText}>{p.distance}</Text>
                    </View>
                  </View>

                  <View style={[s.arrowCircle, !p.isOpen && { backgroundColor: colors.borderSubtle }]}>
                    <ChevronRight color={p.isOpen ? colors.midTeal : colors.textMuted} size={20} strokeWidth={2.5} />
                  </View>
                </View>
              </Pressable>
            );
          })
        )}
      </Animated.ScrollView>

      {/* Address Selection Modal */}
      <Modal
        visible={addressModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setAddressModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={s.addrModalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={1}
            onPress={() => setAddressModalVisible(false)}
          />
          <View style={s.addrModalCard}>
            <View style={s.addrModalHeader}>
              <Text style={s.addrModalTitle}>Change Your Location</Text>
              <TouchableOpacity onPress={() => setAddressModalVisible(false)}>
                <X color={colors.textMuted} size={20} strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <View style={s.addrSearchBar}>
              <Search color={colors.midTeal} size={16} strokeWidth={2.5} />
              <TextInput
                style={s.addrSearchInput}
                placeholder="Search area or city..."
                placeholderTextColor={colors.textMuted}
                value={addressSearch}
                onChangeText={setAddressSearch}
                autoFocus
              />
              {addressSearch.length > 0 && (
                <TouchableOpacity onPress={() => setAddressSearch('')}>
                  <X color={colors.textMuted} size={14} strokeWidth={2} />
                </TouchableOpacity>
              )}
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {filteredAddresses.map((addr) => {
                const isSelected = deliveryAddress === addr;
                return (
                  <TouchableOpacity
                    key={addr}
                    style={[s.addrOption, isSelected && s.addrOptionSelected]}
                    onPress={() => {
                      setDeliveryAddress(addr);
                      setAddressModalVisible(false);
                      setAddressSearch('');
                    }}
                    activeOpacity={0.8}
                  >
                    <MapPin color={isSelected ? colors.midTeal : colors.textMuted} size={16} strokeWidth={2} />
                    <Text style={[s.addrOptionText, isSelected && s.addrOptionTextSelected]}>
                      {addr}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const makeStyles = (colors: ThemeColors, isDark: boolean) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgWarm },
  nav: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: 56, paddingBottom: 16, paddingHorizontal: 20,
    backgroundColor: colors.bgWarm,
    borderBottomWidth: 1, borderBottomColor: colors.borderSoft,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: colors.surfaceWhite,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: colors.borderSoft,
  },
  navTitle: {
    flex: 1, textAlign: 'center', fontSize: 16,
    fontFamily: FONTS.bold, color: colors.midTeal,
  },
  scroll: { padding: 20, paddingBottom: 60, gap: 14 },
  counterRow: { marginBottom: 4, gap: 4 },
  counterTitle: { fontSize: 24, fontFamily: FONTS.black, color: colors.textDark },
  counterSubtitle: { fontSize: 14, fontFamily: FONTS.medium, color: colors.textMuted },

  // ── Delivery Mode Card ──
  modeToggleCard: {
    backgroundColor: colors.surfaceWhite,
    borderRadius: 18,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  modeToggleLabel: {
    fontFamily: FONTS.bold,
    fontSize: 12,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  modeToggleRow: {
    flexDirection: 'row',
    gap: 10,
  },
  modeToggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: colors.bgWarm,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  modeToggleBtnActive: {
    backgroundColor: colors.midTeal,
    borderColor: colors.midTeal,
  },
  modeToggleText: {
    fontFamily: FONTS.bold,
    fontSize: 13,
    color: colors.textMuted,
  },
  modeToggleTextActive: {
    color: '#FFFFFF',
  },
  deliverySortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  deliveryAddressPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.bgWarm,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  deliveryAddressLabel: {
    fontFamily: FONTS.medium,
    fontSize: 9,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  deliveryAddressValue: {
    fontFamily: FONTS.bold,
    fontSize: 12,
    color: colors.textDark,
    flex: 1,
  },
  pickupInfoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.bgWarm,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  pickupInfoText: {
    fontFamily: FONTS.medium,
    fontSize: 12,
    color: colors.textMuted,
    flex: 1,
    lineHeight: 18,
  },

  sortToggle: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceWhite,
    borderRadius: 12, padding: 4, borderWidth: 1, borderColor: colors.borderSoft,
  },
  sortBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  sortBtnActive: { backgroundColor: colors.midTeal },
  sortBtnText: { fontFamily: FONTS.semibold, fontSize: 11, color: colors.textMuted },
  sortBtnTextActive: { color: '#FFF' },

  card: {
    backgroundColor: colors.surfaceWhite,
    borderRadius: 20, padding: 16,
    borderWidth: 1, borderColor: colors.borderSoft,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: isDark ? 0.12 : 0.04, shadowRadius: 16, elevation: 3,
    marginBottom: 4,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  logoBox: {
    width: 68, height: 68, borderRadius: 18,
    backgroundColor: colors.limeWhisper,
    justifyContent: 'center', alignItems: 'center',
    overflow: 'hidden',
  },
  logoImg: { width: '100%', height: '100%' },
  logoText: { fontSize: 24, fontFamily: FONTS.black, color: colors.midTeal },
  cardInfo: { flex: 1, gap: 2, justifyContent: 'center' },
  nameBadgeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  pharmacyName: { flex: 1, fontSize: 15, fontFamily: FONTS.bold, color: colors.textDark },
  badgeTop: {
    backgroundColor: isDark ? '#302910' : '#FEF3C7',
    paddingHorizontal: 6, paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: isDark ? '#4A3A10' : '#FDE68A',
  },
  badgeTextTop: {
    fontFamily: FONTS.bold, fontSize: 9, letterSpacing: 0.5,
    color: isDark ? '#D4A830' : '#D97706',
  },
  pharmacyAddress: { fontSize: 12, fontFamily: FONTS.medium, color: colors.textMuted },

  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  ratingText: { fontSize: 12, fontFamily: FONTS.bold, color: colors.textDark },
  metaText: { fontSize: 12, fontFamily: FONTS.bold, color: colors.textDark },
  sep: { color: colors.textMuted, fontSize: 10 },
  arrowCircle: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: colors.limeWhisper,
    justifyContent: 'center', alignItems: 'center',
  },

  // ── Address Modal ──
  addrModalOverlay: {
    flex: 1,
    backgroundColor: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  addrModalCard: {
    backgroundColor: colors.surfaceWhite,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, paddingBottom: Platform.OS === 'ios' ? 36 : 28,
    gap: 14, maxHeight: '75%',
  },
  addrModalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  addrModalTitle: {
    fontFamily: FONTS.black, fontSize: 18, color: colors.textDark,
  },
  addrSearchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.bgWarm, borderRadius: 12, paddingHorizontal: 14, height: 44,
    borderWidth: 1, borderColor: colors.borderSoft,
  },
  addrSearchInput: {
    flex: 1, fontFamily: FONTS.medium, fontSize: 13, color: colors.textDark,
    outlineStyle: 'none' as any, outlineWidth: 0 as any,
  },
  addrOption: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 13, paddingHorizontal: 10, borderRadius: 12, marginVertical: 2,
  },
  addrOptionSelected: { backgroundColor: colors.limeWhisper },
  addrOptionText: { flex: 1, fontFamily: FONTS.bold, fontSize: 13, color: colors.textDark },
  addrOptionTextSelected: { color: colors.midTeal },
});

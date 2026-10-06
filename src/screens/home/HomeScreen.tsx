import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  StatusBar,
  Pressable,
  TouchableOpacity,
  Image,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ShoppingCart, Bell, MapPin, Search, ChevronRight, X, ChevronDown, CheckCircle, Info, Heart, Upload, Lightbulb, Tag, Star, Clock, Store, Navigation } from 'lucide-react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { PrescriptionHeroGraphic, CategoryTileGraphic } from '../../components/common/HeroIllustrations';
import { useCart } from '../../context/CartContext';
import { MedicineCard } from '../../components/common/MedicineCard';
import { useTheme, ThemeColors } from '../../context/ThemeContext';
import { useLocation } from '../../context/LocationContext';
import { FONTS } from '../../theme/typography';
import { listMedicines } from '../../api/medicinesApi';
import type { Medicine } from '../../api/medicinesApi';
import { pharmacyService } from '../../services/pharmacyService';
import type { Pharmacy } from '../../api/pharmaciesApi';
import { useOrders } from '../../context/OrderContext';
import { MainStackParamList } from '../../navigation/MainNavigator';
import { getLocalImage } from '../../utils/imageMapper';

type Nav = NativeStackNavigationProp<MainStackParamList>;

const { width } = Dimensions.get('window');

const AnimatedHeartButton = ({ isFavorite, onPress, colors, s }: { isFavorite: boolean, onPress: () => void, colors: ThemeColors, s: ReturnType<typeof makeStyles> }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = (e: any) => {
    e.stopPropagation();
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.6, duration: 150, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true })
    ]).start();
    onPress();
  };

  return (
    <TouchableOpacity
      style={s.favBtn}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      onPress={handlePress}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Heart
          color={isFavorite ? "#EF4444" : colors.borderSoft}
          size={18}
          strokeWidth={2}
          fill={isFavorite ? "#EF4444" : "transparent"}
        />
      </Animated.View>
    </TouchableOpacity>
  );
};

const CATEGORIES_MEDICHY = [
  { id: 'chronic', name: 'Chronic', type: 'chronic' as const },
  { id: 'coldflu', name: 'Cold & Flu', type: 'coldflu' as const },
  { id: 'vitamins', name: 'Vitamins', type: 'vitamins' as const },
  { id: 'firstaid', name: 'First Aid', type: 'firstaid' as const },
  { id: 'supplements', name: 'Supplements', type: 'supplements' as const },
  { id: 'skincare', name: 'Skincare', type: 'skincare' as const },
  { id: 'personalcare', name: 'Personal Care', type: 'personalcare' as const },
  { id: 'baby', name: 'Baby Care', type: 'baby' as const },
];



export const HomeScreen = () => {
  const { isDark, colors } = useTheme();
  const s = makeStyles(colors, isDark);
  const navigation = useNavigation<Nav>();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const { cartItems } = useCart();
  const { coords, locationName, setLocationName, setCoords, refreshLocation } = useLocation();
  const [, setFavTick] = useState(0);
  const [locationModal, setLocationModal] = useState(false);
  const [locationSearch, setLocationSearch] = useState('');
  const [searchedLocations, setSearchedLocations] = useState<any[]>([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);

  const opacity = useRef(new Animated.Value(0)).current;
  const slideY = useRef(new Animated.Value(14)).current;

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Sync location search with Photon API for fuzzy autocomplete
  useEffect(() => {
    const handler = setTimeout(async () => {
      if (locationSearch.trim().length < 3) {
        setSearchedLocations([]);
        return;
      }
      setIsSearchingLocation(true);
      try {
        // Strict bounding box for Sri Lanka (Long: 79.5 to 81.9, Lat: 5.9 to 9.9)
        const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(locationSearch)}&bbox=79.5,5.9,81.9,9.9&limit=5`);
        const data = await res.json();
        
        if (data.features) {
          // All results are guaranteed to be in SL because of bbox
          const uniqueNames = new Set<string>();
          const filtered = data.features.filter((item: any) => {
             const name = item.properties.name || item.properties.city;
             if (!name || uniqueNames.has(name)) return false;
             uniqueNames.add(name);
             return true;
          });

          setSearchedLocations(filtered.map((item: any) => {
            const { name, city, state, country } = item.properties;
            const lon = item.geometry.coordinates[0];
            const lat = item.geometry.coordinates[1];
            
            // Build a readable full name
            const parts = [name, city, state].filter(Boolean);
            const fullName = Array.from(new Set(parts)).join(', ') + (country ? `, ${country}` : '');
            
            return {
              name: name || city || 'Unknown Location',
              fullName: fullName,
              lat: lat,
              lng: lon
            };
          }));
        } else {
          setSearchedLocations([]);
        }
      } catch (e) {
        console.error('Location search failed:', e);
      } finally {
        setIsSearchingLocation(false);
      }
    }, 400); // reduced debounce slightly for snappier autocomplete
    return () => clearTimeout(handler);
  }, [locationSearch]);

  // Ensure fresh data when returning to Home screen
  useFocusEffect(
    React.useCallback(() => {
      queryClient.invalidateQueries({ queryKey: ['pharmacies'] });
      queryClient.invalidateQueries({ queryKey: ['medicines'] });
    }, [queryClient])
  );

  useEffect(() => {
    StatusBar.setBarStyle(isDark ? 'light-content' : 'dark-content');
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 320, useNativeDriver: true }),
      Animated.spring(slideY, { toValue: 0, useNativeDriver: true, speed: 26 }),
    ]).start();
  }, []);

  const { data: medRes, isLoading: isMedLoading } = useQuery({
    queryKey: ['medicines', debouncedSearch],
    queryFn: () => listMedicines({ search: debouncedSearch, limit: debouncedSearch ? 10 : 4 }),
  });

  const { data: pharmRes, isLoading: isPharmLoading } = useQuery({
    queryKey: ['pharmacies', debouncedSearch, coords?.latitude, coords?.longitude],
    queryFn: () => pharmacyService.getPharmacies({ search: debouncedSearch, limit: debouncedSearch ? 10 : 6, latitude: coords?.latitude, longitude: coords?.longitude }),
  });

  const { isLoggedIn } = useAuth();

  const { orders } = useOrders();

  const isInitialLoading = isMedLoading || isPharmLoading;
  const medicines = medRes?.data || [];
  const pharmacies = pharmRes?.data || [];
  
  const activeOrders = orders.filter(o => 
    !['COMPLETED', 'CANCELLED', 'DECLINED_BY_PHARMACY', 'DECLINED_BY_CUSTOMER', 'NOT_PICKED_UP'].includes(o.state)
  );

  const handleToggleFav = async (pharmacy: Pharmacy) => {
    try {
      const { isFavorite, favoriteId } = await pharmacyService.toggleFavorite(pharmacy);
      
      queryClient.setQueryData(['pharmacies', debouncedSearch, coords?.latitude, coords?.longitude], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          data: oldData.data.map((p: Pharmacy) => 
            p.id === pharmacy.id ? { ...p, isFavorite, favoriteId } : p
          )
        };
      });
      
    } catch (e) {
      // Errors logged in service
    }
  };

  const totalCartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const currentCityName = locationName.split(' · ')[0];
  
  const dynamicLocations: any[] = [];
  
  // 1. Always show the currently selected location first
  if (currentCityName !== 'Locating...' && currentCityName !== 'Location Access Denied' && currentCityName !== 'Location Unavailable') {
    dynamicLocations.push({
      name: locationName,
      lat: coords?.latitude || 6.9271,
      lng: coords?.longitude || 79.8612
    });
  }

  // 2. Suggest nearby major cities based on current coordinates
  const MAJOR_CITIES = [
    { name: 'Colombo · Western Province', lat: 6.9271, lng: 79.8612 },
    { name: 'Dehiwala · Western Province', lat: 6.8406, lng: 79.8687 },
    { name: 'Kandy · Central Province', lat: 7.2906, lng: 80.6337 },
    { name: 'Galle · Southern Province', lat: 6.0328, lng: 80.2150 },
    { name: 'Negombo · Western Province', lat: 7.2008, lng: 79.8737 },
    { name: 'Gampaha · Western Province', lat: 7.0873, lng: 79.9925 },
    { name: 'Kadawatha · Western Province', lat: 7.0021, lng: 79.9512 },
    { name: 'Matara · Southern Province', lat: 5.9496, lng: 80.5353 },
    { name: 'Kurunegala · North Western Province', lat: 7.4818, lng: 80.3609 },
    { name: 'Jaffna · Northern Province', lat: 9.6615, lng: 80.0255 },
  ];

  if (coords && locationSearch.trim().length === 0) {
    const withDistance = MAJOR_CITIES.map(city => {
      // simple euclidean distance for ranking purposes
      const d = Math.sqrt(Math.pow(city.lat - coords.latitude, 2) + Math.pow(city.lng - coords.longitude, 2));
      return { ...city, distance: d };
    });
    
    // Sort by distance and take closest 3 that aren't the current city
    const closest = withDistance
      .sort((a, b) => a.distance - b.distance)
      .filter(city => city.name.split(' · ')[0] !== currentCityName)
      .slice(0, 3);
      
    dynamicLocations.push(...closest);
  }

  const filteredLocations = dynamicLocations.filter((loc) =>
    loc.name.toLowerCase().includes(locationSearch.trim().toLowerCase())
  );

  return (
    <View style={s.screen}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.bgWarm}
      />

      {/* Header Navbar */}
      <View style={s.topBar}>
        <View style={s.userInfoRow}>
          <TouchableOpacity style={s.avatarCircle} onPress={() => (navigation as any).navigate('Profile')}>
            <Text style={s.avatarInitial}>P</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setLocationModal(true)}
            activeOpacity={0.75}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={{ flex: 1, paddingRight: 8 }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={s.deliverLabel}>COUNTER PICKUP ONLY</Text>
              <ChevronDown color={colors.midTeal} size={14} strokeWidth={2.8} />
            </View>
            <Text style={s.greetingTitle} numberOfLines={1} ellipsizeMode="tail">{locationName}</Text>
          </TouchableOpacity>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TouchableOpacity
            style={s.bellBtn}
            activeOpacity={0.8}
            onPress={() => (navigation as any).navigate('MultiStoreCart')}
          >
            <ShoppingCart color={colors.textDark} size={19} strokeWidth={2} />
            {totalCartCount > 0 && (
              <View style={s.cartBadgeTop}>
                <Text style={s.cartBadgeTopText}>{totalCartCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={s.bellBtn}
            activeOpacity={0.8}
            onPress={() => (navigation as any).navigate('Notifications')}
          >
            <Bell color={colors.textDark} size={19} strokeWidth={2} />
            <View style={s.bellDot} />
          </TouchableOpacity>
        </View>
      </View>

      <Animated.ScrollView
        style={{ flex: 1, opacity }}
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        {activeOrders.length > 0 && (
          <TouchableOpacity
            style={s.activeOrderBanner}
            onPress={() => (navigation as any).navigate('Tabs', { screen: 'Orders' })}
            activeOpacity={0.9}
          >
            <View style={s.bannerDotPulse} />
            <Text style={s.bannerText}>{activeOrders.length} Live Order{activeOrders.length > 1 ? 's' : ''} in Progress</Text>
            <View style={{ flex: 1 }} />
            <View style={s.bannerTrackBadge}>
              <Text style={s.bannerAction}>Track</Text>
              <ChevronRight color={colors.midTeal} size={14} strokeWidth={2.5} />
            </View>
          </TouchableOpacity>
        )}

        {/* Search Bar Input */}
        <View style={s.searchBarContainer}>
          <Search color={colors.midTeal} size={18} strokeWidth={2.5} />
          <TextInput
            style={s.searchInputInline}
            placeholder="Search medicines or partner pharmacies..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <X color={colors.textMuted} size={18} strokeWidth={2.5} />
            </TouchableOpacity>
          )}
        </View>

        {!searchQuery && (
          <>
            {/* Prescription Hero Banner Card */}
            <TouchableOpacity
              style={s.heroBannerCard}
              onPress={() => navigation.navigate('SelectPharmacy')}
              activeOpacity={0.92}
            >
              <View style={s.heroContent}>
                <View style={s.discountBadge}>
                  <Text style={s.discountText}>Prescription Matching</Text>
                </View>

                <Text style={s.heroTitle}>Got a{'\n'}Prescription?</Text>
                <Text style={s.heroSub}>Upload it and get quotes from top pharmacies instantly.</Text>

                <View style={{ backgroundColor: colors.midTeal, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, marginTop: 10, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Upload color="#fff" size={14} strokeWidth={2.5} />
                  <Text style={{ fontFamily: FONTS.bold, fontSize: 13, color: '#FFFFFF' }}>Upload Prescription</Text>
                </View>
              </View>

              <PrescriptionHeroGraphic />
            </TouchableOpacity>

            {/* Quick Access Pills: Favorites + Health Tips */}
            <View style={s.quickAccessRow}>
              <TouchableOpacity
                style={s.quickPill}
                onPress={() => (navigation as any).navigate('Favorites')}
                activeOpacity={0.8}
              >
                <View style={s.quickPillIcon}>
                  <Heart color="#EF4444" size={16} strokeWidth={2.5} fill="#EF4444" />
                </View>
                <Text style={s.quickPillText}>Favorites</Text>
                <ChevronRight color={colors.textMuted} size={14} strokeWidth={2} />
              </TouchableOpacity>

              <TouchableOpacity
                style={s.quickPill}
                onPress={() => (navigation as any).navigate('HealthTips')}
                activeOpacity={0.8}
              >
                <View style={[s.quickPillIcon, { backgroundColor: isDark ? '#1E1A26' : '#F5D7FF' }]}>
                  <Lightbulb color={colors.deepPlum} size={16} strokeWidth={2.5} />
                </View>
                <Text style={s.quickPillText}>Health Tips</Text>
                <ChevronRight color={colors.textMuted} size={14} strokeWidth={2} />
              </TouchableOpacity>
            </View>

            {/* Categories Carousel */}
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>Categories</Text>
              <TouchableOpacity onPress={() => (navigation as any).navigate('Tabs', { screen: 'Browse', params: { initialMode: 'meds', category: 'All' } })}>
                <Text style={s.seeAllText}>See all</Text>
              </TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.categoriesScroll}>
              {CATEGORIES_MEDICHY.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={s.catCardTile}
                  onPress={() => (navigation as any).navigate('Tabs', { screen: 'Browse', params: { initialMode: 'meds', category: cat.name } })}
                  activeOpacity={0.8}
                >
                  <CategoryTileGraphic type={cat.type} />
                  <Text style={s.catTileName} numberOfLines={1}>{cat.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Featured Pharmacies Carousel */}
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>Featured Pharmacies</Text>
              <TouchableOpacity onPress={() => (navigation as any).navigate('Tabs', { screen: 'Browse', params: { initialMode: 'pharmacies' } })}>
                <Text style={s.seeAllText}>See all</Text>
              </TouchableOpacity>
            </View>

            {isInitialLoading || isPharmLoading ? (
              <View style={{ height: 200, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={colors.midTeal} />
                <Text style={{ marginTop: 12, fontFamily: FONTS.medium, color: colors.textMuted }}>Loading pharmacies...</Text>
              </View>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.storeCarousel}>
                {pharmacies.map((p) => (
                <Pressable
                  key={p.id}
                  style={({ pressed }) => [s.doorDashStoreCard, pressed && { opacity: 0.92 }]}
                  onPress={() => (navigation as any).navigate('Tabs', { screen: 'Browse', params: { initialMode: 'pharmacies', storeId: p.id } })}
                >
                  <View style={s.storeHeroBanner}>
                    {p.image ? (
                      <Image source={getLocalImage(p.image) || (typeof p.image === 'string' ? { uri: p.image } : p.image)} style={{ width: '100%', height: '100%', borderRadius: 16 }} resizeMode="cover" />
                    ) : (
                      <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: colors.surfaceWhite, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, elevation: 2 }}>
                        <Store color={colors.midTeal} size={26} strokeWidth={2.2} />
                      </View>
                    )}

                    {/* Live Open/Closed Badge */}
                    <View style={{ position: 'absolute', top: 10, left: 10, backgroundColor: isDark ? 'rgba(13,27,28,0.88)' : 'rgba(255,255,255,0.95)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: p.isOpen ? '#10B981' : '#EF4444' }} />
                      <Text style={{ fontFamily: FONTS.bold, fontSize: 10, color: colors.textDark }}>
                        {p.isOpen ? 'Open Now' : 'Closed'}
                      </Text>
                    </View>

                    {/* Orange Offer Badge */}
                    {p.hasOffer && p.offerTag && (
                      <View style={s.offerBadge}>
                        <Tag color="#FFFFFF" size={9} strokeWidth={2.5} />
                        <Text style={s.offerBadgeText}>{p.offerTag}</Text>
                      </View>
                    )}

                    <View style={s.storeDistanceTag}>
                      <MapPin color={colors.midTeal} size={11} strokeWidth={2.5} />
                      <Text style={s.storeDistanceText}>{p.distance}</Text>
                    </View>

                    <AnimatedHeartButton
                      isFavorite={!!p.isFavorite}
                      onPress={() => handleToggleFav(p)}
                      colors={colors}
                      s={s}
                    />
                  </View>

                  <View style={s.storeMetaContainer}>
                    <Text style={s.storeTitle} numberOfLines={1}>{p.name}</Text>
                    <Text style={s.storeSubText} numberOfLines={1}>{p.address}</Text>

                    <View style={s.storeRatingRow}>
                      <Star color="#F59E0B" size={12} fill="#F59E0B" />
                      <Text style={s.ratingText}>{p.rating}</Text>
                      <Text style={s.ratingCount}>({p.ratingCount}+)</Text>
                      <Text style={s.bullet}>·</Text>
                      <Clock color={colors.textMuted} size={11} strokeWidth={2} />
                      <Text style={s.timeText}>{p.estimatedResponseTime}</Text>
                    </View>
                  </View>
                </Pressable>
                ))}
                {pharmacies.length === 0 && (
                  <Text style={{ fontFamily: FONTS.medium, color: colors.textMuted, marginVertical: 20, textAlign: 'center', width: width - 40 }}>
                    No pharmacies found.
                  </Text>
                )}
              </ScrollView>
            )}
          </>
        )}

        {/* Popular Healthcare Products / Search Results Grid */}
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>{searchQuery ? 'Search Results' : 'Popular Healthcare'}</Text>
          {!searchQuery && (
            <TouchableOpacity onPress={() => (navigation as any).navigate('Tabs', { screen: 'Browse', params: { initialMode: 'meds', category: 'All' } })}>
              <Text style={s.seeAllText}>See All</Text>
            </TouchableOpacity>
          )}
        </View>

        {isInitialLoading || isMedLoading ? (
          <View style={{ height: 200, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ fontFamily: FONTS.medium, color: colors.textMuted }}>Searching medicines...</Text>
          </View>
        ) : medicines.length === 0 ? (
          <View style={{ height: 200, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ fontFamily: FONTS.bold, color: colors.textDark, fontSize: 16 }}>No medicines found</Text>
            <Text style={{ fontFamily: FONTS.medium, color: colors.textMuted, marginTop: 4 }}>Try a different search term</Text>
          </View>
        ) : (
          <View style={s.productGrid}>
            {medicines.map((med) => (
              <MedicineCard
                key={med.id}
                med={med as unknown as any}
                onPress={() => (navigation as any).navigate('Tabs', { screen: 'Browse', params: { initialMode: 'meds', category: med.category || 'All', medId: med.id } })}
                isGlobal={true}
                onStoreSelectPress={() => (navigation as any).navigate('Tabs', { screen: 'Browse', params: { initialMode: 'pharmacies', medId: med.id } })}
              />
            ))}
          </View>
        )}

      </Animated.ScrollView>

      {/* Full-Screen Location Search Modal */}
      {locationModal && (
        <Modal
          visible={locationModal}
          animationType="slide"
          transparent={false}
          onRequestClose={() => setLocationModal(false)}
        >
          <KeyboardAvoidingView
            style={{ flex: 1, backgroundColor: colors.bgWarm }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.bgWarm} />
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: 52, paddingBottom: 12, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: colors.borderSoft, gap: 12, backgroundColor: colors.surfaceWhite }}>
              <TouchableOpacity onPress={() => setLocationModal(false)} style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: colors.bgWarm, justifyContent: 'center', alignItems: 'center' }}>
                <X color={colors.textDark} size={20} strokeWidth={2.5} />
              </TouchableOpacity>
              <Text style={{ fontFamily: FONTS.black, fontSize: 18, color: colors.textDark, flex: 1 }}>Select Pickup Location</Text>
            </View>

            <View style={{ padding: 20, gap: 16, flex: 1 }}>
              <View style={s.locationSearchBar}>
                <Search color={colors.midTeal} size={18} strokeWidth={2.5} />
                <TextInput
                  style={s.locationSearchInput}
                  placeholder="Search city, area, or street..."
                  placeholderTextColor={colors.textMuted}
                  value={locationSearch}
                  onChangeText={setLocationSearch}
                  autoFocus
                />
                {locationSearch.length > 0 && (
                  <TouchableOpacity onPress={() => setLocationSearch('')}>
                    <X color={colors.textMuted} size={16} strokeWidth={2} />
                  </TouchableOpacity>
                )}
              </View>

              <Text style={{ fontFamily: FONTS.bold, fontSize: 12, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {locationSearch.length >= 3 ? 'Search Results' : 'Nearby Service Locations'}
              </Text>

              {isSearchingLocation ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                  <ActivityIndicator color={colors.midTeal} size="large" />
                  <Text style={{ fontFamily: FONTS.medium, marginTop: 12, color: colors.textMuted }}>Searching locations...</Text>
                </View>
              ) : (
                <ScrollView
                  style={{ flex: 1 }}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  {locationSearch.length < 3 && (
                    <TouchableOpacity
                      style={[s.locationItemRow, { paddingVertical: 14, marginVertical: 2, backgroundColor: colors.surfaceWhite, borderWidth: 1, borderColor: colors.midTeal, borderRadius: 12, paddingHorizontal: 12 }]}
                      onPress={() => {
                        setLocationModal(false);
                        refreshLocation();
                      }}
                      activeOpacity={0.8}
                    >
                      <Navigation color={colors.midTeal} size={18} strokeWidth={2.5} />
                      <Text style={[s.locationItemText, { color: colors.midTeal, fontFamily: FONTS.bold, marginLeft: 8 }]}>
                        Use Current Device Location
                      </Text>
                    </TouchableOpacity>
                  )}

                  {(locationSearch.length >= 3 ? searchedLocations : filteredLocations).map((loc, idx) => {
                    const isSelected = locationName.includes(loc.name.split(' · ')[0]);

                    return (
                      <TouchableOpacity
                        key={idx}
                        style={[s.locationItemRow, isSelected && s.locationItemRowSelected, { paddingVertical: 14, marginVertical: 2 }]}
                        onPress={() => {
                          setLocationName(`${loc.name.split(' · ')[0]} · Nearby Pharmacies`);
                          setCoords({ latitude: loc.lat, longitude: loc.lng });
                          setLocationModal(false);
                          setLocationSearch('');
                        }}
                        activeOpacity={0.8}
                      >
                        <MapPin color={isSelected ? colors.midTeal : colors.textMuted} size={18} strokeWidth={2} />
                        <View style={{ flex: 1, marginLeft: 8 }}>
                          <Text style={[s.locationItemText, isSelected && s.locationItemTextSelected]}>
                            {loc.name}
                          </Text>
                          {loc.fullName && (
                            <Text style={{ fontFamily: FONTS.medium, fontSize: 11, color: colors.textMuted, marginTop: 2 }}>
                              {loc.fullName}
                            </Text>
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                  
                  {locationSearch.length >= 3 && searchedLocations.length === 0 && !isSearchingLocation && (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 40 }}>
                      <MapPin color={colors.borderSoft} size={48} strokeWidth={1.5} />
                      <Text style={{ fontFamily: FONTS.bold, fontSize: 16, color: colors.textMuted, marginTop: 16 }}>No locations found</Text>
                      <Text style={{ fontFamily: FONTS.medium, fontSize: 13, color: colors.textMuted, marginTop: 4, textAlign: 'center' }}>
                        Try checking your spelling or searching for a nearby city.
                      </Text>
                    </View>
                  )}
                </ScrollView>
              )}
            </View>
          </KeyboardAvoidingView>
        </Modal>
      )}
    </View>
  );
};

const makeStyles = (colors: ThemeColors, isDark: boolean) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgWarm },

  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.bgWarm,
    paddingTop: 52,
    paddingBottom: 14,
    paddingHorizontal: 20,
  },
  userInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, paddingRight: 8 },
  avatarCircle: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.midTeal,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarInitial: { fontFamily: FONTS.black, fontSize: 18, color: '#FFFFFF' },
  deliverLabel: { fontFamily: FONTS.extrabold, fontSize: 10, color: colors.midTeal, letterSpacing: 0.8 },
  greetingTitle: { fontFamily: FONTS.black, fontSize: 16, color: colors.textDark, letterSpacing: -0.3 },

  bellBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.surfaceWhite,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: colors.borderSoft,
    position: 'relative',
  },
  bellDot: {
    position: 'absolute', top: 9, right: 9,
    width: 7, height: 7, borderRadius: 3.5,
    backgroundColor: colors.midTeal,
  },
  cartBadgeTop: {
    position: 'absolute', top: -4, right: -4,
    backgroundColor: colors.midTeal, minWidth: 18, height: 18, borderRadius: 9,
    paddingHorizontal: 4,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5, borderColor: colors.surfaceWhite,
  },
  cartBadgeTopText: { fontFamily: FONTS.black, fontSize: 9, color: '#FFFFFF' },

  scroll: { padding: 20, paddingBottom: 100, gap: 16 },

  activeOrderBanner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.midTeal,
    marginTop: 4, paddingHorizontal: 16, paddingVertical: 12,
    borderRadius: 16,
    shadowColor: '#1D6F72', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.18, shadowRadius: 8, elevation: 3,
  },
  bannerDotPulse: { width: 9, height: 9, borderRadius: 4.5, backgroundColor: '#34D399', marginRight: 10 },
  bannerText: { fontFamily: FONTS.bold, fontSize: 13, color: '#FFFFFF' },
  bannerTrackBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.limeWhisper,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
  },
  bannerAction: { fontFamily: FONTS.bold, fontSize: 12, color: colors.midTeal },

  searchBarContainer: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.surfaceWhite, borderRadius: 16,
    height: 52, paddingHorizontal: 16,
    borderWidth: 1.5, borderColor: colors.borderSoft,
    marginBottom: 4,
  },
  searchInputInline: { flex: 1, fontFamily: FONTS.medium, fontSize: 14, color: colors.textDark },

  heroBannerCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.heroPeach, borderRadius: 24, padding: 20,
    marginTop: 4,
    borderWidth: 1.5, borderColor: colors.heroPeachDark, overflow: 'hidden',
  },
  heroContent: { flex: 1, gap: 4 },
  heroTitle: { fontFamily: FONTS.black, fontSize: 22, color: colors.textDark, lineHeight: 26 },
  heroSub: { fontFamily: FONTS.medium, fontSize: 13, color: colors.textSecondary, opacity: 0.9, marginTop: 2 },
  discountBadge: {
    alignSelf: 'flex-start', backgroundColor: colors.surfaceWhite,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginBottom: 6,
  },
  discountText: { fontFamily: FONTS.bold, fontSize: 11, color: colors.midTeal },

  // ── Quick Access Pills ──
  quickAccessRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 6,
    marginTop: 2,
  },
  quickPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surfaceWhite,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  quickPillIcon: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: isDark ? '#2E1C20' : '#FEF2F2',
    justifyContent: 'center', alignItems: 'center',
  },
  quickPillText: {
    flex: 1,
    fontFamily: FONTS.bold,
    fontSize: 13,
    color: colors.textDark,
  },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontFamily: FONTS.black, fontSize: 18, color: colors.textDark, letterSpacing: -0.4 },
  seeAllText: { fontFamily: FONTS.bold, fontSize: 13, color: colors.midTeal },

  categoriesScroll: { gap: 16, paddingRight: 20 },
  catCardTile: { alignItems: 'center', width: 64 },
  catTileName: { fontFamily: FONTS.bold, fontSize: 11, color: colors.textDark, textAlign: 'center', marginTop: 4 },

  // DoorDash Store Carousel
  storeCarousel: { gap: 14, paddingRight: 20 },
  doorDashStoreCard: {
    width: 280, backgroundColor: colors.surfaceWhite, borderRadius: 20, padding: 12,
    borderWidth: 1, borderColor: colors.borderSoft, gap: 8,
  },
  storeHeroBanner: {
    height: 130, borderRadius: 16, backgroundColor: colors.limeWhisper,
    justifyContent: 'center', alignItems: 'center', position: 'relative', overflow: 'hidden',
  },
  storeDistanceTag: {
    position: 'absolute', bottom: 10, left: 10,
    backgroundColor: isDark ? 'rgba(13,27,28,0.88)' : 'rgba(255,255,255,0.95)',
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
    flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  storeDistanceText: { fontFamily: FONTS.bold, fontSize: 11, color: colors.textDark },
  offerBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: '#F97316',
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  offerBadgeText: { fontFamily: FONTS.bold, fontSize: 9, color: '#FFFFFF' },
  favBtn: {
    position: 'absolute', top: 10, right: 10,
    backgroundColor: isDark ? 'rgba(13,27,28,0.80)' : 'rgba(255,255,255,0.9)',
    borderRadius: 16, width: 32, height: 32,
    justifyContent: 'center', alignItems: 'center',
  },
  storeMetaContainer: { padding: 14, gap: 2 },
  storeTitle: { fontFamily: FONTS.bold, fontSize: 15, color: colors.textDark },
  storeSubText: { fontFamily: FONTS.medium, fontSize: 11, color: colors.textMuted },
  storeRatingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  ratingText: { fontFamily: FONTS.bold, fontSize: 12, color: colors.textDark },
  ratingCount: { fontFamily: FONTS.medium, fontSize: 11, color: colors.textMuted },
  bullet: { color: colors.textMuted, fontSize: 10 },
  timeText: { fontFamily: FONTS.bold, fontSize: 11, color: colors.midTeal },

  productGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },

  // Location Selector Modal
  locationSearchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.bgWarm, borderRadius: 14, paddingHorizontal: 14, height: 44,
    borderWidth: 1, borderColor: colors.borderSoft,
  },
  locationSearchInput: {
    flex: 1, fontFamily: FONTS.medium, fontSize: 13, color: colors.textDark,
    outlineStyle: 'none' as any, outlineWidth: 0 as any,
  },
  locationItemRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 12, paddingHorizontal: 10, borderRadius: 12,
  },
  locationItemRowSelected: {
    backgroundColor: colors.limeWhisper,
  },
  locationItemText: { flex: 1, fontFamily: FONTS.bold, fontSize: 13, color: colors.textDark },
  locationItemTextSelected: { color: colors.midTeal },
});

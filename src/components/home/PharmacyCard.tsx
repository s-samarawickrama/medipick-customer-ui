import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useTheme, ThemeColors } from '../../context/ThemeContext';
import { Badge } from '../common/Badge';
import { ShieldCheck, MapPin, Star, Clock, Heart } from 'lucide-react-native';
import { Pharmacy } from '../../types';
import { pharmacyService } from '../../services/pharmacyService';

interface PharmacyCardProps {
  pharmacy: Pharmacy;
  onSelect?: () => void;
  onFavoriteToggled?: (pharmacyId: string, isFavorite: boolean, favoriteId: string | null) => void;
}

export const PharmacyCard: React.FC<PharmacyCardProps> = ({ pharmacy, onSelect, onFavoriteToggled }) => {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const [isFav, setIsFav] = useState(pharmacy.isFavorite || false);
  const [favId, setFavId] = useState(pharmacy.favoriteId || null);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    setIsFav(pharmacy.isFavorite || false);
    setFavId(pharmacy.favoriteId || null);
  }, [pharmacy.isFavorite, pharmacy.favoriteId]);

  const handleFavorite = async () => {
    // Animate the heart
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.6, duration: 150, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true })
    ]).start();

    try {
      const result = await pharmacyService.toggleFavorite(pharmacy, isFav, favId);
      setIsFav(result.isFavorite);
      setFavId(result.favoriteId);
      onFavoriteToggled?.(pharmacy.id, result.isFavorite, result.favoriteId);
    } catch (e) {
      // Revert on failure
      console.warn('[PharmacyCard] Favorite toggle failed', e);
    }
  };
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onSelect}
      activeOpacity={0.9}
    >
      <View style={styles.headerRow}>
        <View style={styles.infoLeft}>
          <Text style={styles.name}>{pharmacy.name}</Text>
          <View style={styles.locationRow}>
            <MapPin color={colors.deepTeal} size={13} />
            <Text style={styles.subText}>{pharmacy.address} • </Text>
            <Text style={styles.distanceText}>{pharmacy.distance}</Text>
          </View>
        </View>

        <View style={{ alignItems: 'flex-end', gap: 6 }}>
          <TouchableOpacity 
            onPress={handleFavorite} 
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.7}
          >
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              <Heart 
                color={isFav ? '#EF4444' : colors.textMuted} 
                size={20} 
                strokeWidth={isFav ? 2 : 1.5}
                fill={isFav ? '#EF4444' : 'transparent'} 
              />
            </Animated.View>
          </TouchableOpacity>
          <View style={styles.ratingBox}>
            <Star color="#EAB308" size={14} fill="#EAB308" />
            <Text style={styles.ratingText}>{pharmacy.rating}</Text>
          </View>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.footerRow}>
        <Badge
          label={`License: ${pharmacy.nmraLicense}`}
          variant="lime"
          icon={<ShieldCheck color={colors.deepIndigo} size={12} />}
        />
        <View style={styles.timeBox}>
          <Clock color={colors.textMuted} size={12} />
          <Text style={styles.timeText}>{pharmacy.estimatedResponseTime}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 16,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  infoLeft: {
    flex: 1,
    paddingRight: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.deepIndigo,
    letterSpacing: -0.2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  subText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  distanceText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.deepTeal,
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF9C3',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#854D0E',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
  },
});

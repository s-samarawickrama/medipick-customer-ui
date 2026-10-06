import React from 'react';
import { View, Text, StyleSheet, Image, Pressable, TouchableOpacity } from 'react-native';
import { ShoppingBag, Store } from 'lucide-react-native';
import { useTheme, ThemeColors } from '../../context/ThemeContext';
import { getLocalImage } from '../../utils/imageMapper';
import { FONTS } from '../../theme/typography';
import { MedicineItem as Medicine } from '../../types';

interface MedicineCardProps {
  med: Medicine;
  onPress: () => void;
  
  // If true, shows "Starting from" and the "Available at X stores" button
  isGlobal?: boolean;
  onStoreSelectPress?: () => void;
  
  // If provided, renders in place of the store select button (e.g. for qty stepper)
  actionComponent?: React.ReactNode;
  forceOutOfStockBadge?: boolean;
  activePharmacyId?: string;
}

export const MedicineCard: React.FC<MedicineCardProps> = ({
  med,
  onPress,
  isGlobal = true,
  onStoreSelectPress,
  actionComponent,
  forceOutOfStockBadge,
  activePharmacyId
}) => {
  const { colors } = useTheme();
  const s = makeStyles(colors);
  
  const activePrice = (activePharmacyId && med.pharmacyDiscounts?.[activePharmacyId]) ?? med.pharmacyPrice;
  const disc = Math.round(((med.mrpPrice - activePrice) / med.mrpPrice) * 100);

  return (
    <Pressable
      style={({ pressed }) => [s.productCard, pressed && { opacity: 0.94 }]}
      onPress={onPress}
    >
      <View style={s.productImgBox}>
        <View style={{ width: '100%', height: '100%', borderRadius: 8, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' }}>
          {med.image ? (
            <Image 
              source={getLocalImage(med.image) || (typeof med.image === 'string' ? { uri: med.image } : med.image)} 
              style={{ width: '100%', height: '100%', transform: [{ scale: 1.25 }] }} 
              resizeMode="cover" 
            />
          ) : (
            <ShoppingBag color={colors.midTeal} size={28} strokeWidth={2} />
          )}
        </View>
        {(!isGlobal && disc > 0) && (
          <View style={s.discTag}>
            <Text style={s.discTagText}>{disc}% OFF</Text>
          </View>
        )}
        <View style={{ position: 'absolute', bottom: 8, left: 8, gap: 4, alignItems: 'flex-start' }}>
          {med.isRxRequired && (
            <View style={s.rxBadge}>
              <Text style={s.rxBadgeText}>Prescription Needed</Text>
            </View>
          )}
          {(!med.inStock || forceOutOfStockBadge) && (
            <View style={s.oosBadge}>
              <Text style={s.oosBadgeText}>Out of Stock</Text>
            </View>
          )}
        </View>
      </View>

      <Text style={s.prodName} numberOfLines={1}>{med.name}</Text>
      <Text style={s.prodGeneric} numberOfLines={1}>
        {med.genericName && med.genericName !== 'N/A' ? `${med.genericName} · ` : ''}{med.dosage}
      </Text>

      {isGlobal ? (
        <>
          <View style={[s.cardFooter, { marginTop: 4 }]}>
            <View style={{ gap: 2 }}>
              <Text style={s.prodPricePrefix}>Starting from</Text>
              <Text style={s.prodPrice}>LKR {med.pharmacyPrice}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={s.selectStoreBadgeBtn}
            onPress={(e) => {
              e.stopPropagation();
              onStoreSelectPress?.();
            }}
            activeOpacity={0.85}
          >
            <Store color={colors.midTeal} size={12} strokeWidth={2.2} />
            <Text style={s.selectStoreBadgeText}>
              {!med.inStock 
                ? 'Currently Unavailable' 
                : med.availableAtPharmacyIds?.length 
                  ? `Available at ${med.availableAtPharmacyIds.length} stores` 
                  : 'Available in stores'}
            </Text>
          </TouchableOpacity>
        </>
      ) : (
        <View style={s.cardFooter}>
          <View>
            <Text style={s.prodPrice}>LKR {activePrice}</Text>
            {med.mrpPrice > activePrice && (
              <Text style={s.prodMrp}>LKR {med.mrpPrice}</Text>
            )}
          </View>

          {actionComponent}
        </View>
      )}
    </Pressable>
  );
};

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  productCard: {
    width: '47.5%',
    backgroundColor: colors.surfaceWhite,
    borderRadius: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    gap: 4,
  },
  productImgBox: {
    height: 140,
    backgroundColor: colors.limeWhisper,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 6,
    padding: 6,
  },
  discTag: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#F97316',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  discTagText: {
    fontFamily: FONTS.extrabold,
    fontSize: 9,
    color: '#FFFFFF',
  },
  rxBadge: {
    backgroundColor: '#F5D7FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  rxBadgeText: {
    fontFamily: FONTS.bold,
    fontSize: 9,
    color: colors.deepPlum,
  },
  oosBadge: {
    backgroundColor: colors.borderSoft,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  oosBadgeText: {
    fontFamily: FONTS.bold,
    fontSize: 9,
    color: colors.textMuted,
  },
  prodName: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    color: colors.textDark,
  },
  prodGeneric: {
    fontFamily: FONTS.medium,
    fontSize: 11,
    color: colors.textMuted,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 4,
  },
  prodPricePrefix: {
    fontFamily: FONTS.medium,
    fontSize: 10,
    color: colors.textMuted,
  },
  prodPrice: {
    fontFamily: FONTS.black,
    fontSize: 14,
    color: colors.textDark,
  },
  prodMrp: {
    fontFamily: FONTS.regular,
    fontSize: 11,
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
  selectStoreBadgeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.limeWhisper,
    borderRadius: 10,
    paddingVertical: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#D6EDA0',
  },
  selectStoreBadgeText: {
    fontFamily: FONTS.bold,
    fontSize: 11,
    color: colors.midTeal,
  },
});

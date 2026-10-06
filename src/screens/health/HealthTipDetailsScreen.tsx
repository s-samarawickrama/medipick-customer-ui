import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, Image, Platform } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList } from '../../navigation/MainNavigator';
import { useTheme } from '../../context/ThemeContext';
import { FONTS } from '../../theme/typography';
import { ChevronLeft, Share2, Calendar } from 'lucide-react-native';


type NavigationProp = NativeStackNavigationProp<MainStackParamList>;
type DetailsRouteProp = RouteProp<MainStackParamList, 'HealthTipDetails'>;

export const HealthTipDetailsScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<DetailsRouteProp>();
  const { colors, isDark } = useTheme();
  

  const s = StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.bgWarm,
    },
    heroImage: {
      width: '100%',
      height: 300,
      backgroundColor: colors.surfaceSubtle,
      resizeMode: 'cover',
    },
    navBar: {
      position: 'absolute',
      top: Platform.OS === 'ios' ? 60 : 20,
      left: 20,
      right: 20,
      flexDirection: 'row',
      justifyContent: 'space-between',
      zIndex: 10,
    },
    iconBtn: {
      width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.9)',
      alignItems: 'center', justifyContent: 'center',
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4,
    },
    contentContainer: {
      padding: 24,
      paddingTop: 32,
      backgroundColor: colors.bgWarm,
      borderTopLeftRadius: 32,
      borderTopRightRadius: 32,
      marginTop: -32,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    categoryPill: {
      backgroundColor: isDark ? 'rgba(42, 157, 143, 0.2)' : 'rgba(42, 157, 143, 0.1)',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
      marginRight: 12,
    },
    categoryText: {
      fontFamily: FONTS.bold,
      fontSize: 12,
      color: colors.midTeal,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    dateRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    dateText: {
      fontFamily: FONTS.medium,
      fontSize: 13,
      color: colors.textMuted,
    },
    title: {
      fontFamily: FONTS.bold,
      fontSize: 28,
      color: colors.textDark,
      lineHeight: 34,
      marginBottom: 24,
    },
    bodyText: {
      fontFamily: FONTS.regular,
      fontSize: 17,
      color: colors.textDark,
      lineHeight: 28,
      opacity: 0.9,
    },
    footerCTA: {
      marginTop: 40,
      marginBottom: 40,
      padding: 20,
      backgroundColor: colors.surfaceElevated,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.borderSoft,
      alignItems: 'center',
    },
    ctaTitle: {
      fontFamily: FONTS.bold,
      fontSize: 18,
      color: colors.textDark,
      marginBottom: 8,
    },
    ctaText: {
      fontFamily: FONTS.regular,
      fontSize: 14,
      color: colors.textMuted,
      textAlign: 'center',
      marginBottom: 16,
    },
    ctaBtn: {
      backgroundColor: colors.midTeal,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 24,
    },
    ctaBtnText: {
      fontFamily: FONTS.bold,
      fontSize: 14,
      color: colors.textInverse,
    }
  });

  return (
    <View style={s.screen}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        {/* Nav Over Image */}
        <View style={s.navBar}>
          <TouchableOpacity style={s.iconBtn} onPress={() => navigation.goBack()} activeOpacity={0.8} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <ChevronLeft color="#1A1A1A" size={24} strokeWidth={2.5} />
          </TouchableOpacity>
          <TouchableOpacity style={s.iconBtn} activeOpacity={0.8} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Share2 color="#1A1A1A" size={20} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        {/* Hero Image */}
        <Image source={{ uri: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=800&q=80' }} style={s.heroImage} />

        {/* Content */}
        <View style={s.contentContainer}>
          <View style={s.metaRow}>
            <View style={s.categoryPill}>
              <Text style={s.categoryText}>Wellness</Text>
            </View>
            <View style={s.dateRow}>
              <Calendar color={colors.textMuted} size={14} />
              <Text style={s.dateText}>Just now</Text>
            </View>
          </View>

          <Text style={s.title}>Health Tip Details</Text>
          
          <Text style={s.bodyText}>
            Details will be loaded here.
          </Text>
          
          <View style={s.footerCTA}>
            <Text style={s.ctaTitle}>Stay Healthy</Text>
            <Text style={s.ctaText}>Browse our selection of wellness products to support your journey.</Text>
            <TouchableOpacity 
              style={s.ctaBtn} 
              activeOpacity={0.8}
              onPress={() => {
                navigation.navigate('Tabs', { screen: 'Browse', params: { initialMode: 'meds', category: 'All' } });
              }}
            >
              <Text style={s.ctaBtnText}>Shop Products</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

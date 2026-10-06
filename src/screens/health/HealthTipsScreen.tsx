import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, Image, Platform, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList } from '../../navigation/MainNavigator';
import { useTheme } from '../../context/ThemeContext';
import { FONTS } from '../../theme/typography';
import { ChevronLeft } from 'lucide-react-native';
import { listHealthTips, HealthTip } from '../../api/healthTipsApi';
import { Loader2 } from 'lucide-react-native';


type NavigationProp = NativeStackNavigationProp<MainStackParamList>;

const CATEGORIES = ['All', 'Wellness', 'Medication', 'Chronic Care', 'Prevention', 'Vitamins'];

export const HealthTipsScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { colors, isDark } = useTheme();
  const [activeCategory, setActiveCategory] = useState('All');
  const [tips, setTips] = useState<HealthTip[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  React.useEffect(() => {
    const fetchTips = async () => {
      try {
        setIsLoading(true);
        const res = await listHealthTips(activeCategory === 'All' ? {} : { category: activeCategory });
        setTips(res.data);
      } catch (err) {
        console.warn('Failed to fetch tips', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTips();
  }, [activeCategory]);

  const filteredTips = tips;

  const s = StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.bgWarm,
    },
    nav: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: Platform.OS === 'ios' ? 60 : 20,
      paddingBottom: 20,
      backgroundColor: colors.bgWarm,
      zIndex: 10,
    },
    backBtn: {
      width: 40, height: 40, borderRadius: 12, backgroundColor: colors.surfaceWhite,
      alignItems: 'center', justifyContent: 'center',
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
    },
    navTitle: {
      flex: 1, textAlign: 'center', fontFamily: FONTS.bold, fontSize: 17, color: colors.textDark, marginRight: 40,
    },
    categoriesContainer: {
      paddingHorizontal: 20,
      paddingBottom: 15,
    },
    catPill: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: colors.surfaceElevated,
      marginRight: 10,
      borderWidth: 1,
      borderColor: colors.borderSoft,
    },
    catPillActive: {
      backgroundColor: colors.midTeal,
      borderColor: colors.midTeal,
    },
    catPillText: {
      fontFamily: FONTS.medium,
      fontSize: 14,
      color: colors.textMuted,
    },
    catPillTextActive: {
      color: colors.textInverse,
    },
    feedContainer: {
      paddingHorizontal: 20,
      paddingBottom: 40,
    },
    tipCard: {
      backgroundColor: colors.surfaceElevated,
      borderRadius: 16,
      marginBottom: 16,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.borderSoft,
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 1,
    },
    tipImage: {
      width: '100%',
      height: 160,
      backgroundColor: colors.surfaceSubtle,
      resizeMode: 'cover',
    },
    tipContent: {
      padding: 16,
    },
    tipMeta: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    tipCategory: {
      fontFamily: FONTS.medium,
      fontSize: 12,
      color: colors.midTeal,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    tipReadTime: {
      fontFamily: FONTS.medium,
      fontSize: 12,
      color: colors.textMuted,
    },
    tipTitle: {
      fontFamily: FONTS.bold,
      fontSize: 18,
      color: colors.textDark,
      marginBottom: 6,
      lineHeight: 24,
    },
    tipPreview: {
      fontFamily: FONTS.regular,
      fontSize: 14,
      color: colors.textMuted,
      lineHeight: 20,
    }
  });

  return (
    <View style={s.screen}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.bgWarm} />
      
      {/* Header */}
      <View style={s.nav}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.75} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <ChevronLeft color={colors.textDark} size={20} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={s.navTitle}>Health & Wellness</Text>
      </View>

      {/* Categories */}
      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.categoriesContainer}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity 
              key={cat} 
              style={[s.catPill, activeCategory === cat && s.catPillActive]}
              onPress={() => setActiveCategory(cat)}
              activeOpacity={0.8}
            >
              <Text style={[s.catPillText, activeCategory === cat && s.catPillTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Feed */}
      {isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Loader2 color={colors.midTeal} size={32} />
          <Text style={{ marginTop: 12, fontFamily: FONTS.medium, color: colors.textMuted }}>Loading tips...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredTips}
          keyExtractor={item => item.id}
          contentContainerStyle={s.feedContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <Text style={{ fontFamily: FONTS.medium, color: colors.textMuted, fontSize: 16 }}>No tips found for this category.</Text>
            </View>
          )}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={s.tipCard} 
              activeOpacity={0.9}
              onPress={() => navigation.navigate('HealthTipDetails', { tipId: item.id })}
            >
              <Image 
                source={{ uri: item.imageUrl || 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80' }} 
                style={s.tipImage} 
              />
              <View style={s.tipContent}>
                <View style={s.tipMeta}>
                  <Text style={s.tipCategory}>{item.category}</Text>
                  <Text style={s.tipReadTime}>{item.readTimeMins} min read</Text>
                </View>
                <Text style={s.tipTitle} numberOfLines={2}>{item.title}</Text>
                <Text style={s.tipPreview} numberOfLines={2}>{item.previewText}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
};

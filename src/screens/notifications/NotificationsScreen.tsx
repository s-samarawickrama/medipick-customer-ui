import React, { useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, Animated,
  TouchableOpacity, StatusBar, Pressable, FlatList, ActivityIndicator
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChevronLeft, Bell, CheckCircle2, Clock, PackageCheck, AlertCircle, ShoppingBag } from 'lucide-react-native';
import { useTheme, ThemeColors } from '../../context/ThemeContext';
import { FONTS } from '../../theme/typography';
import { MainStackParamList } from '../../navigation/MainNavigator';
import { listNotifications, markNotificationRead, Notification } from '../../api/notificationsApi';
import { Loader2 } from 'lucide-react-native';

function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;
  
  return date.toLocaleDateString();
}

type Nav = NativeStackNavigationProp<MainStackParamList>;

export const NotificationsScreen = () => {
  const { isDark, colors } = useTheme();
  const s = makeStyles(colors);
  const navigation = useNavigation<Nav>();
  const opacity    = useRef(new Animated.Value(0)).current;

  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [page, setPage] = React.useState(1);
  const [hasMore, setHasMore] = React.useState(true);
  const [isFetchingMore, setIsFetchingMore] = React.useState(false);

  useEffect(() => {
    StatusBar.setBarStyle('dark-content');
    Animated.timing(opacity, { toValue: 1, duration: 280, useNativeDriver: true }).start();
  }, []);

  const fetchNotifications = async (pageNum: number = 1, append: boolean = false) => {
    try {
      if (append) setIsFetchingMore(true);
      
      const res = await listNotifications({ page: pageNum, limit: 15 });
      const newNotifs = res.data;
      
      if (append) {
        setNotifications(prev => [...prev, ...newNotifs]);
      } else {
        setNotifications(newNotifs);
      }
      
      // If we received fewer items than the limit, we've reached the end
      if (newNotifs.length < 15) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }
    } catch (err) {
      console.warn('Failed to fetch notifications', err);
    } finally {
      setIsLoading(false);
      setIsFetchingMore(false);
    }
  };

  useEffect(() => {
    fetchNotifications(1, false);
  }, []);

  const handleLoadMore = () => {
    if (!hasMore || isFetchingMore || isLoading) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchNotifications(nextPage, true);
  };

  const handlePress = async (n: Notification) => {
    if (!n.read) {
      try {
        await markNotificationRead(n.id);
        setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x));
      } catch (err) {
        console.warn('Failed to mark read', err);
      }
    }

    if (!n.orderId) return;

    if (n.type === 'QUOTE_RECEIVED') {
      navigation.navigate('Quotation', { orderId: n.orderId });
    } else if (n.type === 'PICKUP_READY') {
      navigation.navigate('ReadyForPickup', { orderId: n.orderId, isPaidOnline: false });
    } else {
      navigation.navigate('OrderDetails', { orderId: n.orderId });
    }
  };

  return (
    <View style={s.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bgWarm} />

      <View style={s.nav}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.75}>
          <ChevronLeft color={colors.textDark} size={20} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={s.navTitle}>Notifications</Text>
        <View style={{ width: 36 }} />
      </View>

      {isLoading && notifications.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 }}>
          <Loader2 color={colors.midTeal} size={32} />
          <Text style={{ marginTop: 12, fontFamily: FONTS.medium, color: colors.textMuted }}>Loading...</Text>
        </View>
      ) : notifications.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 }}>
          <Bell color={colors.textMuted} size={44} strokeWidth={1.5} />
          <Text style={{ marginTop: 12, fontFamily: FONTS.bold, fontSize: 16, color: colors.textDark }}>No Notifications</Text>
          <Text style={{ marginTop: 4, fontFamily: FONTS.medium, color: colors.textMuted }}>You're all caught up!</Text>
        </View>
      ) : (
        <Animated.FlatList
          style={{ opacity }}
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
          data={notifications}
          keyExtractor={(n) => n.id}
          renderItem={({ item: n }) => (
            <Pressable
              onPress={() => handlePress(n)}
              style={({ pressed }) => [
                s.card,
                !n.read && s.cardUnread,
                pressed && { opacity: 0.92 },
              ]}
            >
              <View style={s.iconBox}>
                <Bell color={colors.midTeal} size={20} strokeWidth={2} />
              </View>

              <View style={{ flex: 1, gap: 2 }}>
                <View style={s.cardHeader}>
                  <Text style={s.cardTitle}>{n.title}</Text>
                  <Text style={s.cardTime}>{timeAgo(n.createdAt)}</Text>
                </View>
                <Text style={s.cardBody}>{n.body}</Text>
              </View>
            </Pressable>
          )}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={() => (
            isFetchingMore ? (
              <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                <ActivityIndicator size="small" color={colors.midTeal} />
              </View>
            ) : null
          )}
        />
      )}
    </View>
  );
};

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgWarm },
  nav: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: 52, paddingBottom: 12, paddingHorizontal: 20,
    backgroundColor: colors.bgWarm, borderBottomWidth: 1, borderBottomColor: colors.borderSoft,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: colors.surfaceWhite, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: colors.borderSoft,
  },
  navTitle: { flex: 1, textAlign: 'center', fontFamily: FONTS.black, fontSize: 18, color: colors.textDark },
  scroll: { padding: 16, gap: 12, paddingBottom: 60 },

  card: {
    flexDirection: 'row', gap: 12, padding: 14,
    backgroundColor: colors.surfaceWhite, borderRadius: 16,
    borderWidth: 1, borderColor: colors.borderSoft,
  },
  cardUnread: { backgroundColor: colors.limeWhisper, borderColor: '#D6EDA0' },
  iconBox: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: colors.midTealLight, justifyContent: 'center', alignItems: 'center',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontFamily: FONTS.bold, fontSize: 14, color: colors.textDark },
  cardTime: { fontFamily: FONTS.medium, fontSize: 11, color: colors.textMuted },
  cardBody: { fontFamily: FONTS.regular, fontSize: 12, color: colors.textSecondary, lineHeight: 17 },
});

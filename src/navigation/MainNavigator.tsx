import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ShoppingBag, Pill, Package, MessageSquare, User } from 'lucide-react-native';
import { useTheme, ThemeColors } from '../context/ThemeContext';

// Screens
import { HomeScreen } from '../screens/home/HomeScreen';
import { FavoritesScreen } from '../screens/home/FavoritesScreen';
import { BrowseOTCScreen } from '../screens/otc/BrowseOTCScreen';
import { OrdersScreen } from '../screens/orders/OrdersScreen';
import { QuotationScreen } from '../screens/orders/QuotationScreen';
import { ReadyForPickupScreen } from '../screens/orders/ReadyForPickupScreen';
import { useOrders } from '../context/OrderContext';
import { OrderDetailsScreen } from '../screens/orders/OrderDetailsScreen';
import { ChatListScreen } from '../screens/chat/ChatListScreen';
import { PharmacyChatScreen } from '../screens/chat/PharmacyChatScreen';
import { NotificationsScreen } from '../screens/notifications/NotificationsScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { UploadPrescriptionScreen } from '../screens/prescription/UploadPrescriptionScreen';
import { AIQualityCheckScreen } from '../screens/prescription/AIQualityCheckScreen';

import { SelectPharmacyScreen } from '../screens/prescription/SelectPharmacyScreen';
import { ReportIssueScreen } from '../screens/issues/ReportIssueScreen';


import { MultiStoreCartScreen } from '../screens/cart/MultiStoreCartScreen';
import { LegalDocScreen } from '../screens/legal/LegalDocScreen';
import { HealthTipsScreen } from '../screens/health/HealthTipsScreen';
import { HealthTipDetailsScreen } from '../screens/health/HealthTipDetailsScreen';

export type MainStackParamList = {
  Tabs: { screen?: string; params?: { initialMode?: 'meds' | 'pharmacies'; category?: string; storeId?: string; medId?: string } } | undefined;
  Browse: { initialMode?: 'meds' | 'pharmacies'; category?: string; storeId?: string; medId?: string } | undefined;

  UploadPrescription: { pharmacyId?: string; pharmacyName?: string; initialSelectedExtraItems?: Record<string, number> } | undefined;
  AIQualityCheck: { clarityScore?: number; pharmacyId?: string; pharmacyName?: string; selectedItems?: string[]; selectedExtraItemsDict?: Record<string, number>; nextScreen?: string; nextParams?: any } | undefined;

  SelectPharmacy: undefined;
  Quotation: { orderId: string; pharmacyId?: string };
  ReadyForPickup: { orderId: string; isPaidOnline?: boolean };
  OrderDetails: { orderId: string };
  PharmacyChat: { orderId: string };
  Notifications: undefined;
  ReportIssue: { orderId: string };
  MultiStoreCart: undefined;
  LegalDoc: { type: 'terms' | 'privacy' | 'faq' };
  Favorites: undefined;
  HealthTips: undefined;
  HealthTipDetails: { tipId: string };
};

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator<MainStackParamList>();

// Custom bottom tab bar
const CustomTabBar = ({ state, descriptors, navigation }: any) => {
  const { colors } = useTheme();
  const tabStyles = createTabStyles(colors);
  
  const { orders } = useOrders();
  const activeOrdersCount = orders.filter(o => 
    !['COMPLETED', 'CANCELLED', 'DECLINED_BY_PHARMACY', 'DECLINED_BY_CUSTOMER', 'NOT_PICKED_UP'].includes(o.state)
  ).length;

  const tabs = [
    { key: 'Home',    label: 'Home',    Icon: ShoppingBag },
    { key: 'Browse',  label: 'Browse',  Icon: Pill },
    { key: 'Orders',  label: 'Orders',  Icon: Package, badge: activeOrdersCount > 0 ? activeOrdersCount : undefined },
    { key: 'Chat',    label: 'Chat',    Icon: MessageSquare },
    { key: 'Profile', label: 'Profile', Icon: User },
  ];

  return (
    <View style={tabStyles.container}>
      {state.routes.map((route: any, index: number) => {
        const isFocused = state.index === index;
        const { Icon, label, badge } = tabs[index];

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (route.name === 'Browse') {
            if (isFocused) {
              navigation.navigate('Browse', { initialMode: 'meds', storeId: undefined, category: undefined });
            } else if (!event.defaultPrevented) {
              navigation.navigate('Browse', { initialMode: 'meds', storeId: undefined, category: undefined });
            }
          } else {
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            style={tabStyles.tab}
            onPress={onPress}
            activeOpacity={0.7}
            accessibilityRole="tab"
            accessibilityLabel={label}
          >
            <View style={[tabStyles.iconWrap, isFocused && tabStyles.iconWrapActive]}>
              <Icon
                color={isFocused ? colors.midTeal : colors.textMuted}
                size={22}
                strokeWidth={isFocused ? 2.5 : 1.8}
              />
              {badge !== undefined && (
                <View style={tabStyles.badge}>
                  <Text style={tabStyles.badgeText}>{badge}</Text>
                </View>
              )}
            </View>
            <Text style={[tabStyles.label, isFocused && tabStyles.labelActive]}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const createTabStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceWhite,
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    paddingTop: 8,
    paddingHorizontal: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  iconWrap: {
    width: 40,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrapActive: {
    backgroundColor: colors.limeWhisper,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textMuted,
  },
  labelActive: {
    color: colors.midTeal,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -6,
    backgroundColor: colors.midTeal,
    borderRadius: 10,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: colors.surfaceWhite,
  },
  badgeText: {
    color: colors.surfaceWhite,
    fontSize: 9,
    fontWeight: 'bold',
  },
});

// Tab screens
const TabsNavigator = () => (
  <Tab.Navigator
    tabBar={(props) => <CustomTabBar {...props} />}
    screenOptions={{ headerShown: false }}
  >
    <Tab.Screen name="Home" component={HomeScreen} />
    <Tab.Screen name="Browse" component={BrowseOTCScreen} />
    <Tab.Screen name="Orders" component={OrdersScreen} />
    <Tab.Screen name="Chat" component={ChatListScreen} />
    <Tab.Screen name="Profile" component={ProfileScreen} />
  </Tab.Navigator>
);

// Main stack wrapping the tabs + all modal screens
export const MainNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Tabs" component={TabsNavigator} />

    <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ animation: 'slide_from_right' }} />
    <Stack.Screen name="UploadPrescription" component={UploadPrescriptionScreen} />
    <Stack.Screen name="AIQualityCheck" component={AIQualityCheckScreen} options={{ gestureEnabled: false }} />

    <Stack.Screen name="SelectPharmacy" component={SelectPharmacyScreen} />
    <Stack.Screen name="Quotation" component={QuotationScreen} options={{ animation: 'slide_from_right' }} />
    <Stack.Screen name="ReadyForPickup" component={ReadyForPickupScreen} options={{ animation: 'slide_from_right' }} />
    <Stack.Screen name="OrderDetails" component={OrderDetailsScreen} options={{ animation: 'slide_from_right' }} />
    <Stack.Screen name="PharmacyChat" component={PharmacyChatScreen} options={{ animation: 'slide_from_right' }} />
    <Stack.Screen name="ReportIssue" component={ReportIssueScreen} options={{ animation: 'slide_from_bottom' }} />
    <Stack.Screen name="MultiStoreCart" component={MultiStoreCartScreen} options={{ animation: 'slide_from_bottom' }} />
    <Stack.Screen name="LegalDoc" component={LegalDocScreen} options={{ animation: 'slide_from_right' }} />
    <Stack.Screen name="Favorites" component={FavoritesScreen} options={{ animation: 'slide_from_bottom' }} />
    <Stack.Screen name="HealthTips" component={HealthTipsScreen} options={{ animation: 'slide_from_bottom' }} />
    <Stack.Screen name="HealthTipDetails" component={HealthTipDetailsScreen} options={{ animation: 'slide_from_right' }} />
  </Stack.Navigator>
);

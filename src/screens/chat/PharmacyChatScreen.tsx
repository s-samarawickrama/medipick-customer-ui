import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Image,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChevronLeft, Send, ShieldCheck, Clock } from 'lucide-react-native';
import { useTheme, ThemeColors } from '../../context/ThemeContext';
import { FONTS } from '../../theme/typography';
import { MainStackParamList } from '../../navigation/MainNavigator';
import { useOrders } from '../../context/OrderContext';
import { getMessages, sendMessage as sendApiMessage } from '../../api/messagesApi';
import { subscribeToOrderChat, OrderSubscription } from '../../api/websocketApi';


type Nav = NativeStackNavigationProp<MainStackParamList>;
type ChatRouteProp = RouteProp<MainStackParamList, 'PharmacyChat'>;

export const PharmacyChatScreen = () => {
  const { isDark, colors } = useTheme();
  const s = makeStyles(colors, isDark);
  const navigation = useNavigation<Nav>();
  const route = useRoute<ChatRouteProp>();
  const orderId = route.params?.orderId || 'ord-101';

  const { chatMessages, addChatMessage, setOrderMessages, receiveServerMessage, orders } = useOrders();
  const messages = chatMessages[orderId] || [];
  const order = orders.find(o => o.id === orderId);

  const [input, setInput] = useState('');
  const scrollRef = useRef<ScrollView>(null);


  useEffect(() => {
    let sub: OrderSubscription | null = null;
    let isMounted = true;

    const initChat = async () => {
      if (orderId === 'general-inquiry') {
        setOrderMessages(orderId, [{
          id: 'mock-1',
          orderId,
          senderRole: 'PHARMACY',
          text: 'Hi there! How can we help you today? Note: For detailed medical advice, please place an order to start a secure consultation.',
          timestamp: new Date().toISOString(),
        }]);
        return;
      }

      try {
        // Fetch history
        const history = await getMessages(orderId);
        if (isMounted) setOrderMessages(orderId, history as any);

        // Connect WebSocket
        sub = await subscribeToOrderChat(orderId, (newMsg) => {
          if (isMounted) receiveServerMessage(newMsg as any);
        });
      } catch (e) {
        console.warn('Chat init failed:', e);
      }
    };

    initChat();
    return () => {
      isMounted = false;
      sub?.unsubscribe();
    };
  }, [orderId]);

  useEffect(() => {
    StatusBar.setBarStyle(isDark ? 'light-content' : 'dark-content');
  }, []);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const text = input.trim();
    setInput('');
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

    if (orderId === 'general-inquiry') {
      addChatMessage(orderId, {
        id: Math.random().toString(),
        orderId,
        senderRole: 'CUSTOMER',
        text,
        timestamp: new Date().toISOString(),
      });
      setTimeout(() => {
        addChatMessage(orderId, {
          id: Math.random().toString(),
          orderId,
          senderRole: 'PHARMACY',
          text: 'Thank you for your message! To receive dedicated support and live pharmacist consultations, please place an active order with us.',
          timestamp: new Date().toISOString(),
        });
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 1000);
      return;
    }

    try {
      await sendApiMessage(orderId, { text });
    } catch (e) {
      console.warn('Failed to send message:', e);
    }
  };

  return (
    <KeyboardAvoidingView
      style={s.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.surfaceWhite}
      />

      {/* Chat Navbar */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.75}>
          <ChevronLeft color={colors.midTeal} size={20} strokeWidth={2.5} />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <View style={s.pharmacyAvatar}>
            {order?.pharmacy?.image ? (
              <Image source={require('../../utils/imageMapper').getLocalImage(order.pharmacy.image)} style={s.pharmacyAvatarImg} />
            ) : (
              <Text style={s.avatarInitial}>{order?.pharmacy?.name?.charAt(0) || 'P'}</Text>
            )}
          </View>
          <View style={{ flex: 1 }}>
            <View style={s.pharmacyTitleRow}>
              <Text style={s.pharmacyName} numberOfLines={1}>{order?.pharmacy?.name || 'Pharmacy'}</Text>
              <ShieldCheck color={colors.midTeal} size={14} strokeWidth={2.5} />
            </View>
            <Text style={s.onlineText}>Online · Response time &lt; 5 mins</Text>
          </View>
        </View>
        <View style={{ width: 36 }} />
      </View>

      {/* Order Context Banner */}
      {order && (['READY_FOR_PICKUP', 'PREPARING', 'CONFIRMED', 'SUBMITTED', 'COMPLETED'].includes(order.state)) && (
        <TouchableOpacity
          style={s.contextBanner}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('ReadyForPickup', { orderId })}
        >
          <Text style={s.contextText}>
            Order {order.orderNumber} · {order.state === 'READY_FOR_PICKUP' ? 'Pickup Code Ready' : order.state === 'COMPLETED' ? 'Order Completed' : 'Track Order'}
          </Text>
        </TouchableOpacity>
      )}

      {/* Message List */}
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={s.msgList}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
      >
        {messages.map((msg) => {
          const isCustomer = msg.senderRole === 'CUSTOMER';
          const isSystem = msg.senderRole === 'SYSTEM';

          if (isSystem) {
            return (
              <View key={msg.id} style={s.systemBubbleWrap}>
                <View style={s.systemBubble}>
                  <Text style={s.systemText}>Out of Stock</Text>
                </View>
                <Text style={s.msgTimeCenter}>{msg.timestamp}</Text>
              </View>
            );
          }

          return (
            <View key={msg.id} style={[s.bubbleWrap, isCustomer && s.bubbleWrapCustomer]}>
              <View style={[s.bubble, isCustomer ? s.bubbleCustomer : s.bubblePharmacy]}>
                <Text style={[s.bubbleText, isCustomer ? s.bubbleCustomerText : s.bubblePharmacyText]}>
                  {msg.text}
                </Text>
              </View>
              <Text style={[s.msgTime, isCustomer && { textAlign: 'right' }]}>
                {msg.timestamp}
              </Text>
            </View>
          );
        })}
      </ScrollView>

      {/* Floating Input Bar */}
      <View style={s.inputBar}>
        <TextInput
          style={s.inputField}
          placeholder="Message pharmacist..."
          placeholderTextColor={colors.textMuted}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={sendMessage}
          returnKeyType="send"
        />
        <TouchableOpacity
          style={[s.sendBtn, !input.trim() && { backgroundColor: colors.surfaceSubtle }]}
          disabled={!input.trim()}
          onPress={sendMessage}
        >
          <Send color={input.trim() ? colors.surfaceWhite : colors.textMuted} size={18} strokeWidth={2.5} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const makeStyles = (colors: ThemeColors, isDark: boolean) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgWarm },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: 52, paddingBottom: 12, paddingHorizontal: 16,
    backgroundColor: colors.surfaceWhite,
    borderBottomWidth: 1, borderBottomColor: colors.borderSoft,
    gap: 10,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: colors.surfaceSubtle,
    justifyContent: 'center', alignItems: 'center',
  },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  pharmacyAvatar: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: colors.limeWhisper,
    justifyContent: 'center', alignItems: 'center',
  },
  pharmacyAvatarImg: {
    width: 40, height: 40, borderRadius: 12, resizeMode: 'cover',
  },
  avatarInitial: { fontFamily: FONTS.bold, fontSize: 16, color: colors.midTeal },
  pharmacyTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  pharmacyName: { fontFamily: FONTS.bold, fontSize: 15, color: colors.textDark, flexShrink: 1 },
  onlineText: { fontFamily: FONTS.medium, fontSize: 11, color: colors.textMuted, marginTop: 1 },

  contextBanner: {
    backgroundColor: isDark ? colors.plumLight : '#EDE7F6',
    paddingVertical: 8, paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: isDark ? colors.deepPlum : '#D7C6E9',
  },
  contextText: {
    fontFamily: FONTS.bold, fontSize: 12, color: isDark ? '#CDA4D7' : colors.deepPlum, textAlign: 'center',
  },

  msgList: { padding: 16, paddingBottom: 20, gap: 12 },

  // System / verified bubbles — subtle in dark mode
  systemBubbleWrap: { alignItems: 'center', marginVertical: 6 },
  systemBubble: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.surfaceSubtle,
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 999,
    borderWidth: isDark ? 0 : 1,
    borderColor: colors.borderSubtle,
  },
  systemText: { fontFamily: FONTS.bold, fontSize: 11, color: colors.textMuted },
  msgTimeCenter: { fontFamily: FONTS.medium, fontSize: 10, color: colors.textMuted, marginTop: 4 },

  bubbleWrap: { maxWidth: '82%', alignSelf: 'flex-start' },
  bubbleWrapCustomer: { alignSelf: 'flex-end' },
  bubble: { borderRadius: 18, padding: 13 },

  // Pharmacy bubble — soft surface, warm card
  bubblePharmacy: {
    backgroundColor: colors.surfaceWhite,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderBottomLeftRadius: 4,
  },
  // Customer bubble — midTeal, consistent brand color
  bubbleCustomer: {
    backgroundColor: colors.midTeal,
    borderBottomRightRadius: 4,
  },
  bubbleText: { fontFamily: FONTS.regular, fontSize: 14, lineHeight: 20 },
  bubblePharmacyText: { color: colors.textDark },
  bubbleCustomerText: { color: '#FFFFFF' },
  msgTime: { fontFamily: FONTS.medium, fontSize: 10, color: colors.textMuted, marginTop: 4, paddingHorizontal: 4 },

  inputBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 12, paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    backgroundColor: colors.surfaceWhite,
    borderTopWidth: 1, borderTopColor: colors.borderSoft,
  },
  inputField: {
    flex: 1, height: 44,
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 12, borderWidth: 1.5, borderColor: colors.borderSoft,
    paddingHorizontal: 14, fontFamily: FONTS.regular, fontSize: 14, color: colors.textDark,
    outlineStyle: 'none' as any, outlineWidth: 0 as any,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: colors.midTeal,
    justifyContent: 'center', alignItems: 'center',
  },
  sendBtnDisabled: { backgroundColor: colors.surfaceSubtle },
});

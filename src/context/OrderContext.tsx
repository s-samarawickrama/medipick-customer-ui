import React, { createContext, useContext, useState, useEffect } from 'react';
import { Order, FSMOrderState, PharmacyQuote, ChatMessage } from '../types';
import { listOrders, updateOrderState, requestPickupExtension as apiRequestPickupExtension } from '../api/ordersApi';
import { useAuth } from './AuthContext'; // to listen to auth changes if needed

interface OrderContextType {
  orders: Order[];
  isLoading: boolean;
  activeOrder: Order | null;
  chatMessages: Record<string, ChatMessage[]>;
  fetchOrders: () => Promise<void>;
  createPrescriptionOrder: (pharmacyIds: string[], notes?: string) => Order;
  acceptQuote: (orderId: string, quote: PharmacyQuote) => void;
  requestPickupExtension: (orderId: string) => void;
  setOrderMessages: (orderId: string, messages: ChatMessage[]) => void;
  receiveServerMessage: (message: ChatMessage) => void;
  reportIssue: (orderId: string, issueType: string, description: string) => Promise<void>;
  setActiveOrder: (order: Order | null) => void;
  addChatMessage: (orderId: string, message: Omit<ChatMessage, 'id' | 'orderId' | 'timestamp'>) => void;
  completeOrder: (orderId: string) => Promise<void>;
  cancelOrder: (orderId: string) => Promise<void>;
  updatePaymentMethodContext: (orderId: string, paymentMethod: 'ONLINE' | 'PAY_AT_COUNTER') => Promise<void>;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

const INITIAL_CHAT: Record<string, ChatMessage[]> = {
  'ord-101': [
    {
      id: '1',
      orderId: 'ord-101',
      senderRole: 'PHARMACIST',
      senderName: 'Pharmacist',
      text: 'Hello! Your order #MP123456 has been verified and is ready at counter 2.',
      timestamp: '2:10 PM',
    },
    {
      id: '2',
      orderId: 'ord-101',
      senderRole: 'CUSTOMER',
      senderName: 'You',
      text: 'Thank you! Can I collect it around 5:30 PM today?',
      timestamp: '2:14 PM',
    },
    {
      id: '3',
      orderId: 'ord-101',
      senderRole: 'PHARMACIST',
      senderName: 'Pharmacist',
      text: 'Yes, we are open until 8:00 PM. Just show your 6-digit OTP code when you arrive.',
      timestamp: '2:15 PM',
    },
  ],
};

export const OrderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [chatMessages, setChatMessages] = useState<Record<string, ChatMessage[]>>(INITIAL_CHAT);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const res = await listOrders();
      const data = res.data as unknown as Order[];
      setOrders(data);
      if (data.length > 0 && !activeOrder) {
        setActiveOrder(data[0]);
      }
    } catch (e) {
      console.warn('Failed to fetch orders:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchOrders();
    } else {
      setOrders([]);
      setActiveOrder(null);
    }
  }, [user]);

  const createPrescriptionOrder = (pharmacyIds: string[], notes?: string) => {
    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber: `#MP${Math.floor(100000 + Math.random() * 900000)}`,
      orderType: 'PRESCRIPTION',
      state: 'PRESCRIPTION_VALIDATION',
      items: [],
      totalAmount: 0,
      totalMrp: 0,
      isPaid: false,
      createdAt: new Date().toISOString(),
      slaPharmacyReviewDeadline: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 mins
    };

    setOrders((prev) => [newOrder, ...prev]);
    setActiveOrder(newOrder);
    return newOrder;
  };

  const acceptQuote = (orderId: string, quote: PharmacyQuote) => {
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id === orderId) {
          return {
            ...ord,
            state: 'PREPARING',
            selectedQuote: quote,
            pharmacy: {
              id: quote.pharmacyId,
              name: quote.pharmacyName,
              address: 'Selected Pharmacy Branch',
              distance: '1.2 km',
              rating: 4.8,
              nmraLicense: quote.nmraLicense,
              pharmacistName: quote.pharmacistName,
              pharmacistRegNo: quote.pharmacistRegNo,
              estimatedResponseTime: 'Ready soon',
              isOpen: true,
            },
            totalAmount: quote.totalAmount,
            totalMrp: quote.totalMrp,
          };
        }
        return ord;
      })
    );
  };

  const addChatMessage = (orderId: string, message: Omit<ChatMessage, 'id' | 'orderId' | 'timestamp'>) => {
    const now = new Date();
    const timestamp = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')} ${now.getHours() >= 12 ? 'PM' : 'AM'}`;
    const newMsg: ChatMessage = {
      id: String(Date.now()),
      orderId,
      timestamp,
      ...message,
    };
    setChatMessages((prev) => ({
      ...prev,
      [orderId]: [...(prev[orderId] || []), newMsg],
    }));
  };

  const setOrderMessages = (orderId: string, messages: ChatMessage[]) => {
    setChatMessages((prev) => ({ ...prev, [orderId]: messages }));
  };

  const receiveServerMessage = (message: ChatMessage) => {
    setChatMessages((prev) => {
      const existing = prev[message.orderId] || [];
      // Prevent duplicates if already added locally
      if (existing.some(m => m.id === message.id)) return prev;
      return {
        ...prev,
        [message.orderId]: [...existing, message],
      };
    });
  };

  const requestPickupExtension = async (orderId: string) => {
    await apiRequestPickupExtension(orderId);
    await fetchOrders();
  };

  const reportIssue = async (orderId: string, issueType: string, description: string) => {
    await updateOrderState(orderId, 'ISSUE_REPORTED');
    await fetchOrders();
  };

  const completeOrder = async (orderId: string) => {
    await updateOrderState(orderId, 'COMPLETED');
    await fetchOrders();
  };

  const cancelOrder = async (orderId: string) => {
    await updateOrderState(orderId, 'CANCELLED');
    await fetchOrders();
  };

  const updatePaymentMethodContext = async (orderId: string, paymentMethod: 'ONLINE' | 'PAY_AT_COUNTER') => {
    if (orderId.startsWith('ord-')) {
      // Mock order
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, paymentMethod } : o));
    } else {
      // Real order
      const { updatePaymentMethod } = require('../api/ordersApi');
      await updatePaymentMethod(orderId, paymentMethod);
      await fetchOrders();
    }
  };

  return (
    <OrderContext.Provider
      value={{
        orders,
        isLoading,
        activeOrder,
        chatMessages,
        fetchOrders,
        createPrescriptionOrder,
        acceptQuote,
        requestPickupExtension,
        setOrderMessages,
        receiveServerMessage,
        reportIssue,
        setActiveOrder,
        addChatMessage,
        completeOrder,
        cancelOrder,
        updatePaymentMethodContext,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
};

export const useOrders = () => {
  const context = useContext(OrderContext);
  if (!context) throw new Error('useOrders must be used within an OrderProvider');
  return context;
};

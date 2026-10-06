import React, { createContext, useContext, useState } from 'react';
import { MedicineItem, Pharmacy } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CartPharmacy {
  id: string;
  name: string;
  address: string;
  distance: string;
  image?: any;
  rating?: number;
  nmraLicense?: string;
  pharmacistName?: string;
  pharmacistRegNo?: string;
  estimatedResponseTime?: string;
  isOpen?: boolean;
}

export interface CartItem {
  medicine: MedicineItem;
  quantity: number;
  pharmacy: CartPharmacy;
}

export interface AttachedPrescription {
  image: string;
  note: string;
  pharmacyId: string;
  pharmacyName: string;
  allowGenericSubstitutions?: boolean;
}

interface CartContextType {
  cartItems: CartItem[];
  selectedPharmacy: Pharmacy | null;
  attachedPrescription: AttachedPrescription | null;
  addToCart: (medicine: MedicineItem, pharmacy: CartPharmacy) => void;
  removeFromCart: (medicineId: string, pharmacyId: string) => void;
  removeStoreFromCart: (storeId: string) => void;
  updateQuantity: (medicineId: string, pharmacyId: string, delta: number) => void;
  setSelectedPharmacy: (pharmacy: Pharmacy | null) => void;
  setAttachedPrescription: (prescription: AttachedPrescription | null) => void;
  processReorder: (items: CartItem[], attachedRx?: AttachedPrescription) => void;
  clearCart: () => void;
  subtotal: number;
  totalMrp: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedPharmacy, setSelectedPharmacy] = useState<Pharmacy | null>(null);
  const [attachedPrescription, setAttachedPrescription] = useState<AttachedPrescription | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const { user, isLoggedIn } = require('./AuthContext').useAuth();
  const cartKey = user ? `@medipick_cart_${user.id}` : '@medipick_cart_guest';
  const rxKey = user ? `@medipick_rx_${user.id}` : '@medipick_rx_guest';

  React.useEffect(() => {
    const loadCart = async () => {
      try {
        const storedCart = await AsyncStorage.getItem(cartKey);
        const storedRx = await AsyncStorage.getItem(rxKey);
        setCartItems(storedCart ? JSON.parse(storedCart) : []);
        setAttachedPrescription(storedRx ? JSON.parse(storedRx) : null);
      } catch (e) {
        console.warn('Failed to load cart', e);
      } finally {
        setIsLoaded(true);
      }
    };
    loadCart();
  }, [cartKey, rxKey]);

  React.useEffect(() => {
    if (!isLoaded) return;
    AsyncStorage.setItem(cartKey, JSON.stringify(cartItems)).catch(e => console.warn(e));
  }, [cartItems, isLoaded, cartKey]);

  React.useEffect(() => {
    if (!isLoaded) return;
    if (attachedPrescription) {
      AsyncStorage.setItem(rxKey, JSON.stringify(attachedPrescription)).catch(e => console.warn(e));
    } else {
      AsyncStorage.removeItem(rxKey).catch(e => console.warn(e));
    }
  }, [attachedPrescription, isLoaded, rxKey]);

  const addToCart = (medicine: MedicineItem, pharmacy: CartPharmacy) => {
    if (medicine.isRxRequired) {
      alert('Rx Required: Prescription-Only Medicines cannot be added to direct cart. Please use Prescription Upload!');
      return;
    }
    setCartItems((prev) => {
      const existing = prev.find((item) => item.medicine.id === medicine.id && item.pharmacy.id === pharmacy.id);
      if (existing) {
        return prev.map((item) =>
          item.medicine.id === medicine.id && item.pharmacy.id === pharmacy.id
            ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { medicine, quantity: 1, pharmacy }];
    });
  };

  const removeFromCart = (medicineId: string, pharmacyId: string) => {
    setCartItems((prev) => prev.filter((item) => !(item.medicine.id === medicineId && item.pharmacy.id === pharmacyId)));
  };

  const removeStoreFromCart = (storeId: string) => {
    setCartItems((prev) => prev.filter((item) => item.pharmacy.id !== storeId));
  };

  const updateQuantity = (medicineId: string, pharmacyId: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.medicine.id === medicineId && item.pharmacy.id === pharmacyId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const clearCart = () => {
    setCartItems([]);
    setAttachedPrescription(null);
  };

  const processReorder = (items: CartItem[], attachedRx?: AttachedPrescription) => {
    if (attachedRx) {
      setAttachedPrescription(attachedRx);
    }
    setCartItems((prev) => {
      let nextCart = [...prev];
      items.forEach((newItem) => {
        const existingIndex = nextCart.findIndex(
          (item) => item.medicine.id === newItem.medicine.id && item.pharmacy.id === newItem.pharmacy.id
        );
        if (existingIndex >= 0) {
          nextCart[existingIndex].quantity += newItem.quantity;
        } else {
          nextCart.push(newItem);
        }
      });
      return nextCart;
    });
  };

  const subtotal = cartItems.reduce((acc, item) => {
    const discountedPrice = item.medicine.pharmacyDiscounts?.[item.pharmacy.id] ?? item.medicine.pharmacyPrice;
    return acc + discountedPrice * item.quantity;
  }, 0);
  const totalMrp = cartItems.reduce((acc, item) => acc + item.medicine.mrpPrice * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        selectedPharmacy,
        attachedPrescription,
        addToCart,
        removeFromCart,
        removeStoreFromCart,
        updateQuantity,
        setSelectedPharmacy,
        setAttachedPrescription,
        processReorder,
        clearCart,
        subtotal,
        totalMrp,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};

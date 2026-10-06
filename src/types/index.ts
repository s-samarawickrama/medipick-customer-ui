export interface CustomerUser {
  phoneNumber: string;
  surname: string;
  email?: string;
  isLoggedIn: boolean;
  strikes: number;
  strikeLimit: number;
  isLocked: boolean;
  lockedUntil: string | null;
}

export type FSMOrderState =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'PRESCRIPTION_VALIDATION'
  | 'AWAITING_PRESCRIPTION_UPLOAD'
  | 'WAITING_PHARMACY_CONFIRMATION'
  | 'WAITING_CUSTOMER_CONFIRMATION'
  | 'PREPARING'
  | 'READY_FOR_PICKUP'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'CLOSED'
  | 'ISSUE_REPORTED'
  | 'UNDER_REVIEW'
  | 'RESOLVED'
  | 'REJECTED'
  | 'REUPLOAD_REQUESTED';

export type OrderType = 'OTC' | 'PRESCRIPTION' | 'MIXED';

export interface MedicineItem {
  id: string;
  name: string;
  genericName: string;
  dosage: string;
  mrpPrice: number;
  pharmacyPrice: number;
  isRxRequired: boolean;
  category: 'Cold & Flu' | 'First Aid' | 'Vitamins' | 'Personal Care' | 'Chronic' | 'Skincare' | 'Supplements';
  inStock: boolean;
  availableAtPharmacyIds?: string[]; // Array of pharmacy IDs where this is available
  outOfStockPharmacyIds?: string[]; // Array of pharmacy IDs where this is currently out of stock
  pharmacyDiscounts?: Record<string, number>; // Maps pharmacy ID to a custom discounted price. If missing, defaults to pharmacyPrice.
  popularity?: number; // 0-100 rating for sorting
  image?: string | any;
  description?: string;
}

export interface Pharmacy {
  id: string;
  name: string;
  address: string;
  distance: string;
  rating: number;
  ratingCount?: number;
  popularity?: number; // 0-100 rating for sorting
  nmraLicense: string;
  pharmacistName: string;
  pharmacistRegNo: string;
  estimatedResponseTime: string;
  isOpen: boolean;
  isFavorite?: boolean;
  favoriteId?: string | null;
  hasOffer?: boolean;
  offerTag?: string | null;
  image?: string | any;
  latitude?: number;
  longitude?: number;
}

export interface HealthTip {
  id: string;
  title: string;
  category: string;
  previewText: string;
  bodyText: string;
  imageUrl?: string | any;
  publishedAt: string;
  readTimeMins: number;
}

export interface PrescriptionQuoteItem {
  medicineName: string;
  genericName: string;
  mrp: number;
  quotedPrice: number;
  quantity: number;
  isAlternative?: boolean;
  originalPrescribed?: string;
}

export interface PharmacyQuote {
  pharmacyId: string;
  pharmacyName: string;
  pharmacistName: string;
  pharmacistRegNo: string;
  nmraLicense: string;
  items: PrescriptionQuoteItem[];
  totalAmount: number;
  totalMrp: number;
  validUntil: string; // ISO String
}

export interface Order {
  id: string;
  orderNumber: string;
  orderType: OrderType;
  state: FSMOrderState;
  pharmacy?: Pharmacy;
  prescriptionUri?: string;
  aiClarityScore?: number;
  items: Array<{
    medicine: MedicineItem;
    quantity: number;
    price: number;
    isSubstitute?: boolean;
    originalPrescribed?: string;
  }>;
  quotes?: PharmacyQuote[];
  selectedQuote?: PharmacyQuote;
  totalAmount: number;
  totalMrp: number;
  paymentMethod?: 'ONLINE' | 'PAY_AT_COUNTER';
  isPaid: boolean;
  allowGenericSubstitutions?: boolean;
  rejectReason?: string;
  refundStatus?: 'REFUNDED';
  pickupOtp?: string;
  pickupOtpVerified?: boolean;
  rating?: {
    overall: number;
    service: number;
    availability: number;
    pickup: number;
    comment?: string;
  };
  pickupDeadline?: string;
  pickupExtensionRequested?: boolean;
  createdAt: string;
  slaPharmacyReviewDeadline?: string;
  slaCustomerConfirmDeadline?: string;
}

export interface ChatMessage {
  id: string;
  orderId: string;
  senderRole: 'CUSTOMER' | 'PHARMACIST' | 'SYSTEM';
  senderName: string;
  text: string;
  timestamp: string;
}

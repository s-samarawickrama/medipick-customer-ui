export type ApiSuccessResponse<T> = {
  success: true;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
};

export type ApiErrorField = Record<string, string>;

export type ApiErrorResponse = {
  success: false;
  error: {
    code: string;
    message: string;
    fields?: ApiErrorField;
    data?: Record<string, unknown>;
  };
};

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface CustomerUserResponse {
  id: string;
  phoneNumber: string;
  surname: string;
  email?: string;
  isVerified: boolean;
  strikes: number;
  pushNotificationsEnabled: boolean;
  emailReceiptsEnabled: boolean;
  createdAt: string;
}

export interface PharmacySummary {
  id: string;
  name: string;
  address: string;
  distance?: string;
  rating?: number;
  isOpen?: boolean;
  isFavorite?: boolean;
}

export interface MedicineSummary {
  id: string;
  name: string;
  genericName?: string;
  category?: string;
  dosage?: string;
  isRxRequired?: boolean;
  inStock?: boolean;
  mrpPrice?: number;
  pharmacyPrice?: number;
  availableAtPharmacyIds?: string[];
  popularity?: number;
  image?: string;
  description?: string;
}

// Backward compatibility alias
export type ProductSummary = MedicineSummary;

export interface OrderStateSummary {
  id: string;
  orderNumber: string;
  orderType: 'OTC' | 'PRESCRIPTION' | 'MIXED';
  state: string;
  totalAmount: number;
  totalMrp: number;
  isPaid: boolean;
  paymentMethod?: 'ONLINE' | 'PAY_AT_COUNTER';
  createdAt: string;
}

export interface PrescriptionUploadResponse {
  prescriptionId: string;
  clarityScore: number;
  status: 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'REUPLOAD_REQUIRED';
  checks?: {
    clarity?: {
      score: number;
      max: number;
      passed: boolean;
    };
  };
}

export interface PrescriptionDetail {
  id: string;
  status: 'APPROVED' | 'PENDING_REVIEW' | 'REJECTED' | 'REUPLOAD_REQUIRED';
  clarityScore: number;
  targetPharmacyId?: string;
}

export interface PrescriptionStatus {
  prescriptionId: string;
  status: 'APPROVED' | 'PENDING_REVIEW' | 'REJECTED' | 'REUPLOAD_REQUIRED';
  clarityScore: number;
}

export interface OrderApiSummary {
  id: string;
  orderNumber: string;
  orderType: 'OTC' | 'PRESCRIPTION' | 'MIXED';
  state: string;
  totalAmount: number;
  totalMrp: number;
  isPaid: boolean;
  paymentMethod?: 'ONLINE' | 'PAY_AT_COUNTER';
  createdAt: string;
}

export interface OrderApiDetail extends OrderApiSummary {
  pharmacyId?: string;
  customerNote?: string;
  prescriptionId?: string;
}

export interface CancelOrderResponse {
  id: string;
  state: string;
  strikeAdded: boolean;
  customerStrikes: number;
}

export interface RatingRequest {
  rating: number;
  comment?: string;
}

export interface RatingResponse {
  id: string;
  rating: number;
}

export interface UserPreferenceUpdate {
  pushNotificationsEnabled?: boolean;
  emailReceiptsEnabled?: boolean;
}

export interface UserPhoneUpdate {
  newPhoneNumber: string;
}

export interface QuoteItemResponse {
  medicineName: string;
  mrp: number;
  quotedPrice: number;
  quantity: number;
  isAlternative?: boolean;
}

export interface QuoteResponse {
  orderId: string;
  pharmacyId: string;
  pharmacyName: string;
  items: QuoteItemResponse[];
  totalAmount: number;
  totalMrp: number;
  validUntil: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  type: string;
  orderId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationReadResponse {
  id: string;
  isRead: boolean;
}

export interface IssueReportResponse {
  id: string;
  orderId: string;
  status: string;
}

export interface PaymentIntentResponse {
  clientSecret: string;
}

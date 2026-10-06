/**
 * MediPick — Orders API (Priority 1)
 *
 * Endpoints: A5.1 → A5.7
 * Design ref: MediPick_API_Design_Document.md — Section A5
 *
 * All endpoints require Bearer token (🔒).
 * Used by: OrdersScreen, OrderDetailsScreen, MultiStoreCartScreen,
 *          ReadyForPickupScreen, HomeScreen (active order banner)
 */

import { api } from './client';
import type { ApiMeta } from './client';
import type { FSMOrderState, OrderType } from '../types';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OrderItem {
  id:          string;
  medicineId:  string;
  medicine: {
    name:        string;
    genericName: string;
    dosage:      string | null;
    image:       string | null;
  };
  quantity:    number;
  unitMrp:     number;    // Price per unit at MRP in LKR
  unitPrice:   number;    // Price per unit at pharmacy price in LKR
  lineTotal:   number;    // unitPrice × quantity
  isSubstitute?: boolean;
  originalPrescribed?: string;
}

export interface OrderPharmacy {
  id:                    string;
  name:                  string;
  address:               string;
  image:                 string | null;
  nmraLicense:           string;
  pharmacistName:        string;
  estimatedResponseTime: string;
}

export interface Order {
  id:                         string;
  orderNumber:                string;    // e.g. "#MP123456"
  orderType:                  OrderType;
  state:                      FSMOrderState;
  pharmacy:                   OrderPharmacy;
  prescriptionId:             string | null;
  items:                      OrderItem[];
  itemCount:                  number;
  totalMrp:                   number;    // Sum at MRP prices in LKR
  totalAmount:                number;    // Sum at pharmacy prices (what customer pays) in LKR
  savings:                    number;    // totalMrp - totalAmount
  paymentMethod:              'ONLINE' | 'PAY_AT_COUNTER' | null;
  isPaid:                     boolean;
  allowGenericSubstitutions:  boolean;
  rejectReason:               string | null;
  refundStatus:               'REFUNDED' | null;
  customerNote:               string | null;
  pickupOtp:                  string | null;
  pickupOtpVerified:          boolean;
  rating?: {
    overall: number;
    service: number;
    availability: number;
    pickup: number;
    comment?: string;
  };
  pickupDeadline:             string | null;   // ISO 8601
  pickupExtensionRequested:   boolean;
  slaPharmacyReviewDeadline:  string | null;
  slaCustomerConfirmDeadline: string | null;
  createdAt:                  string;
  updatedAt:                  string;
}

export interface OrderSummary {
  id:            string;
  orderNumber:   string;
  orderType:     OrderType;
  state:         FSMOrderState;
  pharmacy:      OrderPharmacy;
  itemCount:     number;
  totalMrp:      number;
  totalAmount:   number;
  savings:       number;
  isPaid:        boolean;
  paymentMethod: 'ONLINE' | 'PAY_AT_COUNTER' | null;
  createdAt:     string;
}

export interface CreateOrderPayload {
  orderType:      OrderType;
  pharmacyId:     string;
  items:          Array<{ medicineId: string; quantity: number }>;
  paymentMethod?: 'ONLINE' | 'PAY_AT_COUNTER';
  allowGenericSubstitutions?: boolean;
  prescriptionId?: string;
  customerNote?:  string;
}

export interface OrderListQuery {
  state?:  string;  // Comma-separated FSM states e.g. "PREPARING,READY_FOR_PICKUP"
  page?:   number;
  limit?:  number;
}

export interface OrderListResponse {
  data: OrderSummary[];
  meta: ApiMeta;
}

// ─── API Functions ────────────────────────────────────────────────────────────

/**
 * A5.1 — List orders  🔒
 * Used by OrdersScreen for full list, HomeScreen for active order banner.
 * Filter by state: e.g. state="PREPARING,READY_FOR_PICKUP,WAITING_CUSTOMER_CONFIRMATION"
 */
export async function listOrders(query: OrderListQuery = {}): Promise<OrderListResponse> {
  const params = new URLSearchParams();
  if (query.state) params.set('state', query.state);
  if (query.page)  params.set('page',  String(query.page));
  if (query.limit) params.set('limit', String(query.limit));

  const qs  = params.toString();
  const res = await api.get<OrderSummary[]>(`/orders${qs ? `?${qs}` : ''}`);
  return { data: res.data, meta: res.meta! };
}

/**
 * A5.2 — Get single order detail  🔒
 * Returns full order with items, pharmacy details, OTP, SLA deadlines.
 */
export async function getOrder(orderId: string): Promise<Order> {
  const res = await api.get<Order>(`/orders/${orderId}`);
  return res.data;
}

/**
 * A5.3 — Create order  🔒
 * Creates one order per pharmacy cart. For OTC: items required. For PRESCRIPTION: prescriptionId required.
 * If paymentMethod = ONLINE, also call paymentsApi.createPaymentIntent() after this.
 */
export async function createOrder(payload: CreateOrderPayload): Promise<Order> {
  const idempotencyKey = Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
  const res = await api.post<Order>('/orders', payload, {
    'Idempotency-Key': idempotencyKey,
  });
  return res.data;
}

/**
 * A5.4 — Cancel order  🔒
 * Only valid in SUBMITTED and WAITING_PHARMACY_CONFIRMATION states.
 * May increment customer's strike count if cancelled after confirmation.
 */
export async function cancelOrder(orderId: string): Promise<{ message: string; strikes: number }> {
  const res = await api.post<{ message: string; strikes: number }>(`/orders/${orderId}/cancel`);
  return res.data;
}

/**
 * A5.5 — Reorder  🔒
 * Duplicates a COMPLETED or CANCELLED order. Returns the new order.
 * Items are re-priced at current pharmacy prices.
 */
export async function reorder(orderId: string): Promise<Order> {
  const res = await api.post<Order>(`/orders/${orderId}/reorder`);
  return res.data;
}

/**
 * A5.6 — Submit rating  🔒
 * Only valid after order state = COMPLETED. One rating per order.
 */
export async function submitRating(
  orderId: string,
  payload: { rating: number; comment?: string },
): Promise<{ message: string }> {
  const res = await api.post<{ message: string }>(`/orders/${orderId}/ratings`, payload);
  return res.data;
}

/**
 * A5.7 — Request pickup extension  🔒
 * Extends the pickup deadline by 24 hours. Only one extension allowed per order.
 */
export async function requestPickupExtension(
  orderId: string,
): Promise<{ message: string; newDeadline: string }> {
  const res = await api.post<{ message: string; newDeadline: string }>(
    `/orders/${orderId}/pickup/extension-requests`,
  );
  return res.data;
}

/**
 * A5.8 — Update Payment Method
 */
export async function updatePaymentMethod(orderId: string, paymentMethod: 'ONLINE' | 'PAY_AT_COUNTER'): Promise<Order> {
  const res = await api.patch<Order>(`/orders/${orderId}/payment-method`, { paymentMethod });
  return res.data;
}

/**
 * MOCK ONLY: Update order state directly for demo purposes
 */
export async function updateOrderState(orderId: string, state: FSMOrderState): Promise<Order> {
  const res = await api.patch<Order>(`/orders/${orderId}`, { state });
  return res.data;
}

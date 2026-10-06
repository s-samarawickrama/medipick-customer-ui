/**
 * MediPick — Quotes API (Priority 2)
 *
 * Endpoints: A7.1 → A7.3
 * Design ref: MediPick_API_Design_Document.md — Section A7
 *
 * All endpoints require Bearer token (🔒).
 * PERMISSION: Only PHARMACIST can CREATE a quote. Customer can only accept/decline.
 *
 * Used by: QuotationScreen
 */

import { api } from './client';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface QuoteItem {
  id:                 string;
  medicineId:         string | null;
  medicineName:       string;        // Snapshot name (may be custom if alternative)
  genericName:        string | null;
  quantity:           number;
  mrp:                number;        // Unit MRP in LKR
  quotedPrice:        number;        // Unit pharmacy price in LKR
  lineTotal:          number;        // quotedPrice × quantity
  isAlternative:      boolean;       // True if pharmacist substituted a generic
  originalPrescribed: string | null; // Name of originally prescribed medicine
}

export interface Quote {
  id:             string;
  orderId:        string;
  pharmacyName:   string;
  pharmacistName: string;
  nmraLicense:    string;
  items:          QuoteItem[];
  totalAmount:    number;   // Sum at quoted prices in LKR
  totalMrp:       number;   // Sum at MRP prices in LKR
  savings:        number;   // totalMrp - totalAmount
  status:         'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';
  validUntil:     string;   // ISO 8601 — customer must act before this
  createdAt:      string;
}

export interface AcceptQuoteResponse {
  message:           string;
  order:             { id: string; state: string };
  paymentClientSecret?: string;  // Only present if paymentMethod = ONLINE
}

// ─── API Functions ────────────────────────────────────────────────────────────

/**
 * A7.1 — Get current (PENDING) quote for an order  🔒
 * Returns the active quote waiting for customer action.
 * Used by QuotationScreen on mount.
 */
export async function getCurrentQuote(orderId: string): Promise<Quote> {
  const res = await api.get<Quote>(`/orders/${orderId}/quotes/current`);
  return res.data;
}

/**
 * A7.2 — Accept quote  🔒
 * Customer accepts the pharmacist's price quote.
 * If paymentMethod = ONLINE, response includes paymentClientSecret for the payment modal.
 * If paymentMethod = PAY_AT_COUNTER, order moves directly to PREPARING.
 */
export async function acceptQuote(orderId: string): Promise<AcceptQuoteResponse> {
  const res = await api.post<AcceptQuoteResponse>(
    `/orders/${orderId}/quotes/current/accept`,
  );
  return res.data;
}

/**
 * A7.3 — Decline quote  🔒
 * Customer declines the pharmacist's price quote.
 * Order moves back and customer can cancel or wait for revised quote.
 */
export async function declineQuote(orderId: string): Promise<{ message: string }> {
  const res = await api.post<{ message: string }>(
    `/orders/${orderId}/quotes/current/decline`,
  );
  return res.data;
}

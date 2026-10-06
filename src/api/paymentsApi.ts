/**
 * MediPick — Payments API (Priority 2)
 *
 * Endpoints: A8.1 → A8.2
 * Design ref: MediPick_API_Design_Document.md — Section A8
 *
 * A8.1 requires Bearer token (🔒).
 * A8.2 is secured by webhook HMAC signature (not customer JWT).
 *
 * Used by: MultiStoreCartScreen (ONLINE orders), ReadyForPickupScreen (PAY_AT_COUNTER switching)
 */

import { api } from './client';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PaymentIntent {
  paymentIntentId: string;    // Internal payment record ID
  clientSecret:    string;    // Passed to the payment gateway SDK (e.g. Stripe)
  amount:          number;    // Total amount in LKR
  currency:        'LKR';
  gateway:         string;    // e.g. "stripe"
  orderId:         string;
}

export interface CreatePaymentIntentPayload {
  orderId:       string;
  paymentMethod: 'ONLINE';
}

// ─── API Functions ────────────────────────────────────────────────────────────

/**
 * A8.1 — Create payment intent  🔒
 * Creates a payment intent for an ONLINE payment order.
 * The returned clientSecret is passed to the Stripe SDK / payment modal.
 *
 * Call this:
 *   - After createOrder() if paymentMethod = ONLINE (MultiStoreCartScreen)
 *   - After acceptQuote() if response includes paymentClientSecret (QuotationScreen)
 *   - When tapping "Pay Now" at ReadyForPickupScreen for PAY_AT_COUNTER orders
 */
export async function createPaymentIntent(
  payload: CreatePaymentIntentPayload,
): Promise<PaymentIntent> {
  const idempotencyKey = Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
  const res = await api.post<PaymentIntent>('/payments/intents', payload, {
    'Idempotency-Key': idempotencyKey,
  });
  return res.data;
}

/**
 * A8.2 — Payment webhook (server-to-server)
 * NOTE: This endpoint is called by Stripe's servers, NOT by the mobile app.
 *       It is secured by Stripe webhook signature header verification.
 *       It is included here for completeness — the mobile app never calls this directly.
 *
 * This is a no-op on the client side. The server handles it and updates order.isPaid.
 */
export const WEBHOOK_ENDPOINT = '/payments/webhook';  // For documentation reference only

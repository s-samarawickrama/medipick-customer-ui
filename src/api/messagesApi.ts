/**
 * MediPick — Messages API (Priority 3)
 *
 * Endpoints: A9.1 → A9.2
 * Design ref: MediPick_API_Design_Document.md — Section A9
 *
 * All endpoints require Bearer token (🔒).
 * Used by: PharmacyChatScreen, ChatListScreen
 *
 * Sender roles allowed: CUSTOMER, PHARMACIST, PHARMACY_STAFF, PLATFORM_ADMIN, SYSTEM
 */

import { api } from './client';

// ─── Types ────────────────────────────────────────────────────────────────────

export type MessageSenderRole =
  | 'CUSTOMER'
  | 'PHARMACIST'
  | 'PHARMACY_STAFF'
  | 'PLATFORM_ADMIN'
  | 'SYSTEM';

export interface ChatMessage {
  id:           string;
  orderId:      string;
  senderRole:   MessageSenderRole;
  senderName:   string;          // Display name e.g. "Perera", "Pharmacist", "System"
  text:         string;
  timestamp:    string;          // Pre-formatted local time e.g. "2:15 PM" (for display)
  createdAt:    string;          // ISO 8601 UTC (for ordering and real-time sync)
}

export interface SendMessagePayload {
  text: string;
}

// ─── API Functions ────────────────────────────────────────────────────────────

/**
 * A9.1 — Get all messages in order chat  🔒
 * Returns full message history for a specific order thread.
 * Messages ordered by createdAt ascending (oldest first).
 */
export async function getMessages(orderId: string): Promise<ChatMessage[]> {
  const res = await api.get<ChatMessage[]>(`/orders/${orderId}/messages`);
  return res.data;
}

/**
 * A9.2 — Send a message  🔒
 * Sends a message in the order's chat thread.
 * The senderRole is determined by the server from the JWT token.
 */
export async function sendMessage(
  orderId: string,
  payload: SendMessagePayload,
): Promise<ChatMessage> {
  const res = await api.post<ChatMessage>(`/orders/${orderId}/messages`, payload);
  return res.data;
}

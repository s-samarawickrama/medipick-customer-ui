/**
 * MediPick — Notifications API (Priority 3)
 *
 * Endpoints: A10.1 → A10.3
 * Design ref: MediPick_API_Design_Document.md — Section A10
 *
 * All endpoints require Bearer token (🔒).
 * Used by: NotificationsScreen, HomeScreen (bell badge unread count)
 *
 * NOTE: Field is named `read` (not `isRead`) to match NotificationsScreen.tsx.
 */

import { api } from './client';
import type { ApiMeta } from './client';

// ─── Types ────────────────────────────────────────────────────────────────────

export type NotificationType =
  | 'ORDER_STATUS_CHANGED'
  | 'QUOTE_RECEIVED'
  | 'PICKUP_READY'
  | 'ORDER_CANCELLED'
  | 'PRESCRIPTION_APPROVED'
  | 'PRESCRIPTION_REJECTED'
  | 'PAYMENT_CONFIRMED'
  | 'ISSUE_RESOLVED'
  | 'SYSTEM';

export interface Notification {
  id:        string;
  type:      NotificationType;
  title:     string;
  body:      string;
  orderId:   string | null;
  read:      boolean;          // Named "read" not "isRead" — matches screen field access
  createdAt: string;           // ISO 8601
}

export interface NotificationListQuery {
  unreadOnly?: boolean;
  page?:       number;
  limit?:      number;
}

export interface NotificationListResponse {
  data: Notification[];
  meta: ApiMeta;
}

// ─── API Functions ────────────────────────────────────────────────────────────

/**
 * A10.1 — List notifications  🔒
 * Pass unreadOnly=true + limit=1 for the HomeScreen bell badge unread count.
 */
export async function listNotifications(
  query: NotificationListQuery = {},
): Promise<NotificationListResponse> {
  const params = new URLSearchParams();
  if (query.unreadOnly !== undefined) params.set('unreadOnly', String(query.unreadOnly));
  if (query.page)  params.set('page',  String(query.page));
  if (query.limit) params.set('limit', String(query.limit));

  const qs  = params.toString();
  const res = await api.get<Notification[]>(`/notifications${qs ? `?${qs}` : ''}`);
  return { data: res.data, meta: res.meta! };
}

/**
 * A10.2 — Mark single notification as read  🔒
 */
export async function markNotificationRead(
  notificationId: string,
): Promise<{ id: string; read: boolean }> {
  const res = await api.patch<{ id: string; read: boolean }>(
    `/notifications/${notificationId}`,
    { read: true },
  );
  return res.data;
}

/**
 * A10.3 — Mark all notifications as read  🔒
 * Returns the count of notifications that were marked.
 */
export async function markAllNotificationsRead(): Promise<{ markedCount: number }> {
  const res = await api.post<{ markedCount: number }>('/notifications/read-all');
  return res.data;
}

/**
 * MediPick — Health Tips API (Priority 3)
 *
 * Endpoints: A11.1 → A11.2
 * Design ref: MediPick_API_Design_Document.md — Section A11
 *
 * All endpoints are public (🔓) — no token required.
 * Used by: HealthTipsScreen, TipDetailScreen
 */

import { apiRequest } from './client';
import type { ApiMeta } from './client';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface HealthTip {
  id:           string;
  title:        string;
  category:     string;
  previewText:  string;
  bodyText:     string;
  imageUrl:     string | null;
  publishedAt:  string;  // ISO Date string
  readTimeMins: number;
}

export interface HealthTipListQuery {
  category?: string;
  page?:     number;
  limit?:    number;
}

export interface HealthTipListResponse {
  data: HealthTip[];
  meta: ApiMeta;
}

// ─── API Functions ────────────────────────────────────────────────────────────

/**
 * A11.1 — List health tips  🔓 Public
 * Returns only published health tips. Ordered by publishedAt DESC.
 */
export async function listHealthTips(
  query: HealthTipListQuery = {},
): Promise<HealthTipListResponse> {
  const params = new URLSearchParams();
  if (query.category) params.set('category', query.category);
  if (query.page)     params.set('page',  String(query.page));
  if (query.limit)    params.set('limit', String(query.limit));

  const qs  = params.toString();
  const res = await apiRequest<HealthTip[]>(`/health-tips${qs ? `?${qs}` : ''}`);
  return { data: res.data, meta: res.meta! };
}

/**
 * A11.2 — Get health tip detail  🔓 Public
 */
export async function getHealthTip(tipId: string): Promise<HealthTip> {
  const res = await apiRequest<HealthTip>(`/health-tips/${tipId}`);
  return res.data;
}

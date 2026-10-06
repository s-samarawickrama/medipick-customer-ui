/**
 * MediPick — Medicines API (Priority 1)
 *
 * Endpoints: A4.1 → A4.2
 * Design ref: MediPick_API_Design_Document.md — Section A4
 *
 * A4.1 is public (🔓). A4.2 requires Bearer token (🔒).
 * Used by: BrowseOTCScreen, MultiStoreCartScreen
 */

import { api, apiRequest } from './client';
import type { ApiMeta } from './client';

// ─── Types ────────────────────────────────────────────────────────────────────

export type MedicineCategory =
  | 'Cold & Flu'
  | 'First Aid'
  | 'Vitamins'
  | 'Personal Care'
  | 'Chronic'
  | 'Skincare'
  | 'Supplements'
  | 'Baby Care';

export interface Medicine {
  id:           string;
  name:         string;
  genericName:  string;
  brandName:    string | null;
  dosage:       string | null;
  category:     MedicineCategory;
  description:  string | null;
  isRxRequired: boolean;
  mrpPrice:     number;         // Government MRP in LKR
  pharmacyPrice: number;        // Pharmacy selling price in LKR (from inventory)
  inStock:      boolean;
  image:        string | null;  // CDN URL
  popularity:   number;         // 0–100
}

export interface MedicineListQuery {
  search?:      string;
  category?:    MedicineCategory;
  pharmacyId?:  string;   // Filter to medicines available at this pharmacy
  isRxRequired?: boolean;
  inStock?:     boolean;
  sort?:        'popularity' | 'price_asc' | 'price_desc' | 'name';
  page?:        number;
  limit?:       number;
}

export interface MedicineListResponse {
  data: Medicine[];
  meta: ApiMeta;
}

// ─── API Functions ────────────────────────────────────────────────────────────

/**
 * A4.1 — List medicines  🔓 Public
 * Supports text search, category filter, pharmacy-specific stock filter.
 * Used by BrowseOTCScreen for the full catalogue and search.
 */
export async function listMedicines(query: MedicineListQuery = {}): Promise<MedicineListResponse> {
  const params = new URLSearchParams();
  if (query.search)      params.set('search',      query.search);
  if (query.category)    params.set('category',    query.category);
  if (query.pharmacyId)  params.set('pharmacyId',  query.pharmacyId);
  if (query.isRxRequired !== undefined) params.set('isRxRequired', String(query.isRxRequired));
  if (query.inStock !== undefined)      params.set('inStock',      String(query.inStock));
  if (query.sort)        params.set('sort',  query.sort);
  if (query.page)        params.set('page',  String(query.page));
  if (query.limit)       params.set('limit', String(query.limit));

  const qs  = params.toString();
  const res = await apiRequest<Medicine[]>(`/medicines${qs ? `?${qs}` : ''}`);
  return { data: res.data, meta: res.meta! };
}

/**
 * A4.2 — Get single medicine detail  🔒 Protected
 * Returns full detail including description and stock status.
 */
export async function getMedicine(medicineId: string): Promise<Medicine> {
  const res = await api.get<Medicine>(`/medicines/${medicineId}`);
  return res.data;
}

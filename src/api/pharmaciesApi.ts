/**
 * MediPick — Pharmacies API (Priority 0)
 *
 * Endpoints: A3.1 → A3.5
 * Design ref: MediPick_API_Design_Document.md — Section A3
 *
 * A3.1 and A3.2 are public (🔓) — no token required.
 * A3.3, A3.4, A3.5 are protected (🔒) — require Bearer token.
 *
 * Used by: HomeScreen, BrowseOTCScreen, SelectPharmacyScreen, FavoritesScreen
 */

import { api, apiRequest } from './client';
import type { ApiMeta } from './client';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Pharmacy {
  id:                     string;
  name:                   string;
  address:                string;
  nmraLicense:            string;
  pharmacistName:         string;
  pharmacistRegNo:        string;
  latitude?:              number;
  longitude?:             number;
  distance:               string;         // Human-readable e.g. "0.8 km" — computed server-side
  rating:                 number;         // 0.0–5.0
  ratingCount?:           number;
  estimatedResponseTime:  string;         // e.g. "5 - 15 mins"
  isOpen:                 boolean;
  hasOffer?:              boolean;
  offerTag?:              string | null;
  image?:                 string | null;  // CDN URL
  isFavorite?:            boolean;        // Only present when authenticated
  favoriteId?:            string | null;  // The favorites row ID — needed for DELETE unfavorite
}

export interface PharmacyListQuery {
  search?:    string;   // Text search on name / address
  latitude?:  number;   // Customer GPS latitude (for distance sort)
  longitude?: number;   // Customer GPS longitude
  sort?:      'distance' | 'rating' | 'popularity';
  isOpen?:    boolean;  // Filter to open pharmacies only
  limit?:     number;
  page?:      number;
}

export interface PharmacyListResponse {
  data: Pharmacy[];
  meta: ApiMeta;
}

// ─── API Functions ────────────────────────────────────────────────────────────

/**
 * A3.1 — List pharmacies  🔓 Public
 * Supports text search, GPS distance sort, and open/closed filter.
 * Pass latitude + longitude for distance-sorted results (HomeScreen, SelectPharmacyScreen).
 */
export async function listPharmacies(
  query: PharmacyListQuery = {},
): Promise<PharmacyListResponse> {
  const params = new URLSearchParams();
  if (query.search)    params.set('search',    query.search);
  if (query.latitude)  params.set('latitude',  String(query.latitude));
  if (query.longitude) params.set('longitude', String(query.longitude));
  if (query.sort)      params.set('sort',      query.sort);
  if (query.isOpen !== undefined) params.set('isOpen', String(query.isOpen));
  if (query.limit)     params.set('limit',     String(query.limit));
  if (query.page)      params.set('page',      String(query.page));

  const qs = params.toString();
  const res = await apiRequest<Pharmacy[]>(`/pharmacies${qs ? `?${qs}` : ''}`);
  return { data: res.data, meta: res.meta! };
}

/**
 * A3.2 — Get single pharmacy detail  🔓 Public
 * Returns full pharmacy object including pharmacist credentials.
 */
export async function getPharmacy(
  pharmacyId: string,
  latitude?: number,
  longitude?: number
): Promise<Pharmacy> {
  const params = new URLSearchParams();
  if (latitude !== undefined) params.set('latitude', String(latitude));
  if (longitude !== undefined) params.set('longitude', String(longitude));

  const qs = params.toString();
  const res = await api.get<Pharmacy>(`/pharmacies/${pharmacyId}${qs ? `?${qs}` : ''}`);
  return res.data;
}

/**
 * A3.3 — List favorited pharmacies  🔒 Protected
 * Returns all pharmacies this customer has favorited.
 * Used by FavoritesScreen.
 */
export async function listFavoritePharmacies(
  latitude?: number,
  longitude?: number,
): Promise<Pharmacy[]> {
  const params = new URLSearchParams();
  if (latitude !== undefined) params.set('latitude', String(latitude));
  if (longitude !== undefined) params.set('longitude', String(longitude));

  const qs = params.toString();
  const res = await api.get<Pharmacy[]>(`/pharmacies/favorites${qs ? `?${qs}` : ''}`);
  return res.data;
}

/**
 * A3.4 — Add pharmacy to favorites  🔒 Protected
 * Returns the favoriteId needed to later call removeFavorite().
 * Store this on the Pharmacy object in local state.
 */
export async function addFavorite(
  pharmacyId: string,
): Promise<{ favoriteId: string; pharmacyId: string }> {
  const res = await api.post<{ favoriteId: string; pharmacyId: string }>(
    `/pharmacies/${pharmacyId}/favorites`,
  );
  return res.data;
}

/**
 * A3.5 — Remove pharmacy from favorites  🔒 Protected
 * Requires both pharmacyId and favoriteId (the row ID returned by A3.4).
 */
export async function removeFavorite(
  pharmacyId: string,
  favoriteId: string,
): Promise<void> {
  await api.delete(`/pharmacies/${pharmacyId}/favorites/${favoriteId}`);
}


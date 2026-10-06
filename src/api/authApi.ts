/**
 * MediPick — Auth API (Priority 0)
 *
 * Endpoints: A1.1 → A1.5
 * Design ref: MediPick_API_Design_Document.md — Section A1
 *
 * Flow:
 *   1. requestOtp()  →  OTP SMS sent to phone
 *   2. verifyOtp()   →  tokens returned → save to SecureStore via saveTokens()
 *   3. refreshToken()→  silent refresh (called automatically by client.ts on 401)
 *   4. logout()      →  revoke refresh token server-side + clear SecureStore
 */

import { api, saveTokens, clearTokens, getRefreshToken, API_BASE_URL } from './client';

// ─── Request / Response types ─────────────────────────────────────────────────

export interface OtpRequestPayload {
  phoneNumber: string;  // E.164 format e.g. "+94771234567"
  surname:     string;  // 2–100 characters
  email?:      string;  // Optional
}

export interface OtpRequestResponse {
  message:   string;  // e.g. "OTP sent to +94771234567"
  expiresIn: number;  // Seconds until OTP expires (300 = 5 minutes)
}

export interface OtpVerifyPayload {
  phoneNumber: string;
  otp:         string;  // 6-digit numeric string
}

export interface AuthUser {
  id:                       string;
  phoneNumber:              string;
  surname:                  string;
  email:                    string | null;
  isVerified:               boolean;
  strikes:                  number;
  strikeLimit:              number;
  isLocked:                 boolean;
  lockedUntil:              string | null;
  pushNotificationsEnabled: boolean;
  emailReceiptsEnabled:     boolean;
  createdAt:                string;
}

export interface OtpVerifyResponse {
  accessToken:  string;
  refreshToken: string;
  expiresIn:    number;  // Access token lifetime in seconds (900 = 15 minutes)
  user:         AuthUser;
}

export interface TokenRefreshResponse {
  accessToken:  string;
  refreshToken: string;
  expiresIn:    number;
}

// ─── API Functions ────────────────────────────────────────────────────────────

/**
 * A1.1 — Request OTP
 * Upserts the customer (creates if new, updates name/email if existing).
 * Sends a 6-digit OTP via SMS. Rate-limited to 3 requests per phone per 10 min.
 */
export async function requestOtp(payload: OtpRequestPayload): Promise<OtpRequestResponse> {
  const res = await api.post<OtpRequestResponse>('/auth/otp/request', payload);
  return res.data;
}

/**
 * A1.2 — Verify OTP
 * Validates the OTP. On success, saves tokens to SecureStore automatically.
 * Max 5 wrong attempts before the OTP is invalidated.
 */
export async function verifyOtp(payload: OtpVerifyPayload): Promise<OtpVerifyResponse> {
  const res = await api.post<OtpVerifyResponse>('/auth/otp/verify', payload);
  await saveTokens(res.data.accessToken, res.data.refreshToken);
  return res.data;
}

/**
 * A1.3 — Resend OTP
 * Invalidates the previous OTP and sends a new one.
 */
export async function resendOtp(phoneNumber: string): Promise<OtpRequestResponse> {
  const res = await api.post<OtpRequestResponse>('/auth/otp/resend', { phoneNumber });
  return res.data;
}

/**
 * A1.4 — Refresh Token
 * Called automatically by client.ts on 401. Can also be called manually.
 * Uses token rotation — a new refresh token is issued and the old one is revoked.
 */
export async function refreshToken(): Promise<TokenRefreshResponse> {
  const storedRefreshToken = await getRefreshToken();
  if (!storedRefreshToken) throw new Error('No refresh token available.');

  const response = await fetch(`${API_BASE_URL}/auth/token/refresh`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ refreshToken: storedRefreshToken }),
  });

  if (!response.ok) throw new Error('Token refresh failed.');

  const body = await response.json();
  await saveTokens(body.data.accessToken, body.data.refreshToken);
  return body.data;
}

/**
 * A1.5 — Logout
 * Revokes the refresh token on the server, then clears SecureStore locally.
 */
export async function logout(): Promise<void> {
  try {
    await api.post('/auth/logout');
  } finally {
    // Always clear local storage even if server request fails
    await clearTokens();
  }
}

/**
 * A1.6: Validate Token & Sync State
 * Validates the current access token and returns the latest customer state (including lockouts/strikes)
 */
export async function validateToken(): Promise<{ user: AuthUser }> {
  const res = await api.get<{ user: AuthUser }>('/auth/token/validate');
  return res.data;
}

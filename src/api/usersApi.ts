/**
 * MediPick — Users API (Priority 0)
 *
 * Endpoints: A2.1 → A2.6
 * Design ref: MediPick_API_Design_Document.md — Section A2
 *
 * All endpoints require a valid Bearer access token.
 * Used by: SplashScreen (A2.1), ProfileScreen (A2.1, A2.2, A2.3, A2.4, A2.5, A2.6)
 */

import { api } from './client';
import type { AuthUser } from './authApi';

// ─── Request / Response types ─────────────────────────────────────────────────

export type UserProfile = AuthUser;

export interface UpdateProfilePayload {
  surname?: string;  // 2–100 characters
  email?:   string;  // Valid email format
}

export interface UpdatePreferencesPayload {
  pushNotificationsEnabled?: boolean;
  emailReceiptsEnabled?:     boolean;
}

export interface InitiatePhoneChangePayload {
  newPhoneNumber: string;  // E.164 format
}

export interface VerifyPhoneChangePayload {
  newPhoneNumber: string;
  otp:            string;  // 6-digit OTP sent to the new number
}

export interface RegisterPushTokenPayload {
  pushToken: string;  // Expo push token e.g. "ExponentPushToken[xxxx]"
}

// ─── API Functions ────────────────────────────────────────────────────────────

/**
 * A2.1 — Get current user profile
 * Called on SplashScreen to validate session and load user data.
 * Returns 401 if token expired → client.ts will attempt silent refresh.
 */
export async function getMe(): Promise<UserProfile> {
  const res = await api.get<UserProfile>('/users/me');
  return res.data;
}

/**
 * A2.2 — Update profile
 * All fields optional. Only provided fields are updated.
 */
export async function updateProfile(payload: UpdateProfilePayload): Promise<UserProfile> {
  const res = await api.patch<UserProfile>('/users/me', payload);
  return res.data;
}

/**
 * A2.3 — Update notification preferences
 * Toggles push and email receipt settings.
 */
export async function updatePreferences(payload: UpdatePreferencesPayload): Promise<UserProfile> {
  const res = await api.patch<UserProfile>('/users/me/preferences', payload);
  return res.data;
}

/**
 * A2.4 — Initiate phone number change
 * Sends OTP to the new phone number. Customer must verify it via A2.5.
 */
export async function initiatePhoneChange(
  payload: InitiatePhoneChangePayload,
): Promise<{ message: string }> {
  const res = await api.patch<{ message: string }>('/users/me/phone', payload);
  return res.data;
}

/**
 * A2.5 — Confirm phone number change with OTP
 * Verifies the OTP sent to the new number and applies the phone change.
 */
export async function verifyPhoneChange(
  payload: VerifyPhoneChangePayload,
): Promise<{ message: string }> {
  const res = await api.post<{ message: string }>('/users/me/phone/verify', payload);
  return res.data;
}

/**
 * A2.6 — Register Expo push token
 * Called on app launch after requesting push notification permissions.
 * Updates the stored push_token in the customers table.
 */
export async function registerPushToken(
  payload: RegisterPushTokenPayload,
): Promise<{ message: string }> {
  const res = await api.post<{ message: string }>('/users/me/push-token', payload);
  return res.data;
}

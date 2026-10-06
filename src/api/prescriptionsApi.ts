/**
 * MediPick — Prescriptions API (Priority 1)
 *
 * Endpoints: A6.1 → A6.5
 * Design ref: MediPick_API_Design_Document.md — Section A6
 *
 * NOTE: The AI clarity check engine is a pre-built external service.
 *       These endpoints integrate with it — they do not implement the AI itself.
 *
 * Upload flow:
 *   1. A6.1 — Get pre-signed upload URL from server
 *   2. Direct PUT to the cloud storage URL (bypasses our backend)
 *   3. A6.2 — Register the prescription in DB and trigger AI check
 *   4. A6.4 — Poll status until AI check completes (every 2s)
 *   5. A6.3 — Get full AI results breakdown
 *
 * Used by: UploadPrescriptionScreen, AIQualityCheckScreen
 */

import { api } from './client';

// ─── Types ────────────────────────────────────────────────────────────────────

export type PrescriptionStatus =
  | 'PRESCRIPTION_VALIDATION'
  | 'WAITING_PHARMACY_CONFIRMATION'
  | 'REJECTED'
  | 'AWAITING_PRESCRIPTION_UPLOAD';

export interface AiCheck {
  score:   number;   // 0–100
  max:     number;   // Always 100
  passed:  boolean;
}

export interface AiChecks {
  clarity:         AiCheck;
  doctorSignature: { detected: boolean };
  patientName:     { detected: boolean };
  date:            { detected: boolean; value: string | null };
}

export interface Prescription {
  id:              string;
  fileUrl:         string;
  aiClarityScore:  number | null;
  aiChecks:        AiChecks | null;
  status:          PrescriptionStatus;
  pharmacistNote:  string | null;
  createdAt:       string;
}

export interface UploadUrlResponse {
  uploadUrl: string;   // Pre-signed PUT URL for cloud storage
  fileKey:   string;   // Storage key to pass back to A6.2
  expiresIn: number;   // Seconds before the URL expires (300 = 5 min)
}

export interface RegisterPrescriptionPayload {
  fileKey:     string;   // Returned from A6.1
  pharmacyId?: string;   // Optional: pre-select pharmacy at registration time
}

// ─── API Functions ────────────────────────────────────────────────────────────

/**
 * A6.1 — Get pre-signed upload URL  🔒
 * Returns a time-limited URL to upload the image directly to cloud storage.
 * The file must be uploaded via direct PUT to this URL (not through our API).
 */
export async function getUploadUrl(): Promise<UploadUrlResponse> {
  const res = await api.get<UploadUrlResponse>('/prescriptions/upload-url');
  return res.data;
}

/**
 * A6.2 — Register prescription  🔒
 * Called AFTER the image has been uploaded to cloud storage.
 * Stores the prescription record and triggers the AI clarity check.
 * Returns the initial prescription object with status = PRESCRIPTION_VALIDATION.
 */
export async function registerPrescription(
  payload: RegisterPrescriptionPayload,
): Promise<Prescription> {
  const res = await api.post<Prescription>('/prescriptions', payload);
  return res.data;
}

/**
 * A6.3 — Get prescription detail  🔒
 * Returns full AI check results. Call after polling A6.4 confirms completion.
 */
export async function getPrescription(prescriptionId: string): Promise<Prescription> {
  const res = await api.get<Prescription>(`/prescriptions/${prescriptionId}`);
  return res.data;
}

/**
 * A6.4 — Get prescription status (for polling)  🔒
 * Lightweight status-only endpoint. Poll every 2 seconds until status
 * leaves PRESCRIPTION_VALIDATION.
 */
export async function getPrescriptionStatus(
  prescriptionId: string,
): Promise<{ id: string; status: PrescriptionStatus; aiClarityScore: number | null }> {
  const res = await api.get<{
    id:              string;
    status:          PrescriptionStatus;
    aiClarityScore:  number | null;
  }>(`/prescriptions/${prescriptionId}/status`);
  return res.data;
}

/**
 * A6.5 — List customer prescriptions  🔒
 * Returns all prescriptions uploaded by the current customer.
 */
export async function listPrescriptions(): Promise<Prescription[]> {
  const res = await api.get<Prescription[]>('/prescriptions');
  return res.data;
}

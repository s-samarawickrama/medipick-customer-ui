/**
 * MediPick — API Module Index
 *
 * Export only completed, correct API modules here.
 * Modules are added priority-by-priority as they are built.
 *
 * Design ref: MediPick_API_Design_Document.md v3.0
 *
 * ─── Build Status ─────────────────────────────────────────────────
 *  [✅] Priority 0 — Auth, Users, Pharmacies
 *  [✅] Priority 1 — Medicines, Orders, Prescriptions
 *  [✅] Priority 2 — Quotes, Payments
 *  [✅] Priority 3 — Messages, Notifications, Health Tips, Issues
 * ──────────────────────────────────────────────────────────────────
 */

// Core client — error types used across all modules
export { ApiError, AuthExpiredError } from './client';
export type { ApiSuccessResponse, ApiMeta } from './client';

// ── Priority 0 ─────────────────────────────────────────────────────────────
export * from './authApi';
export * from './usersApi';
export * from './pharmaciesApi';

// ── Priority 1 ─────────────────────────────────────────────────────────────
export * from './medicinesApi';
export * from './ordersApi';
export * from './prescriptionsApi';

// ── Priority 2 ─────────────────────────────────────────────────────────────
export * from './quotesApi';
export * from './paymentsApi';

// ── Priority 3 ─────────────────────────────────────────────────────────────
export * from './messagesApi';
export * from './notificationsApi';
export * from './healthTipsApi';
export * from './issuesApi';

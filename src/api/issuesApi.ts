/**
 * MediPick — Issues API (Priority 3)
 *
 * Endpoints: A12.1 → A12.3
 * Design ref: MediPick_API_Design_Document.md — Section A12
 *
 * All endpoints require Bearer token (🔒).
 * Used by: ReportIssueScreen, IssueDetailsScreen
 */

import { api } from './client';
import type { ApiMeta } from './client';

// ─── Types ────────────────────────────────────────────────────────────────────

export type IssueStatus = 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'REJECTED';

export type IssueType =
  | 'Missing medicine'
  | 'Wrong medicine'
  | 'Damaged / Expired'
  | 'Wrong quantity'
  | 'Other';

export interface Issue {
  id:                 string;
  orderId:            string;
  issueType:          IssueType;
  description:        string;
  evidenceFileKeys:   string[]; // Array of cloud storage keys for uploaded evidence
  status:             IssueStatus;
  resolution:         string | null;
  createdAt:          string;
  updatedAt:          string;
}

export interface ReportIssuePayload {
  orderId:          string;
  issueType:        IssueType;
  description:      string;
  evidenceFileKeys: string[];
}

export interface IssueListQuery {
  page?:  number;
  limit?: number;
}

export interface IssueListResponse {
  data: Issue[];
  meta: ApiMeta;
}

// ─── API Functions ────────────────────────────────────────────────────────────

/**
 * A12.1 — List customer issues  🔒
 * Returns all issues reported by the authenticated customer.
 */
export async function listIssues(query: IssueListQuery = {}): Promise<IssueListResponse> {
  const params = new URLSearchParams();
  if (query.page)  params.set('page',  String(query.page));
  if (query.limit) params.set('limit', String(query.limit));

  const qs  = params.toString();
  const res = await api.get<Issue[]>(`/issues${qs ? `?${qs}` : ''}`);
  return { data: res.data, meta: res.meta! };
}

/**
 * A12.2 — Get issue detail  🔒
 */
export async function getIssue(issueId: string): Promise<Issue> {
  const res = await api.get<Issue>(`/issues/${issueId}`);
  return res.data;
}

/**
 * A12.3 — Report new issue  🔒
 * Valid only if order state is COMPLETED and no issue exists yet.
 */
export async function reportIssue(payload: ReportIssuePayload): Promise<Issue> {
  const res = await api.post<Issue>('/issues', payload);
  return res.data;
}

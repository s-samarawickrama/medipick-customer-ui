import { validateToken, logout as apiLogout } from '../api/authApi';
import { getAccessToken, AuthExpiredError } from '../api/client';
import { AuthUser } from '../api/authApi';

/**
 * Authentication Service
 * Implements the Service Layer pattern for the auth domain.
 * Abstracts the raw API calls and handles complex business logic (lockouts, session syncing).
 */
export const authService = {
  /**
   * Syncs the local session with the backend.
   * Returns the user profile if the session is valid, or throws an AuthExpiredError.
   */
  async syncSession(): Promise<AuthUser | null> {
    const token = await getAccessToken();
    if (!token) {
      return null;
    }

    try {
      const response = await validateToken();
      
      // Business Logic: If the API says the user is locked, we can enforce UI behavior here.
      if (response.user.isLocked) {
        console.warn(`[AuthService] User account is locked until ${response.user.lockedUntil}`);
      }
      
      return response.user;
    } catch (e: any) {
      if (e instanceof AuthExpiredError) {
        throw e; // Handled by AuthContext (force logout)
      }
      console.warn('[AuthService] Failed to sync session', e);
      throw e;
    }
  },

  /**
   * Performs a complete logout sequence.
   */
  async logout(): Promise<void> {
    try {
      await apiLogout();
    } catch (e) {
      console.warn('[AuthService] Logout API failed, forcing local logout', e);
    }
  }
};

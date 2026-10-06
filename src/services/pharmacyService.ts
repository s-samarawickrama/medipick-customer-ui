import { listPharmacies as apiListPharmacies, listFavoritePharmacies as apiListFavorites, addFavorite as apiAddFavorite, removeFavorite as apiRemoveFavorite, getPharmacy as apiGetPharmacy, Pharmacy, PharmacyListQuery } from '../api/pharmaciesApi';

/**
 * Pharmacy Service
 * Implements the Service Layer pattern for the pharmacy domain.
 * Abstracts raw API fetching and handles optimistic UI logic if needed.
 */
export const pharmacyService = {
  
  async getPharmacies(query: PharmacyListQuery = {}) {
    return apiListPharmacies(query);
  },

  async getPharmacyById(id: string, latitude?: number, longitude?: number) {
    return apiGetPharmacy(id, latitude, longitude);
  },

  async getFavorites(latitude?: number, longitude?: number) {
    return apiListFavorites(latitude, longitude);
  },

  async toggleFavorite(pharmacy: Pharmacy, currentIsFav?: boolean, currentFavId?: string | null): Promise<{ isFavorite: boolean; favoriteId: string | null }> {
    try {
      const isFav = currentIsFav !== undefined ? currentIsFav : pharmacy.isFavorite;
      const favId = currentFavId !== undefined ? currentFavId : pharmacy.favoriteId;

      if (isFav && favId) {
        await apiRemoveFavorite(pharmacy.id, favId);
        return { isFavorite: false, favoriteId: null };
      } else {
        const res = await apiAddFavorite(pharmacy.id);
        return { isFavorite: true, favoriteId: res.favoriteId };
      }
    } catch (e) {
      console.warn('[PharmacyService] Failed to toggle favorite', e);
      throw e;
    }
  }
};

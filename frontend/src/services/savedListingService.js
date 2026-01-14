import api from './api';

export const savedListingService = {
    /**
     * Get all saved listings for the current user
     */
    getSavedListings: async (params = {}) => {
        const response = await api.get('/listings/saved/', { params });
        return response.data;
    },

    /**
     * Save a listing to wishlist
     * @param {number} listingId - ID of the listing to save
     */
    saveListing: async (listingId) => {
        const response = await api.post('/listings/saved/', {
            listing_id: listingId
        });
        return response.data;
    },

    /**
     * Remove a listing from saved items
     * @param {number} savedListingId - ID of the saved listing record
     */
    unsaveListing: async (savedListingId) => {
        await api.delete(`/listings/saved/${savedListingId}/`);
    },
};

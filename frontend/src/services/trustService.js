import api from './api';

export const trustService = {
    /**
     * Get current user's trust score
     */
    getMyTrustScore: async () => {
        const response = await api.get('/users/trust-scores/me/');
        return response.data;
    },

    /**
     * Get a specific user's trust score
     * @param {number} userId - ID of the user
     */
    getUserTrustScore: async (userId) => {
        const response = await api.get(`/users/trust-scores/${userId}/`);
        return response.data;
    },

    /**
     * Get trust score history
     */
    getTrustHistory: async () => {
        const response = await api.get('/users/trust-scores/history/');
        return response.data;
    },

    /**
     * Refresh trust score (recalculate)
     */
    refreshTrustScore: async () => {
        const response = await api.post('/users/trust-scores/refresh/');
        return response.data;
    },
};

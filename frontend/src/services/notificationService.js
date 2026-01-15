import api from './api';

export const notificationService = {
    /**
     * Get all notifications for current user
     */
    getNotifications: async () => {
        const response = await api.get('/notifications/notifications/');
        return response.data;
    },

    /**
     * Get unread notification count
     */
    getUnreadCount: async () => {
        const response = await api.get('/notifications/notifications/unread_count/');
        return response.data.count;
    },

    /**
     * Mark a notification as read
     * @param {number} notificationId - ID of the notification
     */
    markAsRead: async (notificationId) => {
        const response = await api.post(`/notifications/notifications/${notificationId}/mark_read/`);
        return response.data;
    },

    /**
     * Mark all notifications as read
     */
    markAllAsRead: async () => {
        const response = await api.post('/notifications/notifications/mark_all_read/');
        return response.data;
    },

    /**
     * Clear all read notifications
     */
    clearRead: async () => {
        const response = await api.delete('/notifications/notifications/clear_read/');
        return response.data;
    },

    /**
     * Get notification preferences
     */
    getPreferences: async () => {
        const response = await api.get('/notifications/preferences/me/');
        return response.data;
    },

    /**
     * Update notification preferences
     * @param {object} preferences - Preference settings
     */
    updatePreferences: async (preferences) => {
        const response = await api.put('/notifications/preferences/me/', preferences);
        return response.data;
    },
};

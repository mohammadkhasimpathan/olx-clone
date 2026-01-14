import api from './api';

/**
 * Admin service for admin-only API endpoints.
 * All endpoints require is_staff=True authentication.
 */
export const adminService = {
    // Dashboard Stats
    getStats: async () => {
        const response = await api.get('/admin/stats/');
        return response.data;
    },

    // Listings Management
    getAllListings: async (params = {}) => {
        const response = await api.get('/admin/listings/', { params });
        return response.data;
    },

    deactivateListing: async (id, reason) => {
        const response = await api.patch(`/admin/listings/${id}/deactivate/`, { reason });
        return response.data;
    },

    activateListing: async (id) => {
        const response = await api.patch(`/admin/listings/${id}/activate/`);
        return response.data;
    },

    deleteListing: async (id) => {
        await api.delete(`/admin/listings/${id}/`);
    },

    // User Management
    getAllUsers: async (params = {}) => {
        const response = await api.get('/admin/users/', { params });
        return response.data;
    },

    getUserDetails: async (id) => {
        const response = await api.get(`/admin/users/${id}/`);
        return response.data;
    },

    suspendUser: async (id, reason) => {
        const response = await api.patch(`/admin/users/${id}/suspend/`, { reason });
        return response.data;
    },

    activateUser: async (id) => {
        const response = await api.patch(`/admin/users/${id}/activate/`);
        return response.data;
    },

    // Reports Management
    getAllReports: async (params = {}) => {
        const response = await api.get('/admin/reports/', { params });
        return response.data;
    },

    getReportDetails: async (id) => {
        const response = await api.get(`/admin/reports/${id}/`);
        return response.data;
    },

    updateReport: async (id, data) => {
        const response = await api.patch(`/admin/reports/${id}/`, data);
        return response.data;
    },

    // Audit Log
    getAuditLog: async (params = {}) => {
        const response = await api.get('/admin/audit-log/', { params });
        return response.data;
    },
};

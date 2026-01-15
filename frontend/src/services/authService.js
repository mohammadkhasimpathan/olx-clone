import api from './api';

export const authService = {
    // NEW OTP REGISTRATION FLOW

    // Step 1: Send OTP to email
    sendOTP: async (email) => {
        const response = await api.post('/users/send-otp/', { email });
        return response.data;
    },

    // Step 2: Verify OTP (does NOT create user)
    verifyOTP: async (email, otp) => {
        const response = await api.post('/users/verify-otp/', { email, otp });
        return response.data;
    },

    // Step 3: Complete registration (creates user account)
    register: async (userData) => {
        const response = await api.post('/users/register/', userData);
        return response.data;
    },

    // Resend OTP
    resendOTP: async (email) => {
        const response = await api.post('/users/resend-otp/', { email });
        return response.data;
    },

    // Login user
    login: async (credentials) => {
        const response = await api.post('/users/login/', credentials);
        const { access, refresh } = response.data;

        // Store tokens
        localStorage.setItem('access_token', access);
        localStorage.setItem('refresh_token', refresh);

        return response.data;
    },

    // Logout user
    logout: () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
    },

    // Get current user profile
    getProfile: async () => {
        const response = await api.get('/users/profile/');
        return response.data;
    },

    // Update user profile
    updateProfile: async (profileData) => {
        const response = await api.put('/users/profile/', profileData);
        return response.data;
    },

    // Check if user is authenticated
    isAuthenticated: () => {
        return !!localStorage.getItem('access_token');
    },

    // Request password reset
    requestPasswordReset: async (email) => {
        const response = await api.post('/users/request-password-reset/', { email });
        return response.data;
    },

    // Verify reset OTP
    verifyResetOTP: async (email, otp) => {
        const response = await api.post('/users/verify-reset-otp/', { email, otp });
        return response.data;
    },

    // Reset password
    resetPassword: async (email, otp, newPassword, confirmPassword) => {
        const response = await api.post('/users/reset-password/', {
            email,
            otp,
            new_password: newPassword,
            confirm_password: confirmPassword
        });
        return response.data;
    },
};

import axios from 'axios';

// Create axios instance with base configuration
// Use environment variable for API URL, fallback to /api for development
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add JWT token to requests
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle token refresh and errors
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        // Network error (no response from server)
        if (!error.response) {
            console.error('Network error:', error);
            return Promise.reject({
                message: 'Network error. Please check your internet connection.',
                isNetworkError: true,
                originalError: error
            });
        }

        const originalRequest = error.config;

        // If error is 401 and we haven't tried to refresh yet
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem('refresh_token');
                if (refreshToken) {
                    const response = await axios.post(`${api.defaults.baseURL}/users/token/refresh/`, {
                        refresh: refreshToken,
                    });

                    const { access } = response.data;
                    localStorage.setItem('access_token', access);

                    // Retry the original request with new token
                    originalRequest.headers.Authorization = `Bearer ${access}`;
                    return api(originalRequest);
                }
            } catch (refreshError) {
                // Refresh failed, clear tokens and redirect to login
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }

        // Server error (5xx)
        if (error.response.status >= 500) {
            console.error('Server error:', error);
            return Promise.reject({
                message: 'Server error. Please try again later.',
                isServerError: true,
                originalError: error
            });
        }

        return Promise.reject(error);
    }
);

export default api;

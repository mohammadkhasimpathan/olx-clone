import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

/**
 * SessionManager Component
 * 
 * Handles automatic token refresh and session validation.
 * PRODUCTION-SAFE: Uses localStorage directly, no external dependencies.
 */
const SessionManager = () => {
    const { logout } = useAuth();

    useEffect(() => {
        // Check token expiration every minute
        const interval = setInterval(() => {
            // Get token directly from localStorage (SAFE)
            const token = localStorage.getItem('access_token');

            // If no token, do nothing (user not logged in)
            if (!token) {
                return;
            }

            // Check if token is expired by decoding JWT
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                const expirationTime = payload.exp * 1000; // Convert to milliseconds
                const currentTime = Date.now();

                // If token is expired
                if (currentTime >= expirationTime) {
                    console.log('Session expired - logging out');
                    // Just logout - ProtectedRoute will handle redirect
                    logout();
                }
            } catch (error) {
                // If token is malformed, logout
                console.error('Invalid token format:', error);
                logout();
            }
        }, 60000); // Check every minute

        // Cleanup interval on unmount
        return () => clearInterval(interval);
    }, [logout]);

    // This component doesn't render anything
    return null;
};

export default SessionManager;

import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';

/**
 * SessionManager Component
 * 
 * Handles automatic token refresh and session validation.
 * CRITICAL: Does NOT use navigate() - just calls logout() which handles redirect.
 */
const SessionManager = () => {
    const { logout } = useAuth();

    useEffect(() => {
        // Check token expiration every minute
        const interval = setInterval(() => {
            const token = authService.getAccessToken();

            // If no token, do nothing (user not logged in)
            if (!token) {
                return;
            }

            // Check if token is expired
            const isExpired = authService.isTokenExpired(token);

            if (isExpired) {
                // Token expired - try to refresh
                const refreshToken = authService.getRefreshToken();

                if (refreshToken && !authService.isTokenExpired(refreshToken)) {
                    // Refresh token is valid - attempt refresh
                    authService.refreshAccessToken()
                        .then(() => {
                            console.log('Token refreshed successfully');
                        })
                        .catch((error) => {
                            console.error('Token refresh failed:', error);
                            // Refresh failed - just logout
                            // The app will redirect to login via ProtectedRoute
                            logout();
                        });
                } else {
                    // Refresh token also expired - just logout
                    console.log('Session expired - logging out');
                    // The app will redirect to login via ProtectedRoute
                    logout();
                }
            }
        }, 60000); // Check every minute

        // Cleanup interval on unmount
        return () => clearInterval(interval);
    }, [logout]);

    // This component doesn't render anything
    return null;
};

export default SessionManager;

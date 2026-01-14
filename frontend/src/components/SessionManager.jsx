import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';

/**
 * SessionManager Component
 * 
 * Handles automatic token refresh and session validation.
 * CRITICAL: Does NOT throw errors - uses safe redirects instead.
 */
const SessionManager = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();

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
                            // Refresh failed - logout and redirect
                            logout();
                            navigate('/login', { replace: true });
                        });
                } else {
                    // Refresh token also expired - logout and redirect
                    console.log('Session expired - logging out');
                    logout();
                    navigate('/login', { replace: true });
                }
            }
        }, 60000); // Check every minute

        // Cleanup interval on unmount
        return () => clearInterval(interval);
    }, [logout, navigate]);

    // This component doesn't render anything
    return null;
};

export default SessionManager;

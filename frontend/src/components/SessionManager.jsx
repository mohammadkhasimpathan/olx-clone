import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';

/**
 * SessionManager Component
 * Monitors JWT token expiration and handles automatic logout
 * Checks token validity every minute
 */
const SessionManager = () => {
    const { user, logout } = useAuth();
    const { showWarning } = useUI();
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) return;

        // Check token expiration every minute
        const interval = setInterval(() => {
            const token = localStorage.getItem('access_token');

            if (!token) {
                // Token is missing, session expired
                showWarning('Your session has expired. Please login again.');
                logout();
                navigate('/login');
                return;
            }

            // Optional: Decode JWT and check expiration time
            try {
                const tokenData = JSON.parse(atob(token.split('.')[1]));
                const expirationTime = tokenData.exp * 1000; // Convert to milliseconds
                const currentTime = Date.now();
                const timeUntilExpiration = expirationTime - currentTime;

                // If token expires in less than 2 minutes, show warning
                if (timeUntilExpiration < 2 * 60 * 1000 && timeUntilExpiration > 0) {
                    showWarning('Your session will expire soon. Please save your work.');
                }

                // If token is expired, logout
                if (timeUntilExpiration <= 0) {
                    showWarning('Your session has expired. Please login again.');
                    logout();
                    navigate('/login');
                }
            } catch (error) {
                console.error('Error checking token expiration:', error);
            }
        }, 60000); // Check every minute

        return () => clearInterval(interval);
    }, [user, logout, navigate, showWarning]);

    return null; // This component doesn't render anything
};

export default SessionManager;

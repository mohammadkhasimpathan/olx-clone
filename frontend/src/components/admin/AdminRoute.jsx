import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * AdminRoute component for protecting admin-only routes.
 * Checks if user is authenticated and has is_staff=True.
 * Redirects non-admin users to home page.
 */
const AdminRoute = ({ children }) => {
    const { user } = useAuth();

    // Check if user is authenticated
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Check if user is staff (admin)
    if (!user.is_staff) {
        // Non-admin users redirected to home
        return <Navigate to="/" replace />;
    }

    return children;
};

export default AdminRoute;

import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * AdminSidebar component for admin navigation.
 * Dark sidebar with navigation links.
 */
const AdminSidebar = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const navItems = [
        { path: '/admin', label: 'Dashboard', icon: '📊' },
        { path: '/admin/listings', label: 'Listings', icon: '📝' },
        { path: '/admin/users', label: 'Users', icon: '👥' },
        { path: '/admin/reports', label: 'Reports', icon: '🚩' },
        { path: '/admin/audit-log', label: 'Audit Log', icon: '📋' },
    ];

    const handleBackToSite = () => {
        navigate('/');
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="w-64 bg-gray-900 text-white flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-gray-800">
                <h1 className="text-2xl font-bold">Admin Panel</h1>
                <p className="text-gray-400 text-sm mt-1">Moderation Dashboard</p>
            </div>

            {/* Navigation */}
            <nav className="flex-1 mt-6">
                {navItems.map(item => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.path === '/admin'}
                        className={({ isActive }) =>
                            `flex items-center px-6 py-3 hover:bg-gray-800 transition-colors ${isActive ? 'bg-gray-800 border-l-4 border-blue-500' : ''
                            }`
                        }
                    >
                        <span className="mr-3 text-xl">{item.icon}</span>
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            {/* Footer Actions */}
            <div className="p-6 border-t border-gray-800">
                <button
                    onClick={handleBackToSite}
                    className="w-full px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded mb-2 text-sm transition-colors"
                >
                    ← Back to Site
                </button>
                <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-sm transition-colors"
                >
                    Logout
                </button>
            </div>
        </div>
    );
};

export default AdminSidebar;

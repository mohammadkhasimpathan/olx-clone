import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';

/**
 * AdminLayout component for admin pages.
 * Provides sidebar navigation and main content area.
 */
const AdminLayout = () => {
    return (
        <div className="flex min-h-screen bg-gray-100">
            {/* Sidebar */}
            <AdminSidebar />

            {/* Main Content */}
            <div className="flex-1 overflow-auto">
                <div className="container mx-auto px-6 py-8">
                    <Outlet />
                </div>
            </div>
        </div>
    );
};

export default AdminLayout;

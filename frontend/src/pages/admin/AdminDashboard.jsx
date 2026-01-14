import { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { useUI } from '../../context/UIContext';
import StatsCard from '../../components/admin/StatsCard';

/**
 * AdminDashboard - Main admin dashboard with statistics.
 */
const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const { showError } = useUI();

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const data = await adminService.getStats();
            setStats(data);
        } catch (error) {
            console.error('Failed to load stats:', error);
            showError('Failed to load dashboard statistics');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div>
                <h1 className="text-3xl font-bold mb-6 text-gray-900">Dashboard</h1>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
                            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (!stats) {
        return <div className="text-center py-8">No data available</div>;
    }

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6 text-gray-900">Dashboard</h1>

            {/* User Stats */}
            <h2 className="text-xl font-semibold mb-4 text-gray-700">Users</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatsCard
                    title="Total Users"
                    value={stats.total_users}
                    icon="👥"
                    color="blue"
                />
                <StatsCard
                    title="Active Users"
                    value={stats.active_users}
                    icon="✅"
                    color="green"
                />
                <StatsCard
                    title="Suspended Users"
                    value={stats.suspended_users}
                    icon="🚫"
                    color="red"
                />
                <StatsCard
                    title="New Today"
                    value={stats.new_users_today}
                    icon="🆕"
                    color="purple"
                />
            </div>

            {/* Listing Stats */}
            <h2 className="text-xl font-semibold mb-4 text-gray-700">Listings</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatsCard
                    title="Total Listings"
                    value={stats.total_listings}
                    icon="📝"
                    color="blue"
                />
                <StatsCard
                    title="Active Listings"
                    value={stats.active_listings}
                    icon="✅"
                    color="green"
                />
                <StatsCard
                    title="Inactive Listings"
                    value={stats.inactive_listings}
                    icon="❌"
                    color="red"
                />
                <StatsCard
                    title="New Today"
                    value={stats.new_listings_today}
                    icon="🆕"
                    color="purple"
                />
            </div>

            {/* Report Stats */}
            <h2 className="text-xl font-semibold mb-4 text-gray-700">Reports</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard
                    title="Pending Reports"
                    value={stats.pending_reports}
                    icon="⏳"
                    color="yellow"
                />
                <StatsCard
                    title="Resolved Reports"
                    value={stats.resolved_reports}
                    icon="✅"
                    color="green"
                />
                <StatsCard
                    title="Sold Listings"
                    value={stats.sold_listings}
                    icon="💰"
                    color="green"
                />
            </div>
        </div>
    );
};

export default AdminDashboard;

import { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { useUI } from '../../context/UIContext';
import ConfirmDialog from '../../components/admin/ConfirmDialog';

/**
 * AdminUsers - User management page.
 * Allows admins to suspend and activate users.
 */
const AdminUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, action: null, user: null });
    const [reason, setReason] = useState('');
    const { showSuccess, showError } = useUI();

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            const data = await adminService.getAllUsers();
            setUsers(Array.isArray(data) ? data : (data.results || []));
        } catch (error) {
            console.error('Failed to load users:', error);
            showError('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const handleSuspend = (user) => {
        setConfirmDialog({
            isOpen: true,
            action: 'suspend',
            user,
        });
        setReason('');
    };

    const handleActivate = (user) => {
        setConfirmDialog({
            isOpen: true,
            action: 'activate',
            user,
        });
    };

    const handleConfirm = async () => {
        const { action, user } = confirmDialog;

        try {
            if (action === 'suspend') {
                await adminService.suspendUser(user.id, reason);
                showSuccess('User suspended successfully');
            } else if (action === 'activate') {
                await adminService.activateUser(user.id);
                showSuccess('User activated successfully');
            }

            setConfirmDialog({ isOpen: false, action: null, user: null });
            setReason('');
            loadUsers();
        } catch (error) {
            console.error(`Failed to ${action} user:`, error);
            showError(`Failed to ${action} user`);
        }
    };

    if (loading) {
        return (
            <div>
                <h1 className="text-3xl font-bold mb-6">User Management</h1>
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="animate-pulse space-y-4">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="h-12 bg-gray-200 rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">User Management</h1>
            <p className="text-gray-600 mb-4">{users.length} users total</p>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Listings</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {Array.isArray(users) && users.map((user) => (
                            <tr key={user.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm">{user.id}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{user.username}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">{user.email}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">{user.listings_count || 0}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    {user.is_suspended ? (
                                        <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">Suspended</span>
                                    ) : user.is_active ? (
                                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">Active</span>
                                    ) : (
                                        <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">Inactive</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                                    {!user.is_suspended ? (
                                        <button
                                            onClick={() => handleSuspend(user)}
                                            className="text-red-600 hover:text-red-800"
                                            disabled={user.is_staff}
                                        >
                                            Suspend
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleActivate(user)}
                                            className="text-green-600 hover:text-green-800"
                                        >
                                            Activate
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                onClose={() => setConfirmDialog({ isOpen: false, action: null, user: null })}
                onConfirm={handleConfirm}
                title={`${confirmDialog.action?.charAt(0).toUpperCase()}${confirmDialog.action?.slice(1)} User`}
                message={`Are you sure you want to ${confirmDialog.action} user "${confirmDialog.user?.username}"?`}
                confirmText={confirmDialog.action?.charAt(0).toUpperCase() + confirmDialog.action?.slice(1)}
                confirmColor={confirmDialog.action === 'suspend' ? 'red' : 'green'}
                showReasonInput={confirmDialog.action === 'suspend'}
                reasonValue={reason}
                onReasonChange={setReason}
            />
        </div>
    );
};

export default AdminUsers;

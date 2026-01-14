import { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { useUI } from '../../context/UIContext';
import ConfirmDialog from '../../components/admin/ConfirmDialog';

/**
 * AdminListings - Listings moderation page.
 * Allows admins to activate, deactivate, and delete listings.
 */
const AdminListings = () => {
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, action: null, listing: null });
    const [reason, setReason] = useState('');
    const { showSuccess, showError } = useUI();

    useEffect(() => {
        loadListings();
    }, []);

    const loadListings = async () => {
        try {
            const data = await adminService.getAllListings();
            setListings(Array.isArray(data) ? data : (data.results || []));
        } catch (error) {
            console.error('Failed to load listings:', error);
            showError('Failed to load listings');
        } finally {
            setLoading(false);
        }
    };

    const handleDeactivate = (listing) => {
        setConfirmDialog({
            isOpen: true,
            action: 'deactivate',
            listing,
        });
        setReason('');
    };

    const handleActivate = (listing) => {
        setConfirmDialog({
            isOpen: true,
            action: 'activate',
            listing,
        });
    };

    const handleDelete = (listing) => {
        setConfirmDialog({
            isOpen: true,
            action: 'delete',
            listing,
        });
        setReason('');
    };

    const handleConfirm = async () => {
        const { action, listing } = confirmDialog;

        try {
            if (action === 'deactivate') {
                await adminService.deactivateListing(listing.id, reason);
                showSuccess('Listing deactivated successfully');
            } else if (action === 'activate') {
                await adminService.activateListing(listing.id);
                showSuccess('Listing activated successfully');
            } else if (action === 'delete') {
                await adminService.deleteListing(listing.id);
                showSuccess('Listing deleted successfully');
            }

            setConfirmDialog({ isOpen: false, action: null, listing: null });
            setReason('');
            loadListings();
        } catch (error) {
            console.error(`Failed to ${action} listing:`, error);
            showError(`Failed to ${action} listing`);
        }
    };

    if (loading) {
        return (
            <div>
                <h1 className="text-3xl font-bold mb-6">Listings Moderation</h1>
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
            <h1 className="text-3xl font-bold mb-6">Listings Moderation</h1>
            <p className="text-gray-600 mb-4">{listings.length} listings total</p>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {listings.map((listing) => (
                            <tr key={listing.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm">{listing.id}</td>
                                <td className="px-6 py-4 text-sm">{listing.title}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">{listing.user?.username}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">${listing.price}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    {!listing.is_active ? (
                                        <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">Inactive</span>
                                    ) : listing.is_sold ? (
                                        <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">Sold</span>
                                    ) : (
                                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">Active</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                                    {listing.is_active ? (
                                        <button
                                            onClick={() => handleDeactivate(listing)}
                                            className="text-yellow-600 hover:text-yellow-800"
                                        >
                                            Deactivate
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleActivate(listing)}
                                            className="text-green-600 hover:text-green-800"
                                        >
                                            Activate
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleDelete(listing)}
                                        className="text-red-600 hover:text-red-800"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                onClose={() => setConfirmDialog({ isOpen: false, action: null, listing: null })}
                onConfirm={handleConfirm}
                title={`${confirmDialog.action?.charAt(0).toUpperCase()}${confirmDialog.action?.slice(1)} Listing`}
                message={`Are you sure you want to ${confirmDialog.action} "${confirmDialog.listing?.title}"?`}
                confirmText={confirmDialog.action?.charAt(0).toUpperCase() + confirmDialog.action?.slice(1)}
                confirmColor={confirmDialog.action === 'delete' ? 'red' : 'blue'}
                showReasonInput={confirmDialog.action === 'deactivate' || confirmDialog.action === 'delete'}
                reasonValue={reason}
                onReasonChange={setReason}
            />
        </div>
    );
};

export default AdminListings;

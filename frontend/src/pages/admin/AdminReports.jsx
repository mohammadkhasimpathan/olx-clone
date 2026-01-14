import { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { useUI } from '../../context/UIContext';

/**
 * AdminReports - Reports review page.
 * Allows admins to view and update report status.
 */
const AdminReports = () => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedReport, setSelectedReport] = useState(null);
    const [adminNotes, setAdminNotes] = useState('');
    const { showSuccess, showError } = useUI();

    useEffect(() => {
        loadReports();
    }, []);

    const loadReports = async () => {
        try {
            const data = await adminService.getAllReports();
            setReports(Array.isArray(data) ? data : (data.results || []));
        } catch (error) {
            console.error('Failed to load reports:', error);
            showError('Failed to load reports');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (reportId, newStatus) => {
        try {
            await adminService.updateReport(reportId, {
                status: newStatus,
                admin_notes: adminNotes
            });
            showSuccess('Report status updated successfully');
            setSelectedReport(null);
            setAdminNotes('');
            loadReports();
        } catch (error) {
            console.error('Failed to update report:', error);
            showError('Failed to update report');
        }
    };

    const getStatusBadge = (status) => {
        const badges = {
            pending: 'bg-yellow-100 text-yellow-800',
            reviewed: 'bg-blue-100 text-blue-800',
            resolved: 'bg-green-100 text-green-800',
            dismissed: 'bg-gray-100 text-gray-800',
        };
        return badges[status] || 'bg-gray-100 text-gray-800';
    };

    if (loading) {
        return (
            <div>
                <h1 className="text-3xl font-bold mb-6">Reports Review</h1>
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
            <h1 className="text-3xl font-bold mb-6">Reports Review</h1>
            <p className="text-gray-600 mb-4">{Array.isArray(reports) ? reports.length : 0} reports total</p>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Listing</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reporter</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {Array.isArray(reports) && reports.map((report) => (
                            <tr key={report.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm">{report.id}</td>
                                <td className="px-6 py-4 text-sm">{report.listing_title}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">{report.reported_by_username}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm capitalize">{report.reason}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <span className={`px-2 py-1 rounded text-xs ${getStatusBadge(report.status)}`}>
                                        {report.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <button
                                        onClick={() => setSelectedReport(report)}
                                        className="text-blue-600 hover:text-blue-800"
                                    >
                                        View Details
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Report Detail Modal */}
            {selectedReport && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                        <h3 className="text-lg font-bold mb-4">Report Details</h3>

                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Listing</label>
                                <p className="text-gray-900">{selectedReport.listing_title}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Reported By</label>
                                <p className="text-gray-900">{selectedReport.reported_by_username}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Reason</label>
                                <p className="text-gray-900 capitalize">{selectedReport.reason}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Description</label>
                                <p className="text-gray-900">{selectedReport.description}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Admin Notes</label>
                                <textarea
                                    value={adminNotes}
                                    onChange={(e) => setAdminNotes(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    rows="3"
                                    placeholder="Enter admin notes..."
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => {
                                    setSelectedReport(null);
                                    setAdminNotes('');
                                }}
                                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleUpdateStatus(selectedReport.id, 'dismissed')}
                                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                            >
                                Dismiss
                            </button>
                            <button
                                onClick={() => handleUpdateStatus(selectedReport.id, 'resolved')}
                                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                            >
                                Resolve
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminReports;

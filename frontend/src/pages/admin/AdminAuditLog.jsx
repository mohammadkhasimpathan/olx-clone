import { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { useUI } from '../../context/UIContext';

/**
 * AdminAuditLog - Audit log page (read-only).
 * Displays all admin actions for accountability.
 */
const AdminAuditLog = () => {
    const [auditLog, setAuditLog] = useState([]);
    const [loading, setLoading] = useState(true);
    const { showError } = useUI();

    useEffect(() => {
        loadAuditLog();
    }, []);

    const loadAuditLog = async () => {
        try {
            const data = await adminService.getAuditLog();
            setAuditLog(Array.isArray(data) ? data : (data.results || []));
        } catch (error) {
            console.error('Failed to load audit log:', error);
            showError('Failed to load audit log');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString();
    };

    if (loading) {
        return (
            <div>
                <h1 className="text-3xl font-bold mb-6">Audit Log</h1>
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
            <h1 className="text-3xl font-bold mb-6">Audit Log</h1>
            <p className="text-gray-600 mb-4">{Array.isArray(auditLog) ? auditLog.length : 0} actions logged (Read-only)</p>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Admin</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Target</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {Array.isArray(auditLog) && auditLog.map((log) => (
                            <tr key={log.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm">{log.id}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{log.admin_username}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">{log.action_display}</td>
                                <td className="px-6 py-4 text-sm">
                                    {log.target_user_username && `User: ${log.target_user_username}`}
                                    {log.target_listing_title && `Listing: ${log.target_listing_title}`}
                                    {!log.target_user_username && !log.target_listing_title && '-'}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600">{log.notes || '-'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                    {formatDate(log.created_at)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminAuditLog;

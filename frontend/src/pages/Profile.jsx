import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { trustService } from '../services/trustService';
import { useUI } from '../context/UIContext';
import TrustBadge from '../components/trust/TrustBadge';

const Profile = () => {
    const { user, updateUser } = useAuth();
    const { showSuccess, showError } = useUI();
    const [editMode, setEditMode] = useState(false);
    const [loading, setLoading] = useState(false);
    const [trustScore, setTrustScore] = useState(null);
    const [formData, setFormData] = useState({
        phone_number: user?.phone_number || '',
        location: user?.location || '',
    });

    useEffect(() => {
        loadTrustScore();
    }, []);

    const loadTrustScore = async () => {
        try {
            const score = await trustService.getMyTrustScore();
            setTrustScore(score);
        } catch (error) {
            console.error('Failed to load trust score:', error);
        }
    };

    if (!user) return <div className="container mx-auto px-4 py-8">Loading...</div>;

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const updatedUser = await authService.updateProfile(formData);
            updateUser(updatedUser);
            setEditMode(false);
            showSuccess('Profile updated successfully');
        } catch (error) {
            showError(error.response?.data?.error || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setFormData({
            phone_number: user.phone_number || '',
            location: user.location || '',
        });
        setEditMode(false);
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-2xl mx-auto card p-8">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-3xl font-bold">My Profile</h1>
                    {!editMode && (
                        <button onClick={() => setEditMode(true)} className="btn-primary">
                            Edit Profile
                        </button>
                    )}
                </div>

                <div className="space-y-4">
                    {/* Username - Read Only */}
                    <div>
                        <label className="block text-gray-600 mb-1 text-sm font-medium">Username</label>
                        <p className="font-semibold text-lg">{user.username}</p>
                    </div>

                    {/* Email - Read Only */}
                    <div>
                        <label className="block text-gray-600 mb-1 text-sm font-medium">Email</label>
                        <p className="font-semibold text-lg">{user.email}</p>
                    </div>

                    {/* Phone Number - Editable */}
                    <div>
                        <label className="block text-gray-600 mb-1 text-sm font-medium">Phone Number</label>
                        {editMode ? (
                            <input
                                type="tel"
                                name="phone_number"
                                value={formData.phone_number}
                                onChange={handleChange}
                                className="input-field"
                                placeholder="Enter phone number"
                            />
                        ) : (
                            <p className="font-semibold text-lg">{user.phone_number || 'Not provided'}</p>
                        )}
                    </div>

                    {/* Location - Editable */}
                    <div>
                        <label className="block text-gray-600 mb-1 text-sm font-medium">Location</label>
                        {editMode ? (
                            <input
                                type="text"
                                name="location"
                                value={formData.location}
                                onChange={handleChange}
                                className="input-field"
                                placeholder="Enter location"
                            />
                        ) : (
                            <p className="font-semibold text-lg">{user.location || 'Not provided'}</p>
                        )}
                    </div>

                    {/* Edit Mode Actions */}
                    {editMode && (
                        <div className="flex gap-3 pt-4">
                            <button
                                onClick={handleSave}
                                disabled={loading}
                                className="btn-primary flex-1"
                            >
                                {loading ? 'Saving...' : 'Save Changes'}
                            </button>
                            <button
                                onClick={handleCancel}
                                disabled={loading}
                                className="btn-secondary flex-1"
                            >
                                Cancel
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Profile;

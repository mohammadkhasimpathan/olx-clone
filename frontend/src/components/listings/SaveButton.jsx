import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { savedListingService } from '../../services/savedListingService';
import { useUI } from '../../context/UIContext';
import { useAuth } from '../../context/AuthContext';

const SaveButton = ({ listing, savedListingId: initialSavedId, initialSaved, onSaveChange }) => {
    // Use initialSaved if provided, otherwise check initialSavedId
    const [isSaved, setIsSaved] = useState(initialSaved !== undefined ? initialSaved : !!initialSavedId);
    const [savedListingId, setSavedListingId] = useState(initialSavedId);
    const [loading, setLoading] = useState(false);
    const { showSuccess, showError } = useUI();
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Update state when initialSaved changes (for wishlist sync)
    useEffect(() => {
        if (initialSaved !== undefined) {
            setIsSaved(initialSaved);
        }
    }, [initialSaved]);

    const handleToggleSave = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        // CRITICAL: Check authentication BEFORE any API call
        if (!user) {
            showError('Please login to save listings');
            // Redirect to login with return path
            navigate('/login', {
                state: { from: location.pathname }
            });
            return; // STOP HERE - do not proceed to API call
        }

        setLoading(true);

        try {
            if (isSaved) {
                // Unsave - DELETE request
                await savedListingService.unsaveListing(savedListingId);
                setIsSaved(false);
                setSavedListingId(null);
                showSuccess('Removed from wishlist');
                if (onSaveChange) onSaveChange(false, savedListingId);
            } else {
                // Save - POST request
                const response = await savedListingService.saveListing(listing.id);
                setIsSaved(true);
                setSavedListingId(response.id);
                showSuccess('Added to wishlist');
                if (onSaveChange) onSaveChange(true, response.id);
            }
        } catch (error) {
            console.error('Wishlist error:', error);

            // Handle specific error cases
            if (error.response?.status === 401) {
                showError('Please login to save listings');
                navigate('/login', {
                    state: { from: location.pathname }
                });
            } else if (error.response?.data?.listing_id) {
                showError(error.response.data.listing_id[0]);
            } else if (error.response?.data?.detail) {
                showError(error.response.data.detail);
            } else {
                showError('Failed to update wishlist');
            }

            // Revert state on error
            setIsSaved(!isSaved);
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleToggleSave}
            disabled={loading}
            className={`group relative p-2.5 rounded-full transition-all duration-200 ${isSaved
                ? 'text-red-500 bg-white hover:bg-red-50 shadow-sm'
                : 'text-gray-400 bg-white hover:text-red-500 hover:bg-gray-50 shadow-sm'
                } ${loading ? 'opacity-60 cursor-wait' : 'hover:shadow-md active:scale-95'}`}
            title={isSaved ? 'Remove from wishlist' : 'Add to wishlist'}
            aria-label={isSaved ? 'Remove from wishlist' : 'Add to wishlist'}
        >
            {loading ? (
                // Loading spinner
                <svg className="w-6 h-6 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
            ) : isSaved ? (
                // Filled heart with animation
                <svg className="w-6 h-6 fill-current transform group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
            ) : (
                // Outline heart with animation
                <svg className="w-6 h-6 transform group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
            )}
        </button>
    );
};

export default SaveButton;

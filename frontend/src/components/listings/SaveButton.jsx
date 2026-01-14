import { useState } from 'react';
import { savedListingService } from '../../services/savedListingService';
import { useUI } from '../../context/UIContext';
import { useAuth } from '../../context/AuthContext';

const SaveButton = ({ listing, savedListingId: initialSavedId, onSaveChange }) => {
    const [isSaved, setIsSaved] = useState(!!initialSavedId);
    const [savedListingId, setSavedListingId] = useState(initialSavedId);
    const [loading, setLoading] = useState(false);
    const { showSuccess, showError } = useUI();
    const { user } = useAuth();

    const handleToggleSave = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!user) {
            showError('Please login to save listings');
            return;
        }

        setLoading(true);

        try {
            if (isSaved) {
                // Unsave
                await savedListingService.unsaveListing(savedListingId);
                setIsSaved(false);
                setSavedListingId(null);
                showSuccess('Removed from saved listings');
                if (onSaveChange) onSaveChange(false);
            } else {
                // Save
                const response = await savedListingService.saveListing(listing.id);
                setIsSaved(true);
                setSavedListingId(response.id);
                showSuccess('Added to saved listings');
                if (onSaveChange) onSaveChange(true);
            }
        } catch (error) {
            const errorMessage = error.response?.data?.listing_id?.[0] ||
                error.response?.data?.detail ||
                'Failed to update saved status';
            showError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleToggleSave}
            disabled={loading}
            className={`p-2 rounded-full transition-all ${isSaved
                    ? 'text-red-500 hover:bg-red-50'
                    : 'text-gray-400 hover:text-red-500 hover:bg-gray-100'
                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={isSaved ? 'Remove from saved' : 'Save listing'}
            aria-label={isSaved ? 'Remove from saved' : 'Save listing'}
        >
            {isSaved ? (
                // Filled heart
                <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
            ) : (
                // Outline heart
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
            )}
        </button>
    );
};

export default SaveButton;

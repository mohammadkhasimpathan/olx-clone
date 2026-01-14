import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { savedListingService } from '../services/savedListingService';
import { useUI } from '../context/UIContext';
import SaveButton from '../components/listings/SaveButton';
import EmptyState from '../components/common/EmptyState';

const SavedListings = () => {
    const [savedListings, setSavedListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const { showError } = useUI();

    useEffect(() => {
        loadSavedListings();
    }, []);

    const loadSavedListings = async () => {
        try {
            const data = await savedListingService.getSavedListings();
            setSavedListings(Array.isArray(data) ? data : (data.results || []));
        } catch (error) {
            console.error('Failed to load saved listings:', error);
            showError('Failed to load saved listings');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveChange = (savedListingId) => {
        // Remove from list when unsaved
        setSavedListings(prev => prev.filter(item => item.id !== savedListingId));
    };

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold mb-6">Saved Listings</h1>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {[...Array(8)].map((_, index) => (
                        <div key={index} className="card p-4 animate-pulse">
                            <div className="aspect-video bg-gray-200 rounded-lg mb-4"></div>
                            <div className="h-6 bg-gray-200 rounded mb-2"></div>
                            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (savedListings.length === 0) {
        return (
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold mb-6">Saved Listings</h1>
                <EmptyState
                    icon={
                        <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                    }
                    title="No Saved Listings"
                    message="You haven't saved any listings yet. Browse listings and click the heart icon to save them here."
                    actionLabel="Browse Listings"
                    actionLink="/"
                />
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Saved Listings</h1>
                <p className="text-gray-600">{savedListings.length} saved</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Array.isArray(savedListings) && savedListings.map((savedItem) => {
                    const listing = savedItem.listing;
                    return (
                        <div key={savedItem.id} className="card overflow-hidden hover:shadow-lg transition-shadow group">
                            <Link to={`/listings/${listing.id}`} className="block">
                                {/* Image */}
                                <div className="aspect-video bg-gray-200 relative overflow-hidden">
                                    {listing.first_image ? (
                                        <img
                                            src={listing.first_image}
                                            alt={listing.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                    )}

                                    {/* Save Button Overlay */}
                                    <div className="absolute top-2 right-2 bg-white rounded-full shadow-md">
                                        <SaveButton
                                            listing={listing}
                                            savedListingId={savedItem.id}
                                            onSaveChange={() => handleSaveChange(savedItem.id)}
                                        />
                                    </div>

                                    {/* Sold Badge */}
                                    {listing.is_sold && (
                                        <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-sm font-semibold">
                                            SOLD
                                        </div>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="p-4">
                                    <h3 className="font-semibold text-lg mb-1 line-clamp-1 group-hover:text-primary-600 transition-colors">
                                        {listing.title}
                                    </h3>
                                    <p className="text-2xl font-bold text-primary-600 mb-2">
                                        ${listing.price}
                                    </p>
                                    <div className="flex items-center text-sm text-gray-600">
                                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        <span className="line-clamp-1">{listing.location}</span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2">
                                        Saved {new Date(savedItem.saved_at).toLocaleDateString()}
                                    </p>
                                </div>
                            </Link>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default SavedListings;

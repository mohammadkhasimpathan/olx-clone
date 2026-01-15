import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { listingService } from '../services/listingService';
import { useUI } from '../context/UIContext';
import EmptyState from '../components/common/EmptyState';
import { formatCurrency } from '../utils/formatCurrency';

const MyListings = () => {
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { showError } = useUI();

    useEffect(() => {
        loadListings();
    }, []);

    const loadListings = async () => {
        try {
            const data = await listingService.getMyListings();
            setListings(data.results || data);
        } catch (error) {
            console.error('Failed to load listings:', error);
            showError('Failed to load your listings. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-48 mb-6"></div>
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="card p-4">
                                <div className="h-48 bg-gray-200 rounded-lg mb-3"></div>
                                <div className="h-6 bg-gray-200 rounded mb-2"></div>
                                <div className="h-8 bg-gray-200 rounded w-24 mb-2"></div>
                                <div className="h-4 bg-gray-200 rounded w-32"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">My Listings</h1>
                <Link to="/listings/create" className="btn-primary">
                    + Create Listing
                </Link>
            </div>

            {!Array.isArray(listings) || listings.length === 0 ? (
                <EmptyState
                    icon={
                        <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                    }
                    title="No listings yet"
                    description="You haven't posted any listings. Start selling your items today!"
                    actionLabel="Create Your First Listing"
                    onAction={() => navigate('/listings/create')}
                />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {Array.isArray(listings) && listings.map((listing) => (
                        <div key={listing.id} className="card overflow-hidden hover:shadow-lg transition-shadow">
                            <Link to={`/listings/${listing.id}`}>
                                {listing.first_image ? (
                                    <img
                                        src={listing.first_image}
                                        alt={listing.title}
                                        className="w-full h-48 object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                                        <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                )}
                            </Link>
                            <div className="p-4">
                                <h3 className="font-semibold text-lg mb-2 line-clamp-1">{listing.title}</h3>
                                <p className="text-2xl font-bold text-primary-600 mb-2">{formatCurrency(listing.price)}</p>
                                <p className="text-gray-600 text-sm mb-3">{listing.location}</p>

                                {listing.is_sold && (
                                    <span className="inline-block bg-gray-200 text-gray-700 px-2 py-1 rounded text-sm mb-3">
                                        Sold
                                    </span>
                                )}

                                <div className="flex gap-2">
                                    <Link
                                        to={`/listings/${listing.id}/edit`}
                                        className="btn-secondary flex-1 text-center"
                                    >
                                        Edit
                                    </Link>
                                    <button
                                        onClick={() => handleDelete(listing.id)}
                                        className="btn-secondary flex-1 bg-red-500 hover:bg-red-600 text-white"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MyListings;

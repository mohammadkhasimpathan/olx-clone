import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { listingService } from '../services/listingService';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import ImageGallery from '../components/listings/ImageGallery';

const ListingDetail = () => {
    const { id } = useParams();
    const [listing, setListing] = useState(null);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const { showSuccess, showError } = useUI();
    const navigate = useNavigate();

    useEffect(() => {
        loadListing();
    }, [id]);

    const loadListing = async () => {
        try {
            const data = await listingService.getListing(id);
            setListing(data);
        } catch (error) {
            console.error('Failed to load listing:', error);
            showError('Failed to load listing');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this listing?')) {
            try {
                await listingService.deleteListing(id);
                showSuccess('Listing deleted successfully');
                navigate('/my-listings');
            } catch (error) {
                showError('Failed to delete listing');
            }
        }
    };

    const handleMarkSold = async () => {
        try {
            await listingService.markAsSold(id);
            showSuccess('Listing marked as sold');
            loadListing();
        } catch (error) {
            showError('Failed to mark as sold');
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-4xl mx-auto animate-pulse">
                    <div className="h-96 bg-gray-200 rounded-lg mb-6"></div>
                    <div className="h-10 bg-gray-200 rounded w-3/4 mb-4"></div>
                    <div className="h-12 bg-gray-200 rounded w-1/4 mb-6"></div>
                    <div className="card p-6 mb-6">
                        <div className="h-6 bg-gray-200 rounded w-1/4 mb-3"></div>
                        <div className="h-20 bg-gray-200 rounded"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (!listing) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="text-center py-12">
                    <h2 className="text-2xl font-bold text-gray-700 mb-2">Listing not found</h2>
                    <p className="text-gray-600 mb-4">The listing you're looking for doesn't exist or has been removed.</p>
                    <Link to="/" className="btn-primary">
                        Back to Home
                    </Link>
                </div>
            </div>
        );
    }

    const isOwner = user?.id === listing.user?.id;
    const imageUrls = listing.images?.map(img => img.image) || [];

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto">
                {/* Image Gallery */}
                <div className="mb-6">
                    <ImageGallery images={imageUrls} alt={listing.title} />
                </div>

                {/* Title and Price */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold mb-2">{listing.title}</h1>
                    <p className="text-4xl font-bold text-primary-600">${listing.price}</p>
                    {listing.is_sold && (
                        <span className="inline-block bg-red-500 text-white px-3 py-1 rounded mt-2">
                            SOLD
                        </span>
                    )}
                </div>

                {/* Description */}
                <div className="card p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-3">Description</h2>
                    <p className="text-gray-700 whitespace-pre-wrap">{listing.description}</p>
                </div>

                {/* Details */}
                <div className="card p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-3">Details</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-gray-600">Category</p>
                            <p className="font-semibold">{listing.category_detail?.name}</p>
                        </div>
                        <div>
                            <p className="text-gray-600">Location</p>
                            <p className="font-semibold">{listing.location}</p>
                        </div>
                        <div>
                            <p className="text-gray-600">Posted</p>
                            <p className="font-semibold">
                                {new Date(listing.created_at).toLocaleDateString()}
                            </p>
                        </div>
                        <div>
                            <p className="text-gray-600">Condition</p>
                            <p className="font-semibold">{listing.is_sold ? 'Sold' : 'Available'}</p>
                        </div>
                    </div>
                </div>

                {/* Seller Info */}
                <div className="card p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-3">Seller Information</h2>
                    <p><strong>Name:</strong> {listing.user?.username}</p>
                    {listing.user?.phone_number && (
                        <p><strong>Phone:</strong> {listing.user.phone_number}</p>
                    )}
                    {listing.user?.location && (
                        <p><strong>Location:</strong> {listing.user.location}</p>
                    )}
                </div>

                {/* Owner Actions */}
                {isOwner && (
                    <div className="flex gap-4">
                        <Link to={`/listings/${id}/edit`} className="btn-primary">
                            Edit Listing
                        </Link>
                        {!listing.is_sold && (
                            <button onClick={handleMarkSold} className="btn-secondary">
                                Mark as Sold
                            </button>
                        )}
                        <button
                            onClick={handleDelete}
                            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                        >
                            Delete Listing
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ListingDetail;

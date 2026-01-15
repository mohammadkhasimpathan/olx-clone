import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { listingService } from '../services/listingService';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import ImageGallery from '../components/listings/ImageGallery';
import SaveButton from '../components/listings/SaveButton';
import { formatCurrency } from '../utils/formatCurrency';

const ListingDetail = () => {
    const { id } = useParams();
    const [listing, setListing] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showContact, setShowContact] = useState(false);
    const { user } = useAuth();
    const { showSuccess, showError } = useUI();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        loadListing();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    // Auto-reveal contact if user just logged in and was redirected here
    useEffect(() => {
        if (user && location.state?.revealContact) {
            setShowContact(true);
            // Clear the state
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [user, location, navigate]);

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

    const handleGetContact = () => {
        if (!user) {
            // Redirect to login with return path
            navigate('/login', {
                state: {
                    from: location.pathname,
                    revealContact: true,
                },
            });
        } else {
            setShowContact(true);
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
        <div className="bg-gray-50 min-h-screen py-8">
            <div className="container mx-auto px-4">
                <div className="max-w-5xl mx-auto">
                    {/* Breadcrumb */}
                    <nav className="mb-4 text-sm text-gray-600">
                        <Link to="/" className="hover:text-primary-600">Home</Link>
                        <span className="mx-2">/</span>
                        <Link to={`/?category=${listing.category_detail?.id}`} className="hover:text-primary-600">
                            {listing.category_detail?.name}
                        </Link>
                        <span className="mx-2">/</span>
                        <span className="text-gray-900">{listing.title}</span>
                    </nav>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left Column - Images & Description */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Image Gallery */}
                            <div className="card overflow-hidden">
                                <ImageGallery images={imageUrls} alt={listing.title} />
                            </div>

                            {/* Description */}
                            <div className="card p-6">
                                <h2 className="text-xl font-semibold mb-4">Description</h2>
                                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                                    {listing.description}
                                </p>
                            </div>

                            {/* Details */}
                            <div className="card p-6">
                                <h2 className="text-xl font-semibold mb-4">Details</h2>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-gray-600 text-sm">Category</p>
                                        <p className="font-semibold">{listing.category_detail?.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600 text-sm">Location</p>
                                        <p className="font-semibold">{listing.location}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600 text-sm">Posted</p>
                                        <p className="font-semibold">
                                            {new Date(listing.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600 text-sm">Condition</p>
                                        <p className="font-semibold">{listing.is_sold ? 'Sold' : 'Available'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Price & Seller Info */}
                        <div className="lg:col-span-1 space-y-6">
                            {/* Price Card */}
                            <div className="card p-6 sticky top-20">
                                <div className="mb-4">
                                    <div className="flex items-start justify-between gap-4 mb-2">
                                        <h1 className="text-2xl font-bold line-clamp-2 flex-1">
                                            {listing.title}
                                        </h1>
                                        {!isOwner && (
                                            <SaveButton listing={listing} />
                                        )}
                                    </div>
                                    <p className="text-4xl font-bold text-primary-600">
                                        {formatCurrency(listing.price)}
                                    </p>
                                    {listing.is_sold && (
                                        <span className="inline-block bg-red-500 text-white px-3 py-1 rounded mt-3">
                                            SOLD
                                        </span>
                                    )}
                                </div>

                                {/* Seller Information */}
                                <div className="border-t pt-4">
                                    <h3 className="font-semibold text-lg mb-3">Seller Information</h3>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                            <span className="font-medium">{listing.user?.username}</span>
                                        </div>

                                        {listing.user?.location && (
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                                <span>{listing.user?.location}</span>
                                            </div>
                                        )}

                                        {/* Contact Button/Info */}
                                        {!isOwner && (
                                            <div className="mt-4">
                                                {!showContact ? (
                                                    <button
                                                        onClick={handleGetContact}
                                                        className="btn-primary w-full flex items-center justify-center gap-2"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                        </svg>
                                                        Get Contact Number
                                                    </button>
                                                ) : (
                                                    <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                                                        <p className="text-sm text-green-700 font-medium mb-2">
                                                            Contact Seller
                                                        </p>
                                                        {listing.user?.phone_number ? (
                                                            <a
                                                                href={`tel:${listing.user.phone_number}`}
                                                                className="text-lg font-bold text-green-700 hover:text-green-800 flex items-center gap-2"
                                                            >
                                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                                </svg>
                                                                {listing.user.phone_number}
                                                            </a>
                                                        ) : (
                                                            <p className="text-sm text-gray-600">
                                                                Contact number not provided
                                                            </p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Owner Actions */}
                                {isOwner && (
                                    <div className="border-t pt-4 mt-4 space-y-2">
                                        <Link to={`/listings/${id}/edit`} className="btn-primary w-full block text-center">
                                            Edit Listing
                                        </Link>
                                        {!listing.is_sold && (
                                            <button onClick={handleMarkSold} className="btn-secondary w-full">
                                                Mark as Sold
                                            </button>
                                        )}
                                        <button
                                            onClick={handleDelete}
                                            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                                        >
                                            Delete Listing
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ListingDetail;

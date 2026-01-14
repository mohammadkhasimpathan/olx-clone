import { useState, useEffect } from 'react';
import { listingService } from '../services/listingService';
import { categoryService } from '../services/categoryService';
import { Link } from 'react-router-dom';
import { useUI } from '../context/UIContext';
import EmptyState from '../components/common/EmptyState';

const Home = () => {
    const [listings, setListings] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        search: '',
        category: '',
        is_sold: 'false',
    });

    const { showError } = useUI();

    useEffect(() => {
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [listingsData, categoriesData] = await Promise.all([
                listingService.getListings(filters),
                categoryService.getCategories(),
            ]);

            setListings(
                Array.isArray(listingsData)
                    ? listingsData
                    : listingsData?.results || []
            );

            setCategories(
                Array.isArray(categoriesData)
                    ? categoriesData
                    : categoriesData?.results || []
            );
        } catch (error) {
            console.error('Failed to load data:', error);
            showError('Failed to load listings. Please try again.');
            setListings([]);
            setCategories([]);
        } finally {
            setLoading(false);
        }
    };

    const hasActiveFilters = Boolean(filters.search || filters.category);

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Hero */}
            <div className="text-center mb-8">
                <h1 className="text-4xl font-bold mb-2">Find Great Deals</h1>
                <p className="text-gray-600">
                    Browse thousands of listings in your area
                </p>
            </div>

            {/* Filters */}
            <div className="mb-8 card p-6 space-y-4">
                <input
                    type="text"
                    placeholder="Search listings..."
                    className="input-field"
                    value={filters.search}
                    onChange={(e) =>
                        setFilters({ ...filters, search: e.target.value })
                    }
                />

                <select
                    className="input-field"
                    value={filters.category}
                    onChange={(e) =>
                        setFilters({ ...filters, category: e.target.value })
                    }
                >
                    <option value="">All Categories</option>
                    {Array.isArray(categories) &&
                        categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                                {cat.name}
                            </option>
                        ))}
                </select>

                {hasActiveFilters && (
                    <button
                        className="btn-secondary"
                        onClick={() =>
                            setFilters({
                                search: '',
                                category: '',
                                is_sold: 'false',
                            })
                        }
                    >
                        Clear Filters
                    </button>
                )}
            </div>

            {/* CONTENT */}
            {loading ? (
                /* Loading Skeleton */
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                        <div
                            key={i}
                            className="card p-4 animate-pulse"
                        >
                            <div className="h-48 bg-gray-200 rounded-lg mb-3"></div>
                            <div className="h-6 bg-gray-200 rounded mb-2"></div>
                            <div className="h-8 bg-gray-200 rounded w-24 mb-2"></div>
                            <div className="h-4 bg-gray-200 rounded w-32"></div>
                        </div>
                    ))}
                </div>
            ) : listings.length === 0 ? (
                /* Empty State */
                <EmptyState
                    icon={
                        <svg
                            className="w-16 h-16 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                        </svg>
                    }
                    title={
                        hasActiveFilters
                            ? 'No listings found'
                            : 'No listings yet'
                    }
                    description={
                        hasActiveFilters
                            ? 'Try adjusting or clearing filters.'
                            : 'Be the first to create a listing.'
                    }
                />
            ) : (
                /* Listings */
                <>
                    <div className="mb-4 text-gray-600">
                        {listings.length} listing
                        {listings.length !== 1 ? 's' : ''} found
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {listings.map((listing) => (
                            <Link
                                key={listing.id}
                                to={`/listings/${listing.id}`}
                                className="card p-4 hover:shadow-lg transition-shadow"
                            >
                                {listing.first_image ? (
                                    <img
                                        src={listing.first_image}
                                        alt={listing.title}
                                        className="w-full h-48 object-cover rounded-lg mb-3"
                                    />
                                ) : (
                                    <div className="w-full h-48 bg-gray-200 rounded-lg mb-3 flex items-center justify-center">
                                        <svg
                                            className="w-12 h-12 text-gray-400"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                            />
                                        </svg>
                                    </div>
                                )}

                                <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                                    {listing.title}
                                </h3>

                                <p className="text-primary-600 font-bold text-xl mb-2">
                                    ${listing.price}
                                </p>

                                <p className="text-gray-600 text-sm">
                                    {listing.location}
                                </p>

                                {listing.is_sold && (
                                    <span className="inline-block bg-red-500 text-white px-2 py-1 rounded text-xs mt-2">
                                        SOLD
                                    </span>
                                )}
                            </Link>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default Home;

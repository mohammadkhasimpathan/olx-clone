import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { listingService } from '../services/listingService';
import { categoryService } from '../services/categoryService';
import { useUI } from '../context/UIContext';
import EmptyState from '../components/common/EmptyState';
import ListingCard from '../components/listings/ListingCard';
import FilterSidebar from '../components/listings/FilterSidebar';

const Home = () => {
    const [listings, setListings] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showMobileFilters, setShowMobileFilters] = useState(false);
    const [searchParams, setSearchParams] = useSearchParams();

    const [filters, setFilters] = useState({
        search: searchParams.get('search') || '',
        category: searchParams.get('category') || '',
        location: searchParams.get('location') || '',
        min_price: searchParams.get('min_price') || '',
        max_price: searchParams.get('max_price') || '',
        ordering: searchParams.get('ordering') || '-created_at',
        is_sold: searchParams.get('is_sold') || 'false',
    });

    const { showError } = useUI();

    // Default filter values
    const defaultFilters = {
        search: '',
        category: '',
        location: '',
        min_price: '',
        max_price: '',
        ordering: '-created_at',
        is_sold: 'false',
    };

    // Update URL when filters change (only if different from defaults)
    useEffect(() => {
        const params = {};
        Object.keys(filters).forEach(key => {
            // Only add to URL if value differs from default
            if (filters[key] && filters[key] !== defaultFilters[key]) {
                params[key] = filters[key];
            }
        });

        // Only update URL if there are actual params to set
        if (Object.keys(params).length > 0) {
            setSearchParams(params);
        } else {
            // Clear URL params if all filters are at default
            setSearchParams({});
        }
    }, [filters, setSearchParams]);

    // Load data when filters change
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

    const hasActiveFilters = Boolean(
        filters.search ||
        filters.category ||
        filters.location ||
        filters.min_price ||
        filters.max_price ||
        filters.ordering !== '-created_at'
    );

    return (
        <div className="bg-gray-50 min-h-screen">
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white py-12">
                <div className="container mx-auto px-4 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold mb-3">
                        Find Great Deals Near You
                    </h1>
                    <p className="text-lg md:text-xl text-primary-100">
                        Browse thousands of listings in your area
                    </p>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                <div className="flex gap-6">
                    {/* Desktop Sidebar */}
                    <aside className="hidden lg:block w-64 flex-shrink-0">
                        <div className="sticky top-20">
                            <FilterSidebar
                                filters={filters}
                                setFilters={setFilters}
                                categories={categories}
                            />
                        </div>
                    </aside>

                    {/* Main Content */}
                    <div className="flex-1">
                        {/* Mobile Filter Button */}
                        <div className="lg:hidden mb-4">
                            <button
                                onClick={() => setShowMobileFilters(true)}
                                className="btn-primary w-full flex items-center justify-center gap-2"
                            >
                                <svg
                                    className="w-5 h-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                                    />
                                </svg>
                                Filters
                            </button>
                        </div>

                        {/* Results Count */}
                        {!loading && (
                            <div className="mb-4 flex items-center justify-between">
                                <p className="text-gray-600">
                                    <span className="font-semibold text-gray-900">
                                        {listings.length}
                                    </span>{' '}
                                    listing{listings.length !== 1 ? 's' : ''} found
                                </p>
                            </div>
                        )}

                        {/* Loading State */}
                        {loading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {[1, 2, 3, 4, 5, 6].map((i) => (
                                    <div
                                        key={i}
                                        className="card animate-pulse overflow-hidden"
                                    >
                                        <div className="h-48 bg-gray-200"></div>
                                        <div className="p-4 space-y-3">
                                            <div className="h-6 bg-gray-200 rounded"></div>
                                            <div className="h-8 bg-gray-200 rounded w-24"></div>
                                            <div className="h-4 bg-gray-200 rounded w-32"></div>
                                        </div>
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
                                        ? 'Try adjusting or clearing your filters.'
                                        : 'Be the first to create a listing.'
                                }
                            />
                        ) : (
                            /* Listings Grid */
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {listings.map((listing) => (
                                    <ListingCard key={listing.id} listing={listing} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile Filter Modal */}
            {showMobileFilters && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 lg:hidden">
                    <div className="fixed inset-y-0 right-0 w-full max-w-sm bg-white shadow-xl overflow-y-auto">
                        <div className="p-4 border-b flex items-center justify-between">
                            <h2 className="text-xl font-bold">Filters</h2>
                            <button
                                onClick={() => setShowMobileFilters(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <svg
                                    className="w-6 h-6"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>
                        <div className="p-4">
                            <FilterSidebar
                                filters={filters}
                                setFilters={setFilters}
                                categories={categories}
                            />
                            <button
                                onClick={() => setShowMobileFilters(false)}
                                className="btn-primary w-full mt-4"
                            >
                                Apply Filters
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Home;

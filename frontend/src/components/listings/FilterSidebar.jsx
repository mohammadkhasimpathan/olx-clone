import PropTypes from 'prop-types';

const FilterSidebar = ({ filters, setFilters, categories }) => {
    const handleFilterChange = (key, value) => {
        setFilters({ ...filters, [key]: value });
    };

    const clearFilters = () => {
        setFilters({
            search: '',
            category: '',
            location: '',
            min_price: '',
            max_price: '',
            ordering: '-created_at',
            is_sold: 'false',
        });
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
        <div className="card p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Filters</h2>
                {hasActiveFilters && (
                    <button
                        onClick={clearFilters}
                        className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                    >
                        Clear All
                    </button>
                )}
            </div>

            {/* Search */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search
                </label>
                <input
                    type="text"
                    placeholder="Search listings..."
                    className="input-field"
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                />
            </div>

            {/* Category */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                </label>
                <select
                    className="input-field"
                    value={filters.category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                >
                    <option value="">All Categories</option>
                    {Array.isArray(categories) &&
                        categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                                {cat.name}
                            </option>
                        ))}
                </select>
            </div>

            {/* Location */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                </label>
                <input
                    type="text"
                    placeholder="Enter location..."
                    className="input-field"
                    value={filters.location}
                    onChange={(e) => handleFilterChange('location', e.target.value)}
                />
            </div>

            {/* Price Range */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price Range
                </label>
                <div className="grid grid-cols-2 gap-2">
                    <input
                        type="number"
                        placeholder="Min"
                        className="input-field"
                        value={filters.min_price}
                        onChange={(e) => handleFilterChange('min_price', e.target.value)}
                        min="0"
                    />
                    <input
                        type="number"
                        placeholder="Max"
                        className="input-field"
                        value={filters.max_price}
                        onChange={(e) => handleFilterChange('max_price', e.target.value)}
                        min="0"
                    />
                </div>
            </div>

            {/* Sort By */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sort By
                </label>
                <select
                    className="input-field"
                    value={filters.ordering}
                    onChange={(e) => handleFilterChange('ordering', e.target.value)}
                >
                    <option value="-created_at">Recently Added</option>
                    <option value="created_at">Oldest First</option>
                    <option value="price">Price: Low to High</option>
                    <option value="-price">Price: High to Low</option>
                </select>
            </div>

            {/* Show Sold Items */}
            <div className="flex items-center">
                <input
                    type="checkbox"
                    id="show-sold"
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    checked={filters.is_sold === ''}
                    onChange={(e) => handleFilterChange('is_sold', e.target.checked ? '' : 'false')}
                />
                <label htmlFor="show-sold" className="ml-2 text-sm text-gray-700">
                    Show sold items
                </label>
            </div>
        </div>
    );
};

FilterSidebar.propTypes = {
    filters: PropTypes.shape({
        search: PropTypes.string,
        category: PropTypes.string,
        location: PropTypes.string,
        min_price: PropTypes.string,
        max_price: PropTypes.string,
        ordering: PropTypes.string,
        is_sold: PropTypes.string,
    }).isRequired,
    setFilters: PropTypes.func.isRequired,
    categories: PropTypes.array.isRequired,
};

export default FilterSidebar;

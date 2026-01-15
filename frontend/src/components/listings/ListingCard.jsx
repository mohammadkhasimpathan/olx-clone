import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';

const ListingCard = ({ listing }) => {
    return (
        <Link
            to={`/listings/${listing.id}`}
            className="card group hover:shadow-xl transition-all duration-300 overflow-hidden block"
        >
            {/* Image Container with Fixed Aspect Ratio */}
            <div className="relative h-48 bg-white overflow-hidden border-b border-gray-200">
                {listing.first_image ? (
                    <img
                        src={listing.first_image}
                        alt={listing.title}
                        className="absolute inset-0 w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
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

                {/* Sold Overlay */}
                {listing.is_sold && (
                    <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                        <span className="bg-red-500 text-white px-4 py-2 rounded-lg font-bold text-lg">
                            SOLD
                        </span>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-4">
                <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors min-h-[3.5rem]">
                    {listing.title}
                </h3>

                <p className="text-2xl font-bold text-primary-600 mb-2">
                    ${parseFloat(listing.price).toLocaleString()}
                </p>

                <div className="flex items-center text-gray-600 text-sm">
                    <svg
                        className="w-4 h-4 mr-1 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                    </svg>
                    <span className="truncate">{listing.location}</span>
                </div>

                {/* Posted Date */}
                <div className="text-xs text-gray-500 mt-2">
                    {new Date(listing.created_at).toLocaleDateString()}
                </div>
            </div>
        </Link>
    );
};

ListingCard.propTypes = {
    listing: PropTypes.shape({
        id: PropTypes.number.isRequired,
        title: PropTypes.string.isRequired,
        price: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        location: PropTypes.string.isRequired,
        first_image: PropTypes.string,
        is_sold: PropTypes.bool,
        created_at: PropTypes.string,
    }).isRequired,
};

export default ListingCard;

import { useState, useEffect } from 'react';

const ImageGallery = ({ images = [], alt = 'Listing image' }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const handleKeyPress = (e) => {
            if (e.key === 'ArrowLeft') {
                goToPrevious();
            } else if (e.key === 'ArrowRight') {
                goToNext();
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [currentIndex, images.length]);

    const goToNext = () => {
        setCurrentIndex((prevIndex) =>
            prevIndex === images.length - 1 ? 0 : prevIndex + 1
        );
    };

    const goToPrevious = () => {
        setCurrentIndex((prevIndex) =>
            prevIndex === 0 ? images.length - 1 : prevIndex - 1
        );
    };

    const goToImage = (index) => {
        setCurrentIndex(index);
    };

    if (!images || images.length === 0) {
        return (
            <div className="w-full aspect-video bg-gray-200 rounded-lg flex items-center justify-center">
                <div className="text-center text-gray-400">
                    <svg className="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p>No images available</p>
                </div>
            </div>
        );
    }

    // Handle single image
    if (images.length === 1) {
        return (
            <div className="w-full">
                <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                    <img
                        src={images[0]}
                        alt={alt}
                        className="w-full h-full object-contain"
                    />
                </div>
            </div>
        );
    }

    // Multiple images with gallery
    return (
        <div className="w-full space-y-4">
            {/* Main Image */}
            <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden group">
                <img
                    src={images[currentIndex]}
                    alt={`${alt} ${currentIndex + 1}`}
                    className="w-full h-full object-contain"
                />

                {/* Navigation Buttons */}
                <button
                    onClick={goToPrevious}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-opacity-75"
                    aria-label="Previous image"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>

                <button
                    onClick={goToNext}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-opacity-75"
                    aria-label="Next image"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </button>

                {/* Image Counter */}
                <div className="absolute bottom-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                    {currentIndex + 1} / {images.length}
                </div>
            </div>

            {/* Thumbnail Strip */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                {images.map((image, index) => (
                    <button
                        key={index}
                        onClick={() => goToImage(index)}
                        className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${index === currentIndex
                                ? 'border-primary-600 ring-2 ring-primary-200'
                                : 'border-gray-300 hover:border-primary-400'
                            }`}
                    >
                        <img
                            src={image}
                            alt={`Thumbnail ${index + 1}`}
                            className="w-full h-full object-cover"
                        />
                    </button>
                ))}
            </div>

            {/* Keyboard Hint */}
            <p className="text-xs text-gray-500 text-center">
                Use arrow keys to navigate
            </p>
        </div>
    );
};

export default ImageGallery;

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { listingService } from '../services/listingService';
import { categoryService } from '../services/categoryService';
import { useUI } from '../context/UIContext';
import { useAuth } from '../context/AuthContext';
import ImageUpload from '../components/listings/ImageUpload';

const EditListing = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { showSuccess, showError } = useUI();

    const [listing, setListing] = useState(null);
    const [categories, setCategories] = useState([]);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        price: '',
        category: '',
        location: '',
    });
    const [newImages, setNewImages] = useState([]);
    const [existingImages, setExistingImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        try {
            const [listingData, categoriesData] = await Promise.all([
                listingService.getListing(id),
                categoryService.getCategories()
            ]);

            // Check ownership
            if (user && listingData.user?.id !== user.id) {
                showError('You do not have permission to edit this listing');
                navigate(`/listings/${id}`);
                return;
            }

            setListing(listingData);
            setFormData({
                title: listingData.title,
                description: listingData.description,
                price: listingData.price,
                category: listingData.category,
                location: listingData.location,
            });
            setExistingImages(listingData.images || []);
            setCategories(Array.isArray(categoriesData) ? categoriesData : (categoriesData.results || []));
        } catch (error) {
            console.error('Failed to load listing:', error);
            showError('Failed to load listing');
            navigate('/');
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveExistingImage = (imageId) => {
        setExistingImages(prev => prev.filter(img => img.id !== imageId));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const updateData = {
                ...formData,
                uploaded_images: newImages,
                // Send IDs of images to keep
                keep_image_ids: existingImages.map(img => img.id),
            };

            await listingService.updateListing(id, updateData);
            showSuccess('Listing updated successfully!');
            navigate(`/listings/${id}`);
        } catch (err) {
            const errors = err.response?.data;
            if (errors) {
                const errorMessages = Object.entries(errors)
                    .map(([key, value]) => `${key}: ${value}`)
                    .join(', ');
                showError(errorMessages);
            } else {
                showError('Failed to update listing');
            }
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-2xl mx-auto card p-8">
                    <div className="animate-pulse space-y-4">
                        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                        <div className="h-10 bg-gray-200 rounded"></div>
                        <div className="h-32 bg-gray-200 rounded"></div>
                        <div className="h-10 bg-gray-200 rounded"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (!listing) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-700 mb-2">Listing not found</h2>
                    <button onClick={() => navigate('/')} className="btn-primary mt-4">
                        Back to Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-2xl mx-auto card p-8">
                <h1 className="text-3xl font-bold mb-6">Edit Listing</h1>

                <form onSubmit={handleSubmit}>
                    {/* Title */}
                    <div className="mb-4">
                        <label className="block text-gray-700 mb-2">Title *</label>
                        <input
                            type="text"
                            className="input-field"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            required
                            minLength={5}
                            placeholder="e.g., iPhone 13 Pro Max 256GB"
                        />
                        <p className="text-xs text-gray-500 mt-1">Minimum 5 characters</p>
                    </div>

                    {/* Description */}
                    <div className="mb-4">
                        <label className="block text-gray-700 mb-2">Description *</label>
                        <textarea
                            className="input-field"
                            rows="5"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            required
                            minLength={10}
                            placeholder="Describe your item in detail..."
                        />
                        <p className="text-xs text-gray-500 mt-1">Minimum 10 characters</p>
                    </div>

                    {/* Price */}
                    <div className="mb-4">
                        <label className="block text-gray-700 mb-2">Price *</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                            <input
                                type="number"
                                step="0.01"
                                className="input-field pl-8"
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                required
                                min="0"
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    {/* Category */}
                    <div className="mb-4">
                        <label className="block text-gray-700 mb-2">Category *</label>
                        <select
                            className="input-field"
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            required
                        >
                            <option value="">Select a category</option>
                            {Array.isArray(categories) && categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Location */}
                    <div className="mb-6">
                        <label className="block text-gray-700 mb-2">Location *</label>
                        <input
                            type="text"
                            className="input-field"
                            value={formData.location}
                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            required
                            placeholder="e.g., New York, NY"
                        />
                    </div>

                    {/* Existing Images */}
                    {existingImages.length > 0 && (
                        <div className="mb-6">
                            <label className="block text-gray-700 mb-2">Current Images</label>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {existingImages.map((img) => (
                                    <div key={img.id} className="relative group">
                                        <img
                                            src={img.image}
                                            alt="Listing"
                                            className="w-full h-32 object-cover rounded-lg"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveExistingImage(img.id)}
                                            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* New Images */}
                    <div className="mb-6">
                        <label className="block text-gray-700 mb-2">Add New Images</label>
                        <ImageUpload
                            images={newImages}
                            onChange={setNewImages}
                            maxImages={5 - existingImages.length}
                            maxSizeMB={5}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            You can upload up to {5 - existingImages.length} more image(s)
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            type="submit"
                            className="btn-primary flex-1"
                            disabled={submitting}
                        >
                            {submitting ? 'Updating...' : 'Update Listing'}
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate(`/listings/${id}`)}
                            className="btn-secondary flex-1"
                            disabled={submitting}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditListing;

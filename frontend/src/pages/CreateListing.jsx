import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { listingService } from '../services/listingService';
import { categoryService } from '../services/categoryService';
import { useUI } from '../context/UIContext';
import ImageUpload from '../components/listings/ImageUpload';

const CreateListing = () => {
    const [categories, setCategories] = useState([]);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        price: '',
        category: '',
        location: '',
    });
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { showSuccess, showError } = useUI();

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        try {
            const data = await categoryService.getCategories();
            // Handle both paginated and non-paginated responses
            setCategories(Array.isArray(data) ? data : (data.results || []));
        } catch (error) {
            console.error('Failed to load categories:', error);
            showError('Failed to load categories');
            setCategories([]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const listingData = {
                ...formData,
                uploaded_images: images,
            };
            const newListing = await listingService.createListing(listingData);
            showSuccess('Listing created successfully!');
            navigate(`/listings/${newListing.id}`);
        } catch (err) {
            const errors = err.response?.data;
            if (errors) {
                const errorMessages = Object.entries(errors)
                    .map(([key, value]) => `${key}: ${value}`)
                    .join(', ');
                showError(errorMessages);
            } else {
                showError('Failed to create listing');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-2xl mx-auto card p-8">
                <h1 className="text-3xl font-bold mb-6">Create Listing</h1>

                <form onSubmit={handleSubmit}>
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

                    <div className="mb-4">
                        <label className="block text-gray-700 mb-2">Category *</label>
                        <select
                            className="input-field"
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            required
                        >
                            <option value="">Select a category</option>
                            {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.name}
                                </option>
                            ))}
                        </select>
                    </div>

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

                    <div className="mb-6">
                        <label className="block text-gray-700 mb-2">Images</label>
                        <ImageUpload
                            images={images}
                            onChange={setImages}
                            maxImages={5}
                            maxSizeMB={5}
                        />
                    </div>

                    <button type="submit" className="btn-primary w-full" disabled={loading}>
                        {loading ? 'Creating...' : 'Create Listing'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CreateListing;

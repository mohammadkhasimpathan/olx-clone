// Placeholder for EditListing - similar to CreateListing but with pre-filled data
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { listingService } from '../services/listingService';

const EditListing = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [listing, setListing] = useState(null);

    useEffect(() => {
        loadListing();
    }, [id]);

    const loadListing = async () => {
        try {
            const data = await listingService.getListing(id);
            setListing(data);
        } catch (error) {
            console.error('Failed to load listing:', error);
        }
    };

    if (!listing) return <div className="container mx-auto px-4 py-8">Loading...</div>;

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-2xl mx-auto card p-8">
                <h1 className="text-3xl font-bold mb-6">Edit Listing</h1>
                <p className="text-gray-600">Edit functionality coming soon...</p>
                <button onClick={() => navigate(`/listings/${id}`)} className="btn-primary mt-4">
                    Back to Listing
                </button>
            </div>
        </div>
    );
};

export default EditListing;

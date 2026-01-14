import api from './api';

export const listingService = {
    // Get all listings with optional filters
    getListings: async (params = {}) => {
        const response = await api.get('/listings/', { params });
        return response.data;
    },

    // Get single listing by ID
    getListing: async (id) => {
        const response = await api.get(`/listings/${id}/`);
        return response.data;
    },

    // Create new listing
    createListing: async (listingData) => {
        const formData = new FormData();

        // Append text fields
        Object.keys(listingData).forEach(key => {
            if (key !== 'uploaded_images') {
                formData.append(key, listingData[key]);
            }
        });

        // Append images
        if (listingData.uploaded_images) {
            listingData.uploaded_images.forEach(image => {
                formData.append('uploaded_images', image);
            });
        }

        const response = await api.post('/listings/', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    // Update listing
    updateListing: async (id, listingData) => {
        const formData = new FormData();

        Object.keys(listingData).forEach(key => {
            if (key !== 'uploaded_images') {
                formData.append(key, listingData[key]);
            }
        });

        if (listingData.uploaded_images) {
            listingData.uploaded_images.forEach(image => {
                formData.append('uploaded_images', image);
            });
        }

        const response = await api.put(`/listings/${id}/`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    // Delete listing
    deleteListing: async (id) => {
        await api.delete(`/listings/${id}/`);
    },

    // Get user's listings
    getMyListings: async (params = {}) => {
        const response = await api.get('/listings/my-listings/', { params });
        return response.data;
    },

    // Mark listing as sold
    markAsSold: async (id) => {
        const response = await api.patch(`/listings/${id}/mark_sold/`);
        return response.data;
    },

    // Delete image from listing
    deleteImage: async (listingId, imageId) => {
        await api.delete(`/listings/${listingId}/delete_image/?image_id=${imageId}`);
    },
};

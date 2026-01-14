import api from './api';

export const categoryService = {
    // Get all categories
    getCategories: async () => {
        const response = await api.get('/categories/');
        return response.data;
    },

    // Get single category by slug
    getCategory: async (slug) => {
        const response = await api.get(`/categories/${slug}/`);
        return response.data;
    },
};

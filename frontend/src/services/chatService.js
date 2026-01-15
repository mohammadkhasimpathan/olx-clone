import api from './api';

export const chatService = {
    /**
     * Get all conversations for the current user
     */
    getConversations: async () => {
        const response = await api.get('/chat/conversations/');
        return response.data;
    },

    /**
     * Get or create a conversation for a listing
     * @param {number} listingId - ID of the listing
     */
    getOrCreateConversation: async (listingId) => {
        const response = await api.post('/chat/conversations/', {
            listing_id: listingId
        });
        return response.data;
    },

    /**
     * Get a specific conversation
     * @param {number} conversationId - ID of the conversation
     */
    getConversation: async (conversationId) => {
        const response = await api.get(`/chat/conversations/${conversationId}/`);
        return response.data;
    },

    /**
     * Get messages in a conversation
     * @param {number} conversationId - ID of the conversation
     * @param {object} params - Query parameters (page, page_size)
     */
    getMessages: async (conversationId, params = {}) => {
        const response = await api.get(`/chat/conversations/${conversationId}/messages/`, { params });
        return response.data;
    },

    /**
     * Send a message in a conversation
     * @param {number} conversationId - ID of the conversation
     * @param {string} content - Message content
     * @param {string} messageType - Type of message (text, offer)
     * @param {number} offerAmount - Offer amount (for offer messages)
     */
    sendMessage: async (conversationId, content, messageType = 'text', offerAmount = null) => {
        const response = await api.post(`/chat/conversations/${conversationId}/send_message/`, {
            content,
            message_type: messageType,
            offer_amount: offerAmount
        });
        return response.data;
    },

    /**
     * Mark all messages in a conversation as read
     * @param {number} conversationId - ID of the conversation
     */
    markAsRead: async (conversationId) => {
        const response = await api.post(`/chat/conversations/${conversationId}/mark_read/`);
        return response.data;
    },
};

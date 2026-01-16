import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { chatService } from '../../services/chatService';
import { useUI } from '../../context/UIContext';
import { formatCurrency } from '../../utils/formatCurrency';

const ChatList = () => {
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);
    const { showError } = useUI();

    useEffect(() => {
        loadConversations();
    }, []);

    const loadConversations = async () => {
        setLoading(true);
        try {
            const data = await chatService.getConversations();
            // Ensure data is always an array - handle both array and paginated response
            const conversationsArray = Array.isArray(data) ? data : (data?.results || []);
            setConversations(conversationsArray);
        } catch (error) {
            console.error('Failed to load conversations:', error);
            showError('Failed to load conversations');
            setConversations([]); // Set empty array on error
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    if (loading) {
        return (
            <div className="container-custom py-8">
                <div className="max-w-4xl mx-auto">
                    <div className="animate-pulse space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="card p-4">
                                <div className="flex gap-4">
                                    <div className="w-20 h-20 bg-gray-200 rounded"></div>
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (!conversations || conversations.length === 0) {
        return (
            <div className="container-custom py-16">
                <div className="max-w-md mx-auto text-center">
                    <svg className="w-24 h-24 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <h2 className="text-2xl font-bold text-gray-700 mb-2">No Messages Yet</h2>
                    <p className="text-gray-500 mb-6">Start chatting with sellers to see your conversations here</p>
                    <Link to="/" className="btn-primary inline-flex">
                        Browse Listings
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="container-custom py-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-6">Messages</h1>

                <div className="space-y-3">
                    {conversations.map(conversation => (
                        <Link
                            key={conversation.id}
                            to={`/chat/${conversation.id}`}
                            className="card p-4 hover:shadow-lg transition-shadow block"
                        >
                            <div className="flex gap-4">
                                {/* Listing Image */}
                                <div className="w-20 h-20 flex-shrink-0 bg-gray-100 rounded overflow-hidden">
                                    {conversation.listing?.first_image ? (
                                        <img
                                            src={conversation.listing.first_image}
                                            alt={conversation.listing.title}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                    )}
                                </div>

                                {/* Conversation Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between mb-1">
                                        <h3 className="font-semibold text-gray-900 truncate pr-2">
                                            {conversation.listing?.title || 'Listing'}
                                        </h3>
                                        {conversation.last_message && (
                                            <span className="text-xs text-gray-500 flex-shrink-0">
                                                {formatTime(conversation.last_message.created_at)}
                                            </span>
                                        )}
                                    </div>

                                    <p className="text-sm font-medium text-primary-600 mb-1">
                                        {formatCurrency(conversation.listing?.price || 0)}
                                    </p>

                                    <div className="flex items-center justify-between">
                                        <p className="text-sm text-gray-600 truncate">
                                            {conversation.other_user?.username || 'User'}
                                            {conversation.last_message && (
                                                <span className="ml-2">
                                                    {conversation.last_message.content}
                                                </span>
                                            )}
                                        </p>

                                        {conversation.unread_count > 0 && (
                                            <span className="badge-primary ml-2 flex-shrink-0">
                                                {conversation.unread_count}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ChatList;

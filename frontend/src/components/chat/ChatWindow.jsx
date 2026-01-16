import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { chatService } from '../../services/chatService';
import { useAuth } from '../../context/AuthContext';
import { useUI } from '../../context/UIContext';
import { useSSEContext } from '../../contexts/SSEContext';
import { formatCurrency } from '../../utils/formatCurrency';

const ChatWindow = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { showError } = useUI();
    const { subscribe } = useSSEContext();

    const [conversation, setConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        loadConversation();
        loadMessages();

        // Subscribe to SSE events for real-time messages
        const unsubscribe = subscribe('chat_message', (data) => {
            // Only add message if it's for this conversation
            if (data.conversation_id === parseInt(id)) {
                setMessages(prev => {
                    // Check if message already exists (avoid duplicates)
                    if (prev.find(m => m.id === data.message_id)) {
                        return prev;
                    }
                    // Add new message
                    return [...prev, {
                        id: data.message_id,
                        sender_id: data.sender_id,
                        sender_username: data.sender_username,
                        content: data.content,
                        message_type: data.message_type,
                        created_at: data.created_at,
                        is_read: false
                    }];
                });
            }
        });

        return () => unsubscribe();
    }, [id, subscribe]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const loadConversation = async () => {
        try {
            const data = await chatService.getConversation(id);
            setConversation(data);
        } catch (error) {
            console.error('Failed to load conversation:', error);
            showError('Failed to load conversation');
            navigate('/messages');
        }
    };

    const loadMessages = async () => {
        try {
            const data = await chatService.getMessages(id);
            setMessages(Array.isArray(data) ? data : data.results || []);

            // Mark as read
            await chatService.markAsRead(id);
        } catch (error) {
            console.error('Failed to load messages:', error);
            showError('Failed to load messages');
        } finally {
            setLoading(false);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();

        if (!newMessage.trim()) return;

        setSending(true);
        try {
            const message = await chatService.sendMessage(id, newMessage.trim());
            setMessages(prev => [...prev, message]);
            setNewMessage('');
        } catch (error) {
            console.error('Failed to send message:', error);
            const errorMsg = error.response?.data?.content?.[0] ||
                error.response?.data?.detail ||
                'Failed to send message';
            showError(errorMsg);
        } finally {
            setSending(false);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    if (loading) {
        return (
            <div className="container-custom py-8">
                <div className="max-w-4xl mx-auto">
                    <div className="card h-[600px] flex items-center justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (!conversation) {
        return null;
    }

    const otherUser = conversation.other_user;
    const listing = conversation.listing;

    return (
        <div className="container-custom py-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="card mb-4">
                    <div className="p-4 border-b border-gray-200">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate('/messages')}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>

                            <Link to={`/listings/${listing.id}`} className="flex items-center gap-3 flex-1 min-w-0 hover:bg-gray-50 p-2 rounded-lg transition-colors">
                                <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                                    {listing.first_image ? (
                                        <img src={listing.first_image} alt={listing.title} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h2 className="font-semibold text-gray-900 truncate">{listing.title}</h2>
                                    <p className="text-sm font-medium text-primary-600">{formatCurrency(listing.price)}</p>
                                </div>
                            </Link>

                            <div className="text-right">
                                <p className="text-sm font-medium text-gray-900">{otherUser.username}</p>
                                <p className="text-xs text-gray-500">
                                    {user.id === conversation.buyer.id ? 'Seller' : 'Buyer'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="h-[400px] overflow-y-auto p-4 bg-gray-50">
                        {messages.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-gray-500">
                                <div className="text-center">
                                    <svg className="w-16 h-16 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                    <p>No messages yet. Start the conversation!</p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {messages.map((message) => {
                                    const isOwn = message.sender === user.id;
                                    return (
                                        <div
                                            key={message.id}
                                            className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div className={`max-w-[70%] ${isOwn ? 'order-2' : 'order-1'}`}>
                                                <div
                                                    className={`rounded-2xl px-4 py-2 ${isOwn
                                                        ? 'bg-primary-600 text-white'
                                                        : 'bg-white text-gray-900 border border-gray-200'
                                                        }`}
                                                >
                                                    <p className="text-sm break-words">{message.content}</p>
                                                </div>
                                                <p className={`text-xs text-gray-500 mt-1 px-2 ${isOwn ? 'text-right' : 'text-left'}`}>
                                                    {formatTime(message.created_at)}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>
                        )}
                    </div>

                    {/* Input */}
                    <div className="p-4 border-t border-gray-200 bg-white">
                        <form onSubmit={handleSendMessage} className="flex gap-2">
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Type a message..."
                                className="input-field flex-1"
                                disabled={sending}
                                maxLength={2000}
                            />
                            <button
                                type="submit"
                                disabled={sending || !newMessage.trim()}
                                className="btn-primary px-6"
                            >
                                {sending ? (
                                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                    </svg>
                                )}
                            </button>
                        </form>
                        <p className="text-xs text-gray-500 mt-2">
                            Messages cannot contain URLs or external contact information
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatWindow;

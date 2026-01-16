import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { chatService } from '../../services/chatService';
import { useAuth } from '../../context/AuthContext';
import { useUI } from '../../context/UIContext';
import { formatCurrency } from '../../utils/formatCurrency';

const ChatWindow = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { showError } = useUI();

    const [conversation, setConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef(null);

    // CRITICAL: Use ref to store WebSocket - prevents recreation on re-render
    const wsRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);
    const reconnectAttemptsRef = useRef(0);

    // Stable message handler using useCallback
    const handleIncomingMessage = useCallback((data) => {
        if (data.type === 'chat_message') {
            const message = data.message;
            setMessages(prev => {
                // Avoid duplicates
                if (prev.find(m => m.id === message.id)) {
                    return prev;
                }
                return [...prev, message];
            });
        }
    }, []);

    // WebSocket connection - ONLY depends on primitive values (id, user.id)
    useEffect(() => {
        if (!id || !user) return;

        // Prevent duplicate connections
        if (wsRef.current) {
            console.log('[Chat WS] Connection already exists');
            return;
        }

        const token = localStorage.getItem('access_token');
        if (!token) {
            console.log('[Chat WS] No auth token');
            return;
        }

        const wsUrl = `${import.meta.env.VITE_WS_URL || 'ws://localhost:8000'}/ws/chat/${id}/?token=${token}`;
        console.log('[Chat WS] Connecting to:', wsUrl.replace(token, '***'));

        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
            console.log('[Chat WS] Connected to conversation', id);
            reconnectAttemptsRef.current = 0;
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log('[Chat WS] Message received:', data.type);
                handleIncomingMessage(data);
            } catch (error) {
                console.error('[Chat WS] Failed to parse message:', error);
            }
        };

        ws.onerror = (error) => {
            console.error('[Chat WS] Error:', error);
        };

        ws.onclose = () => {
            console.log('[Chat WS] Disconnected from conversation', id);
            wsRef.current = null;

            // Auto-reconnect with exponential backoff
            if (reconnectAttemptsRef.current < 5) {
                reconnectAttemptsRef.current++;
                const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 10000);
                console.log(`[Chat WS] Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current})`);

                reconnectTimeoutRef.current = setTimeout(() => {
                    // Trigger reconnect by clearing and re-running effect
                    if (!wsRef.current) {
                        console.log('[Chat WS] Attempting reconnect...');
                    }
                }, delay);
            }
        };

        // Cleanup function
        return () => {
            console.log('[Chat WS] Cleaning up connection');
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
            }
        };
    }, [id, user?.id, handleIncomingMessage]); // ONLY primitive dependencies

    useEffect(() => {
        loadConversation();
        loadMessages();
    }, [id]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const loadConversation = async () => {
        try {
            const data = await chatService.getConversation(id);
            setConversation(data);
        } catch (error) {
            showError('Failed to load conversation');
            navigate('/messages');
        }
    };

    const loadMessages = async () => {
        try {
            setLoading(true);
            const data = await chatService.getMessages(id);
            setMessages(Array.isArray(data) ? data : []);
        } catch (error) {
            showError('Failed to load messages');
            setMessages([]);
        } finally {
            setLoading(false);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();

        if (!newMessage.trim() || sending) return;

        try {
            setSending(true);

            // Send via WebSocket if connected
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({
                    type: 'chat_message',
                    content: newMessage.trim()
                }));
                console.log('[Chat WS] Message sent via WebSocket');
            } else {
                // Fallback to REST API
                console.log('[Chat WS] WebSocket not ready, using REST API');
                await chatService.sendMessage(id, newMessage.trim());
                await loadMessages(); // Reload to show new message
            }

            setNewMessage('');
        } catch (error) {
            showError('Failed to send message');
            console.error('[Chat] Send error:', error);
        } finally {
            setSending(false);
        }
    };

    const formatMessageTime = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffInHours = (now - date) / (1000 * 60 * 60);

        if (diffInHours < 24) {
            return date.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
            });
        } else {
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!conversation) {
        return (
            <div className="container mx-auto px-4 py-8">
                <p className="text-center text-gray-600">Conversation not found</p>
            </div>
        );
    }

    const otherUser = conversation.buyer.id === user.id ? conversation.seller : conversation.buyer;

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-md p-4 mb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Link to="/messages" className="text-blue-600 hover:text-blue-800">
                            ← Back
                        </Link>
                        <div>
                            <h2 className="text-xl font-semibold">{otherUser.username}</h2>
                            <Link
                                to={`/listing/${conversation.listing.id}`}
                                className="text-sm text-gray-600 hover:text-blue-600"
                            >
                                {conversation.listing.title} - {formatCurrency(conversation.listing.price)}
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="bg-white rounded-lg shadow-md p-4 mb-4 h-[500px] overflow-y-auto">
                {messages.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No messages yet. Start the conversation!</p>
                ) : (
                    <div className="space-y-4">
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={`flex ${message.sender === user.id ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[70%] rounded-lg p-3 ${message.sender === user.id
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-200 text-gray-800'
                                        }`}
                                >
                                    <p className="break-words">{message.content}</p>
                                    <p className={`text-xs mt-1 ${message.sender === user.id ? 'text-blue-100' : 'text-gray-500'
                                        }`}>
                                        {formatMessageTime(message.created_at)}
                                    </p>
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            {/* Input */}
            <form onSubmit={handleSendMessage} className="bg-white rounded-lg shadow-md p-4">
                <div className="flex space-x-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
                        disabled={sending}
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim() || sending}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                        {sending ? 'Sending...' : 'Send'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ChatWindow;

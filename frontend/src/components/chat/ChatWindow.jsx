import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { chatService } from '../../services/chatService';
import api from '../../services/api';
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
    const [otherUserTyping, setOtherUserTyping] = useState(false);
    const messagesEndRef = useRef(null);

    // CRITICAL: Use ref to store WebSocket - prevents recreation on re-render
    const wsRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);
    const reconnectAttemptsRef = useRef(0);
    const typingTimeoutRef = useRef(null);
    const audioContextRef = useRef(null);
    const [previousMessageCount, setPreviousMessageCount] = useState(0);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Initialize AudioContext on user interaction
    useEffect(() => {
        const initAudio = () => {
            if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
            }
        };
        document.addEventListener('click', initAudio, { once: true });
        return () => document.removeEventListener('click', initAudio);
    }, []);

    // Play notification sound
    const playNotificationSound = async () => {
        try {
            if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
            }
            if (audioContextRef.current.state === 'suspended') {
                await audioContextRef.current.resume();
            }
            const oscillator = audioContextRef.current.createOscillator();
            const gainNode = audioContextRef.current.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioContextRef.current.destination);
            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            gainNode.gain.setValueAtTime(0.3, audioContextRef.current.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + 0.2);
            oscillator.start(audioContextRef.current.currentTime);
            oscillator.stop(audioContextRef.current.currentTime + 0.2);
        } catch (error) {
            console.log('[Chat] Audio failed:', error);
        }
    };

    // Stable message handler using useCallback
    const handleIncomingMessage = useCallback((data) => {
        console.log('[Chat] Incoming message data:', data);

        if (data.type === 'chat_message') {
            const message = data.message;
            console.log('[Chat] Processing message:', message);

            setMessages(prev => {
                if (prev.some(m => m.id === message.id)) {
                    return prev;
                }
                console.log('[Chat] Adding new message to state');
                return [...prev, message];
            });

            // Mark as delivered if from other user
            if (message.sender !== user.id) {
                api.post(`/chat/messages/${message.id}/mark_delivered/`).catch(err =>
                    console.error('[Chat] Mark delivered failed:', err)
                );
            }

            // Show notification for messages from other users
            if (message.sender !== user.id && document.hidden) {
                if (Notification.permission === 'default') {
                    Notification.requestPermission();
                }
                if (Notification.permission === 'granted') {
                    new Notification('New Message', {
                        body: message.content,
                        icon: '/logo.png',
                        tag: 'chat-message'
                    });
                }
                playNotificationSound();
            }
        } else if (data.type === 'typing') {
            const isTyping = data.is_typing;
            const typingUserId = data.user_id;
            if (typingUserId !== user.id) {
                setOtherUserTyping(isTyping);
            }
        } else if (data.type === 'message_status') {
            // Update message status
            setMessages(prev => prev.map(msg =>
                msg.id === data.message_id
                    ? {
                        ...msg,
                        is_delivered: data.is_delivered ?? msg.is_delivered,
                        is_read: data.is_read ?? msg.is_read,
                        delivered_at: data.delivered_at ?? msg.delivered_at,
                        read_at: data.read_at ?? msg.read_at
                    }
                    : msg
            ));
        }
    }, [user, playNotificationSound]); // Added playNotificationSound to dependencies

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
    }, [id, user?.id]); // ONLY primitive dependencies

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
            console.log('[Chat] Loaded', data.length, 'messages');
            setMessages(data);

            // Mark conversation as read
            if (data.length > 0) {
                api.post(`/chat/conversations/${id}/mark_read/`).catch(err =>
                    console.error('[Chat] Mark read failed:', err)
                );
            }
        } catch (error) {
            console.error('[Chat] Failed to load messages:', error);
            showError('Failed to load messages');
        } finally {
            setLoading(false);
        }
    };


    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }, 150);
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        e.stopPropagation(); // Prevent page scroll

        if (!newMessage.trim() || sending) return;

        const messageContent = newMessage.trim();
        setNewMessage(''); // Clear input immediately for better UX

        try {
            setSending(true);

            // Send via WebSocket if connected
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({
                    type: 'chat_message',
                    content: messageContent
                }));
                console.log('[Chat WS] Message sent via WebSocket');
            } else {
                // Fallback to REST API
                console.log('[Chat WS] WebSocket not ready, using REST API');
                await chatService.sendMessage(id, messageContent);
                await loadMessages(); // Reload to show new message
            }
        } catch (error) {
            showError('Failed to send message');
            console.error('[Chat] Send error:', error);
            setNewMessage(messageContent); // Restore message on error
        } finally {
            setSending(false);
        }
    };

    // Handle delete chat
    const handleDeleteChat = async () => {
        setShowDeleteConfirm(false);
        
        try {
            // CRITICAL: Close WebSocket FIRST to prevent reconnection
            if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
            }
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
        
        try {
            await chatService.hideConversation(id);
            console.log('[Chat] Chat deleted successfully');
            
            // CRITICAL: Navigate IMMEDIATELY to unmount component
            navigate('/messages', { replace: true });
        } catch (error) {
            showError('Failed to delete chat');
            console.error('[Chat] Delete error:', error);
        }
    };
    };

    // Auto-scroll when messages change
    useEffect(() => {
        if (messages.length > 0) {
            scrollToBottom();
        }
    }, [messages]);

    // Scroll on initial load
    useEffect(() => {
        if (!loading && conversation) {
            scrollToBottom();
        }
    }, [loading, conversation]);

    // Notification sound on new message
    useEffect(() => {
        if (messages.length > previousMessageCount && previousMessageCount > 0) {
            const lastMessage = messages[messages.length - 1];
            // Only play sound for messages from other users when window not focused
            if (lastMessage.sender !== user.id && !document.hasFocus()) {
                try {
                    const sound = new Audio('/sounds/whatsapp_notification.mp3');
                    sound.play().catch(err => console.log('[Chat] Audio autoplay blocked:', err));
                } catch (error) {
                    console.error('[Chat] Sound error:', error);
                }
            }
        }
        setPreviousMessageCount(messages.length);
    }, [messages, previousMessageCount, user]);

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
        <div className="min-h-screen bg-gray-100">
            <div className="container mx-auto px-4 py-4 max-w-5xl">
                {/* Header */}
                <div className="bg-white rounded-t-lg shadow-sm border-b border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <Link
                                to="/messages"
                                className="text-gray-600 hover:text-blue-600 transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </Link>
                            <div className="flex items-center space-x-3">
                                <div className="relative">
                                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                                        {otherUser.username.charAt(0).toUpperCase()}
                                    </div>
                                    {/* Online status indicator */}
                                    {otherUser.is_online && (
                                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                                    )}
                                </div>
                                <div>
                                    <div className="flex items-center space-x-2">
                                        <h2 className="text-lg font-semibold text-gray-900">{otherUser.username}</h2>
                                    </div>
                                    {/* Online status or last seen */}
                                    {otherUser.is_online ? (
                                        <p className="text-xs text-green-600 font-medium">Online</p>
                                    ) : otherUser.last_seen ? (
                                        <p className="text-xs text-gray-500">
                                            Last seen {new Date(otherUser.last_seen).toLocaleString()}
                                        </p>
                                    ) : null}
                                    <Link
                                        to={`/listing/${conversation.listing.id}`}
                                        className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
                                    >
                                        {conversation.listing.title}
                                    </Link>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            <p className="text-lg font-bold text-blue-600">{formatCurrency(conversation.listing.price)}</p>
                            <button
                                onClick={() => setShowDeleteConfirm(true)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete chat"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Messages Container */}
                <div className="bg-gray-50 h-[calc(100vh-280px)] overflow-y-auto p-4 space-y-3">
                    {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500">
                            <svg className="w-16 h-16 mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            <p className="text-lg">No messages yet</p>
                            <p className="text-sm">Start the conversation!</p>
                        </div>
                    ) : (
                        <>
                            {messages.map((message) => {
                                // Handle sender as either ID or object
                                const senderId = typeof message.sender === 'object' ? message.sender.id : message.sender;
                                // Handle user.id being nested in user.user or user.pk
                                const currentUserId = user?.id || user?.user?.id || user?.pk;
                                const isOwnMessage = senderId === currentUserId;

                                return (
                                    <div
                                        key={message.id}
                                        className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div
                                            className={`max-w-[75%] sm:max-w-[60%] rounded-2xl px-4 py-2 shadow-sm ${isOwnMessage
                                                ? 'bg-blue-600 text-white rounded-br-none'
                                                : 'bg-white text-gray-800 rounded-bl-none'
                                                }`}
                                        >
                                            <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">
                                                {message.content}
                                            </p>
                                            <div className={`flex items-center justify-end mt-1 space-x-1 ${isOwnMessage ? 'text-blue-100' : 'text-gray-500'
                                                }`}>
                                                <span className="text-xs">
                                                    {formatMessageTime(message.created_at)}
                                                </span>
                                                {isOwnMessage && (
                                                    <span className="flex items-center">
                                                        {message.is_read ? (
                                                            // Read - Blue double check
                                                            <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                                                <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                                                                <path d="M12.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-1-1a1 1 0 011.414-1.414l.293.293 7.293-7.293a1 1 0 011.414 0z" />
                                                            </svg>
                                                        ) : message.is_delivered ? (
                                                            // Delivered - Gray double check
                                                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                                <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                                                                <path d="M12.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-1-1a1 1 0 011.414-1.414l.293.293 7.293-7.293a1 1 0 011.414 0z" />
                                                            </svg>
                                                        ) : (
                                                            // Sent - Single check
                                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                                <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                                                            </svg>
                                                        )}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Typing Indicator */}
                            {otherUserTyping && (
                                <div className="flex justify-start mb-2">
                                    <div className="bg-gray-200 rounded-2xl rounded-bl-none px-4 py-3 max-w-[75%]">
                                        <div className="flex space-x-1">
                                            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </>
                    )}
                </div>

                {/* Input Area */}
                <form onSubmit={handleSendMessage} className="bg-white rounded-b-lg shadow-sm border-t border-gray-200 p-4">
                    <div className="flex items-center space-x-3">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => {
                                setNewMessage(e.target.value);
                                if (wsRef.current?.readyState === WebSocket.OPEN) {
                                    wsRef.current.send(JSON.stringify({ type: 'typing', is_typing: true }));
                                    clearTimeout(typingTimeoutRef.current);
                                    typingTimeoutRef.current = setTimeout(() => {
                                        if (wsRef.current?.readyState === WebSocket.OPEN) {
                                            wsRef.current.send(JSON.stringify({ type: 'typing', is_typing: false }));
                                        }
                                    }, 2000);
                                }
                            }}
                            placeholder="Type a message..."
                            className="flex-1 bg-gray-100 border-0 rounded-full px-5 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
                            disabled={sending}
                            autoFocus
                        />
                        <button
                            type="submit"
                            disabled={!newMessage.trim() || sending}
                            className="bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg"
                        >
                            {sending ? (
                                <svg className="w-6 h-6 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                            ) : (
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
                            )}
                        </button>
                    </div>
                </form>

                {/* Delete Confirmation Dialog */}
                {showDeleteConfirm && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Chat?</h3>
                            <p className="text-gray-600 mb-6">
                                This will delete the chat from your side. The other person will still be able to see it.
                            </p>
                            <div className="flex space-x-3">
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeleteChat}
                                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatWindow;

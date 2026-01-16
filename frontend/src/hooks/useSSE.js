import { useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for Server-Sent Events (SSE) connection
 * Handles connection, reconnection, and event dispatching
 */
export const useSSE = (onEvent) => {
    const eventSourceRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);
    const reconnectAttempts = useRef(0);

    const getAuthToken = () => {
        const token = localStorage.getItem('access_token');
        return token;
    };

    const connect = useCallback(() => {
        const token = getAuthToken();

        if (!token) {
            console.log('[SSE] No auth token, skipping connection');
            return;
        }

        // Close existing connection
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
        }

        try {
            // Create SSE connection with JWT in URL
            // Note: EventSource doesn't support custom headers, so we pass token in URL
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
            const url = `${apiUrl}/events/stream/?token=${token}`;

            console.log('[SSE] Connecting...');
            const eventSource = new EventSource(url);

            eventSource.onopen = () => {
                console.log('[SSE] Connected successfully');
                reconnectAttempts.current = 0;
            };

            // Connection confirmed event
            eventSource.addEventListener('connected', (e) => {
                const data = JSON.parse(e.data);
                console.log('[SSE] Connection confirmed:', data);
            });

            // Chat message event
            eventSource.addEventListener('chat_message', (e) => {
                const data = JSON.parse(e.data);
                console.log('[SSE] Received chat_message:', data);
                onEvent('chat_message', data);
            });

            // Notification created event
            eventSource.addEventListener('notification_created', (e) => {
                const data = JSON.parse(e.data);
                console.log('[SSE] Received notification_created:', data);
                onEvent('notification_created', data);
            });

            // Heartbeat event (keep-alive)
            eventSource.addEventListener('heartbeat', () => {
                // Silent heartbeat - connection is alive
            });

            eventSource.onerror = (error) => {
                console.error('[SSE] Connection error:', error);
                eventSource.close();

                // Exponential backoff reconnect
                const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
                reconnectAttempts.current++;

                console.log(`[SSE] Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current})...`);

                reconnectTimeoutRef.current = setTimeout(() => {
                    connect();
                }, delay);
            };

            eventSourceRef.current = eventSource;
        } catch (error) {
            console.error('[SSE] Failed to create connection:', error);
        }
    }, [onEvent]);

    useEffect(() => {
        connect();

        return () => {
            console.log('[SSE] Cleaning up connection');
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
            }
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
        };
    }, [connect]);

    return { reconnect: connect };
};

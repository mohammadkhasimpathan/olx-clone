import { useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for WebSocket connection with auto-reconnect
 * @param {string} url - WebSocket URL
 * @param {function} onMessage - Callback for incoming messages
 * @param {object} options - Additional options
 */
export const useWebSocket = (url, onMessage, options = {}) => {
    const {
        enabled = true,
        reconnectInterval = 3000,
        maxReconnectAttempts = 10
    } = options;

    const ws = useRef(null);
    const reconnectAttempts = useRef(0);
    const reconnectTimeout = useRef(null);

    const connect = useCallback(() => {
        if (!enabled || !url) return;

        try {
            // Get JWT token
            const token = localStorage.getItem('access_token');
            if (!token) {
                console.log('[WebSocket] No auth token available');
                return;
            }

            // Create WebSocket connection with token
            const wsUrl = `${url}?token=${token}`;
            console.log('[WebSocket] Connecting to:', wsUrl.replace(token, '***'));

            ws.current = new WebSocket(wsUrl);

            ws.current.onopen = () => {
                console.log('[WebSocket] Connected');
                reconnectAttempts.current = 0;
            };

            ws.current.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    console.log('[WebSocket] Message received:', data.type);
                    onMessage(data);
                } catch (error) {
                    console.error('[WebSocket] Failed to parse message:', error);
                }
            };

            ws.current.onerror = (error) => {
                console.error('[WebSocket] Error:', error);
            };

            ws.current.onclose = () => {
                console.log('[WebSocket] Disconnected');

                // Auto-reconnect
                if (enabled && reconnectAttempts.current < maxReconnectAttempts) {
                    reconnectAttempts.current++;
                    const delay = reconnectInterval * Math.min(reconnectAttempts.current, 5);
                    console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current})`);

                    reconnectTimeout.current = setTimeout(() => {
                        connect();
                    }, delay);
                }
            };

        } catch (error) {
            console.error('[WebSocket] Connection failed:', error);
        }
    }, [url, enabled, onMessage, reconnectInterval, maxReconnectAttempts]);

    const disconnect = useCallback(() => {
        if (reconnectTimeout.current) {
            clearTimeout(reconnectTimeout.current);
        }
        if (ws.current) {
            ws.current.close();
            ws.current = null;
        }
    }, []);

    const send = useCallback((data) => {
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify(data));
            return true;
        }
        console.warn('[WebSocket] Cannot send - not connected');
        return false;
    }, []);

    useEffect(() => {
        connect();
        return () => disconnect();
    }, [connect, disconnect]);

    return { send, disconnect, reconnect: connect };
};

import React, { createContext, useContext, useCallback, useState, useEffect } from 'react';
import { useSSE } from '../hooks/useSSE';

const SSEContext = createContext(null);

export const SSEProvider = ({ children }) => {
    const [eventHandlers, setEventHandlers] = useState({});
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Check authentication status
    useEffect(() => {
        const checkAuth = () => {
            const token = localStorage.getItem('access_token');
            setIsAuthenticated(!!token);
        };

        checkAuth();

        // Listen for storage changes (login/logout in other tabs)
        window.addEventListener('storage', checkAuth);

        return () => window.removeEventListener('storage', checkAuth);
    }, []);

    const handleEvent = useCallback((eventType, data) => {
        if (eventHandlers[eventType]) {
            eventHandlers[eventType].forEach(handler => {
                try {
                    handler(data);
                } catch (error) {
                    console.error(`[SSE] Error in event handler for ${eventType}:`, error);
                }
            });
        }
    }, [eventHandlers]);

    const { reconnect } = useSSE(isAuthenticated ? handleEvent : () => { });

    const subscribe = useCallback((eventType, handler) => {
        setEventHandlers(prev => ({
            ...prev,
            [eventType]: [...(prev[eventType] || []), handler]
        }));

        // Return unsubscribe function
        return () => {
            setEventHandlers(prev => ({
                ...prev,
                [eventType]: (prev[eventType] || []).filter(h => h !== handler)
            }));
        };
    }, []);

    return (
        <SSEContext.Provider value={{ subscribe, reconnect, isAuthenticated }}>
            {children}
        </SSEContext.Provider>
    );
};

export const useSSEContext = () => {
    const context = useContext(SSEContext);
    if (!context) {
        throw new Error('useSSEContext must be used within SSEProvider');
    }
    return context;
};

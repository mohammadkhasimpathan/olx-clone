import { createContext, useContext, useState, useCallback } from 'react';

const UIContext = createContext();

export const useUI = () => {
    const context = useContext(UIContext);
    if (!context) {
        throw new Error('useUI must be used within UIProvider');
    }
    return context;
};

export const UIProvider = ({ children }) => {
    const [loading, setLoading] = useState(false);
    const [toasts, setToasts] = useState([]);

    // Loading state management
    const showLoading = useCallback(() => setLoading(true), []);
    const hideLoading = useCallback(() => setLoading(false), []);

    // Toast management
    const showToast = useCallback((message, type = 'info') => {
        const id = Date.now();
        const toast = { id, message, type };

        setToasts(prev => [...prev, toast]);

        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            removeToast(id);
        }, 5000);

        return id;
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    // Convenience methods for different toast types
    const showSuccess = useCallback((message) => showToast(message, 'success'), [showToast]);
    const showError = useCallback((message) => showToast(message, 'error'), [showToast]);
    const showWarning = useCallback((message) => showToast(message, 'warning'), [showToast]);
    const showInfo = useCallback((message) => showToast(message, 'info'), [showToast]);

    const value = {
        loading,
        showLoading,
        hideLoading,
        toasts,
        showToast,
        removeToast,
        showSuccess,
        showError,
        showWarning,
        showInfo,
    };

    return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
};

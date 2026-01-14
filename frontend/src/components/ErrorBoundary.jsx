import React from 'react';

/**
 * Enhanced Global Error Boundary Component
 * 
 * Catches all React render errors and prevents white screen crashes.
 * Shows a fallback UI and logs FULL error details to console.
 * 
 * CRITICAL PRODUCTION DEBUGGING FEATURES:
 * - Logs full error object (not just message)
 * - Handles non-Error objects (thrown strings, objects, etc.)
 * - Shows error.stack and componentStack
 * - Displays String(error) for maximum visibility
 * - Never allows white screen
 */
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
            errorString: '',
        };
    }

    /**
     * Update state when error is caught
     * Handles both Error objects and non-Error throws
     */
    static getDerivedStateFromError(error) {
        // Convert error to string for display (handles non-Error objects)
        let errorString = 'Unknown error';
        try {
            errorString = String(error);
        } catch (e) {
            errorString = 'Error could not be stringified';
        }

        return {
            hasError: true,
            error: error,
            errorString: errorString,
        };
    }

    /**
     * Log FULL error details to console for debugging
     * CRITICAL: This is the ONLY way to debug minified production errors
     */
    componentDidCatch(error, errorInfo) {
        // Log EVERYTHING to console (visible in browser DevTools)
        console.group('🚨 React Error Boundary Caught an Error');

        // Log the raw error object
        console.error('Full Error Object:', error);

        // Log error as string (handles non-Error objects)
        console.error('Error as String:', String(error));

        // Log error properties
        console.error('Error Type:', typeof error);
        console.error('Error Constructor:', error?.constructor?.name);
        console.error('Error Message:', error?.message);
        console.error('Error Name:', error?.name);

        // Log stack traces
        console.error('Error Stack:', error?.stack);
        console.error('Component Stack:', errorInfo?.componentStack);

        // Log all error properties (for debugging non-standard errors)
        if (error && typeof error === 'object') {
            console.error('Error Keys:', Object.keys(error));
            console.error('Error Properties:', error);
        }

        console.groupEnd();

        // Store error info in state for display
        this.setState({
            errorInfo: errorInfo,
        });

        // Optional: Send to error tracking service (e.g., Sentry)
        // if (window.Sentry) {
        //     window.Sentry.captureException(error, { 
        //         contexts: { 
        //             react: { 
        //                 componentStack: errorInfo.componentStack 
        //             } 
        //         } 
        //     });
        // }
    }

    /**
     * Reset error boundary (allow user to retry)
     */
    handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
            errorString: '',
        });
        // Reload the page to reset application state
        window.location.reload();
    };

    /**
     * Get error display text (handles all error types)
     */
    getErrorDisplay = () => {
        const { error, errorString } = this.state;

        // Try multiple ways to get error text
        if (error?.message) {
            return error.message;
        }
        if (errorString && errorString !== 'Unknown error') {
            return errorString;
        }
        if (error?.toString && typeof error.toString === 'function') {
            try {
                return error.toString();
            } catch (e) {
                // Ignore
            }
        }
        return 'An unexpected error occurred';
    };

    render() {
        if (this.state.hasError) {
            const errorDisplay = this.getErrorDisplay();
            const { error, errorInfo } = this.state;

            // Fallback UI - shown instead of white screen
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                    <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8">
                        {/* Error Icon */}
                        <div className="flex justify-center mb-6">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                                <svg
                                    className="w-10 h-10 text-red-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                    />
                                </svg>
                            </div>
                        </div>

                        {/* Error Title */}
                        <h1 className="text-3xl font-bold text-gray-900 text-center mb-4">
                            Something went wrong
                        </h1>

                        {/* Error Description */}
                        <p className="text-gray-600 text-center mb-6">
                            We're sorry, but something unexpected happened. The error has been logged to the console.
                        </p>

                        {/* Error Details - ALWAYS VISIBLE */}
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                            <p className="text-sm font-semibold text-red-800 mb-2">
                                Error Details:
                            </p>
                            <p className="text-sm text-red-700 font-mono break-all whitespace-pre-wrap">
                                {errorDisplay}
                            </p>
                            {error?.name && (
                                <p className="text-xs text-red-600 mt-2">
                                    Type: {error.name}
                                </p>
                            )}
                        </div>

                        {/* Error Stack - Expandable */}
                        {error?.stack && (
                            <details className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                                <summary className="text-sm font-semibold text-gray-700 cursor-pointer hover:text-gray-900">
                                    Error Stack Trace (Click to expand)
                                </summary>
                                <pre className="text-xs text-gray-600 mt-2 overflow-auto max-h-60 whitespace-pre-wrap break-all">
                                    {error.stack}
                                </pre>
                            </details>
                        )}

                        {/* Component Stack - Expandable */}
                        {errorInfo?.componentStack && (
                            <details className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                                <summary className="text-sm font-semibold text-gray-700 cursor-pointer hover:text-gray-900">
                                    Component Stack (Click to expand)
                                </summary>
                                <pre className="text-xs text-gray-600 mt-2 overflow-auto max-h-60 whitespace-pre-wrap">
                                    {errorInfo.componentStack}
                                </pre>
                            </details>
                        )}

                        {/* Debug Info */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
                            <p className="text-xs text-blue-800">
                                <strong>Debug Tip:</strong> Open browser DevTools (F12) → Console tab to see full error details with source maps.
                            </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <button
                                onClick={this.handleReset}
                                className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold"
                            >
                                Reload Page
                            </button>
                            <a
                                href="/"
                                className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-semibold text-center"
                            >
                                Go to Homepage
                            </a>
                        </div>

                        {/* Help Text */}
                        <p className="text-xs text-gray-500 text-center mt-6">
                            If this problem persists, please contact support or try clearing your browser cache.
                        </p>
                    </div>
                </div>
            );
        }

        // No error - render children normally
        return this.props.children;
    }
}

export default ErrorBoundary;

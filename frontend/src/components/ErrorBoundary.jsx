import React from 'react';

/**
 * Global Error Boundary Component
 * 
 * Catches all React render errors and prevents white screen crashes.
 * Shows a fallback UI and logs detailed error information to console.
 * 
 * CRITICAL: This is a production safety feature.
 * Do NOT remove error logging or simplify error handling.
 */
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    /**
     * Update state when error is caught
     * This enables the fallback UI to render
     */
    static getDerivedStateFromError(error) {
        return {
            hasError: true,
            error: error,
        };
    }

    /**
     * Log error details to console for debugging
     * CRITICAL: This is the ONLY way to debug minified production errors
     */
    componentDidCatch(error, errorInfo) {
        // Log to console (visible in browser DevTools)
        console.error('🚨 React Error Boundary Caught an Error:');
        console.error('Error:', error);
        console.error('Error Message:', error?.message);
        console.error('Error Stack:', error?.stack);
        console.error('Component Stack:', errorInfo?.componentStack);

        // Store error info in state for display
        this.setState({
            error: error,
            errorInfo: errorInfo,
        });

        // Optional: Send to error tracking service (e.g., Sentry)
        // if (window.Sentry) {
        //     window.Sentry.captureException(error, { contexts: { react: { componentStack: errorInfo.componentStack } } });
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
        });
        // Reload the page to reset application state
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
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
                            We're sorry, but something unexpected happened. The error has been logged and our team will investigate.
                        </p>

                        {/* Error Details (Development/Debug) */}
                        {this.state.error && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                                <p className="text-sm font-semibold text-red-800 mb-2">
                                    Error Details:
                                </p>
                                <p className="text-sm text-red-700 font-mono break-all">
                                    {this.state.error.toString()}
                                </p>
                                {this.state.error.message && (
                                    <p className="text-xs text-red-600 mt-2">
                                        Message: {this.state.error.message}
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Component Stack (Development/Debug) */}
                        {this.state.errorInfo?.componentStack && (
                            <details className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                                <summary className="text-sm font-semibold text-gray-700 cursor-pointer">
                                    Component Stack (Click to expand)
                                </summary>
                                <pre className="text-xs text-gray-600 mt-2 overflow-auto max-h-40">
                                    {this.state.errorInfo.componentStack}
                                </pre>
                            </details>
                        )}

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

import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
    const [credentials, setCredentials] = useState({ username: '', password: '' });
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [requiresVerification, setRequiresVerification] = useState(false);
    const [userEmail, setUserEmail] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        // Display success message from navigation state
        if (location.state?.message) {
            setMessage(location.state.message);
        }
    }, [location]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setRequiresVerification(false);
        setLoading(true);

        try {
            await login(credentials);
            navigate('/');
        } catch (err) {
            const errorData = err.response?.data;

            // Check if error is due to unverified email
            if (errorData?.requires_verification) {
                setRequiresVerification(true);
                setUserEmail(errorData.email);
                setError(errorData.error);
            } else {
                setError(errorData?.detail || errorData?.error || 'Login failed');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleGoToVerification = () => {
        navigate('/verify-email', { state: { email: userEmail } });
    };

    return (
        <div className="container mx-auto px-4 py-12">
            <div className="max-w-md mx-auto card p-8">
                <h1 className="text-3xl font-bold mb-6 text-center">Login</h1>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                        {error}
                        {requiresVerification && (
                            <button
                                onClick={handleGoToVerification}
                                className="block mt-2 text-red-800 font-semibold hover:underline"
                            >
                                Click here to verify your email →
                            </button>
                        )}
                    </div>
                )}

                {message && (
                    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                        {message}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-gray-700 mb-2">Username</label>
                        <input
                            type="text"
                            className="input-field"
                            value={credentials.username}
                            onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                            required
                        />
                    </div>

                    <div className="mb-2">
                        <label className="block text-gray-700 mb-2">Password</label>
                        <input
                            type="password"
                            className="input-field"
                            value={credentials.password}
                            onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                            required
                        />
                    </div>

                    <div className="mb-6 text-right">
                        <Link to="/forgot-password" className="text-sm text-primary-600 hover:underline">
                            Forgot Password?
                        </Link>
                    </div>

                    <button type="submit" className="btn-primary w-full" disabled={loading}>
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>

                <p className="mt-4 text-center text-gray-600">
                    Don't have an account?{' '}
                    <Link to="/register" className="text-primary-600 hover:underline">
                        Register
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Login;

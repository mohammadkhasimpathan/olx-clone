import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/authService';

const Register = () => {
    const [step, setStep] = useState(1); // 1 = registration form, 2 = OTP verification
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirm_password: '',
        phone_number: '',
        location: '',
    });
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validation
        if (formData.password !== formData.confirm_password) {
            setError('Passwords do not match');
            return;
        }

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);

        try {
            await authService.registerRequest(formData);
            // Move to OTP verification step
            setStep(2);
        } catch (err) {
            const errorData = err.response?.data;
            setError(errorData?.error || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleOTPSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!otp || otp.length !== 6) {
            setError('Please enter a valid 6-digit OTP');
            return;
        }

        setLoading(true);

        try {
            await authService.verifyOTP(formData.email, otp);
            // Success - redirect to login
            navigate('/login', {
                state: {
                    message: 'Account created successfully! Please login with your credentials.'
                }
            });
        } catch (err) {
            const errorData = err.response?.data;
            setError(errorData?.error || 'OTP verification failed');
        } finally {
            setLoading(false);
        }
    };

    const handleResendOTP = async () => {
        if (resendCooldown > 0) return;

        setError('');
        setLoading(true);

        try {
            await authService.resendOTP(formData.email);
            // Start 60-second cooldown
            setResendCooldown(60);
            const timer = setInterval(() => {
                setResendCooldown((prev) => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } catch (err) {
            const errorData = err.response?.data;
            setError(errorData?.error || 'Failed to resend OTP');
        } finally {
            setLoading(false);
        }
    };

    // Step 1: Registration Form
    if (step === 1) {
        return (
            <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[calc(100vh-200px)]">
                <div className="card w-full max-w-md p-8">
                    <h2 className="text-3xl font-bold text-center mb-2">Create Account</h2>
                    <p className="text-gray-600 text-center mb-8">Join OLX Clone to start buying and selling</p>

                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6 text-center">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleRegisterSubmit} className="space-y-4">
                        <div className="form-group">
                            <label htmlFor="username" className="block text-gray-700 font-medium mb-1">Username *</label>
                            <input
                                type="text"
                                id="username"
                                name="username"
                                className="input-field"
                                value={formData.username}
                                onChange={handleChange}
                                placeholder="Choose a username"
                                required
                                autoComplete="username"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="email" className="block text-gray-700 font-medium mb-1">Email *</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                className="input-field"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="your.email@example.com"
                                required
                                autoComplete="email"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="form-group">
                                <label htmlFor="password" className="block text-gray-700 font-medium mb-1">Password *</label>
                                <input
                                    type="password"
                                    id="password"
                                    name="password"
                                    className="input-field"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="Min 6 chars"
                                    required
                                    autoComplete="new-password"
                                    minLength={6}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="confirm_password" className="block text-gray-700 font-medium mb-1">Confirm *</label>
                                <input
                                    type="password"
                                    id="confirm_password"
                                    name="confirm_password"
                                    className="input-field"
                                    value={formData.confirm_password}
                                    onChange={handleChange}
                                    placeholder="Re-enter"
                                    required
                                    autoComplete="new-password"
                                    minLength={6}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="phone_number" className="block text-gray-700 font-medium mb-1">Phone Number</label>
                            <input
                                type="tel"
                                id="phone_number"
                                name="phone_number"
                                className="input-field"
                                value={formData.phone_number}
                                onChange={handleChange}
                                placeholder="Your phone number"
                                autoComplete="tel"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="location" className="block text-gray-700 font-medium mb-1">Location</label>
                            <input
                                type="text"
                                id="location"
                                name="location"
                                className="input-field"
                                value={formData.location}
                                onChange={handleChange}
                                placeholder="Your city or area"
                                autoComplete="address-level2"
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn-primary w-full mt-2"
                            disabled={loading}
                        >
                            {loading ? 'Sending OTP...' : 'Continue'}
                        </button>
                    </form>

                    <div className="mt-6 text-center text-gray-600">
                        <p>
                            Already have an account?{' '}
                            <Link to="/login" className="text-primary-600 hover:text-primary-700 font-semibold">
                                Login here
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Step 2: OTP Verification
    return (
        <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[calc(100vh-200px)]">
            <div className="card w-full max-w-md p-8">
                <h2 className="text-3xl font-bold text-center mb-2">Verify Your Email</h2>
                <p className="text-gray-600 text-center mb-8">
                    We've sent a 6-digit code to <strong className="text-gray-900">{formData.email}</strong>
                </p>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6 text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleOTPSubmit} className="space-y-6">
                    <div className="form-group text-center">
                        <label htmlFor="otp" className="block text-gray-700 font-medium mb-2">Enter OTP</label>
                        <input
                            type="text"
                            id="otp"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            placeholder="000000"
                            required
                            maxLength={6}
                            pattern="\d{6}"
                            className="input-field text-center text-2xl tracking-[0.5em] font-mono h-16 w-3/4 mx-auto"
                            autoComplete="one-time-code"
                            autoFocus
                        />
                        <div className="text-sm text-gray-500 mt-2">Code expires in 5 minutes</div>
                    </div>

                    <button
                        type="submit"
                        className="btn-primary w-full"
                        disabled={loading || otp.length !== 6}
                    >
                        {loading ? 'Verifying...' : 'Verify & Create Account'}
                    </button>
                </form>

                <div className="mt-8 text-center space-y-4">
                    <p className="text-gray-600">
                        Didn't receive the code?{' '}
                        <button
                            type="button"
                            onClick={handleResendOTP}
                            disabled={resendCooldown > 0 || loading}
                            className={`font-semibold ${resendCooldown > 0 ? 'text-gray-400 cursor-not-allowed' : 'text-primary-600 hover:text-primary-700'}`}
                        >
                            {resendCooldown > 0
                                ? `Resend in ${resendCooldown}s`
                                : 'Resend OTP'}
                        </button>
                    </p>
                    <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="text-sm text-gray-500 hover:text-gray-700 flex items-center justify-center w-full"
                    >
                        ← Back to registration
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Register;

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
            <div className="auth-container">
                <div className="auth-card">
                    <h2>Create Account</h2>
                    <p className="auth-subtitle">Join OLX Clone to start buying and selling</p>

                    {error && (
                        <div className="error-message">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleRegisterSubmit} className="auth-form">
                        <div className="form-group">
                            <label htmlFor="username">Username *</label>
                            <input
                                type="text"
                                id="username"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                placeholder="Choose a username"
                                required
                                autoComplete="username"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="email">Email *</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="your.email@example.com"
                                required
                                autoComplete="email"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="password">Password *</label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="At least 6 characters"
                                required
                                autoComplete="new-password"
                                minLength={6}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="confirm_password">Confirm Password *</label>
                            <input
                                type="password"
                                id="confirm_password"
                                name="confirm_password"
                                value={formData.confirm_password}
                                onChange={handleChange}
                                placeholder="Re-enter your password"
                                required
                                autoComplete="new-password"
                                minLength={6}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="phone_number">Phone Number</label>
                            <input
                                type="tel"
                                id="phone_number"
                                name="phone_number"
                                value={formData.phone_number}
                                onChange={handleChange}
                                placeholder="Your phone number"
                                autoComplete="tel"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="location">Location</label>
                            <input
                                type="text"
                                id="location"
                                name="location"
                                value={formData.location}
                                onChange={handleChange}
                                placeholder="Your city or area"
                                autoComplete="address-level2"
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn-primary btn-block"
                            disabled={loading}
                        >
                            {loading ? 'Sending OTP...' : 'Continue'}
                        </button>
                    </form>

                    <div className="auth-footer">
                        <p>
                            Already have an account?{' '}
                            <Link to="/login">Login here</Link>
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Step 2: OTP Verification
    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2>Verify Your Email</h2>
                <p className="auth-subtitle">
                    We've sent a 6-digit code to <strong>{formData.email}</strong>
                </p>

                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

                <form onSubmit={handleOTPSubmit} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="otp">Enter OTP</label>
                        <input
                            type="text"
                            id="otp"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            placeholder="000000"
                            required
                            maxLength={6}
                            pattern="\d{6}"
                            className="otp-input"
                            autoComplete="one-time-code"
                        />
                        <small className="form-hint">Code expires in 5 minutes</small>
                    </div>

                    <button
                        type="submit"
                        className="btn-primary btn-block"
                        disabled={loading || otp.length !== 6}
                    >
                        {loading ? 'Verifying...' : 'Verify & Create Account'}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>
                        Didn't receive the code?{' '}
                        <button
                            type="button"
                            onClick={handleResendOTP}
                            disabled={resendCooldown > 0 || loading}
                            className="link-button"
                        >
                            {resendCooldown > 0
                                ? `Resend in ${resendCooldown}s`
                                : 'Resend OTP'}
                        </button>
                    </p>
                    <p>
                        <button
                            type="button"
                            onClick={() => setStep(1)}
                            className="link-button"
                        >
                            ← Back to registration
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;

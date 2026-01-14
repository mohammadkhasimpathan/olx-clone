import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/authService';

const ForgotPassword = () => {
    const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [passwordData, setPasswordData] = useState({
        new_password: '',
        confirm_password: ''
    });
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Step 1: Request Password Reset
    const handleRequestReset = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setLoading(true);

        try {
            await authService.requestPasswordReset(email);
            setStep(2);
            setMessage('If an account exists, an OTP has been sent to your email.');
        } catch (err) {
            setError('Failed to process request. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Verify OTP
    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // We use a specific endpoint to verify OTP before showing password reset form
            // Or we can just move to step 3 and submit everything together.
            // But good UX verifies OTP first. 
            // The backend has VerifyResetOTPView
            await authService.verifyResetOTP(email, otp);
            setStep(3);
            setMessage('OTP verified. Please set your new password.');
        } catch (err) {
            setError('Invalid or expired OTP.');
        } finally {
            setLoading(false);
        }
    };

    // Step 3: Reset Password
    const handleResetPassword = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (passwordData.new_password !== passwordData.confirm_password) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        if (passwordData.new_password.length < 6) {
            setError('Password must be at least 6 characters');
            setLoading(false);
            return;
        }

        try {
            await authService.resetPassword({
                email,
                otp,
                new_password: passwordData.new_password
            });
            navigate('/login', {
                state: { message: 'Password reset successful! Please login with your new password.' }
            });
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to reset password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2>Reset Password</h2>

                {step === 1 && <p className="auth-subtitle">Enter your email to receive a reset code</p>}
                {step === 2 && <p className="auth-subtitle">Enter the 6-digit code sent to {email}</p>}
                {step === 3 && <p className="auth-subtitle">Create a strong new password</p>}

                {message && <div className="success-message">{message}</div>}
                {error && <div className="error-message">{error}</div>}

                {/* Step 1 Form */}
                {step === 1 && (
                    <form onSubmit={handleRequestReset} className="auth-form">
                        <div className="form-group">
                            <label htmlFor="email">Email Address</label>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="your.email@example.com"
                                required
                            />
                        </div>
                        <button type="submit" className="btn-primary btn-block" disabled={loading}>
                            {loading ? 'Sending Code...' : 'Send Reset Code'}
                        </button>
                    </form>
                )}

                {/* Step 2 Form */}
                {step === 2 && (
                    <form onSubmit={handleVerifyOTP} className="auth-form">
                        <div className="form-group">
                            <label htmlFor="otp">Enter OTP</label>
                            <input
                                type="text"
                                id="otp"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                placeholder="000000"
                                maxLength={6}
                                required
                            />
                        </div>
                        <button type="submit" className="btn-primary btn-block" disabled={loading}>
                            {loading ? 'Verifying...' : 'Verify Code'}
                        </button>
                        <button
                            type="button"
                            className="link-button mt-2"
                            onClick={() => setStep(1)}
                        >
                            Change Email
                        </button>
                    </form>
                )}

                {/* Step 3 Form */}
                {step === 3 && (
                    <form onSubmit={handleResetPassword} className="auth-form">
                        <div className="form-group">
                            <label htmlFor="new_password">New Password</label>
                            <input
                                type="password"
                                id="new_password"
                                value={passwordData.new_password}
                                onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                                placeholder="New password"
                                required
                                minLength={6}
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="confirm_password">Confirm Password</label>
                            <input
                                type="password"
                                id="confirm_password"
                                value={passwordData.confirm_password}
                                onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                                placeholder="Confirm new password"
                                required
                                minLength={6}
                            />
                        </div>
                        <button type="submit" className="btn-primary btn-block" disabled={loading}>
                            {loading ? 'Resetting...' : 'Reset Password'}
                        </button>
                    </form>
                )}

                <div className="auth-footer">
                    <p>
                        Remember your password?{' '}
                        <Link to="/login">Login here</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;

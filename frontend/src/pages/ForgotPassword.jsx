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

        if (newPassword !== confirmPassword) { // Updated to use newPassword and confirmPassword
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        if (newPassword.length < 6) { // Updated to use newPassword
            setError('Password must be at least 6 characters');
            setLoading(false);
            return;
        }

        try {
            await authService.resetPassword({
                email,
                otp,
                new_password: newPassword // Updated to use newPassword
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
        <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[calc(10vh-200px)]">
            <div className="card w-full max-w-md p-8">
                <h2 className="text-3xl font-bold text-center mb-8">Reset Password</h2>

                {/* Progress indicator */}
                <div className="flex justify-between mb-8 px-4">
                    <div className={`flex flex-col items-center ${step >= 1 ? 'text-primary-600' : 'text-gray-400'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold mb-1 ${step >= 1 ? 'bg-primary-600 text-white' : 'bg-gray-200'}`}>1</div>
                        <span className="text-xs">Email</span>
                    </div>
                    <div className={`flex-1 h-0.5 mt-4 mx-2 ${step >= 2 ? 'bg-primary-600' : 'bg-gray-200'}`}></div>
                    <div className={`flex flex-col items-center ${step >= 2 ? 'text-primary-600' : 'text-gray-400'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold mb-1 ${step >= 2 ? 'bg-primary-600 text-white' : 'bg-gray-200'}`}>2</div>
                        <span className="text-xs">Verify</span>
                    </div>
                    <div className={`flex-1 h-0.5 mt-4 mx-2 ${step >= 3 ? 'bg-primary-600' : 'bg-gray-200'}`}></div>
                    <div className={`flex flex-col items-center ${step >= 3 ? 'text-primary-600' : 'text-gray-400'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold mb-1 ${step >= 3 ? 'bg-primary-600 text-white' : 'bg-gray-200'}`}>3</div>
                        <span className="text-xs">Reset</span>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6 text-center">
                        {error}
                    </div>
                )}

                {message && (
                    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6 text-center">
                        {message}
                    </div>
                )}

                {/* Step 1: Enter Email */}
                {step === 1 && (
                    <form onSubmit={handleRequestReset} className="space-y-6">
                        <div className="text-center text-gray-600 mb-6">
                            Enter your email address to receive a verification code.
                        </div>

                        <div className="form-group">
                            <label className="block text-gray-700 font-medium mb-2">Email Address</label>
                            <input
                                type="email"
                                className="input-field"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="your.email@example.com"
                                required
                                disabled={loading}
                                autoFocus
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn-primary w-full"
                            disabled={loading}
                        >
                            {loading ? 'Sending...' : 'Send Reset Code'}
                        </button>
                    </form>
                )}

                {/* Step 2: Verify OTP */}
                {step === 2 && (
                    <form onSubmit={handleVerifyOTP} className="space-y-6">
                        <div className="text-center text-gray-600 mb-6">
                            Enter the 6-digit code sent to <strong className="text-gray-900">{email}</strong>
                        </div>

                        <div className="form-group text-center">
                            <label className="block text-gray-700 font-medium mb-2">Verification Code</label>
                            <input
                                type="text"
                                className="input-field text-center text-2xl tracking-[0.5em] font-mono h-16 w-3/4 mx-auto"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                placeholder="000000"
                                maxLength="6"
                                required
                                disabled={loading}
                                autoFocus
                            />
                            <p className="text-sm text-gray-500 mt-2">Code expires in 5 minutes</p>
                        </div>

                        <button
                            type="submit"
                            className="btn-primary w-full"
                            disabled={loading || otp.length !== 6}
                        >
                            {loading ? 'Verifying...' : 'Verify Code'}
                        </button>

                        <button
                            type="button"
                            onClick={() => setStep(1)}
                            className="text-sm text-gray-500 hover:text-gray-700 flex items-center justify-center w-full mt-4"
                        >
                            ← Change email address
                        </button>
                    </form>
                )}

                {/* Step 3: Reset Password */}
                {step === 3 && (
                    <form onSubmit={handleResetPassword} className="space-y-6">
                        <div className="text-center text-gray-600 mb-6">
                            Create a strong new password for your account.
                        </div>

                        <div className="form-group">
                            <label className="block text-gray-700 font-medium mb-2">New Password</label>
                            <input
                                type="password"
                                className="input-field"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Min 8 characters"
                                required
                                disabled={loading}
                                autoFocus
                            />
                        </div>

                        <div className="form-group">
                            <label className="block text-gray-700 font-medium mb-2">Confirm Password</label>
                            <input
                                type="password"
                                className="input-field"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Re-enter password"
                                required
                                disabled={loading}
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn-primary w-full"
                            disabled={loading}
                        >
                            {loading ? 'Resetting...' : 'Reset Password'}
                        </button>
                    </form>
                )}

                <div className="mt-8 text-center">
                    <Link to="/login" className="text-gray-500 hover:text-gray-700">
                        Back to Login
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;

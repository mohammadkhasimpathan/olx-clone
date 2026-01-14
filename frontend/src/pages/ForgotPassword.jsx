import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';

const ForgotPassword = () => {
    const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    // Step 1: Request password reset
    const handleRequestReset = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setLoading(true);

        try {
            const response = await authService.requestPasswordReset(email);
            setMessage(response.message);
            setStep(2); // Move to OTP verification step
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to send reset code. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Verify OTP
    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setLoading(true);

        try {
            const response = await authService.verifyResetOTP(email, otp);
            setMessage(response.message);
            setStep(3); // Move to password reset step
        } catch (err) {
            setError(err.response?.data?.error || 'Invalid or expired OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Step 3: Reset password
    const handleResetPassword = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (newPassword.length < 8) {
            setError('Password must be at least 8 characters long');
            return;
        }

        setLoading(true);

        try {
            const response = await authService.resetPassword(email, otp, newPassword, confirmPassword);
            setMessage(response.message);

            // Redirect to login after 2 seconds
            setTimeout(() => {
                navigate('/login', { state: { message: 'Password reset successful! You can now login.' } });
            }, 2000);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to reset password. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-md mx-auto card p-8">
                <h1 className="text-3xl font-bold mb-2">Reset Password</h1>

                {/* Progress indicator */}
                <div className="flex justify-between mb-6">
                    <div className={`flex-1 text-center ${step >= 1 ? 'text-primary-600 font-semibold' : 'text-gray-400'}`}>
                        <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center ${step >= 1 ? 'bg-primary-600 text-white' : 'bg-gray-300'}`}>
                            1
                        </div>
                        <p className="text-xs mt-1">Email</p>
                    </div>
                    <div className={`flex-1 text-center ${step >= 2 ? 'text-primary-600 font-semibold' : 'text-gray-400'}`}>
                        <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center ${step >= 2 ? 'bg-primary-600 text-white' : 'bg-gray-300'}`}>
                            2
                        </div>
                        <p className="text-xs mt-1">Verify</p>
                    </div>
                    <div className={`flex-1 text-center ${step >= 3 ? 'text-primary-600 font-semibold' : 'text-gray-400'}`}>
                        <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center ${step >= 3 ? 'bg-primary-600 text-white' : 'bg-gray-300'}`}>
                            3
                        </div>
                        <p className="text-xs mt-1">Reset</p>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                        {error}
                    </div>
                )}

                {message && (
                    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                        {message}
                    </div>
                )}

                {/* Step 1: Enter Email */}
                {step === 1 && (
                    <form onSubmit={handleRequestReset}>
                        <p className="text-gray-600 mb-4">
                            Enter your email address and we'll send you a verification code to reset your password.
                        </p>

                        <div className="mb-6">
                            <label className="block text-gray-700 mb-2">Email Address</label>
                            <input
                                type="email"
                                className="input-field"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
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
                    <form onSubmit={handleVerifyOTP}>
                        <p className="text-gray-600 mb-4">
                            We've sent a 6-digit code to <strong>{email}</strong>
                        </p>

                        <div className="mb-6">
                            <label className="block text-gray-700 mb-2">Verification Code</label>
                            <input
                                type="text"
                                className="input-field text-center text-2xl tracking-widest"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                placeholder="000000"
                                maxLength="6"
                                required
                                disabled={loading}
                                autoFocus
                            />
                            <p className="text-sm text-gray-500 mt-1">Code expires in 5 minutes</p>
                        </div>

                        <button
                            type="submit"
                            className="btn-primary w-full mb-2"
                            disabled={loading || otp.length !== 6}
                        >
                            {loading ? 'Verifying...' : 'Verify Code'}
                        </button>

                        <button
                            type="button"
                            onClick={() => setStep(1)}
                            className="btn-secondary w-full"
                        >
                            Back
                        </button>
                    </form>
                )}

                {/* Step 3: Reset Password */}
                {step === 3 && (
                    <form onSubmit={handleResetPassword}>
                        <p className="text-gray-600 mb-4">
                            Enter your new password
                        </p>

                        <div className="mb-4">
                            <label className="block text-gray-700 mb-2">New Password</label>
                            <input
                                type="password"
                                className="input-field"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                disabled={loading}
                                autoFocus
                            />
                        </div>

                        <div className="mb-6">
                            <label className="block text-gray-700 mb-2">Confirm Password</label>
                            <input
                                type="password"
                                className="input-field"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
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

                <div className="mt-6 text-center">
                    <button
                        onClick={() => navigate('/login')}
                        className="text-gray-600 hover:text-gray-800"
                    >
                        Back to Login
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;

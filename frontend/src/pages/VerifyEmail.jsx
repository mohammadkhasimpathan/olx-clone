import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../services/authService';

const VerifyEmail = () => {
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [countdown, setCountdown] = useState(0);

    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        // Get email from navigation state or query params
        const emailFromState = location.state?.email;
        if (emailFromState) {
            setEmail(emailFromState);
        }
    }, [location]);

    useEffect(() => {
        // Countdown timer for resend button
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    const handleVerify = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setLoading(true);

        try {
            const response = await authService.verifyEmail(email, otp);
            setMessage(response.message);

            // Redirect to login after 2 seconds
            setTimeout(() => {
                navigate('/login', { state: { message: 'Email verified! You can now login.' } });
            }, 2000);
        } catch (err) {
            setError(err.response?.data?.error || 'Verification failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleResendOTP = async () => {
        if (countdown > 0) return;

        setError('');
        setMessage('');
        setResendLoading(true);

        try {
            const response = await authService.resendOTP(email);
            setMessage(response.message);
            setCountdown(60); // 60 seconds cooldown
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to resend OTP. Please try again.');
        } finally {
            setResendLoading(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-md mx-auto card p-8">
                <h1 className="text-3xl font-bold mb-2">Verify Your Email</h1>
                <p className="text-gray-600 mb-6">
                    We've sent a verification code to <strong>{email}</strong>
                </p>



                <form onSubmit={handleVerify}>
                    <div className="mb-4">
                        <label className="block text-gray-700 mb-2">Email</label>
                        <input
                            type="email"
                            className="input-field"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            disabled={loading}
                        />
                    </div>

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
                        <p className="text-sm text-gray-500 mt-1">Enter the 6-digit code sent to your email</p>
                    </div>

                    <button
                        type="submit"
                        className="btn-primary w-full mb-4"
                        disabled={loading || otp.length !== 6}
                    >
                        {loading ? 'Verifying...' : 'Verify Email'}
                    </button>

                    <div className="text-center">
                        <p className="text-sm text-gray-600 mb-2">Didn't receive the code?</p>
                        <button
                            type="button"
                            onClick={handleResendOTP}
                            className="text-primary-600 hover:text-primary-700 font-medium"
                            disabled={resendLoading || countdown > 0}
                        >
                            {resendLoading ? 'Sending...' : countdown > 0 ? `Resend in ${countdown}s` : 'Resend Code'}
                        </button>
                    </div>
                </form>

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

export default VerifyEmail;

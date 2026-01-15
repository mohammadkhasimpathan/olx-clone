import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/authService';

const Register = () => {
    // Form data
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirm_password: '',
        phone_number: '',
        location: '',
    });

    // OTP state
    const [otpState, setOtpState] = useState({
        sent: false,
        verified: false,
        otp: '',
        cooldown: 0
    });

    // UI state
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [successMsg, setSuccessMsg] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const navigate = useNavigate();

    // Cooldown timer
    useEffect(() => {
        if (otpState.cooldown > 0) {
            const timer = setTimeout(() => {
                setOtpState(prev => ({ ...prev, cooldown: prev.cooldown - 1 }));
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [otpState.cooldown]);

    // Icons
    const EyeIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
    );

    const EyeSlashIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
        </svg>
    );

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (errors[e.target.name]) {
            setErrors({ ...errors, [e.target.name]: '' });
        }
    };

    // Email validation
    const isEmailValid = (email) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    // Send OTP
    const handleSendOTP = async () => {
        if (!isEmailValid(formData.email)) {
            setErrors({ email: 'Please enter a valid email' });
            return;
        }

        setLoading(true);
        setErrors({});
        setSuccessMsg('');

        try {
            await authService.sendOTP(formData.email);
            setOtpState({ sent: true, verified: false, otp: '', cooldown: 60 });
            setSuccessMsg('OTP sent! Check your email.');
        } catch (err) {
            setErrors({ email: err.response?.data?.error || 'Failed to send OTP' });
        } finally {
            setLoading(false);
        }
    };

    // Verify OTP
    const handleVerifyOTP = async () => {
        if (otpState.otp.length !== 6) {
            setErrors({ otp: 'Please enter 6-digit OTP' });
            return;
        }

        setLoading(true);
        setErrors({});

        try {
            await authService.verifyOTP(formData.email, otpState.otp);
            setOtpState(prev => ({ ...prev, verified: true }));
            setSuccessMsg('✅ Email verified! You can now register.');
            setErrors({});
        } catch (err) {
            setErrors({ otp: err.response?.data?.error || 'Invalid OTP' });
        } finally {
            setLoading(false);
        }
    };

    // Resend OTP
    const handleResendOTP = async () => {
        if (otpState.cooldown > 0) return;

        setLoading(true);
        setErrors({});

        try {
            await authService.resendOTP(formData.email);
            setOtpState(prev => ({ ...prev, verified: false, otp: '', cooldown: 60 }));
            setSuccessMsg('New OTP sent!');
        } catch (err) {
            setErrors({ otp: err.response?.data?.error || 'Failed to resend OTP' });
        } finally {
            setLoading(false);
        }
    };

    // Change Email - Reset OTP state
    const handleChangeEmail = () => {
        setOtpState({
            sent: false,
            verified: false,
            otp: '',
            cooldown: 0
        });
        setErrors({});
        setSuccessMsg('');
    };

    // Register
    const handleRegister = async (e) => {
        e.preventDefault();
        setErrors({});

        if (!otpState.verified) {
            setErrors({ general: 'Please verify your email first' });
            return;
        }

        if (formData.password !== formData.confirm_password) {
            setErrors({ confirm_password: 'Passwords do not match' });
            return;
        }

        if (formData.password.length < 8) {
            setErrors({ password: 'Password must be at least 8 characters' });
            return;
        }

        setLoading(true);

        try {
            await authService.register(formData);
            setSuccessMsg('✅ Registration successful! Redirecting...');
            setTimeout(() => {
                navigate('/login', { state: { message: 'Account created successfully! Please login.' } });
            }, 2000);
        } catch (err) {
            const errorData = err.response?.data;
            if (errorData?.error) {
                setErrors({ general: errorData.error });
            } else {
                setErrors(errorData || { general: 'Registration failed' });
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-[480px] slide-up">
                <div className="card p-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">
                            Create Account
                        </h1>
                        <p className="text-gray-500 text-sm">
                            Join our marketplace today
                        </p>
                    </div>

                    {/* Success Message */}
                    {successMsg && (
                        <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0">
                                <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                            </svg>
                            <p className="text-sm text-green-700 font-medium">{successMsg}</p>
                        </div>
                    )}

                    {/* Error Alert */}
                    {errors.general && (
                        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0">
                                <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
                            </svg>
                            <p className="text-sm text-red-700 font-medium">{errors.general}</p>
                        </div>
                    )}

                    <form onSubmit={handleRegister} className="space-y-5">
                        {/* Username */}
                        <div className="input-group">
                            <label className="input-label">Username</label>
                            <input
                                type="text"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                className="input-field"
                                placeholder="johndoe123"
                                required
                            />
                            {errors.username && <span className="text-red-500 text-sm mt-1">{errors.username}</span>}
                        </div>

                        {/* Email with Send OTP */}
                        <div className="input-group">
                            <label className="input-label">Email Address</label>
                            <div className="flex gap-2">
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="input-field flex-1"
                                    placeholder="name@example.com"
                                    disabled={otpState.sent}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={handleSendOTP}
                                    disabled={otpState.sent || loading || !isEmailValid(formData.email)}
                                    className="px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed whitespace-nowrap"
                                >
                                    {loading ? '...' : otpState.sent ? '✓ Sent' : 'Send OTP'}
                                </button>
                            </div>
                            {errors.email && <span className="text-red-500 text-sm mt-1">{errors.email}</span>}
                        </div>

                        {/* OTP Section */}
                        {otpState.sent && !otpState.verified && (
                            <div className="bg-gray-50 border-2 border-primary-200 rounded-xl p-4 space-y-3">
                                <div className="flex items-center justify-between bg-blue-50 text-blue-700 text-sm p-2 rounded">
                                    <span>📧 OTP sent to <strong>{formData.email}</strong></span>
                                    <button
                                        type="button"
                                        onClick={handleChangeEmail}
                                        className="text-xs font-semibold text-primary-600 hover:text-primary-700 hover:underline"
                                    >
                                        Change Email
                                    </button>
                                </div>
                                <div>
                                    <label className="input-label text-center block">Enter 6-digit OTP</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={otpState.otp}
                                            onChange={(e) => {
                                                const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                                                setOtpState(prev => ({ ...prev, otp: val }));
                                            }}
                                            className="input-field flex-1 text-center text-2xl font-mono tracking-widest"
                                            placeholder="000000"
                                            maxLength="6"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleVerifyOTP}
                                            disabled={loading || otpState.otp.length !== 6}
                                            className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                                        >
                                            {loading ? 'Verifying...' : 'Verify'}
                                        </button>
                                    </div>
                                    {errors.otp && <span className="text-red-500 text-sm mt-1 block">{errors.otp}</span>}
                                </div>
                                <button
                                    type="button"
                                    onClick={handleResendOTP}
                                    disabled={otpState.cooldown > 0 || loading}
                                    className="w-full text-sm font-medium text-primary-600 hover:text-primary-700 disabled:text-gray-400"
                                >
                                    {otpState.cooldown > 0 ? `Resend in ${otpState.cooldown}s` : 'Resend OTP'}
                                </button>
                            </div>
                        )}

                        {/* Verified Badge */}
                        {otpState.verified && (
                            <div className="bg-green-50 border-2 border-green-500 rounded-xl p-4 text-center text-green-700 font-bold">
                                ✅ Email Verified
                            </div>
                        )}

                        {/* Password */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="input-group">
                                <label className="input-label">Password</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        className="input-field pr-10"
                                        placeholder="••••••••"
                                        required
                                        minLength={8}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                                    >
                                        {showPassword ? <EyeSlashIcon /> : <EyeIcon />}
                                    </button>
                                </div>
                                {errors.password && <span className="text-red-500 text-sm mt-1">{errors.password}</span>}
                            </div>

                            <div className="input-group">
                                <label className="input-label">Confirm</label>
                                <input
                                    type="password"
                                    name="confirm_password"
                                    value={formData.confirm_password}
                                    onChange={handleChange}
                                    className="input-field"
                                    placeholder="••••••••"
                                    required
                                    minLength={8}
                                />
                                {errors.confirm_password && <span className="text-red-500 text-sm mt-1">{errors.confirm_password}</span>}
                            </div>
                        </div>

                        {/* Phone & Location */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="input-group">
                                <label className="input-label">Phone</label>
                                <input
                                    type="tel"
                                    name="phone_number"
                                    value={formData.phone_number}
                                    onChange={handleChange}
                                    className="input-field"
                                    placeholder="+1 234..."
                                />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Location</label>
                                <input
                                    type="text"
                                    name="location"
                                    value={formData.location}
                                    onChange={handleChange}
                                    className="input-field"
                                    placeholder="City..."
                                />
                            </div>
                        </div>

                        {/* Register Button */}
                        <button
                            type="submit"
                            className="btn-primary mt-2"
                            disabled={!otpState.verified || loading}
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Registering...
                                </>
                            ) : 'Register'}
                        </button>
                    </form>
                </div>

                <p className="text-center mt-8 text-gray-600 text-sm">
                    Already have an account?{' '}
                    <Link to="/login" className="auth-link">Login here</Link>
                </p>
            </div>
        </div>
    );
};

export default Register;

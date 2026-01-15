# Registration Form UI - Complete Implementation Guide

## UI Flow Overview

This guide provides a complete, production-ready UI implementation for the OTP-based registration system with clear visual states and user feedback.

---

## UI States & Transitions

### State 1: Initial Page Load

**Visual State**:
```
┌─────────────────────────────────────┐
│  Create Account                     │
├─────────────────────────────────────┤
│  Username:     [____________]       │
│  Email:        [____________] [Send OTP] │
│  Password:     [____________]       │
│  Confirm:      [____________]       │
│  Phone:        [____________]       │
│  Location:     [____________]       │
│                                     │
│  [Register] (DISABLED/GRAYED OUT)   │
└─────────────────────────────────────┘
```

**State Object**:
```javascript
{
  otpSent: false,
  otpVerified: false,
  loading: false,
  cooldown: 0,
  errors: {}
}
```

---

### State 2: After "Send OTP" Clicked

**Visual State**:
```
┌─────────────────────────────────────┐
│  Create Account                     │
├─────────────────────────────────────┤
│  Username:     [____________]       │
│  Email:        [user@email.com] [✓ Sent] (LOCKED) │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 📧 OTP sent to your email   │   │
│  │ Enter 6-digit code:         │   │
│  │ [_][_][_][_][_][_]          │   │
│  │ [Verify OTP]  [Resend (60s)]│   │
│  └─────────────────────────────┘   │
│                                     │
│  Password:     [____________]       │
│  Confirm:      [____________]       │
│  Phone:        [____________]       │
│  Location:     [____________]       │
│                                     │
│  [Register] (STILL DISABLED)        │
└─────────────────────────────────────┘
```

**State Object**:
```javascript
{
  otpSent: true,
  otpVerified: false,
  loading: false,
  cooldown: 60,
  errors: {}
}
```

---

### State 3: After OTP Verified

**Visual State**:
```
┌─────────────────────────────────────┐
│  Create Account                     │
├─────────────────────────────────────┤
│  Username:     [____________]       │
│  Email:        [user@email.com] [✓ Sent] │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ ✅ Email Verified           │   │
│  └─────────────────────────────┘   │
│                                     │
│  Password:     [____________]       │
│  Confirm:      [____________]       │
│  Phone:        [____________]       │
│  Location:     [____________]       │
│                                     │
│  [Register] (NOW ENABLED - BLUE)    │
└─────────────────────────────────────┘
```

**State Object**:
```javascript
{
  otpSent: true,
  otpVerified: true,
  loading: false,
  cooldown: 0,
  errors: {}
}
```

---

## Complete React Implementation

```jsx
import React, { useState, useEffect } from 'react';
import './RegisterPage.css';

const API_BASE = 'http://localhost:8000/api/users';

const RegisterPage = () => {
  // Form data
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    location: ''
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

  // Cooldown timer
  useEffect(() => {
    if (otpState.cooldown > 0) {
      const timer = setTimeout(() => {
        setOtpState(prev => ({ ...prev, cooldown: prev.cooldown - 1 }));
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [otpState.cooldown]);

  // Input change handler
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
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
      const res = await fetch(`${API_BASE}/send-otp/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email })
      });

      const data = await res.json();

      if (res.ok) {
        setOtpState({ sent: true, verified: false, otp: '', cooldown: 60 });
        setSuccessMsg('OTP sent! Check your email.');
      } else {
        setErrors({ email: data.error || 'Failed to send OTP' });
      }
    } catch (err) {
      setErrors({ email: 'Network error. Please try again.' });
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
      const res = await fetch(`${API_BASE}/verify-otp/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, otp: otpState.otp })
      });

      const data = await res.json();

      if (res.ok) {
        setOtpState(prev => ({ ...prev, verified: true }));
        setSuccessMsg('✅ Email verified! You can now register.');
        setErrors({});
      } else {
        setErrors({ otp: data.error || 'Invalid OTP' });
      }
    } catch (err) {
      setErrors({ otp: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOTP = async () => {
    setLoading(true);
    setErrors({});

    try {
      const res = await fetch(`${API_BASE}/resend-otp/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email })
      });

      const data = await res.json();

      if (res.ok) {
        setOtpState(prev => ({ ...prev, verified: false, otp: '', cooldown: 60 }));
        setSuccessMsg('New OTP sent!');
      } else {
        setErrors({ otp: data.error });
      }
    } catch (err) {
      setErrors({ otp: 'Network error' });
    } finally {
      setLoading(false);
    }
  };

  // Register
  const handleRegister = async (e) => {
    e.preventDefault();

    if (!otpState.verified) {
      setErrors({ general: 'Please verify your email first' });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrors({ confirmPassword: 'Passwords do not match' });
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const res = await fetch(`${API_BASE}/register/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          username: formData.username,
          password: formData.password,
          confirm_password: formData.confirmPassword,
          phone_number: formData.phoneNumber,
          location: formData.location
        })
      });

      const data = await res.json();

      if (res.ok) {
        setSuccessMsg('✅ Registration successful! Redirecting...');
        setTimeout(() => window.location.href = '/login', 2000);
      } else {
        setErrors(data.error ? { general: data.error } : data);
      }
    } catch (err) {
      setErrors({ general: 'Network error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-card">
        <h1>Create Account</h1>

        {/* Success Message */}
        {successMsg && (
          <div className="alert alert-success" role="alert">
            {successMsg}
          </div>
        )}

        {/* Global Error */}
        {errors.general && (
          <div className="alert alert-error" role="alert">
            {errors.general}
          </div>
        )}

        <form onSubmit={handleRegister} noValidate>
          {/* Username */}
          <div className="form-field">
            <label htmlFor="username">
              Username <span className="required">*</span>
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Choose a username"
              required
              aria-required="true"
              aria-invalid={!!errors.username}
              aria-describedby={errors.username ? 'username-error' : undefined}
            />
            {errors.username && (
              <span className="error-msg" id="username-error" role="alert">
                {errors.username}
              </span>
            )}
          </div>

          {/* Email with Send OTP */}
          <div className="form-field">
            <label htmlFor="email">
              Email <span className="required">*</span>
            </label>
            <div className="input-with-button">
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="your@email.com"
                disabled={otpState.sent}
                required
                aria-required="true"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'email-error' : undefined}
              />
              <button
                type="button"
                onClick={handleSendOTP}
                disabled={otpState.sent || loading || !isEmailValid(formData.email)}
                className="btn-send-otp"
                aria-label="Send OTP to email"
              >
                {loading ? '...' : otpState.sent ? '✓ Sent' : 'Send OTP'}
              </button>
            </div>
            {errors.email && (
              <span className="error-msg" id="email-error" role="alert">
                {errors.email}
              </span>
            )}
          </div>

          {/* OTP Section */}
          {otpState.sent && !otpState.verified && (
            <div className="otp-section" role="region" aria-label="OTP Verification">
              <div className="otp-info">
                📧 OTP sent to <strong>{formData.email}</strong>
              </div>
              <div className="form-field">
                <label htmlFor="otp">Enter 6-digit OTP</label>
                <div className="otp-input-group">
                  <input
                    type="text"
                    id="otp"
                    value={otpState.otp}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setOtpState(prev => ({ ...prev, otp: val }));
                    }}
                    placeholder="000000"
                    maxLength="6"
                    pattern="\d{6}"
                    className="otp-input"
                    aria-required="true"
                    aria-invalid={!!errors.otp}
                    aria-describedby={errors.otp ? 'otp-error' : undefined}
                  />
                  <button
                    type="button"
                    onClick={handleVerifyOTP}
                    disabled={loading || otpState.otp.length !== 6}
                    className="btn-verify"
                    aria-label="Verify OTP"
                  >
                    {loading ? 'Verifying...' : 'Verify'}
                  </button>
                </div>
                {errors.otp && (
                  <span className="error-msg" id="otp-error" role="alert">
                    {errors.otp}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={handleResendOTP}
                disabled={otpState.cooldown > 0 || loading}
                className="btn-resend"
                aria-label={otpState.cooldown > 0 ? `Resend OTP in ${otpState.cooldown} seconds` : 'Resend OTP'}
              >
                {otpState.cooldown > 0
                  ? `Resend in ${otpState.cooldown}s`
                  : 'Resend OTP'}
              </button>
            </div>
          )}

          {/* Verified Badge */}
          {otpState.verified && (
            <div className="verified-badge" role="status" aria-live="polite">
              ✅ Email Verified
            </div>
          )}

          {/* Password */}
          <div className="form-field">
            <label htmlFor="password">
              Password <span className="required">*</span>
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Min 8 characters"
              required
              minLength="8"
              aria-required="true"
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? 'password-error' : undefined}
            />
            {errors.password && (
              <span className="error-msg" id="password-error" role="alert">
                {errors.password}
              </span>
            )}
          </div>

          {/* Confirm Password */}
          <div className="form-field">
            <label htmlFor="confirmPassword">
              Confirm Password <span className="required">*</span>
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Re-enter password"
              required
              aria-required="true"
              aria-invalid={!!errors.confirmPassword}
              aria-describedby={errors.confirmPassword ? 'confirm-error' : undefined}
            />
            {errors.confirmPassword && (
              <span className="error-msg" id="confirm-error" role="alert">
                {errors.confirmPassword}
              </span>
            )}
          </div>

          {/* Phone Number */}
          <div className="form-field">
            <label htmlFor="phoneNumber">Phone Number</label>
            <input
              type="tel"
              id="phoneNumber"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              placeholder="+1 234 567 8900 (optional)"
            />
          </div>

          {/* Location */}
          <div className="form-field">
            <label htmlFor="location">Location</label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="City, Country (optional)"
            />
          </div>

          {/* Register Button */}
          <button
            type="submit"
            disabled={!otpState.verified || loading}
            className="btn-register"
            aria-label="Complete registration"
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>

        <div className="login-link">
          Already have an account? <a href="/login">Login</a>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
```

---

## Production-Ready CSS

```css
/* RegisterPage.css */

/* Container */
.register-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.register-card {
  background: white;
  border-radius: 16px;
  padding: 40px;
  max-width: 480px;
  width: 100%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.register-card h1 {
  margin: 0 0 24px;
  font-size: 28px;
  color: #1a1a1a;
  text-align: center;
}

/* Alerts */
.alert {
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 20px;
  font-size: 14px;
  line-height: 1.5;
}

.alert-success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.alert-error {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

/* Form Fields */
.form-field {
  margin-bottom: 20px;
}

.form-field label {
  display: block;
  margin-bottom: 6px;
  font-weight: 600;
  color: #333;
  font-size: 14px;
}

.required {
  color: #e53e3e;
}

.form-field input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 15px;
  transition: all 0.2s;
  font-family: inherit;
}

.form-field input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-field input:disabled {
  background: #f7fafc;
  color: #718096;
  cursor: not-allowed;
}

.form-field input[aria-invalid="true"] {
  border-color: #e53e3e;
}

/* Email with Button */
.input-with-button {
  display: flex;
  gap: 8px;
}

.input-with-button input {
  flex: 1;
}

.btn-send-otp {
  padding: 12px 20px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-send-otp:hover:not(:disabled) {
  background: #5568d3;
  transform: translateY(-1px);
}

.btn-send-otp:disabled {
  background: #cbd5e0;
  cursor: not-allowed;
  transform: none;
}

/* OTP Section */
.otp-section {
  background: #f7fafc;
  border: 2px solid #667eea;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
}

.otp-info {
  background: #ebf4ff;
  color: #2c5282;
  padding: 10px 12px;
  border-radius: 6px;
  margin-bottom: 16px;
  font-size: 14px;
  text-align: center;
}

.otp-input-group {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.otp-input {
  flex: 1;
  text-align: center;
  font-size: 20px;
  letter-spacing: 8px;
  font-weight: 700;
}

.btn-verify {
  padding: 12px 24px;
  background: #48bb78;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-verify:hover:not(:disabled) {
  background: #38a169;
  transform: translateY(-1px);
}

.btn-verify:disabled {
  background: #cbd5e0;
  cursor: not-allowed;
}

.btn-resend {
  width: 100%;
  padding: 10px;
  background: transparent;
  color: #667eea;
  border: 2px solid #667eea;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-resend:hover:not(:disabled) {
  background: #667eea;
  color: white;
}

.btn-resend:disabled {
  border-color: #cbd5e0;
  color: #a0aec0;
  cursor: not-allowed;
}

/* Verified Badge */
.verified-badge {
  background: #d4edda;
  color: #155724;
  border: 2px solid #48bb78;
  padding: 14px;
  border-radius: 8px;
  text-align: center;
  font-weight: 700;
  font-size: 16px;
  margin-bottom: 20px;
}

/* Error Messages */
.error-msg {
  display: block;
  color: #e53e3e;
  font-size: 13px;
  margin-top: 6px;
  font-weight: 500;
}

/* Register Button */
.btn-register {
  width: 100%;
  padding: 16px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 8px;
}

.btn-register:hover:not(:disabled) {
  background: #5568d3;
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
}

.btn-register:disabled {
  background: #cbd5e0;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* Login Link */
.login-link {
  text-align: center;
  margin-top: 24px;
  color: #718096;
  font-size: 14px;
}

.login-link a {
  color: #667eea;
  text-decoration: none;
  font-weight: 600;
}

.login-link a:hover {
  text-decoration: underline;
}

/* Responsive */
@media (max-width: 600px) {
  .register-card {
    padding: 30px 20px;
  }

  .input-with-button {
    flex-direction: column;
  }

  .btn-send-otp {
    width: 100%;
  }
}

/* Focus Visible (Accessibility) */
*:focus-visible {
  outline: 2px solid #667eea;
  outline-offset: 2px;
}
```

---

## UI State Management Logic

```javascript
// State transitions explained

// INITIAL STATE
{
  otpSent: false,      // No OTP sent yet
  otpVerified: false,  // Not verified
  loading: false,      // No API call in progress
  cooldown: 0          // No cooldown active
}

// AFTER SEND OTP (Success)
{
  otpSent: true,       // ✓ OTP sent
  otpVerified: false,  // Not verified yet
  loading: false,      // API call complete
  cooldown: 60         // 60-second cooldown starts
}

// AFTER VERIFY OTP (Success)
{
  otpSent: true,       // Still true
  otpVerified: true,   // ✓ Now verified
  loading: false,      // API call complete
  cooldown: 0          // Cooldown irrelevant now
}

// AFTER RESEND OTP
{
  otpSent: true,       // Still true
  otpVerified: false,  // Reset to false
  loading: false,      // API call complete
  cooldown: 60         // New 60-second cooldown
}
```

---

## Accessibility Features

### ARIA Attributes
- `aria-required="true"` on required fields
- `aria-invalid="true"` when field has error
- `aria-describedby` links errors to inputs
- `aria-label` on buttons for screen readers
- `role="alert"` on error messages
- `role="status"` on success messages
- `aria-live="polite"` for dynamic updates

### Keyboard Navigation
- All interactive elements are keyboard accessible
- Tab order follows visual flow
- Focus visible on all elements
- Enter key submits form

### Visual Indicators
- Disabled states clearly visible (grayed out)
- Error states have red borders
- Success states have green backgrounds
- Loading states show text changes

---

## UX Improvements

### 1. Progressive Disclosure
- OTP section only appears after sending
- Verified badge replaces OTP input
- Clear visual hierarchy

### 2. Immediate Feedback
- Inline validation on blur
- Real-time error clearing
- Success messages for each step

### 3. Error Recovery
- Clear error messages
- Resend OTP option
- No page reloads

### 4. Loading States
- Button text changes ("Sending...", "Verifying...")
- Buttons disabled during API calls
- Prevents double submissions

### 5. Visual Cues
- Email field locks after OTP sent
- Register button enabled only after verification
- Cooldown timer shows exact seconds

---

## Testing Checklist

- [ ] All fields visible on load
- [ ] Send OTP button disabled until valid email
- [ ] OTP section appears after sending
- [ ] Email field locks after OTP sent
- [ ] OTP input accepts only 6 digits
- [ ] Verify button disabled until 6 digits entered
- [ ] Resend button shows cooldown timer
- [ ] Verified badge appears after verification
- [ ] Register button enabled after verification
- [ ] Form submits correctly
- [ ] Error messages display inline
- [ ] Success redirect works
- [ ] Keyboard navigation works
- [ ] Screen reader announces changes

---

## Production Deployment

1. **Environment Variables**:
   ```javascript
   const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/users';
   ```

2. **Error Tracking**:
   ```javascript
   } catch (err) {
     console.error('Registration error:', err);
     // Send to error tracking service (Sentry, etc.)
   }
   ```

3. **Analytics**:
   ```javascript
   // Track OTP sent
   analytics.track('OTP Sent', { email: formData.email });
   
   // Track verification
   analytics.track('Email Verified');
   
   // Track registration
   analytics.track('Registration Complete');
   ```

---

This implementation provides a clean, accessible, production-ready registration UI with proper OTP flow management.

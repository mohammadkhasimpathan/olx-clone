# Frontend Implementation Guide - OTP Registration Flow

## Overview

This guide provides complete frontend implementation for the improved OTP-based registration system.

## API Endpoints

### Base URL
```
http://localhost:8000/api/users/
```

### 1. Send OTP
**POST** `/send-otp/`

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Success Response (200):**
```json
{
  "message": "OTP sent to your email. Valid for 5 minutes.",
  "email": "user@example.com"
}
```

**Error Responses:**
- `400`: Email already registered
- `500`: Failed to send email

---

### 2. Verify OTP
**POST** `/verify-otp/`

**Request:**
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Success Response (200):**
```json
{
  "message": "Email verified successfully! You can now complete your registration.",
  "verified": true
}
```

**Error Responses:**
- `400`: Invalid OTP / Too many attempts
- `400`: OTP expired
- `404`: No OTP request found

---

### 3. Register
**POST** `/register/`

**Request:**
```json
{
  "email": "user@example.com",
  "username": "johndoe",
  "password": "SecurePass123!",
  "confirm_password": "SecurePass123!",
  "phone_number": "+1234567890",
  "location": "New York"
}
```

**Success Response (201):**
```json
{
  "message": "Account created successfully! You can now login.",
  "username": "johndoe",
  "email": "user@example.com"
}
```

**Error Responses:**
- `403`: Email not verified
- `400`: Username/email already taken
- `400`: Passwords don't match
- `404`: Email not found

---

### 4. Resend OTP
**POST** `/resend-otp/`

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Success Response (200):**
```json
{
  "message": "New OTP sent to your email."
}
```

**Error Responses:**
- `429`: Cooldown active (wait X seconds)
- `404`: No OTP request found

---

## Complete React Implementation

```jsx
import React, { useState, useEffect } from 'react';
import './RegistrationForm.css';

const API_BASE_URL = 'http://localhost:8000/api/users';

const RegistrationForm = () => {
  // Form data state
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
  const [successMessage, setSuccessMessage] = useState('');

  // Cooldown timer effect
  useEffect(() => {
    if (otpState.cooldown > 0) {
      const timer = setTimeout(() => {
        setOtpState(prev => ({ ...prev, cooldown: prev.cooldown - 1 }));
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [otpState.cooldown]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Send OTP
  const handleSendOTP = async () => {
    if (!formData.email) {
      setErrors({ email: 'Email is required' });
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const response = await fetch(`${API_BASE_URL}/send-otp/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: formData.email })
      });

      const data = await response.json();

      if (response.ok) {
        setOtpState({
          sent: true,
          verified: false,
          otp: '',
          cooldown: 60
        });
        setSuccessMessage('OTP sent to your email. Please check your inbox.');
      } else {
        setErrors({ email: data.error || 'Failed to send OTP' });
      }
    } catch (error) {
      setErrors({ email: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP
  const handleVerifyOTP = async () => {
    if (!otpState.otp || otpState.otp.length !== 6) {
      setErrors({ otp: 'Please enter a valid 6-digit OTP' });
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const response = await fetch(`${API_BASE_URL}/verify-otp/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          otp: otpState.otp
        })
      });

      const data = await response.json();

      if (response.ok) {
        setOtpState(prev => ({ ...prev, verified: true }));
        setSuccessMessage('Email verified successfully! You can now complete registration.');
        setErrors({});
      } else {
        setErrors({ otp: data.error || 'Invalid OTP' });
      }
    } catch (error) {
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
      const response = await fetch(`${API_BASE_URL}/resend-otp/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: formData.email })
      });

      const data = await response.json();

      if (response.ok) {
        setOtpState(prev => ({
          ...prev,
          verified: false,
          otp: '',
          cooldown: 60
        }));
        setSuccessMessage('New OTP sent to your email.');
      } else {
        if (response.status === 429) {
          setErrors({ otp: data.error });
        } else {
          setErrors({ otp: data.error || 'Failed to resend OTP' });
        }
      }
    } catch (error) {
      setErrors({ otp: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  // Handle registration
  const handleRegister = async (e) => {
    e.preventDefault();

    // Validation
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
      const response = await fetch(`${API_BASE_URL}/register/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          username: formData.username,
          password: formData.password,
          confirm_password: formData.confirmPassword,
          phone_number: formData.phoneNumber,
          location: formData.location
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage('Registration successful! Redirecting to login...');
        // Redirect to login after 2 seconds
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else {
        if (data.error) {
          setErrors({ general: data.error });
        } else {
          // Handle field-specific errors
          setErrors(data);
        }
      }
    } catch (error) {
      setErrors({ general: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="registration-container">
      <div className="registration-card">
        <h2>Create Account</h2>

        {successMessage && (
          <div className="success-message">{successMessage}</div>
        )}

        {errors.general && (
          <div className="error-message">{errors.general}</div>
        )}

        <form onSubmit={handleRegister}>
          {/* Username */}
          <div className="form-group">
            <label htmlFor="username">Username *</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Enter username"
              required
              minLength="3"
            />
            {errors.username && <span className="error">{errors.username}</span>}
          </div>

          {/* Email with Send OTP button */}
          <div className="form-group">
            <label htmlFor="email">Email *</label>
            <div className="email-input-group">
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter email"
                disabled={otpState.sent}
                required
              />
              <button
                type="button"
                onClick={handleSendOTP}
                disabled={otpState.sent || loading}
                className="btn-send-otp"
              >
                {otpState.sent ? '✓ Sent' : 'Send OTP'}
              </button>
            </div>
            {errors.email && <span className="error">{errors.email}</span>}
          </div>

          {/* OTP Input (shown after OTP sent) */}
          {otpState.sent && !otpState.verified && (
            <div className="form-group otp-group">
              <label htmlFor="otp">Enter OTP *</label>
              <div className="otp-input-group">
                <input
                  type="text"
                  id="otp"
                  value={otpState.otp}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setOtpState(prev => ({ ...prev, otp: value }));
                  }}
                  placeholder="6-digit code"
                  maxLength="6"
                  pattern="\d{6}"
                />
                <button
                  type="button"
                  onClick={handleVerifyOTP}
                  disabled={loading || otpState.otp.length !== 6}
                  className="btn-verify"
                >
                  Verify
                </button>
              </div>
              <button
                type="button"
                onClick={handleResendOTP}
                disabled={otpState.cooldown > 0 || loading}
                className="btn-resend"
              >
                {otpState.cooldown > 0
                  ? `Resend in ${otpState.cooldown}s`
                  : 'Resend OTP'}
              </button>
              {errors.otp && <span className="error">{errors.otp}</span>}
            </div>
          )}

          {/* Email Verified Badge */}
          {otpState.verified && (
            <div className="verified-badge">
              ✅ Email Verified
            </div>
          )}

          {/* Password */}
          <div className="form-group">
            <label htmlFor="password">Password *</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter password"
              required
              minLength="8"
            />
            {errors.password && <span className="error">{errors.password}</span>}
          </div>

          {/* Confirm Password */}
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password *</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm password"
              required
            />
            {errors.confirmPassword && (
              <span className="error">{errors.confirmPassword}</span>
            )}
          </div>

          {/* Phone Number */}
          <div className="form-group">
            <label htmlFor="phoneNumber">Phone Number</label>
            <input
              type="tel"
              id="phoneNumber"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              placeholder="Enter phone number (optional)"
            />
            {errors.phone_number && (
              <span className="error">{errors.phone_number}</span>
            )}
          </div>

          {/* Location */}
          <div className="form-group">
            <label htmlFor="location">Location</label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="Enter location (optional)"
            />
            {errors.location && <span className="error">{errors.location}</span>}
          </div>

          {/* Register Button */}
          <button
            type="submit"
            disabled={!otpState.verified || loading}
            className="btn-register"
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

export default RegistrationForm;
```

---

## CSS Styling

```css
/* RegistrationForm.css */

.registration-container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.registration-card {
  background: white;
  border-radius: 12px;
  padding: 40px;
  max-width: 500px;
  width: 100%;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.registration-card h2 {
  text-align: center;
  color: #333;
  margin-bottom: 30px;
  font-size: 28px;
}

.success-message {
  background: #d4edda;
  color: #155724;
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 20px;
  border: 1px solid #c3e6cb;
}

.error-message {
  background: #f8d7da;
  color: #721c24;
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 20px;
  border: 1px solid #f5c6cb;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #555;
  font-weight: 500;
}

.form-group input {
  width: 100%;
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  font-size: 16px;
  transition: border-color 0.3s;
}

.form-group input:focus {
  outline: none;
  border-color: #667eea;
}

.form-group input:disabled {
  background: #f5f5f5;
  cursor: not-allowed;
}

.email-input-group {
  display: flex;
  gap: 10px;
}

.email-input-group input {
  flex: 1;
}

.btn-send-otp {
  padding: 12px 20px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  white-space: nowrap;
  transition: background 0.3s;
}

.btn-send-otp:hover:not(:disabled) {
  background: #5568d3;
}

.btn-send-otp:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.otp-group {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  border: 2px solid #667eea;
}

.otp-input-group {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}

.otp-input-group input {
  flex: 1;
  text-align: center;
  font-size: 20px;
  letter-spacing: 4px;
  font-weight: bold;
}

.btn-verify {
  padding: 12px 24px;
  background: #28a745;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: background 0.3s;
}

.btn-verify:hover:not(:disabled) {
  background: #218838;
}

.btn-verify:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.btn-resend {
  width: 100%;
  padding: 10px;
  background: transparent;
  color: #667eea;
  border: 2px solid #667eea;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s;
}

.btn-resend:hover:not(:disabled) {
  background: #667eea;
  color: white;
}

.btn-resend:disabled {
  border-color: #ccc;
  color: #ccc;
  cursor: not-allowed;
}

.verified-badge {
  background: #d4edda;
  color: #155724;
  padding: 12px;
  border-radius: 6px;
  text-align: center;
  font-weight: 600;
  margin-bottom: 20px;
  border: 2px solid #28a745;
}

.error {
  display: block;
  color: #dc3545;
  font-size: 14px;
  margin-top: 5px;
}

.btn-register {
  width: 100%;
  padding: 14px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.3s;
  margin-top: 10px;
}

.btn-register:hover:not(:disabled) {
  background: #5568d3;
}

.btn-register:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.login-link {
  text-align: center;
  margin-top: 20px;
  color: #666;
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
  .registration-card {
    padding: 30px 20px;
  }

  .email-input-group {
    flex-direction: column;
  }

  .btn-send-otp {
    width: 100%;
  }
}
```

---

## Vanilla JavaScript Implementation

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Register - OLX Clone</title>
    <link rel="stylesheet" href="registration.css">
</head>
<body>
    <div class="registration-container">
        <div class="registration-card">
            <h2>Create Account</h2>

            <div id="successMessage" class="success-message" style="display: none;"></div>
            <div id="errorMessage" class="error-message" style="display: none;"></div>

            <form id="registrationForm">
                <!-- Username -->
                <div class="form-group">
                    <label for="username">Username *</label>
                    <input type="text" id="username" name="username" required minlength="3">
                    <span class="error" id="usernameError"></span>
                </div>

                <!-- Email with Send OTP -->
                <div class="form-group">
                    <label for="email">Email *</label>
                    <div class="email-input-group">
                        <input type="email" id="email" name="email" required>
                        <button type="button" id="sendOtpBtn" class="btn-send-otp">Send OTP</button>
                    </div>
                    <span class="error" id="emailError"></span>
                </div>

                <!-- OTP Input (hidden initially) -->
                <div class="form-group otp-group" id="otpGroup" style="display: none;">
                    <label for="otp">Enter OTP *</label>
                    <div class="otp-input-group">
                        <input type="text" id="otp" maxlength="6" pattern="\d{6}">
                        <button type="button" id="verifyOtpBtn" class="btn-verify">Verify</button>
                    </div>
                    <button type="button" id="resendOtpBtn" class="btn-resend">Resend OTP</button>
                    <span class="error" id="otpError"></span>
                </div>

                <!-- Verified Badge (hidden initially) -->
                <div class="verified-badge" id="verifiedBadge" style="display: none;">
                    ✅ Email Verified
                </div>

                <!-- Password -->
                <div class="form-group">
                    <label for="password">Password *</label>
                    <input type="password" id="password" name="password" required minlength="8">
                    <span class="error" id="passwordError"></span>
                </div>

                <!-- Confirm Password -->
                <div class="form-group">
                    <label for="confirmPassword">Confirm Password *</label>
                    <input type="password" id="confirmPassword" name="confirmPassword" required>
                    <span class="error" id="confirmPasswordError"></span>
                </div>

                <!-- Phone Number -->
                <div class="form-group">
                    <label for="phoneNumber">Phone Number</label>
                    <input type="tel" id="phoneNumber" name="phoneNumber">
                </div>

                <!-- Location -->
                <div class="form-group">
                    <label for="location">Location</label>
                    <input type="text" id="location" name="location">
                </div>

                <!-- Register Button -->
                <button type="submit" id="registerBtn" class="btn-register" disabled>Register</button>
            </form>

            <div class="login-link">
                Already have an account? <a href="/login">Login</a>
            </div>
        </div>
    </div>

    <script src="registration.js"></script>
</body>
</html>
```

```javascript
// registration.js

const API_BASE_URL = 'http://localhost:8000/api/users';

let otpState = {
    sent: false,
    verified: false,
    cooldown: 0
};

// DOM Elements
const form = document.getElementById('registrationForm');
const emailInput = document.getElementById('email');
const sendOtpBtn = document.getElementById('sendOtpBtn');
const otpGroup = document.getElementById('otpGroup');
const otpInput = document.getElementById('otp');
const verifyOtpBtn = document.getElementById('verifyOtpBtn');
const resendOtpBtn = document.getElementById('resendOtpBtn');
const verifiedBadge = document.getElementById('verifiedBadge');
const registerBtn = document.getElementById('registerBtn');
const successMessage = document.getElementById('successMessage');
const errorMessage = document.getElementById('errorMessage');

// Utility functions
function showSuccess(message) {
    successMessage.textContent = message;
    successMessage.style.display = 'block';
    errorMessage.style.display = 'none';
}

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    successMessage.style.display = 'none';
}

function clearMessages() {
    successMessage.style.display = 'none';
    errorMessage.style.display = 'none';
}

function showFieldError(fieldId, message) {
    document.getElementById(fieldId + 'Error').textContent = message;
}

function clearFieldErrors() {
    document.querySelectorAll('.error').forEach(el => el.textContent = '');
}

// Cooldown timer
function startCooldown() {
    otpState.cooldown = 60;
    updateResendButton();
    
    const timer = setInterval(() => {
        otpState.cooldown--;
        updateResendButton();
        
        if (otpState.cooldown <= 0) {
            clearInterval(timer);
        }
    }, 1000);
}

function updateResendButton() {
    if (otpState.cooldown > 0) {
        resendOtpBtn.textContent = `Resend in ${otpState.cooldown}s`;
        resendOtpBtn.disabled = true;
    } else {
        resendOtpBtn.textContent = 'Resend OTP';
        resendOtpBtn.disabled = false;
    }
}

// Send OTP
sendOtpBtn.addEventListener('click', async () => {
    const email = emailInput.value.trim();
    
    if (!email) {
        showFieldError('email', 'Email is required');
        return;
    }
    
    clearMessages();
    clearFieldErrors();
    sendOtpBtn.disabled = true;
    sendOtpBtn.textContent = 'Sending...';
    
    try {
        const response = await fetch(`${API_BASE_URL}/send-otp/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            otpState.sent = true;
            emailInput.disabled = true;
            sendOtpBtn.textContent = '✓ Sent';
            otpGroup.style.display = 'block';
            showSuccess('OTP sent to your email. Please check your inbox.');
            startCooldown();
        } else {
            showFieldError('email', data.error || 'Failed to send OTP');
            sendOtpBtn.disabled = false;
            sendOtpBtn.textContent = 'Send OTP';
        }
    } catch (error) {
        showError('Network error. Please try again.');
        sendOtpBtn.disabled = false;
        sendOtpBtn.textContent = 'Send OTP';
    }
});

// Verify OTP
verifyOtpBtn.addEventListener('click', async () => {
    const email = emailInput.value.trim();
    const otp = otpInput.value.trim();
    
    if (!otp || otp.length !== 6) {
        showFieldError('otp', 'Please enter a valid 6-digit OTP');
        return;
    }
    
    clearMessages();
    clearFieldErrors();
    verifyOtpBtn.disabled = true;
    verifyOtpBtn.textContent = 'Verifying...';
    
    try {
        const response = await fetch(`${API_BASE_URL}/verify-otp/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, otp })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            otpState.verified = true;
            otpGroup.style.display = 'none';
            verifiedBadge.style.display = 'block';
            registerBtn.disabled = false;
            showSuccess('Email verified successfully! You can now complete registration.');
        } else {
            showFieldError('otp', data.error || 'Invalid OTP');
            verifyOtpBtn.disabled = false;
            verifyOtpBtn.textContent = 'Verify';
        }
    } catch (error) {
        showError('Network error. Please try again.');
        verifyOtpBtn.disabled = false;
        verifyOtpBtn.textContent = 'Verify';
    }
});

// Resend OTP
resendOtpBtn.addEventListener('click', async () => {
    const email = emailInput.value.trim();
    
    clearMessages();
    clearFieldErrors();
    resendOtpBtn.disabled = true;
    
    try {
        const response = await fetch(`${API_BASE_URL}/resend-otp/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            otpState.verified = false;
            otpInput.value = '';
            verifiedBadge.style.display = 'none';
            registerBtn.disabled = true;
            showSuccess('New OTP sent to your email.');
            startCooldown();
        } else {
            showFieldError('otp', data.error || 'Failed to resend OTP');
        }
    } catch (error) {
        showError('Network error. Please try again.');
    }
});

// Register
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!otpState.verified) {
        showError('Please verify your email first');
        return;
    }
    
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (password !== confirmPassword) {
        showFieldError('confirmPassword', 'Passwords do not match');
        return;
    }
    
    clearMessages();
    clearFieldErrors();
    registerBtn.disabled = true;
    registerBtn.textContent = 'Registering...';
    
    const formData = {
        email: emailInput.value.trim(),
        username: document.getElementById('username').value.trim(),
        password: password,
        confirm_password: confirmPassword,
        phone_number: document.getElementById('phoneNumber').value.trim(),
        location: document.getElementById('location').value.trim()
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}/register/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showSuccess('Registration successful! Redirecting to login...');
            setTimeout(() => {
                window.location.href = '/login';
            }, 2000);
        } else {
            if (data.error) {
                showError(data.error);
            } else {
                // Handle field-specific errors
                Object.keys(data).forEach(field => {
                    showFieldError(field, data[field]);
                });
            }
            registerBtn.disabled = false;
            registerBtn.textContent = 'Register';
        }
    } catch (error) {
        showError('Network error. Please try again.');
        registerBtn.disabled = false;
        registerBtn.textContent = 'Register';
    }
});

// OTP input validation (only numbers)
otpInput.addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/\D/g, '').slice(0, 6);
});
```

---

## Testing the Flow

### 1. Test Send OTP
```bash
curl -X POST http://localhost:8000/api/users/send-otp/ \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

### 2. Check email for OTP, then test Verify OTP
```bash
curl -X POST http://localhost:8000/api/users/verify-otp/ \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","otp":"123456"}'
```

### 3. Test Registration
```bash
curl -X POST http://localhost:8000/api/users/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "email":"test@example.com",
    "username":"testuser",
    "password":"TestPass123!",
    "confirm_password":"TestPass123!",
    "phone_number":"+1234567890",
    "location":"New York"
  }'
```

---

## Key Features

✅ All fields visible from start  
✅ Separate OTP sending  
✅ OTP verification before registration  
✅ 60-second resend cooldown  
✅ 5-minute OTP expiry  
✅ 3 verification attempts  
✅ Email verification required  
✅ Clean error handling  
✅ Responsive design  
✅ Production-ready code

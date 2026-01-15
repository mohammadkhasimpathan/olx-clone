# Registration UI - Quick Reference

## Visual States

### 1️⃣ Initial State
```
All fields visible ✓
Email: [input] [Send OTP] ← enabled if email valid
Register button: DISABLED (gray)
```

### 2️⃣ After Send OTP
```
Email: [locked] [✓ Sent]
┌─────────────────────┐
│ 📧 OTP sent!        │
│ [______] [Verify]   │
│ [Resend (60s)]      │
└─────────────────────┘
Register button: STILL DISABLED
```

### 3️⃣ After Verify OTP
```
┌─────────────────────┐
│ ✅ Email Verified   │
└─────────────────────┘
Register button: ENABLED (blue)
```

---

## Button States

| Button | Initial | After Send | After Verify |
|--------|---------|------------|--------------|
| Send OTP | Enabled | ✓ Sent (disabled) | ✓ Sent |
| Verify OTP | Hidden | Enabled | Hidden |
| Resend OTP | Hidden | Disabled (60s) | Hidden |
| Register | Disabled | Disabled | **Enabled** |

---

## Key UI Rules

1. **All fields visible from start** - No hiding/showing form fields
2. **OTP section appears** - Only after Send OTP clicked
3. **Email locks** - After OTP sent (optional, for UX clarity)
4. **Register enabled** - Only after OTP verified
5. **No page reloads** - Everything happens via AJAX

---

## Error Handling

### Inline Errors (below field)
```jsx
{errors.email && (
  <span className="error-msg">{errors.email}</span>
)}
```

### Global Errors (top of form)
```jsx
{errors.general && (
  <div className="alert alert-error">{errors.general}</div>
)}
```

---

## Accessibility

✅ `aria-required` on required fields  
✅ `aria-invalid` when errors present  
✅ `aria-describedby` links errors to inputs  
✅ `role="alert"` on error messages  
✅ Keyboard navigation works  
✅ Focus visible on all elements

---

## State Object

```javascript
const [otpState, setOtpState] = useState({
  sent: false,      // OTP sent?
  verified: false,  // OTP verified?
  otp: '',          // OTP value
  cooldown: 0       // Resend cooldown (seconds)
});
```

---

## API Calls

```javascript
// 1. Send OTP
POST /api/users/send-otp/
{ email: "user@email.com" }

// 2. Verify OTP
POST /api/users/verify-otp/
{ email: "user@email.com", otp: "123456" }

// 3. Register
POST /api/users/register/
{ email, username, password, ... }
```

---

## CSS Classes

```css
.btn-send-otp      /* Blue button next to email */
.otp-section       /* Gray box with OTP input */
.btn-verify        /* Green verify button */
.btn-resend        /* Outlined resend button */
.verified-badge    /* Green success badge */
.btn-register      /* Main register button */
.error-msg         /* Red error text */
.alert-success     /* Green success banner */
.alert-error       /* Red error banner */
```

---

## Complete Files

📄 **React Component**: `REGISTER_UI_GUIDE.md` (full implementation)  
📄 **CSS Styles**: Included in guide  
📄 **Backend API**: `FRONTEND_IMPLEMENTATION_GUIDE.md`

---

## Quick Start

1. Copy React component from `REGISTER_UI_GUIDE.md`
2. Copy CSS styles
3. Update `API_BASE` URL
4. Test the flow:
   - Fill email → Send OTP
   - Check email → Enter OTP → Verify
   - Fill other fields → Register
5. Deploy! 🚀

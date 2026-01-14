# Simplified Registration + OTP Verification Flow

## ✅ **IMPLEMENTATION COMPLETE**

### **Flow Overview**:
1. User registers → OTP sent to email
2. User submits OTP → Email verified automatically
3. User can login immediately

---

## 🔧 **Changes Made**

### **1. User Model** ✅
Already has required fields:
```python
class User(AbstractUser):
    email_verified = models.BooleanField(default=False)
    email_otp = models.CharField(max_length=6, blank=True, null=True)
    email_otp_created_at = models.DateTimeField(blank=True, null=True)
```

---

### **2. Registration API** ✅

**File**: `users/views.py` - `UserRegistrationView`

**Changes**:
```python
def create(self, request, *args, **kwargs):
    serializer = self.get_serializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = serializer.save()
    
    # Generate OTP and send verification email
    otp = generate_otp()
    user.email_otp = otp
    user.email_otp_created_at = timezone.now()
    user.save()
    
    # Send OTP email
    send_verification_email(user, otp)
    
    return Response({
        'message': 'Registration successful! Please check your email for verification code.',
        'email': user.email
    }, status=status.HTTP_201_CREATED)
```

**Result**: User created with `email_verified=False`, OTP generated and sent

---

### **3. Verify OTP API** ✅

**File**: `users/views.py` - `VerifyEmailView`

**Already implements**:
```python
# Mark email as verified and clear OTP
user.email_verified = True
user.email_otp = None
user.email_otp_created_at = None
user.save()

return Response({
    'message': 'Email verified successfully! You can now login.'
}, status=status.HTTP_200_OK)
```

**Result**: Email verified, OTP cleared, user can login

---

### **4. Login API** ✅

**File**: `users/views.py` - `CustomTokenObtainPairView`

**Already implements**:
```python
if user and not user.email_verified:
    return Response({
        'error': 'Please verify your email before logging in.',
        'email': user.email,
        'requires_verification': True
    }, status=status.HTTP_403_FORBIDDEN)
```

**Result**: Only verified users can login

---

### **5. Resend OTP API** ✅

**File**: `users/views.py` - `ResendOTPView`

**Already implements**:
- Regenerates OTP
- Sends email
- Rate limiting (1 minute)

**No changes needed** - already simple and functional

---

### **6. Email Utility** ✅

**File**: `users/utils.py` - `send_verification_email`

**Fixed to accept both User object and email string**:
```python
def send_verification_email(user_or_email, otp):
    # Handle both User object and email string
    if isinstance(user_or_email, str):
        email = user_or_email
        username = email.split('@')[0]  # Use email prefix as fallback
    else:
        email = user_or_email.email
        username = user_or_email.username
    
    # Send email...
```

**Result**: No more username errors when passing email string

---

## ✅ **Complete Flow**

### **Step 1: Register**
```bash
POST /api/users/register/
{
    "username": "john",
    "email": "john@example.com",
    "password": "password123"
}
```

**Response**:
```json
{
    "message": "Registration successful! Please check your email for verification code.",
    "email": "john@example.com"
}
```

**Backend**:
- User created with `email_verified=False`
- OTP generated and saved
- Email sent with OTP

---

### **Step 2: Verify OTP**
```bash
POST /api/users/verify-email/
{
    "email": "john@example.com",
    "otp": "123456"
}
```

**Response**:
```json
{
    "message": "Email verified successfully! You can now login."
}
```

**Backend**:
- `email_verified` set to `True`
- OTP cleared
- User can now login

---

### **Step 3: Login**
```bash
POST /api/users/login/
{
    "username": "john",
    "password": "password123"
}
```

**Response**:
```json
{
    "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

**Backend**:
- Checks `email_verified == True`
- Issues JWT tokens
- User logged in

---

### **Optional: Resend OTP**
```bash
POST /api/users/resend-otp/
{
    "email": "john@example.com"
}
```

**Response**:
```json
{
    "message": "A new verification code has been sent to your email."
}
```

**Backend**:
- Generates new OTP
- Sends new email
- Rate limited to 1 minute

---

## ✅ **Files Modified**

| File | Changes |
|------|---------|
| `users/utils.py` | Fixed `send_verification_email` to accept email string |
| `users/views.py` | Updated `UserRegistrationView` to send OTP on registration |

---

## ✅ **Verification Checklist**

- [x] User model has `email_verified` and `email_otp`
- [x] Registration generates and sends OTP
- [x] OTP verification sets `email_verified=True`
- [x] OTP cleared after verification
- [x] Login only allows verified users
- [x] Resend OTP regenerates code
- [x] No username errors in email sending
- [x] Simple, streamlined flow

---

## 🚀 **Deployment**

```bash
# Commit changes
git add .
git commit -m "feat: Simplify registration and OTP verification flow

- Registration now sends OTP immediately
- OTP verification auto-completes registration
- Users can login immediately after verification
- Fixed send_verification_email to accept email string
- Streamlined flow with no manual activation"

# Push to main
git push origin main
```

**Render will auto-deploy** the backend with these changes.

---

## ✅ **Final Status**

**Registration**: ✅ **Sends OTP automatically**  
**Verification**: ✅ **Auto-completes registration**  
**Login**: ✅ **Only verified users**  
**Email Sending**: ✅ **No username errors**  
**Flow**: ✅ **Simple and streamlined**

**Status**: ✅ **READY FOR DEPLOYMENT**

# Quick Email Timeout Fix - Deployment Guide

## Problem
Email timeout errors on Render:
```
ERROR: Timeout sending verification email
```

## Root Cause
Render FREE tier has variable network latency to external SMTP servers. The 10-second timeout was too aggressive for Brevo SMTP connections.

## Solution Applied
Increased `EMAIL_TIMEOUT` from 10 to 30 seconds in `settings.py`.

## Deploy This Fix

### Step 1: Commit and Push
```bash
cd backend

# Check the change
git diff olx_backend/settings.py

# Commit
git add olx_backend/settings.py
git commit -m "Fix: Increase email timeout to 30s for Render network latency"

# Push to trigger Render deployment
git push origin main
```

### Step 2: Monitor Render Deployment
1. Go to Render Dashboard
2. Watch deployment logs
3. Wait for "Deploy live" message

### Step 3: Test Email Sending
```bash
# Test send-otp endpoint
curl -X POST https://your-app.onrender.com/api/users/send-otp/ \
  -H "Content-Type: application/json" \
  -d '{"email":"your-test-email@gmail.com"}'
```

**Expected Result**:
- ✅ 200 OK response
- ✅ Email delivered (check inbox)
- ✅ No timeout errors in logs

### Step 4: Check Render Logs
Look for:
```
INFO users.utils Verification email sent successfully to user@example.com
```

Instead of:
```
ERROR utils Timeout sending verification email
```

## Alternative: Test Locally First

If you want to test before deploying:

```bash
cd backend

# Activate virtual environment
source venv/bin/activate

# Set Brevo credentials
export EMAIL_HOST_USER="your-brevo-email@example.com"
export EMAIL_HOST_PASSWORD="your-brevo-smtp-key"
export EMAIL_HOST="smtp-relay.brevo.com"
export EMAIL_PORT="587"
export DEFAULT_FROM_EMAIL="noreply@olxclone.com"

# Run Django shell
python manage.py shell

# Test email
from django.core.mail import send_mail
send_mail(
    'Test Email',
    'This is a test from Django',
    'noreply@olxclone.com',
    ['your-email@gmail.com'],
)
```

If this works locally, it will work on Render with the 30-second timeout.

## Why 30 Seconds?

- **10 seconds**: Too short for Render FREE tier network
- **30 seconds**: Enough for SMTP handshake + TLS + send
- **Still safe**: Won't hang workers indefinitely
- **Render timeout**: Render has 60-second request timeout, so 30s is safe

## Rollback Plan

If 30 seconds is still not enough (unlikely), you can:

1. Increase to 45 seconds
2. Or switch to a different SMTP provider with better latency
3. Or use Render's recommended email service

## Expected Outcome

After deployment:
- ✅ Emails send successfully
- ✅ No timeout errors
- ✅ Response time: 2-5 seconds (SMTP connection time)
- ✅ Users receive OTP emails

---

**Status**: Ready to deploy  
**Risk**: Low (only changing timeout value)  
**Rollback**: Easy (revert commit)

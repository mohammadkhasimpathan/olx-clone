# Production Deployment Guide - Fix PendingRegistration Table

## 🎯 Objective

Fix the "relation does not exist" error for `users_pendingregistration` table in production PostgreSQL on Render.

## 📋 Pre-Deployment Checklist

Before deploying, ensure:

- [ ] All code changes are committed
- [ ] New migration files are in version control
- [ ] `verify_migrations.py` script is committed
- [ ] `deploy.sh` script is committed and executable

## 🚀 Deployment Steps

### Step 1: Commit and Push Changes

```bash
cd /home/salman/.gemini/antigravity/scratch/olx-clone

# Add all changes
git add backend/users/migrations/0001_initial.py
git add backend/listings/migrations/0001_initial.py
git add backend/verify_migrations.py
git add backend/deploy.sh
git add backend/CIRCULAR_DEPENDENCY_FIX.md

# Commit
git commit -m "fix: Resolve circular migration dependency and ensure PendingRegistration table creation"

# Push to main branch
git push origin main
```

### Step 2: Access Render Dashboard

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Navigate to your `olx-clone-backend` service
3. Wait for automatic deployment to trigger

### Step 3: Monitor Deployment

Watch the deployment logs for:

```
📦 Applying database migrations...
Operations to perform:
  Apply all migrations: admin, auth, categories, contenttypes, listings, sessions, users
Running migrations:
  Applying users.0001_initial... OK
  Applying listings.0001_initial... OK
```

### Step 4: Verify Migration Success

Once deployed, access the Render shell:

```bash
# In Render Shell
python manage.py showmigrations users
```

Expected output:
```
users
 [X] 0001_initial
```

### Step 5: Verify Table Exists

Run the verification script:

```bash
# In Render Shell
python verify_migrations.py
```

Expected output:
```
✅ SUCCESS: All tables exist and models are accessible
✅ Database is ready for production use
```

### Step 6: Test the API Endpoint

Test the registration endpoint:

```bash
curl -X POST https://your-app.onrender.com/api/users/register-request/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "TestPass123!",
    "phone_number": "+1234567890",
    "location": "Test City"
  }'
```

Expected response (200 OK):
```json
{
  "message": "OTP sent to email",
  "email": "test@example.com"
}
```

## 🔧 Troubleshooting

### Issue 1: Migration Already Applied Error

If you see:
```
django.db.migrations.exceptions.InconsistentMigrationHistory
```

**Solution**: Reset migration state

```bash
# In Render Shell
python manage.py migrate users zero --fake
python manage.py migrate users
```

### Issue 2: Table Still Missing

If table doesn't exist after migration:

```bash
# Check migration status
python manage.py showmigrations

# Force migration
python manage.py migrate --run-syncdb
```

### Issue 3: Old Migration Conflicts

If old migrations conflict:

```bash
# Clear migration history for users app
python manage.py dbshell
# Then in PostgreSQL:
DELETE FROM django_migrations WHERE app = 'users';
DELETE FROM django_migrations WHERE app = 'listings';
\q

# Re-apply migrations
python manage.py migrate --fake-initial
```

## 📊 Verification Checklist

After deployment, verify:

- [ ] `python manage.py showmigrations` shows all migrations applied
- [ ] `python verify_migrations.py` passes successfully
- [ ] `/api/users/register-request/` returns 200 (not 500)
- [ ] OTP email is sent successfully
- [ ] No "relation does not exist" errors in logs

## 🔄 Rollback Plan

If deployment fails:

1. **Revert commit**:
   ```bash
   git revert HEAD
   git push origin main
   ```

2. **Manual rollback on Render**:
   - Go to Render Dashboard
   - Select previous successful deployment
   - Click "Redeploy"

## 📝 Post-Deployment

### Update Environment Variables

Ensure these are set in Render:

- `DATABASE_URL` - PostgreSQL connection string (auto-set)
- `ALLOWED_HOSTS` - Include your Render domain
- `CORS_ALLOWED_ORIGINS` - Include frontend URL
- `EMAIL_HOST_USER` - Gmail address for OTP emails
- `EMAIL_HOST_PASSWORD` - Gmail app password

### Monitor Logs

Watch for any errors:

```bash
# In Render Dashboard
# Go to Logs tab
# Filter for "ERROR" or "500"
```

### Test Complete Registration Flow

1. Request OTP: `POST /api/users/register-request/`
2. Check email for OTP
3. Verify OTP: `POST /api/users/verify-otp/`
4. Confirm user is created in database

## 🎉 Success Criteria

Deployment is successful when:

✅ All migrations applied without errors  
✅ `users_pendingregistration` table exists  
✅ Registration API returns 200 status  
✅ OTP emails are sent  
✅ Users can complete registration  
✅ No 500 errors in production logs

## 📞 Support

If issues persist:

1. Check Render logs for detailed error messages
2. Verify database connection string
3. Ensure all environment variables are set
4. Review migration history in `django_migrations` table

---

**Last Updated**: 2026-01-15  
**Status**: Ready for deployment

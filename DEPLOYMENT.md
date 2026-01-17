# Deployment Guide

## Deploying to Render.com

### Prerequisites
- GitHub account with repository
- Render.com account
- Cloudinary account (for image uploads)
- Gmail account (for email notifications)

---

## Backend Deployment

### 1. Create PostgreSQL Database
1. Go to Render Dashboard
2. Click "New +" → "PostgreSQL"
3. Name: `olx-clone-db`
4. Region: Choose closest to your users
5. Click "Create Database"
6. **Save the Internal Database URL** (starts with `postgresql://`)

### 2. Create Redis Instance
1. Click "New +" → "Redis"
2. Name: `olx-clone-redis`
3. Plan: Free
4. Click "Create Redis"
5. **Save the Internal Redis URL** (starts with `redis://`)

### 3. Create Web Service (Backend)
1. Click "New +" → "Web Service"
2. Connect your GitHub repository
3. Configure:
   - **Name**: `olx-clone-backend`
   - **Region**: Same as database
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `daphne -b 0.0.0.0 -p $PORT olx_backend.asgi:application`
   - **Plan**: Free

### 4. Add Environment Variables
Click "Environment" tab and add:

```env
SECRET_KEY=your-super-secret-key-here-change-this
DEBUG=False
ALLOWED_HOSTS=.onrender.com
DATABASE_URL=<paste-internal-database-url>
REDIS_URL=<paste-internal-redis-url>

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Email (Gmail)
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=your-email@gmail.com

# Frontend URL (will update after frontend deployment)
FRONTEND_URL=https://your-frontend.onrender.com

# CORS
CORS_ALLOWED_ORIGINS=https://your-frontend.onrender.com
```

### 5. Deploy
- Click "Create Web Service"
- Wait for deployment (5-10 minutes)
- Check logs for any errors

### 6. Run Migrations
After first deployment:
1. Go to "Shell" tab
2. Run:
```bash
python manage.py migrate
python manage.py createsuperuser
```

---

## Frontend Deployment

### 1. Update Environment Variables
In `frontend/.env.production`:
```env
VITE_API_URL=https://olx-clone-backend.onrender.com
VITE_WS_URL=wss://olx-clone-backend.onrender.com
```

### 2. Commit Changes
```bash
git add frontend/.env.production
git commit -m "Add production environment variables"
git push origin main
```

### 3. Create Static Site
1. Click "New +" → "Static Site"
2. Connect your GitHub repository
3. Configure:
   - **Name**: `olx-clone-frontend`
   - **Branch**: `main`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`

### 4. Add Environment Variables
```env
VITE_API_URL=https://olx-clone-backend.onrender.com
VITE_WS_URL=wss://olx-clone-backend.onrender.com
```

### 5. Deploy
- Click "Create Static Site"
- Wait for deployment (3-5 minutes)

### 6. Update Backend CORS
Go back to backend service → Environment:
```env
FRONTEND_URL=https://olx-clone-frontend.onrender.com
CORS_ALLOWED_ORIGINS=https://olx-clone-frontend.onrender.com
```
Save and redeploy backend.

---

## Post-Deployment Checklist

### Backend
- [ ] Database migrations ran successfully
- [ ] Superuser created
- [ ] Redis connection working
- [ ] Cloudinary uploads working
- [ ] Email sending working
- [ ] WebSocket connections stable
- [ ] API endpoints responding

### Frontend
- [ ] Site loads without errors
- [ ] Can register new user
- [ ] Can login
- [ ] Can create listing
- [ ] Can upload images
- [ ] Chat works in real-time
- [ ] Notifications working

---

## Troubleshooting

### Backend Won't Start
**Error**: `Application failed to start`
- Check logs in Render dashboard
- Verify all environment variables are set
- Ensure `requirements.txt` is in backend folder
- Check Python version compatibility

### Database Connection Failed
**Error**: `could not connect to server`
- Verify DATABASE_URL is correct
- Check database is in same region
- Ensure internal URL is used (not external)

### WebSocket Not Connecting
**Error**: `WebSocket connection failed`
- Verify Daphne is running (check start command)
- Check ALLOWED_HOSTS includes `.onrender.com`
- Ensure Redis URL is correct
- Check browser console for CORS errors

### Images Not Uploading
**Error**: `Cloudinary upload failed`
- Verify Cloudinary credentials
- Check API key has upload permissions
- Ensure CORS settings in Cloudinary allow your domain

### Email Not Sending
**Error**: `SMTP authentication failed`
- Use Gmail App Password (not regular password)
- Enable 2FA on Gmail account
- Generate App Password in Google Account settings

---

## Monitoring

### Check Logs
```bash
# Backend logs
render logs -s olx-clone-backend

# Frontend logs  
render logs -s olx-clone-frontend
```

### Health Checks
- Backend: `https://your-backend.onrender.com/api/health/`
- Database: Check Render dashboard
- Redis: Check Render dashboard

---

## Scaling

### Upgrade Plans
When ready for production:
1. **Backend**: Upgrade to Starter ($7/month) for:
   - No sleep on inactivity
   - Better performance
   - More resources

2. **Database**: Upgrade for:
   - More storage
   - Better performance
   - Automated backups

3. **Redis**: Upgrade for:
   - More memory
   - Persistence
   - Better performance

### Custom Domain
1. Go to Settings → Custom Domain
2. Add your domain
3. Update DNS records
4. Update CORS settings

---

## Backup Strategy

### Database Backups
- Render provides automated backups on paid plans
- Manual backup: Use `pg_dump`
- Store backups in cloud storage (S3, Google Cloud)

### Code Backups
- GitHub repository (already backed up)
- Tag releases: `git tag v1.0.0`

---

## Security Checklist

- [ ] SECRET_KEY is unique and secure
- [ ] DEBUG=False in production
- [ ] ALLOWED_HOSTS configured
- [ ] CORS properly configured
- [ ] Database uses SSL
- [ ] Environment variables not in code
- [ ] Rate limiting enabled
- [ ] HTTPS enforced

---

## Support

If you encounter issues:
1. Check Render status page
2. Review deployment logs
3. Check GitHub Issues
4. Contact Render support

---

**Deployment Complete!** 🎉

Your OLX clone is now live and ready for users!

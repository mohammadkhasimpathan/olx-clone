# Frontend Deployment Configuration

## Environment Variable for Render

When deploying the frontend to Render, add this environment variable:

```bash
VITE_API_URL=https://olx-clone-backend-6ho8.onrender.com/api
```

## Render Static Site Configuration

**Build Settings**:
- Build Command: `npm install && npm run build`
- Publish Directory: `dist`
- Root Directory: `frontend`

## Post-Deployment: Update Backend CORS

After frontend deploys, update backend environment variables with frontend URL:

```bash
CORS_ALLOWED_ORIGINS=https://your-frontend-url.onrender.com,https://olx-clone-backend-6ho8.onrender.com
CSRF_TRUSTED_ORIGINS=https://your-frontend-url.onrender.com,https://olx-clone-backend-6ho8.onrender.com
```

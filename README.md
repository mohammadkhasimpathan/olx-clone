# OLX Clone - Classified Ads Platform

A full-stack classified ads platform inspired by OLX, built with Django REST Framework and React. Features include user authentication with email verification, listing management with image uploads, advanced search and filtering, and production-ready deployment configurations.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/python-3.10+-blue.svg)
![Django](https://img.shields.io/badge/django-5.0+-green.svg)
![React](https://img.shields.io/badge/react-18.0+-blue.svg)

---

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Screenshots](#screenshots)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Local Development Setup](#local-development-setup)
  - [Environment Variables](#environment-variables)
- [Production Deployment](#production-deployment)
- [API Documentation](#api-documentation)
- [Security](#security)
- [Troubleshooting](#troubleshooting)
- [License](#license)

---

## ✨ Features

### **User Authentication**
- User registration and login with JWT tokens
- Email verification with OTP (One-Time Password)
- Password reset flow with email OTP
- Automatic token refresh
- Session expiration handling with auto-logout

### **Listing Management**
- Create, read, update, and delete listings
- Multi-image upload (up to 5 images per listing)
- Drag-and-drop image upload
- Image gallery with keyboard navigation
- Mark listings as sold
- Category-based organization

### **Search & Filtering**
- Full-text search across title, description, and location
- Filter by category
- Filter by availability (sold/available)
- Pagination support

### **User Experience**
- Toast notifications for user feedback
- Skeleton loading states
- Empty state components
- Responsive design (mobile-friendly)
- Image validation (type, size, count)
- Form validation with inline errors

### **Production Ready**
- API rate limiting (100/hour anon, 1000/hour auth)
- WhiteNoise for static file serving
- Production logging
- CSRF protection
- SSL/HTTPS enforcement
- Environment-based configuration
- Deployment configs for Render, Railway, Heroku

---

## 🛠 Tech Stack

### **Backend**
- **Framework**: Django 6.0.1 + Django REST Framework 3.16.1
- **Authentication**: JWT (djangorestframework-simplejwt)
- **Database**: PostgreSQL (production) / SQLite (development)
- **Image Processing**: Pillow
- **Email**: SMTP (production) / Console (development)
- **OTP**: PyOTP
- **CORS**: django-cors-headers
- **Filtering**: django-filter
- **WSGI Server**: Gunicorn
- **Static Files**: WhiteNoise

### **Frontend**
- **Framework**: React 18 + Vite
- **Routing**: React Router DOM
- **HTTP Client**: Axios
- **Styling**: Tailwind CSS
- **State Management**: Context API
- **Build Tool**: Vite

### **DevOps**
- **Version Control**: Git
- **Deployment**: Render / Railway / Heroku / AWS
- **Environment Management**: python-decouple
- **Database URL**: dj-database-url

---

## 🚀 Getting Started

### **Prerequisites**

- **Python**: 3.10 or higher
- **Node.js**: 16.0 or higher
- **npm**: 8.0 or higher
- **PostgreSQL**: 14.0 or higher (for production)
- **Git**: Latest version

### **Local Development Setup**

#### **1. Clone the Repository**
```bash
git clone https://github.com/yourusername/olx-clone.git
cd olx-clone
```

#### **2. Backend Setup**

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\\Scripts\\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file from example
cp .env.example .env

# Generate a secret key
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
# Copy the output and paste it as SECRET_KEY in .env

# Run migrations
python manage.py migrate

# Create superuser (optional)
python manage.py createsuperuser

# Create logs directory
mkdir logs

# Run development server
python manage.py runserver
```

Backend will be available at `http://localhost:8000`

#### **3. Frontend Setup**

```bash
# Navigate to frontend directory (from project root)
cd frontend

# Install dependencies
npm install

# Create .env file from example
cp .env.example .env

# Run development server
npm run dev
```

Frontend will be available at `http://localhost:5173`

#### **4. Access the Application**

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000/api
- **Admin Panel**: http://localhost:8000/admin

---

## 🔐 Environment Variables

### **Backend (.env)**

```bash
# Django Settings
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database
DATABASE_URL=sqlite:///db.sqlite3
# For PostgreSQL: postgresql://user:password@localhost:5432/dbname

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

# Email (Development - Console Backend)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=noreply@olxclone.com

# JWT (Optional - defaults are fine)
ACCESS_TOKEN_LIFETIME_MINUTES=15
REFRESH_TOKEN_LIFETIME_DAYS=7
```

### **Frontend (.env)**

```bash
# API URL
VITE_API_URL=http://localhost:8000/api
```

### **Production Environment Variables**

See [Production Deployment](#production-deployment) section for production-specific configuration.

---

## 🌐 Production Deployment

### **Render Deployment**

1. **Push code to GitHub**

2. **Create new Web Service on Render**
   - Connect your GitHub repository
   - Render will auto-detect `render.yaml`

3. **Set Environment Variables**
   ```bash
   DEBUG=False
   SECRET_KEY=<generate-strong-key>
   ALLOWED_HOSTS=your-app.onrender.com
   DATABASE_URL=<provided-by-render>
   CORS_ALLOWED_ORIGINS=https://your-frontend.onrender.com
   CSRF_TRUSTED_ORIGINS=https://your-app.onrender.com
   ```

4. **Deploy**
   - Render will automatically run migrations and collect static files
   - Frontend will be built and deployed as static site

### **Railway Deployment**

1. **Install Railway CLI** (optional)
   ```bash
   npm install -g @railway/cli
   ```

2. **Initialize Project**
   ```bash
   railway init
   ```

3. **Set Environment Variables**
   - Use Railway dashboard or CLI
   - Same variables as Render

4. **Deploy**
   ```bash
   railway up
   ```

### **Heroku Deployment**

1. **Install Heroku CLI**

2. **Create Heroku App**
   ```bash
   heroku create your-app-name
   ```

3. **Add PostgreSQL**
   ```bash
   heroku addons:create heroku-postgresql:mini
   ```

4. **Set Environment Variables**
   ```bash
   heroku config:set DEBUG=False
   heroku config:set SECRET_KEY=<your-secret-key>
   # ... other variables
   ```

5. **Deploy**
   ```bash
   git push heroku main
   ```

---

## 📚 API Documentation

### **Authentication Endpoints**

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/users/register/` | Register new user | No |
| POST | `/api/users/verify-email/` | Verify email with OTP | No |
| POST | `/api/users/resend-otp/` | Resend verification OTP | No |
| POST | `/api/users/login/` | Login and get JWT tokens | No |
| POST | `/api/users/token/refresh/` | Refresh access token | No |
| POST | `/api/users/request-password-reset/` | Request password reset OTP | No |
| POST | `/api/users/verify-reset-otp/` | Verify reset OTP | No |
| POST | `/api/users/reset-password/` | Reset password | No |
| GET | `/api/users/profile/` | Get user profile | Yes |
| PUT | `/api/users/profile/` | Update user profile | Yes |

### **Listing Endpoints**

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/listings/` | List all listings | No |
| POST | `/api/listings/` | Create new listing | Yes |
| GET | `/api/listings/{id}/` | Get listing details | No |
| PUT | `/api/listings/{id}/` | Update listing | Yes (owner) |
| DELETE | `/api/listings/{id}/` | Delete listing | Yes (owner) |
| GET | `/api/listings/my-listings/` | Get user's listings | Yes |
| PATCH | `/api/listings/{id}/mark_sold/` | Mark as sold | Yes (owner) |
| DELETE | `/api/listings/{id}/delete_image/?image_id={id}` | Delete image | Yes (owner) |

### **Category Endpoints**

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/categories/` | List all categories | No |
| GET | `/api/categories/{id}/` | Get category details | No |

### **Query Parameters**

**Listings**:
- `search`: Full-text search (title, description, location)
- `category`: Filter by category ID
- `is_sold`: Filter by sold status (true/false)
- `ordering`: Sort by field (e.g., `-created_at`, `price`)
- `page`: Page number for pagination

---

## 🔒 Security

### **Implemented Security Measures**

1. **Authentication**
   - JWT tokens with automatic refresh
   - Email verification required for login
   - Strong password validation (min 8 chars, not common, not numeric)
   - OTP expiration (5 minutes)

2. **API Protection**
   - Rate limiting (100/hour anon, 1000/hour auth)
   - CORS configuration
   - CSRF protection
   - Permission-based access control

3. **Data Validation**
   - Server-side validation for all inputs
   - Image file type and size validation
   - SQL injection prevention (Django ORM)
   - XSS protection (React escaping)

4. **Production Security**
   - HTTPS enforcement
   - Secure cookies
   - Security headers (XSS, Content-Type, Frame Options)
   - Environment-based secrets
   - No sensitive data in logs

### **Best Practices**

- Never commit `.env` files
- Use strong, unique `SECRET_KEY` in production
- Enable 2FA for deployment platform accounts
- Regularly update dependencies
- Monitor logs for suspicious activity
- Use PostgreSQL in production (not SQLite)

---

## 🐛 Troubleshooting

### **Common Issues**

#### **Backend won't start**
```bash
# Check if virtual environment is activated
which python  # Should point to venv

# Reinstall dependencies
pip install -r requirements.txt

# Check for migration issues
python manage.py showmigrations
python manage.py migrate
```

#### **Frontend won't start**
```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check Node version
node --version  # Should be 16+
```

#### **CORS errors**
- Ensure `CORS_ALLOWED_ORIGINS` in backend `.env` includes frontend URL
- Check that frontend is using correct API URL in `.env`

#### **Images not uploading**
- Check `MEDIA_ROOT` directory exists and is writable
- Verify image size is under 5MB
- Ensure file type is JPEG, PNG, GIF, or WEBP

#### **Email not sending**
- In development, emails print to console (check terminal)
- In production, verify SMTP credentials in `.env`
- For Gmail, use App Password, not regular password

#### **Rate limit errors**
- Wait for rate limit window to reset (1 hour)
- Increase limits in `settings.py` if needed for testing

### **Database Issues**

#### **Reset database (development only)**
```bash
# Delete database
rm db.sqlite3

# Delete migrations
find . -path "*/migrations/*.py" -not -name "__init__.py" -delete
find . -path "*/migrations/*.pyc" -delete

# Recreate migrations
python manage.py makemigrations
python manage.py migrate
```

### **Getting Help**

- Check the [Issues](https://github.com/yourusername/olx-clone/issues) page
- Review Django and React documentation
- Check deployment platform logs

---

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 🙏 Acknowledgments

- Django REST Framework documentation
- React documentation
- Tailwind CSS
- OLX for inspiration

---

## 📧 Contact

For questions or support, please open an issue on GitHub.

---

**Built with ❤️ using Django and React**

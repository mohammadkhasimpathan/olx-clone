# OLX-like Classified Ads Application - Backend

Production-quality classified ads platform built with Django REST Framework.

## Features

- ✅ JWT Authentication (access + refresh tokens)
- ✅ User registration and profile management
- ✅ Category-based ad organization
- ✅ Full CRUD operations for listings
- ✅ Multi-image upload (up to 5 images per listing)
- ✅ Advanced filtering and search
- ✅ Object-level permissions
- ✅ Input validation and security measures

## Tech Stack

- **Backend**: Django 6.0.1 + Django REST Framework
- **Authentication**: JWT (djangorestframework-simplejwt)
- **Database**: SQLite (development) / PostgreSQL (production)
- **Image Processing**: Pillow
- **Filtering**: django-filter

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and update values:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
DATABASE_URL=sqlite:///db.sqlite3
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

### 3. Run Migrations

```bash
python manage.py migrate
```

### 4. Create Superuser (Optional)

```bash
python manage.py createsuperuser
```

### 5. Load Sample Categories (Optional)

```bash
python manage.py shell
```

Then run:
```python
from categories.models import Category

categories = [
    {'name': 'Electronics', 'description': 'Phones, laptops, cameras, and gadgets'},
    {'name': 'Vehicles', 'description': 'Cars, bikes, and other vehicles'},
    {'name': 'Real Estate', 'description': 'Houses, apartments, and land'},
    {'name': 'Furniture', 'description': 'Home and office furniture'},
    {'name': 'Fashion', 'description': 'Clothing, shoes, and accessories'},
    {'name': 'Books', 'description': 'Books, magazines, and comics'},
    {'name': 'Sports', 'description': 'Sports equipment and gear'},
    {'name': 'Pets', 'description': 'Pets and pet accessories'},
]

for cat in categories:
    Category.objects.get_or_create(name=cat['name'], defaults={'description': cat['description']})

print("Categories created successfully!")
exit()
```

### 6. Run Development Server

```bash
python manage.py runserver
```

Server will be available at: `http://127.0.0.1:8000/`

## API Endpoints

### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/users/register/` | Register new user | No |
| POST | `/api/users/login/` | Login (get JWT tokens) | No |
| POST | `/api/users/token/refresh/` | Refresh access token | No |
| GET | `/api/users/profile/` | Get current user profile | Yes |
| PUT | `/api/users/profile/` | Update user profile | Yes |

### Categories

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/categories/` | List all categories | No |
| GET | `/api/categories/{slug}/` | Get category by slug | No |

### Listings

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/listings/` | List all listings | No |
| POST | `/api/listings/` | Create new listing | Yes |
| GET | `/api/listings/{id}/` | Get listing detail | No |
| PUT | `/api/listings/{id}/` | Update listing | Yes (owner) |
| PATCH | `/api/listings/{id}/` | Partial update | Yes (owner) |
| DELETE | `/api/listings/{id}/` | Delete listing | Yes (owner) |
| GET | `/api/listings/my-listings/` | Get user's listings | Yes |
| PATCH | `/api/listings/{id}/mark_sold/` | Mark as sold | Yes (owner) |
| DELETE | `/api/listings/{id}/delete_image/?image_id={id}` | Delete image | Yes (owner) |

### Filtering & Search

Listings support advanced filtering and search:

**Filter by category:**
```
GET /api/listings/?category=1
```

**Filter by location:**
```
GET /api/listings/?location=New York
```

**Filter by sold status:**
```
GET /api/listings/?is_sold=false
```

**Search by keyword:**
```
GET /api/listings/?search=laptop
```

**Combine filters:**
```
GET /api/listings/?category=1&is_sold=false&search=laptop
```

**Order results:**
```
GET /api/listings/?ordering=-created_at  # Newest first
GET /api/listings/?ordering=price        # Cheapest first
GET /api/listings/?ordering=-price       # Most expensive first
```

## API Request Examples

### 1. Register User

```bash
curl -X POST http://127.0.0.1:8000/api/users/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "email": "john@example.com",
    "password": "SecurePass123!",
    "password2": "SecurePass123!",
    "phone_number": "+1234567890",
    "location": "New York"
  }'
```

**Response:**
```json
{
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "first_name": "",
    "last_name": "",
    "phone_number": "+1234567890",
    "location": "New York",
    "created_at": "2026-01-13T18:25:00Z"
  },
  "message": "User registered successfully"
}
```

### 2. Login

```bash
curl -X POST http://127.0.0.1:8000/api/users/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "password": "SecurePass123!"
  }'
```

**Response:**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

### 3. Create Listing (with images)

```bash
curl -X POST http://127.0.0.1:8000/api/listings/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "title=iPhone 13 Pro Max" \
  -F "description=Excellent condition, barely used" \
  -F "price=899.99" \
  -F "category=1" \
  -F "location=New York" \
  -F "uploaded_images=@/path/to/image1.jpg" \
  -F "uploaded_images=@/path/to/image2.jpg"
```

### 4. Get All Listings

```bash
curl http://127.0.0.1:8000/api/listings/
```

### 5. Get User's Listings

```bash
curl http://127.0.0.1:8000/api/listings/my-listings/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 6. Mark Listing as Sold

```bash
curl -X PATCH http://127.0.0.1:8000/api/listings/1/mark_sold/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Security Features

### Input Validation
- All serializers have explicit field validation
- Password strength validation (min 8 chars, not common, not numeric only)
- Price validation (must be positive, max value)
- Title and description length validation
- Image validation (file type, size max 5MB, max 5 images)

### Authentication & Authorization
- JWT tokens with configurable expiry
- Access token: 15 minutes (default)
- Refresh token: 7 days (default)
- Object-level permissions (users can only modify their own listings)

### Security Headers
- CORS configured for specific origins
- CSRF protection enabled
- XSS protection via Django defaults
- SQL injection prevention via Django ORM

### Environment Variables
- All secrets stored in `.env` file
- `.env` file is gitignored
- `.env.example` provided as template

## Admin Panel

Access the Django admin panel at: `http://127.0.0.1:8000/admin/`

Features:
- Manage users, categories, and listings
- View and edit all data
- Inline image management for listings
- Advanced filtering and search

## Project Structure

```
backend/
├── olx_backend/          # Main project settings
│   ├── settings.py       # Django configuration
│   ├── urls.py           # Root URL routing
│   └── ...
├── users/                # User authentication app
│   ├── models.py         # Custom User model
│   ├── serializers.py    # User serializers
│   ├── views.py          # Auth endpoints
│   └── urls.py
├── categories/           # Categories app
│   ├── models.py         # Category model
│   ├── serializers.py
│   ├── views.py
│   └── urls.py
├── listings/             # Listings app
│   ├── models.py         # Listing & ListingImage models
│   ├── serializers.py    # Listing serializers with validation
│   ├── views.py          # Listing CRUD endpoints
│   ├── permissions.py    # Custom permissions
│   └── urls.py
├── media/                # User-uploaded images
├── manage.py
├── requirements.txt
├── .env                  # Environment variables (gitignored)
└── .env.example          # Environment template
```

## Database Models

### User
- Extends Django's AbstractUser
- Additional fields: `phone_number`, `location`

### Category
- `name`, `slug` (auto-generated), `description`, `icon`

### Listing
- `user` (ForeignKey), `category` (ForeignKey)
- `title`, `description`, `price`, `location`
- `is_sold` (boolean flag)
- Timestamps: `created_at`, `updated_at`

### ListingImage
- `listing` (ForeignKey)
- `image` (ImageField with validation)
- Max 5 images per listing
- Max 5MB per image

## Testing

Run Django tests:
```bash
python manage.py test
```

## Production Deployment

For production:

1. Set `DEBUG=False` in `.env`
2. Use PostgreSQL database
3. Set proper `ALLOWED_HOSTS`
4. Use a production WSGI server (gunicorn, uwsgi)
5. Serve static/media files via nginx or CDN
6. Enable HTTPS (SSL certificates)

## Next Steps

- Frontend development with React + Vite
- Integration testing
- Additional features (favorites, messaging, etc.)

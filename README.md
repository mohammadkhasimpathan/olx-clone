# OLX Clone - Full-Stack Marketplace Application

A production-ready online marketplace platform built with Django, React, and real-time chat functionality.

## 🚀 Live Demo

- **Frontend**: [https://olx-clone-frontend.onrender.com](https://olx-clone-frontend.onrender.com)
- **Backend API**: [https://olx-clone-backend-6ho8.onrender.com](https://olx-clone-backend-6ho8.onrender.com)

## ✨ Features

### Core Marketplace
- ✅ User authentication (JWT-based)
- ✅ Email verification with OTP
- ✅ Product listings with categories
- ✅ Advanced search and filtering
- ✅ Image uploads (Cloudinary)
- ✅ User profiles and trust scores
- ✅ Favorites/Wishlist
- ✅ Location-based filtering

### Real-Time Chat System
- ✅ WebSocket-based messaging
- ✅ Typing indicators
- ✅ Message delivery tracking (sent → delivered → read)
- ✅ Read receipts with status icons
- ✅ Online/offline status indicators
- ✅ WhatsApp-style notification sounds
- ✅ Browser notifications
- ✅ Conversation management (delete/hide)

### Notifications
- ✅ Real-time push notifications
- ✅ Email notifications
- ✅ In-app notification center
- ✅ Unread count badges

## 🛠️ Tech Stack

### Backend
- **Framework**: Django 6.0.1
- **API**: Django REST Framework 3.16.1
- **WebSockets**: Django Channels 4.3.2 + Daphne 4.2.1
- **Database**: PostgreSQL
- **Cache/Channels**: Redis 7.1.0
- **Authentication**: JWT (djangorestframework-simplejwt)
- **Storage**: Cloudinary
- **Server**: Gunicorn + Daphne

### Frontend
- **Framework**: React 18 + Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **State Management**: Context API
- **Build Tool**: Vite

### Infrastructure
- **Hosting**: Render.com
- **Database**: Render PostgreSQL
- **Redis**: Render Redis
- **CDN**: Cloudinary

## 📁 Project Structure

```
olx-clone/
├── backend/
│   ├── olx_backend/          # Django project settings
│   ├── users/                # User authentication & profiles
│   ├── listings/             # Product listings
│   ├── chat/                 # Real-time chat system
│   ├── notifications/        # Notification system
│   ├── manage.py
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── context/          # Context providers
│   │   ├── hooks/            # Custom hooks
│   │   ├── services/         # API services
│   │   └── utils/            # Utilities
│   ├── public/
│   │   └── sounds/           # Notification sounds
│   ├── package.json
│   └── vite.config.js
│
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Python 3.13+
- Node.js 18+
- PostgreSQL
- Redis

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Environment variables
cp .env.example .env
# Edit .env with your credentials

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Run development server
python manage.py runserver
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Environment variables
cp .env.example .env
# Edit .env with API URL

# Run development server
npm run dev
```

## 🔧 Environment Variables

### Backend (.env)
```env
SECRET_KEY=your-secret-key
DEBUG=False
DATABASE_URL=postgresql://user:pass@host:port/db
REDIS_URL=redis://host:port
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
FRONTEND_URL=https://your-frontend.com
```

### Frontend (.env)
```env
VITE_API_URL=https://your-backend.com
VITE_WS_URL=wss://your-backend.com
```

## 📡 WebSocket Endpoints

- **Chat**: `wss://backend.com/ws/chat/<conversation_id>/?token=<jwt>`
- **Notifications**: `wss://backend.com/ws/notifications/?token=<jwt>`

## 🎯 API Endpoints

### Authentication
- `POST /api/users/register/` - User registration
- `POST /api/users/login/` - User login
- `POST /api/users/verify-email/` - Email verification
- `POST /api/users/token/refresh/` - Refresh JWT token

### Listings
- `GET /api/listings/` - List all listings
- `POST /api/listings/` - Create listing
- `GET /api/listings/<id>/` - Get listing details
- `PUT /api/listings/<id>/` - Update listing
- `DELETE /api/listings/<id>/` - Delete listing

### Chat
- `GET /api/chat/conversations/` - List conversations
- `POST /api/chat/conversations/` - Create conversation
- `GET /api/chat/conversations/<id>/messages/` - Get messages
- `POST /api/chat/messages/` - Send message
- `POST /api/chat/conversations/<id>/hide/` - Delete conversation

### Notifications
- `GET /api/notifications/` - List notifications
- `POST /api/notifications/<id>/mark_read/` - Mark as read

## 🔒 Security Features

- JWT authentication with refresh tokens
- CORS configuration
- CSRF protection
- Rate limiting on API endpoints
- SQL injection prevention (Django ORM)
- XSS protection
- Secure WebSocket connections (WSS)

## 🎨 UI/UX Features

- Responsive design (mobile-first)
- Dark mode support
- Loading states and skeletons
- Error handling with user-friendly messages
- Toast notifications
- Image lazy loading
- Infinite scroll for listings
- Real-time updates

## 📊 Performance Optimizations

- Redis caching for frequently accessed data
- Database query optimization with select_related/prefetch_related
- Image optimization via Cloudinary
- Vite build optimization
- WebSocket heartbeat to prevent timeouts
- Lazy loading of components

## 🧪 Testing

### Backend
```bash
cd backend
python manage.py test
```

### Frontend
```bash
cd frontend
npm run test
```

## 📦 Deployment

### Render.com Deployment

**Backend**:
1. Create new Web Service
2. Connect GitHub repository
3. Build Command: `pip install -r requirements.txt`
4. Start Command: `daphne -b 0.0.0.0 -p $PORT olx_backend.asgi:application`
5. Add environment variables
6. Add PostgreSQL and Redis services

**Frontend**:
1. Create new Static Site
2. Build Command: `npm run build`
3. Publish Directory: `dist`
4. Add environment variables

## 🐛 Known Issues & Solutions

### WebSocket Connection Issues
- Ensure Redis is running
- Check ALLOWED_HOSTS includes your domain
- Verify WSS protocol in production

### Image Upload Failures
- Verify Cloudinary credentials
- Check file size limits
- Ensure CORS settings allow uploads

## 📝 Recent Updates

### Latest Commit: `da39f2b`
- Fixed zombie chat reconnection issue
- Added WhatsApp notification sound
- Improved delete chat UX
- Enhanced WebSocket stability

See [CHANGELOG.md](./CHANGELOG.md) for full history.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👥 Authors

- **Mohammad Khasim Pathan** - [GitHub](https://github.com/mohammadkhasimpathan)

## 🙏 Acknowledgments

- Django & Django Channels documentation
- React & Vite communities
- Render.com for hosting
- Cloudinary for image management

## 📞 Support

For issues and questions:
- GitHub Issues: [Create an issue](https://github.com/mohammadkhasimpathan/olx-clone/issues)
- Email: your-email@example.com

---

**Built with ❤️ using Django, React, and WebSockets**

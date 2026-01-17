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
![Django](https://img.shields.io/badge/Django-6.0.1-092E20?style=for-the-badge&logo=django&logoColor=white)
![DRF](https://img.shields.io/badge/DRF-3.16.1-ff1709?style=for-the-badge&logo=django&logoColor=white)
![Channels](https://img.shields.io/badge/Channels-4.3.2-092E20?style=for-the-badge&logo=django&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-7.1.0-DC382D?style=for-the-badge&logo=redis&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=JSON%20web%20tokens&logoColor=white)
![Cloudinary](https://img.shields.io/badge/Cloudinary-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white)

### Frontend
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![React Router](https://img.shields.io/badge/React_Router-v6-CA4245?style=for-the-badge&logo=react-router&logoColor=white)
![Axios](https://img.shields.io/badge/Axios-5A29E4?style=for-the-badge&logo=axios&logoColor=white)

### Infrastructure
![Render](https://img.shields.io/badge/Render-46E3B7?style=for-the-badge&logo=render&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)
![Cloudinary](https://img.shields.io/badge/Cloudinary-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white)

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
- Email: mohammadkhasim.p@gmail.com

---

**Built with ❤️ using Django, React, and WebSockets**

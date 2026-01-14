# OLX Clone - Frontend

React frontend for the OLX-like classified ads application.

## Features

- 🎨 Modern UI with Tailwind CSS
- 🔐 JWT Authentication
- 📱 Responsive Design
- 🖼️ Image Upload Support
- 🔍 Search and Filtering
- 🛡️ Protected Routes

## Tech Stack

- React 18
- Vite
- React Router DOM
- Axios
- Tailwind CSS

## Setup

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

**Note:** Make sure the Django backend is running at `http://127.0.0.1:8000`

## Project Structure

```
src/
├── components/
│   ├── common/          # Navbar, Footer
│   ├── auth/            # ProtectedRoute
│   ├── listings/        # Listing components
│   ├── profile/         # Profile components
│   └── filters/         # Filter components
├── pages/               # Page components
├── services/            # API services
├── context/             # React contexts
├── utils/               # Utility functions
├── App.jsx              # Main app component
└── main.jsx             # Entry point
```

## Available Pages

- `/` - Home (Browse listings)
- `/login` - Login
- `/register` - Register
- `/listings/:id` - Listing detail
- `/listings/create` - Create listing (protected)
- `/listings/:id/edit` - Edit listing (protected)
- `/profile` - User profile (protected)
- `/my-listings` - User's listings (protected)

## API Integration

The frontend communicates with the Django backend via Axios with automatic JWT token management.

All API requests are proxied through Vite to avoid CORS issues during development.

## Build for Production

```bash
npm run build
```

The production build will be in the `dist/` directory.

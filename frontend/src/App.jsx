import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { UIProvider } from './context/UIContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import SessionManager from './components/SessionManager';
import ErrorBoundary from './components/ErrorBoundary';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ListingDetail from './pages/ListingDetail';
import CreateListing from './pages/CreateListing';
import EditListing from './pages/EditListing';
import MyListings from './pages/MyListings';
import SavedListings from './pages/SavedListings';
import Profile from './pages/Profile';
import ChatList from './components/chat/ChatList';
import ChatWindow from './components/chat/ChatWindow';

// Components
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';

// Styles
import './index.css';

function App() {
  return (
    <ErrorBoundary>
      <UIProvider>
        <AuthProvider>
          <Router>
            <SessionManager />
            <div className="flex flex-col min-h-screen">
              <Navbar />
              <main className="flex-grow">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/listing/:id" element={<ListingDetail />} />

                  {/* Protected Routes */}
                  <Route path="/create-listing" element={
                    <ProtectedRoute>
                      <CreateListing />
                    </ProtectedRoute>
                  } />
                  <Route path="/edit-listing/:id" element={
                    <ProtectedRoute>
                      <EditListing />
                    </ProtectedRoute>
                  } />
                  <Route path="/my-listings" element={
                    <ProtectedRoute>
                      <MyListings />
                    </ProtectedRoute>
                  } />
                  <Route path="/saved-listings" element={
                    <ProtectedRoute>
                      <SavedListings />
                    </ProtectedRoute>
                  } />
                  <Route path="/profile" element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  } />
                  <Route path="/messages" element={
                    <ProtectedRoute>
                      <ChatList />
                    </ProtectedRoute>
                  } />
                  <Route path="/chat/:id" element={
                    <ProtectedRoute>
                      <ChatWindow />
                    </ProtectedRoute>
                  } />
                </Routes>
              </main>
              <Footer />
            </div>
          </Router>
        </AuthProvider>
      </UIProvider>
    </ErrorBoundary>
  );
}

export default App;

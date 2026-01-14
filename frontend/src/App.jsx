import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { UIProvider } from './context/UIContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import SessionManager from './components/SessionManager';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ListingDetail from './pages/ListingDetail';
import CreateListing from './pages/CreateListing';
import EditListing from './pages/EditListing';
import Profile from './pages/Profile';
import MyListings from './pages/MyListings';
import SavedListings from './pages/SavedListings';

// Admin Pages
import AdminRoute from './components/admin/AdminRoute';
import AdminLayout from './components/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminListings from './pages/admin/AdminListings';
import AdminUsers from './pages/admin/AdminUsers';
import AdminReports from './pages/admin/AdminReports';
import AdminAuditLog from './pages/admin/AdminAuditLog';

// Components
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import ToastContainer from './components/common/Toast';
import LoadingSpinner from './components/common/LoadingSpinner';

function App() {
  return (
    <UIProvider>
      <AuthProvider>
        <SessionManager />
        <Router>
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-grow">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/verify-email" element={<VerifyEmail />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/listings/:id" element={<ListingDetail />} />

                {/* Protected Routes */}
                <Route
                  path="/listings/create"
                  element={
                    <ProtectedRoute>
                      <CreateListing />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/listings/:id/edit"
                  element={
                    <ProtectedRoute>
                      <EditListing />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/my-listings"
                  element={
                    <ProtectedRoute>
                      <MyListings />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/saved-listings"
                  element={
                    <ProtectedRoute>
                      <SavedListings />
                    </ProtectedRoute>
                  }
                />

                {/* Admin Routes */}
                <Route
                  path="/admin"
                  element={
                    <AdminRoute>
                      <AdminLayout />
                    </AdminRoute>
                  }
                >
                  <Route index element={<AdminDashboard />} />
                  <Route path="listings" element={<AdminListings />} />
                  <Route path="users" element={<AdminUsers />} />
                  <Route path="reports" element={<AdminReports />} />
                  <Route path="audit-log" element={<AdminAuditLog />} />
                </Route>
              </Routes>
            </main>
            <Footer />
          </div>
          {/* Global UI Components */}
          <ToastContainer />
          <LoadingSpinner />
        </Router>
      </AuthProvider>
    </UIProvider>
  );
}

export default App;

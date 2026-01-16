import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { UIProvider } from './context/UIContext';
import { SSEProvider } from './contexts/SSEContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import SessionManager from './components/SessionManager';
import ErrorBoundary from './components/ErrorBoundary';

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

// Chat Pages
import ChatList from './components/chat/ChatList';
import ChatWindow from './components/chat/ChatWindow';

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
    <ErrorBoundary>
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

                  {/* Chat Routes */}
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
                  <SSEProvider>
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

                              {/* Chat Routes */}
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
                  </SSEProvider>
                </UIProvider>
              </ErrorBoundary>
              );
}

              export default App;

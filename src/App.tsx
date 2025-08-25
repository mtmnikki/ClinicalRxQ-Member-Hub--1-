import React, { useEffect } from 'react'
import { HashRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import Home from './pages/Home';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Resources from './pages/Resources';
import ProgramDetail from './pages/ProgramDetail';
import MemberContent from './pages/MemberContent';
import Account from './pages/Account';
import Bookmarks from './pages/Bookmarks';
import { useAuthStore } from './stores/authStore';
import ErrorBoundary from './components/common/ErrorBoundary';
import { Toaster } from 'sonner';
import ScrollToTop from './components/common/ScrollToTop';
import BackToTop from './components/common/BackToTop';
import ProfileBookmarksPanel from './components/resources/ProfileBookmarksPanel';
import './shadcn.css';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { AuthProvider } from './components/auth/AuthContext';

/**
 * App root component
 */
export default function App() {
  const { checkSession } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  // On initial application load, check for an existing session.
  useEffect(() => {
    const initializeSession = async () => {
      try {
        await checkSession();
      } catch (error) {
        console.error('Session check failed:', error);
      } finally {
        setIsLoading(false);
      }
    };
    initializeSession();
  }, [checkSession]);

  // Display a loading indicator while the session is being verified.
  // This prevents a "flash" of the login page for already authenticated accounts.
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <HashRouter>
      <ScrollToTop />
      <ErrorBoundary>
        <AuthProvider>
          <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/member-content"
            element={
              <ProtectedRoute>
                <MemberContent />
              </ProtectedRoute>
            }
          />
          <Route
            path="/resources"
            element={
              <ProtectedRoute>
                <Resources />
              </ProtectedRoute>
            }
          />
          <Route
            path="/program/:programSlug"
            element={
              <ProtectedRoute>
                <ProgramDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/account"
            element={
              <ProtectedRoute>
                <Account />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bookmarks"
            element={
              <ProtectedRoute>
                <Bookmarks />
              </ProtectedRoute>
            }
          />
        </Routes>
        </AuthProvider>
      </ErrorBoundary>
      {/* Global toaster for compact notifications across the app */}
      <Toaster position="top-center" richColors={false} closeButton={false} duration={1800} />
      {/* Global back-to-top button */}
      <BackToTop />
      {/* Global profile bookmarks panel */}
      <ProfileBookmarksPanel />
    </HashRouter>
  );
}

/**
 * ProtectedRoute gate component
 * Renders children when authenticated; otherwise redirects to /login.
 * Connects to the Zustand authStore to check authentication state.
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

/**
 * A wrapper component that requires an account to be authenticated.
 * If the account is not authenticated, it redirects to the /login page,
 * preserving the intended destination for a seamless redirect after login.
 */
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Get the authentication status from our global store
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const location = useLocation();

  // If the account is not authenticated, redirect them to the login page
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // If the account is authenticated, render the child components (the protected page)
  return <>{children}</>;
};

export default ProtectedRoute;

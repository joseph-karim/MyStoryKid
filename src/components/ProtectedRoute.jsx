import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import AuthModal from './AuthModal';
import LoadingSpinner from './LoadingSpinner';

/**
 * Higher-order component for protecting routes that require authentication
 */
const ProtectedRoute = ({ 
  children, 
  requireAuth = true, 
  allowGuest = false,
  redirectTo = '/login',
  showModal = true 
}) => {
  const { isAuthenticated, isAnonymous, isLoading, user } = useAuthStore();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // If authentication is required and user is not authenticated
    if (requireAuth && !isAuthenticated && !isLoading) {
      if (showModal) {
        setShowAuthModal(true);
      }
    }
  }, [requireAuth, isAuthenticated, isLoading, showModal]);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  // If authentication is not required, render children
  if (!requireAuth) {
    return children;
  }

  // If user is authenticated (including anonymous if allowed), render children
  if (isAuthenticated && (allowGuest || !isAnonymous)) {
    return children;
  }

  // If guest access is allowed and user is anonymous, render children
  if (allowGuest && isAnonymous) {
    return children;
  }

  // Handle authentication modal
  const handleAuthSuccess = () => {
    setShowAuthModal(false);
  };

  const handleAuthClose = () => {
    setShowAuthModal(false);
    // If modal is closed without authentication, redirect or stay
    if (!showModal) {
      // This will trigger a redirect
      return;
    }
  };

  // If showing modal and not authenticated, show the modal
  if (showModal && showAuthModal) {
    return (
      <>
        {children}
        <AuthModal
          isOpen={showAuthModal}
          onClose={handleAuthClose}
          onSuccess={handleAuthSuccess}
          mode="signin"
        />
      </>
    );
  }

  // If not showing modal or modal was closed, redirect
  if (!showModal || (!showAuthModal && !isAuthenticated)) {
    return (
      <Navigate 
        to={redirectTo} 
        state={{ from: location }} 
        replace 
      />
    );
  }

  // Default: render children (this shouldn't be reached in normal flow)
  return children;
};

/**
 * Hook for checking if a user can access a resource
 */
export const useAuthGuard = () => {
  const { isAuthenticated, isAnonymous, isLoading } = useAuthStore();

  const canAccess = (requireAuth = true, allowGuest = false) => {
    if (isLoading) return null; // Still checking
    if (!requireAuth) return true;
    if (isAuthenticated && (allowGuest || !isAnonymous)) return true;
    if (allowGuest && isAnonymous) return true;
    return false;
  };

  const requiresAuth = (allowGuest = false) => {
    const access = canAccess(true, allowGuest);
    return access === false; // Only return true if definitely requires auth
  };

  return {
    canAccess,
    requiresAuth,
    isAuthenticated,
    isAnonymous,
    isLoading
  };
};

export default ProtectedRoute; 
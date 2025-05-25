import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import AuthModal from './AuthModal';
import LoadingSpinner from './LoadingSpinner';
import supabase from '../lib/supabase';

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
  const { isAuthenticated, isAnonymous, isLoading, user, signOut } = useAuthStore();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [sessionError, setSessionError] = useState(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const location = useLocation();

  // Enhanced session management with automatic token refresh
  useEffect(() => {
    const checkSession = async () => {
      try {
        setIsCheckingSession(true);
        
        // Get current session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session check error:', error);
          setSessionError(error.message);
          
          // If session is invalid, sign out to clear state
          if (error.message.includes('invalid') || error.message.includes('expired')) {
            await signOut();
          }
          return;
        }

        // If we have a session but it's close to expiring, refresh it
        if (session && session.expires_at) {
          const expiresAt = new Date(session.expires_at * 1000);
          const now = new Date();
          const timeUntilExpiry = expiresAt.getTime() - now.getTime();
          
          // Refresh if token expires within 5 minutes
          if (timeUntilExpiry < 5 * 60 * 1000) {
            console.log('Token expiring soon, refreshing...');
            const { error: refreshError } = await supabase.auth.refreshSession();
            if (refreshError) {
              console.error('Token refresh failed:', refreshError);
              setSessionError('Session expired. Please sign in again.');
              await signOut();
            }
          }
        }
        
        setSessionError(null);
      } catch (error) {
        console.error('Session management error:', error);
        setSessionError('Authentication error occurred.');
      } finally {
        setIsCheckingSession(false);
      }
    };

    // Check session on mount and when auth state changes
    if (!isLoading) {
      checkSession();
    }

    // Set up auth state change listener for automatic token refresh
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);
      
      if (event === 'TOKEN_REFRESHED') {
        console.log('Token refreshed successfully');
        setSessionError(null);
      } else if (event === 'SIGNED_OUT') {
        setSessionError(null);
      } else if (event === 'SIGNED_IN') {
        setSessionError(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [isLoading, signOut]);

  useEffect(() => {
    // If authentication is required and user is not authenticated
    if (requireAuth && !isAuthenticated && !isLoading && !isCheckingSession) {
      if (showModal) {
        setShowAuthModal(true);
      }
    }
  }, [requireAuth, isAuthenticated, isLoading, isCheckingSession, showModal]);

  // Show loading spinner while checking authentication or session
  if (isLoading || isCheckingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="large" />
          <p className="mt-4 text-gray-600">
            {isCheckingSession ? 'Verifying session...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  // Show session error if there's an authentication issue
  if (sessionError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <h3 className="text-lg font-medium text-red-800 mb-2">Authentication Error</h3>
            <p className="text-red-600">{sessionError}</p>
          </div>
          <button
            onClick={() => {
              setSessionError(null);
              setShowAuthModal(true);
            }}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Sign In Again
          </button>
        </div>
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
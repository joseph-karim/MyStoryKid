import React, { useEffect, useState } from 'react';
import useAuthStore from '../store/useAuthStore';
import supabase from '../lib/supabase';
import LoadingSpinner from './LoadingSpinner';

/**
 * Global authentication guard that handles session initialization
 * and automatic token refresh for the entire application
 */
const AuthGuard = ({ children }) => {
  const [isInitializing, setIsInitializing] = useState(true);
  const [initError, setInitError] = useState(null);
  const { setUser, setIsAuthenticated, setIsAnonymous, signOut } = useAuthStore();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('Initializing authentication...');
        
        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Failed to get initial session:', error);
          setInitError(error.message);
          return;
        }

        // Update auth store with initial session
        if (session) {
          const isAnonymous = !session.user.email && session.user.app_metadata?.provider === 'anonymous';
          setUser(session.user);
          setIsAuthenticated(true);
          setIsAnonymous(isAnonymous);
          console.log('Initial session loaded:', isAnonymous ? 'Anonymous user' : 'Authenticated user');
        } else {
          setUser(null);
          setIsAuthenticated(false);
          setIsAnonymous(false);
          console.log('No initial session found');
        }

        setInitError(null);
      } catch (error) {
        console.error('Auth initialization error:', error);
        setInitError('Failed to initialize authentication');
      } finally {
        setIsInitializing(false);
      }
    };

    // Initialize auth on app start
    initializeAuth();

    // Set up auth state change listener for the entire app
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Global auth state change:', event);

      try {
        switch (event) {
          case 'SIGNED_IN':
            if (session) {
              const isAnonymous = !session.user.email && session.user.app_metadata?.provider === 'anonymous';
              setUser(session.user);
              setIsAuthenticated(true);
              setIsAnonymous(isAnonymous);
              console.log('User signed in:', isAnonymous ? 'Anonymous' : 'Authenticated');
            }
            break;

          case 'SIGNED_OUT':
            setUser(null);
            setIsAuthenticated(false);
            setIsAnonymous(false);
            console.log('User signed out');
            break;

          case 'TOKEN_REFRESHED':
            if (session) {
              const isAnonymous = !session.user.email && session.user.app_metadata?.provider === 'anonymous';
              setUser(session.user);
              setIsAuthenticated(true);
              setIsAnonymous(isAnonymous);
              console.log('Token refreshed successfully');
            }
            break;

          case 'USER_UPDATED':
            if (session) {
              const isAnonymous = !session.user.email && session.user.app_metadata?.provider === 'anonymous';
              setUser(session.user);
              setIsAuthenticated(true);
              setIsAnonymous(isAnonymous);
              console.log('User updated');
            }
            break;

          default:
            console.log('Unhandled auth event:', event);
        }
      } catch (error) {
        console.error('Error handling auth state change:', error);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setUser, setIsAuthenticated, setIsAnonymous, signOut]);

  // Show loading screen during initialization
  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
        <div className="text-center">
          <LoadingSpinner size="large" />
          <h2 className="mt-4 text-xl font-semibold text-gray-700">Initializing MyStoryKid</h2>
          <p className="mt-2 text-gray-600">Setting up your magical experience...</p>
        </div>
      </div>
    );
  }

  // Show error screen if initialization failed
  if (initError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-red-100 border border-red-300 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-red-800 mb-2">Initialization Error</h2>
            <p className="text-red-600 mb-4">{initError}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render the app once initialization is complete
  return children;
};

export default AuthGuard; 
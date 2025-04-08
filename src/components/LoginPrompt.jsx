import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { handleBookAction, completeAuthFlow } from '../services/anonymousAuthService';
import supabase from '../services/supabaseClient';

/**
 * A component that prompts the user to log in or sign up when they try to
 * perform an action that requires authentication (download, save, print).
 */
const LoginPrompt = ({ bookId, actionType, onClose, onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Check if action requires authentication
  useEffect(() => {
    const checkAuthRequirement = async () => {
      try {
        const { requiresAuth, error } = await handleBookAction(bookId);
        
        if (!requiresAuth) {
          // User is already authenticated, proceed with action
          onSuccess();
          onClose();
        }
      } catch (err) {
        console.error('Error checking auth requirement:', err);
        setError('Failed to check authentication status');
      }
    };
    
    checkAuthRequirement();
  }, [bookId, onSuccess, onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      let authResult;
      
      if (isSignUp) {
        // Sign up
        authResult = await supabase.auth.signUp({
          email,
          password,
        });
      } else {
        // Sign in
        authResult = await supabase.auth.signInWithPassword({
          email,
          password,
        });
      }
      
      if (authResult.error) {
        throw new Error(authResult.error.message);
      }
      
      // Complete the auth flow (claim the book)
      const { success, claimed, error: claimError } = await completeAuthFlow();
      
      if (claimError) {
        console.warn('Book claiming had an issue:', claimError);
        // We can still proceed even if claiming fails
      }
      
      if (claimed) {
        console.log(`Successfully claimed book: ${bookId}`);
      }
      
      // Close the modal and trigger success callback
      onSuccess();
      onClose();
      
    } catch (err) {
      console.error('Authentication error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-6 text-center">
          {isSignUp ? 'Create an Account' : 'Log In'}
        </h2>
        
        <p className="mb-6 text-gray-600">
          {actionType === 'download' && 'To download your book, please log in or create an account.'}
          {actionType === 'save' && 'To save your book, please log in or create an account.'}
          {actionType === 'print' && 'To print your book, please log in or create an account.'}
          {!actionType && 'Please log in or create an account to continue.'}
        </p>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-700 mb-2" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>
          
          <button
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md"
            disabled={loading}
          >
            {loading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Log In')}
          </button>
        </form>
        
        <div className="mt-4 text-center">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-blue-500 hover:text-blue-700"
          >
            {isSignUp ? 'Already have an account? Log in' : 'Need an account? Sign up'}
          </button>
        </div>
        
        <div className="mt-4 text-center">
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPrompt;
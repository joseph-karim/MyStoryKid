import { create } from 'zustand';
import supabase from '../services/supabaseClient';
import { isAnonymousUser } from '../services/anonymousAuthService';

// Create a store for authentication state
const useAuthStore = create((set, get) => ({
  // Initial state
  user: null,
  isAuthenticated: false,
  isAnonymous: false,
  isLoading: true,
  
  // Initialize auth state from Supabase session
  initialize: async () => {
    set({ isLoading: true });
    
    try {
      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        const anonymous = await isAnonymousUser();
        
        set({
          user: session.user,
          isAuthenticated: true,
          isAnonymous: anonymous,
        });
      } else {
        set({
          user: null,
          isAuthenticated: false,
          isAnonymous: false,
        });
      }
    } catch (error) {
      console.error('Error initializing auth state:', error);
    } finally {
      set({ isLoading: false });
    }
  },
  
  // Sign in with email and password
  signIn: async (email, password) => {
    set({ isLoading: true });
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      set({
        user: data.user,
        isAuthenticated: true,
        isAnonymous: false,
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error signing in:', error);
      return { success: false, error: error.message };
    } finally {
      set({ isLoading: false });
    }
  },
  
  // Sign up with email and password
  signUp: async (email, password) => {
    set({ isLoading: true });
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) throw error;
      
      set({
        user: data.user,
        isAuthenticated: true,
        isAnonymous: false,
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error signing up:', error);
      return { success: false, error: error.message };
    } finally {
      set({ isLoading: false });
    }
  },
  
  // Sign in with social provider (Google, Facebook, etc.)
  signInWithProvider: async (provider) => {
    set({ isLoading: true });
    
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      });
      
      if (error) throw error;
      
      // OAuth redirects to the provider, so we don't set state here
      // The auth state change listener will handle the state update
      return { success: true };
    } catch (error) {
      console.error(`Error signing in with ${provider}:`, error);
      return { success: false, error: error.message };
    } finally {
      set({ isLoading: false });
    }
  },

  // Sign out
  signOut: async () => {
    set({ isLoading: true });
    
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;
      
      set({
        user: null,
        isAuthenticated: false,
        isAnonymous: false,
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error signing out:', error);
      return { success: false, error: error.message };
    } finally {
      set({ isLoading: false });
    }
  },
  
  // Set loading state
  setLoading: (isLoading) => set({ isLoading }),
  
  // Direct state setters for AuthGuard
  setUser: (user) => set({ user }),
  setIsAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
  setIsAnonymous: (isAnonymous) => set({ isAnonymous }),
  
  // For backward compatibility
  login: (userData) => set({
    user: userData,
    isAuthenticated: true,
    isAnonymous: false,
  }),
  
  logout: () => get().signOut(),
}));

// Set up auth state listener
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN') {
    useAuthStore.getState().initialize();
  } else if (event === 'SIGNED_OUT') {
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isAnonymous: false,
    });
  }
});

// Initialize auth state
useAuthStore.getState().initialize();

export default useAuthStore;
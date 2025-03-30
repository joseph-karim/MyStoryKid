import { create } from 'zustand';

// This is a placeholder store for authentication
// Later we'll integrate with Firebase and add more functionality
const useAuthStore = create((set) => ({
  // User state - default to authenticated for testing
  user: { id: 'test-user', displayName: 'Test User', email: 'test@example.com' },
  isAuthenticated: true,
  isLoading: false,

  // Actions
  login: (userData) => set({ 
    user: userData, 
    isAuthenticated: true 
  }),
  
  logout: () => set({ 
    user: null, 
    isAuthenticated: false 
  }),
  
  setLoading: (isLoading) => set({ 
    isLoading 
  }),
}));

export default useAuthStore; 
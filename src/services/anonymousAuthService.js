import supabase from './supabaseClient';

/**
 * Handles anonymous authentication and book ownership transfer.
 * This service manages the flow for allowing users to create books anonymously
 * and then claim ownership after login/signup.
 */

/**
 * Signs in anonymously if the user doesn't have a session.
 * Call this when starting the book creation wizard.
 * @returns {Promise<{success: boolean, session: object|null, error: string|null}>}
 */
export const ensureAnonymousSession = async () => {
  try {
    // Check if we already have a session (anonymous or authenticated)
    const { data: { session } } = await supabase.auth.getSession();
    
    // If we have a valid session, return it
    if (session) {
      console.log('Using existing session:', 
        session.user?.email ? 'Authenticated user' : 'Anonymous user');
      return { success: true, session, error: null };
    }
    
    // No session, sign in anonymously
    console.log('No session found, signing in anonymously');
    const { data, error } = await supabase.auth.signInAnonymously();
    
    if (error) {
      console.error('Anonymous sign-in failed:', error.message);
      return { success: false, session: null, error: error.message };
    }
    
    console.log('Anonymous sign-in successful');
    return { success: true, session: data.session, error: null };
  } catch (error) {
    console.error('Error in ensureAnonymousSession:', error);
    return { success: false, session: null, error: error.message };
  }
};

/**
 * Checks if the current user is anonymous.
 * @returns {Promise<boolean>} True if the user is anonymous, false if authenticated or no session.
 */
export const isAnonymousUser = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    // No session means not signed in at all
    if (!session) return false;
    
    // Check if this is an anonymous session
    // Anonymous users typically have no email and a provider of 'anonymous'
    return !session.user.email && session.user.app_metadata?.provider === 'anonymous';
  } catch (error) {
    console.error('Error checking if user is anonymous:', error);
    return false;
  }
};

/**
 * Claims ownership of a book after a user logs in.
 * Call this after successful login/signup if there's a book ID in localStorage.
 * @param {string} bookId - The UUID of the book to claim
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export const claimBook = async (bookId) => {
  if (!bookId) {
    console.error('No book ID provided to claim');
    return { success: false, error: 'No book ID provided' };
  }
  
  try {
    // Call the claim_book function we created in the database
    const { data, error } = await supabase.rpc('claim_book', {
      book_id_to_claim: bookId
    });
    
    if (error) {
      console.error('Error claiming book:', error);
      return { success: false, error: error.message };
    }
    
    console.log(`Successfully claimed book: ${bookId}`);
    return { success: true, error: null };
  } catch (error) {
    console.error('Exception claiming book:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Stores the current book ID in localStorage.
 * Call this when a new book is created in the wizard.
 * @param {string} bookId - The UUID of the book to store
 */
export const storeCurrentBookId = (bookId) => {
  if (!bookId) {
    console.error('Attempted to store empty book ID');
    return;
  }
  localStorage.setItem('currentBookId', bookId);
  console.log(`Stored current book ID in localStorage: ${bookId}`);
};

/**
 * Retrieves the current book ID from localStorage.
 * @returns {string|null} The book ID or null if not found
 */
export const getCurrentBookId = () => {
  const bookId = localStorage.getItem('currentBookId');
  return bookId;
};

/**
 * Clears the current book ID from localStorage.
 * Call this after successful claim or when starting a new book.
 */
export const clearCurrentBookId = () => {
  localStorage.removeItem('currentBookId');
  console.log('Cleared current book ID from localStorage');
};

/**
 * Handles the login/signup and book claiming process.
 * Call this when a user attempts to download, save, or print a book.
 * @param {string} bookId - The UUID of the book to claim
 * @param {Function} loginCallback - Function to call to show login UI
 * @returns {Promise<{success: boolean, requiresAuth: boolean, error: string|null}>}
 */
export const handleBookAction = async (bookId, loginCallback) => {
  try {
    // Check if user is anonymous
    const anonymous = await isAnonymousUser();
    
    // If not anonymous, they can proceed with the action
    if (!anonymous) {
      return { success: true, requiresAuth: false, error: null };
    }
    
    // Store the book ID for claiming after login
    storeCurrentBookId(bookId);
    
    // Trigger the login UI
    if (loginCallback && typeof loginCallback === 'function') {
      loginCallback();
    }
    
    // Indicate that authentication is required
    return { success: false, requiresAuth: true, error: null };
  } catch (error) {
    console.error('Error in handleBookAction:', error);
    return { success: false, requiresAuth: false, error: error.message };
  }
};

/**
 * Completes the post-login flow by claiming any pending book.
 * Call this after successful login/signup.
 * @returns {Promise<{success: boolean, claimed: boolean, bookId: string|null, error: string|null}>}
 */
export const completeAuthFlow = async () => {
  try {
    // Check if there's a book to claim
    const bookId = getCurrentBookId();
    
    if (!bookId) {
      // No book to claim, just a normal login
      return { success: true, claimed: false, bookId: null, error: null };
    }
    
    // Claim the book
    const { success, error } = await claimBook(bookId);
    
    if (!success) {
      return { success: false, claimed: false, bookId, error };
    }
    
    // Clear the stored book ID
    clearCurrentBookId();
    
    return { success: true, claimed: true, bookId, error: null };
  } catch (error) {
    console.error('Error completing auth flow:', error);
    return { success: false, claimed: false, bookId: null, error: error.message };
  }
};
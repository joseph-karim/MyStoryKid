/**
 * Database Service
 * 
 * This service handles all database operations for MyStoryKid,
 * providing a clean interface between the application and Supabase.
 */

import { supabase } from '../lib/supabase';

/**
 * Book Management
 */

/**
 * Save a book to the database
 * @param {Object} bookData - The book data to save
 * @param {string} anonymousSessionId - Optional anonymous session ID
 * @returns {Promise<Object>} - The saved book data
 */
export const saveBook = async (bookData, anonymousSessionId = null) => {
  try {
    console.log('[databaseService] Saving book:', bookData.id);
    
    // Prepare book data for database
    const bookRecord = {
      id: bookData.id,
      title: bookData.title,
      status: bookData.status || 'draft',
      child_name: bookData.childName,
      category: bookData.category,
      art_style_code: bookData.artStyleCode,
      custom_style_description: bookData.customStyleDescription,
      age_range: bookData.ageRange,
      story_type: bookData.storyType,
      word_count: bookData.wordCount,
      page_count: bookData.pages?.length || 0,
      cover_image_url: bookData.coverImageUrl || bookData.pages?.find(p => p.type === 'cover')?.imageUrl,
      thumbnail_url: bookData.thumbnailUrl,
      generation_data: {
        storyData: bookData.generationData || {},
        wizardState: bookData.wizardState || {}
      },
      metadata: bookData.metadata || {},
      is_public: bookData.isPublic || false,
      anonymous_session_id: anonymousSessionId
    };

    // Insert or update book
    const { data: book, error: bookError } = await supabase
      .from('books')
      .upsert(bookRecord)
      .select()
      .single();

    if (bookError) throw bookError;

    // Save characters
    if (bookData.characters && bookData.characters.length > 0) {
      await saveBookCharacters(book.id, bookData.characters);
    }

    // Save pages
    if (bookData.pages && bookData.pages.length > 0) {
      await saveBookPages(book.id, bookData.pages);
    }

    console.log('[databaseService] Book saved successfully:', book.id);
    return book;
  } catch (error) {
    console.error('[databaseService] Error saving book:', error);
    throw new Error(`Failed to save book: ${error.message}`);
  }
};

/**
 * Get a book by ID
 * @param {string} bookId - The book ID
 * @returns {Promise<Object>} - The book data with characters and pages
 */
export const getBook = async (bookId) => {
  try {
    console.log('[databaseService] Getting book:', bookId);
    
    const { data: book, error: bookError } = await supabase
      .from('books')
      .select(`
        *,
        characters (*),
        book_pages (*)
      `)
      .eq('id', bookId)
      .single();

    if (bookError) throw bookError;
    if (!book) throw new Error('Book not found');

    // Transform database format to application format
    const transformedBook = {
      id: book.id,
      title: book.title,
      status: book.status,
      childName: book.child_name,
      category: book.category,
      artStyleCode: book.art_style_code,
      customStyleDescription: book.custom_style_description,
      ageRange: book.age_range,
      storyType: book.story_type,
      wordCount: book.word_count,
      pageCount: book.page_count,
      coverImageUrl: book.cover_image_url,
      thumbnailUrl: book.thumbnail_url,
      generationData: book.generation_data?.storyData || {},
      wizardState: book.generation_data?.wizardState || {},
      metadata: book.metadata || {},
      isPublic: book.is_public,
      isClaimed: book.is_claimed,
      createdAt: book.created_at,
      updatedAt: book.updated_at,
      characters: book.characters.map(transformCharacterFromDB),
      pages: book.book_pages
        .sort((a, b) => a.page_number - b.page_number)
        .map(transformPageFromDB)
    };

    return transformedBook;
  } catch (error) {
    console.error('[databaseService] Error getting book:', error);
    throw new Error(`Failed to get book: ${error.message}`);
  }
};

/**
 * Get all books for a user
 * @param {string} userId - The user ID (optional for anonymous users)
 * @param {string} anonymousSessionId - Anonymous session ID
 * @returns {Promise<Array>} - Array of books
 */
export const getUserBooks = async (userId = null, anonymousSessionId = null) => {
  try {
    console.log('[databaseService] Getting user books for:', userId || 'anonymous');
    
    let query = supabase
      .from('books')
      .select(`
        id,
        title,
        status,
        child_name,
        category,
        art_style_code,
        cover_image_url,
        thumbnail_url,
        created_at,
        updated_at,
        page_count
      `)
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    } else if (anonymousSessionId) {
      query = query
        .is('user_id', null)
        .eq('anonymous_session_id', anonymousSessionId);
    } else {
      return []; // No user ID or session ID provided
    }

    const { data: books, error } = await query;

    if (error) throw error;

    return books.map(book => ({
      id: book.id,
      title: book.title,
      status: book.status,
      childName: book.child_name,
      category: book.category,
      artStyleCode: book.art_style_code,
      coverImageUrl: book.cover_image_url,
      thumbnailUrl: book.thumbnail_url,
      createdAt: book.created_at,
      updatedAt: book.updated_at,
      pageCount: book.page_count
    }));
  } catch (error) {
    console.error('[databaseService] Error getting user books:', error);
    throw new Error(`Failed to get user books: ${error.message}`);
  }
};

/**
 * Update book status
 * @param {string} bookId - The book ID
 * @param {string} status - The new status
 * @returns {Promise<Object>} - Updated book data
 */
export const updateBookStatus = async (bookId, status) => {
  try {
    const { data, error } = await supabase
      .from('books')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', bookId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('[databaseService] Error updating book status:', error);
    throw new Error(`Failed to update book status: ${error.message}`);
  }
};

/**
 * Claim a book for an authenticated user
 * @param {string} bookId - The book ID to claim
 * @returns {Promise<boolean>} - Success status
 */
export const claimBook = async (bookId) => {
  try {
    const { data, error } = await supabase.rpc('claim_book', {
      book_id_to_claim: bookId
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('[databaseService] Error claiming book:', error);
    throw new Error(`Failed to claim book: ${error.message}`);
  }
};

/**
 * Character Management
 */

/**
 * Save characters for a book
 * @param {string} bookId - The book ID
 * @param {Array} characters - Array of character data
 * @returns {Promise<Array>} - Saved characters
 */
export const saveBookCharacters = async (bookId, characters) => {
  try {
    // Delete existing characters for this book
    await supabase
      .from('characters')
      .delete()
      .eq('book_id', bookId);

    // Insert new characters
    const characterRecords = characters.map(char => ({
      book_id: bookId,
      name: char.name,
      role: char.role,
      character_type: char.type || 'child',
      gender: char.gender,
      age: char.age,
      relationship: char.relationship,
      traits: char.traits || [],
      interests: char.interests || [],
      photo_url: char.photoUrl,
      style_preview_url: char.stylePreview,
      art_style: char.artStyle,
      appearance_description: char.appearanceDescription
    }));

    const { data, error } = await supabase
      .from('characters')
      .insert(characterRecords)
      .select();

    if (error) throw error;
    return data.map(transformCharacterFromDB);
  } catch (error) {
    console.error('[databaseService] Error saving characters:', error);
    throw new Error(`Failed to save characters: ${error.message}`);
  }
};

/**
 * Page Management
 */

/**
 * Save pages for a book
 * @param {string} bookId - The book ID
 * @param {Array} pages - Array of page data
 * @returns {Promise<Array>} - Saved pages
 */
export const saveBookPages = async (bookId, pages) => {
  try {
    // Delete existing pages for this book
    await supabase
      .from('book_pages')
      .delete()
      .eq('book_id', bookId);

    // Insert new pages
    const pageRecords = pages.map((page, index) => ({
      book_id: bookId,
      page_number: index,
      page_type: page.type,
      spread_number: page.spreadNumber,
      text_content: page.text,
      visual_prompt: page.visualPrompt,
      image_url: page.imageUrl,
      image_generation_status: page.imageGenerationStatus || 'completed',
      enhancement_applied: page.enhancementApplied || false
    }));

    const { data, error } = await supabase
      .from('book_pages')
      .insert(pageRecords)
      .select();

    if (error) throw error;
    return data.map(transformPageFromDB);
  } catch (error) {
    console.error('[databaseService] Error saving pages:', error);
    throw new Error(`Failed to save pages: ${error.message}`);
  }
};

/**
 * Order Management
 */

/**
 * Create an order
 * @param {Object} orderData - The order data
 * @returns {Promise<Object>} - Created order
 */
export const createOrder = async (orderData) => {
  try {
    const orderRecord = {
      user_id: orderData.userId,
      book_id: orderData.bookId,
      shopify_order_id: orderData.shopifyOrderId,
      lulu_job_id: orderData.luluJobId,
      order_type: orderData.orderType,
      status: orderData.status || 'pending',
      total_amount: orderData.totalAmount,
      currency: orderData.currency || 'USD',
      shipping_address: orderData.shippingAddress,
      shipping_method: orderData.shippingMethod,
      enhancement_applied: orderData.enhancementApplied || false,
      enhancement_cost: orderData.enhancementCost,
      print_specifications: orderData.printSpecifications,
      fulfillment_data: orderData.fulfillmentData
    };

    const { data, error } = await supabase
      .from('orders')
      .insert(orderRecord)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('[databaseService] Error creating order:', error);
    throw new Error(`Failed to create order: ${error.message}`);
  }
};

/**
 * Get orders for a user
 * @param {string} userId - The user ID
 * @returns {Promise<Array>} - Array of orders
 */
export const getUserOrders = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        books (id, title, child_name, cover_image_url),
        digital_downloads (*),
        print_jobs (*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('[databaseService] Error getting user orders:', error);
    throw new Error(`Failed to get user orders: ${error.message}`);
  }
};

/**
 * Update order status
 * @param {string} orderId - The order ID
 * @param {string} status - The new status
 * @param {Object} fulfillmentData - Additional fulfillment data
 * @returns {Promise<Object>} - Updated order
 */
export const updateOrderStatus = async (orderId, status, fulfillmentData = {}) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .update({ 
        status, 
        fulfillment_data: fulfillmentData,
        updated_at: new Date().toISOString() 
      })
      .eq('id', orderId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('[databaseService] Error updating order status:', error);
    throw new Error(`Failed to update order status: ${error.message}`);
  }
};

/**
 * Digital Downloads Management
 */

/**
 * Create a digital download record
 * @param {Object} downloadData - The download data
 * @returns {Promise<Object>} - Created download record
 */
export const createDigitalDownload = async (downloadData) => {
  try {
    const downloadRecord = {
      order_id: downloadData.orderId,
      user_id: downloadData.userId,
      book_id: downloadData.bookId,
      download_url: downloadData.downloadUrl,
      filename: downloadData.filename,
      file_size_bytes: downloadData.fileSizeBytes,
      max_downloads: downloadData.maxDownloads || 5,
      expires_at: downloadData.expiresAt
    };

    const { data, error } = await supabase
      .from('digital_downloads')
      .insert(downloadRecord)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('[databaseService] Error creating digital download:', error);
    throw new Error(`Failed to create digital download: ${error.message}`);
  }
};

/**
 * Record a download attempt
 * @param {string} downloadId - The download ID
 * @returns {Promise<Object>} - Updated download record
 */
export const recordDownloadAttempt = async (downloadId) => {
  try {
    const { data, error } = await supabase
      .from('digital_downloads')
      .update({ 
        download_count: supabase.raw('download_count + 1'),
        last_downloaded_at: new Date().toISOString()
      })
      .eq('id', downloadId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('[databaseService] Error recording download attempt:', error);
    throw new Error(`Failed to record download attempt: ${error.message}`);
  }
};

/**
 * Print Jobs Management
 */

/**
 * Create a print job record
 * @param {Object} printJobData - The print job data
 * @returns {Promise<Object>} - Created print job record
 */
export const createPrintJob = async (printJobData) => {
  try {
    const printJobRecord = {
      order_id: printJobData.orderId,
      book_id: printJobData.bookId,
      lulu_job_id: printJobData.luluJobId,
      pod_package_id: printJobData.podPackageId,
      status: printJobData.status || 'submitted',
      interior_pdf_url: printJobData.interiorPdfUrl,
      cover_pdf_url: printJobData.coverPdfUrl,
      shipping_level: printJobData.shippingLevel,
      cost_breakdown: printJobData.costBreakdown
    };

    const { data, error } = await supabase
      .from('print_jobs')
      .insert(printJobRecord)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('[databaseService] Error creating print job:', error);
    throw new Error(`Failed to create print job: ${error.message}`);
  }
};

/**
 * Update print job status
 * @param {string} luluJobId - The Lulu job ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} - Updated print job
 */
export const updatePrintJobStatus = async (luluJobId, updateData) => {
  try {
    const { data, error } = await supabase
      .from('print_jobs')
      .update({ 
        ...updateData,
        updated_at: new Date().toISOString() 
      })
      .eq('lulu_job_id', luluJobId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('[databaseService] Error updating print job status:', error);
    throw new Error(`Failed to update print job status: ${error.message}`);
  }
};

/**
 * Book Sharing Management
 */

/**
 * Create a book share
 * @param {string} bookId - The book ID
 * @param {string} shareType - The share type
 * @param {number} expiresInDays - Days until expiration
 * @returns {Promise<string>} - Share token
 */
export const createBookShare = async (bookId, shareType = 'preview', expiresInDays = 30) => {
  try {
    const { data, error } = await supabase.rpc('create_book_share', {
      book_id_param: bookId,
      share_type_param: shareType,
      expires_in_days: expiresInDays
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('[databaseService] Error creating book share:', error);
    throw new Error(`Failed to create book share: ${error.message}`);
  }
};

/**
 * Get shared book by token
 * @param {string} shareToken - The share token
 * @returns {Promise<Object>} - Shared book data
 */
export const getSharedBook = async (shareToken) => {
  try {
    const { data: share, error: shareError } = await supabase
      .from('book_shares')
      .select(`
        *,
        books (
          *,
          characters (*),
          book_pages (*)
        )
      `)
      .eq('share_token', shareToken)
      .eq('is_active', true)
      .single();

    if (shareError) throw shareError;
    if (!share) throw new Error('Share not found or expired');

    // Check if share is expired
    if (share.expires_at && new Date(share.expires_at) < new Date()) {
      throw new Error('Share has expired');
    }

    // Increment view count
    await supabase
      .from('book_shares')
      .update({ view_count: share.view_count + 1 })
      .eq('id', share.id);

    return {
      share,
      book: transformBookFromDB(share.books)
    };
  } catch (error) {
    console.error('[databaseService] Error getting shared book:', error);
    throw new Error(`Failed to get shared book: ${error.message}`);
  }
};

/**
 * User Profile Management
 */

/**
 * Create or update user profile
 * @param {Object} profileData - The profile data
 * @returns {Promise<Object>} - User profile
 */
export const upsertUserProfile = async (profileData) => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .upsert({
        id: profileData.id,
        email: profileData.email,
        display_name: profileData.displayName,
        avatar_url: profileData.avatarUrl,
        subscription_status: profileData.subscriptionStatus || 'free'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('[databaseService] Error upserting user profile:', error);
    throw new Error(`Failed to upsert user profile: ${error.message}`);
  }
};

/**
 * Helper Functions for Data Transformation
 */

/**
 * Transform character data from database format to application format
 */
const transformCharacterFromDB = (dbCharacter) => ({
  id: dbCharacter.id,
  name: dbCharacter.name,
  role: dbCharacter.role,
  type: dbCharacter.character_type,
  gender: dbCharacter.gender,
  age: dbCharacter.age,
  relationship: dbCharacter.relationship,
  traits: dbCharacter.traits || [],
  interests: dbCharacter.interests || [],
  photoUrl: dbCharacter.photo_url,
  stylePreview: dbCharacter.style_preview_url,
  artStyle: dbCharacter.art_style,
  appearanceDescription: dbCharacter.appearance_description
});

/**
 * Transform page data from database format to application format
 */
const transformPageFromDB = (dbPage) => ({
  id: dbPage.id,
  type: dbPage.page_type,
  pageNumber: dbPage.page_number,
  spreadNumber: dbPage.spread_number,
  text: dbPage.text_content,
  visualPrompt: dbPage.visual_prompt,
  imageUrl: dbPage.image_url,
  imageGenerationStatus: dbPage.image_generation_status,
  enhancementApplied: dbPage.enhancement_applied
});

/**
 * Transform book data from database format to application format
 */
const transformBookFromDB = (dbBook) => ({
  id: dbBook.id,
  title: dbBook.title,
  status: dbBook.status,
  childName: dbBook.child_name,
  category: dbBook.category,
  artStyleCode: dbBook.art_style_code,
  customStyleDescription: dbBook.custom_style_description,
  ageRange: dbBook.age_range,
  storyType: dbBook.story_type,
  wordCount: dbBook.word_count,
  pageCount: dbBook.page_count,
  coverImageUrl: dbBook.cover_image_url,
  thumbnailUrl: dbBook.thumbnail_url,
  generationData: dbBook.generation_data?.storyData || {},
  wizardState: dbBook.generation_data?.wizardState || {},
  metadata: dbBook.metadata || {},
  isPublic: dbBook.is_public,
  isClaimed: dbBook.is_claimed,
  createdAt: dbBook.created_at,
  updatedAt: dbBook.updated_at,
  characters: dbBook.characters?.map(transformCharacterFromDB) || [],
  pages: dbBook.book_pages?.sort((a, b) => a.page_number - b.page_number).map(transformPageFromDB) || []
});

/**
 * Get a digital download record by ID
 * @param {string} downloadId - The download ID
 * @returns {Promise<Object>} - Download record
 */
export const getDigitalDownload = async (downloadId) => {
  try {
    const { data, error } = await supabase
      .from('digital_downloads')
      .select(`
        *,
        orders (
          id,
          shopify_order_id,
          total_amount
        ),
        books (
          id,
          title,
          user_id
        )
      `)
      .eq('id', downloadId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('[databaseService] Error fetching digital download:', error);
    throw new Error(`Failed to fetch digital download: ${error.message}`);
  }
};

/**
 * Get digital downloads for a user
 * @param {string} userId - The user ID
 * @returns {Promise<Array>} - User's downloads
 */
export const getUserDigitalDownloads = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('digital_downloads')
      .select(`
        *,
        orders (
          id,
          shopify_order_id,
          total_amount,
          created_at as order_created_at
        ),
        books (
          id,
          title
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('[databaseService] Error fetching user downloads:', error);
    throw new Error(`Failed to fetch user downloads: ${error.message}`);
  }
};

/**
 * Validate a download and check if it's still valid
 * @param {string} downloadId - The download ID
 * @param {string} userId - The user ID (optional, for additional validation)
 * @returns {Promise<Object>} - Validation result with download info
 */
export const validateDownload = async (downloadId, userId = null) => {
  try {
    const download = await getDigitalDownload(downloadId);
    
    if (!download) {
      return { isValid: false, error: 'Download not found' };
    }

    // Check if user is authorized for this download (if userId provided)
    if (userId && download.user_id !== userId) {
      return { isValid: false, error: 'Unauthorized access' };
    }

    // Check if download has expired
    const now = new Date();
    const expiresAt = new Date(download.expires_at);
    if (now > expiresAt) {
      return { isValid: false, error: 'Download has expired' };
    }

    // Check download count limit
    if (download.download_count >= download.max_downloads) {
      return { isValid: false, error: 'Download limit exceeded' };
    }

    return {
      isValid: true,
      download: download
    };
  } catch (error) {
    console.error('[databaseService] Error validating download:', error);
    return { isValid: false, error: error.message };
  }
};

/**
 * Generate a secure download token (temporary access token)
 * @param {string} downloadId - The download ID
 * @param {number} expiresInMinutes - Token expiry in minutes (default: 60)
 * @returns {Promise<string>} - Secure token
 */
export const generateDownloadToken = async (downloadId, expiresInMinutes = 60) => {
  try {
    // Create a temporary token with timestamp and random component
    const timestamp = Date.now();
    const expiresAt = timestamp + (expiresInMinutes * 60 * 1000);
    const randomComponent = Math.random().toString(36).substring(2, 15);
    
    // Create token string: downloadId:expiresAt:randomComponent
    const tokenData = `${downloadId}:${expiresAt}:${randomComponent}`;
    
    // In a production environment, you might want to encrypt this or store it in the database
    // For now, we'll use base64 encoding for obfuscation
    const token = btoa(tokenData);
    
    console.log(`[databaseService] Generated download token for ${downloadId}, expires in ${expiresInMinutes} minutes`);
    
    return token;
  } catch (error) {
    console.error('[databaseService] Error generating download token:', error);
    throw new Error(`Failed to generate download token: ${error.message}`);
  }
};

/**
 * Validate a download token
 * @param {string} token - The download token
 * @returns {Promise<Object>} - Token validation result
 */
export const validateDownloadToken = async (token) => {
  try {
    if (!token) {
      return { isValid: false, error: 'No token provided' };
    }

    // Decode the token
    let tokenData;
    try {
      tokenData = atob(token);
    } catch (error) {
      return { isValid: false, error: 'Invalid token format' };
    }

    // Parse token components
    const [downloadId, expiresAt, randomComponent] = tokenData.split(':');
    
    if (!downloadId || !expiresAt || !randomComponent) {
      return { isValid: false, error: 'Invalid token structure' };
    }

    // Check if token has expired
    const now = Date.now();
    const tokenExpiry = parseInt(expiresAt, 10);
    
    if (now > tokenExpiry) {
      return { isValid: false, error: 'Token has expired' };
    }

    // Validate the download itself
    const downloadValidation = await validateDownload(downloadId);
    
    if (!downloadValidation.isValid) {
      return downloadValidation;
    }

    return {
      isValid: true,
      downloadId: downloadId,
      download: downloadValidation.download
    };
  } catch (error) {
    console.error('[databaseService] Error validating download token:', error);
    return { isValid: false, error: error.message };
  }
};

export default {
  // Book operations
  saveBook,
  getBook,
  getUserBooks,
  updateBookStatus,
  claimBook,
  
  // Character operations
  saveBookCharacters,
  
  // Page operations
  saveBookPages,
  
  // Order operations
  createOrder,
  getUserOrders,
  updateOrderStatus,
  
  // Digital download operations
  createDigitalDownload,
  recordDownloadAttempt,
  
  // Print job operations
  createPrintJob,
  updatePrintJobStatus,
  
  // Sharing operations
  createBookShare,
  getSharedBook,
  
  // User profile operations
  upsertUserProfile,

  // Digital download operations
  getDigitalDownload,
  getUserDigitalDownloads,
  validateDownload,
  generateDownloadToken,
  validateDownloadToken
}; 
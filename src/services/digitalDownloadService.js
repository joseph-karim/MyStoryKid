/**
 * Digital Download Service
 * 
 * This service handles the generation and management of digital downloads,
 * including PDF generation and secure download links.
 */

import { generateDigitalPDF, createPdfDownloadLink } from './pdfService';
import { uploadFileToSupabase, getSignedUrl } from './supabaseClient';
import { 
  getUserDigitalDownloads, 
  validateDownload, 
  generateDownloadToken, 
  validateDownloadToken as dbValidateDownloadToken,
  recordDownloadAttempt 
} from './databaseService';

/**
 * Generates a digital download PDF for a book and returns a download URL
 * @param {Object} book - The book object
 * @returns {Promise<string>} - The download URL
 */
export const generateBookPDF = async (book) => {
  try {
    console.log('[digitalDownloadService] Generating PDF for book:', book.id);
    
    // Generate the PDF
    const pdfBuffer = await generateDigitalPDF(book);
    
    // Create a download link
    const downloadUrl = createPdfDownloadLink(pdfBuffer, `${book.title}.pdf`);
    
    console.log('[digitalDownloadService] PDF generated successfully');
    
    return downloadUrl;
  } catch (error) {
    console.error('[digitalDownloadService] Error generating PDF:', error);
    throw new Error(`Failed to generate PDF: ${error.message}`);
  }
};

/**
 * Creates a secure download link for a book PDF
 * @param {Object} book - The book object
 * @param {string} userId - The user ID (optional)
 * @returns {Promise<Object>} - The download information
 */
export const createSecureDownloadLink = async (book, userId = null) => {
  try {
    console.log('[digitalDownloadService] Creating secure download link for book:', book.id);
    
    // Generate the PDF
    const pdfBuffer = await generateDigitalPDF(book);
    
    // Create a Blob from the PDF buffer
    const pdfBlob = new Blob([pdfBuffer], { type: 'application/pdf' });
    
    // Generate a unique filename
    const filename = `${book.id}_${Date.now()}.pdf`;
    
    // Upload the PDF to Supabase
    const bucketName = 'digital-downloads';
    const filePath = userId ? `${userId}/${filename}` : `anonymous/${filename}`;
    
    const pdfUrl = await uploadFileToSupabase(pdfBlob, filePath, bucketName);
    
    // In a production environment, we would store the download link in the database
    // and associate it with the user
    
    console.log('[digitalDownloadService] Secure download link created:', pdfUrl);
    
    return {
      downloadUrl: pdfUrl,
      filename: `${book.title}.pdf`,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
    };
  } catch (error) {
    console.error('[digitalDownloadService] Error creating secure download link:', error);
    throw new Error(`Failed to create secure download link: ${error.message}`);
  }
};

/**
 * Validates a download token and returns download info
 * @param {string} token - The download token
 * @returns {Promise<Object>} - Token validation result with download info
 */
export const validateDownloadToken = async (token) => {
  try {
    console.log('[digitalDownloadService] Validating download token');
    
    const result = await dbValidateDownloadToken(token);
    
    console.log('[digitalDownloadService] Token validation result:', result.isValid);
    
    return result;
  } catch (error) {
    console.error('[digitalDownloadService] Error validating download token:', error);
    throw new Error(`Failed to validate download token: ${error.message}`);
  }
};

/**
 * Gets download information for a user
 * @param {string} userId - The user ID
 * @returns {Promise<Array>} - The user's downloads
 */
export const getUserDownloads = async (userId) => {
  try {
    console.log('[digitalDownloadService] Getting downloads for user:', userId);
    
    const downloads = await getUserDigitalDownloads(userId);
    
    // Transform database records to UI format
    const transformedDownloads = downloads.map(download => ({
      id: download.id,
      bookId: download.book_id,
      bookTitle: download.books?.title || 'Unknown Book',
      downloadUrl: download.download_url,
      createdAt: download.created_at,
      expiresAt: download.expires_at,
      downloadCount: download.download_count,
      maxDownloads: download.max_downloads,
      filename: download.filename,
      fileSizeBytes: download.file_size_bytes
    }));
    
    console.log('[digitalDownloadService] User downloads:', transformedDownloads.length);
    
    return transformedDownloads;
  } catch (error) {
    console.error('[digitalDownloadService] Error getting user downloads:', error);
    throw new Error(`Failed to get user downloads: ${error.message}`);
  }
};

/**
 * Generate a secure download link with token for email delivery
 * @param {string} downloadId - The download ID
 * @param {number} tokenExpiryMinutes - Token expiry in minutes (default: 1440 = 24 hours)
 * @returns {Promise<string>} - Secure download URL with token
 */
export const generateSecureDownloadUrl = async (downloadId, tokenExpiryMinutes = 1440) => {
  try {
    console.log('[digitalDownloadService] Generating secure download URL for:', downloadId);
    
    // Generate a secure token
    const token = await generateDownloadToken(downloadId, tokenExpiryMinutes);
    
    // Create the secure download URL 
    const baseUrl = window.location.origin || 'https://yourdomain.com'; // Replace with your actual domain
    const secureUrl = `${baseUrl}/download/${downloadId}?token=${token}`;
    
    console.log('[digitalDownloadService] Generated secure URL, expires in', tokenExpiryMinutes, 'minutes');
    
    return secureUrl;
  } catch (error) {
    console.error('[digitalDownloadService] Error generating secure download URL:', error);
    throw new Error(`Failed to generate secure download URL: ${error.message}`);
  }
};

/**
 * Process a download request with token validation and access tracking
 * @param {string} downloadId - The download ID
 * @param {string} token - The access token
 * @param {string} userId - The user ID (optional)
 * @returns {Promise<Object>} - Download result with signed URL
 */
export const processSecureDownload = async (downloadId, token, userId = null) => {
  try {
    console.log('[digitalDownloadService] Processing secure download:', downloadId);
    
    // Validate the token
    const tokenValidation = await validateDownloadToken(token);
    
    if (!tokenValidation.isValid) {
      return {
        success: false,
        error: tokenValidation.error
      };
    }
    
    const download = tokenValidation.download;
    
    // Additional user validation if provided
    if (userId && download.user_id !== userId) {
      return {
        success: false,
        error: 'Unauthorized access to download'
      };
    }
    
    // Record the download attempt
    await recordDownloadAttempt(downloadId);
    
    // Generate a signed URL for the actual file download (short-lived, e.g., 15 minutes)
    const signedUrl = await getSignedUrl('digital-downloads', download.download_url.split('/').pop(), 15 * 60);
    
    console.log('[digitalDownloadService] Secure download processed successfully');
    
    return {
      success: true,
      downloadUrl: signedUrl,
      filename: download.filename,
      download: {
        id: download.id,
        bookTitle: download.books?.title || 'Unknown Book',
        downloadCount: download.download_count + 1, // Updated count
        maxDownloads: download.max_downloads,
        expiresAt: download.expires_at
      }
    };
  } catch (error) {
    console.error('[digitalDownloadService] Error processing secure download:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Digital Download Service
 * 
 * This service handles the generation and management of digital downloads,
 * including PDF generation and secure download links.
 */

import { generateDigitalPDF, createPdfDownloadLink } from './pdfService';
import { uploadFileToSupabase } from './supabaseClient';

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
 * Validates a download token
 * @param {string} token - The download token
 * @returns {Promise<boolean>} - Whether the token is valid
 */
export const validateDownloadToken = async (token) => {
  try {
    console.log('[digitalDownloadService] Validating download token');
    
    // In a production environment, this would validate the token against the database
    // For now, we'll return a mock response
    
    // Mock validation logic
    const isValid = token && token.length > 10;
    
    console.log('[digitalDownloadService] Token validation result:', isValid);
    
    return isValid;
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
    
    // In a production environment, this would fetch the user's downloads from the database
    // For now, we'll return a mock response
    
    // Mock downloads
    const downloads = [
      {
        id: 'download-1',
        bookId: 'book-1',
        bookTitle: 'Space Adventure with John',
        downloadUrl: 'https://example.com/download/1',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        expiresAt: new Date(Date.now() + 23 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
    
    console.log('[digitalDownloadService] User downloads:', downloads);
    
    return downloads;
  } catch (error) {
    console.error('[digitalDownloadService] Error getting user downloads:', error);
    throw new Error(`Failed to get user downloads: ${error.message}`);
  }
};

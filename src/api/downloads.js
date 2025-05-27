/**
 * Digital Downloads API
 * 
 * Handles secure download requests with validation, expiry checks, and download limits
 */

import { processSecureDownload, getUserDownloads } from '../services/digitalDownloadService.js';
import { validateDownloadToken, recordDownloadAttempt } from '../services/databaseService.js';

/**
 * GET /api/downloads/:token
 * Handle secure download requests with token validation
 */
export const handleSecureDownload = async (req, res) => {
  try {
    const { token } = req.params;
    
    if (!token) {
      return res.status(400).json({
        error: 'Download token is required',
        code: 'MISSING_TOKEN'
      });
    }

    console.log('[downloads] Processing download request with token:', token.substring(0, 8) + '...');

    // Validate the token and get download info
    const downloadInfo = await validateDownloadToken(token);
    
    if (!downloadInfo.isValid) {
      let errorMessage = 'Invalid or expired download link';
      let errorCode = 'INVALID_TOKEN';
      
      if (downloadInfo.reason === 'expired') {
        errorMessage = 'Download link has expired. Please contact support for a new link.';
        errorCode = 'LINK_EXPIRED';
      } else if (downloadInfo.reason === 'limit_exceeded') {
        errorMessage = `Maximum download attempts (${downloadInfo.maxDownloads}) exceeded.`;
        errorCode = 'DOWNLOAD_LIMIT_EXCEEDED';
      }
      
      return res.status(403).json({
        error: errorMessage,
        code: errorCode,
        details: {
          downloadCount: downloadInfo.downloadCount,
          maxDownloads: downloadInfo.maxDownloads,
          expiresAt: downloadInfo.expiresAt
        }
      });
    }

    // Record the download attempt
    await recordDownloadAttempt(downloadInfo.downloadId);
    
    // Process the secure download
    const result = await processSecureDownload(token);
    
    if (result.error) {
      return res.status(404).json({
        error: result.error,
        code: 'DOWNLOAD_FAILED'
      });
    }

    // Return the signed URL for download
    res.json({
      success: true,
      downloadUrl: result.signedUrl,
      filename: result.filename,
      expiresAt: result.expiresAt,
      remainingDownloads: downloadInfo.maxDownloads - (downloadInfo.downloadCount + 1)
    });

  } catch (error) {
    console.error('[downloads] Error handling secure download:', error);
    res.status(500).json({
      error: 'Failed to process download request',
      code: 'INTERNAL_ERROR'
    });
  }
};

/**
 * GET /api/downloads/user/:userId
 * Get all downloads for a specific user with status information
 */
export const getUserDownloadHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.query; // optional: filter by status (active, expired, exhausted)
    
    if (!userId) {
      return res.status(400).json({
        error: 'User ID is required',
        code: 'MISSING_USER_ID'
      });
    }

    console.log('[downloads] Getting download history for user:', userId);
    
    // Get user's downloads from database
    const downloads = await getUserDownloads(userId);
    
    // Add status information to each download
    const enrichedDownloads = downloads.map(download => {
      const now = new Date();
      const expiresAt = new Date(download.expires_at);
      const isExpired = now > expiresAt;
      const isExhausted = download.download_count >= download.max_downloads;
      
      let downloadStatus = 'active';
      if (isExpired) {
        downloadStatus = 'expired';
      } else if (isExhausted) {
        downloadStatus = 'exhausted';
      }
      
      return {
        id: download.id,
        bookId: download.book_id,
        bookTitle: download.books?.title || 'Unknown',
        orderId: download.order_id,
        shopifyOrderId: download.orders?.shopify_order_id,
        filename: download.filename,
        fileSize: download.file_size_bytes,
        downloadCount: download.download_count,
        maxDownloads: download.max_downloads,
        remainingDownloads: Math.max(0, download.max_downloads - download.download_count),
        status: downloadStatus,
        createdAt: download.created_at,
        expiresAt: download.expires_at,
        canDownload: !isExpired && !isExhausted
      };
    });
    
    // Filter by status if requested
    const filteredDownloads = status 
      ? enrichedDownloads.filter(d => d.status === status)
      : enrichedDownloads;
    
    res.json({
      success: true,
      downloads: filteredDownloads,
      summary: {
        total: enrichedDownloads.length,
        active: enrichedDownloads.filter(d => d.status === 'active').length,
        expired: enrichedDownloads.filter(d => d.status === 'expired').length,
        exhausted: enrichedDownloads.filter(d => d.status === 'exhausted').length
      }
    });

  } catch (error) {
    console.error('[downloads] Error getting user download history:', error);
    res.status(500).json({
      error: 'Failed to retrieve download history',
      code: 'INTERNAL_ERROR'
    });
  }
};

/**
 * GET /api/downloads/status/:downloadId
 * Check the status of a specific download without consuming a download attempt
 */
export const checkDownloadStatus = async (req, res) => {
  try {
    const { downloadId } = req.params;
    
    if (!downloadId) {
      return res.status(400).json({
        error: 'Download ID is required',
        code: 'MISSING_DOWNLOAD_ID'
      });
    }

    console.log('[downloads] Checking status for download:', downloadId);
    
    // Get download info without recording an attempt
    const downloadInfo = await getDigitalDownload(downloadId);
    
    if (!downloadInfo) {
      return res.status(404).json({
        error: 'Download not found',
        code: 'DOWNLOAD_NOT_FOUND'
      });
    }
    
    const now = new Date();
    const expiresAt = new Date(downloadInfo.expires_at);
    const isExpired = now > expiresAt;
    const isExhausted = downloadInfo.download_count >= downloadInfo.max_downloads;
    
    let status = 'active';
    if (isExpired) {
      status = 'expired';
    } else if (isExhausted) {
      status = 'exhausted';
    }
    
    res.json({
      success: true,
      downloadId: downloadInfo.id,
      status: status,
      downloadCount: downloadInfo.download_count,
      maxDownloads: downloadInfo.max_downloads,
      remainingDownloads: Math.max(0, downloadInfo.max_downloads - downloadInfo.download_count),
      expiresAt: downloadInfo.expires_at,
      canDownload: !isExpired && !isExhausted,
      bookTitle: downloadInfo.books?.title,
      filename: downloadInfo.filename
    });

  } catch (error) {
    console.error('[downloads] Error checking download status:', error);
    res.status(500).json({
      error: 'Failed to check download status',
      code: 'INTERNAL_ERROR'
    });
  }
}; 
/**
 * Email Service using Listmonk
 * 
 * This service handles sending transactional emails through Listmonk,
 * including digital download links after purchase.
 */

import { logSentEmail } from './listmonkService';

/**
 * Send a digital download email using Listmonk transactional API
 * @param {Object} params - Email parameters
 * @param {string} params.toEmail - Recipient email
 * @param {string} params.toName - Recipient name
 * @param {string} params.bookTitle - Book title
 * @param {string} params.downloadUrl - Secure download URL
 * @param {string} params.expiryDate - Download expiry date
 * @param {string} params.orderId - Shopify order ID
 * @returns {Promise<Object>} - Email send result
 */
export const sendDigitalDownloadEmail = async ({
  toEmail,
  toName,
  bookTitle,
  downloadUrl,
  expiryDate,
  orderId
}) => {
  let status = 'success';
  let errorMsg = null;
  try {
    console.log('[emailService] Sending digital download email to:', toEmail);

    const listmonkUrl = process.env.VITE_LISTMONK_URL || 'http://localhost:9000';
    const listmonkUsername = process.env.VITE_LISTMONK_USERNAME;
    const listmonkPassword = process.env.VITE_LISTMONK_PASSWORD;

    if (!listmonkUsername || !listmonkPassword) {
      throw new Error('Listmonk credentials not configured');
    }

    // Create email content
    const emailData = {
      subscriber_email: toEmail,
      subscriber_name: toName,
      template_id: 1, // You'll need to create this template in Listmonk
      data: {
        book_title: bookTitle,
        download_url: downloadUrl,
        expiry_date: new Date(expiryDate).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        order_id: orderId,
        customer_name: toName
      },
      content_type: "html",
      messenger: "email"
    };

    // Send via Listmonk transactional API
    const response = await fetch(`${listmonkUrl}/api/tx`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + btoa(`${listmonkUsername}:${listmonkPassword}`)
      },
      body: JSON.stringify(emailData)
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Listmonk API error: ${response.status} - ${errorData}`);
    }

    const result = await response.json();
    console.log('[emailService] Email sent successfully:', result);

    await logSentEmail({
      to_email: toEmail,
      subject: 'Your Digital Book Download is Ready!',
      template: 'digital-download-link',
      status: 'success',
      error: null
    });
    return {
      success: true,
      messageId: result.id || 'unknown',
      provider: 'listmonk'
    };

  } catch (error) {
    status = 'error';
    errorMsg = error.message;
    console.error('[emailService] Error sending email:', error);
    
    // Fallback: Log the download details for manual processing
    console.error('[emailService] MANUAL PROCESSING REQUIRED:');
    console.error(`Email: ${toEmail}`);
    console.error(`Book: ${bookTitle}`);
    console.error(`Download URL: ${downloadUrl}`);
    console.error(`Order: ${orderId}`);
    
    await logSentEmail({
      to_email: toEmail,
      subject: 'Your Digital Book Download is Ready!',
      template: 'digital-download-link',
      status: 'error',
      error: errorMsg
    });
    throw new Error(`Failed to send download email: ${error.message}`);
  }
};

/**
 * Send a welcome email for new customers
 * @param {Object} params - Email parameters
 * @param {string} params.toEmail - Recipient email
 * @param {string} params.toName - Recipient name
 * @returns {Promise<Object>} - Email send result
 */
export const sendWelcomeEmail = async ({ toEmail, toName }) => {
  let status = 'success';
  let errorMsg = null;
  try {
    console.log('[emailService] Sending welcome email to:', toEmail);

    const listmonkUrl = process.env.VITE_LISTMONK_URL || 'http://localhost:9000';
    const listmonkUsername = process.env.VITE_LISTMONK_USERNAME;
    const listmonkPassword = process.env.VITE_LISTMONK_PASSWORD;

    const emailData = {
      subscriber_email: toEmail,
      subscriber_name: toName,
      template_id: 2, // Welcome email template
      data: {
        customer_name: toName
      },
      content_type: "html",
      messenger: "email"
    };

    const response = await fetch(`${listmonkUrl}/api/tx`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + btoa(`${listmonkUsername}:${listmonkPassword}`)
      },
      body: JSON.stringify(emailData)
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Listmonk API error: ${response.status} - ${errorData}`);
    }

    const result = await response.json();
    console.log('[emailService] Welcome email sent successfully:', result);

    await logSentEmail({
      to_email: toEmail,
      subject: 'Welcome to MyStoryKid!',
      template: 'welcome-email',
      status: 'success',
      error: null
    });
    return {
      success: true,
      messageId: result.id || 'unknown',
      provider: 'listmonk'
    };

  } catch (error) {
    status = 'error';
    errorMsg = error.message;
    console.error('[emailService] Error sending welcome email:', error);
    await logSentEmail({
      to_email: toEmail,
      subject: 'Welcome to MyStoryKid!',
      template: 'welcome-email',
      status: 'error',
      error: errorMsg
    });
    throw new Error(`Failed to send welcome email: ${error.message}`);
  }
};

/**
 * Test Listmonk connection
 * @returns {Promise<boolean>} - Whether connection is successful
 */
export const testListmonkConnection = async () => {
  try {
    const listmonkUrl = process.env.VITE_LISTMONK_URL || 'http://localhost:9000';
    const listmonkUsername = process.env.VITE_LISTMONK_USERNAME;
    const listmonkPassword = process.env.VITE_LISTMONK_PASSWORD;

    const response = await fetch(`${listmonkUrl}/api/health`, {
      method: 'GET',
      headers: {
        'Authorization': 'Basic ' + btoa(`${listmonkUsername}:${listmonkPassword}`)
      }
    });

    return response.ok;
  } catch (error) {
    console.error('[emailService] Listmonk connection test failed:', error);
    return false;
  }
};

/**
 * Send a password reset email using Listmonk
 * @param {Object} params
 * @param {string} params.toEmail
 * @param {string} params.toName
 * @param {string} params.resetUrl
 * @returns {Promise<Object>} - Email send result
 */
export const sendPasswordResetEmail = async ({ toEmail, toName, resetUrl }) => {
  let status = 'success';
  let errorMsg = null;
  try {
    const listmonkUrl = process.env.VITE_LISTMONK_URL || 'http://localhost:9000';
    const listmonkUsername = process.env.VITE_LISTMONK_USERNAME;
    const listmonkPassword = process.env.VITE_LISTMONK_PASSWORD;
    const emailData = {
      subscriber_email: toEmail,
      subscriber_name: toName,
      template_id: 3, // Password reset template
      data: {
        customer_name: toName,
        reset_url: resetUrl
      },
      content_type: 'html',
      messenger: 'email'
    };
    const response = await fetch(`${listmonkUrl}/api/tx`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + btoa(`${listmonkUsername}:${listmonkPassword}`)
      },
      body: JSON.stringify(emailData)
    });
    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Listmonk API error: ${response.status} - ${errorData}`);
    }
    const result = await response.json();
    await logSentEmail({
      to_email: toEmail,
      subject: 'Reset your MyStoryKid password',
      template: 'password-reset',
      status: 'success',
      error: null
    });
    return {
      success: true,
      messageId: result.id || 'unknown',
      provider: 'listmonk'
    };
  } catch (error) {
    status = 'error';
    errorMsg = error.message;
    await logSentEmail({
      to_email: toEmail,
      subject: 'Reset your MyStoryKid password',
      template: 'password-reset',
      status: 'error',
      error: errorMsg
    });
    throw new Error(`Failed to send password reset email: ${error.message}`);
  }
};

/**
 * Send an order confirmation email using Listmonk
 * @param {Object} params
 * @param {string} params.toEmail
 * @param {string} params.toName
 * @param {string} params.orderId
 * @param {string} params.orderSummary
 * @returns {Promise<Object>} - Email send result
 */
export const sendOrderConfirmationEmail = async ({ toEmail, toName, orderId, orderSummary }) => {
  let status = 'success';
  let errorMsg = null;
  try {
    const listmonkUrl = process.env.VITE_LISTMONK_URL || 'http://localhost:9000';
    const listmonkUsername = process.env.VITE_LISTMONK_USERNAME;
    const listmonkPassword = process.env.VITE_LISTMONK_PASSWORD;
    const emailData = {
      subscriber_email: toEmail,
      subscriber_name: toName,
      template_id: 4, // Order confirmation template
      data: {
        customer_name: toName,
        order_id: orderId,
        order_summary: orderSummary
      },
      content_type: 'html',
      messenger: 'email'
    };
    const response = await fetch(`${listmonkUrl}/api/tx`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + btoa(`${listmonkUsername}:${listmonkPassword}`)
      },
      body: JSON.stringify(emailData)
    });
    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Listmonk API error: ${response.status} - ${errorData}`);
    }
    const result = await response.json();
    await logSentEmail({
      to_email: toEmail,
      subject: 'Your MyStoryKid order confirmation',
      template: 'order-confirmation',
      status: 'success',
      error: null
    });
    return {
      success: true,
      messageId: result.id || 'unknown',
      provider: 'listmonk'
    };
  } catch (error) {
    status = 'error';
    errorMsg = error.message;
    await logSentEmail({
      to_email: toEmail,
      subject: 'Your MyStoryKid order confirmation',
      template: 'order-confirmation',
      status: 'error',
      error: errorMsg
    });
    throw new Error(`Failed to send order confirmation email: ${error.message}`);
  }
}; 
/**
 * PDF Generation Service
 * 
 * This service handles the generation of PDFs for both digital downloads and print-ready files.
 * It uses jsPDF and pdf-lib for PDF generation and manipulation.
 */

import { jsPDF } from 'jspdf';
import 'jspdf-autotable'; // For better layout control

/**
 * Generates a digital download PDF for a book
 * @param {Object} book - The book object containing pages and content
 * @returns {Promise<ArrayBuffer>} - The generated PDF as an ArrayBuffer
 */
export const generateDigitalPDF = async (book) => {
  try {
    console.log('[pdfService] Generating digital PDF for book:', book.id);
    
    // Create a new PDF document
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    // Add metadata
    doc.setProperties({
      title: book.title,
      subject: `A personalized story for ${book.childName}`,
      author: 'MyStoryKid',
      creator: 'MyStoryKid'
    });
    
    // Add cover page
    const coverPage = book.pages.find(page => page.type === 'cover');
    if (coverPage && coverPage.imageUrl) {
      await addImageToPage(doc, coverPage.imageUrl, 0, 0, 210, 297);
      doc.addPage();
    }
    
    // Add title page
    const titlePage = book.pages.find(page => page.type === 'title');
    if (titlePage) {
      doc.setFontSize(24);
      doc.text(titlePage.text, 105, 100, { align: 'center' });
      doc.addPage();
    }
    
    // Add content pages
    const contentPages = book.pages.filter(page => page.type === 'content');
    for (const page of contentPages) {
      // Add text
      doc.setFontSize(12);
      doc.text(page.text, 20, 30, { 
        maxWidth: 170,
        align: 'left'
      });
      
      // Add image if available
      if (page.imageUrl) {
        await addImageToPage(doc, page.imageUrl, 20, 80, 170, 170);
      }
      
      // Add page number
      doc.setFontSize(10);
      doc.text(`${page.pageNumbers ? page.pageNumbers[0] : ''}`, 105, 285, { align: 'center' });
      
      // Add new page if not the last one
      if (page !== contentPages[contentPages.length - 1]) {
        doc.addPage();
      }
    }
    
    console.log('[pdfService] Successfully generated digital PDF');
    
    // Return the PDF as an ArrayBuffer
    return doc.output('arraybuffer');
  } catch (error) {
    console.error('[pdfService] Error generating digital PDF:', error);
    throw new Error(`Failed to generate PDF: ${error.message}`);
  }
};

/**
 * Helper function to add an image to a PDF page
 */
const addImageToPage = async (doc, imageUrl, x, y, width, height) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      try {
        doc.addImage(img, 'JPEG', x, y, width, height);
        resolve();
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = (err) => reject(err);
    img.src = imageUrl;
  });
};

/**
 * Generates a print-ready interior PDF for a book
 * @param {Object} book - The book object containing pages and content
 * @param {Object} options - Print options (trim size, bleed, etc.)
 * @returns {Promise<ArrayBuffer>} - The generated PDF as an ArrayBuffer
 */
export const generatePrintInteriorPDF = async (book, options = {}) => {
  // Default print options
  const printOptions = {
    trimSize: options.trimSize || { width: 216, height: 216 }, // 8.5" x 8.5" in mm
    bleed: options.bleed || 3.175, // 0.125" bleed in mm
    safetyMargin: options.safetyMargin || 12.7, // 0.5" safety margin in mm
    ...options
  };
  
  try {
    console.log('[pdfService] Generating print interior PDF for book:', book.id);
    
    // Create a new PDF document with bleed
    const pageWidth = printOptions.trimSize.width + (printOptions.bleed * 2);
    const pageHeight = printOptions.trimSize.height + (printOptions.bleed * 2);
    
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [pageWidth, pageHeight]
    });
    
    // Add metadata
    doc.setProperties({
      title: book.title,
      subject: `A personalized story for ${book.childName}`,
      author: 'MyStoryKid',
      creator: 'MyStoryKid'
    });
    
    // Add title page
    const titlePage = book.pages.find(page => page.type === 'title');
    if (titlePage) {
      doc.setFontSize(24);
      const textX = pageWidth / 2;
      const textY = pageHeight / 2;
      doc.text(titlePage.text, textX, textY, { align: 'center' });
      doc.addPage();
    }
    
    // Add content pages
    const contentPages = book.pages.filter(page => page.type === 'content');
    for (const page of contentPages) {
      // Calculate safe area
      const safeX = printOptions.bleed + printOptions.safetyMargin;
      const safeY = printOptions.bleed + printOptions.safetyMargin;
      const safeWidth = pageWidth - (safeX * 2);
      const safeHeight = pageHeight - (safeY * 2);
      
      // Add text within safe area
      doc.setFontSize(12);
      doc.text(page.text, safeX, safeY + 10, { 
        maxWidth: safeWidth,
        align: 'left'
      });
      
      // Add image if available
      if (page.imageUrl) {
        await addImageToPage(doc, page.imageUrl, safeX, safeY + 50, safeWidth, safeHeight - 70);
      }
      
      // Add page number
      doc.setFontSize(10);
      doc.text(`${page.pageNumbers ? page.pageNumbers[0] : ''}`, pageWidth / 2, pageHeight - safeY - 5, { align: 'center' });
      
      // Add new page if not the last one
      if (page !== contentPages[contentPages.length - 1]) {
        doc.addPage();
      }
    }
    
    console.log('[pdfService] Successfully generated print interior PDF');
    
    // Return the PDF as an ArrayBuffer
    return doc.output('arraybuffer');
  } catch (error) {
    console.error('[pdfService] Error generating print interior PDF:', error);
    throw new Error(`Failed to generate print interior PDF: ${error.message}`);
  }
};

/**
 * Generates a print-ready cover PDF for a book
 * @param {Object} book - The book object containing cover image and title
 * @param {Object} coverDimensions - Cover dimensions from Lulu API
 * @param {Object} options - Additional options
 * @returns {Promise<ArrayBuffer>} - The generated PDF as an ArrayBuffer
 */
export const generatePrintCoverPDF = async (book, coverDimensions, options = {}) => {
  try {
    console.log('[pdfService] Generating print cover PDF for book:', book.id);
    
    // Get cover dimensions from the Lulu API response
    const { width, height, unit } = coverDimensions;
    
    // Convert to mm if needed
    const widthMm = unit === 'pt' ? width * 0.352778 : width;
    const heightMm = unit === 'pt' ? height * 0.352778 : height;
    
    // Create a new PDF document with the exact dimensions
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [widthMm, heightMm]
    });
    
    // Add metadata
    doc.setProperties({
      title: `Cover - ${book.title}`,
      subject: `Cover for ${book.title}`,
      author: 'MyStoryKid',
      creator: 'MyStoryKid'
    });
    
    // Get the cover page
    const coverPage = book.pages.find(page => page.type === 'cover');
    if (coverPage && coverPage.imageUrl) {
      // Add the cover image to fill the entire page
      await addImageToPage(doc, coverPage.imageUrl, 0, 0, widthMm, heightMm);
    } else {
      // Create a basic cover if no image is available
      // Background color
      doc.setFillColor(200, 200, 255);
      doc.rect(0, 0, widthMm, heightMm, 'F');
      
      // Title
      doc.setFontSize(24);
      doc.setTextColor(0, 0, 0);
      doc.text(book.title, widthMm / 2, heightMm / 3, { align: 'center' });
      
      // Subtitle
      doc.setFontSize(16);
      doc.text(`A story for ${book.childName}`, widthMm / 2, heightMm / 2, { align: 'center' });
    }
    
    console.log('[pdfService] Successfully generated print cover PDF');
    
    // Return the PDF as an ArrayBuffer
    return doc.output('arraybuffer');
  } catch (error) {
    console.error('[pdfService] Error generating print cover PDF:', error);
    throw new Error(`Failed to generate print cover PDF: ${error.message}`);
  }
};

/**
 * Converts an ArrayBuffer to a Blob
 * @param {ArrayBuffer} buffer - The ArrayBuffer
 * @param {string} type - The MIME type
 * @returns {Blob} - The Blob
 */
export const arrayBufferToBlob = (buffer, type = 'application/pdf') => {
  return new Blob([buffer], { type });
};

/**
 * Creates a download link for a PDF
 * @param {ArrayBuffer} pdfBuffer - The PDF as an ArrayBuffer
 * @param {string} filename - The filename
 * @returns {string} - The download URL
 */
export const createPdfDownloadLink = (pdfBuffer, filename) => {
  const blob = arrayBufferToBlob(pdfBuffer);
  return URL.createObjectURL(blob);
};

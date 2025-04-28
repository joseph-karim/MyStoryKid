# PDF Generation and E-commerce Integration

This document provides instructions for setting up and using the PDF generation, Lulu Direct printing, and Shopify e-commerce integration in the MyStoryKid application.

## Overview

The PDF generation and e-commerce functionality allows users to:

1. Generate high-quality PDFs of their personalized books
2. Purchase digital downloads for $10
3. Order printed copies with standard or expedited shipping
4. Access their digital downloads from their account

## Required Dependencies

Make sure to install the following dependencies:

```bash
npm install jspdf jspdf-autotable pdf-lib
```

## Environment Variables

Add the following environment variables to your `.env` file:

```
# Lulu Direct API
REACT_APP_LULU_CLIENT_KEY=your_lulu_client_key
REACT_APP_LULU_CLIENT_SECRET=your_lulu_client_secret
REACT_APP_LULU_CONTACT_EMAIL=contact@mystorykid.com

# Shopify
REACT_APP_SHOPIFY_STORE_URL=https://your-store.myshopify.com
REACT_APP_SHOPIFY_API_KEY=your_shopify_api_key
REACT_APP_SHOPIFY_API_SECRET=your_shopify_api_secret
```

## Lulu Direct API Setup

1. Create an account at [Lulu Direct API](https://developers.lulu.com/)
2. Generate API credentials (client key and client secret)
3. For development, use the sandbox environment: https://developers.sandbox.lulu.com/
4. For production, use the production environment: https://developers.lulu.com/

## Shopify Setup

1. Create a Shopify store or use an existing one
2. Set up the following product types:
   - Digital Download ($10)
   - Printed Book - Standard Shipping
   - Printed Book - Expedited Shipping
3. Create a private app in Shopify to get API credentials
4. Set up webhooks for order processing

## PDF Generation

The PDF generation functionality is implemented in `src/services/pdfService.js` and provides the following features:

- Generate digital download PDFs
- Generate print-ready interior PDFs
- Generate print-ready cover PDFs
- Create download links for PDFs

## Lulu Direct Integration

The Lulu Direct API integration is implemented in `src/services/luluService.js` and provides the following features:

- Authenticate with Lulu API
- Validate interior and cover PDFs
- Calculate cover dimensions
- Create print jobs
- Track print job status

## Shopify Integration

The Shopify integration is implemented in `src/services/shopifyService.js` and provides the following features:

- Create or update Shopify products
- Generate checkout URLs
- Process orders from Shopify webhooks
- Handle digital and print orders

## Digital Downloads

The digital download functionality is implemented in `src/services/digitalDownloadService.js` and provides the following features:

- Generate secure download links
- Validate download tokens
- Track user downloads

## UI Components

The following UI components are provided for the PDF generation and e-commerce functionality:

- `BookPurchaseOptions`: Displays purchase options (digital or print)
- `DigitalDownloads`: Displays a user's digital downloads
- `DigitalDownloadPage`: Handles secure download links

## Usage

### Adding Purchase Options to a Page

```jsx
import BookPurchaseOptions from '../components/BookPurchaseOptions';

function YourComponent({ book }) {
  return (
    <div>
      {/* Other components */}
      <BookPurchaseOptions book={book} />
    </div>
  );
}
```

### Generating a PDF Programmatically

```javascript
import { generateDigitalPDF } from '../services/pdfService';

async function handleGeneratePDF(book) {
  try {
    const pdfBuffer = await generateDigitalPDF(book);
    // Use the PDF buffer
  } catch (error) {
    console.error('Error generating PDF:', error);
  }
}
```

### Creating a Print Job with Lulu

```javascript
import { createPrintJob } from '../services/luluService';

async function handleCreatePrintJob(book, shippingAddress) {
  try {
    const printJob = await createPrintJob(
      {
        id: book.id,
        title: book.title,
        podPackageId: '0600X0900BWSTDPB060UW444MXX', // 6"x9" black and white paperback
        interiorUrl: 'https://example.com/interior.pdf',
        coverUrl: 'https://example.com/cover.pdf',
        pageCount: book.pages.length
      },
      shippingAddress,
      'MAIL' // Shipping level
    );
    
    console.log('Print job created:', printJob);
  } catch (error) {
    console.error('Error creating print job:', error);
  }
}
```

## Troubleshooting

### PDF Generation Issues

- Make sure all images are properly loaded before generating the PDF
- Check that the book object has all required properties
- Verify that the PDF generation libraries are properly installed

### Lulu API Issues

- Verify that your API credentials are correct
- Check that your PDFs meet Lulu's requirements
- Ensure that the shipping address includes all required fields, including a phone number

### Shopify Integration Issues

- Verify that your Shopify API credentials are correct
- Check that your products are properly set up in Shopify
- Ensure that your webhooks are properly configured

## Resources

- [Lulu Direct API Documentation](https://developers.lulu.com/api-reference)
- [Shopify API Documentation](https://shopify.dev/docs/api)
- [jsPDF Documentation](https://artskydj.github.io/jsPDF/docs/jsPDF.html)
- [PDF-Lib Documentation](https://pdf-lib.js.org/)

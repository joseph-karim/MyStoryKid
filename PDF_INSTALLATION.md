# PDF Generation and E-commerce Installation Guide

This guide provides step-by-step instructions for installing and setting up the PDF generation, Lulu Direct printing, and Shopify e-commerce integration in the MyStoryKid application.

## Installation Steps

### 1. Install Required Dependencies

```bash
# Install PDF generation libraries
npm install jspdf jspdf-autotable pdf-lib

# If not already installed, add these dependencies as well
npm install @supabase/supabase-js uuid
```

### 2. Set Up Environment Variables

Create or update your `.env` file with the following variables:

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

### 3. Set Up Supabase Storage Buckets

Create the following storage buckets in your Supabase project:

1. `digital-downloads`: For storing generated PDFs for digital downloads
2. `print-files`: For storing print-ready PDFs for Lulu Direct

Make sure to set appropriate permissions for these buckets:

```sql
-- For digital-downloads bucket
CREATE POLICY "Authenticated users can upload files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'digital-downloads');

CREATE POLICY "Authenticated users can access their own files"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'digital-downloads' AND auth.uid() = SPLIT_PART(name, '/', 1)::uuid);

-- For print-files bucket
CREATE POLICY "Authenticated users can upload print files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'print-files');

CREATE POLICY "Authenticated users can access print files"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'print-files');
```

### 4. Set Up Lulu Direct Account

1. Create an account at [Lulu Direct API](https://developers.lulu.com/)
2. Generate API credentials (client key and client secret)
3. For development, use the sandbox environment: https://developers.sandbox.lulu.com/
4. For production, use the production environment: https://developers.lulu.com/

See the `LULU_DIRECT_SETUP.md` file for detailed instructions.

### 5. Set Up Shopify Store

1. Create a Shopify store or use an existing one
2. Set up products for digital downloads and printed books
3. Create a private app to get API credentials
4. Set up webhooks for order processing

See the `SHOPIFY_INTEGRATION.md` file for detailed instructions.

### 6. Update Routes

Make sure your routes are properly set up in your `App.jsx` file:

```jsx
<Route path="/download/:downloadId" element={<DigitalDownloadPage />} />
<Route path="/account/downloads" element={<DashboardPage />} />
```

### 7. Test the Integration

1. Test PDF generation by clicking the "Download Book" button
2. Test the purchase options by clicking the "Buy Digital Copy" or "Buy Printed Book" buttons
3. Test the Lulu Direct integration by creating a test print order
4. Test the Shopify integration by completing a test purchase

## Troubleshooting

### PDF Generation Issues

- Check the browser console for errors
- Verify that all required libraries are installed
- Make sure the book object has all required properties

### Lulu Direct API Issues

- Verify that your API credentials are correct
- Check that your PDFs meet Lulu's specifications
- Ensure that your webhook endpoints are accessible

### Shopify Integration Issues

- Verify that your Shopify API credentials are correct
- Check that your products are properly set up
- Ensure that your webhook endpoints are accessible

## Additional Resources

- [PDF Generation Documentation](./PDF_ECOMMERCE_README.md)
- [Lulu Direct Setup Guide](./LULU_DIRECT_SETUP.md)
- [Shopify Integration Guide](./SHOPIFY_INTEGRATION.md)

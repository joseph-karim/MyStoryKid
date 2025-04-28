# Lulu Direct API Setup Guide

This guide provides step-by-step instructions for setting up and integrating with the Lulu Direct API for print-on-demand book printing and fulfillment.

## 1. Create a Lulu Direct Account

1. Go to [Lulu Direct API](https://developers.lulu.com/) and create an account
2. For development, use the sandbox environment: https://developers.sandbox.lulu.com/
3. For production, use the production environment: https://developers.lulu.com/

## 2. Generate API Credentials

1. Log in to your Lulu Direct account
2. Navigate to the "Client Keys & Secret" page
3. Generate a new client key and client secret
4. Store these credentials securely in your environment variables

## 3. Set Up Environment Variables

Add the following environment variables to your `.env` file:

```
REACT_APP_LULU_CLIENT_KEY=your_lulu_client_key
REACT_APP_LULU_CLIENT_SECRET=your_lulu_client_secret
REACT_APP_LULU_CONTACT_EMAIL=contact@mystorykid.com
```

## 4. Select Product Specifications

Lulu offers a wide range of product specifications. Each product is represented by a 27-character code called `pod_package_id`:

```
Trim Size + Color + Print Quality + Bind + Paper + PPI + Finish + Linen + Foil = pod_package_id
```

For example:
- `0600X0900BWSTDPB060UW444MXX`: 6" x 9" black-and-white standard quality paperback book printed on 60# white paper with a matte cover
- `0850X1100FCSTDPB080CW444GXX`: 8.5" x 11" full color standard quality paperback book printed on 80# coated white paper with a gloss cover

Use the [Lulu Pricing Calculator](https://developers.lulu.com/pricing-calculator) to generate the appropriate SKU for your product.

## 5. Implement PDF Generation

Your PDFs must meet Lulu's specifications:

### Interior PDF Requirements:
- Single-page layout (not spreads)
- Proper page size with 0.125" bleed margins
- 0.5" safety margins from trim edge
- Appropriate gutter margins based on page count
- 300 PPI image resolution
- Embedded fonts

### Cover PDF Requirements:
- Integrated spread layout (Back Cover - Spine - Front Cover)
- Proper dimensions based on interior page count
- 0.125" bleed and 0.5" safety margins
- High-resolution images

## 6. Implement the API Integration

The integration flow typically follows these steps:

1. **Authentication**: Get an OAuth token using your client credentials
2. **File Validation**: Validate your interior and cover PDFs
3. **Print Job Creation**: Create a print job with the validated files
4. **Status Tracking**: Track the status of your print job

## 7. Testing the Integration

1. Use the sandbox environment for testing
2. Create test print jobs with various specifications
3. Verify that the PDFs are properly validated
4. Check that print jobs are created successfully
5. Track the status of your print jobs

## 8. Handling Webhooks

Lulu provides webhooks for print job status updates:

1. Subscribe to the `PRINT_JOB_STATUS_CHANGED` webhook topic
2. Set up an endpoint to receive webhook notifications
3. Update your order status based on webhook data

## 9. Going to Production

When you're ready to go to production:

1. Switch to the production environment
2. Update your API credentials
3. Set up payment information in your Lulu account
4. Test the complete order flow with real orders

## 10. Troubleshooting

Common issues and solutions:

### Authentication Issues
- Verify that your API credentials are correct
- Check that you're using the correct environment (sandbox vs. production)

### File Validation Issues
- Ensure your PDFs meet Lulu's specifications
- Check for common issues like missing fonts, low-resolution images, or incorrect page sizes

### Print Job Creation Issues
- Verify that your shipping address includes all required fields, including a phone number
- Check that your POD package ID is valid
- Ensure that your files have been properly validated

## Resources

- [Lulu Direct API Documentation](https://developers.lulu.com/api-reference)
- [Lulu Book Creation Guide](https://assets.lulu.com/media/guides/en/lulu-book-creation-guide.pdf)
- [Lulu Print API Documentation](https://developers.lulu.com/print-api-documentation)

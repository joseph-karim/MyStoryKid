# Shopify Integration Guide

This guide provides step-by-step instructions for setting up and integrating with Shopify for e-commerce functionality in the MyStoryKid application.

## 1. Create a Shopify Store

1. Go to [Shopify](https://www.shopify.com/) and sign up for an account
2. Choose a plan that fits your needs (Basic, Shopify, or Advanced)
3. Set up your store with your business information

## 2. Set Up Products

### Digital Download Product

1. In your Shopify admin, go to "Products" > "Add product"
2. Create a product for digital downloads:
   - Name: "Personalized Digital Storybook"
   - Price: $10.00
   - Product type: "Digital"
   - Uncheck "This product has physical variants"
   - Check "This is a digital product"
   - Add a description explaining that this is a personalized digital storybook

### Print Products

1. Create products for printed books:
   - Name: "Personalized Printed Storybook - Standard Shipping"
   - Price: $24.99
   - Product type: "Physical"
   - Add a description explaining that this is a personalized printed storybook with standard shipping
   
2. Create a variant for expedited shipping:
   - Name: "Personalized Printed Storybook - Expedited Shipping"
   - Price: $34.98 ($24.99 + $9.99 for expedited shipping)
   - Product type: "Physical"
   - Add a description explaining that this is a personalized printed storybook with expedited shipping

## 3. Create a Private App for API Access

1. In your Shopify admin, go to "Apps" > "Develop apps"
2. Click "Create an app"
3. Enter a name for your app (e.g., "MyStoryKid Integration")
4. Set the app URL to your application's URL
5. Set the redirect URL to your application's callback URL
6. Click "Create app"
7. Go to "API credentials" and click "Configure Admin API scopes"
8. Select the following scopes:
   - `read_products`, `write_products`
   - `read_orders`, `write_orders`
   - `read_customers`, `write_customers`
   - `read_fulfillments`, `write_fulfillments`
9. Click "Save"
10. Note your API key and API secret key

## 4. Set Up Environment Variables

Add the following environment variables to your `.env` file:

```
REACT_APP_SHOPIFY_STORE_URL=https://your-store.myshopify.com
REACT_APP_SHOPIFY_API_KEY=your_shopify_api_key
REACT_APP_SHOPIFY_API_SECRET=your_shopify_api_secret
```

## 5. Set Up Webhooks

1. In your Shopify admin, go to "Settings" > "Notifications" > "Webhooks"
2. Click "Create webhook"
3. Set up the following webhooks:
   - Event: "Order creation"
   - Format: "JSON"
   - URL: `https://your-app.com/api/webhooks/shopify/orders/create`
   
4. Set up additional webhooks as needed:
   - "Order cancellation"
   - "Order payment"
   - "Order fulfillment"

## 6. Implement the Shopify Integration

The integration flow typically follows these steps:

### For Digital Products:

1. Customer purchases a digital download
2. Shopify sends an order webhook to your application
3. Your application generates the personalized PDF
4. Your application creates a secure download link
5. Your application sends the download link to the customer

### For Print Products:

1. Customer purchases a printed book
2. Shopify sends an order webhook to your application
3. Your application generates the print-ready PDFs
4. Your application creates a print job with Lulu Direct
5. Your application updates the order status in Shopify
6. Lulu Direct fulfills the order and provides tracking information
7. Your application updates the order fulfillment in Shopify

## 7. Testing the Integration

1. Use Shopify's test mode for testing payments
2. Create test orders for both digital and print products
3. Verify that webhooks are received and processed correctly
4. Check that digital downloads are generated and accessible
5. Verify that print jobs are created with Lulu Direct
6. Test the complete order flow from purchase to fulfillment

## 8. Going to Production

When you're ready to go to production:

1. Set up your payment gateway in Shopify
2. Configure your shipping rates
3. Set up your tax settings
4. Test the complete order flow with real payments

## 9. Simplifying the Pricing Structure

To simplify the pricing structure as requested:

1. Set a fixed price for digital downloads ($10)
2. Set a fixed price for printed books that includes standard shipping
3. Only add extra fees for expedited shipping
4. Make sure the pricing is clear and transparent to customers

## 10. Troubleshooting

Common issues and solutions:

### Webhook Issues
- Verify that your webhook URLs are correct and accessible
- Check that your application is properly receiving and processing webhooks
- Use Shopify's webhook testing tool to send test webhooks

### API Issues
- Verify that your API credentials are correct
- Check that you have the necessary API scopes
- Ensure that your application is properly handling API responses

### Order Processing Issues
- Verify that your application is correctly identifying order types (digital vs. print)
- Check that your application is properly generating PDFs
- Ensure that your application is correctly creating print jobs with Lulu Direct

## Resources

- [Shopify API Documentation](https://shopify.dev/docs/api)
- [Shopify Webhook Documentation](https://shopify.dev/docs/apps/webhooks)
- [Shopify Order API Documentation](https://shopify.dev/docs/api/admin-rest/current/resources/order)
- [Shopify Product API Documentation](https://shopify.dev/docs/api/admin-rest/current/resources/product)

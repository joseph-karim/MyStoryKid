# Shopify Webhook Setup Guide

## Store Information
- **Store URL**: https://kd0mj0-he.myshopify.com/
- **API Key**: 506837dd65c7d7fd02edecbcd96a3d2d
- **API Secret**: 60e36bc956be6b0b4232f72a45430240

## Required Setup Steps

### 1. Create Private App Access Token

Since you have the API key and secret, you likely have a private app already created. To get the access token:

1. Go to your Shopify admin: https://kd0mj0-he.myshopify.com/admin
2. Navigate to Settings → Apps and sales channels
3. Click "Develop apps" 
4. Find your existing app or create a new one
5. Configure these permissions:
   - **Orders**: `read_orders`, `write_orders`
   - **Products**: `read_products`
   - **Webhooks**: `read_webhooks`, `write_webhooks`
6. Install the app and copy the **Access Token** (starts with `shpat_`)

### 2. Store Configuration

Your store is currently in "password protected" mode. For testing:
- You can keep it password protected for now
- Ensure you have at least one product configured
- Test orders can be created through the admin

### 3. Webhook Registration

Once you have the access token, use the WebhookManager component to register webhooks:

```javascript
// In the MyStoryKid app, navigate to the webhook management section
// Enter these details:
{
  domain: "kd0mj0-he.myshopify.com",
  accessToken: "shpat_..." // Your actual access token
}
```

### 4. Environment Variables

Add these to your `.env` file:
```
SHOPIFY_WEBHOOK_SECRET=60e36bc956be6b0b4232f72a45430240
SHOPIFY_API_KEY=506837dd65c7d7fd02edecbcd96a3d2d
```

## Webhook Endpoints

The system will register these webhooks:
- `orders/create` - New order created
- `orders/updated` - Order details changed  
- `orders/paid` - Payment confirmed
- `orders/cancelled` - Order cancelled
- `orders/fulfilled` - Order shipped

All pointing to: `https://your-supabase-url/functions/v1/webhook-handler/webhook/shopify`

## Testing

1. Create a test product in your Shopify admin
2. Place a test order (you can use Shopify's test payment gateway)
3. Monitor the webhook logs in the MyStoryKid admin panel
4. Verify order data appears in the database

## Next Steps

1. Get the private app access token
2. Configure the webhook registration in MyStoryKid
3. Set up Lulu Direct integration
4. Test the complete order flow 
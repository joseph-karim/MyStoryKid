# Complete Shopify Integration Setup

## Your Shopify Store Details
- **Store URL**: https://kd0mj0-he.myshopify.com/
- **API Key**: `506837dd65c7d7fd02edecbcd96a3d2d`
- **API Secret**: `60e36bc956be6b0b4232f72a45430240`

## Step 1: Get Your Access Token

You need to get a private app access token from your Shopify admin:

1. **Go to your Shopify admin**: https://kd0mj0-he.myshopify.com/admin
2. **Navigate to**: Settings → Apps and sales channels → Develop apps
3. **Create or find your app** (you likely already have one since you have API credentials)
4. **Configure permissions**:
   ```
   Orders: read_orders, write_orders
   Products: read_products  
   Webhooks: read_webhooks, write_webhooks
   ```
5. **Install the app** and copy the **Access Token** (starts with `shpat_`)

## Step 2: Environment Configuration

Create a `.env` file in your project root with:

```bash
# Shopify Configuration
SHOPIFY_API_KEY=506837dd65c7d7fd02edecbcd96a3d2d
SHOPIFY_WEBHOOK_SECRET=60e36bc956be6b0b4232f72a45430240
SHOPIFY_STORE_DOMAIN=kd0mj0-he.myshopify.com
SHOPIFY_ACCESS_TOKEN=shpat_your_actual_access_token_here

# For Supabase Edge Functions (add to your Supabase project settings)
SHOPIFY_WEBHOOK_SECRET=60e36bc956be6b0b4232f72a45430240
```

## Step 3: Supabase Environment Variables

In your Supabase project dashboard, add these environment variables for the Edge Functions:

1. Go to: Project Settings → Edge Functions → Environment Variables
2. Add:
   ```
   SHOPIFY_WEBHOOK_SECRET = 60e36bc956be6b0b4232f72a45430240
   SHOPIFY_API_BASE = https://kd0mj0-he.myshopify.com/admin/api/2023-10
   SHOPIFY_ACCESS_TOKEN = shpat_your_actual_access_token_here
   ```

## Step 4: Register Webhooks

Once you have the access token, you can register webhooks using the MyStoryKid admin interface:

1. **Start your development server**: `npm run dev`
2. **Navigate to the webhook management section** in your app
3. **Enter your credentials**:
   - Domain: `kd0mj0-he.myshopify.com`
   - Access Token: `shpat_your_actual_access_token_here`
4. **Click "Register Shopify Webhooks"**

The system will automatically register these webhook endpoints:
- `orders/create` → New orders
- `orders/updated` → Order changes
- `orders/paid` → Payment confirmations  
- `orders/cancelled` → Cancellations
- `orders/fulfilled` → Shipment notifications

## Step 5: Test the Integration

1. **Create a test product** in your Shopify admin
2. **Place a test order** (use Shopify's test payment gateway)
3. **Monitor webhook activity** in the MyStoryKid admin panel
4. **Verify order data** appears in your database

## Webhook Endpoints

Your webhooks will point to:
```
https://your-supabase-project-id.supabase.co/functions/v1/webhook-handler/webhook/shopify
```

## Store Status

Your store is currently password-protected and showing "Opening soon". This is fine for testing - you can:
- Keep it password-protected during development
- Create test orders through the Shopify admin
- Use Shopify's test payment gateway for testing

## Next Steps

1. ✅ **Get the access token** from your Shopify admin
2. ✅ **Add environment variables** to both local `.env` and Supabase
3. ✅ **Register webhooks** using the MyStoryKid interface
4. ⏳ **Set up Lulu Direct integration** (need API key)
5. ⏳ **Test complete order flow**

## Troubleshooting

- **Webhook registration fails**: Check your access token has the right permissions
- **Webhooks not receiving data**: Verify the endpoint URL in Shopify admin
- **Signature verification fails**: Ensure the webhook secret matches in all environments

Would you like me to help you get the access token, or do you have any questions about this setup process? 
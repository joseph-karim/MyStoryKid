# Complete MyStoryKid Integration Setup

## 🏪 Shopify Store Details
- **Store URL**: https://kd0mj0-he.myshopify.com/
- **API Key**: `506837dd65c7d7fd02edecbcd96a3d2d`
- **API Secret**: `60e36bc956be6b0b4232f72a45430240`
- **Status**: ⏳ Need access token

## 🖨️ Lulu Direct Details
- **Client Key**: `3a99cbfa-7501-48e5-abe6-025a7ee5b7b0`
- **Client Secret**: `tEN9BWHuW2GpgdyXXilIHnaUXeBndXCd`
- **Base64 Auth**: `M2E5OWNiZmEtNzUwMS00OGU1LWFiZTYtMDI1YTdlZTViN2IwOnRFTjlCV0h1VzJHcGdkeVhYaWxJSG5hVVhlQm5kWENk`
- **Status**: ✅ Ready to configure

## 🚀 Quick Setup Steps

### Step 1: Environment Configuration

Create a `.env` file in your project root:

```bash
# Shopify Configuration
SHOPIFY_API_KEY=506837dd65c7d7fd02edecbcd96a3d2d
SHOPIFY_WEBHOOK_SECRET=60e36bc956be6b0b4232f72a45430240
SHOPIFY_STORE_DOMAIN=kd0mj0-he.myshopify.com
SHOPIFY_ACCESS_TOKEN=shpat_your_actual_access_token_here

# Lulu Direct Configuration
LULU_CLIENT_KEY=3a99cbfa-7501-48e5-abe6-025a7ee5b7b0
LULU_CLIENT_SECRET=tEN9BWHuW2GpgdyXXilIHnaUXeBndXCd
LULU_API_BASE=https://api.lulu.com
LULU_AUTH_HEADER=Basic M2E5OWNiZmEtNzUwMS00OGU1LWFiZTYtMDI1YTdlZTViN2IwOnRFTjlCV0h1VzJHcGdkeVhYaWxJSG5hVVhlQm5kWENk

# Supabase (your existing configuration)
# VITE_SUPABASE_URL=your_supabase_url
# VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
# SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Step 2: Supabase Environment Variables

Add these to your Supabase project (Project Settings → Edge Functions → Environment Variables):

```bash
# Shopify
SHOPIFY_WEBHOOK_SECRET=60e36bc956be6b0b4232f72a45430240
SHOPIFY_API_BASE=https://kd0mj0-he.myshopify.com/admin/api/2023-10
SHOPIFY_ACCESS_TOKEN=shpat_your_actual_access_token_here

# Lulu Direct
LULU_API_KEY=3a99cbfa-7501-48e5-abe6-025a7ee5b7b0
LULU_API_BASE=https://api.lulu.com
LULU_WEBHOOK_SECRET=tEN9BWHuW2GpgdyXXilIHnaUXeBndXCd
```

### Step 3: Get Shopify Access Token

**Still need this from your Shopify admin:**

1. Go to: https://kd0mj0-he.myshopify.com/admin
2. Settings → Apps and sales channels → Develop apps
3. Create/find your app with these permissions:
   - Orders: `read_orders`, `write_orders`
   - Products: `read_products`
   - Webhooks: `read_webhooks`, `write_webhooks`
4. Install and copy the access token (starts with `shpat_`)

### Step 4: Register Webhooks

Once you have the Shopify access token:

1. **Start your app**: `npm run dev`
2. **Navigate to webhook management** in your admin panel
3. **Register Shopify webhooks**:
   - Domain: `kd0mj0-he.myshopify.com`
   - Access Token: `shpat_your_actual_access_token`
4. **Register Lulu Direct webhooks**:
   - API Key: `3a99cbfa-7501-48e5-abe6-025a7ee5b7b0`

## 🔄 Complete Order Flow

Once configured, here's what happens automatically:

1. **Customer places order** on Shopify → Webhook triggers
2. **Order saved** to MyStoryKid database
3. **Payment confirmed** → Print job created with Lulu Direct
4. **Book printed** → Status updates via Lulu webhooks
5. **Shipped** → Customer notified with tracking info
6. **Delivered** → Order marked complete

## 🧪 Testing the Integration

### Test Shopify Integration:
1. Create a test product in Shopify admin
2. Place a test order (use test payment gateway)
3. Check webhook logs in MyStoryKid admin
4. Verify order appears in database

### Test Lulu Direct Integration:
1. Ensure you have a book in your MyStoryKid system
2. Create a test print job through the admin
3. Monitor print job status updates
4. Check Lulu Direct dashboard for job creation

## 📊 Monitoring & Health Checks

Your webhook system includes:
- **Real-time health monitoring**
- **Error tracking and retry logic**
- **Activity logs and analytics**
- **Automatic job processing with exponential backoff**

## 🔧 Webhook Endpoints

**Shopify webhooks** → `https://your-supabase-url/functions/v1/webhook-handler/webhook/shopify`
**Lulu webhooks** → `https://your-supabase-url/functions/v1/webhook-handler/webhook/lulu`

## ⚡ Next Actions

1. **Get Shopify access token** (only missing piece)
2. **Add environment variables** to both local and Supabase
3. **Register webhooks** using the MyStoryKid interface
4. **Test complete order flow**
5. **Go live!** 🎉

## 🆘 Troubleshooting

- **Shopify webhook fails**: Check access token permissions
- **Lulu API errors**: Verify client key/secret are correct
- **Webhook signature errors**: Ensure secrets match in all environments
- **Job processing issues**: Check Supabase Edge Function logs

You're now ready for a complete end-to-end e-commerce integration! The only missing piece is the Shopify access token. 
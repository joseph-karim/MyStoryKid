# Get Shopify Admin API Access Token

## 🎯 Goal
Get an Admin API access token (starts with `shpat_`) for webhook integration.

## 📋 Step-by-Step Instructions

### Step 1: Access Your Shopify Admin
1. Go to: **https://kd0mj0-he.myshopify.com/admin**
2. Log in with your admin credentials

### Step 2: Navigate to Apps Section
1. In the left sidebar, click **"Settings"**
2. Click **"Apps and sales channels"**
3. Click **"Develop apps"** (at the bottom)

### Step 3: Create or Find Your App
**Option A: If you already have an app**
- Look for an existing app in the list
- Click on it to open

**Option B: If you need to create a new app**
- Click **"Create an app"**
- Enter app name: `MyStoryKid Integration`
- Click **"Create app"**

### Step 4: Configure API Permissions
1. Click **"Configure Admin API scopes"**
2. **Enable these permissions**:
   - ✅ `read_orders` - Read orders
   - ✅ `write_orders` - Write orders  
   - ✅ `read_products` - Read products
   - ✅ `read_webhooks` - Read webhooks
   - ✅ `write_webhooks` - Write webhooks

3. Click **"Save"**

### Step 5: Install the App
1. Click **"Install app"** 
2. Review the permissions
3. Click **"Install app"** to confirm

### Step 6: Get Your Access Token
1. After installation, you'll see **"Admin API access token"**
2. Click **"Reveal token once"**
3. **Copy the token** (starts with `shpat_`)
4. **Save it securely** - you won't be able to see it again!

## ✅ What You Should Have
- **Admin API access token**: `shpat_xxxxxxxxxxxxxxxxxxxxxxxxxx`
- **Length**: Usually 32+ characters
- **Starts with**: `shpat_`

## 🚨 Important Notes
- **One-time view**: You can only see the token once after creation
- **Keep it secure**: Don't share this token publicly
- **For webhooks**: This is what we need for the integration

## 🔄 Next Steps
Once you have the `shpat_` token:
1. Add it to your environment variables
2. Register webhooks using MyStoryKid admin
3. Test the complete integration!

---

**Your current tokens:**
- ✅ Storefront API: `98b873e1aa50990bd151c164830ffd95` (for frontend)
- ⏳ Admin API: `shpat_...` (needed for webhooks)

**Both tokens serve different purposes and you'll keep both!** 
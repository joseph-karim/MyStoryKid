# Supabase Setup for MyStoryKid

## Project Configuration

Your Supabase project is already set up at:
- **Project ID**: `uvziaiimktymmjwqgknl`
- **Dashboard**: https://supabase.com/dashboard/project/uvziaiimktymmjwqgknl/auth/users
- **API URL**: https://uvziaiimktymmjwqgknl.supabase.co

## Environment Variables

Create a `.env.local` file in your project root with the following variables:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://uvziaiimktymmjwqgknl.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# API Keys for Edge Functions
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
PERPLEXITY_API_KEY=your_perplexity_api_key_here
```

## Getting Your Supabase Keys

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard/project/uvziaiimktymmjwqgknl/settings/api)
2. Navigate to Settings > API
3. Copy the following:
   - **URL**: Already set to `https://uvziaiimktymmjwqgknl.supabase.co`
   - **anon/public key**: Copy this to `VITE_SUPABASE_ANON_KEY`
   - **service_role key**: Keep this secure, only use in Edge Functions

## Client Setup

The Supabase client is configured in `src/lib/supabase.js` and ready to use:

```javascript
import { supabase, auth, db, storage } from '../lib/supabase'

// Authentication
const { data, error } = await auth.signUp({ email, password })

// Database operations
const { data, error } = await db.from('table').select('*')

// Storage operations
const { data, error } = await storage.from('bucket').upload('path', file)
```

## Next Steps

1. **Set up environment variables** with your actual Supabase keys
2. **Create Edge Functions** for secure API operations
3. **Set up database tables** for books, users, and characters
4. **Configure authentication** providers and policies
5. **Set up storage buckets** for images and generated content

## Edge Functions

Edge Functions will be created in the `supabase/functions/` directory for:
- OpenAI API calls (story generation, image generation)
- Image processing and optimization
- Payment processing integration
- Email notifications

## Database Schema

Planned tables:
- `users` - User accounts and profiles
- `books` - Generated books and metadata
- `characters` - Character definitions and images
- `orders` - Purchase history and fulfillment
- `book_pages` - Individual page content and images 
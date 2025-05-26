-- MyStoryKid Database Schema
-- This migration creates all the necessary tables for the complete application

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE public.user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  subscription_status TEXT DEFAULT 'free' CHECK (subscription_status IN ('free', 'premium', 'enterprise')),
  subscription_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Books table
CREATE TABLE public.books (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'generating', 'completed', 'published')),
  child_name TEXT,
  category TEXT,
  art_style_code TEXT,
  custom_style_description TEXT,
  age_range TEXT,
  story_type TEXT DEFAULT 'standard',
  word_count INTEGER,
  page_count INTEGER,
  cover_image_url TEXT,
  thumbnail_url TEXT,
  generation_data JSONB, -- Store wizard data and generation parameters
  metadata JSONB, -- Additional book metadata
  is_public BOOLEAN DEFAULT FALSE,
  is_claimed BOOLEAN DEFAULT FALSE, -- For anonymous to authenticated user transfer
  anonymous_session_id TEXT, -- Track anonymous sessions
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Characters table
CREATE TABLE public.characters (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  book_id UUID REFERENCES public.books(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'supporting' CHECK (role IN ('main', 'supporting', 'background')),
  character_type TEXT DEFAULT 'child' CHECK (character_type IN ('child', 'adult', 'animal', 'fantasy')),
  gender TEXT,
  age TEXT,
  relationship TEXT, -- Free-form relationship field
  traits TEXT[], -- Array of character traits
  interests TEXT[], -- Array of character interests
  photo_url TEXT, -- Original uploaded photo
  style_preview_url TEXT, -- Generated character preview
  art_style TEXT,
  appearance_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Book pages table
CREATE TABLE public.book_pages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  book_id UUID REFERENCES public.books(id) ON DELETE CASCADE,
  page_number INTEGER NOT NULL,
  page_type TEXT DEFAULT 'content' CHECK (page_type IN ('cover', 'title', 'content', 'back-cover')),
  spread_number INTEGER, -- For tracking spreads
  text_content TEXT,
  visual_prompt TEXT,
  image_url TEXT,
  image_generation_status TEXT DEFAULT 'pending' CHECK (image_generation_status IN ('pending', 'generating', 'completed', 'failed')),
  image_generation_attempts INTEGER DEFAULT 0,
  enhancement_applied BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(book_id, page_number)
);

-- Orders table
CREATE TABLE public.orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  book_id UUID REFERENCES public.books(id) ON DELETE SET NULL,
  shopify_order_id TEXT UNIQUE,
  lulu_job_id TEXT,
  order_type TEXT NOT NULL CHECK (order_type IN ('digital', 'print')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled', 'failed')),
  total_amount DECIMAL(10,2),
  currency TEXT DEFAULT 'USD',
  shipping_address JSONB,
  shipping_method TEXT,
  enhancement_applied BOOLEAN DEFAULT FALSE,
  enhancement_cost DECIMAL(10,2),
  print_specifications JSONB, -- POD package details, size, binding, etc.
  fulfillment_data JSONB, -- Tracking info, delivery dates, etc.
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Digital downloads table
CREATE TABLE public.digital_downloads (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID REFERENCES public.books(id) ON DELETE CASCADE,
  download_url TEXT NOT NULL,
  filename TEXT NOT NULL,
  file_size_bytes BIGINT,
  download_count INTEGER DEFAULT 0,
  max_downloads INTEGER DEFAULT 5,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_downloaded_at TIMESTAMPTZ
);

-- Print jobs table (for Lulu Direct integration)
CREATE TABLE public.print_jobs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  book_id UUID REFERENCES public.books(id) ON DELETE CASCADE,
  lulu_job_id TEXT UNIQUE NOT NULL,
  pod_package_id TEXT NOT NULL,
  status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted', 'processing', 'printed', 'shipped', 'delivered', 'cancelled')),
  interior_pdf_url TEXT,
  cover_pdf_url TEXT,
  shipping_level TEXT,
  tracking_number TEXT,
  estimated_shipping_date DATE,
  actual_shipping_date DATE,
  estimated_delivery_date DATE,
  actual_delivery_date DATE,
  cost_breakdown JSONB, -- Detailed cost information
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Book sharing table
CREATE TABLE public.book_shares (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  book_id UUID REFERENCES public.books(id) ON DELETE CASCADE,
  shared_by_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  share_token TEXT UNIQUE NOT NULL,
  share_type TEXT DEFAULT 'preview' CHECK (share_type IN ('preview', 'gift', 'public')),
  expires_at TIMESTAMPTZ,
  view_count INTEGER DEFAULT 0,
  max_views INTEGER,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User sessions table (for anonymous user tracking)
CREATE TABLE public.user_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_anonymous BOOLEAN DEFAULT TRUE,
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_books_user_id ON public.books(user_id);
CREATE INDEX idx_books_status ON public.books(status);
CREATE INDEX idx_books_anonymous_session ON public.books(anonymous_session_id);
CREATE INDEX idx_books_created_at ON public.books(created_at DESC);
CREATE INDEX idx_characters_book_id ON public.characters(book_id);
CREATE INDEX idx_book_pages_book_id ON public.book_pages(book_id);
CREATE INDEX idx_book_pages_page_number ON public.book_pages(book_id, page_number);
CREATE INDEX idx_orders_user_id ON public.orders(user_id);
CREATE INDEX idx_orders_shopify_id ON public.orders(shopify_order_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_digital_downloads_user_id ON public.digital_downloads(user_id);
CREATE INDEX idx_print_jobs_lulu_id ON public.print_jobs(lulu_job_id);
CREATE INDEX idx_book_shares_token ON public.book_shares(share_token);
CREATE INDEX idx_user_sessions_session_id ON public.user_sessions(session_id);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.print_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- User profiles policies
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Books policies
CREATE POLICY "Users can view own books" ON public.books
  FOR SELECT USING (
    auth.uid() = user_id OR 
    (user_id IS NULL AND anonymous_session_id = current_setting('app.anonymous_session_id', true))
  );

CREATE POLICY "Users can insert books" ON public.books
  FOR INSERT WITH CHECK (
    auth.uid() = user_id OR 
    (auth.uid() IS NULL AND user_id IS NULL)
  );

CREATE POLICY "Users can update own books" ON public.books
  FOR UPDATE USING (
    auth.uid() = user_id OR 
    (user_id IS NULL AND anonymous_session_id = current_setting('app.anonymous_session_id', true))
  );

CREATE POLICY "Users can delete own books" ON public.books
  FOR DELETE USING (auth.uid() = user_id);

-- Public books policy (for sharing)
CREATE POLICY "Anyone can view public books" ON public.books
  FOR SELECT USING (is_public = true);

-- Characters policies
CREATE POLICY "Users can manage characters for own books" ON public.characters
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.books 
      WHERE books.id = characters.book_id 
      AND (
        books.user_id = auth.uid() OR 
        (books.user_id IS NULL AND books.anonymous_session_id = current_setting('app.anonymous_session_id', true))
      )
    )
  );

-- Book pages policies
CREATE POLICY "Users can manage pages for own books" ON public.book_pages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.books 
      WHERE books.id = book_pages.book_id 
      AND (
        books.user_id = auth.uid() OR 
        (books.user_id IS NULL AND books.anonymous_session_id = current_setting('app.anonymous_session_id', true))
      )
    )
  );

-- Orders policies
CREATE POLICY "Users can view own orders" ON public.orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert orders" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own orders" ON public.orders
  FOR UPDATE USING (auth.uid() = user_id);

-- Digital downloads policies
CREATE POLICY "Users can view own downloads" ON public.digital_downloads
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert downloads" ON public.digital_downloads
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Print jobs policies
CREATE POLICY "Users can view print jobs for own orders" ON public.print_jobs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.id = print_jobs.order_id 
      AND orders.user_id = auth.uid()
    )
  );

-- Book shares policies
CREATE POLICY "Users can manage shares for own books" ON public.book_shares
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.books 
      WHERE books.id = book_shares.book_id 
      AND books.user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can view active shares" ON public.book_shares
  FOR SELECT USING (is_active = true AND (expires_at IS NULL OR expires_at > NOW()));

-- User sessions policies
CREATE POLICY "Users can view own sessions" ON public.user_sessions
  FOR SELECT USING (auth.uid() = user_id OR session_id = current_setting('app.session_id', true));

CREATE POLICY "Anyone can insert sessions" ON public.user_sessions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own sessions" ON public.user_sessions
  FOR UPDATE USING (auth.uid() = user_id OR session_id = current_setting('app.session_id', true));

-- Functions for book claiming and management

-- Function to claim a book when user authenticates
CREATE OR REPLACE FUNCTION claim_book(book_id_to_claim UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_user_id UUID;
BEGIN
  -- Get the current authenticated user ID
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated to claim a book';
  END IF;
  
  -- Update the book to assign it to the authenticated user
  UPDATE public.books 
  SET 
    user_id = current_user_id,
    is_claimed = true,
    updated_at = NOW()
  WHERE 
    id = book_id_to_claim 
    AND user_id IS NULL 
    AND is_claimed = false;
  
  -- Return true if a row was updated
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create a book share link
CREATE OR REPLACE FUNCTION create_book_share(
  book_id_param UUID,
  share_type_param TEXT DEFAULT 'preview',
  expires_in_days INTEGER DEFAULT 30
)
RETURNS TEXT AS $$
DECLARE
  share_token TEXT;
  expires_at_param TIMESTAMPTZ;
BEGIN
  -- Generate a unique share token
  share_token := encode(gen_random_bytes(32), 'base64url');
  
  -- Calculate expiration date
  IF expires_in_days IS NOT NULL THEN
    expires_at_param := NOW() + (expires_in_days || ' days')::INTERVAL;
  END IF;
  
  -- Insert the share record
  INSERT INTO public.book_shares (
    book_id,
    shared_by_user_id,
    share_token,
    share_type,
    expires_at
  ) VALUES (
    book_id_param,
    auth.uid(),
    share_token,
    share_type_param,
    expires_at_param
  );
  
  RETURN share_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update book generation status
CREATE OR REPLACE FUNCTION update_book_generation_status(
  book_id_param UUID,
  new_status TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.books 
  SET 
    status = new_status,
    updated_at = NOW()
  WHERE id = book_id_param;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_books_updated_at BEFORE UPDATE ON public.books
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_characters_updated_at BEFORE UPDATE ON public.characters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_book_pages_updated_at BEFORE UPDATE ON public.book_pages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_print_jobs_updated_at BEFORE UPDATE ON public.print_jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 
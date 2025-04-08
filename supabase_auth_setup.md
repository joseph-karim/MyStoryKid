# Supabase Authentication Setup Guide

This guide outlines the steps needed to configure Supabase authentication for MyStoryKid, including anonymous authentication and email/password login.

## 1. Enable Email Authentication

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Providers**
3. Ensure **Email** provider is enabled
4. Configure the following settings:
   - **Confirm email**: Choose whether to require email confirmation (recommended for production)
   - **Secure email template**: Enable for production

## 2. Enable Anonymous Authentication

1. In the same **Providers** section
2. Find the **Anonymous** section (or "Allow anonymous sign-ins")
3. Toggle it to **Enabled**
4. This allows users to create books without signing up first

## 3. Configure Site URL and Redirect URLs

1. Navigate to **Authentication** → **URL Configuration**
2. Set the **Site URL** to: `https://mystorykid.com`
3. Add the following **Redirect URLs**:
   - `https://mystorykid.com/dashboard`
   - `https://mystorykid.com/book/*` (for book preview pages)
   - `https://mystorykid.com/create` (for the book creation wizard)
   - Add any other pages users might be redirected to after login

## 4. Configure Email Templates (Optional but Recommended)

1. Navigate to **Authentication** → **Email Templates**
2. Customize the following templates to match your brand:
   - **Confirmation**: Sent when a user signs up
   - **Invite**: Sent when a user is invited
   - **Magic Link**: If you decide to enable passwordless login
   - **Reset Password**: For password reset functionality

## 5. Set Up Row Level Security (RLS) Policies

The database migration script we created already sets up the necessary RLS policies, but make sure they are correctly applied:

1. Navigate to **Database** → **Tables**
2. Select the `books` table
3. Go to the **Policies** tab
4. Verify the following policies exist:
   - "Allow anonymous insert"
   - "Allow anonymous SELECT own unclaimed book"
   - "Allow anonymous UPDATE own unclaimed book"
   - "Allow authenticated users full access to own books"

## 6. Create Storage Buckets

1. Navigate to **Storage**
2. Create the following buckets if they don't exist:
   - `character-references`: For character reference images
   - `generated-illustrations`: For the final book illustrations
3. For each bucket, set the following permissions:
   - **Public access**: Enabled (so images can be viewed without authentication)
   - **RLS**: Enabled (to control who can upload/modify files)
4. Add appropriate RLS policies for each bucket (similar to the books table)

## 7. Testing the Authentication Flow

To test the complete anonymous-to-authenticated flow:

1. Open your app in an incognito/private browser window
2. Start creating a book without logging in
3. Complete the wizard and view the generated book
4. Try to download, save, or print the book
5. You should be prompted to log in or sign up
6. After authentication, the book should be automatically claimed and the action completed

## Troubleshooting

If you encounter issues:

1. Check the browser console for errors
2. Verify the Supabase URL and anon key in your `.env` file
3. Ensure the RLS policies are correctly applied
4. Check the Supabase logs for authentication errors
5. Verify the storage buckets exist and have the correct permissions
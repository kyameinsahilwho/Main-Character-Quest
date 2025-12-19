# Supabase Integration Setup Guide

This guide will help you set up Supabase authentication and database sync for your Main Character Quest app.

## Prerequisites

- A Supabase account (sign up at https://supabase.com)
- Node.js and npm installed
- This project cloned locally

## Step 1: Create a Supabase Project

1. Go to https://app.supabase.com
2. Click "New Project"
3. Fill in your project details:
   - Name: "main-character-quest" (or your preferred name)
   - Database Password: Create a strong password
   - Region: Choose closest to your users
4. Wait for the project to be created (takes ~2 minutes)

## Step 2: Get Your API Keys

1. In your Supabase project dashboard, click on the "Settings" icon (gear) in the left sidebar
2. Click on "API" under Project Settings
3. Copy the following values:
   - **Project URL** (under Project API)
   - **anon/public key** (under Project API keys)

## Step 3: Configure Environment Variables

1. Copy the `.env.example` file to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Open `.env.local` and replace the placeholder values:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   ```

## Step 4: Run the Database Migration

1. In your Supabase dashboard, click on "SQL Editor" in the left sidebar
2. Click "New Query"
3. Copy the entire contents of `supabase/migrations/001_initial_schema.sql`
4. Paste it into the SQL editor
5. Click "Run" or press Ctrl+Enter
6. You should see "Success. No rows returned" - this is correct!

### Optional: Add Due Date Support (Recommended)
If you want to support task due dates:
1. Create another new query in SQL Editor
2. Copy the contents of `supabase/migrations/002_add_due_date.sql`
3. Paste and run it
4. This adds a `due_date` column to your tasks table

## Step 5: Configure Authentication Providers

### Email Authentication (Already Enabled)
Email authentication is enabled by default. Users can sign up with email/password.

### Google OAuth (Optional but Recommended)

1. In Supabase dashboard, go to "Authentication" → "Providers"
2. Find "Google" and click to expand
3. Toggle "Enable Sign in with Google" to ON
4. You'll need to create a Google OAuth app:
   
   **Create Google OAuth Credentials:**
   - Go to https://console.cloud.google.com
   - Create a new project or select existing
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth 2.0 Client ID"
   - Application type: "Web application"
   - Add authorized redirect URIs:
     ```
     https://your-project-ref.supabase.co/auth/v1/callback
     ```
   - Copy the Client ID and Client Secret
   
5. Back in Supabase, paste:
   - Client ID
   - Client Secret
6. Click "Save"

## Step 6: Test Your Setup

1. Install dependencies (if not already done):
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open http://localhost:3000
4. You should be redirected to the login page
5. Click "Sign up" and create a test account
6. After signing up, you should be logged in and see your tasks

## Step 7: Verify Database

1. In Supabase dashboard, go to "Table Editor"
2. You should see these tables:
   - `tasks`
   - `subtasks`
   - `user_settings`
3. After creating a task in your app, check the `tasks` table to confirm data is being saved

## Features

### Authentication
- ✅ Email/Password sign up and login
- ✅ Google OAuth (if configured)
- ✅ Session management with 30-day expiration
- ✅ Automatic session refresh
- ✅ Protected routes (must be logged in to access app)

### Data Sync
- ✅ Local storage used as backup and for offline support
- ✅ Automatic sync to Supabase when user is logged in
- ✅ One-time migration of local data to cloud on first login
- ✅ Real-time updates across all operations:
  - Add tasks
  - Complete tasks
  - Delete tasks
  - Add subtasks
  - Toggle subtasks
  - Update tasks

### Security
- ✅ Row Level Security (RLS) enabled
- ✅ Users can only access their own data
- ✅ Automatic user_settings creation on signup
- ✅ Secure API calls with authentication

## Troubleshooting

### "Failed to load tasks" error
- Check that your environment variables are correct in `.env.local`
- Ensure you've run the database migration
- Check browser console for specific errors

### "PGRST301" error
- This means RLS is blocking access
- Make sure you've run the entire migration including the RLS policies
- Try logging out and back in

### Session expires immediately
- Check that your Supabase project URL and anon key are correct
- Clear browser storage and try again
- Check Supabase dashboard → Authentication → Settings for session settings

### Data not syncing
- Open browser DevTools → Network tab
- Look for failed requests to Supabase
- Check Authentication → Users in Supabase dashboard to confirm user exists
- Verify tables have data by checking Table Editor

## Production Deployment

When deploying to production (Vercel, Netlify, etc.):

1. Add environment variables to your hosting platform:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

2. Update Google OAuth redirect URIs to include your production domain:
   ```
   https://your-domain.com/auth/callback
   ```

3. Update Supabase Auth settings:
   - Go to Authentication → URL Configuration
   - Add your production URL to Site URL
   - Add `https://your-domain.com/**` to Redirect URLs

## Support

For issues with:
- **Supabase**: Check https://supabase.com/docs or https://github.com/supabase/supabase/discussions
- **This integration**: Open an issue in your project repository

## Database Schema

### tasks table
- `id` (uuid, primary key)
- `user_id` (uuid, foreign key to auth.users)
- `title` (text)
- `description` (text, nullable)
- `priority` (text: low/medium/high)
- `difficulty` (text: easy/medium/hard)
- `category` (text, nullable)
- `reward_xp` (integer, default 10)
- `is_completed` (boolean)
- `is_template` (boolean)
- `completed_at` (timestamptz, nullable)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

### subtasks table
- `id` (uuid, primary key)
- `task_id` (uuid, foreign key to tasks)
- `title` (text)
- `is_completed` (boolean)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

### user_settings table
- `user_id` (uuid, primary key, foreign key to auth.users)
- `total_xp` (integer)
- `level` (integer)
- `tasks_completed` (integer)
- `current_streak` (integer)
- `longest_streak` (integer)
- `last_activity_date` (date, nullable)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

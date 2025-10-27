# Supabase Setup Guide

This guide will help you set up Supabase authentication and cloud storage for the DrawGuess game.

## Prerequisites

- Node.js and npm installed
- A Supabase account (free at [supabase.com](https://supabase.com))

## Step 1: Create Supabase Project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: DrawGuess (or your preferred name)
   - **Database Password**: Create a strong password
   - **Region**: Choose closest to your users
5. Click "Create new project"
6. Wait for the project to be ready (usually 1-2 minutes)

## Step 2: Get API Keys

1. In your Supabase dashboard, go to **Settings** > **API**
2. Copy the following values:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **anon public** key
   - **service_role** key (keep this secret!)

## Step 3: Configure Environment Variables

1. Open your `.env.local` file in the project root
2. Update the Supabase configuration:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Enable Supabase
NEXT_PUBLIC_ENABLE_SUPABASE=true
NEXT_PUBLIC_ENABLE_OFFLINE_MODE=true
```

3. Replace the placeholder values with your actual Supabase credentials

## Step 4: Verify Configuration

Run the configuration checker:

```bash
npm run supabase:check
```

This will verify that all required environment variables are set correctly.

## Step 5: Next Steps

After completing the basic setup:

1. **Database Setup**: Run the database migration tasks to create tables
2. **Authentication Setup**: Configure auth providers and settings
3. **Storage Setup**: Create storage buckets for drawings
4. **Testing**: Test the integration with your application

## Helpful Commands

- `npm run supabase:setup` - Show setup instructions
- `npm run supabase:check` - Check configuration status

## Security Notes

- Never commit your `.env.local` file to version control
- Keep your `service_role` key secret - it has admin privileges
- The `anon` key is safe to expose in client-side code
- Use Row Level Security (RLS) policies to protect user data

## Troubleshooting

### Common Issues

1. **Invalid URL**: Make sure your Supabase URL includes `https://` and ends with `.supabase.co`
2. **Wrong Keys**: Double-check you're using the correct anon and service role keys
3. **Project Not Ready**: Wait for your Supabase project to finish initializing

### Getting Help

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Community](https://github.com/supabase/supabase/discussions)
- Check the project's GitHub issues

## What's Next?

Once Supabase is configured, you can proceed with:
- Task 2: Database schema design and migration
- Task 3: Supabase client integration
- Task 4: User authentication functionality
#!/bin/bash

# Supabase Setup Script
# This script helps configure Supabase environment variables

echo "🚀 Supabase Setup for DrawGuess Game"
echo "===================================="
echo ""

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "❌ .env.local file not found. Please create it first."
    exit 1
fi

echo "📋 To complete Supabase setup, you need to:"
echo ""
echo "1. Create a new Supabase project at https://supabase.com/dashboard"
echo "2. Go to Settings > API in your Supabase dashboard"
echo "3. Copy your Project URL and API keys"
echo "4. Update the following variables in your .env.local file:"
echo ""
echo "   NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co"
echo "   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here"
echo "   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here"
echo ""
echo "5. Enable Supabase by setting:"
echo "   NEXT_PUBLIC_ENABLE_SUPABASE=true"
echo ""
echo "📚 For detailed setup instructions, see:"
echo "   - Supabase documentation: https://supabase.com/docs"
echo "   - Project README.md file"
echo ""

# Check current configuration
echo "🔍 Current Supabase configuration status:"
echo ""

if grep -q "NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co" .env.local; then
    echo "❌ SUPABASE_URL: Not configured (using placeholder)"
else
    echo "✅ SUPABASE_URL: Configured"
fi

if grep -q "NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here" .env.local; then
    echo "❌ SUPABASE_ANON_KEY: Not configured (using placeholder)"
else
    echo "✅ SUPABASE_ANON_KEY: Configured"
fi

if grep -q "SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here" .env.local; then
    echo "❌ SUPABASE_SERVICE_ROLE_KEY: Not configured (using placeholder)"
else
    echo "✅ SUPABASE_SERVICE_ROLE_KEY: Configured"
fi

if grep -q "NEXT_PUBLIC_ENABLE_SUPABASE=true" .env.local; then
    echo "✅ SUPABASE_ENABLED: Yes"
else
    echo "⚠️  SUPABASE_ENABLED: No (set to true after configuration)"
fi

echo ""
echo "🔧 After updating your environment variables, restart your development server:"
echo "   npm run dev"
echo ""
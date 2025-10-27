// Simple Supabase configuration checker
const path = require('path');
const fs = require('fs');

function checkSupabaseConfig() {
  const envPath = path.join(__dirname, '..', '.env.local');
  
  if (!fs.existsSync(envPath)) {
    console.log('❌ .env.local file not found');
    return false;
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  
  const hasUrl = envContent.includes('NEXT_PUBLIC_SUPABASE_URL=') && 
                 !envContent.includes('NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co');
  
  const hasAnonKey = envContent.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY=') && 
                     !envContent.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here');
  
  const hasServiceKey = envContent.includes('SUPABASE_SERVICE_ROLE_KEY=') && 
                        !envContent.includes('SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here');
  
  const isEnabled = envContent.includes('NEXT_PUBLIC_ENABLE_SUPABASE=true');

  console.log('🔍 Supabase Configuration Status:');
  console.log(`   URL configured: ${hasUrl ? '✅' : '❌'}`);
  console.log(`   Anon key configured: ${hasAnonKey ? '✅' : '❌'}`);
  console.log(`   Service key configured: ${hasServiceKey ? '✅' : '❌'}`);
  console.log(`   Supabase enabled: ${isEnabled ? '✅' : '❌'}`);
  
  const allConfigured = hasUrl && hasAnonKey && hasServiceKey;
  console.log(`\n📊 Overall status: ${allConfigured ? '✅ Ready' : '⚠️  Needs configuration'}`);
  
  if (!allConfigured) {
    console.log('\n💡 Run "npm run supabase:setup" for setup instructions');
  }
  
  return allConfigured;
}

checkSupabaseConfig();
// Debug utility to check environment configuration
export function debugEnvironment() {
  const envVars = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_URL: process.env.SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '[REDACTED]' : undefined,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? '[REDACTED]' : undefined,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? '[REDACTED]' : undefined,
    NODE_ENV: process.env.NODE_ENV
  }

  console.log('🔧 Environment Debug:', envVars)
  
  return {
    hasPublicUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasUrl: !!process.env.SUPABASE_URL,
    hasPublicAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    hasAnonKey: !!process.env.SUPABASE_ANON_KEY,
    hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    environment: process.env.NODE_ENV
  }
}
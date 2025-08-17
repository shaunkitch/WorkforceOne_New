export const Config = {
  supabase: {
    url: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
    anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
    serviceRoleKey: process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || '',
  },
  admin: {
    secret: process.env.EXPO_PUBLIC_GLOBAL_ADMIN_SECRET || '',
    allowedEmails: [
      'shaun@workforceone.com',
      'admin@workforceone.com'
    ]
  },
  app: {
    name: 'WorkforceOne Admin',
    version: '1.0.0',
    theme: {
      primary: '#0284c7',
      secondary: '#0ea5e9',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      background: '#f8fafc',
      surface: '#ffffff',
      text: '#1f2937',
      textSecondary: '#6b7280'
    }
  }
}
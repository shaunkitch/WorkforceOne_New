import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useColorScheme } from 'react-native'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

interface BrandingConfig {
  id: string
  organization_id: string
  primary_color: string
  secondary_color: string
  accent_color: string
  background_light: string
  background_dark: string
  surface_color: string
  text_primary: string
  text_secondary: string
  text_muted: string
  success_color: string
  warning_color: string
  error_color: string
  info_color: string
  logo_url?: string
  favicon_url?: string
  font_family?: string
  border_radius?: number
  theme_mode?: 'light' | 'dark' | 'auto'
}

interface ThemeColors {
  primary: string
  secondary: string
  accent: string
  background: string
  surface: string
  text: {
    primary: string
    secondary: string
    muted: string
  }
  status: {
    success: string
    warning: string
    error: string
    info: string
  }
  border: string
  shadow: string
}

interface ThemeContextType {
  colors: ThemeColors
  branding: BrandingConfig | null
  isDark: boolean
  loading: boolean
  refreshBranding: () => Promise<void>
}

const defaultLightColors: ThemeColors = {
  primary: '#3b82f6',
  secondary: '#1e40af',
  accent: '#06b6d4',
  background: '#ffffff',
  surface: '#ffffff',
  text: {
    primary: '#111827',
    secondary: '#6b7280',
    muted: '#9ca3af'
  },
  status: {
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6'
  },
  border: '#e5e7eb',
  shadow: 'rgba(0, 0, 0, 0.1)'
}

const defaultDarkColors: ThemeColors = {
  primary: '#3b82f6',
  secondary: '#1e40af',
  accent: '#06b6d4',
  background: '#111827',
  surface: '#1f2937',
  text: {
    primary: '#ffffff',
    secondary: '#d1d5db',
    muted: '#9ca3af'
  },
  status: {
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6'
  },
  border: '#374151',
  shadow: 'rgba(255, 255, 255, 0.1)'
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

interface ThemeProviderProps {
  children: ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const { profile } = useAuth()
  const systemColorScheme = useColorScheme()
  const [branding, setBranding] = useState<BrandingConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [isDark, setIsDark] = useState(systemColorScheme === 'dark')

  // Create theme colors based on branding and theme mode
  const createThemeColors = (brandingConfig: BrandingConfig | null, darkMode: boolean): ThemeColors => {
    const baseColors = darkMode ? defaultDarkColors : defaultLightColors
    
    if (!brandingConfig) {
      return baseColors
    }

    return {
      primary: brandingConfig.primary_color,
      secondary: brandingConfig.secondary_color,
      accent: brandingConfig.accent_color,
      background: darkMode ? brandingConfig.background_dark : brandingConfig.background_light,
      surface: brandingConfig.surface_color,
      text: {
        primary: brandingConfig.text_primary,
        secondary: brandingConfig.text_secondary,
        muted: brandingConfig.text_muted
      },
      status: {
        success: brandingConfig.success_color,
        warning: brandingConfig.warning_color,
        error: brandingConfig.error_color,
        info: brandingConfig.info_color
      },
      border: darkMode ? '#374151' : '#e5e7eb',
      shadow: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
    }
  }

  const [colors, setColors] = useState<ThemeColors>(() => 
    createThemeColors(null, systemColorScheme === 'dark')
  )

  // Load organization branding
  const loadBranding = async (organizationId: string) => {
    try {
      setLoading(true)
      
      const { data: brandingData, error } = await supabase
        .from('organization_branding')
        .select('*')
        .eq('organization_id', organizationId)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading branding:', error)
        return
      }

      if (brandingData) {
        setBranding(brandingData)
        
        // Determine theme mode
        let darkMode = systemColorScheme === 'dark'
        if (brandingData.theme_mode === 'light') {
          darkMode = false
        } else if (brandingData.theme_mode === 'dark') {
          darkMode = true
        }
        
        setIsDark(darkMode)
        setColors(createThemeColors(brandingData, darkMode))
      } else {
        // No custom branding, use defaults
        setBranding(null)
        setColors(createThemeColors(null, systemColorScheme === 'dark'))
      }
    } catch (error) {
      console.error('Error loading branding:', error)
      // Fallback to default colors
      setBranding(null)
      setColors(createThemeColors(null, systemColorScheme === 'dark'))
    } finally {
      setLoading(false)
    }
  }

  // Refresh branding (called from settings or pull-to-refresh)
  const refreshBranding = async () => {
    if (profile?.organization_id) {
      await loadBranding(profile.organization_id)
    }
  }

  // Load branding when organization changes
  useEffect(() => {
    if (profile?.organization_id) {
      loadBranding(profile.organization_id)
    } else {
      setBranding(null)
      setColors(createThemeColors(null, systemColorScheme === 'dark'))
      setLoading(false)
    }
  }, [profile?.organization_id])

  // Update colors when system theme changes
  useEffect(() => {
    if (branding) {
      // Only update if theme mode is auto
      if (!branding.theme_mode || branding.theme_mode === 'auto') {
        const darkMode = systemColorScheme === 'dark'
        setIsDark(darkMode)
        setColors(createThemeColors(branding, darkMode))
      }
    } else {
      // No custom branding, follow system theme
      const darkMode = systemColorScheme === 'dark'
      setIsDark(darkMode)
      setColors(createThemeColors(null, darkMode))
    }
  }, [systemColorScheme, branding])

  // Set up real-time subscription for branding changes
  useEffect(() => {
    if (!profile?.organization_id) return

    const channel = supabase
      .channel(`mobile-branding-${profile.organization_id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'organization_branding',
          filter: `organization_id=eq.${profile.organization_id}`
        },
        (payload) => {
          console.log('Mobile app: Branding updated:', payload)
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            const updatedBranding = payload.new as BrandingConfig
            setBranding(updatedBranding)
            
            // Determine theme mode
            let darkMode = systemColorScheme === 'dark'
            if (updatedBranding.theme_mode === 'light') {
              darkMode = false
            } else if (updatedBranding.theme_mode === 'dark') {
              darkMode = true
            }
            
            setIsDark(darkMode)
            setColors(createThemeColors(updatedBranding, darkMode))
          } else if (payload.eventType === 'DELETE') {
            setBranding(null)
            const darkMode = systemColorScheme === 'dark'
            setIsDark(darkMode)
            setColors(createThemeColors(null, darkMode))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [profile?.organization_id, systemColorScheme])

  const value: ThemeContextType = {
    colors,
    branding,
    isDark,
    loading,
    refreshBranding
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

// Export commonly used theme objects for styling
export const createThemedStyles = (colors: ThemeColors) => ({
  container: {
    backgroundColor: colors.background,
  },
  surface: {
    backgroundColor: colors.surface,
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  secondaryButton: {
    backgroundColor: colors.secondary,
  },
  accentButton: {
    backgroundColor: colors.accent,
  },
  textPrimary: {
    color: colors.text.primary,
  },
  textSecondary: {
    color: colors.text.secondary,
  },
  textMuted: {
    color: colors.text.muted,
  },
  successText: {
    color: colors.status.success,
  },
  warningText: {
    color: colors.status.warning,
  },
  errorText: {
    color: colors.status.error,
  },
  infoText: {
    color: colors.status.info,
  },
  border: {
    borderColor: colors.border,
  },
  shadow: {
    shadowColor: colors.shadow,
  }
})

export default ThemeProvider
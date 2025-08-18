'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

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

interface ThemeContextType {
  branding: BrandingConfig | null
  loading: boolean
  applyBranding: (branding: BrandingConfig) => void
  resetBranding: () => void
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
  children: React.ReactNode
  organizationId?: string
}

export function ThemeProvider({ children, organizationId }: ThemeProviderProps) {
  const [branding, setBranding] = useState<BrandingConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  // Apply branding colors to CSS custom properties
  const applyBrandingToCSS = (brandingConfig: BrandingConfig) => {
    const root = document.documentElement
    
    // Apply brand colors
    root.style.setProperty('--color-primary', brandingConfig.primary_color)
    root.style.setProperty('--color-secondary', brandingConfig.secondary_color)
    root.style.setProperty('--color-accent', brandingConfig.accent_color)
    root.style.setProperty('--color-background-light', brandingConfig.background_light)
    root.style.setProperty('--color-background-dark', brandingConfig.background_dark)
    root.style.setProperty('--color-surface', brandingConfig.surface_color)
    root.style.setProperty('--color-text-primary', brandingConfig.text_primary)
    root.style.setProperty('--color-text-secondary', brandingConfig.text_secondary)
    root.style.setProperty('--color-text-muted', brandingConfig.text_muted)
    root.style.setProperty('--color-success', brandingConfig.success_color)
    root.style.setProperty('--color-warning', brandingConfig.warning_color)
    root.style.setProperty('--color-error', brandingConfig.error_color)
    root.style.setProperty('--color-info', brandingConfig.info_color)

    // Update Tailwind CSS variables to match brand colors
    // Convert hex to RGB for Tailwind compatibility
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
      if (result) {
        return `${parseInt(result[1], 16)} ${parseInt(result[2], 16)} ${parseInt(result[3], 16)}`
      }
      return '59 130 246' // fallback
    }

    // Update primary colors to match brand
    root.style.setProperty('--primary', hexToRgb(brandingConfig.primary_color))
    root.style.setProperty('--ring', hexToRgb(brandingConfig.primary_color))
    root.style.setProperty('--accent', hexToRgb(brandingConfig.accent_color))
    root.style.setProperty('--success', hexToRgb(brandingConfig.success_color))
    root.style.setProperty('--warning', hexToRgb(brandingConfig.warning_color))
    root.style.setProperty('--error', hexToRgb(brandingConfig.error_color))

    // Update favicon if provided
    if (brandingConfig.favicon_url) {
      const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement
      if (favicon) {
        favicon.href = brandingConfig.favicon_url
      }
    }

    // Update font family if provided
    if (brandingConfig.font_family) {
      root.style.setProperty('--font-family', brandingConfig.font_family)
      document.body.style.fontFamily = `${brandingConfig.font_family}, var(--font-geist-sans), system-ui, sans-serif`
    }

    // Update border radius if provided
    if (brandingConfig.border_radius) {
      root.style.setProperty('--radius', `${brandingConfig.border_radius}px`)
    }
  }

  // Load organization branding
  const loadBranding = async (orgId: string) => {
    try {
      setLoading(true)
      
      // Temporarily skip branding fetch to fix 406 error
      console.log('🎨 Skipping branding fetch for org:', orgId)
      setBranding(null)
      setLoading(false)
      return
      
      const { data: brandingData, error } = await supabase
        .from('organization_branding')
        .select('*')
        .eq('organization_id', orgId)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading branding:', error)
        return
      }

      if (brandingData) {
        setBranding(brandingData)
        applyBrandingToCSS(brandingData)
      }
    } catch (error) {
      console.error('Error loading branding:', error)
    } finally {
      setLoading(false)
    }
  }

  // Apply branding (used by settings page)
  const applyBranding = (brandingConfig: BrandingConfig) => {
    setBranding(brandingConfig)
    applyBrandingToCSS(brandingConfig)
  }

  // Reset to default branding
  const resetBranding = () => {
    setBranding(null)
    const root = document.documentElement
    
    // Reset to default colors
    root.style.setProperty('--color-primary', '#3b82f6')
    root.style.setProperty('--color-secondary', '#1e40af')
    root.style.setProperty('--color-accent', '#06b6d4')
    root.style.setProperty('--color-background-light', '#ffffff')
    root.style.setProperty('--color-background-dark', '#f8fafc')
    root.style.setProperty('--color-surface', '#ffffff')
    root.style.setProperty('--color-text-primary', '#111827')
    root.style.setProperty('--color-text-secondary', '#6b7280')
    root.style.setProperty('--color-text-muted', '#9ca3af')
    root.style.setProperty('--color-success', '#10b981')
    root.style.setProperty('--color-warning', '#f59e0b')
    root.style.setProperty('--color-error', '#ef4444')
    root.style.setProperty('--color-info', '#3b82f6')
    
    // Reset Tailwind variables
    root.style.setProperty('--primary', '59 130 246')
    root.style.setProperty('--ring', '59 130 246')
    root.style.setProperty('--accent', '6 182 212')
    root.style.setProperty('--success', '16 185 129')
    root.style.setProperty('--warning', '245 158 11')
    root.style.setProperty('--error', '239 68 68')
  }

  // Load branding on organization change
  useEffect(() => {
    if (organizationId) {
      loadBranding(organizationId)
    } else {
      resetBranding()
      setLoading(false)
    }
  }, [organizationId])

  // Set up real-time subscription for branding changes
  useEffect(() => {
    if (!organizationId) return

    const channel = supabase
      .channel(`branding-${organizationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'organization_branding',
          filter: `organization_id=eq.${organizationId}`
        },
        (payload) => {
          console.log('Branding updated:', payload)
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            const updatedBranding = payload.new as BrandingConfig
            applyBranding(updatedBranding)
          } else if (payload.eventType === 'DELETE') {
            resetBranding()
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [organizationId])

  const value: ThemeContextType = {
    branding,
    loading,
    applyBranding,
    resetBranding
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export default ThemeProvider
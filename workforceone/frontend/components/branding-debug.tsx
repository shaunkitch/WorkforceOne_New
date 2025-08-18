'use client'

import { useEffect, useState } from 'react'

export default function BrandingDebug() {
  const [cssVars, setCssVars] = useState<Record<string, string>>({})
  
  useEffect(() => {
    const updateCssVars = () => {
      const root = document.documentElement
      const vars = {
        'color-primary': getComputedStyle(root).getPropertyValue('--color-primary'),
        'color-secondary': getComputedStyle(root).getPropertyValue('--color-secondary'),
        'color-accent': getComputedStyle(root).getPropertyValue('--color-accent'),
        'primary (tailwind)': getComputedStyle(root).getPropertyValue('--primary'),
      }
      setCssVars(vars)
    }
    
    updateCssVars()
    
    // Watch for changes
    const observer = new MutationObserver(updateCssVars)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['style']
    })
    
    return () => observer.disconnect()
  }, [])
  
  return (
    <div className="fixed bottom-4 right-4 bg-white border rounded-lg shadow-lg p-4 max-w-xs text-xs z-50">
      <h4 className="font-semibold mb-2">CSS Variables Debug</h4>
      {Object.entries(cssVars).map(([key, value]) => (
        <div key={key} className="flex justify-between">
          <span>--{key}:</span>
          <span className="ml-2 font-mono">{value || 'not set'}</span>
        </div>
      ))}
      <div className="mt-2 pt-2 border-t">
        <div className="w-full h-4 bg-brand-primary rounded mb-1"></div>
        <div className="text-center">Test bg-brand-primary</div>
      </div>
    </div>
  )
}
'use client'

import { useFeatureFlags } from '@/components/feature-flags-provider'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export function DebugFeatureFlags() {
  const { featureFlags, isLoading, refreshFeatureFlags } = useFeatureFlags()
  const [rawData, setRawData] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    const fetchRawData = async () => {
      try {
        const { data: user } = await supabase.auth.getUser()
        if (!user.user) return

        // Get raw organization and user data
        const { data: profile } = await supabase
          .from('profiles')
          .select(`
            id,
            full_name,
            email,
            feature_flags,
            organization_id,
            organizations (
              name,
              feature_flags
            )
          `)
          .eq('id', user.user.id)
          .single()

        // Get effective features from database function
        const { data: effectiveFeatures } = await supabase
          .rpc('get_user_effective_features', { user_id: user.user.id })

        setRawData({
          profile,
          effectiveFeatures,
          currentUser: user.user.id
        })
      } catch (error) {
        console.error('Debug fetch error:', error)
      }
    }

    fetchRawData()
  }, [supabase])

  if (process.env.NODE_ENV !== 'development') return null

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded-lg max-w-md text-xs z-50">
      <div className="font-bold mb-2 flex justify-between items-center">
        🐛 Feature Flags Debug
        <button 
          onClick={refreshFeatureFlags}
          className="bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-xs"
        >
          Refresh
        </button>
      </div>
      
      <div className="mb-2">
        <strong>Hook Loading:</strong> {isLoading ? 'Yes' : 'No'}
      </div>
      
      <div className="mb-2">
        <strong>Hook Features:</strong>
        <pre className="text-xs overflow-auto max-h-20">
          {JSON.stringify(featureFlags, null, 2)}
        </pre>
      </div>

      {rawData && (
        <>
          <div className="mb-2">
            <strong>User:</strong> {rawData.profile?.full_name} ({rawData.currentUser})
          </div>
          
          <div className="mb-2">
            <strong>Org Features:</strong>
            <pre className="text-xs overflow-auto max-h-20">
              {JSON.stringify(rawData.profile?.organizations?.feature_flags, null, 2)}
            </pre>
          </div>
          
          <div className="mb-2">
            <strong>User Overrides:</strong>
            <pre className="text-xs overflow-auto max-h-20">
              {JSON.stringify(rawData.profile?.feature_flags, null, 2)}
            </pre>
          </div>
          
          <div className="mb-2">
            <strong>DB Effective Features:</strong>
            <pre className="text-xs overflow-auto max-h-20">
              {JSON.stringify(rawData.effectiveFeatures, null, 2)}
            </pre>
          </div>
        </>
      )}
    </div>
  )
}
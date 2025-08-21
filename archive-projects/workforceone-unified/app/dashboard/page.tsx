'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getUserProducts, getUser } from '@/lib/supabase'
import AdaptiveDashboard from '@/components/AdaptiveDashboard'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle } from 'lucide-react'

export default function DashboardPage() {
  const [userProducts, setUserProducts] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    checkAuthAndLoadProducts()
  }, [])

  const checkAuthAndLoadProducts = async () => {
    try {
      const { user } = await getUser()
      if (!user) {
        router.push('/')
        return
      }

      const products = await getUserProducts()
      if (products.length === 0) {
        setError('No product access found. Please contact your administrator or use an invitation code.')
        setLoading(false)
        return
      }

      setUserProducts(products)
    } catch (err) {
      setError('Failed to load user data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your workspace...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
          <div className="mt-4 text-center">
            <button
              onClick={() => router.push('/')}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              Return to Sign In
            </button>
          </div>
        </div>
      </div>
    )
  }

  return <AdaptiveDashboard userProducts={userProducts} />
}
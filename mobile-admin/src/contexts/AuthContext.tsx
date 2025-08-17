import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { auth } from '../lib/supabase'
import { authStorage } from '../lib/storage'

interface AuthContextType {
  isAuthenticated: boolean
  isLoading: boolean
  email: string | null
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signOut: () => Promise<void>
  checkAuthStatus: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [email, setEmail] = useState<string | null>(null)

  const checkAuthStatus = async () => {
    try {
      setIsLoading(true)
      const session = await authStorage.getSession()
      
      if (session.token && session.email) {
        const isValid = auth.validateToken(session.token)
        if (isValid) {
          setIsAuthenticated(true)
          setEmail(session.email)
        } else {
          await authStorage.clearSession()
          setIsAuthenticated(false)
          setEmail(null)
        }
      } else {
        setIsAuthenticated(false)
        setEmail(null)
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      setIsAuthenticated(false)
      setEmail(null)
    } finally {
      setIsLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      const result = await auth.signIn(email, password)
      
      if (result.success && result.token) {
        await authStorage.saveSession(result.token, email)
        setIsAuthenticated(true)
        setEmail(email)
        return { success: true }
      } else {
        return { success: false, error: result.error || 'Authentication failed' }
      }
    } catch (error) {
      return { success: false, error: 'Network error occurred' }
    }
  }

  const signOut = async () => {
    try {
      await authStorage.clearSession()
      await auth.signOut()
      setIsAuthenticated(false)
      setEmail(null)
    } catch (error) {
      console.error('Sign out failed:', error)
    }
  }

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const value: AuthContextType = {
    isAuthenticated,
    isLoading,
    email,
    signIn,
    signOut,
    checkAuthStatus,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
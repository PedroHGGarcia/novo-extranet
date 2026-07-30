import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import pb from '@/lib/pocketbase/client'
import { logAudit } from '@/services/audit'

interface AuthContextType {
  user: any
  isAuthenticated: boolean
  signUp: (email: string, password: string, name: string) => Promise<{ error: any }>
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => void
  loading: boolean
  refreshUser: () => Promise<void>
  updateUser: (record: any) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any>(pb.authStore.isValid ? pb.authStore.record : null)
  const [isAuthenticated, setIsAuthenticated] = useState(pb.authStore.isValid)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = pb.authStore.onChange((_token, record) => {
      setUser(pb.authStore.isValid ? record : null)
      setIsAuthenticated(pb.authStore.isValid)
    })

    if (pb.authStore.record) {
      pb.collection('users')
        .authRefresh()
        .catch((err: any) => {
          if (err?.status === 401) {
            pb.authStore.clear()
          }
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
    return () => {
      unsubscribe()
    }
  }, [])

  const signUp = async (email: string, password: string, name: string) => {
    try {
      await pb.collection('users').create({ email, password, passwordConfirm: password, name })
      await pb.collection('users').authWithPassword(email, password)
      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      await pb.collection('users').authWithPassword(email, password)
      await logAudit({
        userId: pb.authStore.record?.id || '',
        action: 'login',
        table: 'users',
        recordId: pb.authStore.record?.id || '',
        data: { email, timestamp: new Date().toISOString() },
      })
      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  const signOut = () => {
    const userId = pb.authStore.record?.id || ''
    if (userId) {
      logAudit({
        userId,
        action: 'logout',
        table: 'users',
        recordId: userId,
        data: { timestamp: new Date().toISOString() },
      }).catch(() => {})
    }
    pb.authStore.clear()
  }

  const refreshUser = async () => {
    if (!pb.authStore.record) return
    try {
      const refreshedRecord = await pb.collection('users').getOne(pb.authStore.record.id)
      setUser(refreshedRecord)
    } catch (err: any) {
      if (err?.status === 401) {
        pb.authStore.clear()
      }
    }
  }

  const updateUser = (record: any) => {
    setUser(record)
  }

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated, signUp, signIn, signOut, loading, refreshUser, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  )
}

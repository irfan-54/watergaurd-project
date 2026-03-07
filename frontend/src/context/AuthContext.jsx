import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [role, setRole] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
  const fetchUserRole = async (userId) => {
    const { data, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .limit(1)

    const userData = data?.[0]
    setRole(userData?.role || 'citizen')
  }

  const getInitialSession = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    setUser(session?.user ?? null)

    if (session?.user) {
      await fetchUserRole(session.user.id)
    }

    setLoading(false)
  }

  getInitialSession()

  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (event, session) => {
      setUser(session?.user ?? null)

      if (event === 'SIGNED_IN' && session?.user) {
        fetchUserRole(session.user.id)
      }

      if (event === 'SIGNED_OUT') {
        setRole(null)
      }

      if (event === 'TOKEN_REFRESHED' && !session) {
        supabase.auth.signOut()
      }
    }
  )

  return () => subscription.unsubscribe()
}, [])

  const value = {
    user,
    role,
    loading
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

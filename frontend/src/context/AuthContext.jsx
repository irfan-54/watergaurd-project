import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [role, setRole] = useState(null)
  const [department, setDepartment] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const profileFetched = useRef(false)
  const navigate = useNavigate()
  const location = useLocation()

  const fetchUserProfile = useCallback(async (userId, userEmail) => {
    try {
      console.log("User:", userId)
      const { data, error } = await supabase
        .from('profiles')
        .select('role, department')
        .eq('id', userId)
        .single()

      console.log("Profile:", data)

      if (error) {
        console.warn('Profile fetch error:', error)
        // Create profile if not found
        if (error.code === 'PGRST116') {  // Row not found error
          try {
            const { data: newProfile, error: insertError } = await supabase
              .from('profiles')
              .insert({ 
                id: userId, 
                email: userEmail || null,
                role: 'citizen', 
                department: null 
              })
              .select()
              .single()
            
            if (insertError) {
              console.error('Profile creation failed:', insertError)
              setRole('citizen') // Fallback to citizen
              setDepartment(null)
              setProfile(null)
            } else {
              console.log('New profile created:', newProfile)
              const role = newProfile.role.toLowerCase()
              setRole(role)
              setDepartment(newProfile.department)
              setProfile(newProfile)
            }
          } catch (createError) {
            console.error('Profile creation error:', createError)
            setRole('citizen') // Fallback to citizen
            setDepartment(null)
            setProfile(null)
          }
        } else {
          console.error('Other profile error:', error)
          setRole('citizen') // Fallback to citizen
          setDepartment(null)
          setProfile(null)
        }
      } else {
        console.log('Profile fetched successfully:', data)
        const role = (data?.role ?? 'citizen').toLowerCase()  // Normalize to lowercase
        setRole(role)
        setDepartment(data?.department ?? null)
        setProfile(data)
      }
    } catch (fetchError) {
      console.error('Unexpected profile fetch error:', fetchError)
      setRole('citizen') // Fallback to citizen
      setDepartment(null)
      setProfile(null)
    }
  }, [])

  useEffect(() => {
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      if (session?.user && !profileFetched.current) {
        profileFetched.current = true
        try {
          await fetchUserProfile(session.user.id, session.user.email)
        } catch (error) {
          console.error('Initial profile fetch failed:', error)
          // Reset flag to allow retry on next attempt
          profileFetched.current = false
        }
      }
      setLoading(false)
    }
    getInitialSession()
  }, [])

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null)
        if (event === 'SIGNED_IN' && session?.user && !profileFetched.current) {
          profileFetched.current = true
          try {
            fetchUserProfile(session.user.id, session.user.email)
          } catch (error) {
            console.error('Sign-in profile fetch failed:', error)
            // Reset flag to allow retry on next attempt
            profileFetched.current = false
          }
        }
        if (event === 'SIGNED_OUT') {
          profileFetched.current = false
          setRole(null)
          setDepartment(null)
          setProfile(null)
        }
        if (event === 'TOKEN_REFRESHED' && !session) {
          supabase.auth.signOut()
        }
      }
    )
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!user || !profile) return

    // Only redirect if user is on login page
    if (location.pathname !== '/login') return

    const role = profile.role?.toLowerCase()

    if (role === 'admin') navigate('/admin')
    else if (role === 'department') navigate('/department')
    else navigate('/citizen')

  }, [user, profile, location.pathname, navigate])

  return (
    <AuthContext.Provider value={{ user, role, department, loading }}>
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
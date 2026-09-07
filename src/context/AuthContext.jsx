import { createContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { getProfile } from '../services/authService'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session?.user) {
      setProfile(null)
      return
    }
    getProfile(session.user.id)
      .then(setProfile)
      .catch(() => setProfile(null))
  }, [session])

  const value = { session, user: session?.user ?? null, profile, loading }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

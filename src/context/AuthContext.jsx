import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react'
import { supabase } from '../supabaseClient'

const AuthContext = createContext()
export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = useCallback(async (id) => {
    try {
      const { data } = await supabase.from('profiles').select('*').eq('id', id).single()
      setProfile(data ?? null)
    } catch (error) {
      console.error('Error fetching profile:', error)
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      setUser(data.session?.user ?? null)
      if (data.session?.user) {
        fetchProfile(data.session.user.id)
      } else {
        setLoading(false)
      }
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return
      setUser(session?.user ?? null)
      if (session?.user) {
        setLoading(true)
        fetchProfile(session.user.id)
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => {
      mounted = false
      listener.subscription.unsubscribe()
    }
  }, [fetchProfile])

  const value = useMemo(() => ({
    user,
    profile,
    loading,
    fetchProfile,
    supabase
  }), [user, profile, loading, fetchProfile])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

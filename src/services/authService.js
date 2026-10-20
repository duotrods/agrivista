import { supabase } from '../lib/supabase'

export async function signUp({ email, password, fullName, purok, role = 'farmer' }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, purok, role },
      // Confirmation links return to whichever site the user signed up on.
      emailRedirectTo: window.location.origin,
    },
  })
  if (error) throw error
  return data
}

export async function signIn({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  if (error) throw error
  return data
}

export async function requestPasswordReset(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  })
  if (error) throw error
}

export async function updatePassword(password) {
  const { error } = await supabase.auth.updateUser({ password })
  if (error) throw error
}

export async function updateProfile(userId, { fullName, purok }) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ full_name: fullName, purok: purok || null })
    .eq('id', userId)
    .select()
    .single()
  if (error) throw error
  return data
}

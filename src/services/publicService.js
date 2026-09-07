import { supabase } from '../lib/supabase'

export async function getPublicFieldStats() {
  const { data, error } = await supabase.rpc('get_public_field_stats')
  if (error) throw error
  return data
}

import { supabase } from '../lib/supabase'

export async function logActivity({ userId, action, resourceType, resourceId, details }) {
  const { error } = await supabase
    .from('activity_logs')
    .insert({ user_id: userId, action, resource_type: resourceType, resource_id: resourceId, details })
  if (error) console.error('Failed to log activity:', error.message)
}

export async function listActivityLogs() {
  const { data, error } = await supabase
    .from('activity_logs')
    .select('*, actor:profiles(full_name)')
    .order('created_at', { ascending: false })
    .limit(100)
  if (error) throw error
  return data
}

export async function listFarmerProfiles() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'farmer')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function listLGUAccountsForApproval() {
  const { data, error } = await supabase.rpc('admin_list_lgu_accounts')
  if (error) throw error
  return data
}

export async function toggleProfileActive(userId, isActive) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ is_active: isActive })
    .eq('id', userId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function listSettings() {
  const { data, error } = await supabase.from('system_settings').select('*').order('key')
  if (error) throw error
  return data
}

export async function updateSetting(id, value, updatedBy) {
  const { data, error } = await supabase
    .from('system_settings')
    .update({ value, updated_by: updatedBy, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

import { supabase } from '../lib/supabase'

export async function listAnnouncements() {
  const { data, error } = await supabase
    .from('announcements')
    .select('*, author:profiles!created_by(full_name)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function createAnnouncement({ title, message, targetPurok, createdBy }) {
  const { data: announcement, error } = await supabase
    .from('announcements')
    .insert({ title, message, target_purok: targetPurok || null, created_by: createdBy })
    .select()
    .single()
  if (error) throw error

  let farmerQuery = supabase.from('profiles').select('id').eq('role', 'farmer').eq('is_active', true)
  if (targetPurok) farmerQuery = farmerQuery.eq('purok', targetPurok)
  const { data: farmers, error: farmersError } = await farmerQuery
  if (farmersError) throw farmersError

  if (farmers.length > 0) {
    const notifications = farmers.map((f) => ({
      user_id: f.id,
      title,
      message,
      type: 'info',
    }))
    const { error: notifyError } = await supabase.from('notifications').insert(notifications)
    if (notifyError) throw notifyError
  }

  return { announcement, recipientCount: farmers.length }
}

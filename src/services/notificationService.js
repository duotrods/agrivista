import { supabase } from '../lib/supabase'

export async function listNotifications(userId, limit = 20) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data
}

export async function createNotification({ userId, title, message, type = 'info', link }) {
  const { error } = await supabase
    .from('notifications')
    .insert({ user_id: userId, title, message, type, link })
  if (error) throw error
}

export async function markAsRead(notificationId) {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
  if (error) throw error
}

export async function markAllAsRead(userId) {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false)
  if (error) throw error
}

export async function createHarvestReminders() {
  const { error } = await supabase.rpc('create_harvest_reminders')
  if (error) throw error
}

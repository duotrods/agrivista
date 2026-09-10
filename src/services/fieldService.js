import { supabase } from '../lib/supabase'
import { logActivity } from './adminService'

export async function listFieldsForFarmer(farmerId) {
  const { data, error } = await supabase
    .from('rice_fields')
    .select('*')
    .eq('farmer_id', farmerId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getField(fieldId) {
  const { data, error } = await supabase
    .from('rice_fields')
    .select('*')
    .eq('id', fieldId)
    .single()
  if (error) throw error
  return data
}

export async function createField({ farmerId, fieldName, latitude, longitude, purok }) {
  const { data, error } = await supabase
    .from('rice_fields')
    .insert({ farmer_id: farmerId, field_name: fieldName, latitude, longitude, purok })
    .select()
    .single()
  if (error) throw error
  logActivity({ userId: farmerId, action: 'created_field', resourceType: 'field', resourceId: data.id })
  return data
}

export async function updateFieldDetails(fieldId, updates) {
  const { data, error } = await supabase
    .from('rice_fields')
    .update(updates)
    .eq('id', fieldId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteField(fieldId, deletedBy) {
  const { error } = await supabase.from('rice_fields').delete().eq('id', fieldId)
  if (error) throw error
  logActivity({ userId: deletedBy, action: 'deleted_field', resourceType: 'field', resourceId: fieldId })
}

export async function updateFieldBoundary(fieldId, { polygonCoords, areaHectares }) {
  const { data, error } = await supabase
    .from('rice_fields')
    .update({ polygon_coords: polygonCoords, area_hectares: areaHectares })
    .eq('id', fieldId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateFieldStatus({ fieldId, changedBy, oldStatus, newStatus, remarks }) {
  const { error: updateError } = await supabase
    .from('rice_fields')
    .update({ field_status: newStatus })
    .eq('id', fieldId)
  if (updateError) throw updateError

  const { data, error } = await supabase
    .from('field_status_logs')
    .insert({ field_id: fieldId, changed_by: changedBy, old_status: oldStatus, new_status: newStatus, remarks })
    .select()
    .single()
  if (error) throw error
  logActivity({
    userId: changedBy,
    action: 'changed_field_status',
    resourceType: 'field',
    resourceId: fieldId,
    details: { oldStatus, newStatus },
  })
  return data
}

export async function listStatusLogs(fieldId) {
  const { data, error } = await supabase
    .from('field_status_logs')
    .select('*')
    .eq('field_id', fieldId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function listAllFields() {
  const { data, error } = await supabase
    .from('rice_fields')
    .select('*, farmer:profiles!farmer_id(full_name, purok)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function verifyField({ fieldId, verifiedBy }) {
  const { data, error } = await supabase
    .from('rice_fields')
    .update({ is_verified: true, verified_by: verifiedBy, verified_at: new Date().toISOString() })
    .eq('id', fieldId)
    .select()
    .single()
  if (error) throw error
  logActivity({ userId: verifiedBy, action: 'verified_field', resourceType: 'field', resourceId: fieldId })
  return data
}

import { supabase } from '../lib/supabase'
import { logActivity } from './adminService'

export async function uploadFieldMedia({ fieldId, file, mediaType, caption, uploadedBy, fieldCondition }) {
  const ext = file.name.split('.').pop()
  const path = `${fieldId}/${crypto.randomUUID()}.${ext}`

  const { error: uploadError } = await supabase.storage.from('media').upload(path, file)
  if (uploadError) throw uploadError

  const { data: publicUrlData } = supabase.storage.from('media').getPublicUrl(path)

  const { data, error } = await supabase
    .from('field_media')
    .insert({
      field_id: fieldId,
      file_url: publicUrlData.publicUrl,
      media_type: mediaType,
      caption: caption || null,
      uploaded_by: uploadedBy,
      field_condition: fieldCondition || null,
    })
    .select()
    .single()
  if (error) throw error
  logActivity({
    userId: uploadedBy,
    action: 'uploaded_media',
    resourceType: 'field_media',
    resourceId: data.id,
    details: { mediaType },
  })
  return data
}

export async function listMediaForField(fieldId) {
  const { data, error } = await supabase
    .from('field_media')
    .select('*')
    .eq('field_id', fieldId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

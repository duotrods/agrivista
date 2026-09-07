import { supabase } from '../lib/supabase'

export async function listNotesForField(fieldId) {
  const { data, error } = await supabase
    .from('field_notes')
    .select('*')
    .eq('field_id', fieldId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function createNote({ fieldId, authorId, content, isPrivate }) {
  const { data, error } = await supabase
    .from('field_notes')
    .insert({ field_id: fieldId, author_id: authorId, content, is_private: isPrivate })
    .select()
    .single()
  if (error) throw error
  return data
}

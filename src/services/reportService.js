import { supabase } from '../lib/supabase'

export async function listReportsForField(fieldId) {
  const { data, error } = await supabase
    .from('field_reports')
    .select('*')
    .eq('field_id', fieldId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function submitReport({ fieldId, submittedBy, summary }) {
  const { data, error } = await supabase
    .from('field_reports')
    .insert({ field_id: fieldId, submitted_by: submittedBy, summary })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function listAllReports() {
  const { data, error } = await supabase
    .from('field_reports')
    .select('*, field:rice_fields(field_name, purok), submitter:profiles!submitted_by(full_name)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function markReportReviewed(reportId, reviewedBy) {
  const { data, error } = await supabase
    .from('field_reports')
    .update({ status: 'reviewed', reviewed_by: reviewedBy, reviewed_at: new Date().toISOString() })
    .eq('id', reportId)
    .select()
    .single()
  if (error) throw error
  return data
}

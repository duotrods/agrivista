import { supabase } from '../lib/supabase'
import { logActivity } from './adminService'

export async function listReportsForField(fieldId) {
  const { data, error } = await supabase
    .from('field_reports')
    .select('*')
    .eq('field_id', fieldId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function listReportsForFarmer() {
  const { data, error } = await supabase
    .from('field_reports')
    .select('*, field:rice_fields(field_name)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

async function uploadReportPhoto(fieldId, file) {
  const ext = file.name.split('.').pop()
  const path = `reports/${fieldId}/${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage.from('media').upload(path, file)
  if (error) throw error
  return supabase.storage.from('media').getPublicUrl(path).data.publicUrl
}

export async function submitReport({ fieldId, submittedBy, summary, reportDate, cropStatus, fieldCondition, harvestInfo, photoFile }) {
  const photoUrl = photoFile ? await uploadReportPhoto(fieldId, photoFile) : null
  const { data, error } = await supabase
    .from('field_reports')
    .insert({
      field_id: fieldId,
      submitted_by: submittedBy,
      summary,
      report_date: reportDate || null,
      crop_status: cropStatus || null,
      field_condition: fieldCondition || null,
      harvest_info: harvestInfo?.trim() || null,
      photo_url: photoUrl,
    })
    .select('*, field:rice_fields(field_name)')
    .single()
  if (error) throw error
  logActivity({ userId: submittedBy, action: 'submitted_report', resourceType: 'field_report', resourceId: data.id })
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

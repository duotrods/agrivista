import { supabase } from '../lib/supabase'

export async function listCyclesForField(fieldId) {
  const { data, error } = await supabase
    .from('crop_cycles')
    .select('*')
    .eq('field_id', fieldId)
    .order('planting_date', { ascending: false })
  if (error) throw error
  return data
}

export async function createCycle({ fieldId, season, year, cropVariety, plantingDate }) {
  const { data, error } = await supabase
    .from('crop_cycles')
    .insert({
      field_id: fieldId,
      season,
      year,
      crop_variety: cropVariety || null,
      planting_date: plantingDate,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function completeCycle(cycleId, { harvestDate, yieldKg, status }) {
  const { data, error } = await supabase
    .from('crop_cycles')
    .update({ harvest_date: harvestDate, yield_kg: yieldKg, status })
    .eq('id', cycleId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function listObservations(cycleId) {
  const { data, error } = await supabase
    .from('crop_observations')
    .select('*')
    .eq('cycle_id', cycleId)
    .order('observation_date', { ascending: false })
  if (error) throw error
  return data
}

async function uploadObservationPhoto(cycleId, file) {
  const ext = file.name.split('.').pop()
  const path = `observations/${cycleId}/${crypto.randomUUID()}.${ext}`
  const { error: uploadError } = await supabase.storage.from('media').upload(path, file)
  if (uploadError) throw uploadError
  const { data } = supabase.storage.from('media').getPublicUrl(path)
  return data.publicUrl
}

export async function createObservation({
  cycleId,
  observedBy,
  observationDate,
  growthStage,
  healthStatus,
  pestType,
  remarks,
  photoFile,
}) {
  const photoUrl = photoFile ? await uploadObservationPhoto(cycleId, photoFile) : null

  const { data, error } = await supabase
    .from('crop_observations')
    .insert({
      cycle_id: cycleId,
      observed_by: observedBy,
      observation_date: observationDate,
      growth_stage: growthStage,
      health_status: healthStatus,
      pest_type: pestType || null,
      remarks: remarks || null,
      photo_url: photoUrl,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

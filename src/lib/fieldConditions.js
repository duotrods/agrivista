export const CONDITIONS = [
  ['healthy', 'Healthy', '#4caf50'],
  ['pest_affected', 'Pest affected', '#f59e0b'],
  ['diseased', 'Diseased', '#dc2626'],
  ['drought_stressed', 'Drought stressed', '#b45309'],
]

// Latest reported condition per field, counted by condition.
export function conditionCounts(reports) {
  const latest = new Map()
  for (const r of reports) {
    if (!r.field_condition) continue
    const at = new Date(r.report_date ?? r.created_at).getTime()
    const seen = latest.get(r.field_id)
    if (!seen || at > seen.at) latest.set(r.field_id, { at, condition: r.field_condition })
  }
  return CONDITIONS.map(([value, label, color]) => ({
    label,
    color,
    value: [...latest.values()].filter((l) => l.condition === value).length,
  }))
}

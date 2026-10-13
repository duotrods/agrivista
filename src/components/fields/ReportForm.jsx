import { useState } from 'react'
import { Select } from '../common/Select'
import { FIELD_STATUSES, FIELD_STATUS_LABELS, HEALTH_STATUSES } from '../../lib/constants'
import { useAuth } from '../../hooks/useAuth'
import { submitReport } from '../../services/reportService'

const label = (value) => value.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase())
const today = () => new Date().toISOString().slice(0, 10)

// Monitoring report form. Pass `fields` to let the farmer pick a field, or
// `fixedFieldId` when it lives on a field's own page.
export function ReportForm({ fields = [], fixedFieldId, onSubmitted }) {
  const { user } = useAuth()
  const [fieldId, setFieldId] = useState(fixedFieldId ?? fields[0]?.id ?? '')
  const [reportDate, setReportDate] = useState(today())
  const [cropStatus, setCropStatus] = useState('')
  const [fieldCondition, setFieldCondition] = useState('')
  const [summary, setSummary] = useState('')
  const [harvestInfo, setHarvestInfo] = useState('')
  const [photoFile, setPhotoFile] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const selectedField = fixedFieldId ?? fieldId

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const report = await submitReport({ fieldId: selectedField, submittedBy: user.id, summary, reportDate, cropStatus, fieldCondition, harvestInfo, photoFile })
      onSubmitted?.(report)
      setSummary('')
      setHarvestInfo('')
      setCropStatus('')
      setFieldCondition('')
      setPhotoFile(null)
      e.target.reset()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      {!fixedFieldId && (
        <Select aria-label="Field" value={fieldId} onChange={(e) => setFieldId(e.target.value)} required className="rounded border px-3 py-2 text-sm">
          <option value="" disabled>Select a field</option>
          {fields.map((f) => <option key={f.id} value={f.id}>{f.field_name}</option>)}
        </Select>
      )}
      <input type="date" aria-label="Report date" value={reportDate} max={today()} onChange={(e) => setReportDate(e.target.value)} required className="rounded border px-3 py-2 text-sm" />
      <Select aria-label="Crop status" value={cropStatus} onChange={(e) => setCropStatus(e.target.value)} className="rounded border px-3 py-2 text-sm">
        <option value="">Crop status (optional)</option>
        {FIELD_STATUSES.map((s) => <option key={s} value={s}>{FIELD_STATUS_LABELS[s]}</option>)}
      </Select>
      <Select aria-label="Field condition" value={fieldCondition} onChange={(e) => setFieldCondition(e.target.value)} className="rounded border px-3 py-2 text-sm">
        <option value="">Field condition (optional)</option>
        {HEALTH_STATUSES.map((h) => <option key={h} value={h}>{label(h)}</option>)}
      </Select>
      <textarea placeholder="Observation, e.g. growing well, no pests seen..." value={summary} onChange={(e) => setSummary(e.target.value)} required className="rounded border px-3 py-2 text-sm" />
      <input type="text" placeholder="Harvest information (optional)" value={harvestInfo} onChange={(e) => setHarvestInfo(e.target.value)} className="rounded border px-3 py-2 text-sm" />
      <label className="text-sm text-gray-600">Photo (optional)
        <input type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)} className="mt-1 block text-sm" />
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={submitting || !selectedField} className="w-fit rounded bg-green-700 px-3 py-1.5 text-sm text-white hover:bg-green-600 disabled:opacity-50">
        {submitting ? 'Submitting...' : 'Submit Report'}
      </button>
    </form>
  )
}

import { useState } from 'react'
import { PhotoPicker } from '../common/PhotoPicker'
import { Select } from '../common/Select'
import { FIELD_STATUSES, FIELD_STATUS_LABELS, HEALTH_STATUSES } from '../../lib/constants'
import { useAuth } from '../../hooks/useAuth'
import { updateFieldStatus } from '../../services/fieldService'
import { submitReport } from '../../services/reportService'

const label = (value) => value.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase())
const today = () => new Date().toISOString().slice(0, 10)
const Req = () => <span className="text-red-600"> *</span>

// Monitoring report form. Pass `fields` to let the farmer pick a field. `formId` and
// `hideSubmit` let a drawer put the submit button in its own footer.
export function ReportForm({ fields = [], initialFieldId, formId, hideSubmit = false, onBusyChange, onSubmitted }) {
  const { user } = useAuth()
  const [fieldId, setFieldId] = useState(initialFieldId ?? fields[0]?.id ?? '')
  const [reportDate, setReportDate] = useState(today())
  const [cropStatus, setCropStatus] = useState(() => fields.find((f) => f.id === (initialFieldId ?? fields[0]?.id))?.field_status ?? '')
  const [fieldCondition, setFieldCondition] = useState('')
  const [summary, setSummary] = useState('')
  const [harvestInfo, setHarvestInfo] = useState('')
  const [photoFile, setPhotoFile] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const selectedField = fields.find((f) => f.id === fieldId)

  function setBusy(value) {
    setSubmitting(value)
    onBusyChange?.(value)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const report = await submitReport({ fieldId, submittedBy: user.id, summary, reportDate, cropStatus, fieldCondition, harvestInfo, photoFile })
      // A different crop status in the report also moves the field to that stage.
      let statusError = null
      if (selectedField && cropStatus !== selectedField.field_status) {
        try {
          await updateFieldStatus({ fieldId, changedBy: user.id, oldStatus: selectedField.field_status, newStatus: cropStatus, remarks: summary })
        } catch (err) {
          statusError = err.message
        }
      }
      onSubmitted?.(report, { statusError })
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <form id={formId} onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="form-grid" style={{ marginBottom: 0 }}>
        <div className="form-field form-span">
          <span>Field<Req /></span>
          <Select aria-label="Field" value={fieldId} onChange={(e) => { setFieldId(e.target.value); setCropStatus(fields.find((f) => f.id === e.target.value)?.field_status ?? '') }} required className="rounded border px-3 py-2 text-sm">
            <option value="" disabled>Select a field</option>
            {fields.map((f) => <option key={f.id} value={f.id}>{f.field_name}</option>)}
          </Select>
        </div>
        <div className="form-field">
          <label htmlFor="report-date">Report date<Req /></label>
          <input id="report-date" type="date" value={reportDate} max={today()} onChange={(e) => setReportDate(e.target.value)} required className="rounded border px-3 py-2 text-sm" />
        </div>
        <div className="form-field">
          <span>Crop status<Req /></span>
          <Select aria-label="Crop status" value={cropStatus} onChange={(e) => setCropStatus(e.target.value)} required className="rounded border px-3 py-2 text-sm">
            <option value="" disabled>Select crop status</option>
            {FIELD_STATUSES.map((s) => <option key={s} value={s}>{FIELD_STATUS_LABELS[s]}</option>)}
          </Select>
          {selectedField && cropStatus && cropStatus !== selectedField.field_status && (
            <span className="form-hint">This also updates the field to {FIELD_STATUS_LABELS[cropStatus]} and sends it back to LGU review.</span>
          )}
        </div>
        <div className="form-field form-span">
          <span>Field condition<Req /></span>
          <Select aria-label="Field condition" value={fieldCondition} onChange={(e) => setFieldCondition(e.target.value)} required className="rounded border px-3 py-2 text-sm">
            <option value="" disabled>Select field condition</option>
            {HEALTH_STATUSES.map((h) => <option key={h} value={h}>{label(h)}</option>)}
          </Select>
        </div>
      </div>
      <div className="form-field">
        <label htmlFor="report-observation">Observation<Req /></label>
        <textarea id="report-observation" placeholder="e.g. growing well, no pests seen..." value={summary} onChange={(e) => setSummary(e.target.value)} required className="rounded border px-3 py-2 text-sm" />
      </div>
      <div className="form-field">
        <label htmlFor="report-harvest">Harvest information <span className="form-hint">(optional)</span></label>
        <input id="report-harvest" type="text" placeholder="e.g. expected yield or harvest date" value={harvestInfo} onChange={(e) => setHarvestInfo(e.target.value)} className="rounded border px-3 py-2 text-sm" />
      </div>
      <div className="form-field">
        <span>Photo <span className="form-hint">(optional)</span></span>
        <PhotoPicker id="report-photo" file={photoFile} onChange={setPhotoFile} />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {!hideSubmit && (
        <button type="submit" disabled={submitting || !fieldId} className="btn-primary w-fit disabled:opacity-50">
          {submitting ? 'Submitting...' : 'Submit Report'}
        </button>
      )}
    </form>
  )
}

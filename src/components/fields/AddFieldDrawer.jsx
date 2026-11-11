import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Drawer } from '../common/Drawer'
import { Select } from '../common/Select'
import { FieldDetailsInputs } from './FieldDetailsInputs'
import { useAuth } from '../../hooks/useAuth'
import { useGeolocation } from '../../hooks/useGeolocation'
import { FIELD_STATUSES, FIELD_STATUS_LABELS, PUROKS } from '../../lib/constants'
import { createField } from '../../services/fieldService'

const FORM_ID = 'add-field-form'

// Add Field as a right-hand panel. It is mounted only while open, so closing it resets the form.
export function AddFieldDrawer({ onClose }) {
  const { user, profile } = useAuth()
  const { position, error: geoError, loading: locating, locate } = useGeolocation()
  const [fieldName, setFieldName] = useState('')
  const [purok, setPurok] = useState(null)
  const [details, setDetails] = useState({
    owner_name: '',
    maintainer_name: '',
    area_hectares: '',
    planting_date: '',
    expected_harvest: '',
    seed_type: '',
    crop_variety: '',
    soil_type: '',
    irrigation_type: '',
  })
  const [cropStatus, setCropStatus] = useState('fallow')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    if (!position) {
      setError('Use "Use My Location" to set the field GPS position first.')
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      const field = await createField({
        farmerId: user.id,
        fieldName,
        latitude: position.latitude,
        longitude: position.longitude,
        purok: purok ?? profile?.purok ?? null,
        ownerName: details.owner_name,
        maintainerName: details.maintainer_name,
        areaHectares: details.area_hectares,
        plantingDate: details.planting_date,
        expectedHarvest: details.expected_harvest,
        seedType: details.seed_type,
        fieldStatus: cropStatus,
        cropVariety: details.crop_variety,
        soilType: details.soil_type,
        irrigationType: details.irrigation_type,
      })
      navigate(`/fields/${field.id}`)
    } catch (err) {
      setError(err.message)
      setSubmitting(false)
    }
  }

  return (
    <Drawer
      title="Add a new field"
      onClose={onClose}
      busy={submitting}
      footer={
        <>
          <button type="button" onClick={onClose} disabled={submitting} className="btn-secondary">Cancel</button>
          <button type="submit" form={FORM_ID} disabled={submitting} className="btn-primary disabled:opacity-50">{submitting ? 'Submitting...' : 'Submit for LGU Approval'}</button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={handleSubmit} className="flex flex-col">
        <h3 className="form-section-title">Field information</h3>
        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="field-name">Field name <span className="text-red-600">*</span></label>
            <input id="field-name" autoFocus className="rounded border px-3 py-2" placeholder="e.g. Palayan sa Taas" value={fieldName} onChange={(e) => setFieldName(e.target.value)} required />
          </div>
          <div className="form-field">
            <span>Purok <span className="text-red-600">*</span></span>
            <Select aria-label="Purok" value={purok ?? profile?.purok ?? ''} onChange={(e) => setPurok(e.target.value)} required className="rounded border px-3 py-2 text-sm">
              <option value="">Select purok...</option>
              {PUROKS.map((name) => <option key={name} value={name}>{name}</option>)}
            </Select>
          </div>
        </div>

        <FieldDetailsInputs
          details={details}
          requireSchedule={cropStatus !== 'fallow' && cropStatus !== 'land_prep'}
          onChange={(name, value) => setDetails((current) => ({ ...current, [name]: value }))}
        >
          <div className="form-field">
            <span>Crop status</span>
            <Select aria-label="Crop status" value={cropStatus} onChange={(e) => setCropStatus(e.target.value)} className="rounded border px-3 py-2 text-sm">
              {FIELD_STATUSES.map((status) => <option key={status} value={status}>{FIELD_STATUS_LABELS[status]}</option>)}
            </Select>
          </div>
        </FieldDetailsInputs>

        <h3 className="form-section-title">Location</h3>
        <p className="location-help">Stand near your field when capturing its GPS location. You can draw its boundary after saving.</p>
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={locate} disabled={locating} className="tb-btn">{locating ? 'Getting location...' : 'Use My Location'}</button>
          {position && <p className="text-sm text-gray-600">GPS: {position.latitude.toFixed(6)}, {position.longitude.toFixed(6)}</p>}
        </div>
        {geoError && <p className="mt-2 text-sm text-red-600">{geoError}</p>}
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <p className="mt-5 text-xs text-gray-500">Your field will be pending review. Its data will appear in Community only after LGU staff approve it.</p>
      </form>
    </Drawer>
  )
}

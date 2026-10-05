import { PageHeader } from '../../components/layout/PageHeader'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Select } from '../../components/common/Select'
import { FieldDetailsInputs } from '../../components/fields/FieldDetailsInputs'
import { useAuth } from '../../hooks/useAuth'
import { useGeolocation } from '../../hooks/useGeolocation'
import { FIELD_STATUSES, FIELD_STATUS_LABELS, PUROKS } from '../../lib/constants'
import { createField } from '../../services/fieldService'

export function AddField() {
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
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page-container form-page">
      <PageHeader title="Add a new field" description="Enter your field information and submit it for LGU approval." />
      <p className="location-help">Stand near your field when capturing its GPS location. You can draw its boundary after saving.</p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <label className="form-label" htmlFor="field-name">Field name</label>
        <input id="field-name"
          className="rounded border px-3 py-2"
          placeholder="Field name (e.g. Palayan sa Taas)"
          value={fieldName}
          onChange={(e) => setFieldName(e.target.value)}
          required
        />

        <div className="flex flex-col gap-1 text-sm text-gray-600">
          <span>Purok</span>
          <Select
            aria-label="Purok"
            value={purok ?? profile?.purok ?? ''}
            onChange={(e) => setPurok(e.target.value)}
            required
            className="rounded border px-3 py-2 text-sm"
          >
            <option value="">Select purok...</option>
            {PUROKS.map((name) => <option key={name} value={name}>{name}</option>)}
          </Select>
        </div>

        <FieldDetailsInputs
          details={details}
          onChange={(name, value) => setDetails((current) => ({ ...current, [name]: value }))}
        />

        <div className="flex flex-col gap-1 text-sm text-gray-600">
          <span>Crop status</span>
          <Select
            aria-label="Crop status"
            value={cropStatus}
            onChange={(e) => setCropStatus(e.target.value)}
            className="rounded border px-3 py-2 text-sm"
          >
            {FIELD_STATUSES.map((status) => (
              <option key={status} value={status}>{FIELD_STATUS_LABELS[status]}</option>
            ))}
          </Select>
        </div>

        <button
          type="button"
          onClick={locate}
          disabled={locating}
          className="rounded border border-green-700 px-3 py-2 text-green-700 hover:bg-green-50 disabled:opacity-50"
        >
          {locating ? 'Getting location...' : 'Use My Location'}
        </button>

        {position && (
          <p className="text-sm text-gray-600">
            GPS: {position.latitude.toFixed(6)}, {position.longitude.toFixed(6)}
          </p>
        )}
        {geoError && <p className="text-sm text-red-600">{geoError}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}

        <p className="text-sm text-gray-600">
          Your field will be pending review. Its data will appear in Community only after LGU staff approve it.
        </p>
        <button
          type="submit"
          disabled={submitting}
          className="rounded bg-green-700 px-3 py-2 text-white hover:bg-green-600 disabled:opacity-50"
        >
          {submitting ? 'Submitting...' : 'Submit for LGU Approval'}
        </button>
      </form>
    </div>
  )
}

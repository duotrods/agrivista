import { PageHeader } from '../../components/layout/PageHeader'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useGeolocation } from '../../hooks/useGeolocation'
import { createField } from '../../services/fieldService'

export function AddField() {
  const { user, profile } = useAuth()
  const { position, error: geoError, loading: locating, locate } = useGeolocation()
  const [fieldName, setFieldName] = useState('')
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
      await createField({
        farmerId: user.id,
        fieldName,
        latitude: position.latitude,
        longitude: position.longitude,
        purok: profile?.purok ?? null,
      })
      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page-container form-page">
      <PageHeader title="Add a new field" description="Give your field a name and mark its location to get started." />
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

        <button
          type="submit"
          disabled={submitting}
          className="rounded bg-green-700 px-3 py-2 text-white hover:bg-green-600 disabled:opacity-50"
        >
          {submitting ? 'Saving...' : 'Save Field'}
        </button>
      </form>
    </div>
  )
}

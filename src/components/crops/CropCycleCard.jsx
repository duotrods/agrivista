import { useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { GROWTH_STAGES, HEALTH_STATUSES } from '../../lib/constants'
import { completeCycle, createObservation, listObservations } from '../../services/cropService'

export function CropCycleCard({ cycle, onUpdated }) {
  const { user } = useAuth()
  const [observations, setObservations] = useState([])
  const [error, setError] = useState(null)

  const [harvestDate, setHarvestDate] = useState('')
  const [yieldKg, setYieldKg] = useState('')
  const [completing, setCompleting] = useState(false)

  const [growthStage, setGrowthStage] = useState(GROWTH_STAGES[0])
  const [healthStatus, setHealthStatus] = useState(HEALTH_STATUSES[0])
  const [pestType, setPestType] = useState('')
  const [remarks, setRemarks] = useState('')
  const [photoFile, setPhotoFile] = useState(null)
  const [logging, setLogging] = useState(false)

  useEffect(() => {
    listObservations(cycle.id).then(setObservations).catch((err) => setError(err.message))
  }, [cycle.id])

  async function handleCompleteHarvest(e) {
    e.preventDefault()
    setCompleting(true)
    setError(null)
    try {
      const updated = await completeCycle(cycle.id, {
        harvestDate,
        yieldKg: yieldKg || null,
        status: 'completed',
      })
      onUpdated?.(updated)
    } catch (err) {
      setError(err.message)
    } finally {
      setCompleting(false)
    }
  }

  async function handleLogObservation(e) {
    e.preventDefault()
    setLogging(true)
    setError(null)
    try {
      const observation = await createObservation({
        cycleId: cycle.id,
        observedBy: user.id,
        observationDate: new Date().toISOString().slice(0, 10),
        growthStage,
        healthStatus,
        pestType,
        remarks,
        photoFile,
      })
      setObservations((prev) => [observation, ...prev])
      setPestType('')
      setRemarks('')
      setPhotoFile(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLogging(false)
    }
  }

  return (
    <div className="rounded border p-3">
      <div className="flex items-center justify-between">
        <p className="font-medium">
          {cycle.season} {cycle.year} {cycle.crop_variety && `· ${cycle.crop_variety}`}
        </p>
        <span
          className={`rounded px-2 py-0.5 text-xs ${
            cycle.status === 'ongoing'
              ? 'bg-yellow-100 text-yellow-800'
              : cycle.status === 'completed'
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
          }`}
        >
          {cycle.status}
        </span>
      </div>
      <p className="text-xs text-gray-600">
        Planted {cycle.planting_date}
        {cycle.harvest_date && ` · Harvested ${cycle.harvest_date}`}
        {cycle.yield_kg && ` · ${cycle.yield_kg} kg`}
      </p>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      {cycle.status === 'ongoing' && (
        <form onSubmit={handleCompleteHarvest} className="mt-3 flex flex-wrap items-end gap-2 border-t pt-3">
          <label className="text-xs text-gray-600">
            Harvest date
            <input
              type="date"
              value={harvestDate}
              onChange={(e) => setHarvestDate(e.target.value)}
              required
              className="mt-1 block rounded border px-2 py-1 text-sm"
            />
          </label>
          <label className="text-xs text-gray-600">
            Yield (kg)
            <input
              type="number"
              step="0.01"
              value={yieldKg}
              onChange={(e) => setYieldKg(e.target.value)}
              className="mt-1 block w-24 rounded border px-2 py-1 text-sm"
            />
          </label>
          <button
            type="submit"
            disabled={completing}
            className="rounded bg-green-700 px-3 py-1.5 text-sm text-white hover:bg-green-600 disabled:opacity-50"
          >
            {completing ? 'Saving...' : 'Mark Harvested'}
          </button>
        </form>
      )}

      <div className="mt-3 border-t pt-3">
        <p className="mb-2 text-sm font-medium">Observations</p>
        <form onSubmit={handleLogObservation} className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            <select
              value={growthStage}
              onChange={(e) => setGrowthStage(e.target.value)}
              className="rounded border px-2 py-1 text-sm"
            >
              {GROWTH_STAGES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <select
              value={healthStatus}
              onChange={(e) => setHealthStatus(e.target.value)}
              className="rounded border px-2 py-1 text-sm"
            >
              {HEALTH_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            {healthStatus === 'pest_affected' && (
              <input
                type="text"
                placeholder="Pest type"
                value={pestType}
                onChange={(e) => setPestType(e.target.value)}
                className="rounded border px-2 py-1 text-sm"
              />
            )}
          </div>
          <textarea
            placeholder="Remarks (optional)"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            className="rounded border px-2 py-1 text-sm"
          />
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
            className="text-xs"
          />
          <button
            type="submit"
            disabled={logging}
            className="w-fit rounded bg-green-700 px-3 py-1.5 text-sm text-white hover:bg-green-600 disabled:opacity-50"
          >
            {logging ? 'Logging...' : 'Log Observation'}
          </button>
        </form>

        {observations.length > 0 && (
          <ul className="mt-3 flex flex-col gap-2">
            {observations.map((obs) => (
              <li key={obs.id} className="rounded bg-gray-50 p-2 text-xs">
                <p>
                  {obs.observation_date}: {obs.growth_stage} · {obs.health_status}
                  {obs.pest_type && ` (${obs.pest_type})`}
                </p>
                {obs.remarks && <p className="text-gray-600">{obs.remarks}</p>}
                {obs.photo_url && (
                  <img src={obs.photo_url} alt="Observation" className="mt-1 h-20 rounded object-cover" />
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

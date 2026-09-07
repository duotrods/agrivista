import { useEffect, useState } from 'react'
import { CROP_VARIETIES, SEASONS } from '../../lib/constants'
import { createCycle, listCyclesForField } from '../../services/cropService'
import { CropCycleCard } from './CropCycleCard'

export function CropCyclesSection({ fieldId }) {
  const [cycles, setCycles] = useState([])
  const [error, setError] = useState(null)

  const [season, setSeason] = useState(SEASONS[0])
  const [year, setYear] = useState(new Date().getFullYear())
  const [cropVariety, setCropVariety] = useState('')
  const [plantingDate, setPlantingDate] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    listCyclesForField(fieldId).then(setCycles).catch((err) => setError(err.message))
  }, [fieldId])

  async function handleCreate(e) {
    e.preventDefault()
    setCreating(true)
    setError(null)
    try {
      const cycle = await createCycle({ fieldId, season, year, cropVariety, plantingDate })
      setCycles((prev) => [cycle, ...prev])
      setPlantingDate('')
    } catch (err) {
      setError(err.message)
    } finally {
      setCreating(false)
    }
  }

  return (
    <div>
      <form onSubmit={handleCreate} className="flex flex-wrap items-end gap-2 rounded border p-3">
        <select value={season} onChange={(e) => setSeason(e.target.value)} className="rounded border px-2 py-1.5 text-sm">
          {SEASONS.map((s) => (
            <option key={s} value={s}>
              {s} season
            </option>
          ))}
        </select>
        <input
          type="number"
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="w-20 rounded border px-2 py-1.5 text-sm"
        />
        <select
          value={cropVariety}
          onChange={(e) => setCropVariety(e.target.value)}
          className="rounded border px-2 py-1.5 text-sm"
        >
          <option value="">Crop variety...</option>
          {CROP_VARIETIES.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
        <label className="text-xs text-gray-600">
          Planting date
          <input
            type="date"
            value={plantingDate}
            onChange={(e) => setPlantingDate(e.target.value)}
            required
            className="mt-1 block rounded border px-2 py-1.5 text-sm"
          />
        </label>
        <button
          type="submit"
          disabled={creating}
          className="rounded bg-green-700 px-3 py-2 text-sm text-white hover:bg-green-600 disabled:opacity-50"
        >
          {creating ? 'Starting...' : 'Start New Cycle'}
        </button>
      </form>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <div className="mt-4 flex flex-col gap-3">
        {cycles.length === 0 && <p className="text-sm text-gray-500">No crop cycles yet.</p>}
        {cycles.map((cycle) => (
          <CropCycleCard
            key={cycle.id}
            cycle={cycle}
            onUpdated={(updated) =>
              setCycles((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
            }
          />
        ))}
      </div>
    </div>
  )
}

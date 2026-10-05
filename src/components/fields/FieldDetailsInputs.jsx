import { Select } from '../common/Select'
import { CROP_VARIETIES, IRRIGATION_TYPES, SEED_TYPES, SOIL_TYPES } from '../../lib/constants'

export function FieldDetailsInputs({ details, onChange }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <label className="flex min-w-0 flex-col gap-1 text-sm text-gray-600">
        Owner name
        <input
          type="text"
          name="owner_name"
          value={details.owner_name}
          onChange={(e) => onChange('owner_name', e.target.value)}
          className="w-full rounded border px-3 py-2 text-sm"
        />
      </label>
      <label className="flex min-w-0 flex-col gap-1 text-sm text-gray-600">
        Maintainer name
        <input
          type="text"
          name="maintainer_name"
          value={details.maintainer_name}
          onChange={(e) => onChange('maintainer_name', e.target.value)}
          className="w-full rounded border px-3 py-2 text-sm"
        />
      </label>
      <label className="flex min-w-0 flex-col gap-1 text-sm text-gray-600">
        Area (hectares)
        <input
          type="number"
          name="area_hectares"
          min="0"
          max="9999.99"
          step="0.01"
          value={details.area_hectares}
          onChange={(e) => onChange('area_hectares', e.target.value)}
          className="w-full rounded border px-3 py-2 text-sm"
        />
        <span className="text-xs text-gray-500">Saving a field boundary recalculates this area.</span>
      </label>
      <div className="flex min-w-0 flex-col gap-1 text-sm text-gray-600">
        <span>Inbred / Hybrid</span>
        <Select
          aria-label="Inbred / Hybrid"
          name="seed_type"
          value={details.seed_type}
          onChange={(e) => onChange('seed_type', e.target.value)}
          className="w-full rounded border px-3 py-2 text-sm"
        >
          <option value="">Select seed type...</option>
          {SEED_TYPES.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </Select>
      </div>
      <label className="flex min-w-0 flex-col gap-1 text-sm text-gray-600">
        Date planted
        <input
          type="date"
          name="planting_date"
          value={details.planting_date}
          onChange={(e) => onChange('planting_date', e.target.value)}
          className="w-full rounded border px-3 py-2 text-sm"
        />
      </label>
      <label className="flex min-w-0 flex-col gap-1 text-sm text-gray-600">
        Estimated harvest
        <input
          type="date"
          name="expected_harvest"
          min={details.planting_date || undefined}
          value={details.expected_harvest}
          onChange={(e) => onChange('expected_harvest', e.target.value)}
          className="w-full rounded border px-3 py-2 text-sm"
        />
      </label>
      {[
        { name: 'crop_variety', label: 'Crop variety', options: CROP_VARIETIES },
        { name: 'soil_type', label: 'Soil type', options: SOIL_TYPES },
        { name: 'irrigation_type', label: 'Irrigation type', options: IRRIGATION_TYPES },
      ].map(({ name, label, options }) => (
        <div key={name} className="flex min-w-0 flex-col gap-1 text-sm text-gray-600">
          <span>{label}</span>
          <Select
            aria-label={label}
            name={name}
            value={details[name]}
            onChange={(e) => onChange(name, e.target.value)}
            className="w-full rounded border px-3 py-2 text-sm"
          >
            <option value="">Select {label.toLowerCase()}...</option>
            {options.map((option) => <option key={option} value={option}>{option}</option>)}
          </Select>
        </div>
      ))}
    </div>
  )
}

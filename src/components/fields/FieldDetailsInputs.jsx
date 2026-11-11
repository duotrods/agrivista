import { Select } from '../common/Select'
import { CROP_VARIETIES, IRRIGATION_TYPES, SEED_TYPES, SOIL_TYPES } from '../../lib/constants'

// `requireSchedule`: planting and harvest dates feed the LGU harvest numbers, so they are
// required once the crop is planted (not for fallow or land-preparation fields).
export function FieldDetailsInputs({ details, onChange, requireSchedule = false, children }) {
  return (
    <div className="form-grid">
      <label className="form-field">
        <span>Owner name <span className="text-red-600">*</span></span>
        <input
          type="text"
          name="owner_name"
          required
          value={details.owner_name}
          onChange={(e) => onChange('owner_name', e.target.value)}
          className="w-full rounded border px-3 py-2 text-sm"
        />
      </label>
      <label className="form-field">
        <span>Maintainer name <span className="text-red-600">*</span></span>
        <input
          type="text"
          name="maintainer_name"
          required
          value={details.maintainer_name}
          onChange={(e) => onChange('maintainer_name', e.target.value)}
          className="w-full rounded border px-3 py-2 text-sm"
        />
      </label>
      <label className="form-field">
        <span>Area (hectares) <span className="text-red-600">*</span></span>
        <input
          type="number"
          name="area_hectares"
          required
          min="0"
          max="9999.99"
          step="0.01"
          value={details.area_hectares}
          onChange={(e) => onChange('area_hectares', e.target.value)}
          className="w-full rounded border px-3 py-2 text-sm"
        />
        <span className="form-hint">Saving a field boundary recalculates this area.</span>
      </label>
      <div className="form-field">
        <span>Inbred / Hybrid <span className="text-red-600">*</span></span>
        <Select
          aria-label="Inbred / Hybrid"
          name="seed_type"
          required
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
      <label className="form-field">
        <span>Date planted{requireSchedule && <span className="text-red-600"> *</span>}</span>
        <input
          type="date"
          name="planting_date"
          required={requireSchedule}
          value={details.planting_date}
          onChange={(e) => onChange('planting_date', e.target.value)}
          className="w-full rounded border px-3 py-2 text-sm"
        />
      </label>
      <label className="form-field">
        <span>Estimated harvest{requireSchedule && <span className="text-red-600"> *</span>}</span>
        <input
          type="date"
          name="expected_harvest"
          required={requireSchedule}
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
        <div key={name} className="form-field">
          <span>{label} <span className="text-red-600">*</span></span>
          <Select
            aria-label={label}
            name={name}
            required
            value={details[name]}
            onChange={(e) => onChange(name, e.target.value)}
            className="w-full rounded border px-3 py-2 text-sm"
          >
            <option value="">Select {label.toLowerCase()}...</option>
            {options.map((option) => <option key={option} value={option}>{option}</option>)}
          </Select>
        </div>
      ))}
      {children}
    </div>
  )
}

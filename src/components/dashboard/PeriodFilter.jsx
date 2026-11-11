import { MONTHS } from '../../lib/period'
import { Select } from '../common/Select'
import { ToolbarIcon } from './ToolbarIcon'

/** Minimal Month + Year chip with a Clear button, for toolbars. */
export function PeriodFilter({ month, year, years, onMonth, onYear }) {
  return (
    <>
      <div className="tb-group">
        <span className="tb-icon"><ToolbarIcon name="calendar" /></span>
        <Select aria-label="Filter by month" value={month} onChange={(e) => onMonth(e.target.value)} className="tb-select">
          <option value="">All months</option>
          {MONTHS.map((m, i) => <option key={m} value={String(i + 1)}>{m}</option>)}
        </Select>
        <Select aria-label="Filter by year" value={year} onChange={(e) => onYear(e.target.value)} className="tb-select">
          <option value="">All years</option>
          {years.map((y) => <option key={y} value={String(y)}>{y}</option>)}
        </Select>
      </div>
      {(month || year) && <button type="button" onClick={() => { onMonth(''); onYear('') }} className="tb-btn">Clear</button>}
    </>
  )
}

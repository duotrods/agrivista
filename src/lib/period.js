export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

/** True when the date falls in the chosen year/month ('' means any). */
export function inPeriod(iso, year, month) {
  if (!year && !month) return true
  if (!iso) return false
  const d = new Date(iso)
  return (!year || d.getFullYear() === Number(year)) && (!month || d.getMonth() === Number(month) - 1)
}

/** Years to offer in a filter: this year plus every year found in the given dates, newest first. */
export function periodYears(dates) {
  const found = dates.map((v) => new Date(v).getFullYear()).filter(Number.isFinite)
  return [...new Set([new Date().getFullYear(), ...found])].sort((a, b) => b - a)
}

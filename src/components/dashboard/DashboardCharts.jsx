import Chart from 'react-apexcharts'
import { useResolvedTheme } from '../../lib/appearance'
import { FIELD_STATUS_COLORS, FIELD_STATUS_LABELS } from '../../lib/constants'

const DARK = '#203e2f'
const DARK_BAR = '#5bbf8a'

function baseOptions(theme) {
  const dark = theme === 'dark'
  return {
    chart: { toolbar: { show: false }, fontFamily: 'inherit', foreColor: dark ? '#9aaa9f' : '#6f7d72', background: 'transparent', animations: { speed: 400 } },
    grid: { borderColor: dark ? '#2a372f' : '#edf1e8', strokeDashArray: 4 },
    dataLabels: { enabled: false },
    theme: { mode: dark ? 'dark' : 'light' },
  }
}

function countBy(items, keyFn) {
  const counts = {}
  for (const item of items) {
    const key = keyFn(item) ?? 'Unknown'
    counts[key] = (counts[key] ?? 0) + 1
  }
  return Object.entries(counts).map(([name, value]) => ({ name, value }))
}

function ChartCard({ title, subtitle, minHeight = 240, children }) {
  return (
    <section className="dash-card">
      <div className="dash-card-head">
        <h2>{title}</h2>
        {subtitle && <span>{subtitle}</span>}
      </div>
      <div className="dash-chart" style={{ minHeight }}>{children}</div>
    </section>
  )
}

const CONDITIONS = [
  ['healthy', 'Healthy', '#4caf50'],
  ['pest_affected', 'Pest affected', '#f59e0b'],
  ['diseased', 'Diseased', '#dc2626'],
  ['drought_stressed', 'Drought stressed', '#b45309'],
]

// Latest reported condition per field, counted by condition.
function conditionCounts(reports) {
  const latest = new Map()
  for (const r of reports) {
    if (!r.field_condition) continue
    const at = new Date(r.report_date ?? r.created_at).getTime()
    const seen = latest.get(r.field_id)
    if (!seen || at > seen.at) latest.set(r.field_id, { at, condition: r.field_condition })
  }
  return CONDITIONS.map(([value, label, color]) => ({
    label,
    color,
    value: [...latest.values()].filter((l) => l.condition === value).length,
  }))
}

export function ConditionChart({ reports }) {
  const theme = useResolvedTheme()
  const data = conditionCounts(reports)
  const total = data.reduce((sum, d) => sum + d.value, 0)
  return (
    <ChartCard title="Field conditions" subtitle="Latest report per field">
      {total === 0 ? (
        <p className="dash-empty">No field condition reports in this period.</p>
      ) : (
        <Chart
          type="bar"
          height="100%"
          series={[{ name: 'Fields', data: data.map((d) => d.value) }]}
          options={{
            ...baseOptions(theme),
            colors: data.map((d) => d.color),
            plotOptions: { bar: { horizontal: true, distributed: true, borderRadius: 6, barHeight: '55%' } },
            dataLabels: { enabled: true, style: { fontSize: '12px', fontWeight: 600 } },
            legend: { show: false },
            grid: { ...baseOptions(theme).grid, xaxis: { lines: { show: true } }, yaxis: { lines: { show: false } } },
            xaxis: { categories: data.map((d) => d.label), min: 0, forceNiceScale: true, labels: { formatter: (v) => Math.round(v) }, axisBorder: { show: false } },
            tooltip: { theme, y: { formatter: (v) => `${v} ${v === 1 ? 'field' : 'fields'}` } },
          }}
        />
      )}
    </ChartCard>
  )
}

export function PurokChart({ fields }) {
  const theme = useResolvedTheme()
  const data = countBy(fields, (f) => f.purok)
  return (
    <ChartCard title="Fields by purok" subtitle="Registered fields">
      {data.length === 0 ? (
        <p className="dash-empty">No fields registered yet.</p>
      ) : (
        <Chart
          type="bar"
          height="100%"
          series={[{ name: 'Fields', data: data.map((d) => d.value) }]}
          options={{
            ...baseOptions(theme),
            colors: [theme === 'dark' ? DARK_BAR : DARK],
            plotOptions: { bar: { borderRadius: 8, columnWidth: '38%' } },
            xaxis: { categories: data.map((d) => d.name), axisBorder: { show: false }, axisTicks: { show: false } },
            yaxis: { min: 0, forceNiceScale: true, labels: { formatter: (v) => Math.round(v) } },
            tooltip: { theme, y: { formatter: (v) => `${v} ${v === 1 ? 'field' : 'fields'}` } },
          }}
        />
      )}
    </ChartCard>
  )
}

export function StatusDonut({ fields }) {
  const theme = useResolvedTheme()
  const data = countBy(fields, (f) => f.field_status)
  return (
    <ChartCard title="Status distribution" subtitle="By crop stage" minHeight={300}>
      {data.length === 0 ? (
        <p className="dash-empty">No fields registered yet.</p>
      ) : (
        <Chart
          type="donut"
          height={300}
          series={data.map((d) => d.value)}
          options={{
            ...baseOptions(theme),
            labels: data.map((d) => FIELD_STATUS_LABELS[d.name] ?? d.name),
            colors: data.map((d) => FIELD_STATUS_COLORS[d.name] ?? '#9CA3AF'),
            stroke: { width: 3, colors: [theme === 'dark' ? '#18211c' : '#fff'] },
            legend: { position: 'bottom', markers: { size: 6, shape: 'circle' }, itemMargin: { horizontal: 8, vertical: 4 } },
            plotOptions: { pie: { donut: { size: '72%', labels: { show: true, total: { show: true, label: 'Fields', fontSize: '13px', color: theme === 'dark' ? '#9aaa9f' : '#6f7d72', formatter: (w) => w.globals.seriesTotals.reduce((a, b) => a + b, 0) }, value: { fontSize: '26px', fontWeight: 650, color: theme === 'dark' ? '#eef3ef' : DARK } } } } },
          }}
        />
      )}
    </ChartCard>
  )
}

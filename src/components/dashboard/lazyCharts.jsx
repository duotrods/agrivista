import { lazy } from 'react'

// Chart code (ApexCharts) loads on demand so pages without charts stay light.
const load = (name) => lazy(() => import('./DashboardCharts').then((m) => ({ default: m[name] })))

export const PurokCountChart = load('PurokCountChart')
export const StatusCountDonut = load('StatusCountDonut')
export const chartFallback = <div className="dash-card dash-empty">Loading chart...</div>

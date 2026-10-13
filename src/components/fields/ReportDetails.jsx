import { FIELD_STATUS_LABELS } from '../../lib/constants'

const label = (value) => value.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase())

// Shared read-only view of a monitoring report.
export function ReportDetails({ report }) {
  const facts = [
    report.crop_status && `Crop status: ${FIELD_STATUS_LABELS[report.crop_status] ?? report.crop_status}`,
    report.field_condition && `Condition: ${label(report.field_condition)}`,
  ].filter(Boolean)
  return (
    <>
      {facts.length > 0 && <p className="text-xs text-gray-600">{facts.join(' · ')}</p>}
      <p className="mt-1 text-sm">{report.summary}</p>
      {report.harvest_info && <p className="mt-1 text-xs text-gray-600">Harvest: {report.harvest_info}</p>}
      {report.photo_url && (
        <a href={report.photo_url} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs text-green-700 underline">View photo</a>
      )}
    </>
  )
}

import { useEffect, useState } from 'react'
import { FieldFilterMap } from '../../components/maps/FieldFilterMap'
import { PageHeader } from '../../components/layout/PageHeader'
import { listAllFields } from '../../services/fieldService'

export function LGUMap() {
  const [fields, setFields] = useState([])
  const [error, setError] = useState(null)
  useEffect(() => {
    listAllFields().then(setFields).catch((err) => setError(err.message))
  }, [])
  return (
    <div className="page-container wide-page">
      <PageHeader title="Map" description="All registered rice fields." />
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      <FieldFilterMap fields={fields} fieldLinkBase="/lgu/fields" />
    </div>
  )
}

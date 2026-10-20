import { useEffect, useState } from 'react'
import { FieldFilterMap } from '../../components/maps/FieldFilterMap'
import { PageHeader } from '../../components/layout/PageHeader'
import { useAuth } from '../../hooks/useAuth'
import { listFieldsForFarmer } from '../../services/fieldService'

export function FarmerMap() {
  const { user } = useAuth()
  const [fields, setFields] = useState([])
  const [error, setError] = useState(null)
  useEffect(() => {
    if (user) listFieldsForFarmer(user.id).then(setFields).catch((err) => setError(err.message))
  }, [user])
  return (
    <div className="page-container wide-page">
      <PageHeader title="Map" description="Your registered rice fields." />
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      <FieldFilterMap fields={fields} fieldLinkBase="/fields" />
    </div>
  )
}

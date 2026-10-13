import { useEffect, useState } from 'react'
import { getPublicFieldStats, getPublicFields } from '../../services/publicService'

function usePublicData(load) {
  const [state, setState] = useState({ rows: [], loading: true, error: null })
  useEffect(() => {
    load()
      .then((rows) => setState({ rows, loading: false, error: null }))
      .catch((err) => setState({ rows: [], loading: false, error: err.message }))
  }, [load])
  return state
}

export const usePublicStats = () => usePublicData(getPublicFieldStats)
export const usePublicFields = () => usePublicData(getPublicFields)

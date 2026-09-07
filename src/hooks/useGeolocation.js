import { useState } from 'react'

export function useGeolocation() {
  const [position, setPosition] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  function locate() {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser.')
      return
    }
    setLoading(true)
    setError(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({ latitude: pos.coords.latitude, longitude: pos.coords.longitude })
        setLoading(false)
      },
      (err) => {
        setError(err.message)
        setLoading(false)
      },
    )
  }

  return { position, error, loading, locate }
}

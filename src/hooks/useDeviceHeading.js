import { useCallback, useEffect, useRef, useState } from 'react'

function readHeading(event) {
  // iOS Safari exposes an already-absolute compass heading directly.
  if (typeof event.webkitCompassHeading === 'number') {
    return event.webkitCompassHeading
  }
  // Android/other browsers: alpha increases counter-clockwise from north.
  if (typeof event.alpha === 'number') {
    return (360 - event.alpha) % 360
  }
  return null
}

/**
 * Tracks the device's compass heading (0-360, 0 = north).
 * On iOS 13+, orientation access requires an explicit user-gesture permission
 * request, so `needsPermission` + `requestPermission` are exposed for that.
 */
export function useDeviceHeading() {
  const [heading, setHeading] = useState(null)
  const [error, setError] = useState(null)
  const [needsPermission, setNeedsPermission] = useState(false)
  const listeningRef = useRef(false)

  const attachListener = useCallback(() => {
    if (listeningRef.current) return
    const eventName = 'ondeviceorientationabsolute' in window ? 'deviceorientationabsolute' : 'deviceorientation'
    window.addEventListener(eventName, (event) => {
      const h = readHeading(event)
      if (h !== null) setHeading(h)
    })
    listeningRef.current = true
  }, [])

  const requestPermission = useCallback(async () => {
    try {
      if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        const result = await DeviceOrientationEvent.requestPermission()
        if (result !== 'granted') {
          setError('Compass access was denied.')
          return
        }
      }
      setNeedsPermission(false)
      attachListener()
    } catch (err) {
      setError(err.message)
    }
  }, [attachListener])

  useEffect(() => {
    if (typeof DeviceOrientationEvent === 'undefined') {
      setError('This device does not support compass orientation.')
      return
    }
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      setNeedsPermission(true)
    } else {
      attachListener()
    }
  }, [attachListener])

  return { heading, error, needsPermission, requestPermission }
}

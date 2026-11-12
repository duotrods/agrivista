import 'pannellum/build/pannellum.css'
import 'pannellum/build/pannellum.js'
import { useEffect, useRef } from 'react'

export function PanoViewer({ imageUrl, className = 'h-96 w-full rounded' }) {
  const containerRef = useRef(null)
  const viewerRef = useRef(null)

  useEffect(() => {
    viewerRef.current = window.pannellum.viewer(containerRef.current, {
      type: 'equirectangular',
      panorama: imageUrl,
      autoLoad: true,
      // Load with CORS, matching the thumbnail, so Safari and the offline cache agree on one copy.
      crossOrigin: 'anonymous',
    })

    return () => {
      viewerRef.current?.destroy()
    }
  }, [imageUrl])

  return <div ref={containerRef} className={className} />
}

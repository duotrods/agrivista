import 'pannellum/build/pannellum.css'
import 'pannellum/build/pannellum.js'
import { useEffect, useRef } from 'react'

export function PanoViewer({ imageUrl }) {
  const containerRef = useRef(null)
  const viewerRef = useRef(null)

  useEffect(() => {
    viewerRef.current = window.pannellum.viewer(containerRef.current, {
      type: 'equirectangular',
      panorama: imageUrl,
      autoLoad: true,
    })

    return () => {
      viewerRef.current?.destroy()
    }
  }, [imageUrl])

  return <div ref={containerRef} className="h-96 w-full rounded" />
}

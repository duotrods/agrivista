import { useEffect, useState } from 'react'
import { FIELD_CONDITIONS } from '../../lib/constants'
import { PanoViewer } from './PanoViewer'

const CONDITION_LABELS = Object.fromEntries(FIELD_CONDITIONS.map((c) => [c.value, c.label]))

function ViewerModal({ label, onClose, children }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={label}
      onClick={onClose}
      className="fixed inset-0 z-[4000] flex items-center justify-center bg-black/85 p-4"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close viewer"
        className="absolute right-4 top-4 z-10 rounded bg-white/90 px-3 py-1 text-sm text-gray-900 hover:bg-white"
      >
        Close ✕
      </button>
      {children}
    </div>
  )
}

export function MediaGallery({ media }) {
  const [activePanoUrl, setActivePanoUrl] = useState(null)
  const [lightboxImage, setLightboxImage] = useState(null)

  return (
    <div className="mt-4">
      {lightboxImage && (
        <ViewerModal label="Photo viewer" onClose={() => setLightboxImage(null)}>
          <img
            src={lightboxImage.url}
            alt={lightboxImage.alt}
            onClick={(e) => e.stopPropagation()}
            className="max-h-full max-w-full rounded object-contain"
          />
        </ViewerModal>
      )}
      {activePanoUrl && (
        <ViewerModal label="360° viewer" onClose={() => setActivePanoUrl(null)}>
          <div onClick={(e) => e.stopPropagation()} className="h-full w-full">
            <PanoViewer imageUrl={activePanoUrl} className="h-full w-full rounded" />
          </div>
        </ViewerModal>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {media.map((item) => (
          <div key={item.id} className="flex flex-col gap-1">
            {item.media_type === 'video' ? (
              <video src={item.file_url} controls className="h-32 w-full rounded object-cover" />
            ) : item.media_type === 'panorama_360' ? (
              <button
                type="button"
                onClick={() => setActivePanoUrl(item.file_url)}
                className="relative h-32 w-full overflow-hidden rounded"
              >
                <img src={item.file_url} alt={item.caption ?? 'Panorama'} className="h-full w-full object-cover" />
                <span className="absolute bottom-1 right-1 rounded bg-black/60 px-1.5 py-0.5 text-xs text-white">
                  360°
                </span>
                {item.field_condition && (
                  <span className="absolute left-1 top-1 rounded bg-green-800/90 px-1.5 py-0.5 text-xs text-white">
                    {CONDITION_LABELS[item.field_condition] ?? item.field_condition}
                  </span>
                )}
              </button>
            ) : item.media_type === 'drone_photo' ? (
              <button
                type="button"
                onClick={() => setLightboxImage({ url: item.file_url, alt: item.caption ?? 'Aerial view' })}
                aria-label="View larger"
                className="relative h-32 w-full overflow-hidden rounded"
              >
                <img
                  src={item.file_url}
                  alt={item.caption ?? 'Aerial view'}
                  className="h-full w-full object-cover"
                />
                <span className="absolute bottom-1 right-1 rounded bg-black/60 px-1.5 py-0.5 text-xs text-white">
                  🛸 Drone
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setLightboxImage({ url: item.file_url, alt: item.caption ?? 'Field' })}
                aria-label="View larger"
                className="h-32 w-full overflow-hidden rounded"
              >
                <img
                  src={item.file_url}
                  alt={item.caption ?? 'Field'}
                  className="h-full w-full object-cover"
                />
              </button>
            )}
            {item.caption && <p className="truncate text-xs text-gray-600">{item.caption}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}

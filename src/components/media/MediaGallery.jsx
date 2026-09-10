import { useState } from 'react'
import { FIELD_CONDITIONS } from '../../lib/constants'
import { PanoViewer } from './PanoViewer'

const CONDITION_LABELS = Object.fromEntries(FIELD_CONDITIONS.map((c) => [c.value, c.label]))

export function MediaGallery({ media }) {
  const [activePanoUrl, setActivePanoUrl] = useState(null)

  return (
    <div className="mt-4">
      {activePanoUrl && (
        <div className="mb-4">
          <button
            type="button"
            onClick={() => setActivePanoUrl(null)}
            className="mb-2 rounded border px-3 py-1 text-sm hover:bg-gray-50"
          >
            Close 360° View
          </button>
          <PanoViewer imageUrl={activePanoUrl} />
        </div>
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
              <div className="relative h-32 w-full overflow-hidden rounded">
                <img
                  src={item.file_url}
                  alt={item.caption ?? 'Aerial view'}
                  className="h-full w-full object-cover"
                />
                <span className="absolute bottom-1 right-1 rounded bg-black/60 px-1.5 py-0.5 text-xs text-white">
                  🛸 Drone
                </span>
              </div>
            ) : (
              <img
                src={item.file_url}
                alt={item.caption ?? 'Field'}
                className="h-32 w-full rounded object-cover"
              />
            )}
            {item.caption && <p className="truncate text-xs text-gray-600">{item.caption}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}

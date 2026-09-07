import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { uploadFieldMedia } from '../../services/mediaService'

const MEDIA_TYPES = [
  { value: 'photo', label: 'Photo', accept: 'image/*' },
  { value: 'panorama_360', label: '360° Panorama', accept: 'image/*' },
  { value: 'video', label: 'Video', accept: 'video/*' },
]

export function MediaUpload({ fieldId, onUploaded }) {
  const { user } = useAuth()
  const [mediaType, setMediaType] = useState('photo')
  const [caption, setCaption] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)

  const accept = MEDIA_TYPES.find((t) => t.value === mediaType)?.accept

  async function handleChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      const media = await uploadFieldMedia({
        fieldId,
        file,
        mediaType,
        caption,
        uploadedBy: user.id,
      })
      onUploaded?.(media)
      setCaption('')
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <select
          value={mediaType}
          onChange={(e) => setMediaType(e.target.value)}
          className="rounded border px-2 py-2 text-sm"
        >
          {MEDIA_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Caption (optional)"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          className="flex-1 rounded border px-2 py-2 text-sm"
        />
      </div>

      <label className="inline-block w-fit cursor-pointer rounded bg-green-700 px-3 py-2 text-sm text-white hover:bg-green-600">
        {uploading ? 'Uploading...' : `Upload ${MEDIA_TYPES.find((t) => t.value === mediaType).label}`}
        <input
          type="file"
          accept={accept}
          onChange={handleChange}
          disabled={uploading}
          className="hidden"
        />
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}

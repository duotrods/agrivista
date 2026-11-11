import { useEffect, useState } from 'react'

/**
 * Photo input: a dashed placeholder with a photo outline, drag-and-drop, and a preview
 * once a file is chosen. Controlled through `file` / `onChange(file | null)`.
 */
export function PhotoPicker({ id, file, onChange, hint = 'PNG or JPG' }) {
  const [preview, setPreview] = useState(null)
  const [dragging, setDragging] = useState(false)

  useEffect(() => {
    if (!file) { setPreview(null); return }
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  function accept(candidate) {
    if (candidate && candidate.type.startsWith('image/')) onChange(candidate)
  }

  if (file && preview) {
    return (
      <div className="photo-preview">
        <img src={preview} alt="Selected photo preview" />
        <div className="photo-preview-info">
          <p title={file.name}>{file.name}</p>
          <span>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
          <div className="photo-preview-actions">
            <label className="row-btn" htmlFor={id}>Change</label>
            <button type="button" className="row-btn" onClick={() => onChange(null)}>Remove</button>
          </div>
        </div>
        <input id={id} type="file" accept="image/*" className="sr-only" onChange={(e) => accept(e.target.files?.[0])} />
      </div>
    )
  }

  return (
    <label
      htmlFor={id}
      className={`photo-picker${dragging ? ' is-dragging' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => { e.preventDefault(); setDragging(false); accept(e.dataTransfer.files?.[0]) }}
    >
      <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="4" width="18" height="16" rx="2.500" />
        <circle cx="8.500" cy="9.500" r="1.500" />
        <path d="m21 16-5-5-9 9" />
      </svg>
      <span><strong>Click to upload</strong> or drag and drop</span>
      <small>{hint}</small>
      <input id={id} type="file" accept="image/*" className="sr-only" onChange={(e) => accept(e.target.files?.[0])} />
    </label>
  )
}

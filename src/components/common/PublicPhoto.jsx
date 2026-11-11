import { useState } from 'react'

/** An image that quietly disappears if the file is missing, so pages never show a broken picture. */
export function PublicPhoto({ src, alt, className = '', onLoaded }) {
  const [failed, setFailed] = useState(false)
  if (failed) return null
  return <img src={src} alt={alt} className={className} onError={() => setFailed(true)} onLoad={onLoaded} />
}

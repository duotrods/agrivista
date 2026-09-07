import { Children, useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

// Retains native form validation while rendering a keyboard-accessible listbox.
export function Select({ children, value, onChange, className = '', required, disabled, name, 'aria-label': label = 'Choose an option' }) {
  const options = Children.toArray(children).map((child) => child.props)
  const selected = options.findIndex((option) => String(option.value) === String(value))
  const [invalid, setInvalid] = useState(false)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const [position, setPosition] = useState({})
  const trigger = useRef(null)
  const menu = useRef(null)
  const search = useRef({ text: '', time: 0 })
  const id = useId()

  function show() {
    const rect = trigger.current.getBoundingClientRect()
    const below = window.innerHeight - rect.bottom - 12
    const above = rect.top - 12
    const upward = below < 220 && above > below
    setPosition({ left: rect.left, width: rect.width, maxHeight: Math.min(280, upward ? above : below), ...(upward ? { bottom: window.innerHeight - rect.top + 6 } : { top: rect.bottom + 6 }) })
    setActive(selected >= 0 && !options[selected].disabled ? selected : options.findIndex((option) => !option.disabled))
    setOpen(true)
  }

  function choose(index) {
    if (!options[index] || options[index].disabled) return
    setInvalid(false)
    onChange?.({ target: { value: options[index].value, name } })
    setOpen(false)
    trigger.current.focus()
  }

  useEffect(() => {
    if (!open) return
    function dismiss(event) {
      if (!trigger.current?.contains(event.target) && !menu.current?.contains(event.target)) setOpen(false)
    }
    function close() { setOpen(false) }
    document.addEventListener('pointerdown', dismiss)
    window.addEventListener('resize', close)
    function onScroll(event) { if (!menu.current?.contains(event.target)) close() }
    window.addEventListener('scroll', onScroll, true)
    return () => {
      document.removeEventListener('pointerdown', dismiss)
      window.removeEventListener('resize', close)
      window.removeEventListener('scroll', onScroll, true)
    }
  }, [open])

  useEffect(() => {
    if (open) menu.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [active, open])

  function handleKey(event) {
    if (event.key === 'Tab') { setOpen(false); return }
    if (event.key === 'Escape') { event.preventDefault(); setOpen(false); return }
    if (['Enter', ' '].includes(event.key)) {
      event.preventDefault()
      if (open) choose(active)
      else show()
      return
    }
    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      event.preventDefault()
      if (!open) { show(); return }
      const available = options.map((option, index) => option.disabled ? -1 : index).filter((index) => index >= 0)
      const current = available.indexOf(active)
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? available.length - 1 : (current + (event.key === 'ArrowDown' ? 1 : -1) + available.length) % available.length
      setActive(available[next])
    } else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault()
      if (!open) show()
      const now = Date.now()
      search.current = { text: (now - search.current.time < 700 ? search.current.text : '') + event.key.toLowerCase(), time: now }
      const match = options.findIndex((option) => !option.disabled && Children.toArray(option.children).join('').trim().toLowerCase().startsWith(search.current.text))
      if (match >= 0) setActive(match)
    }
  }

  return (
    <span className={`custom-select ${className}`}>
      <select className="select-native" value={value} name={name} required={required} disabled={disabled} tabIndex={-1} aria-hidden="true" onFocus={() => trigger.current?.focus()} onChange={onChange} onInvalid={(event) => { event.preventDefault(); setInvalid(true); trigger.current.focus(); show() }}>{children}</select>
      <button ref={trigger} type="button" className="select-trigger" role="combobox" aria-label={label} aria-expanded={open} aria-controls={open ? id : undefined} aria-haspopup="listbox" aria-required={required || undefined} aria-invalid={invalid || undefined} aria-describedby={invalid ? `${id}-error` : undefined} aria-activedescendant={open && active >= 0 ? `${id}-${active}` : undefined} disabled={disabled} onKeyDown={handleKey} onBlur={() => setOpen(false)} onClick={() => open ? setOpen(false) : show()}>
        <span>{options[selected]?.children ?? 'Choose an option'}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
      </button>
      {invalid && <span id={`${id}-error`} role="alert" className="select-error">Please choose an option.</span>}
      {open && createPortal(<div ref={menu} id={id} className="select-menu" role="listbox" aria-label={label} style={position} onMouseDown={(event) => event.preventDefault()}>
        {options.map((option, index) => <div key={option.value} id={`${id}-${index}`} data-index={index} role="option" aria-selected={index === selected} aria-disabled={option.disabled || undefined} className={`select-option ${index === active ? 'is-active' : ''}`} onPointerMove={() => !option.disabled && setActive(index)} onClick={() => choose(index)}>
          <span>{option.children}</span>{index === selected && <span aria-hidden="true">✓</span>}
        </div>)}
      </div>, document.body)}
    </span>
  )
}

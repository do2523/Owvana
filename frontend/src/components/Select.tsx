import { useCallback, useEffect, useId, useRef, useState } from 'react'
import type { CSSProperties, KeyboardEvent } from 'react'
import { createPortal } from 'react-dom'
import { CaretDown, Check } from '@phosphor-icons/react'

type Option = { value: string; label: string }
type Props = {
  label: string
  value: string
  options: Option[]
  onChange: (value: string) => void
  disabled?: boolean
  className?: string
}

// browsers wont let you style the open list of a normal select, so this is our own.
// the list goes on document.body so the panels cant cut it off
export default function Select({ label, value, options, onChange, disabled, className = 'field' }: Props) {
  const id = useId()
  const buttonRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const [position, setPosition] = useState<CSSProperties>({})
  const selected = options.find((o) => o.value === value)

  const placeList = useCallback(() => {
    const box = buttonRef.current?.getBoundingClientRect()
    if (!box) return
    // flip up if theres no room under the button
    const listHeight = Math.min(options.length * 40 + 12, 280)
    const fitsBelow = box.bottom + listHeight + 8 < window.innerHeight
    const top = fitsBelow ? box.bottom + 6 : Math.max(8, box.top - listHeight - 6)
    // near the right edge the list lines up with the buttons right side instead
    const pageWidth = document.documentElement.clientWidth
    const side = box.left + 240 > pageWidth ? { right: pageWidth - box.right } : { left: box.left }
    setPosition({ ...side, top, minWidth: box.width })
  }, [options.length])

  function openList() {
    placeList()
    setActive(Math.max(0, options.findIndex((o) => o.value === value)))
    setOpen(true)
  }

  function choose(index: number) {
    onChange(options[index].value)
    setOpen(false)
    buttonRef.current?.focus()
  }

  function handleKey(event: KeyboardEvent<HTMLButtonElement>) {
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
        event.preventDefault()
        openList()
      }
      return
    }
    if (event.key === 'Tab') setOpen(false)
    else if (event.key === 'Escape') {
      event.preventDefault()
      setOpen(false)
    } else if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActive(Math.min(active + 1, options.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActive(Math.max(active - 1, 0))
    } else if (event.key === 'Home') {
      event.preventDefault()
      setActive(0)
    } else if (event.key === 'End') {
      event.preventDefault()
      setActive(options.length - 1)
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      choose(active)
    }
  }

  useEffect(() => {
    if (!open) return
    function closeIfOutside(event: MouseEvent) {
      const target = event.target as Node
      if (!listRef.current?.contains(target) && !buttonRef.current?.contains(target)) setOpen(false)
    }
    // phones resize and scroll a lot (the address bar hides), so the list follows the button instead of closing
    function follow(event: Event) {
      if (!listRef.current?.contains(event.target as Node)) placeList()
    }
    document.addEventListener('mousedown', closeIfOutside)
    window.addEventListener('resize', follow)
    window.addEventListener('scroll', follow, true)
    return () => {
      document.removeEventListener('mousedown', closeIfOutside)
      window.removeEventListener('resize', follow)
      window.removeEventListener('scroll', follow, true)
    }
  }, [open, placeList])

  useEffect(() => {
    if (open) listRef.current?.children[active]?.scrollIntoView({ block: 'nearest' })
  }, [open, active])

  return (
    <div className={className}>
      <span id={`${id}-label`}>{label}</span>
      <button
        ref={buttonRef}
        type="button"
        role="combobox"
        className="select-button"
        aria-labelledby={`${id}-label`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-activedescendant={open ? `${id}-${active}` : undefined}
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={handleKey}
      >
        <span className="select-value">{selected?.label ?? ''}</span>
        <CaretDown className={open ? 'select-caret open' : 'select-caret'} size={14} weight="bold" aria-hidden="true" />
      </button>
      {open &&
        createPortal(
          <ul ref={listRef} id={`${id}-list`} role="listbox" aria-labelledby={`${id}-label`} className="select-list" style={position}>
            {options.map((option, index) => (
              <li
                key={option.value}
                id={`${id}-${index}`}
                role="option"
                aria-selected={option.value === value}
                className={index === active ? 'select-option active' : 'select-option'}
                onMouseEnter={() => setActive(index)}
                onClick={() => choose(index)}
              >
                {option.label}
                {option.value === value && <Check size={14} weight="bold" aria-hidden="true" />}
              </li>
            ))}
          </ul>,
          document.body,
        )}
    </div>
  )
}

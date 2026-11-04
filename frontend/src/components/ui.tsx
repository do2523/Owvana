import type { ReactNode } from 'react'
import { CaretLeft, Check, Minus, Plus } from '@phosphor-icons/react'
import { initials } from '../utils'
import type { Category } from '../store'

const AVATAR_COLORS = ['#0e7c7b', '#c4583a', '#24505c', '#6b7a2e', '#a8502a', '#e0a93b', '#2b7f9e']

// same person always gets the same color
function colorFor(name: string) {
  let n = 0
  for (const ch of name) n += ch.charCodeAt(0)
  return AVATAR_COLORS[n % AVATAR_COLORS.length]
}

export function Avatar({ name, size = 40, isYou }: { name: string; size?: number; isYou?: boolean }) {
  const color = isYou ? AVATAR_COLORS[0] : colorFor(name)
  return (
    <span className="person-avatar" style={{ background: color, width: size, height: size, fontSize: size * 0.36, color: color === '#e0a93b' ? '#3d2f00' : '#fff' }}>
      {initials(name)}
    </span>
  )
}

export function PlusIcon({ size = 16 }: { size?: number }) {
  return <Plus className="icon-plus" size={size} weight="bold" aria-hidden="true" />
}

export function MinusIcon({ size = 16 }: { size?: number }) {
  return <Minus className="icon-plus" size={size} weight="bold" aria-hidden="true" />
}

export function CheckIcon({ size = 13 }: { size?: number }) {
  return <Check size={size} weight="bold" aria-hidden="true" />
}

export function CategoryTag({ category }: { category?: Category }) {
  if (!category) return <span className="muted-amount">None</span>
  return (
    <span className="tag" style={{ background: `color-mix(in srgb, ${category.color} 18%, white)`, color: `color-mix(in srgb, ${category.color} 60%, black)` }}>
      {category.name}
    </span>
  )
}

const BADGES: Record<string, ReactNode> = {
  unpaid: 'Unpaid',
  sent: 'Sent',
  confirmed: <><CheckIcon /> Confirmed</>,
  disputed: 'Disputed',
  none: 'Nothing owed',
}

export function StatusBadge({ status, children }: { status: string; children?: ReactNode }) {
  return <span className={`status status-${status}`}>{children ?? BADGES[status]}</span>
}

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="card modal" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <h2>{title}</h2>
        {children}
      </div>
    </div>
  )
}

export function BackLink({ to, label, onGo }: { to: string; label: string; onGo: (to: string) => void }) {
  return (
    <a
      className="back-link-top"
      href={to}
      onClick={(e) => {
        e.preventDefault()
        onGo(to)
      }}
    >
      <CaretLeft size={14} weight="bold" aria-hidden="true" /> {label}
    </a>
  )
}

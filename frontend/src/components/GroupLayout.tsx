import type { ReactNode } from 'react'
import AppHeader from './AppHeader'
import { GroupScene } from './Scenes'
import { sceneFor, useGroupTheme } from '../groupTheme'
import { BackLink } from './ui'
import { navigate } from '../router'
import { currentUser } from '../store'
import type { Group } from '../store'
import '../pages/Group.css'

const TABS = [
  { key: 'expenses', label: 'Expenses', path: '' },
  { key: 'participants', label: 'Participants', path: '/participants' },
  { key: 'payments', label: 'Payments', path: '/payments' },
  { key: 'categories', label: 'Categories', path: '/categories' },
]

type Props = { group: Group; tab: string; subtitle?: ReactNode; actions?: ReactNode; children: ReactNode }

// picture banner + tabs thats on every group page
export default function GroupLayout({ group, tab, subtitle, actions, children }: Props) {
  const scene = sceneFor(group)
  useGroupTheme(scene)

  return (
    <div className="page">
      <AppHeader userName={currentUser()?.name ?? ''} active="groups" />
      <section className="group-banner">
        <GroupScene scene={scene} />
        <div className="group-banner-inner">
          <BackLink to="/dashboard" label="All groups" onGo={navigate} />
          <div className="group-banner-row">
            <div>
              <h1>{group.name}</h1>
              {subtitle && <div className="group-subtitle">{subtitle}</div>}
            </div>
            {actions && <div className="group-actions">{actions}</div>}
          </div>
          <nav className="group-tabs">
            {TABS.map((t) => (
              <button key={t.key} className={t.key === tab ? 'active' : ''} onClick={() => navigate(`/groups/${group._id}${t.path}`)}>
                {t.label}
              </button>
            ))}
          </nav>
        </div>
      </section>
      <main className="group-main">{children}</main>
    </div>
  )
}

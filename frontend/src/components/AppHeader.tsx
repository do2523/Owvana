import { useState } from 'react'
import Logo from './Logo'
import { navigate } from '../router'
import { logOut } from '../store'
import { initials } from '../utils'

type Props = { userName: string; active: 'groups' | 'profile' }

// top bar for the logged in pages
export default function AppHeader({ userName, active }: Props) {
  const [menuOpen, setMenuOpen] = useState(false)

  function handleLogOut() {
    logOut()
    navigate('/login')
  }

  return (
    <header className="app-header">
      <div className="app-header-left">
        <Logo />
        <nav className="app-nav">
          <button className={active === 'groups' ? 'active' : ''} onClick={() => navigate('/dashboard')}>
            Groups
          </button>
          <button className={active === 'profile' ? 'active' : ''} onClick={() => navigate('/profile')}>
            Profile
          </button>
        </nav>
      </div>

      <div className="avatar-wrap">
        <button className="avatar" aria-label="Account menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>
          {initials(userName) || '?'}
        </button>
        {menuOpen && (
          <div className="avatar-menu">
            <p className="avatar-name">{userName}</p>
            <button onClick={() => navigate('/profile')}>Profile</button>
            <button onClick={handleLogOut}>Log out</button>
          </div>
        )}
      </div>
    </header>
  )
}

import { useEffect } from 'react'
import './App.css'
import { useLocation } from './router'
import AuthPage from './pages/AuthPage'
import CheckEmailPage from './pages/CheckEmailPage'
import VerifyEmailPage from './pages/VerifyEmailPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import DashboardPage from './pages/DashboardPage'
import GroupExpensesPage from './pages/GroupExpensesPage'
import ExpenseFormPage from './pages/ExpenseFormPage'
import GroupParticipantsPage from './pages/GroupParticipantsPage'
import GroupPaymentsPage from './pages/GroupPaymentsPage'
import GroupCategoriesPage from './pages/GroupCategoriesPage'
import ParticipantLinkPage from './pages/ParticipantLinkPage'
import ProfilePage from './pages/ProfilePage'
import { getToken } from './api'
import { currentUser, dismissSyncError, lastSyncError, loadOwnerData, sessionStatus, useDb } from './store'

// /groups/:id and everything under it
function GroupRoutes({ parts }: { parts: string[] }) {
  const db = useDb()
  const group = db.groups.find((g) => g._id === parts[1] && g.owner_id === currentUser()?._id)
  if (!group) return <DashboardPage />

  if (parts[2] === 'participants') return <GroupParticipantsPage key={group._id} group={group} />
  if (parts[2] === 'payments') return <GroupPaymentsPage key={group._id} group={group} />
  if (parts[2] === 'categories') return <GroupCategoriesPage key={group._id} group={group} />
  if (parts[2] === 'expenses' && parts[3] === 'new') return <ExpenseFormPage key="new" group={group} />
  if (parts[2] === 'expenses' && parts[3]) return <ExpenseFormPage key={parts[3]} group={group} expenseId={parts[3]} />
  return <GroupExpensesPage key={group._id} group={group} />
}

// shown when a change couldnt be saved to the database. the page has already gone back to what is saved
function SyncErrorBanner() {
  const message = lastSyncError()
  if (!message) return null
  return (
    <div className="sync-error" role="alert">
      <span>{message}</span>
      <button onClick={dismissSyncError} aria-label="Dismiss">×</button>
    </div>
  )
}

function App() {
  useDb()
  const { path, query } = useLocation()
  const email = query.get('email') ?? ''
  const token = query.get('token') ?? ''
  const parts = path.split('/').filter(Boolean)
  const isLinkPage = parts[0] === 'p' && Boolean(parts[1])
  const needsLogin = (parts[0] === 'groups' && Boolean(parts[1])) || path === '/dashboard' || path === '/profile'
  const hasToken = Boolean(getToken())
  const state = sessionStatus()
  const loggedIn = hasToken && Boolean(currentUser())

  // pull the user's data from the database once they are logged in
  useEffect(() => {
    if (!isLinkPage && hasToken) void loadOwnerData()
  }, [isLinkPage, hasToken, path])

  // this one is public, people open it without an account
  if (isLinkPage) {
    return (
      <>
        <ParticipantLinkPage token={parts[1]} />
        <SyncErrorBanner />
      </>
    )
  }

  if (needsLogin && hasToken && !loggedIn) {
    if (state === 'failed') {
      return (
        <main className="link-missing">
          <h1>Can’t reach the server</h1>
          <p className="muted">Make sure the backend is running, then try again.</p>
          <button className="btn btn-primary btn-auto" onClick={() => void loadOwnerData(true)}>Try again</button>
        </main>
      )
    }
    return (
      <main className="link-missing">
        <p className="muted">Loading your groups...</p>
      </main>
    )
  }

  return (
    <>
      <Page path={path} parts={parts} email={email} token={token} loggedIn={loggedIn} />
      <SyncErrorBanner />
    </>
  )
}

type PageProps = { path: string; parts: string[]; email: string; token: string; loggedIn: boolean }

// picks the page for the current url
function Page({ path, parts, email, token, loggedIn }: PageProps) {
  if (parts[0] === 'groups' && parts[1]) {
    return loggedIn ? <GroupRoutes parts={parts} /> : <AuthPage key="login" startTab="login" />
  }

  switch (path) {
    case '/signup':
      return <AuthPage key="signup" startTab="signup" />
    case '/check-email':
      return <CheckEmailPage email={email} />
    case '/verify-email':
      return <VerifyEmailPage email={email} token={token} />
    case '/forgot-password':
    case '/reset-password':
      return <ResetPasswordPage key={token} email={email} token={token} />
    case '/dashboard':
      return loggedIn ? <DashboardPage /> : <AuthPage key="login" startTab="login" />
    case '/profile':
      return loggedIn ? <ProfilePage /> : <AuthPage key="login" startTab="login" />
    default:
      return <AuthPage key="login" startTab="login" />
  }
}

export default App

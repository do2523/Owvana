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
import { currentUser, useDb } from './store'

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

function App() {
  const { path, query } = useLocation()
  const email = query.get('email') ?? ''
  const token = query.get('token') ?? ''
  const parts = path.split('/').filter(Boolean)
  const loggedIn = Boolean(getToken()) && Boolean(currentUser())

  // this one is public, people open it without an account
  if (parts[0] === 'p' && parts[1]) return <ParticipantLinkPage token={parts[1]} />

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

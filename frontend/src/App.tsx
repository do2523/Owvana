import './App.css'
import { useLocation } from './router'
import AuthPage from './pages/AuthPage'
import CheckEmailPage from './pages/CheckEmailPage'
import VerifyEmailPage from './pages/VerifyEmailPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import DashboardPage from './pages/DashboardPage'
import { getToken } from './api'

function App() {
  const { path, query } = useLocation()
  const email = query.get('email') ?? ''
  const token = query.get('token') ?? ''

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
      return getToken() ? <DashboardPage /> : <AuthPage key="login" startTab="login" />
    default:
      return <AuthPage key="login" startTab="login" />
  }
}

export default App

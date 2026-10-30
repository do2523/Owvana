import TopBar from '../components/TopBar'
import { clearToken } from '../api'
import { navigate } from '../router'

// placeholder until the real dashboard (screen 03) gets built
export default function DashboardPage() {
  return (
    <div className="page">
      <TopBar />
      <main className="page-body">
        <section className="card step-card center">
          <h1>You’re logged in</h1>
          <p className="muted big">The dashboard goes here.</p>
          <button
            className="btn btn-outline"
            onClick={() => {
              clearToken()
              navigate('/login')
            }}
          >
            Log out
          </button>
        </section>
      </main>
    </div>
  )
}

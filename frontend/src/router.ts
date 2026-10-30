import { useEffect, useState } from 'react'

// tiny router so we dont need to pull in react-router for a few pages
export function navigate(to: string) {
  window.history.pushState(null, '', to)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

export function useLocation() {
  const [location, setLocation] = useState(() => ({
    path: window.location.pathname,
    query: new URLSearchParams(window.location.search),
  }))

  useEffect(() => {
    function onChange() {
      setLocation({
        path: window.location.pathname,
        query: new URLSearchParams(window.location.search),
      })
    }
    window.addEventListener('popstate', onChange)
    return () => window.removeEventListener('popstate', onChange)
  }, [])

  return location
}

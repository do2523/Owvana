// all the auth calls live here so the paths are easy to change later

type ApiResult<T> = { ok: boolean; status: number; data: T & { message?: string } }

async function request<T>(path: string, options: RequestInit = {}): Promise<ApiResult<T>> {
  const response = await fetch(path, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  })

  let data = {} as T & { message?: string; error?: string }
  try {
    data = await response.json()
  } catch {
    // some routes might not send json back, thats fine
  }

  // login sends { error } and the rest send { message }, so just use message everywhere
  if (data?.error && !data.message) {
    data = { ...data, message: data.error }
  }

  // vite sends back an empty 500 when the backend isnt running
  if (!response.ok && response.status >= 500 && !data?.message) {
    data = { ...data, message: 'Can’t reach the server. Make sure the backend is running (npm start).' }
  }

  return { ok: response.ok, status: response.status, data }
}

function post<T>(path: string, body: unknown) {
  return request<T>(path, { method: 'POST', body: JSON.stringify(body) })
}

// API branch version of /register wants password_confirmation too
export function register(name: string, email: string, password: string, passwordConfirmation: string) {
  return post<{ user?: { id: string; name: string; email: string } }>('/register', {
    name,
    email,
    password,
    password_confirmation: passwordConfirmation,
  })
}

export function login(email: string, password: string) {
  return post<{ token?: string }>('/login', { email, password })
}

// the link in the email has ?token=... on it
export function verifyEmail(token: string) {
  const params = new URLSearchParams({ token })
  return request<{ verified?: boolean }>(`/verifyEmail?${params}`)
}

export function sendResetLink(email: string) {
  return post('/resetPassword', { email })
}

// TODO: not on the API list yet, waiting on the API team for the real paths
export function resendVerification(email: string) {
  return post('/resendVerification', { email })
}

export function setNewPassword(email: string, token: string, password: string) {
  return post('/setNewPassword', { email, token, password })
}

export function saveToken(token: string) {
  localStorage.setItem('token', token)
}

export function getToken() {
  return localStorage.getItem('token')
}

export function clearToken() {
  localStorage.removeItem('token')
}

// these show up as the checklist under the password box
export const passwordRules = [
  { label: 'At least 8 characters', test: (pw: string) => pw.length >= 8 },
  { label: 'One capital letter', test: (pw: string) => /[A-Z]/.test(pw) },
  { label: 'One number', test: (pw: string) => /\d/.test(pw) },
  { label: 'One special character', test: (pw: string) => /[^A-Za-z0-9]/.test(pw) },
]

export function passwordProblem(password: string) {
  const missing = passwordRules.find((rule) => !rule.test(password))
  return missing ? `Password needs: ${missing.label.toLowerCase()}.` : ''
}

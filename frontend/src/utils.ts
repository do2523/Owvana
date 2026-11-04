// "Jordan Moon" -> "JM"
export function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')
}

const moneyFormat = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

export function money(amount: number) {
  return moneyFormat.format(amount)
}

// dates can be yyyy-mm-dd, add a time so they dont shift a day from timezones
function toDate(date: string) {
  return new Date(date.length === 10 ? `${date}T12:00:00` : date)
}

// todays date as yyyy-mm-dd in the users timezone
export function today() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

export function shortDate(date: string) {
  return toDate(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function longDate(date: string) {
  return toDate(date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

export function dateRange(start: string, end: string, withYear = false) {
  const s = shortDate(start)
  const e = shortDate(end)
  const year = withYear ? `, ${toDate(end).getFullYear()}` : ''
  if (s === e) return `${s}${year}`
  // "Mar 14 – 18" when its the same month
  if (s.split(' ')[0] === e.split(' ')[0]) return `${s} – ${e.split(' ')[1]}${year}`
  return `${s} – ${e}${year}`
}

export function timeAgo(date: string) {
  const mins = Math.round((Date.now() - new Date(date).getTime()) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return shortDate(date)
}

// keeps amount boxes to numbers only, like 12.50
export function amountText(value: string) {
  const [whole, ...rest] = value.replace(/[^\d.]/g, '').split('.')
  return rest.length ? `${whole}.${rest.join('').slice(0, 2)}` : whole
}

// splits cents by weight so everything always adds back up to the exact total
export function allocate(total: number, weights: number[]) {
  const cents = Math.round(total * 100)
  const sum = weights.reduce((a, b) => a + b, 0)
  if (sum <= 0) return weights.map(() => 0)
  const amounts = weights.map((w) => Math.floor((cents * w) / sum))
  let left = cents - amounts.reduce((a, b) => a + b, 0)
  for (let i = 0; left > 0 && i < amounts.length; i++) {
    if (weights[i] > 0) {
      amounts[i] += 1
      left -= 1
    }
  }
  return amounts.map((c) => c / 100)
}

export function downloadCsv(filename: string, rows: (string | number)[][]) {
  const text = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
  const url = URL.createObjectURL(new Blob([text], { type: 'text/csv' }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

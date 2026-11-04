import { useSyncExternalStore } from 'react'
import { allocate } from './utils'
import { buildSeed } from './seed'

// everything the app shows comes from here for now. its saved in the browser (localStorage)
// because the API teams routes arent ready. field names match the mongoose models in
// backend/database/models, and the function names match the API list where theres a route for it.
// when the routes are done these are the functions to swap for real fetch calls.

export type User = { _id: string; name: string; email: string; email_verified: boolean; created_at: string }
// scene isnt in the model yet, its the background picked in the edit popup
export type Group = { _id: string; name: string; owner_id: string; created_at: string; scene?: string }
// user_id + access_token arent in the model yet (its just access_token_hash there)
export type Participant = { _id: string; name: string; email?: string; group_id: string; access_token: string; user_id?: string }
export type Category = { _id: string; name: string; group_id: string | null; color: string }
export type SplitType = 'equal' | 'exact' | 'percent' | 'shares'
export type Expense = {
  _id: string
  group_id: string
  category_id?: string
  title: string
  paid_by: string
  total_amount: number
  expense_date: string
  created_at: string
  split_type: SplitType
}
export type ExpenseSplit = { _id: string; expense_id: string; participant_id: string; amount_owed: number; split_value: number }
export type PaymentStatus = 'sent' | 'confirmed' | 'disputed'
// model only has expense_split_id, but payments here are against a persons whole balance
export type Payment = {
  _id: string
  participant_id: string
  to_participant_id?: string // who gets the money, whoever this is confirms it. blank = the owner
  group_id: string
  amount: number
  status: PaymentStatus
  payment_method: string
  transaction_id?: string
  sent_at?: string
  paid_at?: string
  recorded_by_owner?: boolean
}

export type Db = {
  currentUserId: string
  users: User[]
  groups: Group[]
  participants: Participant[]
  categories: Category[]
  expenses: Expense[]
  expense_splits: ExpenseSplit[]
  payments: Payment[]
}

const KEY = 'owvana-data-v3'
export const TAG_COLORS = ['#2b7f9e', '#e4703a', '#8a5a8c', '#14a08f', '#c94f7c']

export function newId() {
  return crypto.randomUUID()
}

// looks like q91xz-7hm2
export function newLinkToken() {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789'
  const pick = (n: number) => Array.from(crypto.getRandomValues(new Uint32Array(n)), (x) => chars[x % chars.length]).join('')
  return `${pick(5)}-${pick(4)}`
}

function emptyDb(): Db {
  return {
    currentUserId: '',
    users: [],
    groups: [],
    participants: [],
    categories: [
      { _id: 'cat-lodging', name: 'Lodging', group_id: null, color: TAG_COLORS[0] },
      { _id: 'cat-food', name: 'Food', group_id: null, color: TAG_COLORS[1] },
      { _id: 'cat-transport', name: 'Transport', group_id: null, color: TAG_COLORS[2] },
    ],
    expenses: [],
    expense_splits: [],
    payments: [],
  }
}

function load(): Db {
  try {
    const saved = localStorage.getItem(KEY)
    if (saved) return JSON.parse(saved) as Db
  } catch {
    // bad data, just start over
  }
  // the fake trips are only for npm run dev
  return import.meta.env.DEV ? buildSeed(emptyDb()) : emptyDb()
}

let db = load()
let version = 0
const listeners = new Set<() => void>()

function save() {
  localStorage.setItem(KEY, JSON.stringify(db))
  version += 1
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

// rerenders the page whenever the data changes
export function useDb() {
  useSyncExternalStore(subscribe, () => version)
  return db
}

export function resetLocalData() {
  localStorage.removeItem(KEY)
  db = load()
  save()
}

// ---- accounts ----

export function currentUser() {
  return db.users.find((u) => u._id === db.currentUserId)
}

// local stand in for /register while the backend is off
export function registerLocal(name: string, email: string) {
  const address = email.toLowerCase()
  const existing = db.users.find((u) => u.email === address)
  if (existing) return false
  db.users.push({ _id: newId(), name, email: address, email_verified: false, created_at: new Date().toISOString() })
  save()
  return true
}

// local stand in for /login. false means the email isnt verified yet
export function loginLocal(email: string) {
  const user = db.users.find((u) => u.email === email.toLowerCase()) ?? db.users[0]
  if (!user) return false
  if (!user.email_verified) return false
  db.currentUserId = user._id
  save()
  return true
}

export function verifyLocal(email: string) {
  const user = db.users.find((u) => u.email === email.toLowerCase())
  if (!user) return false
  user.email_verified = true
  save()
  return true
}

// real login gives us a token but not the user yet, so remember who logged in
export function rememberUser(email: string) {
  const address = email.toLowerCase()
  let user = db.users.find((u) => u.email === address)
  if (!user) {
    user = { _id: newId(), name: address.split('@')[0], email: address, email_verified: true, created_at: new Date().toISOString() }
    db.users.push(user)
  }
  db.currentUserId = user._id
  save()
}

export function updateProfile(name: string, email: string) {
  const user = currentUser()
  if (!user) return
  const address = email.toLowerCase()
  if (address !== user.email) user.email_verified = false
  user.name = name
  user.email = address
  db.participants.filter((p) => p.user_id === user._id).forEach((p) => {
    p.name = name
    p.email = address
  })
  save()
}

// ---- groups ----

export function createGroup(name: string) {
  const user = currentUser()
  const group: Group = { _id: newId(), name, owner_id: user?._id ?? '', created_at: new Date().toISOString() }
  db.groups.push(group)
  // the owner needs a participant row too so they can have a share of expenses
  db.participants.push({
    _id: newId(),
    name: user?.name ?? 'You',
    email: user?.email,
    group_id: group._id,
    access_token: newLinkToken(),
    user_id: user?._id,
  })
  save()
  return group
}

export function updateGroup(groupId: string, name: string, scene: string) {
  const group = db.groups.find((g) => g._id === groupId)
  if (!group) return
  group.name = name
  group.scene = scene
  save()
}

export function deleteGroup(groupId: string) {
  const expenseIds = new Set(db.expenses.filter((e) => e.group_id === groupId).map((e) => e._id))
  db.groups = db.groups.filter((g) => g._id !== groupId)
  db.participants = db.participants.filter((p) => p.group_id !== groupId)
  db.categories = db.categories.filter((c) => c.group_id !== groupId)
  db.expenses = db.expenses.filter((e) => e.group_id !== groupId)
  db.expense_splits = db.expense_splits.filter((s) => !expenseIds.has(s.expense_id))
  db.payments = db.payments.filter((p) => p.group_id !== groupId)
  save()
}

// ---- participants ----

export function addToGroup(groupId: string, name: string, email?: string) {
  const participant: Participant = {
    _id: newId(),
    name,
    email: email || undefined,
    group_id: groupId,
    access_token: newLinkToken(),
  }
  db.participants.push(participant)
  save()
  return participant
}

export function updateParticipant(id: string, name: string, email?: string) {
  const participant = db.participants.find((p) => p._id === id)
  if (!participant) return
  participant.name = name
  participant.email = email || undefined
  save()
}

// cant remove someone who has money attached or the totals would stop adding up
export function removeFromGroup(id: string) {
  const inUse =
    db.expense_splits.some((s) => s.participant_id === id) ||
    db.payments.some((p) => p.participant_id === id || p.to_participant_id === id) ||
    db.expenses.some((e) => e.paid_by === id)
  if (inUse) return false
  db.participants = db.participants.filter((p) => p._id !== id)
  save()
  return true
}

// ---- categories ----

export function groupCategories(groupId: string) {
  return db.categories.filter((c) => c.group_id === null || c.group_id === groupId)
}

export function createCategory(groupId: string, name: string, color: string) {
  const category: Category = { _id: newId(), name, group_id: groupId, color }
  db.categories.push(category)
  save()
  return category
}

export function renameCategory(id: string, name: string) {
  const category = db.categories.find((c) => c._id === id)
  if (!category || category.group_id === null) return
  category.name = name
  save()
}

export function deleteCategory(id: string) {
  const category = db.categories.find((c) => c._id === id)
  if (!category || category.group_id === null) return
  db.categories = db.categories.filter((c) => c._id !== id)
  db.expenses.filter((e) => e.category_id === id).forEach((e) => {
    e.category_id = undefined
  })
  save()
}

// ---- expenses ----

export type SplitRow = { participant_id: string; included: boolean; value: number }

// works out what each person owes and if it adds up to the total
export function computeSplit(total: number, type: SplitType, rows: SplitRow[]) {
  const active = rows.filter((r) => r.included)
  let amounts: number[] = []

  if (type === 'equal') amounts = allocate(total, active.map(() => 1))
  if (type === 'shares') amounts = allocate(total, active.map((r) => Math.max(0, r.value)))
  if (type === 'percent') amounts = allocate((total * sumCents(active.map((r) => r.value))) / 100, active.map((r) => Math.max(0, r.value)))
  if (type === 'exact') amounts = active.map((r) => Math.round(r.value * 100) / 100)

  const splitTotal = sumCents(amounts)
  const percentTotal = sumCents(active.map((r) => r.value))
  const balanced = active.length > 0 && total > 0 && splitTotal === Math.round(total * 100) / 100 && (type !== 'percent' || percentTotal === 100)

  const byPerson: Record<string, number> = {}
  active.forEach((r, i) => {
    byPerson[r.participant_id] = amounts[i]
  })
  return { byPerson, splitTotal, percentTotal, balanced }
}

function sumCents(values: number[]) {
  return values.reduce((sum, v) => sum + Math.round(v * 100), 0) / 100
}

export type ExpenseInput = {
  group_id: string
  title: string
  total_amount: number
  expense_date: string
  paid_by: string
  category_id?: string
  split_type: SplitType
  rows: SplitRow[]
}

// createExpense + splitExpense from the API list happen together here
export function saveExpense(input: ExpenseInput, expenseId?: string) {
  const { rows, ...fields } = input
  const { byPerson } = computeSplit(input.total_amount, input.split_type, rows)
  const id = expenseId ?? newId()
  const existing = db.expenses.find((e) => e._id === id)

  if (existing) Object.assign(existing, fields)
  else db.expenses.push({ _id: id, created_at: new Date().toISOString(), ...fields })

  db.expense_splits = db.expense_splits.filter((s) => s.expense_id !== id)
  rows.filter((r) => r.included).forEach((r) => {
    db.expense_splits.push({
      _id: newId(),
      expense_id: id,
      participant_id: r.participant_id,
      amount_owed: byPerson[r.participant_id],
      split_value: r.value,
    })
  })
  save()
}

export function deleteExpense(id: string) {
  db.expenses = db.expenses.filter((e) => e._id !== id)
  db.expense_splits = db.expense_splits.filter((s) => s.expense_id !== id)
  save()
}

// ---- payments ----

// participant taps "I sent it" on their link page
export function sendPayment(participant: Participant, toId: string, amount: number, method: string, note?: string) {
  db.payments.push({
    _id: newId(),
    participant_id: participant._id,
    to_participant_id: toId,
    group_id: participant.group_id,
    amount,
    status: 'sent',
    payment_method: method,
    transaction_id: note || undefined,
    sent_at: new Date().toISOString(),
  })
  save()
}

export function confirmPayment(id: string, status: 'confirmed' | 'disputed') {
  const payment = db.payments.find((p) => p._id === id)
  if (!payment) return
  payment.status = status
  if (status === 'confirmed') payment.paid_at = new Date().toISOString()
  save()
}

// owner got cash in person, counts as confirmed right away
export function recordPayment(participant: Participant, amount: number, method: string, note?: string) {
  const now = new Date().toISOString()
  db.payments.push({
    _id: newId(),
    participant_id: participant._id,
    group_id: participant.group_id,
    amount,
    status: 'confirmed',
    payment_method: method,
    transaction_id: note || undefined,
    sent_at: now,
    paid_at: now,
    recorded_by_owner: true,
  })
  save()
}

// ---- numbers for the pages ----

export function ownerParticipant(groupId: string) {
  const group = db.groups.find((g) => g._id === groupId)
  return db.participants.find((p) => p.group_id === groupId && p.user_id === group?.owner_id)
}

export function firstName(name: string) {
  return name.split(' ')[0]
}

export function participantName(id: string) {
  return db.participants.find((p) => p._id === id)?.name ?? ''
}

export function paymentTo(payment: Payment) {
  return payment.to_participant_id ?? ownerParticipant(payment.group_id)?._id ?? ''
}

export type Debt = { from: string; to: string; owed: number; confirmed: number; waiting: number; remaining: number }

// who owes who in a group. everyone on an expense owes the person who paid for it,
// and if 2 people owe each other it cancels out so only the difference is left
export function groupDebts(groupId: string): Debt[] {
  const peopleIds = db.participants.filter((p) => p.group_id === groupId).map((p) => p._id)
  const payments = db.payments.filter((p) => p.group_id === groupId)
  const cents = new Map<string, number>()
  const key = (a: string, b: string) => `${a}|${b}`

  db.expenses.filter((e) => e.group_id === groupId).forEach((expense) => {
    db.expense_splits.filter((s) => s.expense_id === expense._id && s.participant_id !== expense.paid_by).forEach((split) => {
      const k = key(split.participant_id, expense.paid_by)
      cents.set(k, (cents.get(k) ?? 0) + Math.round(split.amount_owed * 100))
    })
  })

  const paid = (from: string, to: string, status: PaymentStatus) =>
    payments
      .filter((p) => p.participant_id === from && paymentTo(p) === to && p.status === status)
      .reduce((sum, p) => sum + Math.round(p.amount * 100), 0)

  const debts: Debt[] = []
  peopleIds.forEach((a, i) => {
    peopleIds.slice(i + 1).forEach((b) => {
      const expenseNet = (cents.get(key(a, b)) ?? 0) - (cents.get(key(b, a)) ?? 0)
      const net = expenseNet - paid(a, b, 'confirmed') + paid(b, a, 'confirmed')
      const direction = net || expenseNet
      if (direction === 0) return
      const [from, to] = direction > 0 ? [a, b] : [b, a]
      const confirmed = paid(from, to, 'confirmed')
      const remaining = Math.abs(net)
      debts.push({ from, to, owed: (remaining + confirmed) / 100, confirmed: confirmed / 100, waiting: paid(from, to, 'sent') / 100, remaining: remaining / 100 })
    })
  })
  return debts
}

export function debtsFrom(participantId: string) {
  const person = db.participants.find((p) => p._id === participantId)
  return person ? groupDebts(person.group_id).filter((d) => d.from === participantId && d.owed > 0) : []
}

export function debtsTo(participantId: string) {
  const person = db.participants.find((p) => p._id === participantId)
  return person ? groupDebts(person.group_id).filter((d) => d.to === participantId && d.owed > 0) : []
}

export type Balance = { owed: number; confirmed: number; waiting: number; balance: number; status: 'unpaid' | 'sent' | 'confirmed' | 'none' }

function toBalance(debts: Debt[]): Balance {
  const owed = sumCents(debts.map((d) => d.owed))
  const confirmed = sumCents(debts.map((d) => d.confirmed))
  const waiting = sumCents(debts.map((d) => d.waiting))
  const balance = sumCents(debts.map((d) => d.remaining))
  const status = waiting > 0 ? 'sent' : owed === 0 ? 'none' : balance === 0 ? 'confirmed' : 'unpaid'
  return { owed, confirmed, waiting, balance, status }
}

// everything this person owes everyone. sent payments dont count until confirmed
export function participantBalance(participantId: string): Balance {
  return toBalance(debtsFrom(participantId))
}

// just what from owes to
export function pairBalance(from: string, to: string): Balance {
  return toBalance(debtsFrom(from).filter((d) => d.to === to))
}

// their own part of every expense, ignoring who paid
export function participantShare(participantId: string) {
  return sumCents(db.expense_splits.filter((s) => s.participant_id === participantId).map((s) => s.amount_owed))
}

const ONGOING_DAYS = 30

export function groupStats(groupId: string) {
  const expenses = db.expenses.filter((e) => e.group_id === groupId)
  const participants = db.participants.filter((p) => p.group_id === groupId)
  const owner = ownerParticipant(groupId)
  const others = participants.filter((p) => p._id !== owner?._id).map((p) => pairBalance(p._id, owner?._id ?? ''))
  const dates = expenses.map((e) => e.expense_date).sort()
  const last = dates[dates.length - 1]

  const confirmed = sumCents(others.map((b) => b.confirmed))
  const waiting = sumCents(others.map((b) => b.waiting))
  return {
    people: participants.length,
    expenseCount: expenses.length,
    total: sumCents(expenses.map((e) => e.total_amount)),
    owed: sumCents(others.map((b) => b.owed)),
    confirmed,
    waiting,
    sent: sumCents([confirmed, waiting]),
    stillOwed: sumCents(others.map((b) => b.balance)),
    start: dates[0],
    end: last,
    // no end date in the database so "ongoing" just means something was added recently
    ongoing: last ? Date.now() - new Date(last).getTime() < ONGOING_DAYS * 86400000 : false,
  }
}

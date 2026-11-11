import { useSyncExternalStore } from 'react'
import { allocate } from './utils'
import { clearToken, del, getToken, post, put, request, saveToken } from './api'

// The app's data lives in MongoDB. This file keeps a copy in memory so the pages can stay simple:
//  - loadOwnerData() / loadLink() fill it from the backend
//  - every function below that changes something updates the copy right away, then sends the
//    change to the backend. if the backend says no, the copy is reloaded and an error is shown.
// field names match the mongoose models in backend/database/models.

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

export const TAG_COLORS = ['#2b7f9e', '#e4703a', '#8a5a8c', '#14a08f', '#c94f7c']

// ids are made here so a new thing can show up before the backend answers.
// 24 hex characters = a valid MongoDB ObjectId, the backend keeps the one we send
export function newId() {
  return Array.from(crypto.getRandomValues(new Uint8Array(12)), (b) => b.toString(16).padStart(2, '0')).join('')
}

// stand in until the backend answers with the real private link token
function placeholderToken() {
  return `pending-${newId()}`
}

function emptyDb(): Db {
  return { currentUserId: '', users: [], groups: [], participants: [], categories: [], expenses: [], expense_splits: [], payments: [] }
}

// ---- loading + syncing with the backend ----

// idle = nothing loaded, loading = waiting on the backend, owner = a logged in user's data,
// link = a participant's private link page, failed = couldnt reach the backend
export type Status = 'idle' | 'loading' | 'owner' | 'link' | 'failed'

let db = emptyDb()
let status: Status = 'idle'
let linkToken = ''
let syncError = ''
let version = 0
const listeners = new Set<() => void>()

function notify() {
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

export function sessionStatus() {
  return status
}

export function lastSyncError() {
  return syncError
}

export function dismissSyncError() {
  syncError = ''
  notify()
}

type OwnerPayload = Omit<Db, 'currentUserId' | 'users'> & { user: User }
type LinkPayload = Omit<Db, 'currentUserId' | 'users' | 'groups'> & { group: Group }

// loads the logged in user's groups, people, expenses and payments
export async function loadOwnerData(force = false) {
  if (!getToken()) return
  if (status === 'loading' || (status === 'owner' && !force)) return
  status = 'loading'
  notify()

  try {
    const res = await request<OwnerPayload>('/data')
    if (res.status === 401) {
      // token is old or the account is gone
      clearToken()
      db = emptyDb()
      status = 'idle'
    } else if (!res.ok) {
      status = 'failed'
    } else {
      const { user, ...rest } = res.data
      db = { ...rest, currentUserId: user._id, users: [user] }
      status = 'owner'
    }
  } catch {
    status = 'failed'
  }
  notify()
}

// loads what one participant is allowed to see from their private link
export async function loadLink(token: string, force = false) {
  if (status === 'loading' || (status === 'link' && linkToken === token && !force)) return
  status = 'loading'
  notify()

  try {
    const res = await request<LinkPayload>(`/link/${encodeURIComponent(token)}`)
    if (res.ok) {
      const { group, ...rest } = res.data
      db = { ...rest, currentUserId: '', users: [], groups: [group] }
    } else if (res.status === 404) {
      db = emptyDb()
    } else {
      status = 'failed'
      notify()
      return
    }
    linkToken = token
    status = 'link'
  } catch {
    status = 'failed'
  }
  notify()
}

function reload() {
  return status === 'link' ? loadLink(linkToken, true) : loadOwnerData(true)
}

// changes go to the backend one at a time, in order, so a group exists before its people are added
let queue: Promise<void> = Promise.resolve()

type Result = { ok: boolean; data: { message?: string } }

function sync(task: () => Promise<Result>) {
  queue = queue
    .then(async () => {
      const res = await task()
      if (!res.ok) throw new Error(res.data?.message ?? 'The server rejected that change.')
    })
    .catch(async (error: unknown) => {
      syncError = error instanceof Error && error.message ? error.message : 'Couldn’t save that change. Check your connection.'
      await reload()
    })
}

// a brand new login. forget whatever was loaded before
export function beginSession(token: string) {
  saveToken(token)
  db = emptyDb()
  status = 'idle'
  linkToken = ''
  syncError = ''
  notify()
}

export function logOut() {
  clearToken()
  db = emptyDb()
  status = 'idle'
  linkToken = ''
  syncError = ''
  queue = Promise.resolve()
  notify()
}

// ---- accounts ----

export function currentUser() {
  return db.users.find((u) => u._id === db.currentUserId)
}

// returns a message if it didnt work. waits for the backend because the email might already be taken
export async function updateProfile(name: string, email: string) {
  const res = await put<{ user?: User }>('/updateProfile', { name, email })
  if (!res.ok || !res.data.user) return res.data.message ?? 'Couldn’t save your profile.'

  const user = res.data.user
  db.users = db.users.map((u) => (u._id === user._id ? user : u))
  db.participants.filter((p) => p.user_id === user._id).forEach((p) => {
    p.name = user.name
    p.email = user.email
  })
  notify()
  return ''
}

// ---- groups ----

export function createGroup(name: string) {
  const user = currentUser()
  const group: Group = { _id: newId(), name, owner_id: user?._id ?? '', created_at: new Date().toISOString() }
  const owner: Participant = {
    _id: newId(),
    name: user?.name ?? 'You',
    email: user?.email,
    group_id: group._id,
    access_token: placeholderToken(),
    user_id: user?._id,
  }
  // the owner needs a participant row too so they can have a share of expenses
  db.groups.push(group)
  db.participants.push(owner)
  notify()

  sync(async () => {
    const res = await post<{ participant?: Participant }>('/createGroup', { _id: group._id, participant_id: owner._id, name })
    if (res.ok && res.data.participant) takeToken(owner._id, res.data.participant.access_token)
    return res
  })
  return group
}

export function updateGroup(groupId: string, name: string, scene: string) {
  const group = db.groups.find((g) => g._id === groupId)
  if (!group) return
  group.name = name
  group.scene = scene
  notify()
  sync(() => put(`/updateGroup/${groupId}`, { name, scene }))
}

export function deleteGroup(groupId: string) {
  const ownerId = db.groups.find((g) => g._id === groupId)?.owner_id ?? db.currentUserId
  const expenseIds = new Set(db.expenses.filter((e) => e.group_id === groupId).map((e) => e._id))
  db.groups = db.groups.filter((g) => g._id !== groupId)
  db.participants = db.participants.filter((p) => p.group_id !== groupId)
  db.categories = db.categories.filter((c) => c.group_id !== groupId)
  db.expenses = db.expenses.filter((e) => e.group_id !== groupId)
  db.expense_splits = db.expense_splits.filter((s) => !expenseIds.has(s.expense_id))
  db.payments = db.payments.filter((p) => p.group_id !== groupId)
  notify()
  sync(() => del(`/deleteGroup/${ownerId}/${groupId}`))
}

// the backend picks the real private link token, swap it in when it answers
function takeToken(participantId: string, token: string) {
  const person = db.participants.find((p) => p._id === participantId)
  if (!person || !token) return
  person.access_token = token
  notify()
}

// ---- participants ----

export function addToGroup(groupId: string, name: string, email?: string) {
  const participant: Participant = {
    _id: newId(),
    name,
    email: email || undefined,
    group_id: groupId,
    access_token: placeholderToken(),
  }
  db.participants.push(participant)
  notify()

  sync(async () => {
    const res = await put<{ participant?: Participant }>(`/addToGroup/${groupId}`, { _id: participant._id, name, email: email || undefined })
    if (res.ok && res.data.participant) takeToken(participant._id, res.data.participant.access_token)
    return res
  })
  return participant
}

export function updateParticipant(id: string, name: string, email?: string) {
  const participant = db.participants.find((p) => p._id === id)
  if (!participant) return
  participant.name = name
  participant.email = email || undefined
  notify()
  sync(() => put(`/updateParticipant/${id}`, { name, email: email || undefined }))
}

// cant remove someone who has money attached or the totals would stop adding up
export function removeFromGroup(id: string) {
  const inUse =
    db.expense_splits.some((s) => s.participant_id === id) ||
    db.payments.some((p) => p.participant_id === id || p.to_participant_id === id) ||
    db.expenses.some((e) => e.paid_by === id)
  if (inUse) return false
  db.participants = db.participants.filter((p) => p._id !== id)
  notify()
  sync(() => del(`/removeFromGroup/${id}`))
  return true
}

// ---- categories ----

export function groupCategories(groupId: string) {
  return db.categories.filter((c) => c.group_id === null || c.group_id === groupId)
}

export function createCategory(groupId: string, name: string, color: string) {
  const category: Category = { _id: newId(), name, group_id: groupId, color }
  db.categories.push(category)
  notify()
  sync(() => post('/createCategory', { _id: category._id, name, group_id: groupId, color }))
  return category
}

export function renameCategory(id: string, name: string) {
  const category = db.categories.find((c) => c._id === id)
  if (!category || category.group_id === null) return
  category.name = name
  notify()
  sync(() => put(`/renameCategory/${id}`, { name }))
}

export function deleteCategory(id: string) {
  const category = db.categories.find((c) => c._id === id)
  if (!category || category.group_id === null) return
  const groupId = category.group_id
  db.categories = db.categories.filter((c) => c._id !== id)
  db.expenses.filter((e) => e.category_id === id).forEach((e) => {
    e.category_id = undefined
  })
  notify()
  sync(() => del(`/deleteCategory/${groupId}/${id}`))
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
  const splits: ExpenseSplit[] = rows.filter((r) => r.included).map((r) => ({
    _id: newId(),
    expense_id: id,
    participant_id: r.participant_id,
    amount_owed: byPerson[r.participant_id],
    split_value: r.value,
  }))
  db.expense_splits.push(...splits)
  notify()

  sync(() => post('/saveExpense', { _id: id, ...fields, splits }))
}

export function deleteExpense(id: string) {
  db.expenses = db.expenses.filter((e) => e._id !== id)
  db.expense_splits = db.expense_splits.filter((s) => s.expense_id !== id)
  notify()
  sync(() => del(`/deleteExpense/${id}`))
}

// ---- payments ----

// participant taps "I sent it" on their link page
export function sendPayment(participant: Participant, toId: string, amount: number, method: string, note?: string) {
  const payment: Payment = {
    _id: newId(),
    participant_id: participant._id,
    to_participant_id: toId,
    group_id: participant.group_id,
    amount,
    status: 'sent',
    payment_method: method,
    transaction_id: note || undefined,
    sent_at: new Date().toISOString(),
  }
  db.payments.push(payment)
  notify()
  sync(() =>
    post(`/link/${encodeURIComponent(participant.access_token)}/sendPayment`, {
      _id: payment._id,
      to_participant_id: toId,
      amount,
      payment_method: method,
      transaction_id: note || undefined,
    }),
  )
}

export function confirmPayment(id: string, newStatus: 'confirmed' | 'disputed') {
  const payment = db.payments.find((p) => p._id === id)
  if (!payment) return
  payment.status = newStatus
  if (newStatus === 'confirmed') payment.paid_at = new Date().toISOString()
  notify()

  // on a private link page the link is the login, otherwise its the owner confirming
  const path = status === 'link' ? `/link/${encodeURIComponent(linkToken)}/confirmPayment/${id}` : `/confirmPayment/${id}`
  sync(() => post(path, { status: newStatus }))
}

// owner got cash in person, counts as confirmed right away
export function recordPayment(participant: Participant, amount: number, method: string, note?: string) {
  const now = new Date().toISOString()
  const payment: Payment = {
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
  }
  db.payments.push(payment)
  notify()
  sync(() => post('/recordPayment', { _id: payment._id, participant_id: participant._id, amount, payment_method: method, transaction_id: note || undefined }))
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

import type { Db, Expense, Payment, PaymentStatus } from './store'
import { allocate } from './utils'

// fake trips matching the wireframes, only loaded under npm run dev
const USER_ID = 'user-jordan'

function daysAgo(days: number) {
  return new Date(Date.now() - days * 86400000).toISOString().slice(0, 10)
}

function minutesAgo(minutes: number) {
  return new Date(Date.now() - minutes * 60000).toISOString()
}

type Person = { name: string; email?: string; token?: string }
type SeedExpense = { title: string; amount: number; date: string; category: string; paidBy: number; skip?: number[] }

function addGroup(db: Db, id: string, name: string, created: string, people: Person[], expenses: SeedExpense[]) {
  db.groups.push({ _id: id, name, owner_id: USER_ID, created_at: created })

  const ids = people.map((_, i) => `${id}-p${i}`)
  people.forEach((person, i) => {
    db.participants.push({
      _id: ids[i],
      name: person.name,
      email: person.email,
      group_id: id,
      access_token: person.token ?? `${id}-${i}abc`,
      user_id: i === 0 ? USER_ID : undefined,
    })
  })

  expenses.forEach((item, n) => {
    const expense: Expense = {
      _id: `${id}-e${n}`,
      group_id: id,
      category_id: item.category,
      title: item.title,
      paid_by: ids[item.paidBy],
      total_amount: item.amount,
      expense_date: item.date,
      created_at: `${item.date}T12:00:00.000Z`,
      split_type: 'equal',
    }
    db.expenses.push(expense)
    const skip = item.skip ?? []
    const included = ids.filter((_, i) => !skip.includes(i))
    allocate(item.amount, included.map(() => 1)).forEach((amount, i) => {
      db.expense_splits.push({ _id: `${expense._id}-s${i}`, expense_id: expense._id, participant_id: included[i], amount_owed: amount, split_value: 1 })
    })
  })
  return ids
}

function pay(db: Db, groupId: string, participant: string, amount: number, status: PaymentStatus, method: string, when: string, extra: Partial<Payment> = {}) {
  db.payments.push({
    _id: `pay-${db.payments.length}`,
    group_id: groupId,
    participant_id: participant,
    amount,
    status,
    payment_method: method,
    sent_at: when,
    paid_at: status === 'confirmed' ? when : undefined,
    ...extra,
  })
}

export function buildSeed(db: Db): Db {
  const me: Person = { name: 'Jordan Moon', email: 'jordan.moon@ucf.edu' }
  db.currentUserId = USER_ID
  db.users.push({ _id: USER_ID, name: me.name, email: 'jordan.moon@ucf.edu', email_verified: true, created_at: '2026-10-22T12:00:00.000Z' })
  db.categories.push({ _id: 'cat-activities', name: 'Activities', group_id: 'miami', color: '#14a08f' })

  const miami = addGroup(
    db,
    'miami',
    'Miami Spring Break',
    '2026-03-01T12:00:00.000Z',
    [
      me,
      { name: 'Alex Chen', email: 'alex.chen@knights.ucf.edu', token: 'q91xz-7hm2' },
      { name: 'Marcus Lee', token: 'm4k8p-2wq1' },
      { name: 'Sam Rivera', email: 'sam.rivera@gmail.com', token: 's7t3r-9kd4' },
      { name: 'Priya Patel', email: 'priya.p@outlook.com', token: 'p2v6n-4xc8' },
    ],
    [
      { title: 'Airbnb: South Beach condo', amount: 1250, date: '2026-03-14', category: 'cat-lodging', paidBy: 0 },
      { title: 'Rental car (4 days)', amount: 340, date: '2026-03-14', category: 'cat-transport', paidBy: 0 },
      { title: 'Publix groceries', amount: 186.4, date: '2026-03-15', category: 'cat-food', paidBy: 3 },
      { title: 'Jet ski rental', amount: 300, date: '2026-03-16', category: 'cat-activities', paidBy: 1, skip: [4] },
      { title: 'Dinner at Joe’s', amount: 412.5, date: '2026-03-16', category: 'cat-food', paidBy: 0 },
      { title: 'Gas', amount: 58.2, date: '2026-03-17', category: 'cat-transport', paidBy: 2 },
    ],
  )
  pay(db, 'miami', miami[2], 200, 'confirmed', 'Cash', '2026-03-17T15:00:00.000Z', { recorded_by_owner: true })
  pay(db, 'miami', miami[4], 400.5, 'confirmed', 'Zelle', '2026-03-18T15:00:00.000Z')
  pay(db, 'miami', miami[3], 300, 'confirmed', 'Venmo', '2026-03-18T16:00:00.000Z')
  pay(db, 'miami', miami[1], 50, 'disputed', 'Venmo', '2026-03-18T17:00:00.000Z')
  pay(db, 'miami', miami[2], 100, 'sent', 'Zelle', minutesAgo(20), { transaction_id: 'rest coming Friday' })
  // one going to a friend instead of the owner, sam confirms this from sams link
  pay(db, 'miami', miami[4], 37.28, 'sent', 'Venmo', minutesAgo(45), { to_participant_id: miami[3], transaction_id: 'groceries' })

  const apartment = addGroup(
    db,
    'apartment',
    'Apartment 4B',
    '2026-09-01T12:00:00.000Z',
    [me, { name: 'Taylor Brooks', email: 'taylor.b@gmail.com' }, { name: 'Nina Park' }],
    [
      { title: 'Rent', amount: 1200, date: daysAgo(40), category: 'cat-lodging', paidBy: 0 },
      { title: 'Internet', amount: 60, date: daysAgo(38), category: 'cat-lodging', paidBy: 0 },
      { title: 'Electric bill', amount: 141, date: daysAgo(32), category: 'cat-lodging', paidBy: 0 },
      { title: 'Water bill', amount: 45, date: daysAgo(30), category: 'cat-lodging', paidBy: 0 },
      { title: 'Costco run', amount: 310.5, date: daysAgo(24), category: 'cat-food', paidBy: 0 },
      { title: 'Cleaning supplies', amount: 73.5, date: daysAgo(18), category: 'cat-food', paidBy: 0 },
      { title: 'Couch', amount: 390, date: daysAgo(12), category: 'cat-lodging', paidBy: 0 },
      { title: 'Rent', amount: 1200, date: daysAgo(6), category: 'cat-lodging', paidBy: 0 },
    ],
  )
  pay(db, 'apartment', apartment[1], 1140, 'confirmed', 'Venmo', minutesAgo(60 * 24 * 5))
  pay(db, 'apartment', apartment[2], 1140, 'confirmed', 'Zelle', minutesAgo(60 * 24 * 4))

  const cabin = addGroup(
    db,
    'cabin',
    'Smoky Mountains Cabin',
    '2026-01-02T12:00:00.000Z',
    [me, { name: 'Dana Kim', email: 'dana.kim@gmail.com' }, { name: 'Chris Young' }, { name: 'Maya Ortiz' }, { name: 'Leo Grant' }, { name: 'Ana Silva' }],
    [
      { title: 'Cabin rental', amount: 1200, date: '2026-01-08', category: 'cat-lodging', paidBy: 0 },
      { title: 'Groceries', amount: 240, date: '2026-01-08', category: 'cat-food', paidBy: 0 },
      { title: 'Firewood', amount: 30, date: '2026-01-08', category: 'cat-lodging', paidBy: 0 },
      { title: 'Gas', amount: 90, date: '2026-01-08', category: 'cat-transport', paidBy: 0 },
      { title: 'Park permits', amount: 60, date: '2026-01-09', category: 'cat-transport', paidBy: 0 },
      { title: 'Dinner in town', amount: 120, date: '2026-01-09', category: 'cat-food', paidBy: 0 },
      { title: 'Breakfast', amount: 45, date: '2026-01-10', category: 'cat-food', paidBy: 0 },
      { title: 'Snacks', amount: 45, date: '2026-01-10', category: 'cat-food', paidBy: 0 },
      { title: 'Parking', amount: 30, date: '2026-01-11', category: 'cat-transport', paidBy: 0 },
    ],
  )
  cabin.slice(2).forEach((id) => pay(db, 'cabin', id, 310, 'confirmed', 'Venmo', '2026-01-14T15:00:00.000Z'))
  pay(db, 'cabin', cabin[1], 310, 'sent', 'Venmo', minutesAgo(120), { transaction_id: 'cabin + groceries' })

  return db
}

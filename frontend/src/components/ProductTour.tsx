import { useState } from 'react'
import { ArrowRight, Check, DownloadSimple, HandCoins, MagnifyingGlass, PaperPlaneTilt, Receipt, UsersThree } from '@phosphor-icons/react'
import { allocate, money } from '../utils'
import '../pages/Tour.css'

const FLOW = [
  { icon: Receipt, title: 'Add what you spent', text: 'Log each cost with who paid, the date and a category.' },
  { icon: UsersThree, title: 'Split it with the group', text: 'Everyone can see exactly what they owe and what they have paid.' },
  { icon: PaperPlaneTilt, title: 'They tap “I sent it”', text: 'They pay you with Venmo, Zelle or cash, then mark it as sent.' },
  { icon: Check, title: 'It gets confirmed', text: 'What they owe only goes down once the money is confirmed.' },
]

const PEOPLE = ['Alex', 'Marcus', 'Sam', 'Priya']
const TOTAL = 120

const METHODS = [
  { key: 'Equal', labels: ['1 of 4', '1 of 4', '1 of 4', '1 of 4'], weights: [1, 1, 1, 1], note: 'Everyone pays the same.' },
  { key: 'Exact $', labels: ['$50', '$30', '$25', '$15'], weights: [50, 30, 25, 15], note: 'Type what each person owes. It has to add up to the total.' },
  { key: 'Percent', labels: ['40%', '30%', '20%', '10%'], weights: [40, 30, 20, 10], note: 'Set a percent for each person. It has to reach 100%.' },
  { key: 'Shares', labels: ['2 shares', '1 share', '1 share', '1 share'], weights: [2, 1, 1, 1], note: 'Alex brought a guest, so Alex counts twice.' },
]

const SPENDING = [
  { name: 'Lodging', share: 52, color: '#2b7f9e' },
  { name: 'Food', share: 26, color: '#e4703a' },
  { name: 'Transport', share: 14, color: '#8a5a8c' },
  { name: 'Activities', share: 8, color: '#14a08f' },
]

// the scrolling part under the login form that explains what the app is
export default function ProductTour({ onSignup }: { onSignup: () => void }) {
  const [methodKey, setMethodKey] = useState('Equal')
  const method = METHODS.find((m) => m.key === methodKey) ?? METHODS[0]
  const amounts = allocate(TOTAL, method.weights)
  const biggest = Math.max(...amounts)

  return (
    <div className="tour" id="how-it-works">
      <section className="tour-section">
        <h2 className="reveal">From the first receipt to the last payment</h2>
        <p className="tour-lead reveal">Owvana keeps track of shared costs on a trip so nobody has to chase anyone or do the math in a group chat.</p>
        <ol className="flow">
          <span className="flow-line" aria-hidden="true" />
          {FLOW.map(({ icon: Icon, title, text }) => (
            <li key={title} className="reveal">
              <span className="flow-dot"><Icon size={22} aria-hidden="true" /></span>
              <h3>{title}</h3>
              <p>{text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="tour-section split-demo">
        <div className="reveal">
          <h2>Split every cost your way</h2>
          <p className="tour-lead">Split a cost equally, by exact amounts, by percent or by shares. Try it with this example dinner.</p>
        </div>
        <div className="demo-card reveal">
          <div className="demo-top">
            <span>Dinner, example</span>
            <strong>{money(TOTAL)}</strong>
          </div>
          <div className="tabs" role="tablist" aria-label="Split method">
            {METHODS.map((m) => (
              <button key={m.key} type="button" role="tab" aria-selected={m.key === methodKey} className={m.key === methodKey ? 'active' : ''} onClick={() => setMethodKey(m.key)}>
                {m.key}
              </button>
            ))}
          </div>
          <ul className="demo-bars">
            {PEOPLE.map((person, i) => (
              <li key={person}>
                <span className="demo-name">{person}</span>
                <span className="demo-track">
                  <span className="demo-fill" style={{ transform: `scaleX(${amounts[i] / biggest})` }} />
                </span>
                <span className="demo-label">{method.labels[i]}</span>
                <strong>{money(amounts[i])}</strong>
              </li>
            ))}
          </ul>
          <p className="demo-note" role="status">
            <Check size={15} weight="bold" aria-hidden="true" /> {method.note}
          </p>
        </div>
      </section>

      <section className="tour-section">
        <h2 className="reveal">Everything the group needs, all in one place</h2>
        <div className="bento">
          <article className="bento-card bento-wide reveal">
            <div>
              <h3>Everyone knows where they stand</h3>
              <p>Each person sees what they owe, what they have paid, and can let you know as soon as they send money.</p>
            </div>
            <div className="mini-link">
              <span className="mini-owe">
                <small>You still owe Jordan</small>
                <b>$224.42</b>
              </span>
              <span className="mini-send">I sent it</span>
            </div>
          </article>

          <article className="bento-card bento-status reveal">
            <h3>Two-way payment check</h3>
            <p>Only confirmed payments lower a balance.</p>
            <div className="status-chain">
              <span className="status status-unpaid">Unpaid</span>
              <ArrowRight size={14} aria-hidden="true" />
              <span className="status status-sent">Sent</span>
              <ArrowRight size={14} aria-hidden="true" />
              <span className="status status-confirmed"><Check size={13} weight="bold" aria-hidden="true" /> Confirmed</span>
            </div>
            <p className="chain-note">If the money never came, dispute it and it goes back to unpaid.</p>
          </article>

          <article className="bento-card reveal">
            <h3>See where the money went</h3>
            <p>A spending total and a breakdown by category for every group.</p>
            <div className="mini-stack" role="img" aria-label="Example spending chart: lodging 52 percent, food 26, transport 14, activities 8">
              {SPENDING.map((s) => (
                <span key={s.name} style={{ width: `${s.share}%`, background: s.color }} />
              ))}
            </div>
            <ul className="mini-legend">
              {SPENDING.map((s) => (
                <li key={s.name}><i style={{ background: s.color }} /> {s.name}</li>
              ))}
            </ul>
          </article>

          <article className="bento-card reveal">
            <h3>Find any expense fast</h3>
            <p>Search, filter by category or who paid, sort, and page through the list.</p>
            <div className="mini-search"><MagnifyingGlass size={15} aria-hidden="true" /> Search expenses</div>
          </article>

          <article className="bento-card bento-small-grid reveal">
            <div>
              <UsersThree size={22} aria-hidden="true" />
              <h3>Add people by name</h3>
              <p>Email is optional.</p>
            </div>
            <div>
              <HandCoins size={22} aria-hidden="true" />
              <h3>Record cash payments</h3>
              <p>Got paid in person? Log it.</p>
            </div>
            <div>
              <DownloadSimple size={22} aria-hidden="true" />
              <h3>Export to CSV</h3>
              <p>Expenses or balances.</p>
            </div>
          </article>
        </div>
      </section>

      <section className="tour-end reveal">
        <h2>Go on the trip. We’ll handle the math.</h2>
        <button type="button" className="btn btn-coral-full" onClick={onSignup}>Create an account</button>
      </section>
    </div>
  )
}

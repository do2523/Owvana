import { passwordRules } from '../api'

export default function PasswordChecklist({ password }: { password: string }) {
  return (
    <ul className="pw-checklist" aria-label="Password requirements">
      {passwordRules.map((rule) => {
        const met = rule.test(password)
        return (
          <li key={rule.label} className={met ? 'met' : ''}>
            <span className="pw-check" aria-hidden="true">
              {met && (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m5 12 5 5 9-10" />
                </svg>
              )}
            </span>
            {rule.label}
            <span className="sr-only">{met ? ' (done)' : ' (not yet)'}</span>
          </li>
        )
      })}
    </ul>
  )
}

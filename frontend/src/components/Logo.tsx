type Props = { light?: boolean }

// split pin, teal half + coral half
export function PinIcon() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <g fillRule="evenodd">
        <path fill="#0E7C7B" d="M30.5 60C24 52 10.5 39 10.5 26A20 20 0 0 1 30.5 6ZM30.5 18.5A7.5 7.5 0 0 0 30.5 33.5Z" />
        <path fill="#FF6B4A" d="M33.5 6A20 20 0 0 1 53.5 26C53.5 39 40 52 33.5 60ZM33.5 18.5A7.5 7.5 0 0 1 33.5 33.5Z" />
      </g>
    </svg>
  )
}

export default function Logo({ light }: Props) {
  return (
    <a href="/login" className={light ? 'logo logo-light' : 'logo'}>
      <span className="logo-mark">
        <PinIcon />
      </span>
      Owvana
    </a>
  )
}

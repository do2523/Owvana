// little landscapes for the group cards and the login page

export function BeachScene() {
  return (
    <svg className="scene" viewBox="0 0 400 110" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="400" height="110" fill="#0e7c7b" />
      <circle cx="232" cy="46" r="30" fill="#ffb199" />
      <circle cx="232" cy="46" r="44" fill="#ffb199" opacity="0.16" />
      <path d="M0 68c40-9 74-9 112-2s74 8 112 1 90-9 176-1v44H0z" fill="#0b6665" />
      <path d="M0 84c50-8 88-6 130 0s92 7 136 0 86-6 134 0v26H0z" fill="#084f4f" />
    </svg>
  )
}

export function CityScene() {
  return (
    <svg className="scene" viewBox="0 0 400 110" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="400" height="110" fill="#c4583a" />
      <circle cx="86" cy="34" r="17" fill="#ffd2b8" opacity="0.85" />
      <path d="M150 110V60h24V44h30v22h20V30h34v30h22V48h26v26h22V38h30v72z" fill="#a84629" />
      <path d="M0 110V78h40V62h34v24h30V70h44v18h52V74h38v14h46V80h40V68h40v14h36v28z" fill="#86341d" />
    </svg>
  )
}

export function RidgeScene() {
  return (
    <svg className="scene" viewBox="0 0 400 110" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="400" height="110" fill="#3f7a4c" />
      <circle cx="226" cy="26" r="15" fill="#e6efd9" opacity="0.9" />
      <path d="M0 76l64-38 48 26 62-46 66 52 44-24 62 34 54-26v56H0z" fill="#2f6340" />
      <path d="M0 92l58-22 56 18 66-28 70 32 52-18 98 22v14H0z" fill="#214a2f" />
    </svg>
  )
}

export function DesertScene() {
  return (
    <svg className="scene" viewBox="0 0 400 110" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="400" height="110" fill="#a8662a" />
      <circle cx="214" cy="38" r="22" fill="#f7cf8a" />
      <path d="M0 74c60-22 112-20 170-2s130 16 230-14v52H0z" fill="#8f5420" />
      <path d="M0 92c80-20 150-14 214 0s120 8 186-8v26H0z" fill="#6f3f16" />
    </svg>
  )
}

export function NightScene() {
  return (
    <svg className="scene" viewBox="0 0 400 110" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="400" height="110" fill="#22406f" />
      <circle cx="232" cy="30" r="15" fill="#eef1d8" />
      <g fill="#eef1d8">
        <circle cx="120" cy="20" r="1.4" />
        <circle cx="172" cy="44" r="1.2" />
        <circle cx="292" cy="16" r="1.5" />
        <circle cx="348" cy="38" r="1.2" />
        <circle cx="66" cy="42" r="1.2" />
      </g>
      <path d="M0 70l70-22 60 16 80-28 70 30 60-16 60 18v42H0z" fill="#182f55" />
      <rect y="84" width="400" height="26" fill="#122544" />
      <path d="M222 90h22M216 98h34" stroke="#eef1d8" strokeOpacity="0.5" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export function SnowScene() {
  return (
    <svg className="scene" viewBox="0 0 400 110" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="400" height="110" fill="#3f6f8f" />
      <path d="M0 110V82l70-44 56 34 84-54 76 50 50-28 64 40v30z" fill="#6f9ab5" />
      <path d="M210 18l-30 19 14 4 16-7 15 8 13-5zM70 38l-22 14 13 2 10-5 11 5 8-3z" fill="#e4eff4" />
      <path d="M0 96c90-14 170-12 240-4s110 4 160-6v24H0z" fill="#2f5873" />
    </svg>
  )
}

const SCENES: Record<string, () => React.JSX.Element> = {
  beach: BeachScene,
  city: CityScene,
  ridge: RidgeScene,
  desert: DesertScene,
  night: NightScene,
  snow: SnowScene,
}

export function GroupScene({ scene }: { scene: string }) {
  const Scene = SCENES[scene] ?? BeachScene
  return <Scene />
}

export function HeroScene() {
  return (
    <svg className="hero-scene" viewBox="0 0 800 300" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <g className="hero-sun">
        <g className="hero-sun-rise">
          <circle className="hero-halo" cx="620" cy="118" r="92" fill="#ff8f73" opacity="0.14" />
          <circle cx="620" cy="118" r="62" fill="#ff8f73" />
        </g>
      </g>
      {/* the trip route draws itself then the pin drops on the end */}
      <path className="hero-route" pathLength={1} d="M30 176C120 96 214 190 300 132S430 70 492 100" fill="none" stroke="#fff" strokeOpacity="0.75" strokeWidth="2.5" strokeLinecap="round" />
      <g className="hero-pin" transform="translate(470 56) scale(0.7)">
        <g fillRule="evenodd">
          <path fill="#fff" d="M30.5 60C24 52 10.5 39 10.5 26A20 20 0 0 1 30.5 6ZM30.5 18.5A7.5 7.5 0 0 0 30.5 33.5Z" />
          <path fill="#ff6b4a" d="M33.5 6A20 20 0 0 1 53.5 26C53.5 39 40 52 33.5 60ZM33.5 18.5A7.5 7.5 0 0 1 33.5 33.5Z" />
        </g>
      </g>
      <path className="hero-wave-back" d="M0 190c90-24 170-24 254-6s170 22 262 2 178-20 284-4v118H0z" fill="#0b6665" />
      <path className="hero-wave-front" d="M0 232c110-22 196-16 290 0s196 18 290 2 138-16 220-6v72H0z" fill="#084f4f" />
    </svg>
  )
}

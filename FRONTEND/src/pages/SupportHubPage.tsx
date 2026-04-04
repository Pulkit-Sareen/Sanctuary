import { useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { EmergencyExit } from '../components/EmergencyExit'

type EmotionOption = {
  id: string
  label: string
  accent: string
  surface: string
  ring: string
  icon: ReactNode
  previewTitle: string
  previewText: string
  previewVisual: ReactNode
}

const EMOTIONS: EmotionOption[] = [
  {
    id: 'calm',
    label: 'Calm',
    accent: '#7BAA9A',
    surface: 'bg-[#F3ECF8]',
    ring: 'ring-[#CDB4DB]/75',
    previewTitle: 'A softer pace',
    previewText: 'A quiet visual to reflect steadiness, breath, and room to settle.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-6 w-6">
        <path d="M12 20c0-5.3 2.4-8.7 6.9-10.3-1 5.3-4 8.8-8.8 10.3" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 20c-3.7-2.6-4.9-6.6-3.6-11.4-3.1 1.4-5 4.2-5.3 7.4-.3 2.4 1.5 4 4 4H12Z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    previewVisual: (
      <div className="relative h-24 overflow-hidden rounded-[22px] bg-[linear-gradient(180deg,#edf7f3,#dfeee7)]">
        <div className="absolute inset-x-5 bottom-0 h-10 rounded-t-[999px] bg-[#c8dfd4]" />
        <div className="absolute left-6 top-4 h-5 w-5 rounded-full bg-white/70" />
        <div className="absolute right-8 top-7 h-2 w-16 rounded-full bg-white/70" />
      </div>
    ),
  },
  {
    id: 'anxious',
    label: 'Anxious',
    accent: '#5F8F91',
    surface: 'bg-[#F3ECF8]',
    ring: 'ring-[#A8DADC]/80',
    previewTitle: 'Movement without pressure',
    previewText: 'A gentle pattern that acknowledges restlessness without making it feel heavy.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-6 w-6">
        <path d="M3 9.5c1.7-2 3.3-2 5 0s3.3 2 5 0 3.3-2 5 0 3.3 2 3 2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M3 15.5c1.7-2 3.3-2 5 0s3.3 2 5 0 3.3-2 5 0 3.3 2 3 2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    previewVisual: (
      <div className="relative h-24 overflow-hidden rounded-[22px] bg-[linear-gradient(180deg,#eef8f8,#e4f1f1)]">
        <svg viewBox="0 0 200 96" className="absolute inset-0 h-full w-full text-[#8bbfc1]">
          <path d="M0 34c18-14 36-14 54 0s36 14 54 0 36-14 54 0 26 14 38 0" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
          <path d="M0 62c18-14 36-14 54 0s36 14 54 0 36-14 54 0 26 14 38 0" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" opacity="0.65" />
        </svg>
      </div>
    ),
  },
  {
    id: 'hopeful',
    label: 'Hopeful',
    accent: '#8B739A',
    surface: 'bg-[#F3ECF8]',
    ring: 'ring-[#CDB4DB]/85',
    previewTitle: 'Light returning',
    previewText: 'A brighter note that suggests clarity and warmth arriving gradually.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-6 w-6">
        <path d="M9 18h6" strokeLinecap="round" />
        <path d="M10 21h4" strokeLinecap="round" />
        <path d="M8 10a4 4 0 1 1 8 0c0 1.7-.8 2.7-1.9 3.8-.9.9-1.1 1.4-1.1 2.2h-2c0-.8-.2-1.3-1.1-2.2C8.8 12.7 8 11.7 8 10Z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    previewVisual: (
      <div className="relative h-24 overflow-hidden rounded-[22px] bg-[linear-gradient(180deg,#f7f1fa,#eee9f6)]">
        <div className="absolute left-1/2 top-4 h-8 w-8 -translate-x-1/2 rounded-full bg-[#fff1c9] shadow-[0_0_24px_rgba(255,241,201,0.7)]" />
        <div className="absolute inset-x-8 bottom-3 h-8 rounded-full bg-white/70" />
      </div>
    ),
  },
  {
    id: 'tired',
    label: 'Tired',
    accent: '#7280A7',
    surface: 'bg-[#F3ECF8]',
    ring: 'ring-[#C7D0E8]/85',
    previewTitle: 'Permission to rest',
    previewText: 'A quieter evening-like scene that supports slowing down and conserving energy.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-6 w-6">
        <path d="M15 4a7.6 7.6 0 1 0 5 13.2A8 8 0 0 1 15 4Z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    previewVisual: (
      <div className="relative h-24 overflow-hidden rounded-[22px] bg-[linear-gradient(180deg,#edf0f8,#e3e8f6)]">
        <div className="absolute right-6 top-4 h-8 w-8 rounded-full border-[6px] border-[#ffffffb3] border-r-transparent border-t-transparent rotate-45" />
        <div className="absolute inset-x-10 bottom-3 h-9 rounded-[999px] bg-[#d6def0]" />
      </div>
    ),
  },
  {
    id: 'overwhelmed',
    label: 'Overwhelmed',
    accent: '#8E6D7C',
    surface: 'bg-[#F3ECF8]',
    ring: 'ring-[#D6BCC8]/85',
    previewTitle: 'Holding a lot',
    previewText: 'A contained spiral motif that reflects intensity while still feeling protected.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-6 w-6">
        <path d="M12 20a6.8 6.8 0 1 1 6-3.6c-.7 1.3-2.1 2.2-3.5 2.1-1.3 0-2.2-.7-2.2-1.8 0-1.3 1.1-1.9 2.2-1.9 1.3 0 2.4-.9 2.4-2.4A4.8 4.8 0 1 0 12 17.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    previewVisual: (
      <div className="relative flex h-24 items-center justify-center overflow-hidden rounded-[22px] bg-[linear-gradient(180deg,#f7f1f3,#f1e6ea)]">
        <div className="h-14 w-14 rounded-full border-4 border-[#d9bac8] border-r-[#f7f1f3] border-b-[#c89aae]" />
        <div className="absolute h-8 w-8 rounded-full border-4 border-[#c89aae] border-r-transparent border-b-transparent" />
      </div>
    ),
  },
]

const DAY_LABELS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
const TREND_POINTS = [46, 58, 51, 64, 67, 61, 73]

function buildSmoothPath(points: number[], width: number, height: number, padding: number) {
  const stepX = (width - padding * 2) / (points.length - 1)
  const max = Math.max(...points)
  const min = Math.min(...points)
  const range = Math.max(max - min, 1)

  const coords = points.map((value, index) => {
    const x = padding + index * stepX
    const y = height - padding - ((value - min) / range) * (height - padding * 2)
    return { x, y }
  })

  if (coords.length === 0) return { path: '', coords }

  let path = `M ${coords[0].x} ${coords[0].y}`
  for (let i = 0; i < coords.length - 1; i += 1) {
    const current = coords[i]
    const next = coords[i + 1]
    const controlX = (current.x + next.x) / 2
    path += ` C ${controlX} ${current.y}, ${controlX} ${next.y}, ${next.x} ${next.y}`
  }

  return { path, coords }
}

export function SupportHubPage() {
  const [selectedEmotion, setSelectedEmotion] = useState('calm')
  const [hoveredEmotion, setHoveredEmotion] = useState('calm')
  const [customEntry, setCustomEntry] = useState('')

  const chart = useMemo(() => buildSmoothPath(TREND_POINTS, 760, 270, 28), [])
  const previewEmotion = EMOTIONS.find((emotion) => emotion.id === hoveredEmotion) ?? EMOTIONS[0]

  return (
    <div className="min-h-svh bg-[#F7F7F7] text-[#2F2F2F]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(circle_at_top,#eef7f7_0%,rgba(247,247,247,0.96)_52%,#F7F7F7_88%)]" />

      <header className="sticky top-0 z-40 border-b border-white/60 bg-[#F7F7F7]/92 backdrop-blur-xl">
        <nav className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-4 sm:px-8 lg:flex-row lg:px-10" aria-label="Support hub navigation">
          <div className="font-heading text-[1.35rem] font-semibold tracking-tight text-[#2F2F2F]">
            Support Hub
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 rounded-full bg-white/85 p-1 shadow-[0_12px_30px_-24px_rgba(47,47,47,0.35)]">
            {[
              { label: 'Tracker', href: '/support-hub' },
              { label: 'Resources', href: '/support-hub/resources' },
              { label: 'Vault', href: '/support-hub/resources' },
              { label: 'Grounding', href: '/support-hub/resources' },
            ].map((item) => {
              const isActive = item.label === 'Tracker'
              return (
                <Link
                  key={item.label}
                  to={item.href}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    isActive
                      ? 'bg-[#DDF1F0] text-[#24585A] shadow-[0_10px_24px_-20px_rgba(36,88,90,0.65)]'
                      : 'text-[#757575] hover:bg-[#F1F1F1] hover:text-[#2F2F2F]'
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
          </div>

          <EmergencyExit className="min-w-[10rem] bg-[#DDECE5] text-[#2D5E53] hover:bg-[#D2E4DC]" />
        </nav>
      </header>

      <main className="relative mx-auto flex w-full max-w-4xl flex-col gap-8 px-5 pb-24 pt-12 sm:px-8 sm:pt-16 lg:gap-10 lg:px-10">
        <section className="text-center">
          <h1 className="font-heading mx-auto max-w-3xl text-[2.35rem] font-semibold leading-[1.08] tracking-[-0.03em] text-[#2F2F2F] sm:text-[3.2rem]">
            How are you feeling right now?
          </h1>
        </section>

        <section className="rounded-[28px] bg-white px-4 py-5 shadow-[0_22px_48px_-34px_rgba(47,47,47,0.32)] sm:px-5 sm:py-6">
          <div className="grid gap-4 lg:grid-cols-[1.45fr_0.95fr]">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {EMOTIONS.map((emotion) => {
                const active = selectedEmotion === emotion.id
                return (
                  <button
                    key={emotion.id}
                    type="button"
                    onClick={() => setSelectedEmotion(emotion.id)}
                    onMouseEnter={() => setHoveredEmotion(emotion.id)}
                    onFocus={() => setHoveredEmotion(emotion.id)}
                    aria-pressed={active}
                    className={`group flex min-h-[148px] flex-col items-center justify-center rounded-[24px] px-4 py-5 text-center transition duration-300 hover:scale-[1.02] hover:shadow-[0_18px_38px_-30px_rgba(47,47,47,0.48)] ${
                      active
                        ? `bg-[linear-gradient(180deg,#FFFFFF,#F9FBFB)] ring-2 ${emotion.ring} shadow-[0_20px_42px_-28px_rgba(47,47,47,0.5)]`
                        : 'bg-[#FFFFFF] ring-1 ring-[#EEEEEE] shadow-[0_10px_26px_-24px_rgba(47,47,47,0.4)]'
                    }`}
                  >
                    <span className={`mb-4 flex h-16 w-16 items-center justify-center rounded-full ${emotion.surface}`} style={{ color: emotion.accent }}>
                      {emotion.icon}
                    </span>
                    <span className="text-sm font-semibold tracking-[0.01em] text-[#2F2F2F]">
                      {emotion.label}
                    </span>
                  </button>
                )
              })}
            </div>

            <aside className="rounded-[24px] bg-[linear-gradient(180deg,#f8fbfb,#f4f1f8)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8a9aa5]">
                Gentle Preview
              </p>
              {previewEmotion.previewVisual}
              <h3 className="font-heading mt-4 text-lg font-semibold text-[#2F2F2F]">
                {previewEmotion.previewTitle}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[#6b6b6b]">
                {previewEmotion.previewText}
              </p>
            </aside>
          </div>

          <div className="mt-5 flex justify-center">
            <div className="w-full max-w-2xl rounded-[24px] bg-[#F2F2F2] p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]">
              <input
                type="text"
                value={customEntry}
                onChange={(event) => setCustomEntry(event.target.value)}
                placeholder="Write your own..."
                aria-label="Custom emotion input"
                className="h-14 w-full rounded-[20px] border-0 bg-[#F2F2F2] px-5 text-base text-[#2F2F2F] outline-none placeholder:text-[#9A9A9A]"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-center">
            <Link
              to="/support-hub/resources"
              className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-[#A8DADC] px-8 text-sm font-medium text-[#1f4a4d] shadow-[0_16px_30px_-20px_rgba(61,90,90,0.48)] transition hover:scale-[1.01] hover:bg-[#99d2d4]"
            >
              Next
            </Link>
          </div>
        </section>

        <section className="rounded-[28px] bg-white px-5 py-6 shadow-[0_22px_50px_-36px_rgba(47,47,47,0.32)] sm:px-7 sm:py-7">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-heading text-[1.75rem] font-semibold tracking-tight text-[#2F2F2F]">
                Your Journey
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-[#777777] sm:text-base">
                Minimal trends from the last 7 days
              </p>
            </div>
            <button type="button" className="text-sm font-medium text-[#6A8F90] transition hover:text-[#2F2F2F]">
              View Details
            </button>
          </div>

          <div className="rounded-[26px] bg-[#FFFEFE] p-4 shadow-[0_16px_38px_-30px_rgba(47,47,47,0.26),inset_0_1px_0_rgba(255,255,255,0.9)] sm:p-6">
            <svg viewBox="0 0 760 270" className="h-[270px] w-full" role="img" aria-label="Minimal emotional trend over the last seven days">
              <defs>
                <linearGradient id="supportHubLine" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#9FD4D2" />
                  <stop offset="100%" stopColor="#86C9BC" />
                </linearGradient>
                <linearGradient id="supportHubArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#A8DADC" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#A8DADC" stopOpacity="0" />
                </linearGradient>
              </defs>

              <path d="M 28 224 H 732" stroke="#E3E3E3" strokeWidth="1.5" strokeLinecap="round" />
              <path d={`${chart.path} L 732 224 L 28 224 Z`} fill="url(#supportHubArea)" className="animate-fade-in" />
              <path d={chart.path} fill="none" stroke="url(#supportHubLine)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="animate-fade-in support-line-draw" />

              {chart.coords.map((point, index) => (
                <g key={DAY_LABELS[index]} className="animate-fade-in">
                  <circle cx={point.x} cy={point.y} r="5.5" fill="#FFFFFF" stroke="#8DCECB" strokeWidth="3" />
                  <text x={point.x} y="254" textAnchor="middle" fill="#9B9B9B" fontSize="12" fontWeight="600" letterSpacing="2">
                    {DAY_LABELS[index]}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </section>

        <section className="flex justify-center">
          <div className="inline-flex max-w-2xl items-center justify-center gap-3 rounded-full bg-white px-5 py-4 text-center text-sm leading-relaxed text-[#606868] shadow-[0_16px_34px_-28px_rgba(47,47,47,0.24)] sm:text-base">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EDF7F5] text-[#4C7576]">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
                <rect x="5" y="11" width="14" height="9" rx="2" />
                <path d="M8 11V8a4 4 0 1 1 8 0v3" strokeLinecap="round" />
              </svg>
            </span>
            <span>Your data is encrypted and private. Only you can see this.</span>
          </div>
        </section>

        <footer className="pt-2 text-center">
          <div className="flex flex-wrap justify-center gap-6 text-sm text-[#8E8E8E]">
            <a href="#" className="transition hover:text-[#636363]">Privacy Policy</a>
            <a href="#" className="transition hover:text-[#636363]">Terms of Care</a>
            <a href="#" className="transition hover:text-[#636363]">Contact Support</a>
          </div>
        </footer>
      </main>

      <button type="button" className="fixed bottom-6 right-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#8CCFCA] text-white shadow-[0_20px_40px_-20px_rgba(72,113,115,0.6)] transition hover:scale-[1.04] hover:bg-[#7EC5BF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#BFE5E0]" aria-label="Open support chat">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-7 w-7">
          <path d="M7 18.5 3.8 20l1-3.4A8 8 0 1 1 20 12a8 8 0 0 1-8 8c-1.8 0-3.5-.6-5-1.5Z" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M8.5 11.5h7" strokeLinecap="round" />
          <path d="M8.5 8.5h4" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  )
}

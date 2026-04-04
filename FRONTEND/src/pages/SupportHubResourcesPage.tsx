import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { EmergencyExit } from '../components/EmergencyExit'

const DAY_LABELS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
const TREND_POINTS = [44, 54, 50, 61, 66, 62, 72]

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

export function SupportHubResourcesPage() {
  const chart = useMemo(() => buildSmoothPath(TREND_POINTS, 760, 260, 28), [])

  return (
    <div className="min-h-svh bg-[#F7F7F7] text-[#2F2F2F]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[440px] bg-[radial-gradient(circle_at_top_left,#eef7f7_0%,rgba(247,247,247,0.95)_48%,#F7F7F7_85%)]" />

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
              const isActive = item.label === 'Resources'
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

      <main className="relative mx-auto flex w-full max-w-6xl flex-col gap-8 px-5 pb-24 pt-12 sm:px-8 sm:pt-16 lg:gap-10 lg:px-10">
        <section className="max-w-[600px]">
          <h1 className="font-heading text-[2.35rem] font-semibold leading-[1.08] tracking-[-0.03em] text-[#2F2F2F] sm:text-[3rem]">
            Hello, take a deep breath.
          </h1>
          <p className="mt-4 text-base leading-relaxed text-[#646464] sm:text-lg">
            This is your sanctuary. Explore resources designed to keep you safe, grounded, and informed at your own pace.
          </p>
        </section>

        <section className="grid gap-5 lg:grid-cols-3">
          <article className="rounded-[24px] bg-[linear-gradient(180deg,#edf8f6,#e3f1ee)] p-6 shadow-[0_24px_44px_-34px_rgba(61,90,90,0.42)] transition hover:-translate-y-1">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/70 text-[#4f7e78]">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-6 w-6">
                <path d="M12 20c0-5.3 2.4-8.7 6.9-10.3-1 5.3-4 8.8-8.8 10.3" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12 20c-3.7-2.6-4.9-6.6-3.6-11.4-3.1 1.4-5 4.2-5.3 7.4-.3 2.4 1.5 4 4 4H12Z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h2 className="font-heading mt-5 text-[1.35rem] font-semibold text-[#2F2F2F]">Grounding and Calm Mode</h2>
            <p className="mt-3 text-sm leading-relaxed text-[#5f6967] sm:text-base">
              Breathing and calming support for moments of distress.
            </p>
            <button type="button" className="mt-6 inline-flex items-center text-sm font-medium text-[#3f7374] transition hover:text-[#2F2F2F]">
              Enter Calm Space ?
            </button>
          </article>

          <article className="rounded-[24px] bg-[linear-gradient(180deg,#f5eff9,#eee5f5)] p-6 shadow-[0_24px_44px_-34px_rgba(107,90,120,0.38)] transition hover:-translate-y-1">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/70 text-[#745d85]">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-6 w-6">
                <rect x="5" y="11" width="14" height="9" rx="2" />
                <path d="M8 11V8a4 4 0 1 1 8 0v3" strokeLinecap="round" />
              </svg>
            </div>
            <h2 className="font-heading mt-5 text-[1.35rem] font-semibold text-[#2F2F2F]">Memory Safe Vault</h2>
            <p className="mt-3 text-sm leading-relaxed text-[#645a69] sm:text-base">
              Secure space for notes, audio, and memories.
            </p>
            <button type="button" className="mt-6 inline-flex items-center text-sm font-medium text-[#6c5a7a] transition hover:text-[#2F2F2F]">
              Access Vault ?
            </button>
          </article>

          <article className="rounded-[24px] bg-[#3D5A5A] p-6 text-white shadow-[0_24px_44px_-34px_rgba(61,90,90,0.6)] transition hover:-translate-y-1">
            <p className="font-heading text-[1.45rem] font-semibold leading-[1.35] text-white/95">
              You are not defined by what happened, but by the resilience you show today.
            </p>
            <p className="mt-10 text-sm text-white/70">Daily Affirmation • Mar 14</p>
          </article>
        </section>

        <section className="grid gap-5 lg:grid-cols-[1.45fr_0.8fr]">
          <article className="rounded-[26px] bg-white p-6 shadow-[0_20px_42px_-34px_rgba(47,47,47,0.28)] transition hover:-translate-y-1">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#eef5f5] text-[#4d6666]">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-6 w-6">
                <path d="M12 3v17.25m0 0c-1.47 0-2.88.27-4.19.75M12 20.25c1.47 0 2.88.27 4.19.75" strokeLinecap="round" />
                <path d="m18.75 4.97 2.62 10.73c.12.5-.11 1.03-.59 1.2a5.99 5.99 0 0 1-2.03.35c-.7 0-1.39-.12-2.03-.35-.48-.17-.71-.7-.59-1.2l2.62-10.73Z" strokeLinecap="round" strokeLinejoin="round" />
                <path d="m5.25 4.97 2.62 10.73c.12.5-.11 1.03-.59 1.2a5.99 5.99 0 0 1-2.03.35c-.7 0-1.39-.12-2.03-.35-.48-.17-.71-.7-.59-1.2L5.25 4.97Z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h2 className="font-heading mt-5 text-[1.45rem] font-semibold text-[#2F2F2F]">Your Rights Explained</h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#666666] sm:text-base">
              Simple language for better awareness and empowerment. Understanding the legal and social landscape shouldn't be overwhelming.
            </p>
            <button type="button" className="mt-6 inline-flex items-center text-sm font-medium text-[#5a7f80] transition hover:text-[#2F2F2F]">
              Read Guidance ?
            </button>
          </article>

          <article className="rounded-[26px] bg-[linear-gradient(180deg,#f4faf9,#edf5f4)] p-6 shadow-[0_20px_42px_-34px_rgba(47,47,47,0.28)] transition hover:-translate-y-1">
            <h2 className="font-heading text-[1.45rem] font-semibold text-[#2F2F2F]">Need help now?</h2>
            <p className="mt-3 text-sm leading-relaxed text-[#666666] sm:text-base">
              Speak with a professional or access crisis lines immediately. We are here to listen.
            </p>
            <button type="button" className="mt-6 inline-flex min-h-[46px] items-center justify-center rounded-full bg-[#A8DADC] px-6 text-sm font-medium text-[#1f4a4d] transition hover:bg-[#99d2d4]">
              Talk to Someone
            </button>
          </article>
        </section>

        <section className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[26px] bg-white p-6 shadow-[0_20px_42px_-34px_rgba(47,47,47,0.28)]">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="font-heading text-[1.55rem] font-semibold text-[#2F2F2F]">Your Emotional Journey</h2>
                <p className="mt-1 text-sm leading-relaxed text-[#777777] sm:text-base">
                  Reflection of your soft trends over the last week.
                </p>
              </div>
              <span className="rounded-full bg-[#eef6f5] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#5b7c7d]">
                Past 7 Days
              </span>
            </div>

            <div className="rounded-[24px] bg-[#fffefe] p-4 shadow-[0_16px_38px_-30px_rgba(47,47,47,0.26),inset_0_1px_0_rgba(255,255,255,0.9)] sm:p-6">
              <svg viewBox="0 0 760 260" className="h-[260px] w-full" role="img" aria-label="Emotional journey over the last week">
                <defs>
                  <linearGradient id="resourcesLine" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#9FD4D2" />
                    <stop offset="100%" stopColor="#92B7B6" />
                  </linearGradient>
                  <linearGradient id="resourcesArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#A8DADC" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#A8DADC" stopOpacity="0" />
                  </linearGradient>
                </defs>

                <path d="M 28 216 H 732" stroke="#E3E3E3" strokeWidth="1.5" strokeLinecap="round" />
                <path d={`${chart.path} L 732 216 L 28 216 Z`} fill="url(#resourcesArea)" className="animate-fade-in" />
                <path d={chart.path} fill="none" stroke="url(#resourcesLine)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="animate-fade-in support-line-draw" />

                {chart.coords.map((point, index) => (
                  <g key={DAY_LABELS[index]} className="animate-fade-in">
                    <circle cx={point.x} cy={point.y} r="5.5" fill="#FFFFFF" stroke="#8DCECB" strokeWidth="3" />
                    <text x={point.x} y="246" textAnchor="middle" fill="#9B9B9B" fontSize="12" fontWeight="600" letterSpacing="2">
                      {DAY_LABELS[index]}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          </div>

          <article className="overflow-hidden rounded-[26px] bg-white shadow-[0_20px_42px_-34px_rgba(47,47,47,0.28)]">
            <div className="relative h-full min-h-[320px] bg-[linear-gradient(180deg,#dfeee6,#f4f1e7)]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#fff4,transparent_45%)]" />
              <div className="absolute inset-x-10 bottom-0 h-44 rounded-t-[999px] bg-[#7da68f]/55" />
              <div className="absolute inset-x-20 bottom-0 h-28 rounded-t-[999px] bg-[#567965]/55" />
              <div className="absolute left-12 top-10 h-10 w-10 rounded-full bg-[#fff5d6] shadow-[0_0_30px_rgba(255,245,214,0.9)]" />
              <div className="absolute left-1/2 top-24 h-44 w-8 -translate-x-1/2 rounded-full bg-[#836d51]/70" />
              <div className="absolute left-1/2 top-[7.4rem] h-24 w-24 -translate-x-1/2 rounded-full bg-[#7e9f79]/80" />
              <div className="absolute bottom-8 left-1/2 h-28 w-28 -translate-x-1/2 rounded-[999px] border border-white/40 bg-[linear-gradient(180deg,#f2ead7,#e9ddc5)]" />
            </div>
          </article>
        </section>
      </main>
    </div>
  )
}

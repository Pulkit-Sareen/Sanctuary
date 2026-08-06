import { useEffect, useRef, useState } from 'react'

const NATURE_IMAGE =
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&q=85&auto=format&fit=crop'

type CalmInteractivePanelProps = {
  /** Fill a grid column height (e.g. fixed viewport split) instead of aspect-ratio box. */
  fillColumn?: boolean
}

/**
 * Gentle pointer-following parallax and soft light — soothing, low-stimulation interaction.
 */
export function CalmInteractivePanel({ fillColumn = false }: CalmInteractivePanelProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const targetRef = useRef({ x: 0.5, y: 0.5 })
  const smoothRef = useRef({ x: 0.5, y: 0.5 })
  const rafRef = useRef(0)
  const [gentleMotion, setGentleMotion] = useState(true)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setGentleMotion(!mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  useEffect(() => {
    const el = rootRef.current
    if (!el) return

    if (!gentleMotion) {
      el.style.setProperty('--mx', '0.5')
      el.style.setProperty('--my', '0.5')
      return
    }

    const tick = () => {
      const t = targetRef.current
      const s = smoothRef.current
      s.x += (t.x - s.x) * 0.045
      s.y += (t.y - s.y) * 0.045
      el.style.setProperty('--mx', String(s.x))
      el.style.setProperty('--my', String(s.y))
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [gentleMotion])

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!gentleMotion) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height
    targetRef.current = {
      x: Math.min(1, Math.max(0, x)),
      y: Math.min(1, Math.max(0, y)),
    }
  }

  const onPointerLeave = () => {
    targetRef.current = { x: 0.5, y: 0.5 }
  }

  return (
    <section
      ref={rootRef}
      className={
        fillColumn
          ? 'calm-panel relative h-full min-h-[200px] w-full cursor-default overflow-hidden rounded-[20px] shadow-[0_12px_48px_-16px_rgba(45,45,45,0.14)]'
          : 'calm-panel relative aspect-[4/3] w-full cursor-default overflow-hidden rounded-[24px] shadow-[0_12px_48px_-16px_rgba(45,45,45,0.14)] lg:min-h-[440px]'
      }
      aria-label="Calming interactive view"
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      onPointerEnter={onPointerMove}
      style={{ '--mx': '0.5', '--my': '0.5' } as React.CSSProperties}
    >
      <div
        className={
          gentleMotion
            ? 'absolute inset-0 will-change-transform'
            : 'absolute inset-0'
        }
        style={
          gentleMotion
            ? {
                transform:
                  'translate(calc((var(--mx) - 0.5) * 22px), calc((var(--my) - 0.5) * 22px)) scale(1.1)',
              }
            : undefined
        }
      >
        <img src={NATURE_IMAGE} alt="" className="h-full w-full object-cover" loading="lazy" />
      </div>

      <div
        className="pointer-events-none absolute inset-0 opacity-90 mix-blend-soft-light motion-reduce:opacity-35"
        style={{
          background: `radial-gradient(
            55% 48% at calc(var(--mx) * 100%) calc(var(--my) * 100%),
            rgba(175, 203, 255, 0.45) 0%,
            rgba(168, 218, 220, 0.2) 42%,
            transparent 72%
          )`,
        }}
      />

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#2a2520]/35 via-[#4a5568]/10 to-transparent" />

      <div
        className={`pointer-events-none absolute left-4 right-4 sm:left-6 sm:right-6 ${fillColumn ? 'bottom-4 max-h-[42%] sm:bottom-6' : 'bottom-6 sm:bottom-8 sm:left-8 sm:right-auto sm:max-w-md'}`}
      >
        <div className="rounded-[18px] border border-white/40 bg-white/45 px-4 py-4 shadow-lg backdrop-blur-xl sm:px-6 sm:py-5">
          <p className="font-heading text-sm font-medium leading-relaxed text-[#2f2f2f] sm:text-base">
            Move gently with your cursor — breathe with the scene.
            <span className="mt-1.5 block text-xs font-normal leading-snug text-[#4a4a4a] sm:text-sm">
              You are in a safe, private space. Take all the time you need.
            </span>
          </p>
        </div>
      </div>
    </section>
  )
}

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { EmergencyExit } from '../components/EmergencyExit'
import { IconBook, IconHome, IconMic, IconPencil } from '../components/Icons'
import { Waveform } from '../components/Waveform'

const NATURE_IMAGE =
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1400&q=80&auto=format&fit=crop'

export function SharePage() {
  const [recordingSeconds, setRecordingSeconds] = useState(12)
  const [isRecording, setIsRecording] = useState(true)

  useEffect(() => {
    if (!isRecording) return
    const id = window.setInterval(() => {
      setRecordingSeconds((s) => s + 1)
    }, 1000)
    return () => window.clearInterval(id)
  }, [isRecording])

  const mm = String(Math.floor(recordingSeconds / 60)).padStart(2, '0')
  const ss = String(recordingSeconds % 60).padStart(2, '0')

  return (
    <div className="animate-fade-in flex min-h-svh flex-col bg-[#faf9f7] pb-24 md:pb-8">
      {/* Top navbar — compact */}
      <header className="sticky top-0 z-40 border-b border-[#e8e4df]/80 bg-[#faf9f7]/95 backdrop-blur-sm">
        <nav
          className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8"
          aria-label="Primary"
        >
          <Link
            to="/"
            className="font-heading text-xl font-semibold tracking-tight text-[#333333]"
          >
            Sanctuary
          </Link>
          <div className="flex items-center gap-4 sm:gap-6">
            <a
              href="/#resources"
              className="hidden text-[15px] font-medium text-[#5a5a5a] transition hover:text-[#333333] sm:inline"
            >
              Resources
            </a>
            <EmergencyExit />
          </div>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-8 sm:px-8 sm:py-12">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-12 lg:items-start">
          {/* Left: calming visual */}
          <section
            className="animate-fade-in-up relative overflow-hidden rounded-[24px] shadow-[0_8px_40px_-12px_rgba(60,50,40,0.15)]"
            aria-label="Calming scenery"
          >
            <img
              src={NATURE_IMAGE}
              alt=""
              className="aspect-[4/3] w-full object-cover lg:min-h-[420px]"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#2a2520]/25 to-transparent" />
            <div className="absolute bottom-5 left-5 right-5 sm:bottom-8 sm:left-8 sm:right-8">
              <div className="rounded-[20px] border border-white/40 bg-white/55 px-5 py-4 shadow-lg backdrop-blur-md sm:px-6 sm:py-5">
                <p className="font-heading text-base font-medium leading-relaxed text-[#2d2d2d] sm:text-lg">
                  You are in a safe, private space.
                  <br />
                  Take all the time you need.
                </p>
              </div>
            </div>
          </section>

          {/* Right: interaction */}
          <section className="flex flex-col gap-8" aria-labelledby="share-heading">
            <div>
              <h1
                id="share-heading"
                className="font-heading mb-3 text-3xl font-medium leading-tight text-[#333333] sm:text-[2rem]"
              >
                What would you like to share today?
              </h1>
              <p className="text-lg leading-relaxed text-[#5a5a5a]">
                Your voice matters. Choose how you feel most comfortable
                documenting your experience.
              </p>
            </div>

            {/* Text option */}
            <article className="flex cursor-pointer items-start gap-4 rounded-[20px] border border-[#e8e4df] bg-[#f5f3f0] p-5 shadow-[0_2px_16px_-4px_rgba(0,0,0,0.06)] transition hover:border-[#dcd6cf] hover:shadow-[0_6px_24px_-6px_rgba(0,0,0,0.08)] sm:p-6">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#e8eef9] text-[#5b7aab]">
                <IconPencil className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-heading text-lg font-semibold text-[#333333]">
                      Type your story
                    </h2>
                    <p className="mt-1 text-sm leading-relaxed text-[#5a5a5a]">
                      Write at your own pace in a private editor.
                    </p>
                  </div>
                  <span className="mt-1 text-[#8a9aaf]" aria-hidden>
                    →
                  </span>
                </div>
              </div>
            </article>

            {/* Voice — active */}
            <article
              className="rounded-[22px] border-2 border-[#c5dde0] bg-gradient-to-br from-[#eef6f7] to-[#e8f0f4] p-5 shadow-[0_6px_28px_-8px_rgba(80,120,130,0.2)] sm:p-6"
              aria-labelledby="voice-title"
            >
              <div className="mb-5 flex items-start justify-between gap-3">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#d0ebee] text-[#3d7a82]">
                    <IconMic className="h-7 w-7" />
                  </div>
                  <div>
                    <h2
                      id="voice-title"
                      className="font-heading text-lg font-semibold text-[#333333]"
                    >
                      Record your voice
                    </h2>
                    <p className="mt-1 text-sm leading-relaxed text-[#5a5a5a]">
                      Speak freely. We&apos;ll capture every word safely.
                    </p>
                  </div>
                </div>
                <span className="shrink-0 rounded-full bg-[#d8f3f4] px-3 py-1 text-xs font-semibold tracking-wide text-[#2d6a6e]">
                  ACTIVE
                </span>
              </div>

              <div className="mb-5 rounded-[16px] bg-[#e8ecef] px-4 py-5">
                {isRecording ? <Waveform /> : null}
                <p className="mt-3 text-center text-sm font-medium tabular-nums text-[#5a5a5a]">
                  {mm}:{ss} / {isRecording ? 'RECORDING…' : 'PAUSED'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsRecording(false)}
                className="w-full min-h-12 rounded-[14px] bg-[#cdb4db] px-4 py-3 text-base font-medium text-[#3d2f45] shadow-sm transition hover:bg-[#c2a8d4] hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9d7fb0]"
              >
                Stop Recording
              </button>

              <button
                type="button"
                className="mt-4 w-full py-2 text-sm text-[#7a7880] underline decoration-[#d4d0cc] underline-offset-4 transition hover:text-[#5a5855]"
              >
                Save for Later
              </button>
            </article>
          </section>
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#e5e1dc] bg-[#faf9f7]/95 py-3 backdrop-blur-md md:hidden"
        aria-label="Mobile navigation"
      >
        <div className="mx-auto flex max-w-md justify-around px-4">
          <Link
            to="/"
            className="flex min-h-12 min-w-[4.5rem] flex-col items-center justify-center gap-1 rounded-xl px-4 text-[#5a5a5a] transition hover:bg-[#f0ebe6] hover:text-[#333333]"
          >
            <IconHome className="h-6 w-6" />
            <span className="text-xs font-medium">Home</span>
          </Link>
          <a
            href="/#resources"
            className="flex min-h-12 min-w-[4.5rem] flex-col items-center justify-center gap-1 rounded-xl px-4 text-[#5a5a5a] transition hover:bg-[#f0ebe6] hover:text-[#333333]"
          >
            <IconBook className="h-6 w-6" />
            <span className="text-xs font-medium">Resources</span>
          </a>
        </div>
      </nav>
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { EmergencyExit } from '../components/EmergencyExit'
import { API_BASE_URL } from '../config'

const BASE_URL = API_BASE_URL
const WS_BASE_URL = BASE_URL.replace(/^http/i, 'ws')

function SharePage() {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [question, setQuestion] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const startedRef = useRef(false)

  // Start session (guarded for React StrictMode in development)
  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true

    const startSession = async () => {
      try {
        const res = await fetch(`${BASE_URL}/start-session`, {
          method: 'POST',
        })
        const data = await res.json()

        console.log('Session ID:', data.session_id)
        setSessionId(data.session_id)
      } catch (err) {
        console.error('Error starting session:', err)
      }
    }

    startSession()
  }, [])

  // Connect WebSocket
  useEffect(() => {
    if (!sessionId) return

    const ws = new WebSocket(`${WS_BASE_URL}/ws/${sessionId}`)
    wsRef.current = ws

    ws.onopen = () => {
      console.log('WebSocket connected')
    }

    ws.onmessage = (event) => {
      console.log('WS message:', event.data)

      const data = JSON.parse(event.data)

      if (data.type === 'question_update') {
        setQuestion(data.question)
      }
    }

    ws.onerror = (err) => {
      console.error('WebSocket error:', err)
    }

    ws.onclose = () => {
      console.log('WebSocket disconnected')
    }

    return () => ws.close()
  }, [sessionId])

  // Fallback: fetch initial question
  useEffect(() => {
    if (!sessionId) return

    const fetchInitial = async () => {
      try {
        const res = await fetch(`${BASE_URL}/next-question/${sessionId}`)
        const data = await res.json()

        console.log('Initial question:', data)

        if (data.question) {
          setQuestion(data.question)
        }
      } catch (err) {
        console.error('Initial fetch error:', err)
      }
    }

    fetchInitial()
  }, [sessionId])

  // Send dummy audio
  const sendDummyAudio = async () => {
    if (!sessionId) return

    setIsSubmitting(true)
    try {
      const blob = new Blob(['dummy audio'], { type: 'audio/wav' })
      const formData = new FormData()
      formData.append('file', blob, 'audio.wav')

      const res = await fetch(`${BASE_URL}/submit-answer/${sessionId}`, {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()

      if (data.next_question) {
        setQuestion(data.next_question)
      }
    } catch (err) {
      console.error('Submit error:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-svh bg-[#f7f7f7] text-[#2f2f2f]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(circle_at_top,#eef6f5_0%,rgba(247,247,247,0.96)_52%,#f7f7f7_85%)]" />

      <header className="sticky top-0 z-40 border-b border-[#e8e8e8]/80 bg-[#f7f7f7]/92 backdrop-blur-sm">
        <nav
          className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8"
          aria-label="Primary"
        >
          <Link
            to="/"
            className="font-heading text-xl font-semibold tracking-tight text-[#333333] transition hover:text-[#4a5568]"
          >
            Sanctuary
          </Link>

          <div className="hidden items-center gap-8 sm:flex">
            <Link to="/" className="text-[15px] font-medium text-[#5a5a5a] transition hover:text-[#333333]">
              Home
            </Link>
            <a href="/#resources" className="text-[15px] font-medium text-[#5a5a5a] transition hover:text-[#333333]">
              Resources
            </a>


















































































































































































































































































































































































































































































































































































          </div>

          <EmergencyExit />
        </nav>
      </header>

      <main className="relative mx-auto flex w-full max-w-5xl flex-1 items-center justify-center px-5 py-14 sm:px-8 sm:py-20">
        <div className="grid w-full items-center gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-12">
          <section className="rounded-[28px] bg-[linear-gradient(180deg,#eaf4f3,#ddeceb)] p-8 shadow-[0_24px_50px_-36px_rgba(47,47,47,0.35)]">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.26em] text-[#7b8f96]">
              Sanctuary Prompt
            </p>
            <h1 className="font-heading text-[2rem] font-semibold leading-[1.08] tracking-[-0.03em] text-[#2f2f2f] sm:text-[2.45rem]">
              Move one question at a time in a calm, focused space.
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-[#5f6668] sm:text-lg">
              The question below updates in place so the experience feels steady and easy to follow.
            </p>
            <div className="mt-8 inline-flex rounded-full bg-white/80 px-4 py-2 text-sm font-medium text-[#587173] shadow-[0_12px_28px_-22px_rgba(47,47,47,0.4)]">
              {sessionId ? 'Session connected' : 'Preparing your session...'}
            </div>
          </section>

          <section className="rounded-[30px] border border-white/80 bg-white/95 p-5 shadow-[0_26px_60px_-34px_rgba(47,47,47,0.28)] backdrop-blur-sm sm:p-7 lg:p-8">
            <div className="rounded-[24px] bg-[linear-gradient(180deg,#ffffff,#fbfbfb)] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] sm:p-8">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#94a0aa]">
                Next Question
              </p>

              <div className="min-h-[180px] rounded-[22px] bg-[#f6f5f3] px-5 py-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] sm:min-h-[220px] sm:px-6 sm:py-7">
                <p className="font-heading text-[1.55rem] font-semibold leading-[1.18] tracking-[-0.02em] text-[#2f2f2f] sm:text-[1.9rem]">
                  {question || 'Loading your first question...'}
                </p>
                <p className="mt-4 max-w-xl text-sm leading-relaxed text-[#6c6c6c] sm:text-base">
                  When you are ready, submit your answer to receive the next prompt without changing the page layout.
                </p>
              </div>

              <div className="mt-6 flex flex-col gap-3 border-t border-[#ece8e3] pt-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm leading-relaxed text-[#7a7670]">
                  {isSubmitting
                    ? 'Sending your response and preparing the next question...'
                    : 'Your next question will appear here in the same container.'}
                </div>

                <button
                  onClick={sendDummyAudio}
                  disabled={!sessionId || isSubmitting}
                  className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-[#a8dadc] px-7 text-sm font-medium text-[#204a4d] shadow-[0_14px_30px_-18px_rgba(55,104,108,0.5)] transition hover:scale-[1.01] hover:bg-[#99d2d4] disabled:cursor-not-allowed disabled:bg-[#d5e7e8] disabled:text-[#7a8b8c]"
                >
                  {isSubmitting ? 'Submitting...' : 'Get Next Question'}
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}

export default SharePage

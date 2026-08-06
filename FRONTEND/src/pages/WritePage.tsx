// import { lazy, Suspense, useMemo, useState } from 'react'
import TorchReveal from "../components/ui/torch-reveal";
import { Link, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion, type Variants } from 'framer-motion'
import { CircleStop, Menu, Mic, Sparkles, Send } from 'lucide-react'
import { EmergencyExit } from '../components/EmergencyExit'
import { Waveform } from '../components/Waveform'
import { useVoiceRecording } from '../hooks/useVoiceRecording'
import { useMemo, useState, useEffect, useRef } from 'react'
import { API_BASE_URL } from '../config'
// import { GradientWave } from '../components/ui/gradient-wave'

// const GradientWave = lazy(() =>
//   import('../components/ui/gradient-wave').then((module) => ({
//     default: module.GradientWave,
//   }))
// )

const headerBackground =
  'linear-gradient(135deg, rgba(246,241,232,0.74) 0%, rgba(246,241,232,0.56) 48%, rgba(246,241,232,0.42) 100%), linear-gradient(135deg, #5D765F 0%, #4B6650 35%, #314535 70%, #202D23 100%)'

// const waveColors = ['#405847', '#5E7C63', '#7B9980', '#F6F1E8']
// const waveNoiseFrequency: [number, number] = [0.00008, 0.00055]
// const waveDeform = { incline: 0.25, noiseAmp: 120, noiseFlow: 3.5, noiseSpeed: 8 }

// const particles = Array.from({ length: 14 }, (_, index) => ({
//   id: index,
//   left: `${(index * 29 + 5) % 100}%`,
//   size: `${(index % 4) + 2}px`,
//   duration: `${24 + (index % 5) * 4}s`,
//   delay: `${(index % 6) * 1.3}s`,
// }))

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.12 },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 22 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 62, damping: 22 },
  },
}

function formatMmSs(totalSec: number) {
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

// const Particles = () => (
//   <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
//     {particles.map((particle) => (
//       <div
//         key={particle.id}
//         className="particle"
//         style={{
//           left: particle.left,
//           width: particle.size,
//           height: particle.size,
//           animationDuration: particle.duration,
//           animationDelay: particle.delay,
//           opacity: 0.15,
//           backgroundColor: '#F6F1E8',
//         }}
//       />
//     ))}
//   </div>
// )

function RecordStatementHeader() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="fixed left-1/2 top-7 z-[1000] grid h-[76px] w-[92%] max-w-[1440px] -translate-x-1/2 grid-cols-[minmax(48px,1fr)_auto_minmax(160px,1fr)] items-center gap-2 rounded-[36px] border border-white/[0.08] px-3 shadow-[0_12px_40px_rgba(0,0,0,0.18)] backdrop-blur-[20px] sm:grid-cols-[minmax(200px,1fr)_auto_minmax(200px,1fr)] sm:gap-3 sm:px-6 md:px-16 2xl:px-20"
      style={{
        background: headerBackground,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      <div className="relative flex justify-start">
        <button
          type="button"
          className="flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-white/12 text-[#111111] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] transition-all duration-300 hover:scale-[1.05] hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F6F1E8]"
          aria-label="Menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((current) => !current)}
        >
          <Menu className="h-7 w-7" />
        </button>

        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute left-0 top-[60px] z-[1001] flex w-[220px] flex-col overflow-hidden rounded-[24px] border border-black/5 bg-[#F6F1E8]/95 py-3 shadow-[0_18px_45px_rgba(24,38,28,0.18)] backdrop-blur-3xl"
            >
              <Link
                to="/"
                className="px-6 py-3 text-[15px] font-semibold text-[#111111] transition-colors hover:bg-[#E9F0E7] focus-visible:bg-[#E9F0E7] focus-visible:outline-none"
                onClick={() => setMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                to="/#resources"
                className="px-6 py-3 text-[15px] font-semibold text-[#111111] transition-colors hover:bg-[#E9F0E7] focus-visible:bg-[#E9F0E7] focus-visible:outline-none"
                onClick={() => setMenuOpen(false)}
              >
                Resources
              </Link>
              <Link
                to="/legal"
                className="px-6 py-3 text-[15px] font-semibold text-[#111111] transition-colors hover:bg-[#E9F0E7] focus-visible:bg-[#E9F0E7] focus-visible:outline-none"
                onClick={() => setMenuOpen(false)}
              >
                Legal Rights
              </Link>
              <div className="mx-4 my-1 h-[1px] bg-black/10" />
              <Link
                to="/#support"
                className="px-6 py-3 text-[15px] font-semibold text-[#111111] transition-colors hover:bg-[#E9F0E7] focus-visible:bg-[#E9F0E7] focus-visible:outline-none"
                onClick={() => setMenuOpen(false)}
              >
                Support
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="font-hero hidden justify-self-center text-[20px] font-[800] tracking-normal text-[#111111] sm:block">
        Sanctuary
      </div>

      <div className="flex justify-end">
        <EmergencyExit />
      </div>
    </motion.header>
  )
}

export function WritePage() {
  const navigate = useNavigate()
  const [statement, setStatement] = useState('')
  const [hasSkipped, setHasSkipped] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [question, setQuestion] = useState('Could you please describe the event in your own words?')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [testimony, setTestimony] = useState<any>(null)
  const startedRef = useRef(false)

  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true
    const startSession = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/start-session`, { method: 'POST' })
        const data = await res.json()
        setSessionId(data.session_id)
        
        // Fetch the initial question
        const qRes = await fetch(`${API_BASE_URL}/next-question/${data.session_id}`)
        const qData = await qRes.json()
        if (qData.question) setQuestion(qData.question)
      } catch (err) {
        console.error('Error starting session:', err)
      }
    }
    startSession()
  }, [])

  const submitStatement = async () => {
    if (!sessionId || isSubmitting) return
    const trimmed = statement.trim()
    if (!trimmed) return

    setIsSubmitting(true)
    try {
      const res = await fetch(`${API_BASE_URL}/submit-answer/${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed }),
      })
      const data = await res.json()
      if (data.next_question) setQuestion(data.next_question)
      setStatement('')
    } catch (err) {
      console.error('Submit error:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const {
    isRecording,
    currentSegmentSec,
    segments,
    micError,
    startRecording,
    stopRecording,
    setMicError,
  } = useVoiceRecording(setStatement)

  const totalRecordedSec = useMemo(() => {
    const past = segments.reduce((acc, segment) => acc + segment.durationSec, 0)
    return past + (isRecording ? currentSegmentSec : 0)
  }, [currentSegmentSec, isRecording, segments])

  const endSession = async () => {
    if (isRecording) stopRecording()
    if (!sessionId) {
      navigate('/')
      return
    }

    setIsGenerating(true)
    try {
      const res = await fetch(`${API_BASE_URL}/testimony/${sessionId}`)
      const data = await res.json()
      if (!data.error) {
        setTestimony(data.structured_data)
      } else {
        console.error('Testimony generation error:', data.error)
      }
    } catch (err) {
      console.error('Testimony error:', err)
    } finally {
      setIsGenerating(false)
    }
  }

  const skipStatement = () => {
    if (isRecording) stopRecording()
    setStatement('')
    setHasSkipped(true)
  }

  return (
    
  <div className="relative min-h-svh overflow-x-hidden bg-gradient-to-br from-[#F6F1E8] via-[#F2EEE4] to-[#E8EFE5] font-sans text-[#111111] antialiased">
      {/* <GradientWave
        colors={waveColors}
        className="opacity-[0.16]"
        darkenTop
        shadowPower={4}
        noiseFrequency={waveNoiseFrequency}
        noiseSpeed={0.000006}
        deform={waveDeform}
      /> */}
      {/* <div className="sanctuary-ambient" aria-hidden="true" /> */}
      {/* <div className="noise-overlay" aria-hidden="true" /> */}
      {/* <Particles /> */}
      <RecordStatementHeader />

      <main className="relative z-10 mx-auto grid min-h-svh w-full max-w-[1400px] grid-cols-1 px-5 pb-24 pt-28 sm:px-8 md:pt-32 lg:grid-cols-[minmax(0,2fr)_minmax(220px,1fr)] lg:px-16">
        <motion.section
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="flex h-full w-full flex-col justify-center py-8 lg:pr-12"
        >
          <motion.h1
            variants={itemVariants}
            className="font-hero m-0 max-w-[840px] text-[34px] font-[800] leading-[1.1] tracking-normal text-[#111111] md:text-[44px] lg:text-[54px]"
          >
            {question}
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="mt-6 max-w-[700px] text-[18px] font-normal leading-[1.75] text-[#3F3F3F]"
          >
            Take as much time as you need.
            <br />
            You can type your experience below or use voice recording whenever you feel comfortable.
          </motion.p>

          <motion.div
            variants={itemVariants}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.35 }}
            className="mt-10 w-full max-w-[760px]"
          >
            <label className="sr-only" htmlFor="record-statement-response">
              Write your response
            </label>
            <motion.textarea
              id="record-statement-response"
              value={statement}
              onChange={(event) => {
                setStatement(event.target.value)
                if (hasSkipped) setHasSkipped(false)
              }}
              placeholder="Write your response here..."
              whileFocus={{ scale: 1.005 }}
              className="h-[180px] w-full resize-none rounded-[32px] border border-white/25 bg-[rgba(246,241,232,0.92)] p-8 text-[17px] leading-[1.8] text-[#2E2E2E] shadow-[0_12px_30px_rgba(0,0,0,0.08)] outline-none backdrop-blur-[18px] transition-all duration-300 placeholder:text-[#7A7A7A] focus:border-white/45 focus:ring-2 focus:ring-[#F6F1E8]/55"
            />
          </motion.div>

          <motion.div
            variants={itemVariants}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.3 }}
            className="mt-7 flex w-full max-w-[760px] flex-col gap-4"
          >
            <div className="flex flex-col gap-4 sm:flex-row">
              <motion.button
                type="button"
                onClick={() => startRecording(statement)}
                disabled={isRecording}
                whileHover={isRecording ? undefined : { scale: 1.03 }}
                whileTap={isRecording ? undefined : { scale: 0.99 }}
                className="inline-flex h-[54px] flex-1 items-center justify-center gap-2 rounded-full bg-[#2F4737] px-7 text-[15px] font-[700] text-white shadow-[0_10px_26px_rgba(30,45,34,0.22)] transition-all duration-300 hover:bg-[#24382C] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F6F1E8] disabled:cursor-not-allowed disabled:opacity-55"
              >
                <Mic className="h-[18px] w-[18px]" />
                Start Recording
              </motion.button>

              <motion.button
                type="button"
                onClick={stopRecording}
                disabled={!isRecording}
                whileHover={!isRecording ? undefined : { scale: 1.03 }}
                whileTap={!isRecording ? undefined : { scale: 0.99 }}
                className="inline-flex h-[54px] flex-1 items-center justify-center gap-2 rounded-full bg-[#24382C] px-7 text-[15px] font-[700] text-white shadow-[0_10px_26px_rgba(30,45,34,0.22)] transition-all duration-300 hover:bg-[#1E2F25] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F6F1E8] disabled:cursor-not-allowed disabled:opacity-55"
              >
                <CircleStop className="h-[18px] w-[18px]" />
                Stop Recording
              </motion.button>

              <motion.button
                type="button"
                onClick={submitStatement}
                disabled={isSubmitting || !statement.trim()}
                whileHover={isSubmitting || !statement.trim() ? undefined : { scale: 1.03 }}
                whileTap={isSubmitting || !statement.trim() ? undefined : { scale: 0.99 }}
                className="inline-flex h-[54px] flex-1 items-center justify-center gap-2 rounded-full bg-[#2F4737] px-7 text-[15px] font-[700] text-white shadow-[0_10px_26px_rgba(30,45,34,0.22)] transition-all duration-300 hover:bg-[#24382C] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F6F1E8] disabled:cursor-not-allowed disabled:opacity-55"
              >
                <Send className="h-[18px] w-[18px]" />
                {isSubmitting ? 'Sending...' : 'Enter'}
              </motion.button>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="rounded-[26px] border border-white/25 bg-[rgba(246,241,232,0.72)] p-5 shadow-[0_10px_28px_rgba(0,0,0,0.07)] backdrop-blur-[18px]"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="m-0 text-[15px] font-[700] text-[#111111]">
                    {isRecording ? 'Recording in progress' : 'Recording paused'}
                  </p>
                  <p className="m-0 mt-1 text-[14px] leading-relaxed text-[#505050]">
                    {segments.length > 0
                      ? `${segments.length} saved part${segments.length === 1 ? '' : 's'}`
                      : 'No audio has been saved yet.'}
                  </p>
                </div>
                <div className="text-[20px] font-[800] tabular-nums text-[#2E4A38]">
                  {formatMmSs(totalRecordedSec)}
                </div>
              </div>

              {isRecording ? (
                <div className="mt-4 rounded-[18px] bg-[#DDE7DD]/70 py-2">
                  <Waveform />
                </div>
              ) : null}

              {micError ? (
                <div
                  className="mt-4 rounded-[18px] border border-[#C9D8CA] bg-[#EEF3ED] px-4 py-3 text-[14px] leading-relaxed text-[#3F3F3F]"
                  role="status"
                >
                  {micError}{' '}
                  <button
                    type="button"
                    className="font-[700] text-[#2E4A38] underline decoration-[#9FB7A3] underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2E4A38]"
                    onClick={() => setMicError(null)}
                  >
                    Dismiss
                  </button>
                </div>
              ) : null}
            </motion.div>
          </motion.div>

          <motion.div
            variants={itemVariants}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.3 }}
            className="mt-9 flex w-full max-w-[760px] flex-col gap-3 sm:flex-row sm:justify-end"
          >
            <motion.button
              type="button"
              onClick={skipStatement}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.99 }}
              className="min-h-[50px] rounded-full border border-white/25 bg-[rgba(246,241,232,0.92)] px-7 text-[15px] font-[700] text-[#3F3F3F] shadow-[0_8px_22px_rgba(0,0,0,0.07)] transition-all duration-300 hover:bg-[#F8F4EC] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F6F1E8]"
            >
              Skip
            </motion.button>
            <motion.button
              type="button"
              onClick={endSession}
              disabled={isGenerating}
              whileHover={isGenerating ? undefined : { scale: 1.02 }}
              whileTap={isGenerating ? undefined : { scale: 0.99 }}
              className="min-h-[50px] rounded-full border border-[rgba(150,80,80,0.18)] bg-[#EBCFCF] px-7 text-[15px] font-[700] text-[#5F2E2E] shadow-[0_8px_22px_rgba(65,25,25,0.08)] transition-all duration-300 hover:bg-[#E2C1C1] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#CFA8A8] disabled:cursor-not-allowed disabled:opacity-55"
            >
              {isGenerating ? 'Generating...' : 'End Session'}
            </motion.button>
          </motion.div>

          <AnimatePresence>
            {hasSkipped ? (
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mt-5 max-w-[760px] text-[14px] leading-relaxed text-[#505050]"
                role="status"
              >
                This question has been skipped. You can keep the page open, start again, or end the session when you are
                ready.
              </motion.p>
            ) : null}
          </AnimatePresence>

          {testimony && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-10 max-w-[760px] rounded-[26px] border border-white/25 bg-[rgba(246,241,232,0.92)] p-8 shadow-[0_12px_30px_rgba(0,0,0,0.08)] backdrop-blur-[18px]"
            >
              <h3 className="m-0 mb-4 text-[22px] font-[800] text-[#111111]">Your Sanctuary Report</h3>
              <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: '15px', color: '#333', lineHeight: '1.5' }}>
                {testimony.report || JSON.stringify(testimony, null, 2)}
              </pre>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.4 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="mt-16 flex max-w-[760px] items-center gap-3 text-[#505050]"
          >
            <Sparkles className="h-5 w-5 shrink-0 text-[#2E4A38]" />
            <p className="m-0 text-[14px] leading-relaxed">
              Your pace controls this page. Nothing is submitted from here until a later review step is added.
            </p>
          </motion.div>
        </motion.section>

       <aside className="hidden lg:flex h-full items-center justify-center pl-8">

  <TorchReveal
    className="
h-[82vh]
w-full
rounded-[42px]
overflow-hidden
border border-white/10
shadow-[0_20px_60px_rgba(0,0,0,0.18)]
"
    radius={170}
    softness={0.55}
    flicker={0.15}
    idlePatrol={false}
    front={
      <div className="flex min-h-[80vh] flex-col items-center justify-center bg-[#F6F1E8] p-8 text-center">

        <h2 className="text-2xl font-bold text-[#2E4A38]">
          Take Your Time
        </h2>

        <p className="mt-4 leading-7 text-[#505050]">
          Speak or write whenever you feel comfortable.
          There is no time limit.
        </p>

      </div>
    }
    reveal={
      <div
        className="flex min-h-[420px] flex-col justify-end p-8"
        style={{
  background: `
    radial-gradient(circle at 15% 20%, rgba(196,232,103,0.95) 0%, rgba(196,232,103,0) 22%),
    radial-gradient(circle at 58% 72%, rgba(180,221,92,0.82) 0%, rgba(180,221,92,0) 24%),
    radial-gradient(circle at 92% 90%, rgba(142,191,72,0.45) 0%, rgba(142,191,72,0) 28%),
    linear-gradient(
      135deg,
      #0F1A12 0%,
      #1A2A1D 18%,
      #2D4A2F 38%,
      #284527 58%,
      #18311C 78%,
      #0B140D 100%
    )
  `,
}}
      >

        <h2 className="text-3xl font-bold text-white">
          You Are Safe

This page is private.
Take a deep breath.
There is no right or wrong way to tell your story.
        </h2>

        <p className="mt-4 leading-7 text-white/80">
          Healing Begins Here

Every sentence you write is a step forward.
You remain in control throughout the process.
        </p>

      </div>
    }
  />

</aside>
      </main>
    </div>
  )
}


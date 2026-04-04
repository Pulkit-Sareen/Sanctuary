import { useState } from 'react'
import { Link } from 'react-router-dom'
import { EmergencyExit } from '../components/EmergencyExit'
import { TestimonyQuestionStep } from '../components/TestimonyQuestionStep'
import { TESTIMONY_QUESTIONS } from '../content/testimonyQuestions'

/**
 * Minimal, fixed-viewport text testimony flow — same questions as voice, in-page steps only.
 */
export function WritePage() {
  const [questionIndex, setQuestionIndex] = useState(0)
  const [answer, setAnswer] = useState('')
  const [finished, setFinished] = useState(false)

  const current = TESTIMONY_QUESTIONS[questionIndex]

  const advance = () => {
    setAnswer('')
    if (questionIndex >= TESTIMONY_QUESTIONS.length - 1) {
      setFinished(true)
      return
    }
    setQuestionIndex((i) => i + 1)
  }

  return (
    <div className="flex h-svh flex-col overflow-hidden bg-[#f5f5f4]">
      <header className="shrink-0 border-b border-[#e5e5e4] bg-[#f5f5f4]/95 backdrop-blur-sm">
        <nav
          className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-5 py-3 sm:px-8"
          aria-label="Primary"
        >
          <Link
            to="/"
            className="font-heading text-base font-medium tracking-tight text-[#3d3d3c] transition hover:opacity-75"
          >
            Sanctuary
          </Link>
          <EmergencyExit />
        </nav>
      </header>

      <main className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-hidden px-5 py-6 sm:px-10">
        {finished ? (
          <div
            key="done"
            className="animate-fade-in w-full max-w-md text-center"
          >
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#9a9a98]">
              Thank you
            </p>
            <p className="font-heading text-lg font-medium leading-snug text-[#2e2e2d]">
              Take a breath. You can leave this screen whenever you wish.
            </p>
            <Link
              to="/"
              className="mt-8 inline-flex min-h-[44px] items-center justify-center rounded-full bg-[#a8dadc] px-8 text-sm font-medium text-[#1f4a4d] transition hover:bg-[#9dd2d5]"
            >
              Home
            </Link>
          </div>
        ) : current ? (
          <div key={questionIndex} className="w-full max-w-md">
            <TestimonyQuestionStep
              question={current}
              stepLabel={`Question ${questionIndex + 1} of ${TESTIMONY_QUESTIONS.length}`}
              answer={answer}
              onAnswerChange={setAnswer}
              onProceed={advance}
              onSkip={advance}
              isLast={questionIndex === TESTIMONY_QUESTIONS.length - 1}
              compact
            />
          </div>
        ) : null}
      </main>
    </div>
  )
}

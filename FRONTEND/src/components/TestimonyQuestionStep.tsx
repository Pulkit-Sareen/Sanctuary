import type { TestimonyQuestion } from '../content/testimonyQuestions'

type Props = {
  question: TestimonyQuestion
  stepLabel: string
  answer: string
  onAnswerChange: (value: string) => void
  onProceed: () => void
  onSkip: () => void
  isLast: boolean
  /** Smaller textarea for tight layouts (e.g. fixed viewport text flow). */
  compact?: boolean
  /** Keeps actions anchored inside a fixed-height panel. */
  fillHeight?: boolean
  /** Hides textarea for voice-first flows that should stay in the same shell. */
  hideAnswerField?: boolean
  /** Hides the shared action row when a parent provides custom controls. */
  hideActions?: boolean
}

/**
 * Shared calm question + Proceed / Skip for voice and text flows.
 */
export function TestimonyQuestionStep({
  question,
  stepLabel,
  answer,
  onAnswerChange,
  onProceed,
  onSkip,
  isLast,
  compact,
  fillHeight,
  hideAnswerField,
  hideActions,
}: Props) {
  return (
    <div
      className={`animate-fade-in flex w-full max-w-xl flex-col ${
        fillHeight ? 'min-h-0 flex-1' : ''
      }`}
    >
      <p className="mb-2 text-center text-[11px] font-semibold uppercase tracking-[0.22em] text-[#9aa5b0] sm:text-left">
        {stepLabel}
      </p>
      <h2 className="font-heading mb-3 text-center text-[1.35rem] font-semibold leading-snug text-[#2a2a2a] sm:text-left sm:text-[1.5rem]">
        {question.prompt}
      </h2>
      <p className="mb-5 text-center text-sm leading-relaxed text-[#6f6f6f] sm:text-left">
        {question.hint}
      </p>

      {hideAnswerField ? (
        <div className="rounded-[18px] border border-[#e4e4e4] bg-[#fafafa] px-4 py-4 text-center text-[15px] leading-relaxed text-[#5a5a5a] shadow-inner sm:text-left">
          Continue with your voice response, then move to the next question when you feel ready.
        </div>
      ) : (
        <>
          <label className="sr-only" htmlFor={`testimony-answer-${question.id}`}>
            Your response
          </label>
          <textarea
            id={`testimony-answer-${question.id}`}
            value={answer}
            onChange={(e) => onAnswerChange(e.target.value)}
            rows={compact ? 3 : 4}
            className={`w-full resize-none rounded-[18px] border border-[#e4e4e4] bg-[#fafafa] px-4 py-3 text-[15px] leading-relaxed text-[#2f2f2f] shadow-inner placeholder:text-[#a8a8a8] focus:border-[#c5dde0] focus:outline-none focus:ring-2 focus:ring-[#a8dadc]/35 ${
              compact ? 'max-h-[120px]' : 'max-h-[160px]'
            }`}
            placeholder="Type here if you wish..."
          />
        </>
      )}

      {hideActions ? null : (
        <div
          className={`mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end ${
            fillHeight ? 'mt-auto pt-2' : ''
          }`}
        >
          <button
            type="button"
            onClick={onSkip}
            className="order-2 min-h-[46px] rounded-full border border-[#d6d6d6] bg-white px-6 text-sm font-medium text-[#5c5c5c] transition hover:border-[#c8c8c8] hover:bg-[#f9f9f9] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b8b8b8] sm:order-1"
          >
            Skip
          </button>
          <button
            type="button"
            onClick={onProceed}
            className="order-1 min-h-[46px] rounded-full bg-[#b8a8c9] px-6 text-sm font-medium text-[#2f2838] shadow-[0_4px_18px_-6px_rgba(80,70,95,0.35)] transition hover:bg-[#ae9ebe] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9a8bab] sm:order-2"
          >
            {isLast ? 'Finish' : 'Proceed'}
          </button>
        </div>
      )}
    </div>
  )
}

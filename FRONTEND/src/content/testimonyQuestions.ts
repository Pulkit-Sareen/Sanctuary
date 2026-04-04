/**
 * Testimony prompts — first item is always the comfort check. Replace copy when final.
 */
export type TestimonyQuestion = {
  id: string
  prompt: string
  hint: string
}

export const TESTIMONY_QUESTIONS: TestimonyQuestion[] = [
  {
    id: 'comfort',
    prompt:
      'Before we go further, how are you feeling in this moment? There is no wrong answer.',
    hint: 'A single word or short phrase is enough, if you like.',
  },
  {
    id: 'understanding',
    prompt: 'What feels most important for someone listening to understand first?',
    hint: 'Only share what feels okay. You can leave this brief.',
  },
  {
    id: 'more',
    prompt: 'Is there anything else you want to add while it still feels safe to do so?',
    hint: 'Optional. You can skip this step.',
  },
]

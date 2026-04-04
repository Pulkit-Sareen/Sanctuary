import { useEffect, useRef, useState } from 'react'
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
    <div
      style={{
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontSize: '24px',
        fontWeight: '600',
        textAlign: 'center',
        padding: '20px',
      }}
    >
      <div style={{ maxWidth: '800px', width: '100%' }}>
        <div style={{ marginBottom: '16px' }}>{question || 'Loading...'}</div>
        <button
          onClick={sendDummyAudio}
          disabled={!sessionId || isSubmitting}
          style={{
            padding: '10px 18px',
            fontSize: '16px',
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
          }}
        >
          {isSubmitting ? 'Submitting...' : 'Submit'}
        </button>
      </div>
    </div>
  )
}

export default SharePage

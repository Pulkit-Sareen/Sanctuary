import { useEffect, useRef, useState } from 'react'
import { API_BASE_URL } from '../config'

const BASE_URL = API_BASE_URL
const WS_BASE_URL = BASE_URL.replace(/^http/i, 'ws')

function SharePage() {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [question, setQuestion] = useState('')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const wsRef = useRef<WebSocket | null>(null)
  const startedRef = useRef(false)

  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true

    const startSession = async () => {
      try {
        const res = await fetch(`${BASE_URL}/start-session`, {
          method: 'POST',
        })
        const data = await res.json()
        setSessionId(data.session_id)
      } catch (err) {
        console.error('Error starting session:', err)
        setError('Could not start session.')
      }
    }

    startSession()
  }, [])

  useEffect(() => {
    if (!sessionId) return

    const ws = new WebSocket(`${WS_BASE_URL}/ws/${sessionId}`)
    wsRef.current = ws

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.type === 'question_update') {
        setQuestion(data.question)
      }
    }

    ws.onerror = () => {
      setError('WebSocket error.')
    }

    return () => ws.close()
  }, [sessionId])

  useEffect(() => {
    if (!sessionId) return

    const fetchInitial = async () => {
      try {
        const res = await fetch(`${BASE_URL}/next-question/${sessionId}`)
        const data = await res.json()
        if (data.question) {
          setQuestion(data.question)
        }
      } catch (err) {
        console.error('Initial fetch error:', err)
      }
    }

    fetchInitial()
  }, [sessionId])

  const submitMessage = async () => {
    if (!sessionId || isSubmitting) return

    const trimmed = message.trim()
    if (!trimmed) {
      setError('Please enter your response before submitting.')
      return
    }

    setError('')
    setIsSubmitting(true)

    try {
      const res = await fetch(`${BASE_URL}/submit-answer/${sessionId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: trimmed }),
      })
      const data = await res.json()

      if (data.error) {
        setError(data.error)
        return
      }

      if (data.next_question) {
        setQuestion(data.next_question)
      }

      setMessage('')
    } catch (err) {
      console.error('Submit error:', err)
      setError('Failed to submit your response.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '20px',
      }}
    >
      <div style={{ maxWidth: '840px', width: '100%' }}>
        <div style={{ fontSize: '24px', fontWeight: 600, marginBottom: '16px' }}>
          {question || 'Loading...'}
        </div>

        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your response here..."
          rows={6}
          style={{
            width: '100%',
            padding: '12px',
            fontSize: '16px',
            border: '1px solid #ccc',
            borderRadius: '8px',
            marginBottom: '12px',
            boxSizing: 'border-box',
          }}
        />

        <button
          onClick={submitMessage}
          disabled={!sessionId || isSubmitting}
          style={{
            padding: '10px 18px',
            fontSize: '16px',
            cursor: !sessionId || isSubmitting ? 'not-allowed' : 'pointer',
          }}
        >
          {isSubmitting ? 'Submitting...' : 'Submit'}
        </button>

        {error ? (
          <div style={{ marginTop: '10px', fontSize: '14px', color: '#b00020' }}>{error}</div>
        ) : null}
      </div>
    </div>
  )
}

export default SharePage

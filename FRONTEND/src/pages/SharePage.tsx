import { useEffect, useRef, useState } from 'react'
import { API_BASE_URL } from '../config'

const BASE_URL = API_BASE_URL
const WS_BASE_URL = BASE_URL.replace(/^http/i, 'ws')

type Recognition = {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: ((event: any) => void) | null
  onerror: ((event: any) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
}

function SharePage() {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [question, setQuestion] = useState('')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [voiceStatus, setVoiceStatus] = useState('')
  const [lastTranscript, setLastTranscript] = useState('')
  const [error, setError] = useState('')
  const [testimony, setTestimony] = useState<any>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  const wsRef = useRef<WebSocket | null>(null)
  const startedRef = useRef(false)
  const recognitionRef = useRef<Recognition | null>(null)
  const manualStopRef = useRef(false)
  const baseMessageRef = useRef('')
  const finalTranscriptRef = useRef('')

  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true

    const startSession = async () => {
      try {
        const res = await fetch(`${BASE_URL}/start-session`, { method: 'POST' })
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

    ws.onerror = () => setError('WebSocket error.')
    return () => ws.close()
  }, [sessionId])

  useEffect(() => {
    if (!sessionId) return

    const fetchInitial = async () => {
      try {
        const res = await fetch(`${BASE_URL}/next-question/${sessionId}`)
        const data = await res.json()
        if (data.question) setQuestion(data.question)
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed }),
      })
      const data = await res.json()

      if (data.error) {
        setError(data.error)
        return
      }

      if (data.next_question) setQuestion(data.next_question)
      if (data.transcript_text) setLastTranscript(String(data.transcript_text))
      setMessage('')
      setVoiceStatus('')
      finalTranscriptRef.current = ''
    } catch (err) {
      console.error('Submit error:', err)
      setError('Failed to submit your response.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const fetchTestimony = async () => {
    if (!sessionId) return
    setIsGenerating(true)
    setError('')
    try {
      const res = await fetch(`${BASE_URL}/testimony/${sessionId}`)
      const data = await res.json()
      if (data.error) {
        setError(data.error)
      } else {
        setTestimony(data.structured_data)
      }
    } catch (err) {
      console.error('Testimony error:', err)
      setError('Failed to generate testimony.')
    } finally {
      setIsGenerating(false)
    }
  }

  const startVoiceToText = () => {
    if (isSubmitting || isListening) return
    setError('')

    const Ctor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!Ctor) {
      setError('Voice-to-text is not supported in this browser. Try Chrome/Edge.')
      return
    }

    manualStopRef.current = false
    finalTranscriptRef.current = ''
    baseMessageRef.current = message.trim() ? `${message.trim()} ` : ''
    setLastTranscript('')

    const recognition: Recognition = new Ctor()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onresult = (event: any) => {
      let interim = ''

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const text = event.results[i]?.[0]?.transcript ?? ''
        if (event.results[i].isFinal) {
          finalTranscriptRef.current += `${text} `
        } else {
          interim += text
        }
      }

      const finalText = finalTranscriptRef.current.trim()
      if (finalText) setLastTranscript(finalText)

      const combined = `${baseMessageRef.current}${finalTranscriptRef.current}${interim}`.trim()
      setMessage(combined)
      setVoiceStatus(interim ? 'Listening...' : 'Captured speech.')
    }

    recognition.onerror = (event: any) => {
      setVoiceStatus('')
      setIsListening(false)
      setError(`Voice recognition error: ${event?.error ?? 'unknown'}`)
    }

    recognition.onend = () => {
      if (!manualStopRef.current && isListening) {
        try {
          recognition.start()
          return
        } catch {
          // no-op
        }
      }
      setIsListening(false)
      setVoiceStatus('')
    }

    recognitionRef.current = recognition
    try {
      recognition.start()
      setIsListening(true)
      setVoiceStatus('Listening...')
    } catch {
      setError('Could not start voice recognition.')
    }
  }

  const stopVoiceToText = () => {
    manualStopRef.current = true
    recognitionRef.current?.stop()
    setIsListening(false)
    setVoiceStatus('Voice capture stopped.')
  }

  useEffect(() => {
    return () => {
      manualStopRef.current = true
      recognitionRef.current?.stop()
    }
  }, [])

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
          placeholder="Type your response here or use voice-to-text..."
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

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
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

          <button
            onClick={startVoiceToText}
            disabled={!sessionId || isSubmitting || isListening}
            style={{
              padding: '10px 18px',
              fontSize: '16px',
              cursor: !sessionId || isSubmitting || isListening ? 'not-allowed' : 'pointer',
            }}
          >
            Start Voice-to-Text
          </button>

          <button
            onClick={stopVoiceToText}
            disabled={!isListening}
            style={{
              padding: '10px 18px',
              fontSize: '16px',
              cursor: !isListening ? 'not-allowed' : 'pointer',
            }}
          >
            Stop Voice-to-Text
          </button>

          <button
            onClick={fetchTestimony}
            disabled={!sessionId || isGenerating}
            style={{
              padding: '10px 18px',
              fontSize: '16px',
              backgroundColor: '#d32f2f',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: !sessionId || isGenerating ? 'not-allowed' : 'pointer',
            }}
          >
            {isGenerating ? 'Generating Testimony...' : 'End Session'}
          </button>
        </div>

        {voiceStatus ? (
          <div style={{ marginTop: '10px', fontSize: '14px', color: '#444' }}>{voiceStatus}</div>
        ) : null}

        {lastTranscript ? (
          <div style={{ marginTop: '10px', fontSize: '14px', color: '#1b5e20' }}>
            Last transcript: {lastTranscript}
          </div>
        ) : null}

        {error ? (
          <div style={{ marginTop: '10px', fontSize: '14px', color: '#b00020' }}>{error}</div>
        ) : null}

        {testimony && (
          <div style={{ marginTop: '20px', padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '8px', border: '1px solid #ddd' }}>
            <h3 style={{ marginTop: 0, color: '#333' }}>Structured Testimony</h3>
            <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: '15px', color: '#333', lineHeight: '1.5' }}>
              {testimony.report || JSON.stringify(testimony, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}

export default SharePage

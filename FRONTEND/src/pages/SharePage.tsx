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
  const [isRecording, setIsRecording] = useState(false)
  const [recordingError, setRecordingError] = useState('')
  const wsRef = useRef<WebSocket | null>(null)
  const startedRef = useRef(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const mediaStreamRef = useRef<MediaStream | null>(null)

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

  const submitAudioBlob = async (blob: Blob) => {
    if (!sessionId) return

    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('file', blob, 'audio.webm')

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

  const startRecording = async () => {
    if (isRecording || isSubmitting) return
    setRecordingError('')

    if (!navigator.mediaDevices?.getUserMedia) {
      setRecordingError('Microphone recording is not supported in this browser.')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaStreamRef.current = stream
      audioChunksRef.current = []

      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (err) {
      console.error('Recording start error:', err)
      setRecordingError('Microphone permission denied or unavailable.')
    }
  }

  const stopRecordingAndSubmit = () => {
    const mediaRecorder = mediaRecorderRef.current
    if (!mediaRecorder || !isRecording) return

    mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
      audioChunksRef.current = []
      setIsRecording(false)

      mediaStreamRef.current?.getTracks().forEach((track) => track.stop())
      mediaStreamRef.current = null
      mediaRecorderRef.current = null

      if (audioBlob.size === 0) {
        setRecordingError('No audio captured. Please try again.')
        return
      }

      await submitAudioBlob(audioBlob)
    }

    mediaRecorder.stop()
  }

  useEffect(() => {
    return () => {
      const recorder = mediaRecorderRef.current
      if (recorder && recorder.state !== 'inactive') {
        recorder.stop()
      }
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop())
    }
  }, [])

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
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button
            onClick={startRecording}
            disabled={!sessionId || isSubmitting || isRecording}
            style={{
              padding: '10px 18px',
              fontSize: '16px',
              cursor:
                !sessionId || isSubmitting || isRecording ? 'not-allowed' : 'pointer',
            }}
          >
            {isRecording ? 'Recording...' : 'Start Recording'}
          </button>
          <button
            onClick={stopRecordingAndSubmit}  
            disabled={!isRecording || isSubmitting}
            style={{
              padding: '10px 18px',
              fontSize: '16px',
              cursor: !isRecording || isSubmitting ? 'not-allowed' : 'pointer',
            }}
          >
            {isSubmitting ? 'Submitting...' : 'Stop & Submit'}
          </button>
        </div>
        {recordingError ? (
          <div style={{ marginTop: '10px', fontSize: '14px', color: '#b00020' }}>
            {recordingError}
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default SharePage

import { useCallback, useEffect, useRef, useState } from 'react'

export type RecordingSegment = {
  durationSec: number
  blob: Blob
}

function pickMimeType(): string {
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/ogg;codecs=opus',
  ]
  for (const t of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(t)) {
      return t
    }
  }
  return ''
}

export function useVoiceRecording() {
  const [isRecording, setIsRecording] = useState(false)
  const [currentSegmentSec, setCurrentSegmentSec] = useState(0)
  const [segments, setSegments] = useState<RecordingSegment[]>([])
  const [micError, setMicError] = useState<string | null>(null)

  const streamRef = useRef<MediaStream | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const mimeRef = useRef<string>('')
  const durationRef = useRef(0)
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const clearTick = useCallback(() => {
    if (tickRef.current != null) {
      clearInterval(tickRef.current)
      tickRef.current = null
    }
  }, [])

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }, [])

  useEffect(() => {
    return () => {
      clearTick()
      stopStream()
    }
  }, [clearTick, stopStream])

  useEffect(() => {
    if (!isRecording) return
    clearTick()
    tickRef.current = setInterval(() => {
      durationRef.current += 1
      setCurrentSegmentSec(durationRef.current)
    }, 1000)
    return () => {
      clearTick()
    }
  }, [isRecording, clearTick])

  const startRecording = useCallback(async () => {
    setMicError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })
      streamRef.current = stream
      const mime = pickMimeType()
      mimeRef.current = mime
      const options = mime ? { mimeType: mime } : undefined
      const recorder = new MediaRecorder(stream, options)
      recorderRef.current = recorder
      chunksRef.current = []
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      recorder.onerror = () => {
        clearTick()
        try {
          if (recorder.state !== 'inactive') recorder.stop()
        } catch {
          /* noop */
        }
        stopStream()
        recorderRef.current = null
        setMicError('Recording was interrupted. You can try again when you feel ready.')
        setIsRecording(false)
      }
      recorder.onstop = () => {
        const type = mimeRef.current || 'audio/webm'
        const blob = new Blob(chunksRef.current, { type })
        const dur = Math.max(0, durationRef.current)
        if (blob.size > 0 || dur > 0) {
          setSegments((prev) => [...prev, { durationSec: dur, blob }])
        }
        chunksRef.current = []
        durationRef.current = 0
        setCurrentSegmentSec(0)
        stopStream()
        recorderRef.current = null
      }
      durationRef.current = 0
      setCurrentSegmentSec(0)
      recorder.start(200)
      setIsRecording(true)
    } catch {
      setMicError(
        'We could not access the microphone. Check permissions, or try again in a moment.',
      )
      setIsRecording(false)
    }
  }, [clearTick, stopStream])

  const stopRecording = useCallback(() => {
    const rec = recorderRef.current
    clearTick()
    if (!rec || rec.state === 'inactive') {
      setIsRecording(false)
      return
    }
    try {
      rec.stop()
    } catch {
      stopStream()
    }
    setIsRecording(false)
  }, [clearTick, stopStream])

  return {
    isRecording,
    currentSegmentSec,
    segments,
    micError,
    startRecording,
    stopRecording,
    setMicError,
  }
}

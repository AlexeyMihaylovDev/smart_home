import { useState, useEffect, useCallback, useRef } from 'react'
import { Mic, MicOff, Loader2, CheckCircle, XCircle, Volume2 } from 'lucide-react'
import voiceControlService, { VoiceCommand } from '../services/voiceControlService'
import { useHomeAssistant } from '../context/HomeAssistantContext'

type VoiceStatus = 'idle' | 'listening' | 'processing' | 'success' | 'error'

// Audio Waveform Component - visualizes audio input
const AudioWaveform = ({ isListening }: { isListening: boolean }) => {
    const [audioLevels, setAudioLevels] = useState<number[]>([0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1])
    const audioContextRef = useRef<AudioContext | null>(null)
    const analyserRef = useRef<AnalyserNode | null>(null)
    const animationFrameRef = useRef<number | null>(null)
    const streamRef = useRef<MediaStream | null>(null)

    useEffect(() => {
        if (isListening) {
            // Start audio visualization
            const startAudioVisualization = async () => {
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
                    streamRef.current = stream

                    const audioContext = new AudioContext()
                    audioContextRef.current = audioContext

                    const analyser = audioContext.createAnalyser()
                    analyser.fftSize = 32
                    analyserRef.current = analyser

                    const source = audioContext.createMediaStreamSource(stream)
                    source.connect(analyser)

                    const bufferLength = analyser.frequencyBinCount
                    const dataArray = new Uint8Array(bufferLength)

                    const updateLevels = () => {
                        if (!analyserRef.current) return

                        analyserRef.current.getByteFrequencyData(dataArray)

                        // Get 7 levels from the frequency data
                        const levels: number[] = []
                        for (let i = 0; i < 7; i++) {
                            const index = Math.floor((i / 7) * bufferLength)
                            const value = dataArray[index] / 255
                            // Minimum height of 0.1, max of 1
                            levels.push(Math.max(0.1, Math.min(1, value * 1.5)))
                        }
                        setAudioLevels(levels)

                        animationFrameRef.current = requestAnimationFrame(updateLevels)
                    }

                    updateLevels()
                } catch (error) {
                    console.error('[AudioWaveform] Failed to start audio visualization:', error)
                    // Fallback to animated bars without real audio
                    const animateFallback = () => {
                        const levels = Array(7).fill(0).map(() => 0.1 + Math.random() * 0.2)
                        setAudioLevels(levels)
                        animationFrameRef.current = requestAnimationFrame(animateFallback)
                    }
                    animateFallback()
                }
            }

            startAudioVisualization()
        }

        return () => {
            // Cleanup
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current)
            }
            if (audioContextRef.current) {
                audioContextRef.current.close()
                audioContextRef.current = null
            }
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop())
                streamRef.current = null
            }
            setAudioLevels([0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1])
        }
    }, [isListening])

    const hasAudio = audioLevels.some(level => level > 0.15)

    return (
        <div className="flex items-center justify-center gap-1 h-8">
            {audioLevels.map((level, index) => (
                <div
                    key={index}
                    className={`w-1 rounded-full transition-all duration-75 ${hasAudio ? 'bg-red-500' : 'bg-gray-500'
                        }`}
                    style={{
                        height: `${Math.max(4, level * 28)}px`,
                        opacity: hasAudio ? 1 : 0.5,
                    }}
                />
            ))}
        </div>
    )
}

interface VoiceControlButtonProps {
    onCommand?: (command: VoiceCommand) => void
    className?: string
}

const VoiceControlButton = ({ onCommand, className = '' }: VoiceControlButtonProps) => {
    const { api } = useHomeAssistant()
    const [status, setStatus] = useState<VoiceStatus>('idle')
    const [transcript, setTranscript] = useState('')
    const [_error, setError] = useState<string | null>(null)
    const [showFeedback, setShowFeedback] = useState(false)
    const [feedbackMessage, setFeedbackMessage] = useState('')
    const [language, setLanguage] = useState<'he-IL' | 'en-US'>('he-IL')

    const isSupported = voiceControlService.isAvailable()

    // Execute command via Home Assistant
    const executeCommand = useCallback(async (command: VoiceCommand) => {
        if (!api) {
            setError('לא מחובר ל-Home Assistant')
            setStatus('error')
            return
        }

        if (command.action === 'unknown') {
            setFeedbackMessage(`לא הבנתי: "${command.rawText}"`)
            setStatus('error')
            return
        }

        try {
            const entityType = command.entityType || 'light'
            const entityName = command.entity || ''

            // Try to find matching entity
            const states = await api.getStates()
            const matchingEntity = states.find(e => {
                const entityId = e.entity_id.toLowerCase()
                const friendlyName = (e.attributes.friendly_name || '').toLowerCase()
                return (
                    entityId.includes(entityName) ||
                    friendlyName.includes(entityName) ||
                    entityId.startsWith(`${entityType}.`)
                )
            })

            if (!matchingEntity) {
                setFeedbackMessage(`לא נמצא: ${entityName}`)
                setStatus('error')
                return
            }

            // Execute the action
            switch (command.action) {
                case 'turn_on':
                    await api.turnOn(matchingEntity.entity_id)
                    setFeedbackMessage(`הפעלתי ${matchingEntity.attributes.friendly_name || matchingEntity.entity_id}`)
                    break
                case 'turn_off':
                    await api.turnOff(matchingEntity.entity_id)
                    setFeedbackMessage(`כיביתי ${matchingEntity.attributes.friendly_name || matchingEntity.entity_id}`)
                    break
                case 'toggle':
                    await api.toggleEntity(matchingEntity.entity_id)
                    setFeedbackMessage(`החלפתי ${matchingEntity.attributes.friendly_name || matchingEntity.entity_id}`)
                    break
                case 'set_temperature':
                    if (command.value && matchingEntity.entity_id.startsWith('climate.')) {
                        await api.callService({
                            domain: 'climate',
                            service: 'set_temperature',
                            target: { entity_id: matchingEntity.entity_id },
                            service_data: { temperature: command.value }
                        })
                        setFeedbackMessage(`הגדרתי טמפרטורה ל-${command.value}°`)
                    }
                    break
                case 'set_brightness':
                    if (command.value && matchingEntity.entity_id.startsWith('light.')) {
                        await api.callService({
                            domain: 'light',
                            service: 'turn_on',
                            target: { entity_id: matchingEntity.entity_id },
                            service_data: { brightness_pct: command.value }
                        })
                        setFeedbackMessage(`הגדרתי בהירות ל-${command.value}%`)
                    }
                    break
                default:
                    setFeedbackMessage('פעולה לא נתמכת')
                    setStatus('error')
                    return
            }

            setStatus('success')
        } catch (err) {
            console.error('[VoiceControl] Command execution error:', err)
            setFeedbackMessage('שגיאה בביצוע הפקודה')
            setStatus('error')
        }
    }, [api])

    // Set up voice control event listeners
    useEffect(() => {
        const unsubStart = voiceControlService.on('start', () => {
            setStatus('listening')
            setTranscript('')
            setError(null)
            setShowFeedback(true)
        })

        const unsubEnd = voiceControlService.on('end', () => {
            if (status === 'listening') {
                setStatus('processing')
            }
        })

        const unsubTranscript = voiceControlService.on('transcript', (data: { transcript: string; isFinal: boolean }) => {
            setTranscript(data.transcript)
        })

        const unsubCommand = voiceControlService.on('command', (command: VoiceCommand) => {
            if (onCommand) {
                onCommand(command)
            }
            executeCommand(command)
        })

        const unsubError = voiceControlService.on('error', (data: { error: string }) => {
            setError(data.error)
            setStatus('error')
            setFeedbackMessage(data.error)
        })

        return () => {
            unsubStart()
            unsubEnd()
            unsubTranscript()
            unsubCommand()
            unsubError()
        }
    }, [executeCommand, onCommand, status])

    // Auto-hide feedback after success/error
    useEffect(() => {
        if (status === 'success' || status === 'error') {
            const timer = setTimeout(() => {
                setShowFeedback(false)
                setStatus('idle')
                setFeedbackMessage('')
                setTranscript('')
            }, 3000)
            return () => clearTimeout(timer)
        }
    }, [status])

    const handleClick = () => {
        if (!isSupported) {
            setError('זיהוי קולי לא נתמך בדפדפן זה')
            return
        }

        if (status === 'listening') {
            voiceControlService.stopListening()
        } else if (status === 'idle' || status === 'error' || status === 'success') {
            voiceControlService.startListening(language)
        }
    }

    const toggleLanguage = () => {
        const newLang = language === 'he-IL' ? 'en-US' : 'he-IL'
        setLanguage(newLang)
        voiceControlService.setLanguage(newLang)
    }

    const getButtonStyles = () => {
        const base = 'relative flex items-center justify-center rounded-full transition-all duration-200 shadow-lg'

        switch (status) {
            case 'listening':
                return `${base} bg-red-500 hover:bg-red-600 text-white animate-pulse shadow-red-500/50`
            case 'processing':
                return `${base} bg-blue-500 text-white shadow-blue-500/50`
            case 'success':
                return `${base} bg-green-500 text-white shadow-green-500/50`
            case 'error':
                return `${base} bg-orange-500 text-white shadow-orange-500/50`
            default:
                return `${base} bg-blue-600 hover:bg-blue-700 text-white hover:shadow-blue-500/50`
        }
    }

    const getIcon = () => {
        switch (status) {
            case 'listening':
                return <Mic size={24} className="animate-pulse" />
            case 'processing':
                return <Loader2 size={24} className="animate-spin" />
            case 'success':
                return <CheckCircle size={24} />
            case 'error':
                return <XCircle size={24} />
            default:
                return isSupported ? <Mic size={24} /> : <MicOff size={24} />
        }
    }

    if (!isSupported) {
        return null // Don't render if not supported
    }

    return (
        <div className={`fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 ${className}`}>
            {/* Feedback Popup */}
            {showFeedback && (
                <div className={`
          max-w-xs p-4 rounded-xl shadow-2xl backdrop-blur-lg
          border transition-all duration-300 animate-in slide-in-from-bottom-4
          ${status === 'error'
                        ? 'bg-red-900/90 border-red-500/50 text-red-100'
                        : status === 'success'
                            ? 'bg-green-900/90 border-green-500/50 text-green-100'
                            : 'bg-dark-card/95 border-blue-500/50 text-white'
                    }
        `}>
                    {/* Listening indicator with audio waveform */}
                    {status === 'listening' && (
                        <div className="flex flex-col items-center gap-2 mb-2">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">מקשיב...</span>
                            </div>
                            <AudioWaveform isListening={true} />
                        </div>
                    )}

                    {/* Transcript */}
                    {transcript && (
                        <div className="flex items-start gap-2">
                            <Volume2 size={16} className="flex-shrink-0 mt-0.5 text-blue-400" />
                            <p className="text-sm" dir="auto">{transcript}</p>
                        </div>
                    )}

                    {/* Processing */}
                    {status === 'processing' && (
                        <div className="flex items-center gap-2">
                            <Loader2 size={16} className="animate-spin" />
                            <span className="text-sm">מעבד פקודה...</span>
                        </div>
                    )}

                    {/* Feedback message */}
                    {feedbackMessage && (status === 'success' || status === 'error') && (
                        <p className="text-sm font-medium" dir="auto">{feedbackMessage}</p>
                    )}
                </div>
            )}

            {/* Language toggle */}
            <button
                onClick={toggleLanguage}
                className="w-10 h-10 rounded-full bg-dark-card/90 border border-dark-border text-dark-textSecondary hover:text-white hover:bg-dark-cardHover transition-colors text-xs font-bold flex items-center justify-center"
                title={language === 'he-IL' ? 'עברית' : 'English'}
            >
                {language === 'he-IL' ? 'עב' : 'EN'}
            </button>

            {/* Main microphone button */}
            <button
                onClick={handleClick}
                className={`w-14 h-14 ${getButtonStyles()}`}
                title={status === 'listening' ? 'לחץ לעצור' : 'לחץ לדבר'}
                disabled={status === 'processing'}
            >
                {getIcon()}

                {/* Ripple effect when listening */}
                {status === 'listening' && (
                    <>
                        <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-25" />
                        <span className="absolute inset-0 rounded-full bg-red-500 animate-pulse opacity-50" />
                    </>
                )}
            </button>
        </div>
    )
}

export default VoiceControlButton

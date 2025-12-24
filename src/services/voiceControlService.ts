// Voice Control Service - Using Web Speech API for speech recognition
// and natural language command parsing for Home Assistant control

// Web Speech API Type Declarations
interface SpeechRecognitionEvent extends Event {
    resultIndex: number
    results: SpeechRecognitionResultList
}

interface SpeechRecognitionResultList {
    length: number
    item(index: number): SpeechRecognitionResult
    [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionResult {
    isFinal: boolean
    length: number
    item(index: number): SpeechRecognitionAlternative
    [index: number]: SpeechRecognitionAlternative
}

interface SpeechRecognitionAlternative {
    transcript: string
    confidence: number
}

interface SpeechRecognitionErrorEvent extends Event {
    error: string
    message: string
}

interface SpeechRecognition extends EventTarget {
    continuous: boolean
    interimResults: boolean
    lang: string
    maxAlternatives: number
    onstart: ((this: SpeechRecognition, ev: Event) => any) | null
    onend: ((this: SpeechRecognition, ev: Event) => any) | null
    onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null
    onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null
    start(): void
    stop(): void
    abort(): void
}

declare var SpeechRecognition: {
    prototype: SpeechRecognition
    new(): SpeechRecognition
}

export interface VoiceCommand {
    action: 'turn_on' | 'turn_off' | 'toggle' | 'set_temperature' | 'set_brightness' | 'start' | 'stop' | 'unknown'
    entity?: string
    entityType?: 'light' | 'switch' | 'climate' | 'vacuum' | 'media_player' | 'cover'
    value?: number
    rawText: string
    confidence: number
}

export interface VoiceControlState {
    isListening: boolean
    isProcessing: boolean
    transcript: string
    error: string | null
    lastCommand: VoiceCommand | null
}

type VoiceEventType = 'start' | 'end' | 'transcript' | 'command' | 'error'
type VoiceEventCallback = (data: any) => void

// Command patterns for Hebrew and English
const COMMAND_PATTERNS = {
    turnOn: {
        he: /(?:הדלק|הפעל|פתח)\s+(?:את\s+)?(.+)/i,
        en: /(?:turn on|switch on|enable|start)\s+(?:the\s+)?(.+)/i,
    },
    turnOff: {
        he: /(?:כבה|כבי|סגור|בטל)\s+(?:את\s+)?(.+)/i,
        en: /(?:turn off|switch off|disable|stop)\s+(?:the\s+)?(.+)/i,
    },
    toggle: {
        he: /(?:החלף|שנה)\s+(?:את\s+)?(.+)/i,
        en: /(?:toggle|flip)\s+(?:the\s+)?(.+)/i,
    },
    setTemperature: {
        he: /(?:הגדר|קבע)\s+(?:את\s+)?(?:הטמפרטורה|המזגן)\s+(?:ל|ב)?(\d+)/i,
        en: /(?:set)\s+(?:the\s+)?(?:temperature|ac|air conditioner)\s+(?:to\s+)?(\d+)/i,
    },
    setBrightness: {
        he: /(?:הגדר|קבע)\s+(?:את\s+)?(?:הבהירות|העוצמה)\s+(?:ל|ב)?(\d+)/i,
        en: /(?:set)\s+(?:the\s+)?(?:brightness|dimmer)\s+(?:to\s+)?(\d+)/i,
    },
}

// Entity name mappings (Hebrew to English entity hints)
const ENTITY_MAPPINGS: Record<string, { type: string; keywords: string[] }> = {
    light: {
        type: 'light',
        keywords: ['אור', 'נורה', 'מנורה', 'תאורה', 'light', 'lamp', 'bulb'],
    },
    switch: {
        type: 'switch',
        keywords: ['מתג', 'שקע', 'switch', 'outlet', 'plug'],
    },
    climate: {
        type: 'climate',
        keywords: ['מזגן', 'מיזוג', 'טמפרטורה', 'ac', 'air conditioner', 'climate', 'temperature'],
    },
    vacuum: {
        type: 'vacuum',
        keywords: ['שואב', 'רובוט', 'ניקוי', 'vacuum', 'robot', 'cleaner'],
    },
    cover: {
        type: 'cover',
        keywords: ['תריס', 'וילון', 'blinds', 'curtain', 'cover', 'shade'],
    },
}

// Room name mappings
const ROOM_MAPPINGS: Record<string, string[]> = {
    living_room: ['סלון', 'living room', 'lounge'],
    bedroom: ['חדר שינה', 'bedroom'],
    kitchen: ['מטבח', 'kitchen'],
    bathroom: ['חדר אמבטיה', 'אמבטיה', 'bathroom'],
    office: ['משרד', 'חדר עבודה', 'office', 'study'],
    kids_room: ['חדר ילדים', 'kids room', 'children'],
}

class VoiceControlService {
    private recognition: SpeechRecognition | null = null
    private isSupported: boolean = false
    private listeners: Map<VoiceEventType, Set<VoiceEventCallback>> = new Map()
    private state: VoiceControlState = {
        isListening: false,
        isProcessing: false,
        transcript: '',
        error: null,
        lastCommand: null,
    }

    constructor() {
        this.initSpeechRecognition()
    }

    private initSpeechRecognition() {
        // Check for browser support
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

        if (!SpeechRecognition) {
            console.warn('[VoiceControl] Speech recognition not supported in this browser')
            this.isSupported = false
            return
        }

        this.isSupported = true
        const recognition = new SpeechRecognition()
        this.recognition = recognition

        // Configure recognition
        recognition.continuous = false
        recognition.interimResults = true
        recognition.maxAlternatives = 1
        // Support both Hebrew and English
        recognition.lang = 'he-IL' // Primary language Hebrew

        // Event handlers
        recognition.onstart = () => {
            this.state.isListening = true
            this.state.error = null
            this.emit('start', null)
        }

        recognition.onend = () => {
            this.state.isListening = false
            this.emit('end', null)

            // Process the final transcript
            if (this.state.transcript) {
                this.processTranscript(this.state.transcript)
            }
        }

        recognition.onresult = (event: SpeechRecognitionEvent) => {
            let finalTranscript = ''
            let interimTranscript = ''

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const result = event.results[i]
                if (result.isFinal) {
                    finalTranscript += result[0].transcript
                } else {
                    interimTranscript += result[0].transcript
                }
            }

            this.state.transcript = finalTranscript || interimTranscript
            this.emit('transcript', {
                transcript: this.state.transcript,
                isFinal: !!finalTranscript,
            })
        }

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
            console.error('[VoiceControl] Recognition error:', event.error)
            this.state.error = this.getErrorMessage(event.error)
            this.state.isListening = false
            this.emit('error', { error: this.state.error, code: event.error })
        }
    }

    private getErrorMessage(errorCode: string): string {
        const errorMessages: Record<string, string> = {
            'not-allowed': 'אנא אפשר גישה למיקרופון',
            'no-speech': 'לא זוהו דיבור. נסה שוב.',
            'audio-capture': 'לא נמצא מיקרופון',
            'network': 'שגיאת רשת',
            'aborted': 'הזיהוי בוטל',
            'service-not-allowed': 'שירות הזיהוי לא זמין',
        }
        return errorMessages[errorCode] || `שגיאה: ${errorCode}`
    }

    private processTranscript(transcript: string) {
        this.state.isProcessing = true

        const command = this.parseCommand(transcript)
        this.state.lastCommand = command
        this.state.isProcessing = false

        this.emit('command', command)
    }

    parseCommand(text: string): VoiceCommand {
        const normalizedText = text.toLowerCase().trim()

        // Try to match turn on patterns
        for (const pattern of [COMMAND_PATTERNS.turnOn.he, COMMAND_PATTERNS.turnOn.en]) {
            const match = normalizedText.match(pattern)
            if (match) {
                return {
                    action: 'turn_on',
                    entity: this.extractEntity(match[1]),
                    entityType: this.detectEntityType(match[1]),
                    rawText: text,
                    confidence: 0.9,
                }
            }
        }

        // Try to match turn off patterns
        for (const pattern of [COMMAND_PATTERNS.turnOff.he, COMMAND_PATTERNS.turnOff.en]) {
            const match = normalizedText.match(pattern)
            if (match) {
                return {
                    action: 'turn_off',
                    entity: this.extractEntity(match[1]),
                    entityType: this.detectEntityType(match[1]),
                    rawText: text,
                    confidence: 0.9,
                }
            }
        }

        // Try to match toggle patterns
        for (const pattern of [COMMAND_PATTERNS.toggle.he, COMMAND_PATTERNS.toggle.en]) {
            const match = normalizedText.match(pattern)
            if (match) {
                return {
                    action: 'toggle',
                    entity: this.extractEntity(match[1]),
                    entityType: this.detectEntityType(match[1]),
                    rawText: text,
                    confidence: 0.8,
                }
            }
        }

        // Try to match temperature patterns
        for (const pattern of [COMMAND_PATTERNS.setTemperature.he, COMMAND_PATTERNS.setTemperature.en]) {
            const match = normalizedText.match(pattern)
            if (match) {
                return {
                    action: 'set_temperature',
                    entityType: 'climate',
                    value: parseInt(match[1], 10),
                    rawText: text,
                    confidence: 0.85,
                }
            }
        }

        // Try to match brightness patterns
        for (const pattern of [COMMAND_PATTERNS.setBrightness.he, COMMAND_PATTERNS.setBrightness.en]) {
            const match = normalizedText.match(pattern)
            if (match) {
                return {
                    action: 'set_brightness',
                    entityType: 'light',
                    value: parseInt(match[1], 10),
                    rawText: text,
                    confidence: 0.85,
                }
            }
        }

        // Unknown command
        return {
            action: 'unknown',
            rawText: text,
            confidence: 0,
        }
    }

    private extractEntity(entityText: string): string {
        // Normalize and extract entity name
        let normalized = entityText.trim()

        // Try to find room mapping
        for (const [roomId, aliases] of Object.entries(ROOM_MAPPINGS)) {
            for (const alias of aliases) {
                if (normalized.includes(alias.toLowerCase())) {
                    normalized = normalized.replace(new RegExp(alias, 'gi'), roomId)
                }
            }
        }

        return normalized.replace(/\s+/g, '_').toLowerCase()
    }

    private detectEntityType(text: string): 'light' | 'switch' | 'climate' | 'vacuum' | 'media_player' | 'cover' | undefined {
        const lowerText = text.toLowerCase()

        for (const [type, { keywords }] of Object.entries(ENTITY_MAPPINGS)) {
            for (const keyword of keywords) {
                if (lowerText.includes(keyword.toLowerCase())) {
                    return type as any
                }
            }
        }

        // Default to light for common commands
        return 'light'
    }

    // Public API
    isAvailable(): boolean {
        return this.isSupported
    }

    getState(): VoiceControlState {
        return { ...this.state }
    }

    startListening(language: 'he-IL' | 'en-US' = 'he-IL'): boolean {
        if (!this.isSupported || !this.recognition) {
            this.state.error = 'זיהוי קולי לא נתמך בדפדפן זה'
            return false
        }

        if (this.state.isListening) {
            return true
        }

        try {
            this.state.transcript = ''
            this.recognition.lang = language
            this.recognition.start()
            return true
        } catch (error) {
            console.error('[VoiceControl] Failed to start:', error)
            this.state.error = 'שגיאה בהפעלת זיהוי קולי'
            return false
        }
    }

    stopListening(): void {
        if (this.recognition && this.state.isListening) {
            this.recognition.stop()
        }
    }

    setLanguage(lang: 'he-IL' | 'en-US'): void {
        if (this.recognition) {
            this.recognition.lang = lang
        }
    }

    // Event handling
    on(event: VoiceEventType, callback: VoiceEventCallback): () => void {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set())
        }
        this.listeners.get(event)!.add(callback)

        return () => {
            this.listeners.get(event)?.delete(callback)
        }
    }

    private emit(event: VoiceEventType, data: any): void {
        this.listeners.get(event)?.forEach(callback => {
            try {
                callback(data)
            } catch (error) {
                console.error('[VoiceControl] Event callback error:', error)
            }
        })
    }
}

// Singleton instance
export const voiceControlService = new VoiceControlService()
export default voiceControlService

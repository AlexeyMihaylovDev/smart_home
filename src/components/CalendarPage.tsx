import * as React from 'react'
import { useState, useEffect } from 'react'
import { ChevronRight, ChevronLeft, Plus, Trash2, Calendar as CalendarIcon, Clock, X } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'

interface CalendarEvent {
    id: string
    title: string
    description?: string
    time?: string
    type: 'event' | 'reminder' | 'task' | 'holiday'
}

type CalendarData = Record<string, CalendarEvent[]>

const CalendarPage = () => {
    const [currentDate, setCurrentDate] = useState(new Date())
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)
    const [events, setEvents] = useState<CalendarData>({})
    const [showEventModal, setShowEventModal] = useState(false)
    const [newEvent, setNewEvent] = useState({ title: '', description: '', time: '', type: 'event' })
    const [isLoading, setIsLoading] = useState(true)

    // Получение дней месяца
    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear()
        const month = date.getMonth()
        const daysInMonth = new Date(year, month + 1, 0).getDate()
        const firstDayOfMonth = new Date(year, month, 1).getDay() // 0 = Sunday

        const days = []

        // Пустые ячейки для дней предыдущего месяца
        for (let i = 0; i < firstDayOfMonth; i++) {
            days.push(null)
        }

        // Дни текущего месяца
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(new Date(year, month, i))
        }

        return days
    }

    // Загрузка событий
    useEffect(() => {
        fetchEvents()
        fetchJewishHolidays()
    }, [currentDate])

    const fetchJewishHolidays = async () => {
        try {
            const year = currentDate.getFullYear()
            const response = await fetch(`https://www.hebcal.com/hebcal?v=1&cfg=json&maj=on&min=on&mod=on&nx=on&year=${year}&month=x&ss=on&mf=on&c=on&geo=geoname&geonameid=293397`)
            if (response.ok) {
                const data = await response.json()
                const holidays: CalendarData = {}

                data.items.forEach((item: any) => {
                    const date = item.date
                    const holidayEvent: CalendarEvent = {
                        id: `hebcal-${item.date}-${item.title}`,
                        title: item.hebrew || item.title,
                        description: item.memo || item.title,
                        type: 'holiday',
                        time: ''
                    }

                    if (!holidays[date]) {
                        holidays[date] = []
                    }
                    holidays[date].push(holidayEvent)
                })

                setEvents(prev => {
                    // Merge holidays with existing events, avoiding duplicates logic if needed
                    const newEvents = { ...prev }
                    Object.keys(holidays).forEach(date => {
                        const existing = newEvents[date] || []
                        const newHolidays = holidays[date].filter(h => !existing.some(e => e.id === h.id))
                        newEvents[date] = [...existing, ...newHolidays]
                    })
                    return newEvents
                })
            }
        } catch (error) {
            console.error('Failed to fetch Jewish holidays', error)
        }
    }

    const fetchEvents = async () => {
        try {
            const userId = localStorage.getItem('user_id')
            if (!userId) return

            const response = await fetch('/api/calendar', {
                headers: {
                    'x-user-id': userId
                }
            })
            if (response.ok) {
                const data = await response.json()
                setEvents(data)
            }
        } catch (error) {
            console.error('Failed to load events', error)
        } finally {
            setIsLoading(false)
        }
    }

    const saveEvents = async (updatedEvents: CalendarData) => {
        try {
            const userId = localStorage.getItem('user_id')
            if (!userId) return

            await fetch('/api/calendar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': userId
                },
                body: JSON.stringify(updatedEvents)
            })
            setEvents(updatedEvents)
        } catch (error) {
            console.error('Failed to save events', error)
        }
    }

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
    }

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
    }

    const formatDateKey = (date: Date) => {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    }

    const handleAddEvent = () => {
        if (!selectedDate || !newEvent.title) return

        const dateKey = formatDateKey(selectedDate)
        const event: CalendarEvent = {
            id: uuidv4(),
            title: newEvent.title,
            description: newEvent.description,
            time: newEvent.time,
            type: newEvent.type as any
        }

        const updatedEvents = {
            ...events,
            [dateKey]: [...(events[dateKey] || []), event]
        }

        saveEvents(updatedEvents)
        setShowEventModal(false)
        setNewEvent({ title: '', description: '', time: '', type: 'event' })
    }

    const handleDeleteEvent = (dateKey: string, eventId: string) => {
        const updatedEvents = {
            ...events,
            [dateKey]: events[dateKey].filter(e => e.id !== eventId)
        }
        saveEvents(updatedEvents)
    }

    const days = getDaysInMonth(currentDate)
    const monthNames = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר']
    const weekDays = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳']

    return (
        <div className="h-full flex flex-col gap-6 max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white mb-2">לוח שנה</h1>
                    <p className="text-dark-textSecondary">ניהול אירועים ומשימות</p>
                </div>
                <div className="flex items-center gap-4 bg-dark-card p-2 rounded-lg border border-dark-border">
                    <button onClick={handlePrevMonth} className="p-2 hover:bg-dark-cardHover rounded-lg transition-colors">
                        <ChevronRight size={20} />
                    </button>
                    <span className="text-lg font-medium min-w-[150px] text-center">
                        {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                    </span>
                    <button onClick={handleNextMonth} className="p-2 hover:bg-dark-cardHover rounded-lg transition-colors">
                        <ChevronLeft size={20} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full min-h-0">
                {/* Календарная сетка */}
                <div className="lg:col-span-2 bg-dark-card rounded-xl border border-dark-border p-6 flex flex-col shadow-lg overflow-hidden">
                    <div className="grid grid-cols-7 gap-2 mb-4">
                        {weekDays.map(day => (
                            <div key={day} className="text-center text-dark-textSecondary text-sm font-medium py-2">
                                {day}
                            </div>
                        ))}
                    </div>
                    {isLoading ? (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-7 gap-2 flex-1 auto-rows-fr">
                            {days.map((day, index) => {
                                if (!day) return <div key={`empty-${index}`} className="bg-transparent" />

                                const dateKey = formatDateKey(day)
                                const dayEvents = events[dateKey] || []
                                const isToday = formatDateKey(new Date()) === dateKey
                                const isSelected = selectedDate && formatDateKey(selectedDate) === dateKey

                                return (
                                    <div
                                        key={index}
                                        onClick={() => setSelectedDate(day)}
                                        className={`
                                            p-2 rounded-lg border cursor-pointer transition-all relative group
                                            flex flex-col gap-1 min-h-[100px]
                                            ${isSelected
                                                ? 'border-blue-500 bg-blue-500/10 ring-2 ring-blue-500/20'
                                                : isToday
                                                    ? 'border-blue-500/50 bg-dark-bg'
                                                    : 'border-dark-border bg-dark-bg hover:border-blue-500/30'
                                            }
                                        `}
                                    >
                                        <span className={`
                                            text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full
                                            ${isToday ? 'bg-blue-600 text-white' : 'text-dark-textSecondary group-hover:text-white'}
                                        `}>
                                            {day.getDate()}
                                        </span>

                                        <div className="flex-1 flex flex-col gap-1 overflow-hidden">
                                            {dayEvents.slice(0, 3).map(event => (
                                                <div
                                                    key={event.id}
                                                    className={`text-xs px-1.5 py-0.5 rounded truncate ${event.type === 'task' ? 'bg-green-500/20 text-green-400' :
                                                        event.type === 'reminder' ? 'bg-yellow-500/20 text-yellow-400' :
                                                            event.type === 'holiday' ? 'bg-purple-500/20 text-purple-400' :
                                                                'bg-blue-500/20 text-blue-400'
                                                        }`}
                                                >
                                                    {event.time && <span className="mr-1 opacity-75">{event.time}</span>}
                                                    {event.title}
                                                </div>
                                            ))}
                                            {dayEvents.length > 3 && (
                                                <div className="text-xs text-dark-textSecondary text-center">
                                                    +{dayEvents.length - 3} נוספים
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* Панель деталей дня */}
                <div className="bg-dark-card rounded-xl border border-dark-border p-6 flex flex-col shadow-lg overflow-y-auto">
                    {selectedDate ? (
                        <>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-semibold">
                                    {selectedDate.getDate()} {monthNames[selectedDate.getMonth()]}
                                </h2>
                                <button
                                    onClick={() => setShowEventModal(true)}
                                    className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2 text-sm"
                                >
                                    <Plus size={18} />
                                    אירוע חדש
                                </button>
                            </div>

                            <div className="flex flex-col gap-4 flex-1">
                                {(events[formatDateKey(selectedDate)] || []).length > 0 ? (
                                    (events[formatDateKey(selectedDate)] || []).sort((a, b) => (a.time || '') > (b.time || '') ? 1 : -1).map(event => (
                                        <div
                                            key={event.id}
                                            className="p-4 rounded-lg bg-dark-bg border border-dark-border group hover:border-dark-textSecondary/30 transition-colors"
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        {event.type === 'event' && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                                                        {event.type === 'task' && <div className="w-2 h-2 rounded-full bg-green-500" />}
                                                        {event.type === 'reminder' && <div className="w-2 h-2 rounded-full bg-yellow-500" />}
                                                        {event.type === 'holiday' && <div className="w-2 h-2 rounded-full bg-purple-500" />}
                                                        <h3 className="font-medium text-white">{event.title}</h3>
                                                    </div>
                                                    {event.time && (
                                                        <div className="flex items-center gap-1 text-sm text-blue-400 mb-2">
                                                            <Clock size={14} />
                                                            {event.time}
                                                        </div>
                                                    )}
                                                    {event.description && (
                                                        <p className="text-sm text-dark-textSecondary">{event.description}</p>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={() => handleDeleteEvent(formatDateKey(selectedDate), event.id)}
                                                    className="text-dark-textSecondary hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 p-2"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center text-dark-textSecondary opacity-50">
                                        <CalendarIcon size={48} className="mb-4" />
                                        <p>אין אירועים ליום זה</p>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-dark-textSecondary opacity-50">
                            <CalendarIcon size={64} className="mb-4" />
                            <p className="text-lg">בחר תאריך לצפייה באירועים</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Модальное окно добавления события */}
            {showEventModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                    <div className="bg-dark-card border border-dark-border rounded-xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between p-4 border-b border-dark-border">
                            <h3 className="text-lg font-semibold text-white">אירוע חדש</h3>
                            <button onClick={() => setShowEventModal(false)} className="text-dark-textSecondary hover:text-white">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm text-dark-textSecondary mb-1">כותרת</label>
                                <input
                                    type="text"
                                    value={newEvent.title}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewEvent({ ...newEvent, title: e.target.value })}
                                    className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="שם האירוע..."
                                    autoFocus
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-dark-textSecondary mb-1">שעה</label>
                                    <input
                                        type="time"
                                        value={newEvent.time}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewEvent({ ...newEvent, time: e.target.value })}
                                        className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-dark-textSecondary mb-1">סוג</label>
                                    <select
                                        value={newEvent.type}
                                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewEvent({ ...newEvent, type: e.target.value as any })}
                                        className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="event">אירוע</option>
                                        <option value="task">משימה</option>
                                        <option value="reminder">תזכורת</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm text-dark-textSecondary mb-1">תיאור</label>
                                <textarea
                                    value={newEvent.description}
                                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewEvent({ ...newEvent, description: e.target.value })}
                                    className="w-full bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                                    placeholder="פרטים נוספים..."
                                />
                            </div>

                            <button
                                onClick={handleAddEvent}
                                disabled={!newEvent.title}
                                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2 rounded-lg transition-colors font-medium mt-2"
                            >
                                שמור אירוע
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default CalendarPage

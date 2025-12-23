import React, { useState, useEffect } from 'react'
import { Plus, Trash2, Check, ShoppingCart } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'

interface ShoppingItem {
    id: string
    text: string
    completed: boolean
}

const ShoppingListPage = () => {
    const [items, setItems] = useState<ShoppingItem[]>([])
    const [newItemText, setNewItemText] = useState('')
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        fetchItems()
    }, [])

    const fetchItems = async () => {
        try {
            const userId = localStorage.getItem('user_id')
            if (!userId) return

            const response = await fetch('/api/shopping-list', {
                headers: {
                    'x-user-id': userId
                }
            })
            if (response.ok) {
                const data = await response.json()
                setItems(data)
            }
        } catch (error) {
            console.error('Failed to load shopping list', error)
        } finally {
            setIsLoading(false)
        }
    }

    const saveItems = async (updatedItems: ShoppingItem[]) => {
        try {
            const userId = localStorage.getItem('user_id')
            if (!userId) return

            await fetch('/api/shopping-list', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': userId
                },
                body: JSON.stringify(updatedItems)
            })
            setItems(updatedItems)
        } catch (error) {
            console.error('Failed to save shopping list', error)
        }
    }

    const handleAddItem = (e?: React.FormEvent) => {
        if (e) e.preventDefault()
        if (!newItemText.trim()) return

        const newItem: ShoppingItem = {
            id: uuidv4(),
            text: newItemText.trim(),
            completed: false
        }

        const updatedItems = [...items, newItem]
        setItems(updatedItems) // Optimistic update
        saveItems(updatedItems)
        setNewItemText('')
    }

    const toggleItem = (id: string) => {
        const updatedItems = items.map(item =>
            item.id === id ? { ...item, completed: !item.completed } : item
        )
        setItems(updatedItems)
        saveItems(updatedItems)
    }

    const deleteItem = (id: string) => {
        const updatedItems = items.filter(item => item.id !== id)
        setItems(updatedItems)
        saveItems(updatedItems)
    }

    const deleteCompleted = () => {
        if (!confirm('האם אתה בטוח שברצונך למחוק את כל הפריטים שנרכשו?')) return
        const updatedItems = items.filter(item => !item.completed)
        setItems(updatedItems)
        saveItems(updatedItems)
    }

    const activeItems = items.filter(item => !item.completed)
    const completedItems = items.filter(item => item.completed)

    return (
        <div className="h-full max-w-4xl mx-auto flex flex-col gap-6 p-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
                        <ShoppingCart className="text-blue-500" />
                        רשימת קניות
                    </h1>
                    <p className="text-dark-textSecondary">ניהול מוצרים לקנייה לבית</p>
                </div>
            </div>

            {/* Input Item */}
            <div className="bg-dark-card border border-dark-border rounded-xl p-4 shadow-lg">
                <form onSubmit={handleAddItem} className="flex gap-4">
                    <input
                        type="text"
                        value={newItemText}
                        onChange={(e) => setNewItemText(e.target.value)}
                        placeholder="מה צריך לקנות?..."
                        className="flex-1 bg-dark-bg border border-dark-border rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                    <button
                        type="submit"
                        disabled={!newItemText.trim()}
                        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                    >
                        <Plus size={20} />
                        <span className="hidden sm:inline">הוסף</span>
                    </button>
                </form>
            </div>

            {/* Lists */}
            <div className="flex-1 overflow-y-auto space-y-8 bg-dark-card border border-dark-border rounded-xl p-6 shadow-lg">
                {isLoading ? (
                    <div className="flex justify-center p-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                ) : items.length === 0 ? (
                    <div className="text-center text-dark-textSecondary py-12 opacity-50 flex flex-col items-center">
                        <ShoppingCart size={64} className="mb-4" />
                        <p className="text-lg">הרשימה ריקה</p>
                        <p className="text-sm">הוסף מוצרים לרשימה כדי לא לשכוח כלום</p>
                    </div>
                ) : (
                    <>
                        {/* Active Items */}
                        <div className="space-y-2">
                            {activeItems.map(item => (
                                <div
                                    key={item.id}
                                    className="group flex items-center gap-3 p-3 rounded-lg hover:bg-dark-bg/50 transition-colors border border-transparent hover:border-dark-border"
                                >
                                    <button
                                        onClick={() => toggleItem(item.id)}
                                        className="flex-shrink-0 w-6 h-6 rounded border-2 border-dark-textSecondary hover:border-blue-500 flex items-center justify-center transition-colors"
                                    >
                                        {item.completed && <Check size={16} className="text-blue-500" />}
                                    </button>
                                    <span className="flex-1 text-white font-medium text-lg">{item.text}</span>
                                    <button
                                        onClick={() => deleteItem(item.id)}
                                        className="p-2 text-dark-textSecondary hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="מחק"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Completed Items */}
                        {completedItems.length > 0 && (
                            <div className="pt-6 border-t border-dark-border">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-semibold text-dark-textSecondary uppercase tracking-wider">
                                        נרכשו ({completedItems.length})
                                    </h3>
                                    <button
                                        onClick={deleteCompleted}
                                        className="text-xs text-red-400 hover:text-red-300 transition-colors"
                                    >
                                        מחק הכל
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {completedItems.map(item => (
                                        <div
                                            key={item.id}
                                            className="group flex items-center gap-3 p-3 rounded-lg opacity-60 hover:opacity-100 transition-all"
                                        >
                                            <button
                                                onClick={() => toggleItem(item.id)}
                                                className="flex-shrink-0 w-6 h-6 rounded border-2 border-blue-500/50 bg-blue-500/20 flex items-center justify-center transition-colors"
                                            >
                                                <Check size={16} className="text-blue-500" />
                                            </button>
                                            <span className="flex-1 text-dark-textSecondary line-through decoration-dark-textSecondary/50 font-medium text-lg">
                                                {item.text}
                                            </span>
                                            <button
                                                onClick={() => deleteItem(item.id)}
                                                className="p-2 text-dark-textSecondary hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                title="מחק"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}

export default ShoppingListPage

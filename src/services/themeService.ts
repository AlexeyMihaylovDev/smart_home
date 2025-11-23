// Сервис для управления темой приложения

export type Theme = 'dark' | 'light'

const THEME_STORAGE_KEY = 'app_theme'
const DEFAULT_THEME: Theme = 'dark'

// Кэш для синхронного доступа
let themeCache: Theme | null = null

// Получить текущую тему
export const getTheme = (): Theme => {
    if (themeCache) {
        return themeCache
    }

    if (typeof window === 'undefined') {
        return DEFAULT_THEME
    }

    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    const theme = (stored === 'light' || stored === 'dark') ? stored : DEFAULT_THEME
    themeCache = theme
    return theme
}

// Установить тему
export const setTheme = (theme: Theme): void => {
    if (typeof window === 'undefined') return

    themeCache = theme
    localStorage.setItem(THEME_STORAGE_KEY, theme)

    // Обновляем класс на html элементе
    document.documentElement.classList.remove('dark', 'light')
    document.documentElement.classList.add(theme)

    // Отправляем событие для обновления компонентов
    window.dispatchEvent(new CustomEvent('theme-changed', { detail: { theme } }))
}

// Переключить тему
export const toggleTheme = (): Theme => {
    const currentTheme = getTheme()
    const newTheme: Theme = currentTheme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
    return newTheme
}

// Инициализация темы при загрузке
export const initTheme = (): void => {
    const theme = getTheme()
    if (typeof window !== 'undefined') {
        document.documentElement.classList.add(theme)
    }
}

// Очистка кэша
export const clearThemeCache = (): void => {
    themeCache = null
}

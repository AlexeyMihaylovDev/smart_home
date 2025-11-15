import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { HomeAssistantAPI } from '../services/homeAssistantAPI'
import { getConnectionConfig, saveConnectionConfig } from '../services/apiService'

interface HomeAssistantContextType {
  api: HomeAssistantAPI | null
  isConnected: boolean
  connect: (url: string, token: string) => Promise<void>
  disconnect: () => void
}

const HomeAssistantContext = createContext<HomeAssistantContextType | undefined>(undefined)

export const useHomeAssistant = () => {
  const context = useContext(HomeAssistantContext)
  if (!context) {
    throw new Error('useHomeAssistant must be used within HomeAssistantProvider')
  }
  return context
}

interface HomeAssistantProviderProps {
  children: ReactNode
}

export const HomeAssistantProvider: React.FC<HomeAssistantProviderProps> = ({ children }) => {
  const [api, setApi] = useState<HomeAssistantAPI | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [userId, setUserId] = useState<string | null>(() => localStorage.getItem('user_id'))

  // Слушаем изменения user_id в localStorage (когда пользователь входит/выходит)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user_id') {
        setUserId(e.newValue)
      }
    }

    // Также слушаем кастомное событие для обновления при логине в том же окне
    const handleUserChange = () => {
      setUserId(localStorage.getItem('user_id'))
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('user-changed', handleUserChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('user-changed', handleUserChange)
    }
  }, [])

  const connect = async (url: string, token: string) => {
    const newApi = new HomeAssistantAPI(url, token)
    try {
      await newApi.testConnection()
      setApi(newApi)
      setIsConnected(true)
      // Сохраняем на сервер (для текущего пользователя)
      try {
        await saveConnectionConfig({ url, token })
        console.log('HomeAssistantContext: настройки сохранены на сервер для пользователя')
      } catch (error) {
        console.error('Ошибка сохранения настроек подключения на сервер:', error)
        // Не сохраняем в localStorage - все настройки должны быть на сервере
      }
    } catch (error) {
      console.error('Failed to connect to Home Assistant:', error)
      throw error
    }
  }

  const disconnect = async () => {
    setApi(null)
    setIsConnected(false)
    // Очищаем настройки на сервере (не удаляем полностью, просто очищаем)
    try {
      await saveConnectionConfig({ url: '', token: '' })
    } catch (error) {
      console.error('Ошибка очистки настроек подключения на сервере:', error)
    }
    // Не используем localStorage - все настройки на сервере
  }

  useEffect(() => {
    // Если пользователь не авторизован, отключаемся
    if (!userId) {
      setApi(null)
      setIsConnected(false)
      return
    }

    // Попытка загрузить сохраненные настройки с сервера для текущего пользователя
    const loadConnection = async () => {
      try {
        const connection = await getConnectionConfig()
        if (connection && connection.url && connection.token) {
          console.log('HomeAssistantContext: загружены настройки для пользователя, подключаемся...')
          await connect(connection.url, connection.token)
        } else {
          console.log('HomeAssistantContext: настройки Home Assistant не найдены для пользователя')
        }
      } catch (error) {
        console.error('Ошибка загрузки настроек подключения:', error)
        // Не используем localStorage - настройки должны быть на сервере
      }
    }
    loadConnection()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  return (
    <HomeAssistantContext.Provider value={{ api, isConnected, connect, disconnect }}>
      {children}
    </HomeAssistantContext.Provider>
  )
}



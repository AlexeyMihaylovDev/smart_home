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

  useEffect(() => {
    // Проверяем, есть ли пользователь
    const userId = localStorage.getItem('user_id')
    if (!userId) {
      // Если пользователь не авторизован, не пытаемся подключаться
      return
    }

    // Попытка загрузить сохраненные настройки с сервера
    const loadConnection = async () => {
      try {
        const connection = await getConnectionConfig()
        if (connection && connection.url && connection.token) {
          await connect(connection.url, connection.token)
        }
      } catch (error) {
        console.error('Ошибка загрузки настроек подключения:', error)
        // Fallback на localStorage
        const savedUrl = localStorage.getItem('ha_url')
        const savedToken = localStorage.getItem('ha_token')
        if (savedUrl && savedToken) {
          connect(savedUrl, savedToken).catch(console.error)
        }
      }
    }
    loadConnection()
  }, [])

  const connect = async (url: string, token: string) => {
    const newApi = new HomeAssistantAPI(url, token)
    try {
      await newApi.testConnection()
      setApi(newApi)
      setIsConnected(true)
      // Сохраняем на сервер
      try {
        await saveConnectionConfig({ url, token })
      } catch (error) {
        console.error('Ошибка сохранения настроек подключения на сервер:', error)
        // Fallback на localStorage
        localStorage.setItem('ha_url', url)
        localStorage.setItem('ha_token', token)
      }
    } catch (error) {
      console.error('Failed to connect to Home Assistant:', error)
      throw error
    }
  }

  const disconnect = async () => {
    setApi(null)
    setIsConnected(false)
    // Удаляем с сервера
    try {
      await saveConnectionConfig({ url: '', token: '' })
    } catch (error) {
      console.error('Ошибка удаления настроек подключения с сервера:', error)
    }
    // Также удаляем из localStorage
    localStorage.removeItem('ha_url')
    localStorage.removeItem('ha_token')
  }

  return (
    <HomeAssistantContext.Provider value={{ api, isConnected, connect, disconnect }}>
      {children}
    </HomeAssistantContext.Provider>
  )
}



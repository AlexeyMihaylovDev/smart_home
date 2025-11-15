import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { HomeAssistantAPI } from '../services/homeAssistantAPI'

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
    // Попытка загрузить сохраненные настройки
    const savedUrl = localStorage.getItem('ha_url')
    const savedToken = localStorage.getItem('ha_token')
    
    if (savedUrl && savedToken) {
      connect(savedUrl, savedToken).catch(console.error)
    }
  }, [])

  const connect = async (url: string, token: string) => {
    const newApi = new HomeAssistantAPI(url, token)
    try {
      await newApi.testConnection()
      setApi(newApi)
      setIsConnected(true)
      localStorage.setItem('ha_url', url)
      localStorage.setItem('ha_token', token)
    } catch (error) {
      console.error('Failed to connect to Home Assistant:', error)
      throw error
    }
  }

  const disconnect = () => {
    setApi(null)
    setIsConnected(false)
    localStorage.removeItem('ha_url')
    localStorage.removeItem('ha_token')
  }

  return (
    <HomeAssistantContext.Provider value={{ api, isConnected, connect, disconnect }}>
      {children}
    </HomeAssistantContext.Provider>
  )
}



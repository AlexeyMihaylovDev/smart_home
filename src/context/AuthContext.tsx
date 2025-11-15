import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { login as loginAPI } from '../services/apiService'

interface User {
  id: string
  username: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    // Загружаем пользователя из localStorage при инициализации
    const userId = localStorage.getItem('user_id')
    const username = localStorage.getItem('username')
    if (userId && username) {
      return { id: userId, username }
    }
    return null
  })

  const login = async (username: string, password: string) => {
    try {
      const response = await loginAPI(username, password)
      if (response.user) {
        console.log('AuthContext: успешный вход, пользователь:', response.user)
        setUser(response.user)
        localStorage.setItem('user_id', response.user.id)
        localStorage.setItem('username', response.user.username)
        // Отправляем событие для обновления других компонентов
        window.dispatchEvent(new Event('user-changed'))
      } else {
        throw new Error('Неверное имя пользователя или пароль')
      }
    } catch (error) {
      console.error('Ошибка входа:', error)
      throw error
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('user_id')
    localStorage.removeItem('username')
    // Настройки Home Assistant хранятся на сервере, не нужно очищать localStorage
    // Отправляем событие для обновления других компонентов
    window.dispatchEvent(new Event('user-changed'))
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}


import { useState } from 'react'
import { User, Lock } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

interface LoginModalProps {
  isOpen: boolean
  onClose?: () => void
}

const LoginModal = ({ isOpen, onClose }: LoginModalProps) => {
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!username || !password) {
      setError('Пожалуйста, заполните все поля')
      return
    }

    setLoading(true)
    setError('')

    try {
      await login(username, password)
      // Успешный вход - AuthContext обновит состояние автоматически
      if (onClose) {
        onClose()
      }
    } catch (err: any) {
      console.error('Login error:', err)
      let errorMessage = 'Не удалось войти. Проверьте имя пользователя и пароль.'
      
      if (err?.message) {
        errorMessage = err.message
      } else if (err?.code === 'ERR_NETWORK' || err?.message?.includes('Failed to fetch')) {
        errorMessage = 'Сервер недоступен. Убедитесь, что сервер запущен на порту 3001. Запустите: npm run dev'
      } else if (err?.response?.data?.error) {
        errorMessage = err.response.data.error
      }
      
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-dark-card rounded-lg p-8 w-full max-w-md border border-dark-border">
        <h2 className="text-2xl font-bold mb-6 text-center">Вход в систему</h2>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Имя пользователя
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-textSecondary" size={20} />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Введите имя пользователя"
                className="w-full bg-dark-bg border border-dark-border rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Пароль
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-textSecondary" size={20} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Введите пароль"
                className="w-full bg-dark-bg border border-dark-border rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-900 bg-opacity-30 border border-red-700 rounded-lg p-3 text-red-300 text-sm">
              <div className="font-medium mb-1">Ошибка входа:</div>
              <div className="text-xs">{error}</div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default LoginModal


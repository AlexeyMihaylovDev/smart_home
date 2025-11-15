import { useState, useEffect } from 'react'
import { useHomeAssistant } from '../context/HomeAssistantContext'
import { getConnectionConfig } from '../services/apiService'

interface ConnectionModalProps {
  isOpen: boolean
  onClose: () => void
}

const ConnectionModal = ({ isOpen, onClose }: ConnectionModalProps) => {
  const { connect } = useHomeAssistant()
  const [url, setUrl] = useState('http://192.168.3.12:8123')
  const [token, setToken] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Загружаем сохраненные настройки при открытии модального окна
    if (isOpen) {
      const loadConnection = async () => {
        try {
          const connection = await getConnectionConfig()
          if (connection) {
            setUrl(connection.url || 'http://192.168.3.12:8123')
            setToken(connection.token || '')
          } else {
            // Fallback на localStorage
            const savedUrl = localStorage.getItem('ha_url')
            const savedToken = localStorage.getItem('ha_token')
            if (savedUrl) setUrl(savedUrl)
            if (savedToken) setToken(savedToken)
          }
        } catch (error) {
          console.error('Ошибка загрузки настроек подключения:', error)
          // Fallback на localStorage
          const savedUrl = localStorage.getItem('ha_url')
          const savedToken = localStorage.getItem('ha_token')
          if (savedUrl) setUrl(savedUrl)
          if (savedToken) setToken(savedToken)
        }
      }
      loadConnection()
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleConnect = async () => {
    if (!url || !token) {
      setError('Пожалуйста, заполните все поля')
      return
    }

    // Проверка формата URL
    try {
      new URL(url)
    } catch {
      setError('Неверный формат URL. Используйте формат: http://192.168.x.x:8123')
      return
    }

    setLoading(true)
    setError('')

    try {
      await connect(url, token)
      onClose()
    } catch (err: any) {
      console.error('Connection error:', err)
      const errorMessage = err?.message || 'Не удалось подключиться. Проверьте URL и токен.'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-dark-card rounded-lg p-8 w-full max-w-md border border-dark-border">
        <h2 className="text-2xl font-bold mb-6">Подключение к Home Assistant</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              URL Home Assistant
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="http://homeassistant.local:8123"
              className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Long-Lived Access Token
            </label>
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Введите токен доступа"
              className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-dark-textSecondary mt-2">
              Создайте токен в профиле Home Assistant
            </p>
          </div>

          {error && (
            <div className="bg-red-900 bg-opacity-30 border border-red-700 rounded-lg p-3 text-red-300 text-sm">
              <div className="font-medium mb-1">Ошибка подключения:</div>
              <div className="text-xs">{error}</div>
              <div className="text-xs mt-2 opacity-75">
                Проверьте:
                <ul className="list-disc list-inside mt-1">
                  <li>Доступность Home Assistant по указанному адресу</li>
                  <li>Правильность токена доступа</li>
                  <li>Настройки CORS в Home Assistant (см. TROUBLESHOOTING.md)</li>
                </ul>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleConnect}
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              {loading ? 'Подключение...' : 'Подключиться'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConnectionModal



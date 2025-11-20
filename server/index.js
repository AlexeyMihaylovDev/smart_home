const express = require('express')
const cors = require('cors')
const fs = require('fs').promises
const path = require('path')
const crypto = require('crypto')

const app = express()
const PORT = 3001
const DATA_DIR = path.join(__dirname, 'data')
const USERS_FILE = path.join(DATA_DIR, 'users.json')

// Убеждаемся, что папка data существует
fs.mkdir(DATA_DIR, { recursive: true }).catch(console.error)

// Middleware
// Настройка CORS для доступа с других компьютеров
app.use(cors({
  origin: true, // Разрешаем все источники
  credentials: true
}))
app.use(express.json())

// Простая функция хеширования пароля
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex')
}

// Инициализация пользователей при первом запуске
async function initializeUsers() {
  try {
    const isDev = process.env.NODE_ENV !== 'production'
    let users
    try {
      users = await readDataFile('users.json')
    } catch (error) {
      // Файл не существует, это нормально
      users = null
    }
    
    if (!users || !Array.isArray(users) || users.length === 0) {
      // Создаем дефолтного пользователя
      const defaultUsers = [
        {
          id: '1',
          username: 'mihuliki',
          passwordHash: hashPassword('1q1q1q'),
          createdAt: new Date().toISOString()
        }
      ]
      await writeDataFile('users.json', defaultUsers)
      console.log('✓ Создан дефолтный пользователь: mihuliki / 1q1q1q')
      users = defaultUsers
    } else {
      console.log(`✓ Загружено пользователей: ${users.length}`)
    }
    
    // В dev режиме добавляем тестового пользователя, если его еще нет
    if (isDev) {
      const testUserExists = users.some(u => u.username === 'test')
      if (!testUserExists) {
        users.push({
          id: String(users.length + 1),
          username: 'test',
          passwordHash: hashPassword('test'),
          createdAt: new Date().toISOString()
        })
        await writeDataFile('users.json', users)
        console.log('✓ Создан тестовый пользователь для dev режима: test / test')
      } else {
        console.log('✓ Тестовый пользователь уже существует: test / test')
      }
    }
  } catch (error) {
    console.error('✗ Ошибка инициализации пользователей:', error)
  }
}

// Вспомогательная функция для чтения файла
async function readDataFile(filename) {
  try {
    const filePath = path.join(DATA_DIR, filename)
    const data = await fs.readFile(filePath, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null
    }
    throw error
  }
}

// Вспомогательная функция для записи файла
async function writeDataFile(filename, data) {
  const filePath = path.join(DATA_DIR, filename)
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8')
}

// Инициализируем пользователей при запуске (после определения функций)
initializeUsers()

// Middleware для проверки аутентификации
function requireAuth(req, res, next) {
  const userId = req.headers['x-user-id']
  if (!userId) {
    return res.status(401).json({ error: 'Требуется аутентификация' })
  }
  req.userId = userId
  next()
}

// API для аутентификации
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body
    if (!username || !password) {
      return res.status(400).json({ error: 'Имя пользователя и пароль обязательны' })
    }

    const isDev = process.env.NODE_ENV !== 'production'
    
    // В dev режиме разрешаем вход с test/test
    if (isDev && username === 'test' && password === 'test') {
      // Проверяем, существует ли пользователь в файле, если нет - создаем
      let users
      try {
        users = await readDataFile('users.json')
      } catch (error) {
        users = []
      }
      
      let testUser = users.find(u => u.username === 'test')
      if (!testUser) {
        testUser = {
          id: String((users.length || 0) + 1),
          username: 'test',
          passwordHash: hashPassword('test'),
          createdAt: new Date().toISOString()
        }
        users.push(testUser)
        await writeDataFile('users.json', users)
      }
      
      return res.json({
        success: true,
        user: {
          id: testUser.id,
          username: testUser.username
        }
      })
    }

    const users = await readDataFile('users.json')
    if (!users || !Array.isArray(users)) {
      return res.status(401).json({ error: 'Неверное имя пользователя или пароль' })
    }

    const user = users.find(u => u.username === username)
    if (!user || user.passwordHash !== hashPassword(password)) {
      return res.status(401).json({ error: 'Неверное имя пользователя или пароль' })
    }

    // Возвращаем информацию о пользователе (без пароля)
    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username
      }
    })
  } catch (error) {
    console.error('Ошибка входа:', error)
    res.status(500).json({ error: 'Ошибка входа' })
  }
})

// API для widget config (требует аутентификации)
app.get('/api/config/widget', requireAuth, async (req, res) => {
  try {
    const userId = req.userId
    const config = await readDataFile(`widget_config_${userId}.json`)
    if (config) {
      res.json(config)
    } else {
      // Возвращаем дефолтную конфигурацию
      const defaultConfig = {
        ambientLighting: {
          style: 'list',
          lights: [
            { name: 'Clock Light', entityId: null, icon: 'clock' },
            { name: 'TV Ambilight', entityId: null, icon: 'lightbulb' },
            { name: 'TV Ambilight Hyperion', entityId: null, icon: 'lightbulb' },
            { name: 'Downstairs Lights', entityId: null, icon: 'lightbulb' },
            { name: 'Interior Lights', entityId: null, icon: 'lightbulb' },
            { name: 'Bonus Room Lights', entityId: null, icon: 'lightbulb' },
          ]
        },
        ac: {
          airConditioners: []
        },
        waterHeater: {
          entityId: null,
          name: 'Водонагреватель'
        },
        sensors: {
          sensors: []
        },
        motors: {
          motors: []
        },
        bose: {
          soundbars: []
        },
        vacuum: {
          vacuums: []
        },
        tvPreview: {
          tvs: []
        },
        clock: {
          name: 'שעון',
          timezone: undefined,
          showSeconds: false,
          showDate: true,
          showDayOfWeek: true,
          format24h: true,
          style: 'digital'
        },
        led: {
          leds: []
        },
        enabledWidgets: {},
        navigationIcons: {
          icons: [
            { id: 'cameras', label: 'Cameras', iconName: 'camera', enabled: true, order: 0 },
            { id: 'home', label: 'Home', iconName: 'home', enabled: true, order: 1 },
            { id: 'network', label: 'Network', iconName: 'network', enabled: true, order: 2 },
            { id: 'vacuum', label: 'Vacuum', iconName: 'vacuum', enabled: true, order: 3 },
          ]
        }
      }
      res.json(defaultConfig)
    }
  } catch (error) {
    console.error('Ошибка чтения widget config:', error)
    res.status(500).json({ error: 'Ошибка чтения конфигурации' })
  }
})

app.post('/api/config/widget', requireAuth, async (req, res) => {
  try {
    const userId = req.userId
    await writeDataFile(`widget_config_${userId}.json`, req.body)
    res.json({ success: true })
  } catch (error) {
    console.error('Ошибка сохранения widget config:', error)
    res.status(500).json({ error: 'Ошибка сохранения конфигурации' })
  }
})

// API для dashboard layout (требует аутентификации)
app.get('/api/config/layout', requireAuth, async (req, res) => {
  try {
    const userId = req.userId
    const layout = await readDataFile(`dashboard_layout_${userId}.json`)
    if (layout) {
      res.json(layout)
    } else {
      // Возвращаем дефолтный layout
      res.json({
        layouts: [],
        cols: 12,
        rowHeight: 60
      })
    }
  } catch (error) {
    console.error('Ошибка чтения layout:', error)
    res.status(500).json({ error: 'Ошибка чтения layout' })
  }
})

app.post('/api/config/layout', requireAuth, async (req, res) => {
  try {
    const userId = req.userId
    await writeDataFile(`dashboard_layout_${userId}.json`, req.body)
    res.json({ success: true })
  } catch (error) {
    console.error('Ошибка сохранения layout:', error)
    res.status(500).json({ error: 'Ошибка сохранения layout' })
  }
})

// API для connection settings (Home Assistant) (требует аутентификации)
app.get('/api/config/connection', requireAuth, async (req, res) => {
  try {
    const userId = req.userId
    const connection = await readDataFile(`connection_${userId}.json`)
    if (connection) {
      // Не возвращаем токен в открытом виде для безопасности
      res.json({
        url: connection.url || '',
        hasToken: !!connection.token,
        token: connection.token || '' // Возвращаем токен для использования
      })
    } else {
      res.json({
        url: '',
        hasToken: false,
        token: ''
      })
    }
  } catch (error) {
    console.error('Ошибка чтения connection:', error)
    res.status(500).json({ error: 'Ошибка чтения настроек подключения' })
  }
})

app.post('/api/config/connection', requireAuth, async (req, res) => {
  try {
    const userId = req.userId
    const { url, token } = req.body
    await writeDataFile(`connection_${userId}.json`, { url, token })
    res.json({ success: true })
  } catch (error) {
    console.error('Ошибка сохранения connection:', error)
    res.status(500).json({ error: 'Ошибка сохранения настроек подключения' })
  }
})

// API для dashboard layouts (для всех дашбордов пользователя) (требует аутентификации)
app.get('/api/config/dashboard-layouts', requireAuth, async (req, res) => {
  try {
    const userId = req.userId
    const layouts = await readDataFile(`dashboard_layouts_${userId}.json`)
    if (layouts) {
      res.json(layouts)
    } else {
      // Возвращаем пустой объект
      res.json({})
    }
  } catch (error) {
    console.error('Ошибка чтения dashboard layouts:', error)
    res.status(500).json({ error: 'Ошибка чтения dashboard layouts' })
  }
})

app.post('/api/config/dashboard-layouts', requireAuth, async (req, res) => {
  try {
    const userId = req.userId
    await writeDataFile(`dashboard_layouts_${userId}.json`, req.body)
    res.json({ success: true })
  } catch (error) {
    console.error('Ошибка сохранения dashboard layouts:', error)
    res.status(500).json({ error: 'Ошибка сохранения dashboard layouts' })
  }
})

// Проверка здоровья сервера
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Сервер настроек запущен на http://0.0.0.0:${PORT}`)
  console.log(`Данные сохраняются в: ${DATA_DIR}`)
})


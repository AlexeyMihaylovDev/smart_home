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

    // Read default credentials from environment variables
    const defaultUsername = process.env.DEFAULT_USERNAME || 'admin'
    const defaultPassword = process.env.DEFAULT_PASSWORD || 'admin'

    let users
    try {
      users = await readDataFile('users.json')
    } catch (error) {
      // Файл не существует, это нормально
      users = null
    }

    if (!users || !Array.isArray(users) || users.length === 0) {
      // Создаем дефолтного пользователя из environment variables
      const defaultUsers = [
        {
          id: '1',
          username: defaultUsername,
          passwordHash: hashPassword(defaultPassword),
          createdAt: new Date().toISOString()
        }
      ]
      await writeDataFile('users.json', defaultUsers)
      console.log(`✓ Создан дефолтный пользователь: ${defaultUsername} / ${defaultPassword}`)
      if (process.env.NODE_ENV === 'production') {
        console.log('⚠️  ВАЖНО: Измените пароль по умолчанию через переменные окружения!')
      }
      users = defaultUsers
    } else {
      console.log(`✓ Загружено пользователей: ${users.length}`)

      // В production режиме проверяем, совпадает ли дефолтный юзер с ENV
      // Если ENV изменился, обновляем пользователя
      if (process.env.NODE_ENV === 'production') {
        const existingDefaultUser = users.find(u => u.id === '1')
        if (existingDefaultUser &&
          (existingDefaultUser.username !== defaultUsername ||
            existingDefaultUser.passwordHash !== hashPassword(defaultPassword))) {
          console.log(`🔄 Обновление дефолтного пользователя из переменных окружения...`)
          existingDefaultUser.username = defaultUsername
          existingDefaultUser.passwordHash = hashPassword(defaultPassword)
          await writeDataFile('users.json', users)
          console.log(`✓ Дефолтный пользователь обновлен: ${defaultUsername}`)
        }
      }
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
// Home Assistant API Proxy (to bypass CORS and resolve internal hostnames)
app.all('/api/homeassistant/*', async (req, res) => {
  try {
    // Get Home Assistant URL from user's config or environment
    const userId = req.headers['x-user-id']
    let haUrl = process.env.HOME_ASSISTANT_URL || 'http://127.0.0.1:8123'
    let haToken = process.env.HOME_ASSISTANT_TOKEN || ''

    // Try to get user-specific config
    if (userId) {
      try {
        const connection = await readDataFile(`connection_${userId}.json`)
        if (connection) {
          haUrl = connection.url
          haToken = connection.token || ''
        }
      } catch (error) {
        // Use defaults if no user config
        console.log(`[HA Proxy] No connection config for user ${userId}, using defaults`)
      }
    }

    // Extract the path after /api/homeassistant/
    const haPath = req.path.replace('/api/homeassistant', '')
    // Home Assistant API endpoints требуют /api prefix
    // IMPORTANT: Ensure we don't double slash or miss slash
    const targetUrl = `${haUrl.replace(/\/$/, '')}/api${haPath}`

    console.log(`[HA Proxy] ${req.method} ${targetUrl}`)

    // Prepare headers
    const headers = {
      'Content-Type': 'application/json'
    }
    if (haToken) {
      headers['Authorization'] = `Bearer ${haToken}`
    }

    // Forward the request to Home Assistant
    const axios = require('axios')
    const response = await axios({
      method: req.method,
      url: targetUrl,
      headers: headers,
      data: req.body,
      params: req.query,
      timeout: 10000, // 10 second timeout to prevent infinite hangs
      validateStatus: () => true // Don't throw on any status
    })

    // Forward the response back
    res.status(response.status).json(response.data)
  } catch (error) {
    console.error('Home Assistant proxy error:', error.message)
    // Check for timeout error
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      res.status(504).json({
        error: 'Gateway Timeout',
        message: 'Home Assistant did not respond in time'
      })
    } else {
      res.status(500).json({
        error: 'Proxy error',
        message: error.message
      })
    }
  }
})

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
    console.log(`[Server] Загрузка widget config для пользователя ${userId} из базы данных...`)
    const config = await readDataFile(`widget_config_${userId}.json`)
    if (config) {
      console.log(`[Server] Widget config загружен из базы данных для пользователя ${userId}:`, {
        ambientLighting: config.ambientLighting?.lights?.length || 0,
        ac: config.ac?.airConditioners?.length || 0,
        vacuum: config.vacuum?.vacuums?.length || 0,
        bose: config.bose?.soundbars?.length || 0,
        navigationIcons: config.navigationIcons?.icons?.length || 0,
        enabledWidgets: Object.keys(config.enabledWidgets || {}).length
      })
      res.json(config)
    } else {
      console.log(`[Server] Widget config не найден для пользователя ${userId}, возвращаем дефолтный`)
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
          leds: [],
          style: 'list'
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
    const config = req.body
    console.log(`[Server] Сохранение widget config для пользователя ${userId} в базу данных:`, {
      ambientLighting: config.ambientLighting?.lights?.length || 0,
      ac: config.ac?.airConditioners?.length || 0,
      vacuum: config.vacuum?.vacuums?.length || 0,
      bose: config.bose?.soundbars?.length || 0,
      navigationIcons: config.navigationIcons?.icons?.length || 0,
      enabledWidgets: Object.keys(config.enabledWidgets || {}).length
    })
    await writeDataFile(`widget_config_${userId}.json`, config)
    console.log(`[Server] Widget config успешно сохранен в базу данных для пользователя ${userId}`)
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
    console.log(`[Server] Загрузка dashboard layout для пользователя ${userId} из базы данных...`)
    const layout = await readDataFile(`dashboard_layout_${userId}.json`)
    if (layout) {
      console.log(`[Server] Dashboard layout загружен из базы данных для пользователя ${userId}:`, {
        layoutsCount: layout.layouts?.length || 0,
        cols: layout.cols,
        rowHeight: layout.rowHeight
      })
      res.json(layout)
    } else {
      console.log(`[Server] Layout не найден для пользователя ${userId}, возвращаем дефолтный`)
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
    const layout = req.body
    console.log(`[Server] Сохранение dashboard layout для пользователя ${userId}:`, {
      layoutsCount: layout.layouts?.length || 0,
      cols: layout.cols,
      rowHeight: layout.rowHeight
    })
    await writeDataFile(`dashboard_layout_${userId}.json`, layout)
    console.log(`[Server] Dashboard layout успешно сохранен в базу данных для пользователя ${userId}`)
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
    console.log(`[Server] Загрузка dashboard layouts для пользователя ${userId} из базы данных...`)
    const layouts = await readDataFile(`dashboard_layouts_${userId}.json`)
    if (layouts) {
      const dashboardIds = Object.keys(layouts || {})
      console.log(`[Server] Dashboard layouts загружены из базы данных для пользователя ${userId}:`, {
        dashboardsCount: dashboardIds.length,
        dashboardIds: dashboardIds
      })
      res.json(layouts)
    } else {
      console.log(`[Server] Dashboard layouts не найдены для пользователя ${userId}, возвращаем пустой объект`)
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
    const layouts = req.body
    const dashboardIds = Object.keys(layouts || {})
    console.log(`[Server] Сохранение dashboard layouts для пользователя ${userId}:`, {
      dashboardsCount: dashboardIds.length,
      dashboardIds: dashboardIds
    })
    await writeDataFile(`dashboard_layouts_${userId}.json`, layouts)
    console.log(`[Server] Dashboard layouts успешно сохранены в базу данных для пользователя ${userId}`)
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

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  const DIST_DIR = path.join(__dirname, '../dist')
  app.use(express.static(DIST_DIR))

  // Handle SPA routing - Express v5 compatible
  app.use((req, res, next) => {
    // Не перехватываем API запросы
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ error: 'API endpoint not found' })
    }
    res.sendFile(path.join(DIST_DIR, 'index.html'))
  })
}

// API для получения событий календаря
app.get('/api/calendar', async (req, res) => {
  try {
    const userId = req.headers['x-user-id']
    if (!userId) {
      return res.status(401).json({ error: 'Требуется аутентификация' })
    }
    const events = await readDataFile(`calendar_${userId}.json`) || []
    res.json(events)
  } catch (error) {
    console.error('Ошибка получения календаря:', error)
    res.status(500).json({ error: 'Ошибка сервера' })
  }
})

// API для сохранения событий календаря
app.post('/api/calendar', async (req, res) => {
  try {
    const userId = req.headers['x-user-id']
    if (!userId) {
      return res.status(401).json({ error: 'Требуется аутентификация' })
    }
    await writeDataFile(`calendar_${userId}.json`, req.body)
    res.json({ success: true })
  } catch (error) {
    console.error('Ошибка сохранения календаря:', error)
    res.status(500).json({ error: 'Ошибка сервера' })
  }
})

// API для списка покупок
app.get('/api/shopping-list', async (req, res) => {
  try {
    const userId = req.headers['x-user-id']
    if (!userId) {
      return res.status(401).json({ error: 'Требуется аутентификация' })
    }
    const items = await readDataFile(`shopping_list_${userId}.json`) || []
    res.json(items)
  } catch (error) {
    console.error('Ошибка получения списка покупок:', error)
    res.status(500).json({ error: 'Ошибка сервера' })
  }
})

app.post('/api/shopping-list', async (req, res) => {
  try {
    const userId = req.headers['x-user-id']
    if (!userId) {
      return res.status(401).json({ error: 'Требуется аутентификация' })
    }
    await writeDataFile(`shopping_list_${userId}.json`, req.body)
    res.json({ success: true })
  } catch (error) {
    console.error('Ошибка сохранения списка покупок:', error)
    res.status(500).json({ error: 'Ошибка сервера' })
  }
})

// Proxy to Home Assistant
// Перехватываем все запросы к /api/ (кроме тех, что обработаны выше)
// Должен быть ПОСЛЕДНИМ handler-ом перед health check
const axios = require('axios');

app.use('/api', requireAuth, async (req, res) => {
  const userId = req.userId;
  // Убираем '/api' из начала url, так как мы монтируем на '/api'
  // Но Home Assistant API тоже начинается с /api, так что ...
  // Если запрос пришел на /api/states, то req.url будет /states
  // HA ждет /api/states. Значит нам нужно добавить /api обратно

  const haPath = req.url; // /states, /services/..., etc

  try {
    // 1. Загружаем конфиг пользователя
    const connection = await readDataFile(`connection_${userId}.json`);

    if (!connection || !connection.url) {
      console.error(`[Proxy] Нет конфигурации подключения для пользователя ${userId}`);
      return res.status(502).json({ error: 'Home Assistant не настроен. Перейдите в настройки.' });
    }

    const haUrl = connection.url.replace(/\/$/, ''); // Удаляем trailing slash
    const token = connection.token;

    // 2. Формируем целевой URL
    const targetUrl = `${haUrl}/api${haPath}`;

    console.log(`[Proxy] Proxying ${req.method} ${req.originalUrl} to ${targetUrl}`);

    // 3. Проксируем запрос
    const response = await axios({
      method: req.method,
      url: targetUrl,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      data: req.body,
      timeout: 10000, // 10 second timeout to prevent infinite hangs
      responseType: 'stream' // Важно для pipe
    });

    // 4. Отправляем ответ обратно клиенту
    res.status(response.status);
    Object.keys(response.headers).forEach(key => {
      const lowerKey = key.toLowerCase();
      if (['content-length', 'content-encoding', 'transfer-encoding'].includes(lowerKey)) {
        return;
      }
      res.setHeader(key, response.headers[key]);
    });

    response.data.pipe(res);

  } catch (error) {
    console.error(`[Proxy] Ошибка проксирования: ${error.message}`);
    if (error.response) {
      // Ошибка от HA
      res.status(error.response.status).send(error.response.data);
    } else {
      // Ошибка соединения
      res.status(502).json({ error: 'Не удалось подключиться к Home Assistant', details: error.message });
    }
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Сервер настроек запущен на http://0.0.0.0:${PORT}`)
  console.log(`Данные сохраняются в: ${DATA_DIR}`)
})


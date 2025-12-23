import axios, { AxiosInstance } from 'axios'

export interface Entity {
  entity_id: string
  state: string
  attributes: Record<string, any>
  last_changed: string
  last_updated: string
}

export interface ServiceCall {
  domain: string
  service: string
  service_data?: Record<string, any>
  target?: {
    entity_id?: string | string[]
  }
}

export class HomeAssistantAPI {
  private client: AxiosInstance
  private apiPathPrefix: string

  constructor(_baseUrl: string, _token: string) {
    // ВСЕГДА используем proxy через наш backend 
    // Это позволяет использовать hostname 'homeassistant' внутри Docker сети
    const apiBaseUrl = '/api/homeassistant'
    this.apiPathPrefix = ''

    this.client = axios.create({
      baseURL: apiBaseUrl,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    })

    // Примечание: Мы больше не передаем Authorization header здесь,
    // так как токен теперь подставляется на Backend Proxy.
    // userId передается автоматически через интерцепторы или headers в apiService, 
    // но axios instance здесь отдельный.

    // Добавим interceptor для добавления userId если он есть в localStorage
    this.client.interceptors.request.use((config) => {
      const userId = localStorage.getItem('user_id');
      if (userId) {
        config.headers['x-user-id'] = userId;
      }
      return config;
    });
  }

  async testConnection(): Promise<void> {
    try {
      const endpoint = `${this.apiPathPrefix}/`
      const response = await this.client.get(endpoint)
      if (response.status !== 200) {
        throw new Error(`שגיאת חיבור: סטטוס ${response.status}`)
      }
    } catch (error: any) {
      if (error.response) {
        // Сервер ответил с кодом ошибки
        const status = error.response.status
        let message = `שגיאה ${status}`

        if (status === 401) {
          message = 'שגיאה 401: טוקן גישה שגוי. בדוק את הטוקן ב-Home Assistant.'
        } else if (status === 404) {
          message = 'שגיאה 404: נקודת קצה לא נמצאה. בדוק את כתובת ה-URL של Home Assistant.'
        } else {
          message = `שגיאה ${status}: ${error.response.statusText || 'בדוק את טוקן הגישה'}`
        }

        throw new Error(message)
      } else if (error.request) {
        // Запрос был отправлен, но ответа не получено
        throw new Error('לא ניתן להתחבר לשרת. בדוק את כתובת ה-URL וזמינות Home Assistant.')
      } else {
        // Ошибка при настройке запроса
        throw new Error(`שגיאת חיבור: ${error.message}`)
      }
    }
  }

  async getStates(): Promise<Entity[]> {
    const response = await this.client.get<Entity[]>(`${this.apiPathPrefix}/states`)
    return response.data
  }

  async getState(entityId: string): Promise<Entity> {
    const response = await this.client.get<Entity>(`${this.apiPathPrefix}/states/${entityId}`)
    return response.data
  }

  async callService(service: ServiceCall): Promise<any> {
    const response = await this.client.post(
      `${this.apiPathPrefix}/services/${service.domain}/${service.service}`,
      {
        entity_id: service.target?.entity_id,
        ...service.service_data,
      }
    )
    return response.data
  }

  async toggleEntity(entityId: string): Promise<void> {
    const domain = entityId.split('.')[0]
    await this.callService({
      domain,
      service: 'toggle',
      target: { entity_id: entityId },
    })
  }

  async turnOn(entityId: string): Promise<void> {
    const domain = entityId.split('.')[0]
    await this.callService({
      domain,
      service: 'turn_on',
      target: { entity_id: entityId },
    })
  }

  async turnOff(entityId: string): Promise<void> {
    const domain = entityId.split('.')[0]
    await this.callService({
      domain,
      service: 'turn_off',
      target: { entity_id: entityId },
    })
  }

  async setVolume(entityId: string, volume: number): Promise<void> {
    await this.callService({
      domain: 'media_player',
      service: 'volume_set',
      target: { entity_id: entityId },
      service_data: { volume_level: volume / 100 },
    })
  }

  async mediaPlayPause(entityId: string): Promise<void> {
    await this.callService({
      domain: 'media_player',
      service: 'media_play_pause',
      target: { entity_id: entityId },
    })
  }

  async mediaNext(entityId: string): Promise<void> {
    await this.callService({
      domain: 'media_player',
      service: 'media_next_track',
      target: { entity_id: entityId },
    })
  }

  async mediaPrevious(entityId: string): Promise<void> {
    await this.callService({
      domain: 'media_player',
      service: 'media_previous_track',
      target: { entity_id: entityId },
    })
  }
}

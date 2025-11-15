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
  private ws: WebSocket | null = null
  private wsUrl: string
  private apiPathPrefix: string

  constructor(private baseUrl: string, private token: string) {
    // Убеждаемся, что baseUrl не заканчивается на /
    const cleanUrl = baseUrl.replace(/\/$/, '')
    
    // В dev режиме используем прокси Vite для обхода CORS
    // В production используем прямой URL
    const isDev = import.meta.env.DEV
    const apiBaseUrl = isDev ? '/api' : cleanUrl
    // Префикс для путей API (в dev режиме baseURL уже содержит /api, поэтому не добавляем)
    this.apiPathPrefix = isDev ? '' : '/api'
    
    this.client = axios.create({
      baseURL: apiBaseUrl,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000, // 10 секунд таймаут
    })

    // Преобразуем HTTP URL в WebSocket URL
    this.wsUrl = cleanUrl.replace(/^http/, 'ws') + '/api/websocket'
  }

  async testConnection(): Promise<void> {
    try {
      const endpoint = `${this.apiPathPrefix}/`
      const response = await this.client.get(endpoint)
      if (response.status !== 200) {
        throw new Error(`Ошибка подключения: статус ${response.status}`)
      }
    } catch (error: any) {
      if (error.response) {
        // Сервер ответил с кодом ошибки
        const status = error.response.status
        let message = `Ошибка ${status}`
        
        if (status === 401) {
          message = 'Ошибка 401: Неверный токен доступа. Проверьте токен в Home Assistant.'
        } else if (status === 404) {
          message = 'Ошибка 404: Endpoint не найден. Проверьте URL Home Assistant.'
        } else {
          message = `Ошибка ${status}: ${error.response.statusText || 'Проверьте токен доступа'}`
        }
        
        throw new Error(message)
      } else if (error.request) {
        // Запрос был отправлен, но ответа не получено
        throw new Error('Не удалось подключиться к серверу. Проверьте URL и доступность Home Assistant.')
      } else {
        // Ошибка при настройке запроса
        throw new Error(`Ошибка подключения: ${error.message}`)
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



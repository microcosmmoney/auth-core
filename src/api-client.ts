// AI-generated · AI-managed · AI-maintained
import { TokenManager } from './token-manager'

const OPEN_API_BASE = 'https://api.microcosm.money/v1'

export class ApiClient {
  private tokenManager: TokenManager

  constructor(tokenManager: TokenManager) {
    this.tokenManager = tokenManager
  }

  async fetch<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = await this.tokenManager.getAccessToken()

    const headers: Record<string, string> = {
      'Accept': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    if (options.body && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json'
    }

    const response = await fetch(`${OPEN_API_BASE}${path}`, {
      ...options,
      headers,
    })

    if (response.status === 429) {
      const retryAfter = parseInt(response.headers.get('Retry-After') || '60')
      await new Promise(resolve => setTimeout(resolve, retryAfter * 1000))
      return this.fetch(path, options)
    }

    const contentType = response.headers.get('content-type')
    if (!contentType?.includes('application/json')) {
      const text = await response.text()
      throw new Error(`Non-JSON response from API: ${text.substring(0, 200)}`)
    }

    const data = await response.json()

    if (!response.ok) {
      const detail = data.detail
      const msg = typeof detail === 'string'
        ? detail
        : typeof detail === 'object' && detail !== null
          ? (detail.msg || detail.message || JSON.stringify(detail))
          : (data.error?.message || data.message || `API error ${response.status}`)
      throw new Error(msg)
    }

    return data as T
  }

  async get<T>(path: string): Promise<T> {
    return this.fetch<T>(path)
  }

  async post<T>(path: string, body: unknown): Promise<T> {
    return this.fetch<T>(path, {
      method: 'POST',
      body: JSON.stringify(body),
    })
  }

  async put<T>(path: string, body: unknown): Promise<T> {
    return this.fetch<T>(path, {
      method: 'PUT',
      body: JSON.stringify(body),
    })
  }

  async patch<T>(path: string, body: unknown): Promise<T> {
    return this.fetch<T>(path, {
      method: 'PATCH',
      body: JSON.stringify(body),
    })
  }
}

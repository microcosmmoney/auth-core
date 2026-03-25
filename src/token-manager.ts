// Developed by AI Agent
import { ResolvedConfig, TokenData } from './types'
import { Storage, STORAGE_KEYS } from './storage'

const TOKEN_CHECK_INTERVAL_MS = 30_000

export class TokenManager {
  private config: ResolvedConfig
  private storage: Storage
  private refreshTimer: ReturnType<typeof setTimeout> | null = null
  private refreshPromise: Promise<string | null> | null = null
  private monitorInterval: ReturnType<typeof setInterval> | null = null
  private onTokenExpired: (() => void) | null = null

  constructor(config: ResolvedConfig, storage: Storage) {
    this.config = config
    this.storage = storage
  }

  setTokens(data: TokenData): void {
    this.storage.set(STORAGE_KEYS.ACCESS_TOKEN, data.accessToken)
    this.storage.set(STORAGE_KEYS.REFRESH_TOKEN, data.refreshToken)
    this.storage.set(STORAGE_KEYS.EXPIRES_AT, data.expiresAt.toString())

    if (this.config.autoRefresh) {
      this.scheduleRefresh()
    }
  }

  async getAccessToken(): Promise<string | null> {
    const accessToken = this.storage.get(STORAGE_KEYS.ACCESS_TOKEN)
    const expiresAt = parseInt(this.storage.get(STORAGE_KEYS.EXPIRES_AT) || '0', 10)

    if (!accessToken) return null

    const bufferMs = this.config.refreshBuffer * 1000
    if (expiresAt - Date.now() < bufferMs) {
      return this.refreshToken()
    }

    return accessToken
  }

  getRawAccessToken(): string | null {
    return this.storage.get(STORAGE_KEYS.ACCESS_TOKEN)
  }

  hasValidToken(): boolean {
    return !!this.storage.get(STORAGE_KEYS.REFRESH_TOKEN)
  }

  isExpired(): boolean {
    const expiresAt = parseInt(this.storage.get(STORAGE_KEYS.EXPIRES_AT) || '0', 10)
    return Date.now() >= expiresAt
  }

  startMonitor(onExpired: () => void): void {
    this.onTokenExpired = onExpired
    if (this.monitorInterval) return

    this.monitorInterval = setInterval(async () => {
      if (!this.storage.get(STORAGE_KEYS.REFRESH_TOKEN)) return
      if (!this.isExpired()) return

      const newToken = await this.getAccessToken()
      if (!newToken) {
        this.onTokenExpired?.()
      }
    }, TOKEN_CHECK_INTERVAL_MS)

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.handleVisibilityChange)
    }
  }

  stopMonitor(): void {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval)
      this.monitorInterval = null
    }
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.handleVisibilityChange)
    }
    this.onTokenExpired = null
  }

  clear(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer)
      this.refreshTimer = null
    }
    this.storage.remove(STORAGE_KEYS.ACCESS_TOKEN)
    this.storage.remove(STORAGE_KEYS.REFRESH_TOKEN)
    this.storage.remove(STORAGE_KEYS.EXPIRES_AT)
  }

  scheduleRefresh(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer)
    }

    const expiresAt = parseInt(this.storage.get(STORAGE_KEYS.EXPIRES_AT) || '0', 10)
    const bufferMs = this.config.refreshBuffer * 1000
    const delay = Math.max(0, expiresAt - Date.now() - bufferMs)

    if (delay > 0 && delay < 86400000) {
      this.refreshTimer = setTimeout(() => this.refreshToken(), delay)
    }
  }

  private handleVisibilityChange = async (): Promise<void> => {
    if (document.visibilityState !== 'visible') return
    if (!this.storage.get(STORAGE_KEYS.REFRESH_TOKEN)) return
    if (!this.isExpired()) return

    const newToken = await this.getAccessToken()
    if (!newToken) {
      this.onTokenExpired?.()
    }
  }

  private async refreshToken(): Promise<string | null> {
    if (this.refreshPromise) {
      return this.refreshPromise
    }

    this.refreshPromise = this.doRefresh()
    try {
      return await this.refreshPromise
    } finally {
      this.refreshPromise = null
    }
  }

  private async doRefresh(): Promise<string | null> {
    const refreshToken = this.storage.get(STORAGE_KEYS.REFRESH_TOKEN)
    if (!refreshToken) return null

    try {
      const response = await fetch(this.config.tokenExchangeUri, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
        }),
      })

      if (!response.ok) {
        this.clear()
        this.onTokenExpired?.()
        return null
      }

      const contentType = response.headers.get('content-type')
      if (!contentType?.includes('application/json')) {
        this.clear()
        this.onTokenExpired?.()
        return null
      }

      const data = await response.json()

      if (!data.access_token) {
        this.clear()
        this.onTokenExpired?.()
        return null
      }

      const MAX_EXPIRY = 86400
      const expiresIn = Math.min(Math.max(Number(data.expires_in) || 3600, 60), MAX_EXPIRY)
      this.setTokens({
        accessToken: data.access_token,
        refreshToken: data.refresh_token || refreshToken,
        expiresAt: Date.now() + expiresIn * 1000,
      })

      return data.access_token
    } catch (error) {
      console.error('[MicrocosmAuth] Token refresh failed:', error)
      return null
    }
  }
}

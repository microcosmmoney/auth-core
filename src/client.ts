// Developed by AI Agent
import {
  MicrocosmAuthConfig,
  ResolvedConfig,
  User,
  TokenData,
  LoginOptions,
  UserProfileResponse,
} from './types'
import { TokenManager } from './token-manager'
import { Storage, STORAGE_KEYS } from './storage'
import { ApiClient } from './api-client'

const DEFAULT_CONFIG: Omit<ResolvedConfig, 'clientId' | 'redirectUri'> = {
  scope: ['openid', 'profile', 'email'],
  authEndpoint: 'https://microcosm.money',
  tokenExchangeUri: '/api/auth/exchange',
  profileUri: '/api/users/profile',
  storage: 'localStorage',
  autoRefresh: true,
  refreshBuffer: 300,
  debug: false,
}

export class MicrocosmAuthClient {
  private config: ResolvedConfig
  private storage: Storage
  private tokenManager: TokenManager
  private apiClient: ApiClient
  private listeners: Set<(user: User | null) => void> = new Set()

  constructor(config: MicrocosmAuthConfig) {
    this.config = { ...DEFAULT_CONFIG, ...config } as ResolvedConfig
    this.storage = new Storage(this.config.storage)
    this.tokenManager = new TokenManager(this.config, this.storage)
    this.apiClient = new ApiClient(this.tokenManager)

    if (this.config.autoRefresh && this.tokenManager.hasValidToken()) {
      this.tokenManager.scheduleRefresh()
      this.tokenManager.startMonitor(() => this.handleTokenExpired())
    }

    this.log('Initialized', { clientId: this.config.clientId })
  }

  login(options?: LoginOptions): void {
    const state = this.generateState()
    this.storage.set(STORAGE_KEYS.OAUTH_STATE, state)

    const redirectUri = this.resolveRedirectUri()

    const params = new URLSearchParams({
      oauth: 'true',
      response_type: 'code',
      client_id: this.config.clientId,
      redirect_uri: redirectUri,
      scope: this.config.scope.join(' '),
      state: state,
    })

    if (options?.prompt) {
      params.set('prompt', options.prompt)
    }

    const authUrl = `${this.config.authEndpoint}/login?${params.toString()}`
    this.log('Redirecting to:', authUrl)

    if (typeof window !== 'undefined') {
      window.location.href = authUrl
    }
  }

  async handleCallback(): Promise<User> {
    if (typeof window === 'undefined') {
      throw new Error('handleCallback must be called in browser')
    }

    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const state = params.get('state')
    const error = params.get('error')

    if (error) {
      throw new Error(params.get('error_description') || error)
    }

    if (!code) {
      throw new Error('Missing authorization code')
    }

    const savedState = this.storage.get(STORAGE_KEYS.OAUTH_STATE)
    if (!state || !savedState || state !== savedState) {
      this.storage.remove(STORAGE_KEYS.OAUTH_STATE)
      throw new Error('Invalid state parameter (possible CSRF)')
    }
    this.storage.remove(STORAGE_KEYS.OAUTH_STATE)

    this.log('Exchanging code for tokens...')
    const tokenResponse = await fetch(this.config.tokenExchangeUri, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    })

    if (!tokenResponse.ok) {
      const errorData = await this.safeJson(tokenResponse)
      throw new Error(errorData.error_description || errorData.error || 'Token exchange failed')
    }

    const tokenData = await tokenResponse.json()

    const MAX_EXPIRY = 86400
    const expiresIn = Math.min(Math.max(Number(tokenData.expires_in) || 3600, 60), MAX_EXPIRY)
    const tokens: TokenData = {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt: Date.now() + expiresIn * 1000,
    }
    this.tokenManager.setTokens(tokens)

    if (this.config.autoRefresh) {
      this.tokenManager.startMonitor(() => this.handleTokenExpired())
    }

    const user = await this.fetchUserProfile(tokens.accessToken)
    this.storage.set(STORAGE_KEYS.USER, JSON.stringify(user))
    this.notifyListeners(user)

    this.log('Login successful:', user.uid)
    return user
  }

  async logout(): Promise<void> {
    this.tokenManager.stopMonitor()
    this.tokenManager.clear()
    this.storage.remove(STORAGE_KEYS.USER)
    this.notifyListeners(null)
    this.log('Logged out')
  }

  getUser(): User | null {
    const userJson = this.storage.get(STORAGE_KEYS.USER)
    if (!userJson) return null
    try {
      return JSON.parse(userJson) as User
    } catch {
      return null
    }
  }

  setUser(user: User): void {
    this.storage.set(STORAGE_KEYS.USER, JSON.stringify(user))
    this.notifyListeners(user)
  }

  isAuthenticated(): boolean {
    return this.tokenManager.hasValidToken() && this.getUser() !== null
  }

  async getAccessToken(): Promise<string | null> {
    return this.tokenManager.getAccessToken()
  }

  getApiClient(): ApiClient {
    return this.apiClient
  }

  onAuthStateChange(callback: (user: User | null) => void): () => void {
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }

  private handleTokenExpired(): void {
    this.tokenManager.stopMonitor()
    this.storage.remove(STORAGE_KEYS.USER)
    this.notifyListeners(null)
    this.log('Token expired, session cleared')
  }

  private async fetchUserProfile(accessToken: string): Promise<User> {
    const response = await fetch(this.config.profileUri, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    if (!response.ok) {
      this.log('Profile fetch failed, using minimal user')
      return { uid: '', email: '', role: 'user' }
    }

    const data: UserProfileResponse = await response.json()
    const profile = data.user || data

    return this.mapProfileToUser(profile)
  }

  private mapProfileToUser(profile: UserProfileResponse): User {
    return {
      uid: profile.uid,
      email: profile.email || '',
      displayName: profile.display_name || null,
      avatarUrl: profile.avatar_url || null,
      role: (profile.role as User['role']) || 'user',
      level: (profile.level as User['level']) || undefined,
      title: (profile.title as User['title']) || null,
      stationId: profile.station_id || null,
      emailVerified: profile.email_verified,
    }
  }

  private resolveRedirectUri(): string {
    const uri = this.config.redirectUri
    if (uri.startsWith('http')) return uri
    if (typeof window !== 'undefined') {
      return `${window.location.origin}${uri.startsWith('/') ? '' : '/'}${uri}`
    }
    return uri
  }

  private generateState(): string {
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const array = new Uint8Array(32)
      crypto.getRandomValues(array)
      return Array.from(array, b => b.toString(16).padStart(2, '0')).join('')
    }
    return Math.random().toString(36).substring(2) + Date.now().toString(36)
  }

  private async safeJson(response: Response): Promise<Record<string, string>> {
    const contentType = response.headers.get('content-type')
    if (contentType?.includes('application/json')) {
      return response.json()
    }
    const text = await response.text()
    return { error: 'Non-JSON Response', message: text.substring(0, 200) }
  }

  private notifyListeners(user: User | null): void {
    this.listeners.forEach(callback => {
      try {
        callback(user)
      } catch (e) {
        console.error('[MicrocosmAuth] Listener error:', e)
      }
    })
  }

  private log(...args: unknown[]): void {
    if (this.config.debug) {
      console.log('[MicrocosmAuth]', ...args)
    }
  }
}

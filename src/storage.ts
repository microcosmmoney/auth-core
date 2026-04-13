const KEY_PREFIX = 'mc_'

export class Storage {
  private type: 'localStorage' | 'sessionStorage' | 'memory'
  private memoryStore: Map<string, string> = new Map()

  constructor(type: 'localStorage' | 'sessionStorage' | 'memory' = 'localStorage') {
    this.type = type
  }

  private prefixKey(key: string): string {
    return key.startsWith(KEY_PREFIX) ? key : `${KEY_PREFIX}${key}`
  }

  get(key: string): string | null {
    const prefixed = this.prefixKey(key)
    try {
      if (this.type === 'memory') {
        return this.memoryStore.get(prefixed) ?? null
      }
      if (typeof window === 'undefined') return null
      const store = this.type === 'localStorage' ? window.localStorage : window.sessionStorage
      return store.getItem(prefixed)
    } catch {
      return this.memoryStore.get(prefixed) ?? null
    }
  }

  set(key: string, value: string): void {
    const prefixed = this.prefixKey(key)
    try {
      if (this.type === 'memory') {
        this.memoryStore.set(prefixed, value)
        return
      }
      if (typeof window === 'undefined') {
        this.memoryStore.set(prefixed, value)
        return
      }
      const store = this.type === 'localStorage' ? window.localStorage : window.sessionStorage
      store.setItem(prefixed, value)
    } catch {
      this.memoryStore.set(prefixed, value)
    }
  }

  remove(key: string): void {
    const prefixed = this.prefixKey(key)
    try {
      this.memoryStore.delete(prefixed)
      if (this.type !== 'memory' && typeof window !== 'undefined') {
        const store = this.type === 'localStorage' ? window.localStorage : window.sessionStorage
        store.removeItem(prefixed)
      }
    } catch {
      this.memoryStore.delete(prefixed)
    }
  }

  clear(): void {
    const keysToRemove: string[] = []
    try {
      if (this.type !== 'memory' && typeof window !== 'undefined') {
        const store = this.type === 'localStorage' ? window.localStorage : window.sessionStorage
        for (let i = 0; i < store.length; i++) {
          const key = store.key(i)
          if (key?.startsWith(KEY_PREFIX)) {
            keysToRemove.push(key)
          }
        }
        keysToRemove.forEach(k => store.removeItem(k))
      }
    } catch {
    }
    this.memoryStore.clear()
  }
}

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  EXPIRES_AT: 'token_expires_at',
  USER: 'user',
  OAUTH_STATE: 'oauth_state',
} as const

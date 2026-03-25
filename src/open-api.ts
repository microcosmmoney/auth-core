// Developed by AI Agent
const DEFAULT_BASE = 'https://api.microcosm.money/v1'

export interface MicrocosmAPIConfig {
  baseUrl?: string
  timeout?: number
}

async function request<T>(baseUrl: string, path: string, token?: string): Promise<T> {
  const headers: Record<string, string> = { 'Accept': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${baseUrl}${path}`, { headers })

  if (res.status === 429) {
    const retry = parseInt(res.headers.get('Retry-After') || '60')
    await new Promise(r => setTimeout(r, retry * 1000))
    return request(baseUrl, path, token)
  }

  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || `API error ${res.status}`)
  return data as T
}

async function mutateRequest<T>(baseUrl: string, method: string, path: string, body: unknown, token?: string): Promise<T> {
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: JSON.stringify(body),
  })

  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || `API error ${res.status}`)
  return data as T
}

async function postRequest<T>(baseUrl: string, path: string, body: unknown, token?: string): Promise<T> {
  return mutateRequest<T>(baseUrl, 'POST', path, body, token)
}

async function putRequest<T>(baseUrl: string, path: string, body: unknown, token?: string): Promise<T> {
  return mutateRequest<T>(baseUrl, 'PUT', path, body, token)
}

interface ApiRes<T> { success: boolean; data: T }

export class MicrocosmAPI {
  private base: string

  constructor(config?: MicrocosmAPIConfig) {
    this.base = (config?.baseUrl || DEFAULT_BASE).replace(/\/$/, '')
  }

  readonly mcc = {
    getPrice: () => request<ApiRes<any>>(this.base, '/mcc/price'),
    getStats: () => request<ApiRes<any>>(this.base, '/mcc/stats'),
    getBalance: (token: string) => request<ApiRes<any>>(this.base, '/mcc/balance', token),
    getBalanceByAddress: (address: string) => request<ApiRes<any>>(this.base, `/mcc/balance/${address}`),
    getLocks: (token: string) => request<ApiRes<any>>(this.base, '/mcc/locks', token),
    getTransactions: (token: string, params?: { page?: number; page_size?: number }) => {
      const p = params || {}
      return request<ApiRes<any>>(this.base, `/mcc/transactions?page=${p.page || 1}&page_size=${p.page_size || 20}`, token)
    },
    getHistory: (token: string, params?: { tx_type?: string; page?: number; page_size?: number }) => {
      const p = params || {}
      let qs = `?page=${p.page || 1}&page_size=${p.page_size || 20}`
      if (p.tx_type) qs += `&tx_type=${p.tx_type}`
      return request<ApiRes<any>>(this.base, `/mcc/history${qs}`, token)
    },
    getHolders: () => request<ApiRes<any>>(this.base, '/reincarnation/holders'),
    getMiningHistory: (days = 30) => request<ApiRes<any>>(this.base, `/reincarnation/mining-history?days=${days}`),
  }

  readonly mcd = {
    getBalance: (token: string) => request<ApiRes<any>>(this.base, '/mcd/balance', token),
    getStats: () => request<ApiRes<any>>(this.base, '/mcd/stats'),
    getTransactions: (token: string, params?: { page?: number; page_size?: number; type?: string }) => {
      const p = params || {}
      let qs = `?page=${p.page || 1}&page_size=${p.page_size || 20}`
      if (p.type) qs += `&type=${p.type}`
      return request<ApiRes<any>>(this.base, `/mcd/transactions${qs}`, token)
    },
    getRewards: (token: string, params?: { page?: number; page_size?: number; start_date?: string; end_date?: string }) => {
      const p = params || {}
      let qs = `?page=${p.page || 1}&page_size=${p.page_size || 20}`
      if (p.start_date) qs += `&start_date=${p.start_date}`
      if (p.end_date) qs += `&end_date=${p.end_date}`
      return request<ApiRes<any>>(this.base, `/mcd/rewards${qs}`, token)
    },
  }

  readonly wallets = {
    list: (token: string) => request<ApiRes<any>>(this.base, '/wallets', token),
    getTokens: (address: string) => request<ApiRes<any>>(this.base, `/wallets/${address}/tokens`),
  }

  readonly reincarnation = {
    getPool: () => request<ApiRes<any>>(this.base, '/reincarnation/pool'),
    getBuybackPrice: () => request<ApiRes<any>>(this.base, '/reincarnation/buyback-price'),
    getQuote: (mccAmount: number) => postRequest<ApiRes<any>>(this.base, '/reincarnation/quote', { mcc_amount: mccAmount }),
    getUserHistory: (token: string, params?: { page?: number; page_size?: number }) => {
      const p = params || {}
      return request<ApiRes<any>>(this.base, `/reincarnation/user-history?page=${p.page || 1}&page_size=${p.page_size || 20}`, token)
    },
    record: (token: string, data: { tx_signature: string; wallet_address: string; mcc_amount: number; usdc_amount: number; stablecoin?: string }) =>
      postRequest<ApiRes<any>>(this.base, '/reincarnation/record', data, token),
    getConfig: () => request<ApiRes<any>>(this.base, '/reincarnation/config'),
    getCycleHistory: (params?: { page?: number; page_size?: number }) => {
      const p = params || {}
      return request<ApiRes<any>>(this.base, `/reincarnation/cycle-history?page=${p.page || 1}&page_size=${p.page_size || 20}`)
    },
  }

  readonly mining = {
    getRecords: (token: string, params?: { page?: number; page_size?: number }) => {
      const p = params || {}
      return request<ApiRes<any>>(this.base, `/mining/records?page=${p.page || 1}&page_size=${p.page_size || 20}`, token)
    },
    getStats: (token: string) => request<ApiRes<any>>(this.base, '/mining/stats', token),
    getGlobalStats: () => request<ApiRes<any>>(this.base, '/mining/global-stats'),
    getRatio: () => request<ApiRes<any>>(this.base, '/mining/ratio'),
    getDistribution: (token: string, params?: { page?: number; page_size?: number }) => {
      const p = params || {}
      return request<ApiRes<any>>(this.base, `/mining/distribution?page=${p.page || 1}&page_size=${p.page_size || 20}`, token)
    },
    createRequest: (token: string, data: { mcc_amount: number; stablecoin?: string; wallet_address: string }) =>
      postRequest<ApiRes<any>>(this.base, '/mining/request', data, token),
    confirm: (token: string, data: { request_id: string; tx_signature: string; mcc_amount: number; usdc_amount: number; stablecoin_type?: string }) =>
      postRequest<ApiRes<any>>(this.base, '/mining/confirm', data, token),
    publicRequest: (data: { wallet_address: string; mcc_amount: number; stablecoin?: string }) =>
      postRequest<ApiRes<any>>(this.base, '/mining/public/request', data),
    publicVerify: (data: { request_id: string; tx_signature: string }) =>
      postRequest<ApiRes<any>>(this.base, '/mining/public/verify', data),
    getHistory: (token: string, params?: { limit?: number; offset?: number }) => {
      const p = params || {}
      return request<ApiRes<any>>(this.base, `/mining/history?limit=${p.limit || 20}&offset=${p.offset || 0}`, token)
    },
    getConfig: () => request<ApiRes<any>>(this.base, '/mining/config'),
  }

  readonly users = {
    getProfile: (token: string) => request<ApiRes<any>>(this.base, '/users/me', token),
    getLevel: (token: string) => request<ApiRes<any>>(this.base, '/users/me/level', token),
  }

  readonly dashboard = {
    getMarket: () => request<ApiRes<any>>(this.base, '/dashboard/market'),
    getPlatform: () => request<ApiRes<any>>(this.base, '/dashboard/platform'),
    getUserSummary: (wallet: string) => request<ApiRes<any>>(this.base, `/dashboard/user/${wallet}`),
    getUserStats: () => request<ApiRes<any>>(this.base, '/dashboard/stats/users'),
    getTerritoryStats: () => request<ApiRes<any>>(this.base, '/dashboard/stats/territories'),
    getMiningHistory: (days = 30) => request<ApiRes<any>>(this.base, `/dashboard/stats/mining-history?days=${days}`),
  }

  readonly territories = {
    list: (token: string, params?: { unit_type?: string; parent_id?: string; page?: number; page_size?: number }) => {
      const p = params || {}
      let qs = `?page=${p.page || 1}&page_size=${p.page_size || 20}`
      if (p.unit_type) qs += `&unit_type=${p.unit_type}`
      if (p.parent_id) qs += `&parent_id=${p.parent_id}`
      return request<ApiRes<any>>(this.base, `/territories${qs}`, token)
    },
    getSummary: (token: string) => request<ApiRes<any>>(this.base, '/territories/summary', token),
    getDetail: (token: string, id: string) => request<ApiRes<any>>(this.base, `/territories/${id}`, token),
    getStats: (token: string, id: string) => request<ApiRes<any>>(this.base, `/territories/${id}/stats`, token),
    getMembers: (token: string, id: string, params?: { page?: number; page_size?: number }) => {
      const p = params || {}
      return request<ApiRes<any>>(this.base, `/territories/${id}/members?page=${p.page || 1}&page_size=${p.page_size || 20}`, token)
    },
    getIncomeChart: (token: string, id: string, period = '30d') => request<ApiRes<any>>(this.base, `/territories/${id}/income-chart?period=${period}`, token),
    getKpiHistory: (token: string, id: string) => request<ApiRes<any>>(this.base, `/territories/${id}/kpi-history`, token),
    getMemberRanking: (token: string, id: string, params?: { page?: number; page_size?: number }) => {
      const p = params || {}
      return request<ApiRes<any>>(this.base, `/territories/${id}/member-ranking?page=${p.page || 1}&page_size=${p.page_size || 20}`, token)
    },
    update: (token: string, id: string, data: { unit_name?: string; description?: string; image_url?: string }) =>
      putRequest<ApiRes<any>>(this.base, `/territories/${id}`, data, token),
    updateName: (token: string, id: string, name: string, force = false) =>
      putRequest<ApiRes<any>>(this.base, `/territories/${id}/name${force ? '?force=true' : ''}`, { name }, token),
  }

  readonly territory = {
    getCollection: () => request<ApiRes<any>>(this.base, '/territory/collection'),
    getNft: (mint: string) => request<ApiRes<any>>(this.base, `/territory/nft/${mint}`),
    getUserNfts: (wallet: string) => request<ApiRes<any>>(this.base, `/territory/nfts/${wallet}`),
  }

  readonly voting = {
    getProposals: (token: string, params?: { status?: string; page?: number; page_size?: number }) => {
      const p = params || {}
      let qs = `?page=${p.page || 1}&page_size=${p.page_size || 20}`
      if (p.status) qs += `&status=${p.status}`
      return request<ApiRes<any>>(this.base, `/voting/proposals${qs}`, token)
    },
    getDetail: (token: string, id: string) => request<ApiRes<any>>(this.base, `/voting/proposals/${id}`, token),
    getPower: (token: string) => request<ApiRes<any>>(this.base, '/voting/power', token),
    createProposal: (token: string, data: { title: string; description: string; proposal_type?: string; voting_hours?: number; options: string[] }) =>
      postRequest<ApiRes<any>>(this.base, '/voting/proposals', data, token),
    castVote: (token: string, proposalId: string, data: { option_index: number; vote_count?: number }) =>
      postRequest<ApiRes<any>>(this.base, `/voting/proposals/${proposalId}/vote`, data, token),
  }

  readonly auctions = {
    getConfig: () => request<ApiRes<any>>(this.base, '/auction-solana/config'),
    getActive: () => request<ApiRes<any>>(this.base, '/auction-solana/active'),
    getDetails: (id: number) => request<ApiRes<any>>(this.base, `/auction-solana/auction/${id}`),
    getBids: (id: number) => request<ApiRes<any>>(this.base, `/auction-solana/auction/${id}/bids`),
    getUserBids: (wallet: string) => request<ApiRes<any>>(this.base, `/auction-solana/bids/${wallet}`),
    getUserAuctions: (wallet: string) => request<ApiRes<any>>(this.base, `/auction-solana/auctions/${wallet}`),
    getMyBids: (token: string) => request<ApiRes<any>>(this.base, '/auction-solana/my-bids', token),
    placeBid: (token: string, auctionId: number, bidAmount: number) =>
      postRequest<ApiRes<any>>(this.base, `/auction-solana/auction/${auctionId}/bid`, { bid_amount: bidAmount }, token),
    prepareCancelBid: (token: string, auctionId: number) =>
      postRequest<ApiRes<any>>(this.base, '/auction-solana/bid/cancel/prepare', { auction_id: auctionId }, token),
    getHistory: (params?: { page?: number; page_size?: number }) => {
      const p = params || {}
      return request<ApiRes<any>>(this.base, `/auction-solana/history?page=${p.page || 1}&page_size=${p.page_size || 20}`)
    },
  }

  readonly techTree = {
    getConfig: () => request<ApiRes<any>>(this.base, '/tech-tree/config'),
    getUser: (token: string) => request<ApiRes<any>>(this.base, '/tech-tree/user', token),
    getBonus: (token: string) => request<ApiRes<any>>(this.base, '/tech-tree/bonus', token),
    unlock: (token: string, nodeId: string) => postRequest<ApiRes<any>>(this.base, '/tech-tree/unlock', { node_id: nodeId }, token),
    upgrade: (token: string, nodeId: string) => postRequest<ApiRes<any>>(this.base, '/tech-tree/upgrade', { node_id: nodeId }, token),
  }

  readonly fragment = {
    getConfig: () => request<ApiRes<any>>(this.base, '/fragment/config'),
    getVaults: () => request<ApiRes<any>>(this.base, '/fragment/vaults'),
    getVault: (id: number) => request<ApiRes<any>>(this.base, `/fragment/vault/${id}`),
    buy: (token: string, data: { nft_mint: string; amount: number; max_price_per_fragment_usdc?: number }) =>
      postRequest<ApiRes<any>>(this.base, '/fragment/buy/prepare', data, token),
    fragmentize: (token: string, data: { nft_mint: string; fragment_count: number }) =>
      postRequest<ApiRes<any>>(this.base, '/fragment/fragmentize/prepare', data, token),
    redeem: (token: string, data: { nft_mint: string }) =>
      postRequest<ApiRes<any>>(this.base, '/fragment/redeem/prepare', data, token),
    initiateBuyout: (token: string, data: { nft_mint: string; price_per_fragment_usdc: number }) =>
      postRequest<ApiRes<any>>(this.base, '/fragment/buyout/initiate/prepare', data, token),
    acceptBuyout: (token: string, data: { nft_mint: string; initiator: string; fragment_amount: number }) =>
      postRequest<ApiRes<any>>(this.base, '/fragment/buyout/accept/prepare', data, token),
    completeBuyout: (token: string, data: { nft_mint: string }) =>
      postRequest<ApiRes<any>>(this.base, '/fragment/buyout/complete/prepare', data, token),
    cancelBuyout: (token: string, data: { nft_mint: string }) =>
      postRequest<ApiRes<any>>(this.base, '/fragment/buyout/cancel/prepare', data, token),
  }

  readonly lending = {
    getPool: () => request<ApiRes<any>>(this.base, '/lending/pool'),
    getStats: () => request<ApiRes<any>>(this.base, '/lending/stats'),
    getOracle: () => request<ApiRes<any>>(this.base, '/lending/oracle'),
    deposit: (token: string, data: { wallet: string; amount: number }) =>
      postRequest<ApiRes<any>>(this.base, '/lending/deposit/prepare', data, token),
    withdraw: (token: string, data: { wallet: string; lp_amount: number }) =>
      postRequest<ApiRes<any>>(this.base, '/lending/withdraw/prepare', data, token),
    borrow: (token: string, data: { wallet: string; amount: number; nft_mint: string; duration_type: number }) =>
      postRequest<ApiRes<any>>(this.base, '/lending/borrow/prepare', data, token),
    repay: (token: string, data: { wallet: string; nft_mint: string; amount: number }) =>
      postRequest<ApiRes<any>>(this.base, '/lending/repay/prepare', data, token),
    extend: (token: string, data: { wallet: string; nft_mint: string; new_duration_type: number }) =>
      postRequest<ApiRes<any>>(this.base, '/lending/extend/prepare', data, token),
    liquidate: (token: string, data: { liquidator_wallet: string; borrower_wallet: string; nft_mint: string }) =>
      postRequest<ApiRes<any>>(this.base, '/lending/liquidate/prepare', data, token),
  }

  readonly organizations = {
    getList: (token: string) => request<ApiRes<any>>(this.base, '/organizations', token),
  }
}

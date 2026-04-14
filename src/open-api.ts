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
    getCirculatingSupply: () => request<any>(this.base, '/mcc/circulating-supply'),
    getTotalSupply: () => request<any>(this.base, '/mcc/total-supply'),
    getTokenInfo: () => request<ApiRes<any>>(this.base, '/mcc/token-info'),
    getPriceHistory: (period = '7d') => request<ApiRes<any>>(this.base, `/mcc/price/history?period=${period}`),

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
    getDetailedProfile: (token: string) => request<ApiRes<any>>(this.base, '/users/me/profile', token),
    getLevel: (token: string) => request<ApiRes<any>>(this.base, '/users/me/level', token),
    getPublicProfile: (uid: string) => request<ApiRes<any>>(this.base, `/users/${uid}`),
    updateProfile: (token: string, data: { display_name?: string }) =>
      mutateRequest<ApiRes<any>>(this.base, 'PATCH', '/users/me/profile', data, token),
    uploadAvatar: async (token: string, file: Blob) => {
      const form = new FormData()
      form.append('file', file)
      const headers: Record<string, string> = { 'Authorization': `Bearer ${token}` }
      const res = await fetch(`${this.base}/users/me/avatar`, { method: 'POST', headers, body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || `API error ${res.status}`)
      return data as ApiRes<any>
    },
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
    join: (token: string, id: string) =>
      postRequest<ApiRes<any>>(this.base, `/territories/${id}/join`, {}, token),
    leave: (token: string, id: string) =>
      postRequest<ApiRes<any>>(this.base, `/territories/${id}/leave`, {}, token),
    getQueue: (token: string) => request<ApiRes<any>>(this.base, '/territories/queue', token),
    joinQueue: (token: string) => postRequest<ApiRes<any>>(this.base, '/territories/queue', {}, token),
    leaveQueue: (token: string) => mutateRequest<ApiRes<any>>(this.base, 'DELETE', '/territories/queue', {}, token),
    getManagerIncome: (token: string) => request<ApiRes<any>>(this.base, '/territories/manager/income', token),
    getTeamCustody: (token: string) => request<ApiRes<any>>(this.base, '/territories/team/custody', token),
    getDetailedStats: (id: string) => request<ApiRes<any>>(this.base, `/territories/${id}/detailed-stats`),
    getNameStatus: (id: string) => request<ApiRes<any>>(this.base, `/territories/${id}/name-status`),
    getDistributionPlan: (id: string) => request<ApiRes<any>>(this.base, `/territories/${id}/distribution-plan`),
    updateDistributionPlan: (token: string, id: string, data: Record<string, any>) =>
      putRequest<ApiRes<any>>(this.base, `/territories/${id}/distribution-plan`, data, token),
  }

  readonly territory = {
    getCollection: () => request<ApiRes<any>>(this.base, '/territory/collection'),
    getNft: (mint: string) => request<ApiRes<any>>(this.base, `/territory/nft/${mint}`),
    getUserNfts: (wallet: string) => request<ApiRes<any>>(this.base, `/territory/nfts/${wallet}`),
    getHoldings: (wallet: string) => request<ApiRes<any>>(this.base, `/territory/holdings/${wallet}`),
    getUserStatus: (uid: string) => request<ApiRes<any>>(this.base, `/territory/user-status/${uid}`),
    getUnitNft: (unitId: string) => request<ApiRes<any>>(this.base, `/territory/unit/${unitId}/nft`),
    prepareMint: (token: string, data: Record<string, any>) =>
      postRequest<ApiRes<any>>(this.base, '/territory/nft/mint', data, token),
    prepareTransfer: (token: string, data: Record<string, any>) =>
      postRequest<ApiRes<any>>(this.base, '/territory/nft/transfer/prepare', data, token),
    prepareBurn: (token: string, data: Record<string, any>) =>
      postRequest<ApiRes<any>>(this.base, '/territory/nft/burn/prepare', data, token),
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
    create: (token: string, data: { unit_name: string; unit_type: string; starting_price: number; duration_hours?: number }) =>
      postRequest<ApiRes<any>>(this.base, '/auction-solana/create', data, token),
  }

  readonly techBonus = {
    getConfig: () => request<ApiRes<any>>(this.base, '/tech-bonus/config'),
    getUser: (token: string) => request<ApiRes<any>>(this.base, '/tech-bonus/user', token),
    getBonus: (token: string) => request<ApiRes<any>>(this.base, '/tech-bonus/bonus', token),
    unlock: (token: string, nodeId: string) => postRequest<ApiRes<any>>(this.base, '/tech-bonus/unlock', { node_id: nodeId }, token),
    upgrade: (token: string, nodeId: string) => postRequest<ApiRes<any>>(this.base, '/tech-bonus/upgrade', { node_id: nodeId }, token),
  }

  readonly fragment = {
    getConfig: () => request<ApiRes<any>>(this.base, '/fragment/config'),
    getVaults: () => request<ApiRes<any>>(this.base, '/fragment/vaults'),
    getVault: (id: number) => request<ApiRes<any>>(this.base, `/fragment/vault/${id}`),
    getVaultHolders: (id: number) => request<ApiRes<any>>(this.base, `/fragment/vault/${id}/holders`),
    getHoldings: (wallet: string) => request<ApiRes<any>>(this.base, `/fragment/holdings/${wallet}`),
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
    getPosition: (wallet: string) => request<ApiRes<any>>(this.base, `/lending/position/${wallet}`),
    getLoans: (wallet: string) => request<ApiRes<any>>(this.base, `/lending/loans/${wallet}`),
    getLoan: (wallet: string, loanId: string) => request<ApiRes<any>>(this.base, `/lending/loan/${wallet}/${loanId}`),
    getLpBalance: (wallet: string) => request<ApiRes<any>>(this.base, `/lending/lp-balance/${wallet}`),
    calculateInterest: (data: { wallet: string; nft_mint: string }) =>
      postRequest<ApiRes<any>>(this.base, '/lending/calculate-interest', data),
    estimateBorrowCost: (data: { amount: number; duration_type: number }) =>
      postRequest<ApiRes<any>>(this.base, '/lending/estimate-borrow-cost', data),
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
    getTree: (token: string) => request<ApiRes<any>>(this.base, '/organizations/tree', token),
    getSummary: (token: string) => request<ApiRes<any>>(this.base, '/organizations/summary', token),
    getDetail: (token: string, id: string) => request<ApiRes<any>>(this.base, `/organizations/${id}`, token),
    getMembers: (token: string, id: string, params?: { page?: number; page_size?: number }) => {
      const p = params || {}
      return request<ApiRes<any>>(this.base, `/organizations/${id}/members?page=${p.page || 1}&page_size=${p.page_size || 20}`, token)
    },
    getStats: (id: string) => request<ApiRes<any>>(this.base, `/organizations/${id}/stats`),
  }

  readonly notifications = {
    list: (token: string, params?: { page?: number; page_size?: number; unread_only?: boolean }) => {
      const p = params || {}
      let qs = `?page=${p.page || 1}&page_size=${p.page_size || 20}`
      if (p.unread_only) qs += '&unread_only=true'
      return request<ApiRes<any>>(this.base, `/notifications${qs}`, token)
    },
    getUnreadCount: (token: string) => request<ApiRes<any>>(this.base, '/notifications/unread-count', token),
    markRead: (token: string, ids?: string[]) =>
      postRequest<ApiRes<any>>(this.base, '/notifications/read', ids ? { notification_ids: ids } : {}, token),
    markSingleRead: (token: string, id: string) =>
      postRequest<ApiRes<any>>(this.base, `/notifications/${id}/read`, {}, token),
  }

  readonly projects = {
    apply: (token: string, data: { project_name: string; description: string; redirect_uris: string[]; domains: string[]; mcd_wallet?: string }) =>
      postRequest<ApiRes<any>>(this.base.replace('/v1', ''), '/api/open/projects/apply', data, token),
    getMyApplications: (token: string) =>
      request<ApiRes<any>>(this.base.replace('/v1', ''), '/api/open/projects/applications/mine', token),
  }

  readonly hodl = {
    getPool: () => request<ApiRes<any>>(this.base, '/hodl-challenge/pool'),
    getLeaderboard: (params?: { sort?: string; page?: number; page_size?: number }) => {
      const p = params || {}
      let qs = `?page=${p.page || 1}&page_size=${p.page_size || 20}`
      if (p.sort) qs += `&sort=${p.sort}`
      return request<ApiRes<any>>(this.base, `/hodl-challenge/leaderboard${qs}`)
    },
    getMyPositions: (token: string) => request<ApiRes<any>>(this.base, '/hodl-challenge/my-positions', token),
    getMyWallets: (token: string) => request<ApiRes<any>>(this.base, '/hodl-challenge/my-wallets', token),
    requestEntry: (token: string, data: { deposit_mcc: number; entry_wallet: string }) =>
      postRequest<ApiRes<any>>(this.base, '/hodl-challenge/request-entry', data, token),
    confirmEntry: (token: string, data: { request_id: string; payment_tx: string }) =>
      postRequest<ApiRes<any>>(this.base, '/hodl-challenge/confirm-entry', data, token),
    exit: (token: string, data: { position_id: string; exit_wallet: string }) =>
      postRequest<ApiRes<any>>(this.base, '/hodl-challenge/exit', data, token),
    getRecentExits: (params?: { limit?: number }) => {
      const p = params || {}
      return request<ApiRes<any>>(this.base, `/hodl-challenge/recent-exits?limit=${p.limit || 20}`)
    },
    getTrend: (params?: { days?: number }) => {
      const p = params || {}
      return request<ApiRes<any>>(this.base, `/hodl-challenge/trend?days=${p.days || 30}`)
    },
    getPrices: () => request<ApiRes<any>>(this.base, '/hodl-challenge/prices'),
  }

  readonly crashChallenge = {
    getStatus: () => request<ApiRes<any>>(this.base, '/crash-challenge/status'),
    register: (token: string, data: { wallet_address: string }) =>
      postRequest<ApiRes<any>>(this.base, '/crash-challenge/register', data, token),
    getMyChallenges: (token: string) => request<ApiRes<any>>(this.base, '/crash-challenge/my-challenges', token),
    getHistory: (params?: { page?: number; page_size?: number }) => {
      const p = params || {}
      return request<ApiRes<any>>(this.base, `/crash-challenge/history?page=${p.page || 1}&page_size=${p.page_size || 20}`)
    },
  }

  readonly nft = {
    getCollectionMetadata: () => request<any>(this.base, '/nft/metadata/collection.json'),
    getTerritoryMetadata: (territoryId: string) => request<any>(this.base, `/nft/metadata/${territoryId}.json`),
    getCollectionImage: () => `${this.base}/nft/image/collection`,
    getDefaultImage: (typeName: string) => `${this.base}/nft/image/default/${typeName}`,
    getTerritoryImage: (territoryId: string) => `${this.base}/nft/image/${territoryId}`,
  }
}

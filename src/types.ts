// AI-generated · AI-managed · AI-maintained
export type UnitType = 'station' | 'matrix' | 'sector' | 'system'

export enum UserRank {
  RECRUIT = 'Recruit',
  PROSPECT = 'Prospect',
  MINER = 'Miner',
  COMMANDER = 'Commander',
  PIONEER = 'Pioneer',
  WARDEN = 'Warden',
  ADMIRAL = 'Admiral'
}

export interface MicrocosmAuthConfig {
  clientId: string

  redirectUri: string

  scope?: string[]

  authEndpoint?: string

  tokenExchangeUri?: string

  profileUri?: string

  storage?: 'localStorage' | 'sessionStorage' | 'memory'

  autoRefresh?: boolean

  refreshBuffer?: number

  debug?: boolean
}

export type ResolvedConfig = Required<MicrocosmAuthConfig>

export interface User {
  uid: string
  email: string
  displayName?: string | null
  avatarUrl?: string | null
  role: 'admin' | 'user' | 'agent'
  level?: 'recruit' | 'prospect' | 'miner'
  title?: 'commander' | 'pioneer' | 'warden' | 'admiral' | null
  stationId?: number | null
  emailVerified?: boolean
}

export interface TokenData {
  accessToken: string
  refreshToken: string
  expiresAt: number
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: Error | null
}

export interface LoginOptions {
  prompt?: 'login' | 'consent'
}

export interface TokenExchangeResponse {
  access_token: string
  refresh_token: string
  expires_in: number
  user_id?: string
}

export interface UserProfileResponse {
  uid: string
  email?: string
  display_name?: string | null
  avatar_url?: string | null
  role?: string
  level?: string
  title?: string | null
  station_id?: number | null
  email_verified?: boolean
  user?: UserProfileResponse
}

export interface ApiResponse<T> {
  success: boolean
  data: T | null
  error: string | null
  message?: string | null
}

export interface MCDBalance {
  total_balance: string
  available_balance: string
  frozen_balance: string
}

export interface MCCWalletBalance {
  wallet_address: string
  is_primary: boolean
  balance: number
  raw_balance: number
}

export interface MCCBalance {
  balance: number
  raw_balance: number
  decimals: number
  symbol: string
  wallet_address?: string | null
  wallets?: MCCWalletBalance[]
  mint?: string
}

export interface MCCPrice {
  price: number
  price_change_24h?: number | null
  volume_24h?: number | null
  market_cap?: number | null
  source: string
  updated_at: string
  buyback_price?: number
  premium_rate?: number
}

export interface Wallet {
  wallet_address: string
  wallet_type: string
  is_primary: boolean
  created_at: string
}

export interface TokenPortfolio {
  sol_balance?: number
  mcc_balance?: number
  usdt_balance?: number
  usdc_balance?: number
  [key: string]: number | undefined
}

export interface MCCLock {
  lock_id: string
  amount: number
  reason: string
  lock_start: string
  lock_end: string
  status: string
}

export interface MiningRatio {
  current_stage?: number
  total_minted?: number
  ratio?: number
  usdc_per_mcc?: number
  current_rate?: number
}

export interface MiningDistribution {
  user_mcc: number
  team_mcc: number
  magistrate_mcc: number
  vault_mcd: number
  source: string
  territory_id?: string
  tx_signature?: string
  created_at: string
}

export interface BuybackQuote {
  mcc_amount: number
  market_price: number
  buyback_price: number
  usdc_amount: number
  premium_amount: number
  fee?: number
  fee_rate?: number
  slippage?: number
  net_amount?: number
  vault_type?: string
  pool_remaining?: number
}

export interface BuybackRecord {
  mcc_amount: number
  usdc_amount: number
  stablecoin: string
  tx_signature?: string
  buyback_price?: number
  created_at: string
}

export interface Territory {
  unit_id: string
  unit_name: string
  short_id?: string
  unit_type: UnitType
  description?: string
  location?: string
  image_url?: string
  parent_id?: string
  member_count?: number
  max_capacity?: number
  vault_balance?: number
  manager_uid?: string
}

export interface TerritorySummary {
  total_stations: number
  total_members: number
  total_vault_mcd: number
  avg_kpi_score?: number
}

export interface TerritoryStats {
  member_count: number
  max_capacity: number
  vault_mcd: number
  occupancy_rate: number
}

export interface TerritoryMember {
  uid: string
  display_name?: string
  level?: string
  mcd_received?: number
  joined_at?: string
}

export interface Proposal {
  id: string
  title: string
  description: string
  proposal_type: string
  status: string
  options: string[]
  min_votes?: number
  ends_at: string
  created_at: string
}

export interface ProposalDetail extends Proposal {
  vote_results: VoteResult[]
}

export interface VoteResult {
  option: string
  votes: number
  mcc_total: number
  voter_count: number
}

export interface VotePower {
  vote_power: number
  user_rank?: string
  cost_per_vote_mcc?: number
  mcd_cost_per_vote?: number
  mcc_balance?: number
  max_votes?: number
  can_vote: boolean
  reason?: string
  source?: string
  details?: {
    base_power?: number
    mcc_bonus?: number
    level_bonus?: number
  }
}

export interface AuctionBid {
  bid_id?: string
  auction_id: number
  unit_name?: string
  bid_amount: number
  deposit_amount?: number
  status: string
  created_at: string
}

export interface MCDTransaction {
  id: string
  tx_type: string
  amount: number
  from_account_type?: string
  to_account_type?: string
  created_at: string
}

export interface MCDReward {
  id: string
  reward_date: string
  territory_id?: string
  mcd_received: number
  created_at: string
}

export interface MiningRequest {
  mcc_amount: number
  stablecoin?: string
  wallet_address: string
}

export interface MiningConfirmData {
  request_id: string
  tx_signature: string
  mcc_amount: number
  usdc_amount: number
  stablecoin_type?: string
}

export interface MiningRequestResult {
  request_id: string
  mcc_amount: number
  usdc_amount: number
  mining_price: number
  stablecoin: string
  payment_address: string
  expires_at: string
}

export interface MiningConfig {
  program_id: string
  pool_address: string
  mcc_mint: string
  usdt_mint: string
  usdc_mint: string
  distribution_ratios: Record<string, number>
  min_amount: number
  max_amount: number
}

export interface BuybackRecordInput {
  tx_signature: string
  wallet_address: string
  mcc_amount: number
  usdc_amount: number
  stablecoin?: string
}

export interface ReincarnationConfig {
  program_id: string
  pool_address: string
  mcc_vault: string
  usdc_vault: string
  usdt_vault: string
  min_buyback: number
  max_buyback: number
  premium_rate: number
}

export interface MCCHistoryRecord {
  mcc_amount: number
  stablecoin_amount: number
  stablecoin: string
  tx_signature: string
  type: string
  wallet_address?: string
  created_at: string
}

export interface CycleHistory {
  cycle_id: number
  executed_at: string
  mcc_returned: number
  mcd_returned: number
  status: string
}

export interface AuctionHistory {
  auction_id: number
  unit_name: string
  winner_wallet?: string
  winning_bid?: number
  status: string
  ended_at: string
}

export interface PaginatedResult<T> {
  records: T[]
  total: number
  page: number
  page_size: number
}

export interface MCCStats {
  total_supply: number
  circulating_supply: number
  holder_count: number
  total_mined: number
  price?: number
  market_cap?: number | null
  locked_amount?: number
}

export interface MiningStats {
  total_mined: number
  total_paid: number
  mining_count: number
  today_mined: number
  last_30d_mined: number
  active_days_30d: number
  last_mined_at: string | null
}

export interface TechTreeNode {
  node_id: string
  name: string
  level: number
  max_level: number
  unlocked: boolean
  prerequisites?: string[]
  bonus?: Record<string, number>
}

export interface TechTree {
  nodes: TechTreeNode[]
  total_unlocked: number
  total_nodes: number
}

export interface TechTreeBonus {
  bonus_multiplier: number
  active_bonuses?: Record<string, number>
}

export interface UserStats {
  total_users: number
  by_level: {
    recruit: number
    prospect: number
    miner: number
  }
}

export interface Organization {
  id: string
  name: string
  unit_type: UnitType
  parent_id?: string | null
  depth?: number
  children_count?: number
  member_count?: number
  children?: Organization[]
}

export interface OrganizationTreeNode {
  id: string
  name: string
  unit_type: UnitType
  depth: number
  children: OrganizationTreeNode[]
  member_count?: number
  vault_balance?: number
}

export interface MiningRecord {
  mcc_amount: number
  paid_amount: number
  stablecoin: string
  tx_signature: string
  mined_at: string | null
  status?: string
}

export interface MiningHistoryItem {
  mcc_amount: number
  usdc_amount: number
  stablecoin: string
  mining_price: number
  tx_signature: string
  wallet_address?: string
  status: string
  created_at: string
}

export interface PriceHistoryPoint {
  timestamp: string
  price: number
  volume?: number
}

export interface Auction {
  auction_id: number
  unit_name: string
  unit_type: UnitType
  starting_price: number
  current_bid?: number
  bid_count: number
  status: string
  start_time: string
  end_time: string
}

export interface AuctionDetail extends Auction {
  description?: string
  unit_id?: string
  winner_wallet?: string
  bids?: AuctionBid[]
  deposit_amount?: number
  min_increment?: number
}

export interface AuctionCreateInput {
  unit_id: string
  unit_name: string
  unit_type: UnitType
  starting_price: number
  deposit_amount: number
  duration_hours: number
  description?: string
}

export interface TerritoryIncome {
  date: string
  amount: number
  source: string
  territory_id?: string
}

export interface TerritoryKPI {
  date: string
  kpi_score: number
  member_count: number
  vault_balance: number
  daily_distribution: number
  mining_activity: number
}

export interface UserLevel {
  level: string
  title?: string | null
  upgrade_progress?: {
    current_days?: number
    required_days?: number
    percentage?: number
  }
  mining_weight?: Record<string, number>
}

export interface DashboardMarketSummary {
  price_usd: number
  price_change_24h: number
  volume_24h: number
  liquidity_usd: number
  fdv: number
  market_cap: number
}

export interface DashboardUserSummary {
  level: string
  title?: string | null
  mcc_balance: number
  mcd_balance?: number
  territory_id?: string | null
  mining_count?: number
}

export interface PublicMiningRequest {
  wallet_address: string
  mcc_amount: number
  stablecoin?: string
}

export interface Notification {
  id: string
  type: string
  title?: string
  message: string
  status: 'unread' | 'read'
  created_at: string
  data?: Record<string, any>
}

export interface OrganizationSummary {
  total_stations: number
  total_matrices: number
  total_sectors: number
  total_systems: number
  total_units: number
  total_members: number
}

export interface TerritoryDetailedStats {
  territory_id: string
  member_count: number
  max_capacity: number
  vault_mcd: number
  occupancy_rate: number
  total_mined: number
  mining_count: number
  daily_distribution: number
  kpi_score?: number
}

export interface ManagerIncomeRecord {
  date: string
  amount: number
  source: string
  territory_id?: string
}

export interface TeamCustodySummary {
  total_balance: number
  wallets: { wallet_type: string; balance: number; address: string }[]
}

export interface FragmentBuyInput {
  nft_mint: string
  amount: number
  max_price_per_fragment_usdc?: number
}

export interface FragmentizeInput {
  nft_mint: string
  fragment_count: number
}

export interface FragmentRedeemInput {
  nft_mint: string
}

export interface FragmentBuyoutInitiateInput {
  nft_mint: string
  price_per_fragment_usdc: number
}

export interface FragmentBuyoutAcceptInput {
  nft_mint: string
  initiator: string
  fragment_amount: number
}

export interface FragmentBuyoutCompleteInput {
  nft_mint: string
}

export interface FragmentBuyoutCancelInput {
  nft_mint: string
}

export interface LendingDepositInput {
  wallet: string
  amount: number
}

export interface LendingWithdrawInput {
  wallet: string
  lp_amount: number
}

export interface LendingBorrowInput {
  wallet: string
  amount: number
  nft_mint: string
  duration_type: number
}

export interface LendingRepayInput {
  wallet: string
  nft_mint: string
  amount: number
}

export interface LendingExtendInput {
  wallet: string
  nft_mint: string
  new_duration_type: number
}

export interface LendingLiquidateInput {
  liquidator_wallet: string
  borrower_wallet: string
  nft_mint: string
}

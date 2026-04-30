// CrymadX Supported Assets Configuration
// 230+ cryptocurrencies supported by the platform (23 native chains + tokens)

export interface AssetConfig {
  symbol: string;
  name: string;
  chainId: string;
  network: string;
  type: 'native' | 'token';
  decimals: number;
  minDeposit: string;
  minWithdraw: string;
  withdrawFee: string;
  confirmations: number;
  addressType: 'circle_evm' | 'circle_sol' | 'tatum_btc' | 'tatum_ltc' | 'tatum_doge' | 'tatum_xrp' | 'tatum_xlm' | 'tatum_bnb' | 'tatum_trx' | 'tatum_ada' | 'tatum_bch' | 'tatum_ton' | 'tatum_algo' | 'tatum_dot' | 'tatum_atom' | 'tatum_near' | 'tatum_sui' | 'tatum_etc';
  hasMemo?: boolean;
  hasTag?: boolean;
  color: string;
  iconUrl?: string;
}

// ============================================
// NATIVE ASSETS (23 chains)
// ============================================
// Minimum withdrawals calculated as: 3x (networkFee + $0.50 platform fee)
// Network fees (USD): BTC=$5, ETH=$5, BNB=$0.5, SOL=$0.01, TRX=$1, MATIC=$0.1, AVAX=$0.5, ARB=$0.2, OP=$0.2, BASE=$0.1, LTC=$0.1, DOGE=$0.5, XRP=$0.01, XLM=$0.01
export const nativeAssets: AssetConfig[] = [
  { symbol: 'BTC', name: 'Bitcoin', chainId: 'btc', network: 'Bitcoin', type: 'native', decimals: 8, minDeposit: '0.0001', minWithdraw: '0.0002', withdrawFee: '0.0001', confirmations: 3, addressType: 'tatum_btc', color: '#F7931A' }, // $18 min @ $90k
  { symbol: 'ETH', name: 'Ethereum', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'native', decimals: 18, minDeposit: '0.001', minWithdraw: '0.01', withdrawFee: '0.001', confirmations: 12, addressType: 'circle_evm', color: '#627EEA' }, // $30 min @ $3k
  { symbol: 'BNB', name: 'BNB', chainId: 'bsc', network: 'BNB Smart Chain (BEP-20)', type: 'native', decimals: 18, minDeposit: '0.01', minWithdraw: '0.01', withdrawFee: '0.0005', confirmations: 15, addressType: 'tatum_bnb', color: '#F3BA2F' }, // $6 min @ $600
  { symbol: 'SOL', name: 'Solana', chainId: 'sol', network: 'Solana', type: 'native', decimals: 9, minDeposit: '0.01', minWithdraw: '0.02', withdrawFee: '0.01', confirmations: 32, addressType: 'circle_sol', color: '#9945FF' }, // $3 min @ $150
  { symbol: 'TRX', name: 'TRON', chainId: 'trx', network: 'TRON (TRC-20)', type: 'native', decimals: 6, minDeposit: '1', minWithdraw: '25', withdrawFee: '1', confirmations: 20, addressType: 'tatum_trx', color: '#FF0013' }, // $6.25 min @ $0.25
  { symbol: 'MATIC', name: 'Polygon', chainId: 'matic', network: 'Polygon', type: 'native', decimals: 18, minDeposit: '1', minWithdraw: '5', withdrawFee: '0.1', confirmations: 128, addressType: 'circle_evm', color: '#8247E5' }, // $2.5 min @ $0.5
  { symbol: 'AVAX', name: 'Avalanche', chainId: 'avax', network: 'Avalanche C-Chain', type: 'native', decimals: 18, minDeposit: '0.1', minWithdraw: '0.15', withdrawFee: '0.01', confirmations: 20, addressType: 'circle_evm', color: '#E84142' }, // $4.5 min @ $30
  { symbol: 'ARB', name: 'Arbitrum', chainId: 'arb', network: 'Arbitrum One', type: 'native', decimals: 18, minDeposit: '0.001', minWithdraw: '0.003', withdrawFee: '0.0005', confirmations: 20, addressType: 'circle_evm', color: '#28A0F0' }, // $9 min @ $3k (ETH gas)
  { symbol: 'OP', name: 'Optimism', chainId: 'op', network: 'Optimism', type: 'native', decimals: 18, minDeposit: '0.001', minWithdraw: '0.003', withdrawFee: '0.0005', confirmations: 20, addressType: 'circle_evm', color: '#FF0420' }, // $9 min @ $3k (ETH gas)
  { symbol: 'BASE', name: 'Base', chainId: 'base', network: 'Base', type: 'native', decimals: 18, minDeposit: '0.001', minWithdraw: '0.002', withdrawFee: '0.0005', confirmations: 20, addressType: 'circle_evm', color: '#0052FF' }, // $6 min @ $3k (ETH gas)
  { symbol: 'LTC', name: 'Litecoin', chainId: 'ltc', network: 'Litecoin', type: 'native', decimals: 8, minDeposit: '0.001', minWithdraw: '0.02', withdrawFee: '0.001', confirmations: 6, addressType: 'tatum_ltc', color: '#345D9D' }, // $2 min @ $100
  { symbol: 'DOGE', name: 'Dogecoin', chainId: 'doge', network: 'Dogecoin', type: 'native', decimals: 8, minDeposit: '10', minWithdraw: '15', withdrawFee: '5', confirmations: 40, addressType: 'tatum_doge', color: '#C2A633' }, // $4.5 min @ $0.30
  { symbol: 'XRP', name: 'XRP', chainId: 'xrp', network: 'XRP Ledger', type: 'native', decimals: 6, minDeposit: '1', minWithdraw: '5', withdrawFee: '0.25', confirmations: 1, addressType: 'tatum_xrp', hasTag: true, color: '#23292F' }, // $2.5 min @ $0.5
  { symbol: 'XLM', name: 'Stellar', chainId: 'xlm', network: 'Stellar', type: 'native', decimals: 7, minDeposit: '1', minWithdraw: '20', withdrawFee: '0.1', confirmations: 1, addressType: 'tatum_xlm', hasMemo: true, color: '#14B6E7' }, // $2 min @ $0.1
  // NEW TATUM CHAINS (9 chains)
  { symbol: 'ADA', name: 'Cardano', chainId: 'ada', network: 'Cardano', type: 'native', decimals: 6, minDeposit: '1', minWithdraw: '2', withdrawFee: '0.5', confirmations: 15, addressType: 'tatum_ada', color: '#0033AD' }, // $1 min @ $0.5
  { symbol: 'BCH', name: 'Bitcoin Cash', chainId: 'bch', network: 'Bitcoin Cash', type: 'native', decimals: 8, minDeposit: '0.0005', minWithdraw: '0.001', withdrawFee: '0.0001', confirmations: 6, addressType: 'tatum_bch', color: '#8DC351' }, // $0.50 min @ $500
  { symbol: 'TON', name: 'Toncoin', chainId: 'ton', network: 'TON', type: 'native', decimals: 9, minDeposit: '0.5', minWithdraw: '1', withdrawFee: '0.1', confirmations: 1, addressType: 'tatum_ton', color: '#0098EA' }, // $6 min @ $6
  { symbol: 'ALGO', name: 'Algorand', chainId: 'algo', network: 'Algorand', type: 'native', decimals: 6, minDeposit: '0.1', minWithdraw: '0.1', withdrawFee: '0.01', confirmations: 1, addressType: 'tatum_algo', color: '#000000' }, // $0.05 min @ $0.5
  { symbol: 'DOT', name: 'Polkadot', chainId: 'dot', network: 'Polkadot', type: 'native', decimals: 10, minDeposit: '0.5', minWithdraw: '1', withdrawFee: '0.1', confirmations: 1, addressType: 'tatum_dot', color: '#E6007A' }, // $6 min @ $6
  { symbol: 'ATOM', name: 'Cosmos', chainId: 'atom', network: 'Cosmos Hub', type: 'native', decimals: 6, minDeposit: '0.1', minWithdraw: '0.5', withdrawFee: '0.01', confirmations: 1, addressType: 'tatum_atom', hasMemo: true, color: '#2E3148' }, // $5 min @ $10
  { symbol: 'NEAR', name: 'NEAR Protocol', chainId: 'near', network: 'NEAR', type: 'native', decimals: 24, minDeposit: '0.1', minWithdraw: '0.5', withdrawFee: '0.01', confirmations: 1, addressType: 'tatum_near', color: '#00C08B' }, // $3 min @ $6
  { symbol: 'SUI', name: 'Sui', chainId: 'sui', network: 'Sui', type: 'native', decimals: 9, minDeposit: '0.25', minWithdraw: '0.5', withdrawFee: '0.1', confirmations: 1, addressType: 'tatum_sui', color: '#4DA2FF' }, // $2.5 min @ $5
  { symbol: 'ETC', name: 'Ethereum Classic', chainId: 'etc', network: 'Ethereum Classic', type: 'native', decimals: 18, minDeposit: '0.01', minWithdraw: '0.1', withdrawFee: '0.01', confirmations: 120, addressType: 'tatum_etc', color: '#328332' }, // $2 min @ $20
];

// ============================================
// ERC-20 TOKENS ON ETHEREUM (120 tokens)
// ============================================
// ERC-20: Network fee $5 + $0.50 platform = $5.50, min withdrawal = $17 (3x), set to $20
export const erc20Tokens: AssetConfig[] = [
  // Stablecoins - $20 minimum for ETH chain
  { symbol: 'USDT', name: 'Tether USD', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 6, minDeposit: '1', minWithdraw: '20', withdrawFee: '5', confirmations: 12, addressType: 'circle_evm', color: '#26A17B' },
  { symbol: 'USDC', name: 'USD Coin', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 6, minDeposit: '1', minWithdraw: '20', withdrawFee: '5', confirmations: 12, addressType: 'circle_evm', color: '#2775CA' },
  { symbol: 'DAI', name: 'Dai Stablecoin', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 18, minDeposit: '1', minWithdraw: '20', withdrawFee: '5', confirmations: 12, addressType: 'circle_evm', color: '#F5AC37' },
  { symbol: 'FRAX', name: 'Frax', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 18, minDeposit: '1', minWithdraw: '20', withdrawFee: '5', confirmations: 12, addressType: 'circle_evm', color: '#000000' },
  { symbol: 'TUSD', name: 'TrueUSD', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 18, minDeposit: '1', minWithdraw: '20', withdrawFee: '5', confirmations: 12, addressType: 'circle_evm', color: '#2B2E7F' },
  { symbol: 'USDP', name: 'Pax Dollar', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 18, minDeposit: '1', minWithdraw: '20', withdrawFee: '5', confirmations: 12, addressType: 'circle_evm', color: '#00845D' },
  // Wrapped Assets
  { symbol: 'WBTC', name: 'Wrapped Bitcoin', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 8, minDeposit: '0.0001', minWithdraw: '0.001', withdrawFee: '0.0005', confirmations: 12, addressType: 'circle_evm', color: '#F7931A' },
  { symbol: 'WETH', name: 'Wrapped Ether', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 18, minDeposit: '0.001', minWithdraw: '0.01', withdrawFee: '0.005', confirmations: 12, addressType: 'circle_evm', color: '#627EEA' },
  { symbol: 'stETH', name: 'Lido Staked ETH', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 18, minDeposit: '0.001', minWithdraw: '0.01', withdrawFee: '0.005', confirmations: 12, addressType: 'circle_evm', color: '#00A3FF' },
  { symbol: 'rETH', name: 'Rocket Pool ETH', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 18, minDeposit: '0.001', minWithdraw: '0.01', withdrawFee: '0.005', confirmations: 12, addressType: 'circle_evm', color: '#EC6B23' },
  // DeFi Blue Chips
  { symbol: 'LINK', name: 'Chainlink', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 18, minDeposit: '0.1', minWithdraw: '1', withdrawFee: '0.5', confirmations: 12, addressType: 'circle_evm', color: '#375BD2' },
  { symbol: 'UNI', name: 'Uniswap', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 18, minDeposit: '0.1', minWithdraw: '1', withdrawFee: '0.5', confirmations: 12, addressType: 'circle_evm', color: '#FF007A' },
  { symbol: 'AAVE', name: 'Aave', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 18, minDeposit: '0.01', minWithdraw: '0.1', withdrawFee: '0.05', confirmations: 12, addressType: 'circle_evm', color: '#B6509E' },
  { symbol: 'MKR', name: 'Maker', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 18, minDeposit: '0.001', minWithdraw: '0.01', withdrawFee: '0.005', confirmations: 12, addressType: 'circle_evm', color: '#1AAB9B' },
  { symbol: 'SNX', name: 'Synthetix', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 18, minDeposit: '0.5', minWithdraw: '5', withdrawFee: '2', confirmations: 12, addressType: 'circle_evm', color: '#00D1FF' },
  { symbol: 'CRV', name: 'Curve DAO', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 18, minDeposit: '1', minWithdraw: '10', withdrawFee: '5', confirmations: 12, addressType: 'circle_evm', color: '#40649F' },
  { symbol: 'COMP', name: 'Compound', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 18, minDeposit: '0.01', minWithdraw: '0.1', withdrawFee: '0.05', confirmations: 12, addressType: 'circle_evm', color: '#00D395' },
  { symbol: 'LDO', name: 'Lido DAO', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 18, minDeposit: '0.5', minWithdraw: '5', withdrawFee: '2', confirmations: 12, addressType: 'circle_evm', color: '#F69988' },
  { symbol: 'RPL', name: 'Rocket Pool', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 18, minDeposit: '0.05', minWithdraw: '0.5', withdrawFee: '0.2', confirmations: 12, addressType: 'circle_evm', color: '#EC6B23' },
  { symbol: '1INCH', name: '1inch', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 18, minDeposit: '1', minWithdraw: '10', withdrawFee: '5', confirmations: 12, addressType: 'circle_evm', color: '#94A6C3' },
  { symbol: 'SUSHI', name: 'SushiSwap', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 18, minDeposit: '1', minWithdraw: '10', withdrawFee: '5', confirmations: 12, addressType: 'circle_evm', color: '#FA52A0' },
  { symbol: 'BAL', name: 'Balancer', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 18, minDeposit: '0.1', minWithdraw: '1', withdrawFee: '0.5', confirmations: 12, addressType: 'circle_evm', color: '#1E1E1E' },
  { symbol: 'YFI', name: 'yearn.finance', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 18, minDeposit: '0.0001', minWithdraw: '0.001', withdrawFee: '0.0005', confirmations: 12, addressType: 'circle_evm', color: '#006AE3' },
  // Meme Coins
  { symbol: 'SHIB', name: 'Shiba Inu', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 18, minDeposit: '100000', minWithdraw: '1000000', withdrawFee: '500000', confirmations: 12, addressType: 'circle_evm', color: '#FFA409' },
  { symbol: 'PEPE', name: 'Pepe', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 18, minDeposit: '1000000', minWithdraw: '10000000', withdrawFee: '5000000', confirmations: 12, addressType: 'circle_evm', color: '#479F53' },
  { symbol: 'FLOKI', name: 'Floki Inu', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 9, minDeposit: '10000', minWithdraw: '100000', withdrawFee: '50000', confirmations: 12, addressType: 'circle_evm', color: '#F5A623' },
  { symbol: 'ELON', name: 'Dogelon Mars', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 18, minDeposit: '1000000', minWithdraw: '10000000', withdrawFee: '5000000', confirmations: 12, addressType: 'circle_evm', color: '#C2A633' },
  // Layer 2 & Infrastructure
  { symbol: 'MATIC', name: 'Polygon (ERC-20)', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 18, minDeposit: '1', minWithdraw: '10', withdrawFee: '5', confirmations: 12, addressType: 'circle_evm', color: '#8247E5' },
  { symbol: 'IMX', name: 'Immutable X', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 18, minDeposit: '1', minWithdraw: '10', withdrawFee: '5', confirmations: 12, addressType: 'circle_evm', color: '#00BFBF' },
  { symbol: 'LRC', name: 'Loopring', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 18, minDeposit: '5', minWithdraw: '50', withdrawFee: '20', confirmations: 12, addressType: 'circle_evm', color: '#1C60FF' },
  { symbol: 'METIS', name: 'Metis', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 18, minDeposit: '0.05', minWithdraw: '0.5', withdrawFee: '0.2', confirmations: 12, addressType: 'circle_evm', color: '#00DACC' },
  // Gaming & Metaverse
  { symbol: 'SAND', name: 'The Sandbox', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 18, minDeposit: '1', minWithdraw: '10', withdrawFee: '5', confirmations: 12, addressType: 'circle_evm', color: '#04ADEF' },
  { symbol: 'MANA', name: 'Decentraland', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 18, minDeposit: '1', minWithdraw: '10', withdrawFee: '5', confirmations: 12, addressType: 'circle_evm', color: '#FF2D55' },
  { symbol: 'AXS', name: 'Axie Infinity', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 18, minDeposit: '0.1', minWithdraw: '1', withdrawFee: '0.5', confirmations: 12, addressType: 'circle_evm', color: '#0055D5' },
  { symbol: 'ENJ', name: 'Enjin Coin', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 18, minDeposit: '1', minWithdraw: '10', withdrawFee: '5', confirmations: 12, addressType: 'circle_evm', color: '#624DBF' },
  { symbol: 'GALA', name: 'Gala', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 8, minDeposit: '10', minWithdraw: '100', withdrawFee: '50', confirmations: 12, addressType: 'circle_evm', color: '#000000' },
  { symbol: 'ILV', name: 'Illuvium', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 18, minDeposit: '0.01', minWithdraw: '0.1', withdrawFee: '0.05', confirmations: 12, addressType: 'circle_evm', color: '#8246FF' },
  { symbol: 'APE', name: 'ApeCoin', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 18, minDeposit: '0.5', minWithdraw: '5', withdrawFee: '2', confirmations: 12, addressType: 'circle_evm', color: '#0056D6' },
  // AI & Data
  { symbol: 'FET', name: 'Fetch.ai', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 18, minDeposit: '1', minWithdraw: '10', withdrawFee: '5', confirmations: 12, addressType: 'circle_evm', color: '#1D2951' },
  { symbol: 'AGIX', name: 'SingularityNET', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 8, minDeposit: '5', minWithdraw: '50', withdrawFee: '20', confirmations: 12, addressType: 'circle_evm', color: '#6916FF' },
  { symbol: 'OCEAN', name: 'Ocean Protocol', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 18, minDeposit: '1', minWithdraw: '10', withdrawFee: '5', confirmations: 12, addressType: 'circle_evm', color: '#FF4092' },
  { symbol: 'GRT', name: 'The Graph', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 18, minDeposit: '5', minWithdraw: '50', withdrawFee: '20', confirmations: 12, addressType: 'circle_evm', color: '#6747ED' },
  { symbol: 'RNDR', name: 'Render', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 18, minDeposit: '0.5', minWithdraw: '5', withdrawFee: '2', confirmations: 12, addressType: 'circle_evm', color: '#000000' },
  // Other Popular
  { symbol: 'ENS', name: 'Ethereum Name Service', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 18, minDeposit: '0.05', minWithdraw: '0.5', withdrawFee: '0.2', confirmations: 12, addressType: 'circle_evm', color: '#5284FF' },
  { symbol: 'BLUR', name: 'Blur', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 18, minDeposit: '1', minWithdraw: '10', withdrawFee: '5', confirmations: 12, addressType: 'circle_evm', color: '#FF6B00' },
  { symbol: 'DYDX', name: 'dYdX', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 18, minDeposit: '0.5', minWithdraw: '5', withdrawFee: '2', confirmations: 12, addressType: 'circle_evm', color: '#6966FF' },
  { symbol: 'MASK', name: 'Mask Network', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 18, minDeposit: '0.5', minWithdraw: '5', withdrawFee: '2', confirmations: 12, addressType: 'circle_evm', color: '#1C68F3' },
  { symbol: 'ANKR', name: 'Ankr', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 18, minDeposit: '50', minWithdraw: '500', withdrawFee: '200', confirmations: 12, addressType: 'circle_evm', color: '#2E6BED' },
  { symbol: 'CHZ', name: 'Chiliz', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 18, minDeposit: '10', minWithdraw: '100', withdrawFee: '50', confirmations: 12, addressType: 'circle_evm', color: '#CD0124' },
  { symbol: 'CRO', name: 'Cronos', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 8, minDeposit: '10', minWithdraw: '100', withdrawFee: '50', confirmations: 12, addressType: 'circle_evm', color: '#002D74' },
  // Wrapped Tokens for Unsupported Native Chains
  { symbol: 'WHBAR', name: 'Wrapped Hedera', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 8, minDeposit: '10', minWithdraw: '50', withdrawFee: '10', confirmations: 12, addressType: 'circle_evm', color: '#3A3A3A' },
  { symbol: 'WFIL', name: 'Wrapped Filecoin', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 18, minDeposit: '0.5', minWithdraw: '2', withdrawFee: '0.5', confirmations: 12, addressType: 'circle_evm', color: '#0090FF' },
  { symbol: 'WAPT', name: 'Wrapped Aptos', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 8, minDeposit: '0.5', minWithdraw: '2', withdrawFee: '0.5', confirmations: 12, addressType: 'circle_evm', color: '#66CDAA' },
  // Additional DeFi Tokens
  { symbol: 'PENDLE', name: 'Pendle', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 18, minDeposit: '0.5', minWithdraw: '5', withdrawFee: '2', confirmations: 12, addressType: 'circle_evm', color: '#0ABAB5' },
  { symbol: 'CVX', name: 'Convex Finance', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 18, minDeposit: '0.5', minWithdraw: '5', withdrawFee: '2', confirmations: 12, addressType: 'circle_evm', color: '#3A3A3A' },
  { symbol: 'FXS', name: 'Frax Share', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 18, minDeposit: '0.5', minWithdraw: '5', withdrawFee: '2', confirmations: 12, addressType: 'circle_evm', color: '#000000' },
  { symbol: 'SPELL', name: 'Spell Token', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 18, minDeposit: '5000', minWithdraw: '50000', withdrawFee: '20000', confirmations: 12, addressType: 'circle_evm', color: '#8B5CF6' },
  { symbol: 'ALCX', name: 'Alchemix', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 18, minDeposit: '0.05', minWithdraw: '0.5', withdrawFee: '0.2', confirmations: 12, addressType: 'circle_evm', color: '#F5C09A' },
  { symbol: 'BADGER', name: 'Badger DAO', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 18, minDeposit: '0.5', minWithdraw: '5', withdrawFee: '2', confirmations: 12, addressType: 'circle_evm', color: '#F2A52B' },
  { symbol: 'LQTY', name: 'Liquity', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 18, minDeposit: '1', minWithdraw: '10', withdrawFee: '5', confirmations: 12, addressType: 'circle_evm', color: '#2EB6EA' },
  { symbol: 'PERP', name: 'Perpetual Protocol', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 18, minDeposit: '1', minWithdraw: '10', withdrawFee: '5', confirmations: 12, addressType: 'circle_evm', color: '#00C8BB' },
  { symbol: 'GMX', name: 'GMX', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 18, minDeposit: '0.05', minWithdraw: '0.5', withdrawFee: '0.2', confirmations: 12, addressType: 'circle_evm', color: '#2D42FC' },
  { symbol: 'BNT', name: 'Bancor', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 18, minDeposit: '1', minWithdraw: '10', withdrawFee: '5', confirmations: 12, addressType: 'circle_evm', color: '#000D2B' },
  { symbol: 'KNC', name: 'Kyber Network', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 18, minDeposit: '1', minWithdraw: '10', withdrawFee: '5', confirmations: 12, addressType: 'circle_evm', color: '#31CB9E' },
  { symbol: 'ZRX', name: '0x Protocol', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 18, minDeposit: '5', minWithdraw: '50', withdrawFee: '20', confirmations: 12, addressType: 'circle_evm', color: '#302C2C' },
  { symbol: 'INST', name: 'Instadapp', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 18, minDeposit: '1', minWithdraw: '10', withdrawFee: '5', confirmations: 12, addressType: 'circle_evm', color: '#3F75FF' },
  { symbol: 'RBN', name: 'Ribbon Finance', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 18, minDeposit: '5', minWithdraw: '50', withdrawFee: '20', confirmations: 12, addressType: 'circle_evm', color: '#FC0A54' },
  { symbol: 'TRIBE', name: 'Tribe', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 18, minDeposit: '10', minWithdraw: '100', withdrawFee: '50', confirmations: 12, addressType: 'circle_evm', color: '#2ECC71' },
  // NFT & Marketplace Tokens
  { symbol: 'LOOKS', name: 'LooksRare', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 18, minDeposit: '5', minWithdraw: '50', withdrawFee: '20', confirmations: 12, addressType: 'circle_evm', color: '#0CE466' },
  { symbol: 'X2Y2', name: 'X2Y2', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 18, minDeposit: '10', minWithdraw: '100', withdrawFee: '50', confirmations: 12, addressType: 'circle_evm', color: '#0052FF' },
  { symbol: 'SUDO', name: 'Sudoswap', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 18, minDeposit: '1', minWithdraw: '10', withdrawFee: '5', confirmations: 12, addressType: 'circle_evm', color: '#FF007A' },
  { symbol: 'RARE', name: 'SuperRare', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 18, minDeposit: '5', minWithdraw: '50', withdrawFee: '20', confirmations: 12, addressType: 'circle_evm', color: '#000000' },
  { symbol: 'AUDIO', name: 'Audius', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 18, minDeposit: '5', minWithdraw: '50', withdrawFee: '20', confirmations: 12, addressType: 'circle_evm', color: '#CC0FE0' },
  { symbol: 'RAD', name: 'Radicle', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 18, minDeposit: '0.5', minWithdraw: '5', withdrawFee: '2', confirmations: 12, addressType: 'circle_evm', color: '#5555FF' },
  // Additional AI Tokens
  { symbol: 'NMR', name: 'Numeraire', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 18, minDeposit: '0.1', minWithdraw: '1', withdrawFee: '0.5', confirmations: 12, addressType: 'circle_evm', color: '#1D1D1D' },
  { symbol: 'AIOZ', name: 'AIOZ Network', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 18, minDeposit: '5', minWithdraw: '50', withdrawFee: '20', confirmations: 12, addressType: 'circle_evm', color: '#FACA00' },
  { symbol: 'ARKM', name: 'Arkham', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 18, minDeposit: '1', minWithdraw: '10', withdrawFee: '5', confirmations: 12, addressType: 'circle_evm', color: '#000000' },
  { symbol: 'WLD', name: 'Worldcoin', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 18, minDeposit: '0.5', minWithdraw: '5', withdrawFee: '2', confirmations: 12, addressType: 'circle_evm', color: '#000000' },
  { symbol: 'TAO', name: 'Bittensor', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 18, minDeposit: '0.01', minWithdraw: '0.1', withdrawFee: '0.05', confirmations: 12, addressType: 'circle_evm', color: '#000000' },
  // Gaming Tokens
  { symbol: 'GODS', name: 'Gods Unchained', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 18, minDeposit: '5', minWithdraw: '50', withdrawFee: '20', confirmations: 12, addressType: 'circle_evm', color: '#E4B95C' },
  { symbol: 'ALICE', name: 'My Neighbor Alice', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 6, minDeposit: '0.5', minWithdraw: '5', withdrawFee: '2', confirmations: 12, addressType: 'circle_evm', color: '#E45757' },
  { symbol: 'PRIME', name: 'Echelon Prime', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 18, minDeposit: '0.1', minWithdraw: '1', withdrawFee: '0.5', confirmations: 12, addressType: 'circle_evm', color: '#C00000' },
  { symbol: 'SUPER', name: 'SuperVerse', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 18, minDeposit: '1', minWithdraw: '10', withdrawFee: '5', confirmations: 12, addressType: 'circle_evm', color: '#FF2D55' },
  { symbol: 'PYR', name: 'Vulcan Forged', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 18, minDeposit: '0.5', minWithdraw: '5', withdrawFee: '2', confirmations: 12, addressType: 'circle_evm', color: '#FFA500' },
  { symbol: 'MAGIC', name: 'Magic', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 18, minDeposit: '1', minWithdraw: '10', withdrawFee: '5', confirmations: 12, addressType: 'circle_evm', color: '#DC143C' },
  { symbol: 'LOOM', name: 'Loom Network', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 18, minDeposit: '10', minWithdraw: '100', withdrawFee: '50', confirmations: 12, addressType: 'circle_evm', color: '#48BFE3' },
  // Additional Meme Coins
  { symbol: 'BONE', name: 'Bone ShibaSwap', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 18, minDeposit: '1', minWithdraw: '10', withdrawFee: '5', confirmations: 12, addressType: 'circle_evm', color: '#EDCC54' },
  { symbol: 'LEASH', name: 'Doge Killer', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 18, minDeposit: '0.005', minWithdraw: '0.05', withdrawFee: '0.02', confirmations: 12, addressType: 'circle_evm', color: '#FFA409' },
  { symbol: 'VOLT', name: 'Volt Inu', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 9, minDeposit: '1000000000', minWithdraw: '10000000000', withdrawFee: '5000000000', confirmations: 12, addressType: 'circle_evm', color: '#7B68EE' },
  { symbol: 'TURBO', name: 'Turbo', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 18, minDeposit: '50000', minWithdraw: '500000', withdrawFee: '200000', confirmations: 12, addressType: 'circle_evm', color: '#FF6600' },
  { symbol: 'LADYS', name: 'Milady Meme Coin', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 18, minDeposit: '1000000000', minWithdraw: '10000000000', withdrawFee: '5000000000', confirmations: 12, addressType: 'circle_evm', color: '#FFB6C1' },
  { symbol: 'WOJAK', name: 'Wojak', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 18, minDeposit: '100000', minWithdraw: '1000000', withdrawFee: '500000', confirmations: 12, addressType: 'circle_evm', color: '#61BF00' },
  // Infrastructure & Storage
  { symbol: 'STORJ', name: 'Storj', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 8, minDeposit: '5', minWithdraw: '50', withdrawFee: '20', confirmations: 12, addressType: 'circle_evm', color: '#2683FF' },
  { symbol: 'AR', name: 'Arweave', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 12, minDeposit: '0.1', minWithdraw: '1', withdrawFee: '0.5', confirmations: 12, addressType: 'circle_evm', color: '#222326' },
  { symbol: 'FIL', name: 'Filecoin', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 18, minDeposit: '0.1', minWithdraw: '1', withdrawFee: '0.5', confirmations: 12, addressType: 'circle_evm', color: '#0090FF' },
  { symbol: 'THETA', name: 'Theta Network', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 18, minDeposit: '1', minWithdraw: '10', withdrawFee: '5', confirmations: 12, addressType: 'circle_evm', color: '#2AB8E6' },
  { symbol: 'HNT', name: 'Helium', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 8, minDeposit: '0.1', minWithdraw: '1', withdrawFee: '0.5', confirmations: 12, addressType: 'circle_evm', color: '#474DFF' },
  // Exchange Tokens
  { symbol: 'LEO', name: 'LEO Token', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 18, minDeposit: '0.5', minWithdraw: '5', withdrawFee: '2', confirmations: 12, addressType: 'circle_evm', color: '#002E60' },
  { symbol: 'OKB', name: 'OKB', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 18, minDeposit: '0.1', minWithdraw: '1', withdrawFee: '0.5', confirmations: 12, addressType: 'circle_evm', color: '#2D60FF' },
  { symbol: 'GT', name: 'GateToken', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 18, minDeposit: '0.5', minWithdraw: '5', withdrawFee: '2', confirmations: 12, addressType: 'circle_evm', color: '#2354E6' },
  { symbol: 'MX', name: 'MX Token', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 18, minDeposit: '1', minWithdraw: '10', withdrawFee: '5', confirmations: 12, addressType: 'circle_evm', color: '#1DA1F2' },
  { symbol: 'BGB', name: 'Bitget Token', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 18, minDeposit: '1', minWithdraw: '10', withdrawFee: '5', confirmations: 12, addressType: 'circle_evm', color: '#00F0FF' },
  { symbol: 'WBT', name: 'WhiteBIT Token', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 18, minDeposit: '0.5', minWithdraw: '5', withdrawFee: '2', confirmations: 12, addressType: 'circle_evm', color: '#00DC82' },
  { symbol: 'NEXO', name: 'Nexo', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 18, minDeposit: '1', minWithdraw: '10', withdrawFee: '5', confirmations: 12, addressType: 'circle_evm', color: '#1A4199' },
  // More DeFi
  { symbol: 'LUSD', name: 'Liquity USD', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 18, minDeposit: '1', minWithdraw: '20', withdrawFee: '5', confirmations: 12, addressType: 'circle_evm', color: '#745DDF' },
  { symbol: 'sUSD', name: 'sUSD', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 18, minDeposit: '1', minWithdraw: '20', withdrawFee: '5', confirmations: 12, addressType: 'circle_evm', color: '#1E1A31' },
  { symbol: 'GUSD', name: 'Gemini Dollar', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 2, minDeposit: '1', minWithdraw: '20', withdrawFee: '5', confirmations: 12, addressType: 'circle_evm', color: '#00DCFA' },
  { symbol: 'MIM', name: 'Magic Internet Money', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 18, minDeposit: '1', minWithdraw: '20', withdrawFee: '5', confirmations: 12, addressType: 'circle_evm', color: '#9695F8' },
  { symbol: 'HUSD', name: 'HUSD', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 8, minDeposit: '1', minWithdraw: '20', withdrawFee: '5', confirmations: 12, addressType: 'circle_evm', color: '#005BAC' },
  { symbol: 'cbETH', name: 'Coinbase Wrapped Staked ETH', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 18, minDeposit: '0.001', minWithdraw: '0.01', withdrawFee: '0.005', confirmations: 12, addressType: 'circle_evm', color: '#0052FF' },
  { symbol: 'wstETH', name: 'Wrapped stETH', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 18, minDeposit: '0.001', minWithdraw: '0.01', withdrawFee: '0.005', confirmations: 12, addressType: 'circle_evm', color: '#00A3FF' },
  { symbol: 'sfrxETH', name: 'Staked Frax Ether', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 18, minDeposit: '0.001', minWithdraw: '0.01', withdrawFee: '0.005', confirmations: 12, addressType: 'circle_evm', color: '#000000' },
  { symbol: 'swETH', name: 'Swell ETH', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 18, minDeposit: '0.001', minWithdraw: '0.01', withdrawFee: '0.005', confirmations: 12, addressType: 'circle_evm', color: '#2D7FF9' },
  { symbol: 'ETHx', name: 'Stader ETHx', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 18, minDeposit: '0.001', minWithdraw: '0.01', withdrawFee: '0.005', confirmations: 12, addressType: 'circle_evm', color: '#00F1A0' },
  // Privacy & Utility
  { symbol: 'TORN', name: 'Tornado Cash', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 18, minDeposit: '0.1', minWithdraw: '1', withdrawFee: '0.5', confirmations: 12, addressType: 'circle_evm', color: '#94FEBF' },
  { symbol: 'CVP', name: 'PowerPool', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 18, minDeposit: '5', minWithdraw: '50', withdrawFee: '20', confirmations: 12, addressType: 'circle_evm', color: '#23A455' },
  { symbol: 'MPL', name: 'Maple', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 18, minDeposit: '0.1', minWithdraw: '1', withdrawFee: '0.5', confirmations: 12, addressType: 'circle_evm', color: '#FF5E1B' },
  { symbol: 'TRU', name: 'TrueFi', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 8, minDeposit: '10', minWithdraw: '100', withdrawFee: '50', confirmations: 12, addressType: 'circle_evm', color: '#1A5AFF' },
  { symbol: 'RAI', name: 'Rai Reflex Index', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 18, minDeposit: '0.5', minWithdraw: '5', withdrawFee: '2', confirmations: 12, addressType: 'circle_evm', color: '#378272' },
  // More popular tokens
  { symbol: 'EGLD', name: 'MultiversX', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 18, minDeposit: '0.1', minWithdraw: '1', withdrawFee: '0.5', confirmations: 12, addressType: 'circle_evm', color: '#23F7DD' },
  { symbol: 'KAVA', name: 'Kava', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 6, minDeposit: '1', minWithdraw: '10', withdrawFee: '5', confirmations: 12, addressType: 'circle_evm', color: '#FF433E' },
  { symbol: 'ROSE', name: 'Oasis Network', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 18, minDeposit: '10', minWithdraw: '100', withdrawFee: '50', confirmations: 12, addressType: 'circle_evm', color: '#0085FF' },
  { symbol: 'ONE', name: 'Harmony', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 18, minDeposit: '100', minWithdraw: '1000', withdrawFee: '500', confirmations: 12, addressType: 'circle_evm', color: '#00ADE8' },
  { symbol: 'ZIL', name: 'Zilliqa', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 12, minDeposit: '100', minWithdraw: '1000', withdrawFee: '500', confirmations: 12, addressType: 'circle_evm', color: '#49C1BF' },
  { symbol: 'EOS', name: 'EOS', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 18, minDeposit: '1', minWithdraw: '10', withdrawFee: '5', confirmations: 12, addressType: 'circle_evm', color: '#000000' },
  { symbol: 'NEO', name: 'NEO', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 8, minDeposit: '0.1', minWithdraw: '1', withdrawFee: '0.5', confirmations: 12, addressType: 'circle_evm', color: '#00E599' },
  { symbol: 'IOTA', name: 'IOTA', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 6, minDeposit: '5', minWithdraw: '50', withdrawFee: '20', confirmations: 12, addressType: 'circle_evm', color: '#242424' },
  { symbol: 'XTZ', name: 'Tezos', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 6, minDeposit: '1', minWithdraw: '10', withdrawFee: '5', confirmations: 12, addressType: 'circle_evm', color: '#2C7DF7' },
  { symbol: 'QTUM', name: 'Qtum', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 8, minDeposit: '0.5', minWithdraw: '5', withdrawFee: '2', confirmations: 12, addressType: 'circle_evm', color: '#2E9AD0' },
  { symbol: 'WAVES', name: 'Waves', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 8, minDeposit: '0.5', minWithdraw: '5', withdrawFee: '2', confirmations: 12, addressType: 'circle_evm', color: '#0055FF' },
  { symbol: 'ICX', name: 'ICON', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 18, minDeposit: '5', minWithdraw: '50', withdrawFee: '20', confirmations: 12, addressType: 'circle_evm', color: '#1FC5C9' },
  { symbol: 'ZEN', name: 'Horizen', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 8, minDeposit: '0.1', minWithdraw: '1', withdrawFee: '0.5', confirmations: 12, addressType: 'circle_evm', color: '#00AAFF' },
  { symbol: 'DGB', name: 'DigiByte', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 8, minDeposit: '100', minWithdraw: '1000', withdrawFee: '500', confirmations: 12, addressType: 'circle_evm', color: '#006AD2' },
  { symbol: 'RVN', name: 'Ravencoin', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 8, minDeposit: '100', minWithdraw: '1000', withdrawFee: '500', confirmations: 12, addressType: 'circle_evm', color: '#F15B22' },
  { symbol: 'SC', name: 'Siacoin', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 24, minDeposit: '1000', minWithdraw: '10000', withdrawFee: '5000', confirmations: 12, addressType: 'circle_evm', color: '#20EE82' },
  { symbol: 'FLUX', name: 'Flux', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 8, minDeposit: '1', minWithdraw: '10', withdrawFee: '5', confirmations: 12, addressType: 'circle_evm', color: '#2B61D1' },
  { symbol: 'KDA', name: 'Kadena', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 12, minDeposit: '1', minWithdraw: '10', withdrawFee: '5', confirmations: 12, addressType: 'circle_evm', color: '#4A9079' },
  { symbol: 'CELO', name: 'Celo', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 18, minDeposit: '1', minWithdraw: '10', withdrawFee: '5', confirmations: 12, addressType: 'circle_evm', color: '#35D07F' },
  { symbol: 'MINA', name: 'Mina Protocol', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 9, minDeposit: '1', minWithdraw: '10', withdrawFee: '5', confirmations: 12, addressType: 'circle_evm', color: '#E39844' },
  { symbol: 'CFX', name: 'Conflux', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 18, minDeposit: '10', minWithdraw: '100', withdrawFee: '50', confirmations: 12, addressType: 'circle_evm', color: '#1CBFBE' },
  { symbol: 'KAS', name: 'Kaspa', chainId: 'eth', network: 'Ethereum (ERC-20)', type: 'token', decimals: 8, minDeposit: '10', minWithdraw: '100', withdrawFee: '50', confirmations: 12, addressType: 'circle_evm', color: '#70C7BA' },
];

// ============================================
// BEP-20 TOKENS ON BNB SMART CHAIN (80 tokens)
// ============================================
// BEP-20: Network fee $0.5 + $0.50 platform = $1.00, min withdrawal = $3 (3x), set to $5
export const bep20Tokens: AssetConfig[] = [
  // Stablecoins - $5 minimum for BSC chain
  { symbol: 'USDT', name: 'Tether USD', chainId: 'bsc', network: 'BNB Smart Chain (BEP-20)', type: 'token', decimals: 18, minDeposit: '1', minWithdraw: '5', withdrawFee: '1', confirmations: 15, addressType: 'tatum_bnb', color: '#26A17B' },
  { symbol: 'USDC', name: 'USD Coin', chainId: 'bsc', network: 'BNB Smart Chain (BEP-20)', type: 'token', decimals: 18, minDeposit: '1', minWithdraw: '5', withdrawFee: '1', confirmations: 15, addressType: 'tatum_bnb', color: '#2775CA' },
  { symbol: 'BUSD', name: 'Binance USD', chainId: 'bsc', network: 'BNB Smart Chain (BEP-20)', type: 'token', decimals: 18, minDeposit: '1', minWithdraw: '5', withdrawFee: '1', confirmations: 15, addressType: 'tatum_bnb', color: '#F0B90B' },
  { symbol: 'DAI', name: 'Dai Stablecoin', chainId: 'bsc', network: 'BNB Smart Chain (BEP-20)', type: 'token', decimals: 18, minDeposit: '1', minWithdraw: '5', withdrawFee: '1', confirmations: 15, addressType: 'tatum_bnb', color: '#F5AC37' },
  // DeFi
  { symbol: 'CAKE', name: 'PancakeSwap', chainId: 'bsc', network: 'BNB Smart Chain (BEP-20)', type: 'token', decimals: 18, minDeposit: '0.1', minWithdraw: '1', withdrawFee: '0.1', confirmations: 15, addressType: 'tatum_bnb', color: '#D1884F' },
  { symbol: 'XVS', name: 'Venus', chainId: 'bsc', network: 'BNB Smart Chain (BEP-20)', type: 'token', decimals: 18, minDeposit: '0.1', minWithdraw: '1', withdrawFee: '0.5', confirmations: 15, addressType: 'tatum_bnb', color: '#F5B93B' },
  { symbol: 'ALPACA', name: 'Alpaca Finance', chainId: 'bsc', network: 'BNB Smart Chain (BEP-20)', type: 'token', decimals: 18, minDeposit: '1', minWithdraw: '10', withdrawFee: '5', confirmations: 15, addressType: 'tatum_bnb', color: '#F5E042' },
  { symbol: 'BAKE', name: 'BakerySwap', chainId: 'bsc', network: 'BNB Smart Chain (BEP-20)', type: 'token', decimals: 18, minDeposit: '1', minWithdraw: '10', withdrawFee: '5', confirmations: 15, addressType: 'tatum_bnb', color: '#FFB237' },
  { symbol: 'BSW', name: 'Biswap', chainId: 'bsc', network: 'BNB Smart Chain (BEP-20)', type: 'token', decimals: 18, minDeposit: '1', minWithdraw: '10', withdrawFee: '5', confirmations: 15, addressType: 'tatum_bnb', color: '#1263F1' },
  // Gaming
  { symbol: 'AXS', name: 'Axie Infinity', chainId: 'bsc', network: 'BNB Smart Chain (BEP-20)', type: 'token', decimals: 18, minDeposit: '0.1', minWithdraw: '1', withdrawFee: '0.5', confirmations: 15, addressType: 'tatum_bnb', color: '#0055D5' },
  { symbol: 'SLP', name: 'Smooth Love Potion', chainId: 'bsc', network: 'BNB Smart Chain (BEP-20)', type: 'token', decimals: 0, minDeposit: '100', minWithdraw: '1000', withdrawFee: '500', confirmations: 15, addressType: 'tatum_bnb', color: '#F08080' },
  { symbol: 'HERO', name: 'Metahero', chainId: 'bsc', network: 'BNB Smart Chain (BEP-20)', type: 'token', decimals: 18, minDeposit: '10', minWithdraw: '100', withdrawFee: '50', confirmations: 15, addressType: 'tatum_bnb', color: '#DF1AFF' },
  { symbol: 'MBOX', name: 'MOBOX', chainId: 'bsc', network: 'BNB Smart Chain (BEP-20)', type: 'token', decimals: 18, minDeposit: '1', minWithdraw: '10', withdrawFee: '5', confirmations: 15, addressType: 'tatum_bnb', color: '#FFC700' },
  // Meme & Community
  { symbol: 'SHIB', name: 'Shiba Inu', chainId: 'bsc', network: 'BNB Smart Chain (BEP-20)', type: 'token', decimals: 18, minDeposit: '100000', minWithdraw: '1000000', withdrawFee: '100000', confirmations: 15, addressType: 'tatum_bnb', color: '#FFA409' },
  { symbol: 'FLOKI', name: 'Floki Inu', chainId: 'bsc', network: 'BNB Smart Chain (BEP-20)', type: 'token', decimals: 9, minDeposit: '10000', minWithdraw: '100000', withdrawFee: '10000', confirmations: 15, addressType: 'tatum_bnb', color: '#F5A623' },
  { symbol: 'BABYDOGE', name: 'Baby Doge Coin', chainId: 'bsc', network: 'BNB Smart Chain (BEP-20)', type: 'token', decimals: 9, minDeposit: '1000000000', minWithdraw: '10000000000', withdrawFee: '1000000000', confirmations: 15, addressType: 'tatum_bnb', color: '#F9A826' },
  { symbol: 'SAFEMOON', name: 'SafeMoon', chainId: 'bsc', network: 'BNB Smart Chain (BEP-20)', type: 'token', decimals: 9, minDeposit: '100000', minWithdraw: '1000000', withdrawFee: '100000', confirmations: 15, addressType: 'tatum_bnb', color: '#00A79D' },
  // Infrastructure
  { symbol: 'TWT', name: 'Trust Wallet Token', chainId: 'bsc', network: 'BNB Smart Chain (BEP-20)', type: 'token', decimals: 18, minDeposit: '0.5', minWithdraw: '5', withdrawFee: '2', confirmations: 15, addressType: 'tatum_bnb', color: '#3375BB' },
  { symbol: 'INJ', name: 'Injective', chainId: 'bsc', network: 'BNB Smart Chain (BEP-20)', type: 'token', decimals: 18, minDeposit: '0.1', minWithdraw: '1', withdrawFee: '0.5', confirmations: 15, addressType: 'tatum_bnb', color: '#00F2FE' },
  { symbol: 'LINK', name: 'Chainlink', chainId: 'bsc', network: 'BNB Smart Chain (BEP-20)', type: 'token', decimals: 18, minDeposit: '0.1', minWithdraw: '1', withdrawFee: '0.5', confirmations: 15, addressType: 'tatum_bnb', color: '#375BD2' },
  { symbol: 'UNI', name: 'Uniswap', chainId: 'bsc', network: 'BNB Smart Chain (BEP-20)', type: 'token', decimals: 18, minDeposit: '0.1', minWithdraw: '1', withdrawFee: '0.5', confirmations: 15, addressType: 'tatum_bnb', color: '#FF007A' },
  // Wrapped
  { symbol: 'BTCB', name: 'Bitcoin BEP2', chainId: 'bsc', network: 'BNB Smart Chain (BEP-20)', type: 'token', decimals: 18, minDeposit: '0.0001', minWithdraw: '0.001', withdrawFee: '0.0005', confirmations: 15, addressType: 'tatum_bnb', color: '#F7931A' },
  { symbol: 'ETH', name: 'Ethereum (BEP-20)', chainId: 'bsc', network: 'BNB Smart Chain (BEP-20)', type: 'token', decimals: 18, minDeposit: '0.001', minWithdraw: '0.01', withdrawFee: '0.005', confirmations: 15, addressType: 'tatum_bnb', color: '#627EEA' },
  // Other Popular
  { symbol: 'C98', name: 'Coin98', chainId: 'bsc', network: 'BNB Smart Chain (BEP-20)', type: 'token', decimals: 18, minDeposit: '1', minWithdraw: '10', withdrawFee: '5', confirmations: 15, addressType: 'tatum_bnb', color: '#D9B432' },
  { symbol: 'DODO', name: 'DODO', chainId: 'bsc', network: 'BNB Smart Chain (BEP-20)', type: 'token', decimals: 18, minDeposit: '5', minWithdraw: '50', withdrawFee: '20', confirmations: 15, addressType: 'tatum_bnb', color: '#FFE804' },
  { symbol: 'LINA', name: 'Linear Finance', chainId: 'bsc', network: 'BNB Smart Chain (BEP-20)', type: 'token', decimals: 18, minDeposit: '50', minWithdraw: '500', withdrawFee: '200', confirmations: 15, addressType: 'tatum_bnb', color: '#1BD8EF' },
  { symbol: 'SFP', name: 'SafePal', chainId: 'bsc', network: 'BNB Smart Chain (BEP-20)', type: 'token', decimals: 18, minDeposit: '1', minWithdraw: '10', withdrawFee: '5', confirmations: 15, addressType: 'tatum_bnb', color: '#4D5FFF' },
  { symbol: 'RACA', name: 'Radio Caca', chainId: 'bsc', network: 'BNB Smart Chain (BEP-20)', type: 'token', decimals: 18, minDeposit: '1000', minWithdraw: '10000', withdrawFee: '5000', confirmations: 15, addressType: 'tatum_bnb', color: '#FF5C00' },
  { symbol: 'HIGH', name: 'Highstreet', chainId: 'bsc', network: 'BNB Smart Chain (BEP-20)', type: 'token', decimals: 18, minDeposit: '0.5', minWithdraw: '5', withdrawFee: '2', confirmations: 15, addressType: 'tatum_bnb', color: '#0066FF' },
  { symbol: 'CHESS', name: 'Tranchess', chainId: 'bsc', network: 'BNB Smart Chain (BEP-20)', type: 'token', decimals: 18, minDeposit: '1', minWithdraw: '10', withdrawFee: '5', confirmations: 15, addressType: 'tatum_bnb', color: '#5D47FF' },
  { symbol: 'BURGER', name: 'BurgerSwap', chainId: 'bsc', network: 'BNB Smart Chain (BEP-20)', type: 'token', decimals: 18, minDeposit: '1', minWithdraw: '10', withdrawFee: '5', confirmations: 15, addressType: 'tatum_bnb', color: '#F5A623' },
  { symbol: 'AUTO', name: 'Auto', chainId: 'bsc', network: 'BNB Smart Chain (BEP-20)', type: 'token', decimals: 18, minDeposit: '0.001', minWithdraw: '0.01', withdrawFee: '0.005', confirmations: 15, addressType: 'tatum_bnb', color: '#2D2D2D' },
  { symbol: 'BELT', name: 'Belt Finance', chainId: 'bsc', network: 'BNB Smart Chain (BEP-20)', type: 'token', decimals: 18, minDeposit: '0.5', minWithdraw: '5', withdrawFee: '2', confirmations: 15, addressType: 'tatum_bnb', color: '#0066FF' },
  { symbol: 'WOM', name: 'Wombat Exchange', chainId: 'bsc', network: 'BNB Smart Chain (BEP-20)', type: 'token', decimals: 18, minDeposit: '10', minWithdraw: '100', withdrawFee: '50', confirmations: 15, addressType: 'tatum_bnb', color: '#FF69B4' },
  { symbol: 'THE', name: 'Thena', chainId: 'bsc', network: 'BNB Smart Chain (BEP-20)', type: 'token', decimals: 18, minDeposit: '1', minWithdraw: '10', withdrawFee: '5', confirmations: 15, addressType: 'tatum_bnb', color: '#8B5CF6' },
  // Additional BSC Tokens
  { symbol: 'BIFI', name: 'Beefy Finance', chainId: 'bsc', network: 'BNB Smart Chain (BEP-20)', type: 'token', decimals: 18, minDeposit: '0.001', minWithdraw: '0.01', withdrawFee: '0.005', confirmations: 15, addressType: 'tatum_bnb', color: '#59A662' },
  { symbol: 'BUNNY', name: 'Pancake Bunny', chainId: 'bsc', network: 'BNB Smart Chain (BEP-20)', type: 'token', decimals: 18, minDeposit: '0.5', minWithdraw: '5', withdrawFee: '2', confirmations: 15, addressType: 'tatum_bnb', color: '#FAD551' },
  { symbol: 'EPS', name: 'Ellipsis', chainId: 'bsc', network: 'BNB Smart Chain (BEP-20)', type: 'token', decimals: 18, minDeposit: '50', minWithdraw: '500', withdrawFee: '200', confirmations: 15, addressType: 'tatum_bnb', color: '#00A3FF' },
  { symbol: 'MDX', name: 'Mdex', chainId: 'bsc', network: 'BNB Smart Chain (BEP-20)', type: 'token', decimals: 18, minDeposit: '5', minWithdraw: '50', withdrawFee: '20', confirmations: 15, addressType: 'tatum_bnb', color: '#00BFFF' },
  { symbol: 'WBNB', name: 'Wrapped BNB', chainId: 'bsc', network: 'BNB Smart Chain (BEP-20)', type: 'token', decimals: 18, minDeposit: '0.01', minWithdraw: '0.1', withdrawFee: '0.05', confirmations: 15, addressType: 'tatum_bnb', color: '#F3BA2F' },
  { symbol: 'VAI', name: 'Vai', chainId: 'bsc', network: 'BNB Smart Chain (BEP-20)', type: 'token', decimals: 18, minDeposit: '1', minWithdraw: '5', withdrawFee: '1', confirmations: 15, addressType: 'tatum_bnb', color: '#F4B942' },
  { symbol: 'GMT', name: 'STEPN', chainId: 'bsc', network: 'BNB Smart Chain (BEP-20)', type: 'token', decimals: 8, minDeposit: '1', minWithdraw: '10', withdrawFee: '5', confirmations: 15, addressType: 'tatum_bnb', color: '#E4C874' },
  { symbol: 'GST', name: 'Green Satoshi Token', chainId: 'bsc', network: 'BNB Smart Chain (BEP-20)', type: 'token', decimals: 8, minDeposit: '10', minWithdraw: '100', withdrawFee: '50', confirmations: 15, addressType: 'tatum_bnb', color: '#E4C874' },
  { symbol: 'DAR', name: 'Mines of Dalarnia', chainId: 'bsc', network: 'BNB Smart Chain (BEP-20)', type: 'token', decimals: 6, minDeposit: '5', minWithdraw: '50', withdrawFee: '20', confirmations: 15, addressType: 'tatum_bnb', color: '#FFC800' },
  { symbol: 'ID', name: 'SPACE ID', chainId: 'bsc', network: 'BNB Smart Chain (BEP-20)', type: 'token', decimals: 18, minDeposit: '1', minWithdraw: '10', withdrawFee: '5', confirmations: 15, addressType: 'tatum_bnb', color: '#28A8E1' },
  { symbol: 'HOOK', name: 'Hooked Protocol', chainId: 'bsc', network: 'BNB Smart Chain (BEP-20)', type: 'token', decimals: 18, minDeposit: '0.5', minWithdraw: '5', withdrawFee: '2', confirmations: 15, addressType: 'tatum_bnb', color: '#FF5722' },
  { symbol: 'RDNT', name: 'Radiant Capital', chainId: 'bsc', network: 'BNB Smart Chain (BEP-20)', type: 'token', decimals: 18, minDeposit: '5', minWithdraw: '50', withdrawFee: '20', confirmations: 15, addressType: 'tatum_bnb', color: '#00BFFF' },
  { symbol: 'EDU', name: 'Open Campus', chainId: 'bsc', network: 'BNB Smart Chain (BEP-20)', type: 'token', decimals: 18, minDeposit: '1', minWithdraw: '10', withdrawFee: '5', confirmations: 15, addressType: 'tatum_bnb', color: '#0057FF' },
  { symbol: 'CYBER', name: 'CyberConnect', chainId: 'bsc', network: 'BNB Smart Chain (BEP-20)', type: 'token', decimals: 18, minDeposit: '0.1', minWithdraw: '1', withdrawFee: '0.5', confirmations: 15, addressType: 'tatum_bnb', color: '#000000' },
  { symbol: 'SEI', name: 'Sei', chainId: 'bsc', network: 'BNB Smart Chain (BEP-20)', type: 'token', decimals: 18, minDeposit: '1', minWithdraw: '10', withdrawFee: '5', confirmations: 15, addressType: 'tatum_bnb', color: '#9B1C1C' },
  { symbol: 'TIA', name: 'Celestia', chainId: 'bsc', network: 'BNB Smart Chain (BEP-20)', type: 'token', decimals: 18, minDeposit: '0.1', minWithdraw: '1', withdrawFee: '0.5', confirmations: 15, addressType: 'tatum_bnb', color: '#7B2BF9' },
  { symbol: 'SANTOS', name: 'Santos FC', chainId: 'bsc', network: 'BNB Smart Chain (BEP-20)', type: 'token', decimals: 8, minDeposit: '0.5', minWithdraw: '5', withdrawFee: '2', confirmations: 15, addressType: 'tatum_bnb', color: '#000000' },
  { symbol: 'LAZIO', name: 'Lazio Fan Token', chainId: 'bsc', network: 'BNB Smart Chain (BEP-20)', type: 'token', decimals: 8, minDeposit: '0.5', minWithdraw: '5', withdrawFee: '2', confirmations: 15, addressType: 'tatum_bnb', color: '#75C2F6' },
  { symbol: 'PORTO', name: 'FC Porto', chainId: 'bsc', network: 'BNB Smart Chain (BEP-20)', type: 'token', decimals: 8, minDeposit: '0.5', minWithdraw: '5', withdrawFee: '2', confirmations: 15, addressType: 'tatum_bnb', color: '#003A70' },
  { symbol: 'BAR', name: 'FC Barcelona', chainId: 'bsc', network: 'BNB Smart Chain (BEP-20)', type: 'token', decimals: 8, minDeposit: '0.1', minWithdraw: '1', withdrawFee: '0.5', confirmations: 15, addressType: 'tatum_bnb', color: '#A50044' },
  { symbol: 'JUV', name: 'Juventus', chainId: 'bsc', network: 'BNB Smart Chain (BEP-20)', type: 'token', decimals: 8, minDeposit: '0.1', minWithdraw: '1', withdrawFee: '0.5', confirmations: 15, addressType: 'tatum_bnb', color: '#000000' },
  { symbol: 'PSG', name: 'Paris Saint-Germain', chainId: 'bsc', network: 'BNB Smart Chain (BEP-20)', type: 'token', decimals: 8, minDeposit: '0.1', minWithdraw: '1', withdrawFee: '0.5', confirmations: 15, addressType: 'tatum_bnb', color: '#004170' },
  { symbol: 'ACM', name: 'AC Milan', chainId: 'bsc', network: 'BNB Smart Chain (BEP-20)', type: 'token', decimals: 8, minDeposit: '0.1', minWithdraw: '1', withdrawFee: '0.5', confirmations: 15, addressType: 'tatum_bnb', color: '#FB090B' },
  { symbol: 'CITY', name: 'Manchester City', chainId: 'bsc', network: 'BNB Smart Chain (BEP-20)', type: 'token', decimals: 8, minDeposit: '0.5', minWithdraw: '5', withdrawFee: '2', confirmations: 15, addressType: 'tatum_bnb', color: '#6CABDD' },
  { symbol: 'LEVER', name: 'LeverFi', chainId: 'bsc', network: 'BNB Smart Chain (BEP-20)', type: 'token', decimals: 18, minDeposit: '100', minWithdraw: '1000', withdrawFee: '500', confirmations: 15, addressType: 'tatum_bnb', color: '#33FF00' },
  { symbol: 'ACH', name: 'Alchemy Pay', chainId: 'bsc', network: 'BNB Smart Chain (BEP-20)', type: 'token', decimals: 8, minDeposit: '50', minWithdraw: '500', withdrawFee: '200', confirmations: 15, addressType: 'tatum_bnb', color: '#B4A1E5' },
  { symbol: 'COMBO', name: 'Combo', chainId: 'bsc', network: 'BNB Smart Chain (BEP-20)', type: 'token', decimals: 18, minDeposit: '1', minWithdraw: '10', withdrawFee: '5', confirmations: 15, addressType: 'tatum_bnb', color: '#FFC700' },
  { symbol: 'ORDI', name: 'ORDI', chainId: 'bsc', network: 'BNB Smart Chain (BEP-20)', type: 'token', decimals: 18, minDeposit: '0.05', minWithdraw: '0.5', withdrawFee: '0.2', confirmations: 15, addressType: 'tatum_bnb', color: '#F7931A' },
  { symbol: 'PIXEL', name: 'Pixels', chainId: 'bsc', network: 'BNB Smart Chain (BEP-20)', type: 'token', decimals: 18, minDeposit: '5', minWithdraw: '50', withdrawFee: '20', confirmations: 15, addressType: 'tatum_bnb', color: '#9933FF' },
  { symbol: 'PORTAL', name: 'Portal', chainId: 'bsc', network: 'BNB Smart Chain (BEP-20)', type: 'token', decimals: 18, minDeposit: '1', minWithdraw: '10', withdrawFee: '5', confirmations: 15, addressType: 'tatum_bnb', color: '#000000' },
  { symbol: 'AEVO', name: 'Aevo', chainId: 'bsc', network: 'BNB Smart Chain (BEP-20)', type: 'token', decimals: 18, minDeposit: '1', minWithdraw: '10', withdrawFee: '5', confirmations: 15, addressType: 'tatum_bnb', color: '#FF5C00' },
  { symbol: 'MANTA', name: 'Manta Network', chainId: 'bsc', network: 'BNB Smart Chain (BEP-20)', type: 'token', decimals: 18, minDeposit: '1', minWithdraw: '10', withdrawFee: '5', confirmations: 15, addressType: 'tatum_bnb', color: '#000000' },
  { symbol: 'JTO', name: 'Jito', chainId: 'bsc', network: 'BNB Smart Chain (BEP-20)', type: 'token', decimals: 18, minDeposit: '0.5', minWithdraw: '5', withdrawFee: '2', confirmations: 15, addressType: 'tatum_bnb', color: '#00F58C' },
  { symbol: 'ALT', name: 'AltLayer', chainId: 'bsc', network: 'BNB Smart Chain (BEP-20)', type: 'token', decimals: 18, minDeposit: '5', minWithdraw: '50', withdrawFee: '20', confirmations: 15, addressType: 'tatum_bnb', color: '#000000' },
  { symbol: 'DYM', name: 'Dymension', chainId: 'bsc', network: 'BNB Smart Chain (BEP-20)', type: 'token', decimals: 18, minDeposit: '0.5', minWithdraw: '5', withdrawFee: '2', confirmations: 15, addressType: 'tatum_bnb', color: '#FF6B00' },
  { symbol: 'STRK', name: 'Starknet', chainId: 'bsc', network: 'BNB Smart Chain (BEP-20)', type: 'token', decimals: 18, minDeposit: '1', minWithdraw: '10', withdrawFee: '5', confirmations: 15, addressType: 'tatum_bnb', color: '#EC796B' },
  { symbol: 'ENA', name: 'Ethena', chainId: 'bsc', network: 'BNB Smart Chain (BEP-20)', type: 'token', decimals: 18, minDeposit: '1', minWithdraw: '10', withdrawFee: '5', confirmations: 15, addressType: 'tatum_bnb', color: '#000000' },
  { symbol: 'PENDLE', name: 'Pendle', chainId: 'bsc', network: 'BNB Smart Chain (BEP-20)', type: 'token', decimals: 18, minDeposit: '0.5', minWithdraw: '5', withdrawFee: '2', confirmations: 15, addressType: 'tatum_bnb', color: '#0ABAB5' },
  { symbol: 'W', name: 'Wormhole', chainId: 'bsc', network: 'BNB Smart Chain (BEP-20)', type: 'token', decimals: 18, minDeposit: '1', minWithdraw: '10', withdrawFee: '5', confirmations: 15, addressType: 'tatum_bnb', color: '#000000' },
  { symbol: 'TNSR', name: 'Tensor', chainId: 'bsc', network: 'BNB Smart Chain (BEP-20)', type: 'token', decimals: 18, minDeposit: '1', minWithdraw: '10', withdrawFee: '5', confirmations: 15, addressType: 'tatum_bnb', color: '#FF5C00' },
  { symbol: 'SAGA', name: 'Saga', chainId: 'bsc', network: 'BNB Smart Chain (BEP-20)', type: 'token', decimals: 18, minDeposit: '0.5', minWithdraw: '5', withdrawFee: '2', confirmations: 15, addressType: 'tatum_bnb', color: '#000000' },
  { symbol: 'OMNI', name: 'Omni Network', chainId: 'bsc', network: 'BNB Smart Chain (BEP-20)', type: 'token', decimals: 18, minDeposit: '0.1', minWithdraw: '1', withdrawFee: '0.5', confirmations: 15, addressType: 'tatum_bnb', color: '#000000' },
  { symbol: 'REZ', name: 'Renzo', chainId: 'bsc', network: 'BNB Smart Chain (BEP-20)', type: 'token', decimals: 18, minDeposit: '5', minWithdraw: '50', withdrawFee: '20', confirmations: 15, addressType: 'tatum_bnb', color: '#7CFF7C' },
  { symbol: 'NOT', name: 'Notcoin', chainId: 'bsc', network: 'BNB Smart Chain (BEP-20)', type: 'token', decimals: 18, minDeposit: '100', minWithdraw: '1000', withdrawFee: '500', confirmations: 15, addressType: 'tatum_bnb', color: '#000000' },
  { symbol: 'BB', name: 'BounceBit', chainId: 'bsc', network: 'BNB Smart Chain (BEP-20)', type: 'token', decimals: 18, minDeposit: '5', minWithdraw: '50', withdrawFee: '20', confirmations: 15, addressType: 'tatum_bnb', color: '#F5A623' },
];

// ============================================
// TRC-20 TOKENS ON TRON (40 tokens)
// ============================================
// TRC-20: Network fee $1 + $0.50 platform = $1.50, min withdrawal = $4.50 (3x), set to $5
export const trc20Tokens: AssetConfig[] = [
  { symbol: 'USDT', name: 'Tether USD', chainId: 'trx', network: 'TRON (TRC-20)', type: 'token', decimals: 6, minDeposit: '1', minWithdraw: '5', withdrawFee: '1', confirmations: 20, addressType: 'tatum_trx', color: '#26A17B' },
  { symbol: 'USDC', name: 'USD Coin', chainId: 'trx', network: 'TRON (TRC-20)', type: 'token', decimals: 6, minDeposit: '1', minWithdraw: '5', withdrawFee: '1', confirmations: 20, addressType: 'tatum_trx', color: '#2775CA' },
  { symbol: 'USDD', name: 'USDD', chainId: 'trx', network: 'TRON (TRC-20)', type: 'token', decimals: 18, minDeposit: '1', minWithdraw: '5', withdrawFee: '1', confirmations: 20, addressType: 'tatum_trx', color: '#39B54A' },
  { symbol: 'TUSD', name: 'TrueUSD', chainId: 'trx', network: 'TRON (TRC-20)', type: 'token', decimals: 18, minDeposit: '1', minWithdraw: '5', withdrawFee: '1', confirmations: 20, addressType: 'tatum_trx', color: '#2B2E7F' },
  { symbol: 'BTT', name: 'BitTorrent', chainId: 'trx', network: 'TRON (TRC-20)', type: 'token', decimals: 18, minDeposit: '10000', minWithdraw: '100000', withdrawFee: '50000', confirmations: 20, addressType: 'tatum_trx', color: '#FF0013' },
  { symbol: 'JST', name: 'JUST', chainId: 'trx', network: 'TRON (TRC-20)', type: 'token', decimals: 18, minDeposit: '10', minWithdraw: '100', withdrawFee: '50', confirmations: 20, addressType: 'tatum_trx', color: '#C4161C' },
  { symbol: 'SUN', name: 'SUN', chainId: 'trx', network: 'TRON (TRC-20)', type: 'token', decimals: 18, minDeposit: '0.1', minWithdraw: '1', withdrawFee: '0.5', confirmations: 20, addressType: 'tatum_trx', color: '#FFB700' },
  { symbol: 'WIN', name: 'WINkLink', chainId: 'trx', network: 'TRON (TRC-20)', type: 'token', decimals: 6, minDeposit: '10000', minWithdraw: '100000', withdrawFee: '50000', confirmations: 20, addressType: 'tatum_trx', color: '#006EF2' },
  { symbol: 'NFT', name: 'APENFT', chainId: 'trx', network: 'TRON (TRC-20)', type: 'token', decimals: 6, minDeposit: '100000', minWithdraw: '1000000', withdrawFee: '500000', confirmations: 20, addressType: 'tatum_trx', color: '#000000' },
  { symbol: 'WTRX', name: 'Wrapped TRX', chainId: 'trx', network: 'TRON (TRC-20)', type: 'token', decimals: 6, minDeposit: '10', minWithdraw: '100', withdrawFee: '50', confirmations: 20, addressType: 'tatum_trx', color: '#FF0013' },
  { symbol: 'SUNOLD', name: 'SUN (Old)', chainId: 'trx', network: 'TRON (TRC-20)', type: 'token', decimals: 18, minDeposit: '0.001', minWithdraw: '0.01', withdrawFee: '0.005', confirmations: 20, addressType: 'tatum_trx', color: '#FFB700' },
  { symbol: 'USDJ', name: 'JUST Stablecoin', chainId: 'trx', network: 'TRON (TRC-20)', type: 'token', decimals: 18, minDeposit: '1', minWithdraw: '10', withdrawFee: '5', confirmations: 20, addressType: 'tatum_trx', color: '#C4161C' },
  // Exchange tokens on TRON
  { symbol: 'HT', name: 'Huobi Token', chainId: 'trx', network: 'TRON (TRC-20)', type: 'token', decimals: 18, minDeposit: '0.5', minWithdraw: '5', withdrawFee: '2', confirmations: 20, addressType: 'tatum_trx', color: '#2DA0E2' },
  { symbol: 'OKB', name: 'OKB', chainId: 'trx', network: 'TRON (TRC-20)', type: 'token', decimals: 18, minDeposit: '0.1', minWithdraw: '1', withdrawFee: '0.5', confirmations: 20, addressType: 'tatum_trx', color: '#2D60FF' },
  { symbol: 'LEO', name: 'LEO Token', chainId: 'trx', network: 'TRON (TRC-20)', type: 'token', decimals: 18, minDeposit: '0.5', minWithdraw: '5', withdrawFee: '2', confirmations: 20, addressType: 'tatum_trx', color: '#002E60' },
  { symbol: 'KCS', name: 'KuCoin Token', chainId: 'trx', network: 'TRON (TRC-20)', type: 'token', decimals: 6, minDeposit: '0.1', minWithdraw: '1', withdrawFee: '0.5', confirmations: 20, addressType: 'tatum_trx', color: '#23AF91' },
  { symbol: 'GT', name: 'GateToken', chainId: 'trx', network: 'TRON (TRC-20)', type: 'token', decimals: 18, minDeposit: '0.5', minWithdraw: '5', withdrawFee: '2', confirmations: 20, addressType: 'tatum_trx', color: '#2354E6' },
  { symbol: 'MX', name: 'MX Token', chainId: 'trx', network: 'TRON (TRC-20)', type: 'token', decimals: 18, minDeposit: '1', minWithdraw: '10', withdrawFee: '5', confirmations: 20, addressType: 'tatum_trx', color: '#1DA1F2' },
  { symbol: 'BGB', name: 'Bitget Token', chainId: 'trx', network: 'TRON (TRC-20)', type: 'token', decimals: 18, minDeposit: '1', minWithdraw: '10', withdrawFee: '5', confirmations: 20, addressType: 'tatum_trx', color: '#00F0FF' },
  { symbol: 'WBT', name: 'WhiteBIT Token', chainId: 'trx', network: 'TRON (TRC-20)', type: 'token', decimals: 18, minDeposit: '0.5', minWithdraw: '5', withdrawFee: '2', confirmations: 20, addressType: 'tatum_trx', color: '#00DC82' },
  { symbol: 'NEXO', name: 'Nexo', chainId: 'trx', network: 'TRON (TRC-20)', type: 'token', decimals: 18, minDeposit: '1', minWithdraw: '10', withdrawFee: '5', confirmations: 20, addressType: 'tatum_trx', color: '#1A4199' },
];

// ============================================
// SPL TOKENS ON SOLANA (70 tokens)
// ============================================
// SPL: Network fee $0.01 + $0.50 platform = $0.51, min withdrawal = $1.53 (3x), set to $3
export const splTokens: AssetConfig[] = [
  // Stablecoins - $3 minimum for Solana chain
  { symbol: 'USDT', name: 'Tether USD', chainId: 'sol', network: 'Solana (SPL)', type: 'token', decimals: 6, minDeposit: '1', minWithdraw: '3', withdrawFee: '1', confirmations: 32, addressType: 'circle_sol', color: '#26A17B' },
  { symbol: 'USDC', name: 'USD Coin', chainId: 'sol', network: 'Solana (SPL)', type: 'token', decimals: 6, minDeposit: '1', minWithdraw: '3', withdrawFee: '1', confirmations: 32, addressType: 'circle_sol', color: '#2775CA' },
  { symbol: 'PYUSD', name: 'PayPal USD', chainId: 'sol', network: 'Solana (SPL)', type: 'token', decimals: 6, minDeposit: '1', minWithdraw: '3', withdrawFee: '1', confirmations: 32, addressType: 'circle_sol', color: '#003087' },
  // DeFi
  { symbol: 'RAY', name: 'Raydium', chainId: 'sol', network: 'Solana (SPL)', type: 'token', decimals: 6, minDeposit: '0.1', minWithdraw: '1', withdrawFee: '0.1', confirmations: 32, addressType: 'circle_sol', color: '#7B5BE3' },
  { symbol: 'ORCA', name: 'Orca', chainId: 'sol', network: 'Solana (SPL)', type: 'token', decimals: 6, minDeposit: '0.5', minWithdraw: '5', withdrawFee: '2', confirmations: 32, addressType: 'circle_sol', color: '#FFD15C' },
  { symbol: 'SRM', name: 'Serum', chainId: 'sol', network: 'Solana (SPL)', type: 'token', decimals: 6, minDeposit: '1', minWithdraw: '10', withdrawFee: '5', confirmations: 32, addressType: 'circle_sol', color: '#4EC3CC' },
  { symbol: 'MNGO', name: 'Mango', chainId: 'sol', network: 'Solana (SPL)', type: 'token', decimals: 6, minDeposit: '10', minWithdraw: '100', withdrawFee: '50', confirmations: 32, addressType: 'circle_sol', color: '#E54033' },
  { symbol: 'STEP', name: 'Step Finance', chainId: 'sol', network: 'Solana (SPL)', type: 'token', decimals: 9, minDeposit: '10', minWithdraw: '100', withdrawFee: '50', confirmations: 32, addressType: 'circle_sol', color: '#00FF95' },
  { symbol: 'JTO', name: 'Jito', chainId: 'sol', network: 'Solana (SPL)', type: 'token', decimals: 9, minDeposit: '0.1', minWithdraw: '1', withdrawFee: '0.5', confirmations: 32, addressType: 'circle_sol', color: '#7F56D9' },
  { symbol: 'JUP', name: 'Jupiter', chainId: 'sol', network: 'Solana (SPL)', type: 'token', decimals: 6, minDeposit: '1', minWithdraw: '10', withdrawFee: '5', confirmations: 32, addressType: 'circle_sol', color: '#00D395' },
  // Meme Coins
  { symbol: 'BONK', name: 'Bonk', chainId: 'sol', network: 'Solana (SPL)', type: 'token', decimals: 5, minDeposit: '100000', minWithdraw: '1000000', withdrawFee: '50000', confirmations: 32, addressType: 'circle_sol', color: '#F6A14C' },
  { symbol: 'WIF', name: 'dogwifhat', chainId: 'sol', network: 'Solana (SPL)', type: 'token', decimals: 6, minDeposit: '1', minWithdraw: '10', withdrawFee: '5', confirmations: 32, addressType: 'circle_sol', color: '#B19CD9' },
  { symbol: 'SAMO', name: 'Samoyedcoin', chainId: 'sol', network: 'Solana (SPL)', type: 'token', decimals: 9, minDeposit: '100', minWithdraw: '1000', withdrawFee: '500', confirmations: 32, addressType: 'circle_sol', color: '#FF6B00' },
  { symbol: 'POPCAT', name: 'Popcat', chainId: 'sol', network: 'Solana (SPL)', type: 'token', decimals: 9, minDeposit: '10', minWithdraw: '100', withdrawFee: '50', confirmations: 32, addressType: 'circle_sol', color: '#FFD700' },
  { symbol: 'MYRO', name: 'Myro', chainId: 'sol', network: 'Solana (SPL)', type: 'token', decimals: 9, minDeposit: '10', minWithdraw: '100', withdrawFee: '50', confirmations: 32, addressType: 'circle_sol', color: '#FF4500' },
  // NFT & Gaming
  { symbol: 'DUST', name: 'DUST Protocol', chainId: 'sol', network: 'Solana (SPL)', type: 'token', decimals: 9, minDeposit: '0.5', minWithdraw: '5', withdrawFee: '2', confirmations: 32, addressType: 'circle_sol', color: '#7C3AED' },
  { symbol: 'GMT', name: 'STEPN', chainId: 'sol', network: 'Solana (SPL)', type: 'token', decimals: 9, minDeposit: '1', minWithdraw: '10', withdrawFee: '5', confirmations: 32, addressType: 'circle_sol', color: '#D9E822' },
  { symbol: 'GST', name: 'Green Satoshi', chainId: 'sol', network: 'Solana (SPL)', type: 'token', decimals: 9, minDeposit: '10', minWithdraw: '100', withdrawFee: '50', confirmations: 32, addressType: 'circle_sol', color: '#00FF95' },
  // Wrapped
  { symbol: 'mSOL', name: 'Marinade SOL', chainId: 'sol', network: 'Solana (SPL)', type: 'token', decimals: 9, minDeposit: '0.01', minWithdraw: '0.1', withdrawFee: '0.05', confirmations: 32, addressType: 'circle_sol', color: '#308D8A' },
  { symbol: 'stSOL', name: 'Lido Staked SOL', chainId: 'sol', network: 'Solana (SPL)', type: 'token', decimals: 9, minDeposit: '0.01', minWithdraw: '0.1', withdrawFee: '0.05', confirmations: 32, addressType: 'circle_sol', color: '#00A3FF' },
  { symbol: 'jitoSOL', name: 'Jito Staked SOL', chainId: 'sol', network: 'Solana (SPL)', type: 'token', decimals: 9, minDeposit: '0.01', minWithdraw: '0.1', withdrawFee: '0.05', confirmations: 32, addressType: 'circle_sol', color: '#00CCBD' },
  // Other
  { symbol: 'RENDER', name: 'Render', chainId: 'sol', network: 'Solana (SPL)', type: 'token', decimals: 8, minDeposit: '0.5', minWithdraw: '5', withdrawFee: '2', confirmations: 32, addressType: 'circle_sol', color: '#000000' },
  { symbol: 'PYTH', name: 'Pyth Network', chainId: 'sol', network: 'Solana (SPL)', type: 'token', decimals: 6, minDeposit: '1', minWithdraw: '10', withdrawFee: '5', confirmations: 32, addressType: 'circle_sol', color: '#6633CC' },
  { symbol: 'HNT', name: 'Helium', chainId: 'sol', network: 'Solana (SPL)', type: 'token', decimals: 8, minDeposit: '0.1', minWithdraw: '1', withdrawFee: '0.5', confirmations: 32, addressType: 'circle_sol', color: '#474DFF' },
  { symbol: 'MOBILE', name: 'Helium Mobile', chainId: 'sol', network: 'Solana (SPL)', type: 'token', decimals: 6, minDeposit: '100', minWithdraw: '1000', withdrawFee: '500', confirmations: 32, addressType: 'circle_sol', color: '#2563EB' },
  // Additional Solana Memecoins
  { symbol: 'BOME', name: 'Book of Meme', chainId: 'sol', network: 'Solana (SPL)', type: 'token', decimals: 6, minDeposit: '50', minWithdraw: '500', withdrawFee: '200', confirmations: 32, addressType: 'circle_sol', color: '#8B4513' },
  { symbol: 'SLERF', name: 'Slerf', chainId: 'sol', network: 'Solana (SPL)', type: 'token', decimals: 9, minDeposit: '10', minWithdraw: '100', withdrawFee: '50', confirmations: 32, addressType: 'circle_sol', color: '#FF6B6B' },
  { symbol: 'MEW', name: 'cat in a dogs world', chainId: 'sol', network: 'Solana (SPL)', type: 'token', decimals: 5, minDeposit: '100', minWithdraw: '1000', withdrawFee: '500', confirmations: 32, addressType: 'circle_sol', color: '#4A90D9' },
  { symbol: 'FIDA', name: 'Bonfida', chainId: 'sol', network: 'Solana (SPL)', type: 'token', decimals: 6, minDeposit: '5', minWithdraw: '50', withdrawFee: '20', confirmations: 32, addressType: 'circle_sol', color: '#8B5CF6' },
  { symbol: 'TREMP', name: 'Doland Tremp', chainId: 'sol', network: 'Solana (SPL)', type: 'token', decimals: 9, minDeposit: '50', minWithdraw: '500', withdrawFee: '200', confirmations: 32, addressType: 'circle_sol', color: '#FF4500' },
  { symbol: 'BODEN', name: 'Jeo Boden', chainId: 'sol', network: 'Solana (SPL)', type: 'token', decimals: 9, minDeposit: '50', minWithdraw: '500', withdrawFee: '200', confirmations: 32, addressType: 'circle_sol', color: '#0000FF' },
  { symbol: 'PONKE', name: 'Ponke', chainId: 'sol', network: 'Solana (SPL)', type: 'token', decimals: 9, minDeposit: '10', minWithdraw: '100', withdrawFee: '50', confirmations: 32, addressType: 'circle_sol', color: '#00FF00' },
  { symbol: 'GIGA', name: 'Gigachad', chainId: 'sol', network: 'Solana (SPL)', type: 'token', decimals: 5, minDeposit: '50', minWithdraw: '500', withdrawFee: '200', confirmations: 32, addressType: 'circle_sol', color: '#DAA520' },
  // Solana DeFi
  { symbol: 'W', name: 'Wormhole', chainId: 'sol', network: 'Solana (SPL)', type: 'token', decimals: 6, minDeposit: '1', minWithdraw: '10', withdrawFee: '5', confirmations: 32, addressType: 'circle_sol', color: '#000000' },
  { symbol: 'TNSR', name: 'Tensor', chainId: 'sol', network: 'Solana (SPL)', type: 'token', decimals: 9, minDeposit: '1', minWithdraw: '10', withdrawFee: '5', confirmations: 32, addressType: 'circle_sol', color: '#FF5C00' },
  { symbol: 'KMNO', name: 'Kamino', chainId: 'sol', network: 'Solana (SPL)', type: 'token', decimals: 6, minDeposit: '5', minWithdraw: '50', withdrawFee: '20', confirmations: 32, addressType: 'circle_sol', color: '#00BFFF' },
  { symbol: 'ZEUS', name: 'Zeus Network', chainId: 'sol', network: 'Solana (SPL)', type: 'token', decimals: 6, minDeposit: '5', minWithdraw: '50', withdrawFee: '20', confirmations: 32, addressType: 'circle_sol', color: '#FFD700' },
  { symbol: 'DRIFT', name: 'Drift Protocol', chainId: 'sol', network: 'Solana (SPL)', type: 'token', decimals: 6, minDeposit: '1', minWithdraw: '10', withdrawFee: '5', confirmations: 32, addressType: 'circle_sol', color: '#6B5B95' },
  { symbol: 'HONEY', name: 'Hivemapper', chainId: 'sol', network: 'Solana (SPL)', type: 'token', decimals: 9, minDeposit: '10', minWithdraw: '100', withdrawFee: '50', confirmations: 32, addressType: 'circle_sol', color: '#FFD700' },
  { symbol: 'FORGE', name: 'Blocksmith Labs Forge', chainId: 'sol', network: 'Solana (SPL)', type: 'token', decimals: 9, minDeposit: '1', minWithdraw: '10', withdrawFee: '5', confirmations: 32, addressType: 'circle_sol', color: '#FF4500' },
  { symbol: 'MEAN', name: 'Mean Finance', chainId: 'sol', network: 'Solana (SPL)', type: 'token', decimals: 6, minDeposit: '10', minWithdraw: '100', withdrawFee: '50', confirmations: 32, addressType: 'circle_sol', color: '#00FF95' },
  { symbol: 'PORT', name: 'Port Finance', chainId: 'sol', network: 'Solana (SPL)', type: 'token', decimals: 6, minDeposit: '50', minWithdraw: '500', withdrawFee: '200', confirmations: 32, addressType: 'circle_sol', color: '#0070BA' },
  { symbol: 'TULIP', name: 'Tulip Protocol', chainId: 'sol', network: 'Solana (SPL)', type: 'token', decimals: 6, minDeposit: '1', minWithdraw: '10', withdrawFee: '5', confirmations: 32, addressType: 'circle_sol', color: '#FF69B4' },
  { symbol: 'SUNNY', name: 'Sunny Aggregator', chainId: 'sol', network: 'Solana (SPL)', type: 'token', decimals: 6, minDeposit: '100', minWithdraw: '1000', withdrawFee: '500', confirmations: 32, addressType: 'circle_sol', color: '#FFD700' },
  { symbol: 'SABER', name: 'Saber', chainId: 'sol', network: 'Solana (SPL)', type: 'token', decimals: 6, minDeposit: '100', minWithdraw: '1000', withdrawFee: '500', confirmations: 32, addressType: 'circle_sol', color: '#6B5B95' },
  { symbol: 'SBR', name: 'Saber', chainId: 'sol', network: 'Solana (SPL)', type: 'token', decimals: 6, minDeposit: '100', minWithdraw: '1000', withdrawFee: '500', confirmations: 32, addressType: 'circle_sol', color: '#6B5B95' },
  { symbol: 'ABR', name: 'Allbridge', chainId: 'sol', network: 'Solana (SPL)', type: 'token', decimals: 9, minDeposit: '5', minWithdraw: '50', withdrawFee: '20', confirmations: 32, addressType: 'circle_sol', color: '#00D395' },
  { symbol: 'HUBSOL', name: 'SolanaHub Staked SOL', chainId: 'sol', network: 'Solana (SPL)', type: 'token', decimals: 9, minDeposit: '0.01', minWithdraw: '0.1', withdrawFee: '0.05', confirmations: 32, addressType: 'circle_sol', color: '#9945FF' },
  { symbol: 'bSOL', name: 'BlazeStake Staked SOL', chainId: 'sol', network: 'Solana (SPL)', type: 'token', decimals: 9, minDeposit: '0.01', minWithdraw: '0.1', withdrawFee: '0.05', confirmations: 32, addressType: 'circle_sol', color: '#FF5722' },
  { symbol: 'INF', name: 'Infinity', chainId: 'sol', network: 'Solana (SPL)', type: 'token', decimals: 9, minDeposit: '0.01', minWithdraw: '0.1', withdrawFee: '0.05', confirmations: 32, addressType: 'circle_sol', color: '#9945FF' },
  { symbol: 'IOT', name: 'Helium IOT', chainId: 'sol', network: 'Solana (SPL)', type: 'token', decimals: 6, minDeposit: '1000', minWithdraw: '10000', withdrawFee: '5000', confirmations: 32, addressType: 'circle_sol', color: '#17B897' },
  { symbol: 'MEDIA', name: 'Media Network', chainId: 'sol', network: 'Solana (SPL)', type: 'token', decimals: 6, minDeposit: '1', minWithdraw: '10', withdrawFee: '5', confirmations: 32, addressType: 'circle_sol', color: '#00BFFF' },
  { symbol: 'MAPS', name: 'Maps.me', chainId: 'sol', network: 'Solana (SPL)', type: 'token', decimals: 6, minDeposit: '10', minWithdraw: '100', withdrawFee: '50', confirmations: 32, addressType: 'circle_sol', color: '#43B581' },
  { symbol: 'COPE', name: 'Cope', chainId: 'sol', network: 'Solana (SPL)', type: 'token', decimals: 6, minDeposit: '1', minWithdraw: '10', withdrawFee: '5', confirmations: 32, addressType: 'circle_sol', color: '#7B68EE' },
  { symbol: 'SLND', name: 'Solend', chainId: 'sol', network: 'Solana (SPL)', type: 'token', decimals: 6, minDeposit: '1', minWithdraw: '10', withdrawFee: '5', confirmations: 32, addressType: 'circle_sol', color: '#00BFFF' },
  { symbol: 'LIKE', name: 'Only1', chainId: 'sol', network: 'Solana (SPL)', type: 'token', decimals: 9, minDeposit: '10', minWithdraw: '100', withdrawFee: '50', confirmations: 32, addressType: 'circle_sol', color: '#FF69B4' },
  { symbol: 'CHEEMS', name: 'Cheems', chainId: 'sol', network: 'Solana (SPL)', type: 'token', decimals: 4, minDeposit: '10000', minWithdraw: '100000', withdrawFee: '50000', confirmations: 32, addressType: 'circle_sol', color: '#E4D96F' },
  { symbol: 'BERN', name: 'BonkEarn', chainId: 'sol', network: 'Solana (SPL)', type: 'token', decimals: 5, minDeposit: '1000', minWithdraw: '10000', withdrawFee: '5000', confirmations: 32, addressType: 'circle_sol', color: '#F6A14C' },
  { symbol: 'GUAC', name: 'Guacamole', chainId: 'sol', network: 'Solana (SPL)', type: 'token', decimals: 5, minDeposit: '10000', minWithdraw: '100000', withdrawFee: '50000', confirmations: 32, addressType: 'circle_sol', color: '#80C71F' },
  { symbol: 'EURC', name: 'Euro Coin', chainId: 'sol', network: 'Solana (SPL)', type: 'token', decimals: 6, minDeposit: '1', minWithdraw: '3', withdrawFee: '1', confirmations: 32, addressType: 'circle_sol', color: '#2775CA' },
  { symbol: 'SOL', name: 'Wrapped SOL', chainId: 'sol', network: 'Solana (SPL)', type: 'token', decimals: 9, minDeposit: '0.01', minWithdraw: '0.1', withdrawFee: '0.05', confirmations: 32, addressType: 'circle_sol', color: '#9945FF' },
  { symbol: 'wETH', name: 'Wrapped ETH (Wormhole)', chainId: 'sol', network: 'Solana (SPL)', type: 'token', decimals: 8, minDeposit: '0.001', minWithdraw: '0.01', withdrawFee: '0.005', confirmations: 32, addressType: 'circle_sol', color: '#627EEA' },
  { symbol: 'wBTC', name: 'Wrapped BTC (Wormhole)', chainId: 'sol', network: 'Solana (SPL)', type: 'token', decimals: 8, minDeposit: '0.0001', minWithdraw: '0.001', withdrawFee: '0.0005', confirmations: 32, addressType: 'circle_sol', color: '#F7931A' },
  { symbol: 'SYN', name: 'Synapse', chainId: 'sol', network: 'Solana (SPL)', type: 'token', decimals: 9, minDeposit: '1', minWithdraw: '10', withdrawFee: '5', confirmations: 32, addressType: 'circle_sol', color: '#FC307B' },
  { symbol: 'PRISM', name: 'Prism', chainId: 'sol', network: 'Solana (SPL)', type: 'token', decimals: 6, minDeposit: '50', minWithdraw: '500', withdrawFee: '200', confirmations: 32, addressType: 'circle_sol', color: '#7B68EE' },
  { symbol: 'UXD', name: 'UXD Stablecoin', chainId: 'sol', network: 'Solana (SPL)', type: 'token', decimals: 6, minDeposit: '1', minWithdraw: '3', withdrawFee: '1', confirmations: 32, addressType: 'circle_sol', color: '#00BFFF' },
  { symbol: 'RATIO', name: 'Ratio Protocol', chainId: 'sol', network: 'Solana (SPL)', type: 'token', decimals: 6, minDeposit: '10', minWithdraw: '100', withdrawFee: '50', confirmations: 32, addressType: 'circle_sol', color: '#6B5B95' },
];

// ============================================
// POLYGON TOKENS (55 tokens)
// ============================================
// Polygon: Network fee $0.1 + $0.50 platform = $0.60, min withdrawal = $1.80 (3x), set to $3
export const polygonTokens: AssetConfig[] = [
  { symbol: 'USDT', name: 'Tether USD', chainId: 'matic', network: 'Polygon', type: 'token', decimals: 6, minDeposit: '1', minWithdraw: '3', withdrawFee: '1', confirmations: 128, addressType: 'circle_evm', color: '#26A17B' },
  { symbol: 'USDC', name: 'USD Coin', chainId: 'matic', network: 'Polygon', type: 'token', decimals: 6, minDeposit: '1', minWithdraw: '3', withdrawFee: '1', confirmations: 128, addressType: 'circle_evm', color: '#2775CA' },
  { symbol: 'USDC.E', name: 'Bridged USD Coin', chainId: 'matic', network: 'Polygon', type: 'token', decimals: 6, minDeposit: '1', minWithdraw: '3', withdrawFee: '1', confirmations: 128, addressType: 'circle_evm', color: '#2775CA' },
  { symbol: 'DAI', name: 'Dai Stablecoin', chainId: 'matic', network: 'Polygon', type: 'token', decimals: 18, minDeposit: '1', minWithdraw: '3', withdrawFee: '1', confirmations: 128, addressType: 'circle_evm', color: '#F5AC37' },
  { symbol: 'WETH', name: 'Wrapped Ether', chainId: 'matic', network: 'Polygon', type: 'token', decimals: 18, minDeposit: '0.001', minWithdraw: '0.01', withdrawFee: '0.005', confirmations: 128, addressType: 'circle_evm', color: '#627EEA' },
  { symbol: 'WBTC', name: 'Wrapped Bitcoin', chainId: 'matic', network: 'Polygon', type: 'token', decimals: 8, minDeposit: '0.0001', minWithdraw: '0.001', withdrawFee: '0.0005', confirmations: 128, addressType: 'circle_evm', color: '#F7931A' },
  { symbol: 'LINK', name: 'Chainlink', chainId: 'matic', network: 'Polygon', type: 'token', decimals: 18, minDeposit: '0.1', minWithdraw: '1', withdrawFee: '0.5', confirmations: 128, addressType: 'circle_evm', color: '#375BD2' },
  { symbol: 'AAVE', name: 'Aave', chainId: 'matic', network: 'Polygon', type: 'token', decimals: 18, minDeposit: '0.01', minWithdraw: '0.1', withdrawFee: '0.05', confirmations: 128, addressType: 'circle_evm', color: '#B6509E' },
  { symbol: 'UNI', name: 'Uniswap', chainId: 'matic', network: 'Polygon', type: 'token', decimals: 18, minDeposit: '0.1', minWithdraw: '1', withdrawFee: '0.5', confirmations: 128, addressType: 'circle_evm', color: '#FF007A' },
  { symbol: 'CRV', name: 'Curve DAO', chainId: 'matic', network: 'Polygon', type: 'token', decimals: 18, minDeposit: '1', minWithdraw: '10', withdrawFee: '5', confirmations: 128, addressType: 'circle_evm', color: '#40649F' },
  { symbol: 'SUSHI', name: 'SushiSwap', chainId: 'matic', network: 'Polygon', type: 'token', decimals: 18, minDeposit: '1', minWithdraw: '10', withdrawFee: '5', confirmations: 128, addressType: 'circle_evm', color: '#FA52A0' },
  { symbol: 'QUICK', name: 'QuickSwap', chainId: 'matic', network: 'Polygon', type: 'token', decimals: 18, minDeposit: '0.01', minWithdraw: '0.1', withdrawFee: '0.05', confirmations: 128, addressType: 'circle_evm', color: '#418099' },
  { symbol: 'BAL', name: 'Balancer', chainId: 'matic', network: 'Polygon', type: 'token', decimals: 18, minDeposit: '0.1', minWithdraw: '1', withdrawFee: '0.5', confirmations: 128, addressType: 'circle_evm', color: '#1E1E1E' },
  { symbol: 'GRT', name: 'The Graph', chainId: 'matic', network: 'Polygon', type: 'token', decimals: 18, minDeposit: '5', minWithdraw: '50', withdrawFee: '20', confirmations: 128, addressType: 'circle_evm', color: '#6747ED' },
  { symbol: 'SAND', name: 'The Sandbox', chainId: 'matic', network: 'Polygon', type: 'token', decimals: 18, minDeposit: '1', minWithdraw: '10', withdrawFee: '5', confirmations: 128, addressType: 'circle_evm', color: '#04ADEF' },
  { symbol: 'MANA', name: 'Decentraland', chainId: 'matic', network: 'Polygon', type: 'token', decimals: 18, minDeposit: '1', minWithdraw: '10', withdrawFee: '5', confirmations: 128, addressType: 'circle_evm', color: '#FF2D55' },
  { symbol: 'stMATIC', name: 'Staked MATIC', chainId: 'matic', network: 'Polygon', type: 'token', decimals: 18, minDeposit: '1', minWithdraw: '10', withdrawFee: '1', confirmations: 128, addressType: 'circle_evm', color: '#8247E5' },
  { symbol: 'GHST', name: 'Aavegotchi', chainId: 'matic', network: 'Polygon', type: 'token', decimals: 18, minDeposit: '0.5', minWithdraw: '5', withdrawFee: '2', confirmations: 128, addressType: 'circle_evm', color: '#FA34F3' },
  { symbol: 'KLIMA', name: 'Klima DAO', chainId: 'matic', network: 'Polygon', type: 'token', decimals: 9, minDeposit: '0.1', minWithdraw: '1', withdrawFee: '0.5', confirmations: 128, addressType: 'circle_evm', color: '#00CC33' },
  { symbol: 'VOXEL', name: 'Voxies', chainId: 'matic', network: 'Polygon', type: 'token', decimals: 18, minDeposit: '5', minWithdraw: '50', withdrawFee: '20', confirmations: 128, addressType: 'circle_evm', color: '#FFB800' },
  { symbol: 'DFYN', name: 'Dfyn Network', chainId: 'matic', network: 'Polygon', type: 'token', decimals: 18, minDeposit: '10', minWithdraw: '100', withdrawFee: '50', confirmations: 128, addressType: 'circle_evm', color: '#6B5CE7' },
  // Additional Polygon Tokens
  { symbol: 'TITAN', name: 'Titan', chainId: 'matic', network: 'Polygon', type: 'token', decimals: 18, minDeposit: '100', minWithdraw: '1000', withdrawFee: '500', confirmations: 128, addressType: 'circle_evm', color: '#3366FF' },
  { symbol: 'IRON', name: 'Iron Finance', chainId: 'matic', network: 'Polygon', type: 'token', decimals: 18, minDeposit: '10', minWithdraw: '100', withdrawFee: '50', confirmations: 128, addressType: 'circle_evm', color: '#708090' },
  { symbol: 'MCO2', name: 'Moss Carbon Credit', chainId: 'matic', network: 'Polygon', type: 'token', decimals: 18, minDeposit: '0.5', minWithdraw: '5', withdrawFee: '2', confirmations: 128, addressType: 'circle_evm', color: '#228B22' },
  { symbol: 'BCT', name: 'Toucan Base Carbon', chainId: 'matic', network: 'Polygon', type: 'token', decimals: 18, minDeposit: '1', minWithdraw: '10', withdrawFee: '5', confirmations: 128, addressType: 'circle_evm', color: '#228B22' },
  { symbol: 'SPHERE', name: 'Sphere Finance', chainId: 'matic', network: 'Polygon', type: 'token', decimals: 18, minDeposit: '10', minWithdraw: '100', withdrawFee: '50', confirmations: 128, addressType: 'circle_evm', color: '#9945FF' },
  { symbol: 'DINO', name: 'DinoSwap', chainId: 'matic', network: 'Polygon', type: 'token', decimals: 18, minDeposit: '50', minWithdraw: '500', withdrawFee: '200', confirmations: 128, addressType: 'circle_evm', color: '#00B74A' },
  { symbol: 'POLYDOGE', name: 'PolyDoge', chainId: 'matic', network: 'Polygon', type: 'token', decimals: 18, minDeposit: '1000000', minWithdraw: '10000000', withdrawFee: '5000000', confirmations: 128, addressType: 'circle_evm', color: '#C2A633' },
  { symbol: 'FEAR', name: 'Fear', chainId: 'matic', network: 'Polygon', type: 'token', decimals: 18, minDeposit: '10', minWithdraw: '100', withdrawFee: '50', confirmations: 128, addressType: 'circle_evm', color: '#FF0000' },
  { symbol: 'TOWER', name: 'Tower', chainId: 'matic', network: 'Polygon', type: 'token', decimals: 18, minDeposit: '50', minWithdraw: '500', withdrawFee: '200', confirmations: 128, addressType: 'circle_evm', color: '#00BFFF' },
  { symbol: 'REVV', name: 'REVV', chainId: 'matic', network: 'Polygon', type: 'token', decimals: 18, minDeposit: '50', minWithdraw: '500', withdrawFee: '200', confirmations: 128, addressType: 'circle_evm', color: '#FF0055' },
  { symbol: 'AXS', name: 'Axie Infinity', chainId: 'matic', network: 'Polygon', type: 'token', decimals: 18, minDeposit: '0.1', minWithdraw: '1', withdrawFee: '0.5', confirmations: 128, addressType: 'circle_evm', color: '#0055D5' },
  { symbol: 'GALA', name: 'Gala', chainId: 'matic', network: 'Polygon', type: 'token', decimals: 8, minDeposit: '10', minWithdraw: '100', withdrawFee: '50', confirmations: 128, addressType: 'circle_evm', color: '#000000' },
  { symbol: 'IMX', name: 'Immutable X', chainId: 'matic', network: 'Polygon', type: 'token', decimals: 18, minDeposit: '1', minWithdraw: '10', withdrawFee: '5', confirmations: 128, addressType: 'circle_evm', color: '#00BFBF' },
  { symbol: 'ENJ', name: 'Enjin Coin', chainId: 'matic', network: 'Polygon', type: 'token', decimals: 18, minDeposit: '1', minWithdraw: '10', withdrawFee: '5', confirmations: 128, addressType: 'circle_evm', color: '#624DBF' },
  { symbol: 'ALICE', name: 'My Neighbor Alice', chainId: 'matic', network: 'Polygon', type: 'token', decimals: 6, minDeposit: '0.5', minWithdraw: '5', withdrawFee: '2', confirmations: 128, addressType: 'circle_evm', color: '#E45757' },
  { symbol: 'QI', name: 'QiDao', chainId: 'matic', network: 'Polygon', type: 'token', decimals: 18, minDeposit: '50', minWithdraw: '500', withdrawFee: '200', confirmations: 128, addressType: 'circle_evm', color: '#FF0066' },
  { symbol: 'MAI', name: 'Mai Finance', chainId: 'matic', network: 'Polygon', type: 'token', decimals: 18, minDeposit: '1', minWithdraw: '10', withdrawFee: '5', confirmations: 128, addressType: 'circle_evm', color: '#FF0066' },
  { symbol: 'miMATIC', name: 'miMATIC', chainId: 'matic', network: 'Polygon', type: 'token', decimals: 18, minDeposit: '1', minWithdraw: '10', withdrawFee: '5', confirmations: 128, addressType: 'circle_evm', color: '#FF0066' },
  { symbol: 'agEUR', name: 'agEUR', chainId: 'matic', network: 'Polygon', type: 'token', decimals: 18, minDeposit: '1', minWithdraw: '10', withdrawFee: '5', confirmations: 128, addressType: 'circle_evm', color: '#0066FF' },
  { symbol: 'MaticX', name: 'Stader MaticX', chainId: 'matic', network: 'Polygon', type: 'token', decimals: 18, minDeposit: '1', minWithdraw: '10', withdrawFee: '1', confirmations: 128, addressType: 'circle_evm', color: '#8247E5' },
  { symbol: 'WMATIC', name: 'Wrapped MATIC', chainId: 'matic', network: 'Polygon', type: 'token', decimals: 18, minDeposit: '1', minWithdraw: '10', withdrawFee: '1', confirmations: 128, addressType: 'circle_evm', color: '#8247E5' },
  { symbol: 'STG', name: 'Stargate', chainId: 'matic', network: 'Polygon', type: 'token', decimals: 18, minDeposit: '1', minWithdraw: '10', withdrawFee: '5', confirmations: 128, addressType: 'circle_evm', color: '#000000' },
  { symbol: 'BIFI', name: 'Beefy Finance', chainId: 'matic', network: 'Polygon', type: 'token', decimals: 18, minDeposit: '0.001', minWithdraw: '0.01', withdrawFee: '0.005', confirmations: 128, addressType: 'circle_evm', color: '#59A662' },
  { symbol: 'FRAX', name: 'Frax', chainId: 'matic', network: 'Polygon', type: 'token', decimals: 18, minDeposit: '1', minWithdraw: '3', withdrawFee: '1', confirmations: 128, addressType: 'circle_evm', color: '#000000' },
  { symbol: 'FXS', name: 'Frax Share', chainId: 'matic', network: 'Polygon', type: 'token', decimals: 18, minDeposit: '0.5', minWithdraw: '5', withdrawFee: '2', confirmations: 128, addressType: 'circle_evm', color: '#000000' },
  { symbol: 'LDO', name: 'Lido DAO', chainId: 'matic', network: 'Polygon', type: 'token', decimals: 18, minDeposit: '0.5', minWithdraw: '5', withdrawFee: '2', confirmations: 128, addressType: 'circle_evm', color: '#F69988' },
  { symbol: 'HOP', name: 'Hop Protocol', chainId: 'matic', network: 'Polygon', type: 'token', decimals: 18, minDeposit: '5', minWithdraw: '50', withdrawFee: '20', confirmations: 128, addressType: 'circle_evm', color: '#D660FF' },
  { symbol: 'COMP', name: 'Compound', chainId: 'matic', network: 'Polygon', type: 'token', decimals: 18, minDeposit: '0.01', minWithdraw: '0.1', withdrawFee: '0.05', confirmations: 128, addressType: 'circle_evm', color: '#00D395' },
  { symbol: 'SNX', name: 'Synthetix', chainId: 'matic', network: 'Polygon', type: 'token', decimals: 18, minDeposit: '0.5', minWithdraw: '5', withdrawFee: '2', confirmations: 128, addressType: 'circle_evm', color: '#00D1FF' },
  { symbol: 'MKR', name: 'Maker', chainId: 'matic', network: 'Polygon', type: 'token', decimals: 18, minDeposit: '0.001', minWithdraw: '0.01', withdrawFee: '0.005', confirmations: 128, addressType: 'circle_evm', color: '#1AAB9B' },
  { symbol: 'FET', name: 'Fetch.ai', chainId: 'matic', network: 'Polygon', type: 'token', decimals: 18, minDeposit: '1', minWithdraw: '10', withdrawFee: '5', confirmations: 128, addressType: 'circle_evm', color: '#1D2951' },
  { symbol: 'OCEAN', name: 'Ocean Protocol', chainId: 'matic', network: 'Polygon', type: 'token', decimals: 18, minDeposit: '1', minWithdraw: '10', withdrawFee: '5', confirmations: 128, addressType: 'circle_evm', color: '#FF4092' },
  { symbol: 'RNDR', name: 'Render', chainId: 'matic', network: 'Polygon', type: 'token', decimals: 18, minDeposit: '0.5', minWithdraw: '5', withdrawFee: '2', confirmations: 128, addressType: 'circle_evm', color: '#000000' },
  { symbol: 'BAT', name: 'Basic Attention Token', chainId: 'matic', network: 'Polygon', type: 'token', decimals: 18, minDeposit: '5', minWithdraw: '50', withdrawFee: '20', confirmations: 128, addressType: 'circle_evm', color: '#FF5000' },
];

// ============================================
// ARBITRUM TOKENS (55 tokens)
// ============================================
// Arbitrum: Network fee $0.2 + $0.50 platform = $0.70, min withdrawal = $2.10 (3x), set to $5
export const arbitrumTokens: AssetConfig[] = [
  { symbol: 'USDT', name: 'Tether USD', chainId: 'arb', network: 'Arbitrum One', type: 'token', decimals: 6, minDeposit: '1', minWithdraw: '5', withdrawFee: '1', confirmations: 20, addressType: 'circle_evm', color: '#26A17B' },
  { symbol: 'USDC', name: 'USD Coin', chainId: 'arb', network: 'Arbitrum One', type: 'token', decimals: 6, minDeposit: '1', minWithdraw: '5', withdrawFee: '1', confirmations: 20, addressType: 'circle_evm', color: '#2775CA' },
  { symbol: 'DAI', name: 'Dai Stablecoin', chainId: 'arb', network: 'Arbitrum One', type: 'token', decimals: 18, minDeposit: '1', minWithdraw: '5', withdrawFee: '1', confirmations: 20, addressType: 'circle_evm', color: '#F5AC37' },
  { symbol: 'WETH', name: 'Wrapped Ether', chainId: 'arb', network: 'Arbitrum One', type: 'token', decimals: 18, minDeposit: '0.001', minWithdraw: '0.01', withdrawFee: '0.005', confirmations: 20, addressType: 'circle_evm', color: '#627EEA' },
  { symbol: 'WBTC', name: 'Wrapped Bitcoin', chainId: 'arb', network: 'Arbitrum One', type: 'token', decimals: 8, minDeposit: '0.0001', minWithdraw: '0.001', withdrawFee: '0.0005', confirmations: 20, addressType: 'circle_evm', color: '#F7931A' },
  { symbol: 'ARB', name: 'Arbitrum', chainId: 'arb', network: 'Arbitrum One', type: 'token', decimals: 18, minDeposit: '1', minWithdraw: '5', withdrawFee: '0.5', confirmations: 20, addressType: 'circle_evm', color: '#28A0F0' },
  { symbol: 'GMX', name: 'GMX', chainId: 'arb', network: 'Arbitrum One', type: 'token', decimals: 18, minDeposit: '0.01', minWithdraw: '0.1', withdrawFee: '0.05', confirmations: 20, addressType: 'circle_evm', color: '#5C47FF' },
  { symbol: 'RDNT', name: 'Radiant', chainId: 'arb', network: 'Arbitrum One', type: 'token', decimals: 18, minDeposit: '10', minWithdraw: '100', withdrawFee: '50', confirmations: 20, addressType: 'circle_evm', color: '#00D2B6' },
  { symbol: 'MAGIC', name: 'Magic', chainId: 'arb', network: 'Arbitrum One', type: 'token', decimals: 18, minDeposit: '0.5', minWithdraw: '5', withdrawFee: '2', confirmations: 20, addressType: 'circle_evm', color: '#DC2626' },
  { symbol: 'DPX', name: 'Dopex', chainId: 'arb', network: 'Arbitrum One', type: 'token', decimals: 18, minDeposit: '0.01', minWithdraw: '0.1', withdrawFee: '0.05', confirmations: 20, addressType: 'circle_evm', color: '#002D74' },
  { symbol: 'JONES', name: 'Jones DAO', chainId: 'arb', network: 'Arbitrum One', type: 'token', decimals: 18, minDeposit: '0.5', minWithdraw: '5', withdrawFee: '2', confirmations: 20, addressType: 'circle_evm', color: '#FFB300' },
  { symbol: 'GRAIL', name: 'Camelot', chainId: 'arb', network: 'Arbitrum One', type: 'token', decimals: 18, minDeposit: '0.001', minWithdraw: '0.01', withdrawFee: '0.005', confirmations: 20, addressType: 'circle_evm', color: '#7C3AED' },
  { symbol: 'LINK', name: 'Chainlink', chainId: 'arb', network: 'Arbitrum One', type: 'token', decimals: 18, minDeposit: '0.1', minWithdraw: '1', withdrawFee: '0.5', confirmations: 20, addressType: 'circle_evm', color: '#375BD2' },
  { symbol: 'UNI', name: 'Uniswap', chainId: 'arb', network: 'Arbitrum One', type: 'token', decimals: 18, minDeposit: '0.1', minWithdraw: '1', withdrawFee: '0.5', confirmations: 20, addressType: 'circle_evm', color: '#FF007A' },
  { symbol: 'SUSHI', name: 'SushiSwap', chainId: 'arb', network: 'Arbitrum One', type: 'token', decimals: 18, minDeposit: '1', minWithdraw: '10', withdrawFee: '5', confirmations: 20, addressType: 'circle_evm', color: '#FA52A0' },
  { symbol: 'PENDLE', name: 'Pendle', chainId: 'arb', network: 'Arbitrum One', type: 'token', decimals: 18, minDeposit: '0.5', minWithdraw: '5', withdrawFee: '2', confirmations: 20, addressType: 'circle_evm', color: '#EAFF00' },
  { symbol: 'STG', name: 'Stargate', chainId: 'arb', network: 'Arbitrum One', type: 'token', decimals: 18, minDeposit: '1', minWithdraw: '10', withdrawFee: '5', confirmations: 20, addressType: 'circle_evm', color: '#000000' },
  { symbol: 'GNS', name: 'Gains Network', chainId: 'arb', network: 'Arbitrum One', type: 'token', decimals: 18, minDeposit: '0.1', minWithdraw: '1', withdrawFee: '0.5', confirmations: 20, addressType: 'circle_evm', color: '#3C82F6' },
  { symbol: 'VELA', name: 'Vela', chainId: 'arb', network: 'Arbitrum One', type: 'token', decimals: 18, minDeposit: '0.5', minWithdraw: '5', withdrawFee: '2', confirmations: 20, addressType: 'circle_evm', color: '#6366F1' },
  { symbol: 'Y2K', name: 'Y2K Finance', chainId: 'arb', network: 'Arbitrum One', type: 'token', decimals: 18, minDeposit: '0.1', minWithdraw: '1', withdrawFee: '0.5', confirmations: 20, addressType: 'circle_evm', color: '#FF0000' },
  // Additional Arbitrum Tokens
  { symbol: 'AAVE', name: 'Aave', chainId: 'arb', network: 'Arbitrum One', type: 'token', decimals: 18, minDeposit: '0.01', minWithdraw: '0.1', withdrawFee: '0.05', confirmations: 20, addressType: 'circle_evm', color: '#B6509E' },
  { symbol: 'CRV', name: 'Curve DAO', chainId: 'arb', network: 'Arbitrum One', type: 'token', decimals: 18, minDeposit: '1', minWithdraw: '10', withdrawFee: '5', confirmations: 20, addressType: 'circle_evm', color: '#40649F' },
  { symbol: 'BAL', name: 'Balancer', chainId: 'arb', network: 'Arbitrum One', type: 'token', decimals: 18, minDeposit: '0.1', minWithdraw: '1', withdrawFee: '0.5', confirmations: 20, addressType: 'circle_evm', color: '#1E1E1E' },
  { symbol: 'FRAX', name: 'Frax', chainId: 'arb', network: 'Arbitrum One', type: 'token', decimals: 18, minDeposit: '1', minWithdraw: '5', withdrawFee: '1', confirmations: 20, addressType: 'circle_evm', color: '#000000' },
  { symbol: 'FXS', name: 'Frax Share', chainId: 'arb', network: 'Arbitrum One', type: 'token', decimals: 18, minDeposit: '0.5', minWithdraw: '5', withdrawFee: '2', confirmations: 20, addressType: 'circle_evm', color: '#000000' },
  { symbol: 'GLP', name: 'GLP', chainId: 'arb', network: 'Arbitrum One', type: 'token', decimals: 18, minDeposit: '0.5', minWithdraw: '5', withdrawFee: '2', confirmations: 20, addressType: 'circle_evm', color: '#5C47FF' },
  { symbol: 'SPELL', name: 'Spell Token', chainId: 'arb', network: 'Arbitrum One', type: 'token', decimals: 18, minDeposit: '5000', minWithdraw: '50000', withdrawFee: '20000', confirmations: 20, addressType: 'circle_evm', color: '#8B5CF6' },
  { symbol: 'MIM', name: 'Magic Internet Money', chainId: 'arb', network: 'Arbitrum One', type: 'token', decimals: 18, minDeposit: '1', minWithdraw: '5', withdrawFee: '1', confirmations: 20, addressType: 'circle_evm', color: '#9695F8' },
  { symbol: 'HOP', name: 'Hop Protocol', chainId: 'arb', network: 'Arbitrum One', type: 'token', decimals: 18, minDeposit: '5', minWithdraw: '50', withdrawFee: '20', confirmations: 20, addressType: 'circle_evm', color: '#D660FF' },
  { symbol: 'BIFI', name: 'Beefy Finance', chainId: 'arb', network: 'Arbitrum One', type: 'token', decimals: 18, minDeposit: '0.001', minWithdraw: '0.01', withdrawFee: '0.005', confirmations: 20, addressType: 'circle_evm', color: '#59A662' },
  { symbol: 'PREMIA', name: 'Premia', chainId: 'arb', network: 'Arbitrum One', type: 'token', decimals: 18, minDeposit: '1', minWithdraw: '10', withdrawFee: '5', confirmations: 20, addressType: 'circle_evm', color: '#00BFFF' },
  { symbol: 'LODE', name: 'Lodestar', chainId: 'arb', network: 'Arbitrum One', type: 'token', decimals: 18, minDeposit: '100', minWithdraw: '1000', withdrawFee: '500', confirmations: 20, addressType: 'circle_evm', color: '#FFD700' },
  { symbol: 'SPERAX', name: 'Sperax', chainId: 'arb', network: 'Arbitrum One', type: 'token', decimals: 18, minDeposit: '50', minWithdraw: '500', withdrawFee: '200', confirmations: 20, addressType: 'circle_evm', color: '#6366F1' },
  { symbol: 'USDs', name: 'Sperax USD', chainId: 'arb', network: 'Arbitrum One', type: 'token', decimals: 18, minDeposit: '1', minWithdraw: '5', withdrawFee: '1', confirmations: 20, addressType: 'circle_evm', color: '#6366F1' },
  { symbol: 'UMAMI', name: 'Umami Finance', chainId: 'arb', network: 'Arbitrum One', type: 'token', decimals: 9, minDeposit: '0.1', minWithdraw: '1', withdrawFee: '0.5', confirmations: 20, addressType: 'circle_evm', color: '#FF69B4' },
  { symbol: 'CAP', name: 'Cap', chainId: 'arb', network: 'Arbitrum One', type: 'token', decimals: 18, minDeposit: '0.01', minWithdraw: '0.1', withdrawFee: '0.05', confirmations: 20, addressType: 'circle_evm', color: '#000000' },
  { symbol: 'MUX', name: 'MUX Protocol', chainId: 'arb', network: 'Arbitrum One', type: 'token', decimals: 18, minDeposit: '1', minWithdraw: '10', withdrawFee: '5', confirmations: 20, addressType: 'circle_evm', color: '#00D395' },
  { symbol: 'LDO', name: 'Lido DAO', chainId: 'arb', network: 'Arbitrum One', type: 'token', decimals: 18, minDeposit: '0.5', minWithdraw: '5', withdrawFee: '2', confirmations: 20, addressType: 'circle_evm', color: '#F69988' },
  { symbol: 'rETH', name: 'Rocket Pool ETH', chainId: 'arb', network: 'Arbitrum One', type: 'token', decimals: 18, minDeposit: '0.001', minWithdraw: '0.01', withdrawFee: '0.005', confirmations: 20, addressType: 'circle_evm', color: '#EC6B23' },
  { symbol: 'wstETH', name: 'Wrapped stETH', chainId: 'arb', network: 'Arbitrum One', type: 'token', decimals: 18, minDeposit: '0.001', minWithdraw: '0.01', withdrawFee: '0.005', confirmations: 20, addressType: 'circle_evm', color: '#00A3FF' },
  { symbol: 'GRT', name: 'The Graph', chainId: 'arb', network: 'Arbitrum One', type: 'token', decimals: 18, minDeposit: '5', minWithdraw: '50', withdrawFee: '20', confirmations: 20, addressType: 'circle_evm', color: '#6747ED' },
  { symbol: 'FET', name: 'Fetch.ai', chainId: 'arb', network: 'Arbitrum One', type: 'token', decimals: 18, minDeposit: '1', minWithdraw: '10', withdrawFee: '5', confirmations: 20, addressType: 'circle_evm', color: '#1D2951' },
  { symbol: 'RNDR', name: 'Render', chainId: 'arb', network: 'Arbitrum One', type: 'token', decimals: 18, minDeposit: '0.5', minWithdraw: '5', withdrawFee: '2', confirmations: 20, addressType: 'circle_evm', color: '#000000' },
  { symbol: 'COMP', name: 'Compound', chainId: 'arb', network: 'Arbitrum One', type: 'token', decimals: 18, minDeposit: '0.01', minWithdraw: '0.1', withdrawFee: '0.05', confirmations: 20, addressType: 'circle_evm', color: '#00D395' },
  { symbol: 'SNX', name: 'Synthetix', chainId: 'arb', network: 'Arbitrum One', type: 'token', decimals: 18, minDeposit: '0.5', minWithdraw: '5', withdrawFee: '2', confirmations: 20, addressType: 'circle_evm', color: '#00D1FF' },
  { symbol: 'MKR', name: 'Maker', chainId: 'arb', network: 'Arbitrum One', type: 'token', decimals: 18, minDeposit: '0.001', minWithdraw: '0.01', withdrawFee: '0.005', confirmations: 20, addressType: 'circle_evm', color: '#1AAB9B' },
  { symbol: 'PEPE', name: 'Pepe', chainId: 'arb', network: 'Arbitrum One', type: 'token', decimals: 18, minDeposit: '1000000', minWithdraw: '10000000', withdrawFee: '5000000', confirmations: 20, addressType: 'circle_evm', color: '#479F53' },
  { symbol: 'WLD', name: 'Worldcoin', chainId: 'arb', network: 'Arbitrum One', type: 'token', decimals: 18, minDeposit: '0.5', minWithdraw: '5', withdrawFee: '2', confirmations: 20, addressType: 'circle_evm', color: '#000000' },
  { symbol: 'DODO', name: 'DODO', chainId: 'arb', network: 'Arbitrum One', type: 'token', decimals: 18, minDeposit: '5', minWithdraw: '50', withdrawFee: '20', confirmations: 20, addressType: 'circle_evm', color: '#FFE804' },
  { symbol: 'CBETH', name: 'Coinbase Wrapped ETH', chainId: 'arb', network: 'Arbitrum One', type: 'token', decimals: 18, minDeposit: '0.001', minWithdraw: '0.01', withdrawFee: '0.005', confirmations: 20, addressType: 'circle_evm', color: '#0052FF' },
  { symbol: 'LUSD', name: 'Liquity USD', chainId: 'arb', network: 'Arbitrum One', type: 'token', decimals: 18, minDeposit: '1', minWithdraw: '5', withdrawFee: '1', confirmations: 20, addressType: 'circle_evm', color: '#745DDF' },
  { symbol: 'SWETH', name: 'Swell ETH', chainId: 'arb', network: 'Arbitrum One', type: 'token', decimals: 18, minDeposit: '0.001', minWithdraw: '0.01', withdrawFee: '0.005', confirmations: 20, addressType: 'circle_evm', color: '#2D7FF9' },
  { symbol: 'axlUSDC', name: 'Axelar USDC', chainId: 'arb', network: 'Arbitrum One', type: 'token', decimals: 6, minDeposit: '1', minWithdraw: '5', withdrawFee: '1', confirmations: 20, addressType: 'circle_evm', color: '#2775CA' },
];

// ============================================
// OPTIMISM TOKENS (45 tokens)
// ============================================
// Optimism: Network fee $0.2 + $0.50 platform = $0.70, min withdrawal = $2.10 (3x), set to $5
export const optimismTokens: AssetConfig[] = [
  { symbol: 'USDT', name: 'Tether USD', chainId: 'op', network: 'Optimism', type: 'token', decimals: 6, minDeposit: '1', minWithdraw: '5', withdrawFee: '1', confirmations: 20, addressType: 'circle_evm', color: '#26A17B' },
  { symbol: 'USDC', name: 'USD Coin', chainId: 'op', network: 'Optimism', type: 'token', decimals: 6, minDeposit: '1', minWithdraw: '5', withdrawFee: '1', confirmations: 20, addressType: 'circle_evm', color: '#2775CA' },
  { symbol: 'DAI', name: 'Dai Stablecoin', chainId: 'op', network: 'Optimism', type: 'token', decimals: 18, minDeposit: '1', minWithdraw: '5', withdrawFee: '1', confirmations: 20, addressType: 'circle_evm', color: '#F5AC37' },
  { symbol: 'WETH', name: 'Wrapped Ether', chainId: 'op', network: 'Optimism', type: 'token', decimals: 18, minDeposit: '0.001', minWithdraw: '0.01', withdrawFee: '0.005', confirmations: 20, addressType: 'circle_evm', color: '#627EEA' },
  { symbol: 'WBTC', name: 'Wrapped Bitcoin', chainId: 'op', network: 'Optimism', type: 'token', decimals: 8, minDeposit: '0.0001', minWithdraw: '0.001', withdrawFee: '0.0005', confirmations: 20, addressType: 'circle_evm', color: '#F7931A' },
  { symbol: 'OP', name: 'Optimism', chainId: 'op', network: 'Optimism', type: 'token', decimals: 18, minDeposit: '0.1', minWithdraw: '1', withdrawFee: '0.1', confirmations: 20, addressType: 'circle_evm', color: '#FF0420' },
  { symbol: 'VELO', name: 'Velodrome', chainId: 'op', network: 'Optimism', type: 'token', decimals: 18, minDeposit: '10', minWithdraw: '100', withdrawFee: '50', confirmations: 20, addressType: 'circle_evm', color: '#2D62F6' },
  { symbol: 'SNX', name: 'Synthetix', chainId: 'op', network: 'Optimism', type: 'token', decimals: 18, minDeposit: '0.5', minWithdraw: '5', withdrawFee: '2', confirmations: 20, addressType: 'circle_evm', color: '#00D1FF' },
  { symbol: 'LINK', name: 'Chainlink', chainId: 'op', network: 'Optimism', type: 'token', decimals: 18, minDeposit: '0.1', minWithdraw: '1', withdrawFee: '0.5', confirmations: 20, addressType: 'circle_evm', color: '#375BD2' },
  { symbol: 'PERP', name: 'Perpetual Protocol', chainId: 'op', network: 'Optimism', type: 'token', decimals: 18, minDeposit: '0.5', minWithdraw: '5', withdrawFee: '2', confirmations: 20, addressType: 'circle_evm', color: '#3CEAA3' },
  { symbol: 'KWENTA', name: 'Kwenta', chainId: 'op', network: 'Optimism', type: 'token', decimals: 18, minDeposit: '0.01', minWithdraw: '0.1', withdrawFee: '0.05', confirmations: 20, addressType: 'circle_evm', color: '#00D1FF' },
  { symbol: 'THALES', name: 'Thales', chainId: 'op', network: 'Optimism', type: 'token', decimals: 18, minDeposit: '5', minWithdraw: '50', withdrawFee: '20', confirmations: 20, addressType: 'circle_evm', color: '#8B5CF6' },
  { symbol: 'LYRA', name: 'Lyra', chainId: 'op', network: 'Optimism', type: 'token', decimals: 18, minDeposit: '10', minWithdraw: '100', withdrawFee: '50', confirmations: 20, addressType: 'circle_evm', color: '#47FFA5' },
  { symbol: 'sUSD', name: 'Synth sUSD', chainId: 'op', network: 'Optimism', type: 'token', decimals: 18, minDeposit: '1', minWithdraw: '10', withdrawFee: '5', confirmations: 20, addressType: 'circle_evm', color: '#1E1A31' },
  { symbol: 'rETH', name: 'Rocket Pool ETH', chainId: 'op', network: 'Optimism', type: 'token', decimals: 18, minDeposit: '0.001', minWithdraw: '0.01', withdrawFee: '0.005', confirmations: 20, addressType: 'circle_evm', color: '#EC6B23' },
  // Additional Optimism Tokens
  { symbol: 'sETH', name: 'Synth sETH', chainId: 'op', network: 'Optimism', type: 'token', decimals: 18, minDeposit: '0.001', minWithdraw: '0.01', withdrawFee: '0.005', confirmations: 20, addressType: 'circle_evm', color: '#1E1A31' },
  { symbol: 'sBTC', name: 'Synth sBTC', chainId: 'op', network: 'Optimism', type: 'token', decimals: 18, minDeposit: '0.0001', minWithdraw: '0.001', withdrawFee: '0.0005', confirmations: 20, addressType: 'circle_evm', color: '#1E1A31' },
  { symbol: 'sLINK', name: 'Synth sLINK', chainId: 'op', network: 'Optimism', type: 'token', decimals: 18, minDeposit: '0.1', minWithdraw: '1', withdrawFee: '0.5', confirmations: 20, addressType: 'circle_evm', color: '#1E1A31' },
  { symbol: 'AELIN', name: 'Aelin', chainId: 'op', network: 'Optimism', type: 'token', decimals: 18, minDeposit: '0.1', minWithdraw: '1', withdrawFee: '0.5', confirmations: 20, addressType: 'circle_evm', color: '#00D1FF' },
  { symbol: 'HOP', name: 'Hop Protocol', chainId: 'op', network: 'Optimism', type: 'token', decimals: 18, minDeposit: '5', minWithdraw: '50', withdrawFee: '20', confirmations: 20, addressType: 'circle_evm', color: '#D660FF' },
  { symbol: 'STG', name: 'Stargate', chainId: 'op', network: 'Optimism', type: 'token', decimals: 18, minDeposit: '1', minWithdraw: '10', withdrawFee: '5', confirmations: 20, addressType: 'circle_evm', color: '#000000' },
  { symbol: 'BIFI', name: 'Beefy Finance', chainId: 'op', network: 'Optimism', type: 'token', decimals: 18, minDeposit: '0.001', minWithdraw: '0.01', withdrawFee: '0.005', confirmations: 20, addressType: 'circle_evm', color: '#59A662' },
  { symbol: 'QI', name: 'QiDao', chainId: 'op', network: 'Optimism', type: 'token', decimals: 18, minDeposit: '50', minWithdraw: '500', withdrawFee: '200', confirmations: 20, addressType: 'circle_evm', color: '#FF0066' },
  { symbol: 'MAI', name: 'Mai Finance', chainId: 'op', network: 'Optimism', type: 'token', decimals: 18, minDeposit: '1', minWithdraw: '10', withdrawFee: '5', confirmations: 20, addressType: 'circle_evm', color: '#FF0066' },
  { symbol: 'FRAX', name: 'Frax', chainId: 'op', network: 'Optimism', type: 'token', decimals: 18, minDeposit: '1', minWithdraw: '5', withdrawFee: '1', confirmations: 20, addressType: 'circle_evm', color: '#000000' },
  { symbol: 'FXS', name: 'Frax Share', chainId: 'op', network: 'Optimism', type: 'token', decimals: 18, minDeposit: '0.5', minWithdraw: '5', withdrawFee: '2', confirmations: 20, addressType: 'circle_evm', color: '#000000' },
  { symbol: 'UNI', name: 'Uniswap', chainId: 'op', network: 'Optimism', type: 'token', decimals: 18, minDeposit: '0.1', minWithdraw: '1', withdrawFee: '0.5', confirmations: 20, addressType: 'circle_evm', color: '#FF007A' },
  { symbol: 'AAVE', name: 'Aave', chainId: 'op', network: 'Optimism', type: 'token', decimals: 18, minDeposit: '0.01', minWithdraw: '0.1', withdrawFee: '0.05', confirmations: 20, addressType: 'circle_evm', color: '#B6509E' },
  { symbol: 'CRV', name: 'Curve DAO', chainId: 'op', network: 'Optimism', type: 'token', decimals: 18, minDeposit: '1', minWithdraw: '10', withdrawFee: '5', confirmations: 20, addressType: 'circle_evm', color: '#40649F' },
  { symbol: 'BAL', name: 'Balancer', chainId: 'op', network: 'Optimism', type: 'token', decimals: 18, minDeposit: '0.1', minWithdraw: '1', withdrawFee: '0.5', confirmations: 20, addressType: 'circle_evm', color: '#1E1E1E' },
  { symbol: 'SUSHI', name: 'SushiSwap', chainId: 'op', network: 'Optimism', type: 'token', decimals: 18, minDeposit: '1', minWithdraw: '10', withdrawFee: '5', confirmations: 20, addressType: 'circle_evm', color: '#FA52A0' },
  { symbol: 'LDO', name: 'Lido DAO', chainId: 'op', network: 'Optimism', type: 'token', decimals: 18, minDeposit: '0.5', minWithdraw: '5', withdrawFee: '2', confirmations: 20, addressType: 'circle_evm', color: '#F69988' },
  { symbol: 'wstETH', name: 'Wrapped stETH', chainId: 'op', network: 'Optimism', type: 'token', decimals: 18, minDeposit: '0.001', minWithdraw: '0.01', withdrawFee: '0.005', confirmations: 20, addressType: 'circle_evm', color: '#00A3FF' },
  { symbol: 'MKR', name: 'Maker', chainId: 'op', network: 'Optimism', type: 'token', decimals: 18, minDeposit: '0.001', minWithdraw: '0.01', withdrawFee: '0.005', confirmations: 20, addressType: 'circle_evm', color: '#1AAB9B' },
  { symbol: 'COMP', name: 'Compound', chainId: 'op', network: 'Optimism', type: 'token', decimals: 18, minDeposit: '0.01', minWithdraw: '0.1', withdrawFee: '0.05', confirmations: 20, addressType: 'circle_evm', color: '#00D395' },
  { symbol: 'GRT', name: 'The Graph', chainId: 'op', network: 'Optimism', type: 'token', decimals: 18, minDeposit: '5', minWithdraw: '50', withdrawFee: '20', confirmations: 20, addressType: 'circle_evm', color: '#6747ED' },
  { symbol: 'SONNE', name: 'Sonne Finance', chainId: 'op', network: 'Optimism', type: 'token', decimals: 18, minDeposit: '10', minWithdraw: '100', withdrawFee: '50', confirmations: 20, addressType: 'circle_evm', color: '#FF5722' },
  { symbol: 'EXTRA', name: 'Extra Finance', chainId: 'op', network: 'Optimism', type: 'token', decimals: 18, minDeposit: '10', minWithdraw: '100', withdrawFee: '50', confirmations: 20, addressType: 'circle_evm', color: '#00D395' },
  { symbol: 'PIKA', name: 'Pika Protocol', chainId: 'op', network: 'Optimism', type: 'token', decimals: 18, minDeposit: '100', minWithdraw: '1000', withdrawFee: '500', confirmations: 20, addressType: 'circle_evm', color: '#FFD700' },
  { symbol: 'LUSD', name: 'Liquity USD', chainId: 'op', network: 'Optimism', type: 'token', decimals: 18, minDeposit: '1', minWithdraw: '5', withdrawFee: '1', confirmations: 20, addressType: 'circle_evm', color: '#745DDF' },
  { symbol: 'axlUSDC', name: 'Axelar USDC', chainId: 'op', network: 'Optimism', type: 'token', decimals: 6, minDeposit: '1', minWithdraw: '5', withdrawFee: '1', confirmations: 20, addressType: 'circle_evm', color: '#2775CA' },
  { symbol: 'cbETH', name: 'Coinbase Wrapped ETH', chainId: 'op', network: 'Optimism', type: 'token', decimals: 18, minDeposit: '0.001', minWithdraw: '0.01', withdrawFee: '0.005', confirmations: 20, addressType: 'circle_evm', color: '#0052FF' },
  { symbol: 'RNDR', name: 'Render', chainId: 'op', network: 'Optimism', type: 'token', decimals: 18, minDeposit: '0.5', minWithdraw: '5', withdrawFee: '2', confirmations: 20, addressType: 'circle_evm', color: '#000000' },
  { symbol: 'WLD', name: 'Worldcoin', chainId: 'op', network: 'Optimism', type: 'token', decimals: 18, minDeposit: '0.5', minWithdraw: '5', withdrawFee: '2', confirmations: 20, addressType: 'circle_evm', color: '#000000' },
];

// ============================================
// BASE TOKENS (35 tokens)
// ============================================
// Base: Network fee $0.1 + $0.50 platform = $0.60, min withdrawal = $1.80 (3x), set to $3
export const baseTokens: AssetConfig[] = [
  { symbol: 'USDC', name: 'USD Coin', chainId: 'base', network: 'Base', type: 'token', decimals: 6, minDeposit: '1', minWithdraw: '3', withdrawFee: '1', confirmations: 20, addressType: 'circle_evm', color: '#2775CA' },
  { symbol: 'USDbC', name: 'USD Base Coin', chainId: 'base', network: 'Base', type: 'token', decimals: 6, minDeposit: '1', minWithdraw: '3', withdrawFee: '1', confirmations: 20, addressType: 'circle_evm', color: '#2775CA' },
  { symbol: 'DAI', name: 'Dai Stablecoin', chainId: 'base', network: 'Base', type: 'token', decimals: 18, minDeposit: '1', minWithdraw: '3', withdrawFee: '1', confirmations: 20, addressType: 'circle_evm', color: '#F5AC37' },
  { symbol: 'WETH', name: 'Wrapped Ether', chainId: 'base', network: 'Base', type: 'token', decimals: 18, minDeposit: '0.001', minWithdraw: '0.01', withdrawFee: '0.005', confirmations: 20, addressType: 'circle_evm', color: '#627EEA' },
  { symbol: 'cbETH', name: 'Coinbase ETH', chainId: 'base', network: 'Base', type: 'token', decimals: 18, minDeposit: '0.001', minWithdraw: '0.01', withdrawFee: '0.005', confirmations: 20, addressType: 'circle_evm', color: '#0052FF' },
  { symbol: 'AERO', name: 'Aerodrome', chainId: 'base', network: 'Base', type: 'token', decimals: 18, minDeposit: '1', minWithdraw: '10', withdrawFee: '5', confirmations: 20, addressType: 'circle_evm', color: '#0066FF' },
  { symbol: 'BALD', name: 'Bald', chainId: 'base', network: 'Base', type: 'token', decimals: 18, minDeposit: '100', minWithdraw: '1000', withdrawFee: '500', confirmations: 20, addressType: 'circle_evm', color: '#000000' },
  { symbol: 'TOSHI', name: 'Toshi', chainId: 'base', network: 'Base', type: 'token', decimals: 18, minDeposit: '1000', minWithdraw: '10000', withdrawFee: '5000', confirmations: 20, addressType: 'circle_evm', color: '#0052FF' },
  { symbol: 'BRETT', name: 'Brett', chainId: 'base', network: 'Base', type: 'token', decimals: 18, minDeposit: '100', minWithdraw: '1000', withdrawFee: '500', confirmations: 20, addressType: 'circle_evm', color: '#0066FF' },
  { symbol: 'DEGEN', name: 'Degen', chainId: 'base', network: 'Base', type: 'token', decimals: 18, minDeposit: '100', minWithdraw: '1000', withdrawFee: '500', confirmations: 20, addressType: 'circle_evm', color: '#A36EFD' },
  // Additional Base Tokens
  { symbol: 'NORMIE', name: 'Normie', chainId: 'base', network: 'Base', type: 'token', decimals: 9, minDeposit: '1000', minWithdraw: '10000', withdrawFee: '5000', confirmations: 20, addressType: 'circle_evm', color: '#8B4513' },
  { symbol: 'MOCHI', name: 'Mochi', chainId: 'base', network: 'Base', type: 'token', decimals: 18, minDeposit: '10000', minWithdraw: '100000', withdrawFee: '50000', confirmations: 20, addressType: 'circle_evm', color: '#FFB6C1' },
  { symbol: 'BASED', name: 'Based', chainId: 'base', network: 'Base', type: 'token', decimals: 18, minDeposit: '100', minWithdraw: '1000', withdrawFee: '500', confirmations: 20, addressType: 'circle_evm', color: '#0052FF' },
  { symbol: 'EXTRA', name: 'Extra Finance', chainId: 'base', network: 'Base', type: 'token', decimals: 18, minDeposit: '10', minWithdraw: '100', withdrawFee: '50', confirmations: 20, addressType: 'circle_evm', color: '#00D395' },
  { symbol: 'SEAMLESS', name: 'Seamless', chainId: 'base', network: 'Base', type: 'token', decimals: 18, minDeposit: '1', minWithdraw: '10', withdrawFee: '5', confirmations: 20, addressType: 'circle_evm', color: '#00BFFF' },
  { symbol: 'MOONWELL', name: 'Moonwell', chainId: 'base', network: 'Base', type: 'token', decimals: 18, minDeposit: '50', minWithdraw: '500', withdrawFee: '200', confirmations: 20, addressType: 'circle_evm', color: '#4A90D9' },
  { symbol: 'BSX', name: 'BaseX', chainId: 'base', network: 'Base', type: 'token', decimals: 18, minDeposit: '100', minWithdraw: '1000', withdrawFee: '500', confirmations: 20, addressType: 'circle_evm', color: '#0052FF' },
  { symbol: 'wstETH', name: 'Wrapped stETH', chainId: 'base', network: 'Base', type: 'token', decimals: 18, minDeposit: '0.001', minWithdraw: '0.01', withdrawFee: '0.005', confirmations: 20, addressType: 'circle_evm', color: '#00A3FF' },
  { symbol: 'rETH', name: 'Rocket Pool ETH', chainId: 'base', network: 'Base', type: 'token', decimals: 18, minDeposit: '0.001', minWithdraw: '0.01', withdrawFee: '0.005', confirmations: 20, addressType: 'circle_evm', color: '#EC6B23' },
  { symbol: 'COMP', name: 'Compound', chainId: 'base', network: 'Base', type: 'token', decimals: 18, minDeposit: '0.01', minWithdraw: '0.1', withdrawFee: '0.05', confirmations: 20, addressType: 'circle_evm', color: '#00D395' },
  { symbol: 'AAVE', name: 'Aave', chainId: 'base', network: 'Base', type: 'token', decimals: 18, minDeposit: '0.01', minWithdraw: '0.1', withdrawFee: '0.05', confirmations: 20, addressType: 'circle_evm', color: '#B6509E' },
  { symbol: 'SNX', name: 'Synthetix', chainId: 'base', network: 'Base', type: 'token', decimals: 18, minDeposit: '0.5', minWithdraw: '5', withdrawFee: '2', confirmations: 20, addressType: 'circle_evm', color: '#00D1FF' },
  { symbol: 'CRV', name: 'Curve DAO', chainId: 'base', network: 'Base', type: 'token', decimals: 18, minDeposit: '1', minWithdraw: '10', withdrawFee: '5', confirmations: 20, addressType: 'circle_evm', color: '#40649F' },
  { symbol: 'BAL', name: 'Balancer', chainId: 'base', network: 'Base', type: 'token', decimals: 18, minDeposit: '0.1', minWithdraw: '1', withdrawFee: '0.5', confirmations: 20, addressType: 'circle_evm', color: '#1E1E1E' },
  { symbol: 'STG', name: 'Stargate', chainId: 'base', network: 'Base', type: 'token', decimals: 18, minDeposit: '1', minWithdraw: '10', withdrawFee: '5', confirmations: 20, addressType: 'circle_evm', color: '#000000' },
  { symbol: 'HOP', name: 'Hop Protocol', chainId: 'base', network: 'Base', type: 'token', decimals: 18, minDeposit: '5', minWithdraw: '50', withdrawFee: '20', confirmations: 20, addressType: 'circle_evm', color: '#D660FF' },
  { symbol: 'BIFI', name: 'Beefy Finance', chainId: 'base', network: 'Base', type: 'token', decimals: 18, minDeposit: '0.001', minWithdraw: '0.01', withdrawFee: '0.005', confirmations: 20, addressType: 'circle_evm', color: '#59A662' },
  { symbol: 'VIRTUAL', name: 'Virtual Protocol', chainId: 'base', network: 'Base', type: 'token', decimals: 18, minDeposit: '1', minWithdraw: '10', withdrawFee: '5', confirmations: 20, addressType: 'circle_evm', color: '#00FF00' },
  { symbol: 'FRIEND', name: 'Friend.tech', chainId: 'base', network: 'Base', type: 'token', decimals: 18, minDeposit: '0.5', minWithdraw: '5', withdrawFee: '2', confirmations: 20, addressType: 'circle_evm', color: '#0066FF' },
  { symbol: 'SPEC', name: 'Spectral', chainId: 'base', network: 'Base', type: 'token', decimals: 18, minDeposit: '1', minWithdraw: '10', withdrawFee: '5', confirmations: 20, addressType: 'circle_evm', color: '#6B5B95' },
  { symbol: 'WELL', name: 'Moonwell', chainId: 'base', network: 'Base', type: 'token', decimals: 18, minDeposit: '50', minWithdraw: '500', withdrawFee: '200', confirmations: 20, addressType: 'circle_evm', color: '#4A90D9' },
  { symbol: 'SEAM', name: 'Seamless', chainId: 'base', network: 'Base', type: 'token', decimals: 18, minDeposit: '1', minWithdraw: '10', withdrawFee: '5', confirmations: 20, addressType: 'circle_evm', color: '#00BFFF' },
  { symbol: 'axlUSDC', name: 'Axelar USDC', chainId: 'base', network: 'Base', type: 'token', decimals: 6, minDeposit: '1', minWithdraw: '3', withdrawFee: '1', confirmations: 20, addressType: 'circle_evm', color: '#2775CA' },
  { symbol: 'crvUSD', name: 'Curve USD', chainId: 'base', network: 'Base', type: 'token', decimals: 18, minDeposit: '1', minWithdraw: '3', withdrawFee: '1', confirmations: 20, addressType: 'circle_evm', color: '#40649F' },
];

// ============================================
// AVALANCHE TOKENS (45 tokens)
// ============================================
// Avalanche: Network fee $0.5 + $0.50 platform = $1.00, min withdrawal = $3.00 (3x), set to $5
export const avalancheTokens: AssetConfig[] = [
  { symbol: 'USDT', name: 'Tether USD', chainId: 'avax', network: 'Avalanche C-Chain', type: 'token', decimals: 6, minDeposit: '1', minWithdraw: '5', withdrawFee: '1', confirmations: 20, addressType: 'circle_evm', color: '#26A17B' },
  { symbol: 'USDC', name: 'USD Coin', chainId: 'avax', network: 'Avalanche C-Chain', type: 'token', decimals: 6, minDeposit: '1', minWithdraw: '5', withdrawFee: '1', confirmations: 20, addressType: 'circle_evm', color: '#2775CA' },
  { symbol: 'DAI', name: 'Dai Stablecoin', chainId: 'avax', network: 'Avalanche C-Chain', type: 'token', decimals: 18, minDeposit: '1', minWithdraw: '5', withdrawFee: '1', confirmations: 20, addressType: 'circle_evm', color: '#F5AC37' },
  { symbol: 'WETH', name: 'Wrapped Ether', chainId: 'avax', network: 'Avalanche C-Chain', type: 'token', decimals: 18, minDeposit: '0.001', minWithdraw: '0.01', withdrawFee: '0.005', confirmations: 20, addressType: 'circle_evm', color: '#627EEA' },
  { symbol: 'WBTC', name: 'Wrapped Bitcoin', chainId: 'avax', network: 'Avalanche C-Chain', type: 'token', decimals: 8, minDeposit: '0.0001', minWithdraw: '0.001', withdrawFee: '0.0005', confirmations: 20, addressType: 'circle_evm', color: '#F7931A' },
  { symbol: 'JOE', name: 'Trader Joe', chainId: 'avax', network: 'Avalanche C-Chain', type: 'token', decimals: 18, minDeposit: '1', minWithdraw: '10', withdrawFee: '5', confirmations: 20, addressType: 'circle_evm', color: '#FF0000' },
  { symbol: 'PNG', name: 'Pangolin', chainId: 'avax', network: 'Avalanche C-Chain', type: 'token', decimals: 18, minDeposit: '1', minWithdraw: '10', withdrawFee: '5', confirmations: 20, addressType: 'circle_evm', color: '#FFC800' },
  { symbol: 'sAVAX', name: 'Staked AVAX', chainId: 'avax', network: 'Avalanche C-Chain', type: 'token', decimals: 18, minDeposit: '0.1', minWithdraw: '1', withdrawFee: '0.1', confirmations: 20, addressType: 'circle_evm', color: '#E84142' },
  { symbol: 'ankrAVAX', name: 'Ankr Staked AVAX', chainId: 'avax', network: 'Avalanche C-Chain', type: 'token', decimals: 18, minDeposit: '0.1', minWithdraw: '1', withdrawFee: '0.1', confirmations: 20, addressType: 'circle_evm', color: '#2E6AED' },
  { symbol: 'QI', name: 'BENQI', chainId: 'avax', network: 'Avalanche C-Chain', type: 'token', decimals: 18, minDeposit: '50', minWithdraw: '500', withdrawFee: '200', confirmations: 20, addressType: 'circle_evm', color: '#2596BE' },
  { symbol: 'GMX', name: 'GMX', chainId: 'avax', network: 'Avalanche C-Chain', type: 'token', decimals: 18, minDeposit: '0.01', minWithdraw: '0.1', withdrawFee: '0.05', confirmations: 20, addressType: 'circle_evm', color: '#5C47FF' },
  { symbol: 'COQ', name: 'Coq Inu', chainId: 'avax', network: 'Avalanche C-Chain', type: 'token', decimals: 18, minDeposit: '1000000', minWithdraw: '10000000', withdrawFee: '5000000', confirmations: 20, addressType: 'circle_evm', color: '#FF5722' },
  // Additional Avalanche Tokens
  { symbol: 'XAVA', name: 'Avalaunch', chainId: 'avax', network: 'Avalanche C-Chain', type: 'token', decimals: 18, minDeposit: '1', minWithdraw: '10', withdrawFee: '5', confirmations: 20, addressType: 'circle_evm', color: '#FA2A55' },
  { symbol: 'TIME', name: 'Wonderland', chainId: 'avax', network: 'Avalanche C-Chain', type: 'token', decimals: 9, minDeposit: '0.001', minWithdraw: '0.01', withdrawFee: '0.005', confirmations: 20, addressType: 'circle_evm', color: '#FC307B' },
  { symbol: 'MIM', name: 'Magic Internet Money', chainId: 'avax', network: 'Avalanche C-Chain', type: 'token', decimals: 18, minDeposit: '1', minWithdraw: '5', withdrawFee: '1', confirmations: 20, addressType: 'circle_evm', color: '#9695F8' },
  { symbol: 'SPELL', name: 'Spell Token', chainId: 'avax', network: 'Avalanche C-Chain', type: 'token', decimals: 18, minDeposit: '5000', minWithdraw: '50000', withdrawFee: '20000', confirmations: 20, addressType: 'circle_evm', color: '#8B5CF6' },
  { symbol: 'ICE', name: 'Popsicle Finance', chainId: 'avax', network: 'Avalanche C-Chain', type: 'token', decimals: 18, minDeposit: '1', minWithdraw: '10', withdrawFee: '5', confirmations: 20, addressType: 'circle_evm', color: '#00BFFF' },
  { symbol: 'GLP', name: 'GLP', chainId: 'avax', network: 'Avalanche C-Chain', type: 'token', decimals: 18, minDeposit: '0.5', minWithdraw: '5', withdrawFee: '2', confirmations: 20, addressType: 'circle_evm', color: '#5C47FF' },
  { symbol: 'GRAPE', name: 'Grape Finance', chainId: 'avax', network: 'Avalanche C-Chain', type: 'token', decimals: 18, minDeposit: '1', minWithdraw: '10', withdrawFee: '5', confirmations: 20, addressType: 'circle_evm', color: '#722F37' },
  { symbol: 'WINE', name: 'Wine', chainId: 'avax', network: 'Avalanche C-Chain', type: 'token', decimals: 18, minDeposit: '0.1', minWithdraw: '1', withdrawFee: '0.5', confirmations: 20, addressType: 'circle_evm', color: '#722F37' },
  { symbol: 'MORE', name: 'More Token', chainId: 'avax', network: 'Avalanche C-Chain', type: 'token', decimals: 18, minDeposit: '100', minWithdraw: '1000', withdrawFee: '500', confirmations: 20, addressType: 'circle_evm', color: '#00FF00' },
  { symbol: 'PEFI', name: 'Penguin Finance', chainId: 'avax', network: 'Avalanche C-Chain', type: 'token', decimals: 18, minDeposit: '10', minWithdraw: '100', withdrawFee: '50', confirmations: 20, addressType: 'circle_evm', color: '#FF69B4' },
  { symbol: 'SNOB', name: 'Snowball', chainId: 'avax', network: 'Avalanche C-Chain', type: 'token', decimals: 18, minDeposit: '10', minWithdraw: '100', withdrawFee: '50', confirmations: 20, addressType: 'circle_evm', color: '#FFFFFF' },
  { symbol: 'OLIVE', name: 'Olive Cash', chainId: 'avax', network: 'Avalanche C-Chain', type: 'token', decimals: 18, minDeposit: '100', minWithdraw: '1000', withdrawFee: '500', confirmations: 20, addressType: 'circle_evm', color: '#808000' },
  { symbol: 'YAK', name: 'Yield Yak', chainId: 'avax', network: 'Avalanche C-Chain', type: 'token', decimals: 18, minDeposit: '0.1', minWithdraw: '1', withdrawFee: '0.5', confirmations: 20, addressType: 'circle_evm', color: '#8B4513' },
  { symbol: 'ggAVAX', name: 'GoGoPool AVAX', chainId: 'avax', network: 'Avalanche C-Chain', type: 'token', decimals: 18, minDeposit: '0.1', minWithdraw: '1', withdrawFee: '0.1', confirmations: 20, addressType: 'circle_evm', color: '#E84142' },
  { symbol: 'STG', name: 'Stargate', chainId: 'avax', network: 'Avalanche C-Chain', type: 'token', decimals: 18, minDeposit: '1', minWithdraw: '10', withdrawFee: '5', confirmations: 20, addressType: 'circle_evm', color: '#000000' },
  { symbol: 'HOP', name: 'Hop Protocol', chainId: 'avax', network: 'Avalanche C-Chain', type: 'token', decimals: 18, minDeposit: '5', minWithdraw: '50', withdrawFee: '20', confirmations: 20, addressType: 'circle_evm', color: '#D660FF' },
  { symbol: 'BIFI', name: 'Beefy Finance', chainId: 'avax', network: 'Avalanche C-Chain', type: 'token', decimals: 18, minDeposit: '0.001', minWithdraw: '0.01', withdrawFee: '0.005', confirmations: 20, addressType: 'circle_evm', color: '#59A662' },
  { symbol: 'axlUSDC', name: 'Axelar USDC', chainId: 'avax', network: 'Avalanche C-Chain', type: 'token', decimals: 6, minDeposit: '1', minWithdraw: '5', withdrawFee: '1', confirmations: 20, addressType: 'circle_evm', color: '#2775CA' },
  { symbol: 'FRAX', name: 'Frax', chainId: 'avax', network: 'Avalanche C-Chain', type: 'token', decimals: 18, minDeposit: '1', minWithdraw: '5', withdrawFee: '1', confirmations: 20, addressType: 'circle_evm', color: '#000000' },
  { symbol: 'FXS', name: 'Frax Share', chainId: 'avax', network: 'Avalanche C-Chain', type: 'token', decimals: 18, minDeposit: '0.5', minWithdraw: '5', withdrawFee: '2', confirmations: 20, addressType: 'circle_evm', color: '#000000' },
  { symbol: 'MAI', name: 'Mai Finance', chainId: 'avax', network: 'Avalanche C-Chain', type: 'token', decimals: 18, minDeposit: '1', minWithdraw: '10', withdrawFee: '5', confirmations: 20, addressType: 'circle_evm', color: '#FF0066' },
  { symbol: 'miMATIC', name: 'miMATIC', chainId: 'avax', network: 'Avalanche C-Chain', type: 'token', decimals: 18, minDeposit: '1', minWithdraw: '10', withdrawFee: '5', confirmations: 20, addressType: 'circle_evm', color: '#FF0066' },
  { symbol: 'BTCb', name: 'Bitcoin (Avalanche)', chainId: 'avax', network: 'Avalanche C-Chain', type: 'token', decimals: 8, minDeposit: '0.0001', minWithdraw: '0.001', withdrawFee: '0.0005', confirmations: 20, addressType: 'circle_evm', color: '#F7931A' },
  { symbol: 'WETHe', name: 'Wrapped ETH (Avalanche)', chainId: 'avax', network: 'Avalanche C-Chain', type: 'token', decimals: 18, minDeposit: '0.001', minWithdraw: '0.01', withdrawFee: '0.005', confirmations: 20, addressType: 'circle_evm', color: '#627EEA' },
  { symbol: 'LINK', name: 'Chainlink', chainId: 'avax', network: 'Avalanche C-Chain', type: 'token', decimals: 18, minDeposit: '0.1', minWithdraw: '1', withdrawFee: '0.5', confirmations: 20, addressType: 'circle_evm', color: '#375BD2' },
  { symbol: 'AAVE', name: 'Aave', chainId: 'avax', network: 'Avalanche C-Chain', type: 'token', decimals: 18, minDeposit: '0.01', minWithdraw: '0.1', withdrawFee: '0.05', confirmations: 20, addressType: 'circle_evm', color: '#B6509E' },
  { symbol: 'CRV', name: 'Curve DAO', chainId: 'avax', network: 'Avalanche C-Chain', type: 'token', decimals: 18, minDeposit: '1', minWithdraw: '10', withdrawFee: '5', confirmations: 20, addressType: 'circle_evm', color: '#40649F' },
  { symbol: 'SUSHI', name: 'SushiSwap', chainId: 'avax', network: 'Avalanche C-Chain', type: 'token', decimals: 18, minDeposit: '1', minWithdraw: '10', withdrawFee: '5', confirmations: 20, addressType: 'circle_evm', color: '#FA52A0' },
  { symbol: 'UNI', name: 'Uniswap', chainId: 'avax', network: 'Avalanche C-Chain', type: 'token', decimals: 18, minDeposit: '0.1', minWithdraw: '1', withdrawFee: '0.5', confirmations: 20, addressType: 'circle_evm', color: '#FF007A' },
  { symbol: 'BAL', name: 'Balancer', chainId: 'avax', network: 'Avalanche C-Chain', type: 'token', decimals: 18, minDeposit: '0.1', minWithdraw: '1', withdrawFee: '0.5', confirmations: 20, addressType: 'circle_evm', color: '#1E1E1E' },
  { symbol: 'COMP', name: 'Compound', chainId: 'avax', network: 'Avalanche C-Chain', type: 'token', decimals: 18, minDeposit: '0.01', minWithdraw: '0.1', withdrawFee: '0.05', confirmations: 20, addressType: 'circle_evm', color: '#00D395' },
  { symbol: 'MKR', name: 'Maker', chainId: 'avax', network: 'Avalanche C-Chain', type: 'token', decimals: 18, minDeposit: '0.001', minWithdraw: '0.01', withdrawFee: '0.005', confirmations: 20, addressType: 'circle_evm', color: '#1AAB9B' },
  { symbol: 'SNX', name: 'Synthetix', chainId: 'avax', network: 'Avalanche C-Chain', type: 'token', decimals: 18, minDeposit: '0.5', minWithdraw: '5', withdrawFee: '2', confirmations: 20, addressType: 'circle_evm', color: '#00D1FF' },
];

// ============================================
// ALL ASSETS COMBINED (580 tokens)
// ============================================
export const allAssets: AssetConfig[] = [
  ...nativeAssets,      // 23 native chains
  ...erc20Tokens,       // 120 ERC-20 tokens
  ...bep20Tokens,       // 80 BEP-20 tokens
  ...trc20Tokens,       // 40 TRC-20 tokens
  ...splTokens,         // 70 SPL tokens
  ...polygonTokens,     // 55 Polygon tokens
  ...arbitrumTokens,    // 55 Arbitrum tokens
  ...optimismTokens,    // 45 Optimism tokens
  ...baseTokens,        // 35 Base tokens
  ...avalancheTokens,   // 45 Avalanche tokens
  // Total: 568 tokens
];

// ============================================
// UTILITY FUNCTIONS
// ============================================
export const getAssetsByChain = (chainId: string): AssetConfig[] => {
  return allAssets.filter(asset => asset.chainId === chainId);
};

export const getNativeAssets = (): AssetConfig[] => {
  return nativeAssets;
};

export const getAsset = (symbol: string, chainId: string): AssetConfig | undefined => {
  return allAssets.find(
    asset => asset.symbol.toUpperCase() === symbol.toUpperCase() && asset.chainId === chainId
  );
};

export const getChains = (): string[] => {
  return [...new Set(allAssets.map(asset => asset.chainId))];
};

export const chainInfo: Record<string, { name: string; color: string; icon?: string }> = {
  btc: { name: 'Bitcoin', color: '#F7931A' },
  eth: { name: 'Ethereum', color: '#627EEA' },
  bsc: { name: 'BNB Smart Chain', color: '#F3BA2F' },
  sol: { name: 'Solana', color: '#9945FF' },
  trx: { name: 'TRON', color: '#FF0013' },
  matic: { name: 'Polygon', color: '#8247E5' },
  avax: { name: 'Avalanche', color: '#E84142' },
  arb: { name: 'Arbitrum', color: '#28A0F0' },
  op: { name: 'Optimism', color: '#FF0420' },
  base: { name: 'Base', color: '#0052FF' },
  ltc: { name: 'Litecoin', color: '#345D9D' },
  doge: { name: 'Dogecoin', color: '#C2A633' },
  xrp: { name: 'XRP Ledger', color: '#23292F' },
  xlm: { name: 'Stellar', color: '#14B6E7' },
  // NEW chains
  ada: { name: 'Cardano', color: '#0033AD' },
  bch: { name: 'Bitcoin Cash', color: '#8DC351' },
  ton: { name: 'TON', color: '#0098EA' },
  algo: { name: 'Algorand', color: '#000000' },
  dot: { name: 'Polkadot', color: '#E6007A' },
  atom: { name: 'Cosmos Hub', color: '#2E3148' },
  near: { name: 'NEAR', color: '#00C08B' },
  sui: { name: 'Sui', color: '#4DA2FF' },
  etc: { name: 'Ethereum Classic', color: '#328332' },
};

export default allAssets;

/**
 * CoinIcon — renders a real cryptocurrency logo for the given symbol.
 *
 * Logo URLs sourced from CoinGecko's public CDN (assets.coingecko.com), which
 * the backend's CSP already allows (per the production audit notes).
 * Falls back to a colored circle with the symbol's initials on image error
 * or when the symbol isn't in the map.
 */
import { useState } from 'react'

const LOGOS: Record<string, string> = {
  // Major L1s
  BTC: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',
  ETH: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png',
  BNB: 'https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png',
  XRP: 'https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png',
  ADA: 'https://assets.coingecko.com/coins/images/975/large/cardano.png',
  SOL: 'https://assets.coingecko.com/coins/images/4128/large/solana.png',
  DOGE: 'https://assets.coingecko.com/coins/images/5/large/dogecoin.png',
  DOT: 'https://assets.coingecko.com/coins/images/12171/large/polkadot.png',
  MATIC: 'https://assets.coingecko.com/coins/images/4713/large/polygon.png',
  AVAX: 'https://assets.coingecko.com/coins/images/12559/large/Avalanche_Circle_RedWhite_Trans.png',
  LINK: 'https://assets.coingecko.com/coins/images/877/large/chainlink-new-logo.png',
  UNI: 'https://assets.coingecko.com/coins/images/12504/large/uni.png',
  ATOM: 'https://assets.coingecko.com/coins/images/1481/large/cosmos_hub.png',
  LTC: 'https://assets.coingecko.com/coins/images/2/large/litecoin.png',
  TRX: 'https://assets.coingecko.com/coins/images/1094/large/tron-logo.png',
  NEAR: 'https://assets.coingecko.com/coins/images/10365/large/near.jpg',
  APT: 'https://assets.coingecko.com/coins/images/26455/large/aptos_round.png',
  ARB: 'https://assets.coingecko.com/coins/images/16547/large/photo_2023-03-29_21.47.00.jpeg',
  OP: 'https://assets.coingecko.com/coins/images/25244/large/Optimism.png',
  SUI: 'https://assets.coingecko.com/coins/images/26375/large/sui_asset.jpeg',
  SEI: 'https://assets.coingecko.com/coins/images/28205/large/Sei_Logo_-_Transparent.png',
  INJ: 'https://assets.coingecko.com/coins/images/12882/large/Secondary_Symbol.png',
  FTM: 'https://assets.coingecko.com/coins/images/4001/large/Fantom_round.png',
  ALGO: 'https://assets.coingecko.com/coins/images/4380/large/download.png',
  TON: 'https://assets.coingecko.com/coins/images/17980/large/ton_symbol.png',
  BCH: 'https://assets.coingecko.com/coins/images/780/large/bitcoin-cash-circle.png',
  ETC: 'https://assets.coingecko.com/coins/images/453/large/ethereum-classic-logo.png',
  XLM: 'https://assets.coingecko.com/coins/images/100/large/Stellar_symbol_black_RGB.png',
  XMR: 'https://assets.coingecko.com/coins/images/69/large/monero_logo.png',
  FIL: 'https://assets.coingecko.com/coins/images/12817/large/filecoin.png',
  ICP: 'https://assets.coingecko.com/coins/images/14495/large/Internet_Computer_logo.png',
  HBAR: 'https://assets.coingecko.com/coins/images/3688/large/hbar.png',
  CRO: 'https://assets.coingecko.com/coins/images/7310/large/cro_token_logo.png',
  TAO: 'https://assets.coingecko.com/coins/images/28452/large/ARUsPeNQ_400x400.jpeg',
  TIA: 'https://assets.coingecko.com/coins/images/31967/large/tia.jpg',
  STRK: 'https://assets.coingecko.com/coins/images/26433/large/starknet.png',
  KAS: 'https://assets.coingecko.com/coins/images/25751/large/kaspa-icon-exchanges.png',
  AR: 'https://assets.coingecko.com/coins/images/4343/large/oRt6SiEN_400x400.jpg',
  RUNE: 'https://assets.coingecko.com/coins/images/6595/large/Rune200x200.png',
  EGLD: 'https://assets.coingecko.com/coins/images/12335/large/egld-token-logo.png',
  XTZ: 'https://assets.coingecko.com/coins/images/976/large/Tezos-logo.png',
  NEO: 'https://assets.coingecko.com/coins/images/480/large/NEO_512_512.png',
  EOS: 'https://assets.coingecko.com/coins/images/738/large/eos-eos-logo.png',
  IOTA: 'https://assets.coingecko.com/coins/images/692/large/IOTA_Swirl.png',
  VET: 'https://assets.coingecko.com/coins/images/1167/large/VET_Token_Icon.png',
  THETA: 'https://assets.coingecko.com/coins/images/2538/large/theta-token-logo.png',
  // Stablecoins
  USDT: 'https://assets.coingecko.com/coins/images/325/large/Tether.png',
  USDC: 'https://assets.coingecko.com/coins/images/6319/large/usdc.png',
  'USDC.E': 'https://assets.coingecko.com/coins/images/6319/large/usdc.png',
  DAI: 'https://assets.coingecko.com/coins/images/9956/large/Badge_Dai.png',
  BUSD: 'https://assets.coingecko.com/coins/images/9576/large/BUSD.png',
  TUSD: 'https://assets.coingecko.com/coins/images/3449/large/tusd.png',
  FRAX: 'https://assets.coingecko.com/coins/images/13422/large/FRAX_icon.png',
  LUSD: 'https://assets.coingecko.com/coins/images/14666/large/Group_3.png',
  PYUSD: 'https://assets.coingecko.com/coins/images/31212/large/PYUSD_Logo_%282%29.png',
  EURC: 'https://assets.coingecko.com/coins/images/26045/large/euro-coin.png',
  USDP: 'https://assets.coingecko.com/coins/images/6013/large/Pax_Dollar.png',
  // Liquid staking
  STETH: 'https://assets.coingecko.com/coins/images/13442/large/steth_logo.png',
  WSTETH: 'https://assets.coingecko.com/coins/images/18834/large/wstETH.png',
  RETH: 'https://assets.coingecko.com/coins/images/20764/large/reth.png',
  CBETH: 'https://assets.coingecko.com/coins/images/27008/large/cbeth.png',
  MSOL: 'https://assets.coingecko.com/coins/images/17752/large/mSOL.png',
  JITOSOL: 'https://assets.coingecko.com/coins/images/33228/large/jitosol.png',
  SAVAX: 'https://assets.coingecko.com/coins/images/23657/large/savax.png',
  ANKRAVAX: 'https://assets.coingecko.com/coins/images/23658/large/ankr_avax.png',
  STMATIC: 'https://assets.coingecko.com/coins/images/24185/large/stMATIC.png',
  MATICX: 'https://assets.coingecko.com/coins/images/25383/large/maticx.png',
  ETHX: 'https://assets.coingecko.com/coins/images/30870/large/ethx.png',
  LBTC: 'https://assets.coingecko.com/coins/images/39969/large/LBTC_Logo.png',
  // Wrapped
  WETH: 'https://assets.coingecko.com/coins/images/2518/large/weth.png',
  WBTC: 'https://assets.coingecko.com/coins/images/7598/large/wrapped_bitcoin_wbtc.png',
  WMATIC: 'https://assets.coingecko.com/coins/images/14073/large/matic.png',
  // DeFi
  AAVE: 'https://assets.coingecko.com/coins/images/12645/large/AAVE.png',
  MKR: 'https://assets.coingecko.com/coins/images/1364/large/Mark_Maker.png',
  CRV: 'https://assets.coingecko.com/coins/images/12124/large/Curve.png',
  SNX: 'https://assets.coingecko.com/coins/images/3406/large/SNX.png',
  COMP: 'https://assets.coingecko.com/coins/images/10775/large/COMP.png',
  YFI: 'https://assets.coingecko.com/coins/images/11849/large/yearn.jpg',
  SUSHI: 'https://assets.coingecko.com/coins/images/12271/large/512x512_Logo_no_chop.png',
  '1INCH': 'https://assets.coingecko.com/coins/images/13469/large/1inch-token.png',
  LDO: 'https://assets.coingecko.com/coins/images/13573/large/Lido_DAO.png',
  PENDLE: 'https://assets.coingecko.com/coins/images/15069/large/Pendle_Logo_Normal-03.png',
  GMX: 'https://assets.coingecko.com/coins/images/18323/large/arbit.png',
  DYDX: 'https://assets.coingecko.com/coins/images/17500/large/hjnIm9bV.jpg',
  GRT: 'https://assets.coingecko.com/coins/images/13397/large/Graph_Token.png',
  ENS: 'https://assets.coingecko.com/coins/images/19785/large/acatxTm8_400x400.jpg',
  APE: 'https://assets.coingecko.com/coins/images/24383/large/apecoin.jpg',
  CAKE: 'https://assets.coingecko.com/coins/images/12632/large/pancakeswap-cake-logo_%281%29.png',
  RAY: 'https://assets.coingecko.com/coins/images/13928/large/PSigc4ie_400x400.jpg',
  ANKR: 'https://assets.coingecko.com/coins/images/4324/large/U85xTl2.png',
  // Memecoins
  SHIB: 'https://assets.coingecko.com/coins/images/11939/large/shiba.png',
  PEPE: 'https://assets.coingecko.com/coins/images/29850/large/pepe-token.jpeg',
  FLOKI: 'https://assets.coingecko.com/coins/images/16746/large/PNG_image.png',
  BONK: 'https://assets.coingecko.com/coins/images/28600/large/bonk.jpg',
  WIF: 'https://assets.coingecko.com/coins/images/33566/large/dogwifhat.jpg',
  BRETT: 'https://assets.coingecko.com/coins/images/35529/large/1000050750.png',
  // AI
  FET: 'https://assets.coingecko.com/coins/images/5681/large/Fetch.jpg',
  AGIX: 'https://assets.coingecko.com/coins/images/2138/large/singularitynet.png',
  OCEAN: 'https://assets.coingecko.com/coins/images/3687/large/ocean-protocol-logo.jpg',
  WLD: 'https://assets.coingecko.com/coins/images/31069/large/worldcoin.jpeg',
  RENDER: 'https://assets.coingecko.com/coins/images/11636/large/rndr.png',
  RNDR: 'https://assets.coingecko.com/coins/images/11636/large/rndr.png',
  // Gaming
  SAND: 'https://assets.coingecko.com/coins/images/12129/large/sandbox_logo.jpg',
  MANA: 'https://assets.coingecko.com/coins/images/878/large/decentraland-mana.png',
  AXS: 'https://assets.coingecko.com/coins/images/13029/large/axie_infinity_logo.png',
  IMX: 'https://assets.coingecko.com/coins/images/17233/large/immutableX-symbol-BLK-RGB.png',
  GALA: 'https://assets.coingecko.com/coins/images/12493/large/GALA_token_image_-_200PNG.png',
  ENJ: 'https://assets.coingecko.com/coins/images/1102/large/enjin-coin-logo.png',
  CHZ: 'https://assets.coingecko.com/coins/images/8834/large/CHZ_Token_updated.png',
  // Solana DeFi
  JUP: 'https://assets.coingecko.com/coins/images/34188/large/jup.png',
  JTO: 'https://assets.coingecko.com/coins/images/33103/large/jto.png',
  PYTH: 'https://assets.coingecko.com/coins/images/31924/large/pyth.png',
  ORCA: 'https://assets.coingecko.com/coins/images/17547/large/Orca_Logo.png',
  HNT: 'https://assets.coingecko.com/coins/images/4284/large/Helium_HNT.png',
  // Exchange tokens
  HT: 'https://assets.coingecko.com/coins/images/2822/large/huobi-token-logo.png',
  OKB: 'https://assets.coingecko.com/coins/images/4463/large/WeChat_Image_20220118095654.png',
  LEO: 'https://assets.coingecko.com/coins/images/8418/large/leo-token.png',
  KCS: 'https://assets.coingecko.com/coins/images/1047/large/sa9z79.png',
  BGB: 'https://assets.coingecko.com/coins/images/11610/large/photo_2022-01-24_14-08-03.jpg',
  NEXO: 'https://assets.coingecko.com/coins/images/3695/large/nexo.png',
  // Base
  BASE: 'https://assets.coingecko.com/coins/images/35164/large/base.png',
  // Misc
  BLUR: 'https://assets.coingecko.com/coins/images/28453/large/blur.png',
  ENA: 'https://assets.coingecko.com/coins/images/36530/large/ENA.png',
  BAT: 'https://assets.coingecko.com/coins/images/677/large/basic-attention-token.png',
  ORDI: 'https://assets.coingecko.com/coins/images/30162/large/ordi.png',
  WTRX: 'https://assets.coingecko.com/coins/images/14745/large/wtrx.png',
  // Top Binance USDT pairs — additional coverage
  ONDO: 'https://assets.coingecko.com/coins/images/26580/large/ONDO.png',
  ETHFI: 'https://assets.coingecko.com/coins/images/35958/large/etherfi.jpeg',
  W: 'https://assets.coingecko.com/coins/images/35087/large/womcoin_logo.png',
  TNSR: 'https://assets.coingecko.com/coins/images/35972/large/tnsr.png',
  NOT: 'https://assets.coingecko.com/coins/images/35248/large/notcoin.png',
  AEVO: 'https://assets.coingecko.com/coins/images/36011/large/aevo.png',
  ALT: 'https://assets.coingecko.com/coins/images/34608/large/altlayer.png',
  DYM: 'https://assets.coingecko.com/coins/images/34182/large/dym.png',
  MANTA: 'https://assets.coingecko.com/coins/images/34289/large/manta-token.png',
  METIS: 'https://assets.coingecko.com/coins/images/15595/large/metis.jpeg',
  OMNI: 'https://assets.coingecko.com/coins/images/36465/large/Symbol-Red.png',
  REZ: 'https://assets.coingecko.com/coins/images/37327/large/rez.png',
  SAGA: 'https://assets.coingecko.com/coins/images/36260/large/saga.png',
  PORTAL: 'https://assets.coingecko.com/coins/images/35358/large/Portal_200x200.png',
  PIXEL: 'https://assets.coingecko.com/coins/images/35240/large/Pixels_Logo_200_200.png',
  ARKM: 'https://assets.coingecko.com/coins/images/30929/large/Arkham_Logo_CG.png',
  ID: 'https://assets.coingecko.com/coins/images/29519/large/SPACE_ID_logo.png',
  EDU: 'https://assets.coingecko.com/coins/images/29948/large/EDU_Logo.png',
  COMBO: 'https://assets.coingecko.com/coins/images/30248/large/combo.png',
  ACE: 'https://assets.coingecko.com/coins/images/33636/large/ace.png',
  HOOK: 'https://assets.coingecko.com/coins/images/28283/large/HookenToken.png',
  NMR: 'https://assets.coingecko.com/coins/images/752/large/numeraire.png',
  AIOZ: 'https://assets.coingecko.com/coins/images/14631/large/aioz-logo-200.png',
  ALCH: 'https://assets.coingecko.com/coins/images/36264/large/alch.png',
  BB: 'https://assets.coingecko.com/coins/images/36851/large/bouncebit.png',
  BIGTIME: 'https://assets.coingecko.com/coins/images/32550/large/bigtime.png',
  DOGS: 'https://assets.coingecko.com/coins/images/39751/large/dogs.png',
  MOG: 'https://assets.coingecko.com/coins/images/38024/large/mog.png',
  BANANA: 'https://assets.coingecko.com/coins/images/38924/large/Profile_picture_2.png',
  EIGEN: 'https://assets.coingecko.com/coins/images/39255/large/EIGEN.png',
  USUAL: 'https://assets.coingecko.com/coins/images/49273/large/USUAL.png',
  FUEL: 'https://assets.coingecko.com/coins/images/37614/large/fuel.png',
  IO: 'https://assets.coingecko.com/coins/images/37754/large/IO.png',
  BNX: 'https://assets.coingecko.com/coins/images/26095/large/BinaryX.png',
  AVA: 'https://assets.coingecko.com/coins/images/2106/large/avax.png',
  OXT: 'https://assets.coingecko.com/coins/images/3916/large/orchid.png',
  MOVR: 'https://assets.coingecko.com/coins/images/17984/large/9285.png',
  GLMR: 'https://assets.coingecko.com/coins/images/22459/large/glmr.png',
  RPL: 'https://assets.coingecko.com/coins/images/2090/large/rocket_pool_%28RPL%29.png',
  FXS: 'https://assets.coingecko.com/coins/images/13423/large/Frax_Shares_icon.png',
  ALCX: 'https://assets.coingecko.com/coins/images/14113/large/Alchemix.png',
  AERGO: 'https://assets.coingecko.com/coins/images/4490/large/aergo.png',
  BAL: 'https://assets.coingecko.com/coins/images/11683/large/Balancer.png',
  KSM: 'https://assets.coingecko.com/coins/images/9568/large/m4zRhP5e_400x400.jpg',
  KAVA: 'https://assets.coingecko.com/coins/images/9761/large/kava.png',
  ROSE: 'https://assets.coingecko.com/coins/images/13162/large/rose.png',
  CELO: 'https://assets.coingecko.com/coins/images/11090/large/InjsYf7W_400x400.jpg',
  CFX: 'https://assets.coingecko.com/coins/images/13079/large/3vuYMbjN.png',
  MINA: 'https://assets.coingecko.com/coins/images/15628/large/JM4_vQ34_400x400.png',
  FLOW: 'https://assets.coingecko.com/coins/images/13446/large/5f6294c0c7a8cda55cb1c936_Flow_Wordmark.png',
  FTT: 'https://assets.coingecko.com/coins/images/9026/large/F.png',
  SXP: 'https://assets.coingecko.com/coins/images/9368/large/swipe.png',
  CELR: 'https://assets.coingecko.com/coins/images/4379/large/Celr.png',
  CKB: 'https://assets.coingecko.com/coins/images/9566/large/Nervos_White.png',
  IOTX: 'https://assets.coingecko.com/coins/images/3334/large/iotex-logo.png',
  ZIL: 'https://assets.coingecko.com/coins/images/2687/large/Zilliqa-logo.png',
  // 24h-popular Binance fillers
  TURBO: 'https://assets.coingecko.com/coins/images/30117/large/TURBO.jpg',
  BOME: 'https://assets.coingecko.com/coins/images/36071/large/bome.png',
  POPCAT: 'https://assets.coingecko.com/coins/images/35094/large/popcat.jpg',
  MEW: 'https://assets.coingecko.com/coins/images/36440/large/MEW.png',
  PNUT: 'https://assets.coingecko.com/coins/images/50289/large/peanut.png',
  ACT: 'https://assets.coingecko.com/coins/images/50529/large/AI_Cat.png',
  SCR: 'https://assets.coingecko.com/coins/images/50571/large/scroll.jpeg',
  PEOPLE: 'https://assets.coingecko.com/coins/images/18876/large/people.png',
  LOOKS: 'https://assets.coingecko.com/coins/images/22173/large/circle-black-256.png',
  GMT: 'https://assets.coingecko.com/coins/images/23597/large/gmt.png',
  GST: 'https://assets.coingecko.com/coins/images/21841/large/gst.png',
  SLP: 'https://assets.coingecko.com/coins/images/10366/large/SLP.png',
  ILV: 'https://assets.coingecko.com/coins/images/14468/large/logo-200x200.png',
  FIDA: 'https://assets.coingecko.com/coins/images/14472/large/bonfida.png',
  STORJ: 'https://assets.coingecko.com/coins/images/949/large/storj.png',
  SC: 'https://assets.coingecko.com/coins/images/289/large/siacoin.png',
  RVN: 'https://assets.coingecko.com/coins/images/3412/large/ravencoin.png',
  DGB: 'https://assets.coingecko.com/coins/images/63/large/digibyte.png',
  ICX: 'https://assets.coingecko.com/coins/images/1060/large/icon-icx-logo.png',
  WAVES: 'https://assets.coingecko.com/coins/images/425/large/waves.png',
  ZEN: 'https://assets.coingecko.com/coins/images/691/large/horizen.png',
  QTUM: 'https://assets.coingecko.com/coins/images/684/large/Qtum_Logo_blue_CG.png',
  ROAM: 'https://assets.coingecko.com/coins/images/40222/large/roam.png',
  ZRO: 'https://assets.coingecko.com/coins/images/28206/large/ftxG9_TJ_400x400.jpeg',
  BANANA31: 'https://assets.coingecko.com/coins/images/38924/large/Profile_picture_2.png',
  XEC: 'https://assets.coingecko.com/coins/images/16646/large/Logo_final-22.png',
  HMSTR: 'https://assets.coingecko.com/coins/images/39102/large/hamster_kombat_logo.png',
  CATI: 'https://assets.coingecko.com/coins/images/39765/large/Catizen.png',
}

const COLORS: Record<string, string> = {
  BTC: '#F7931A', ETH: '#627EEA', BNB: '#F3BA2F', XRP: '#23292F',
  ADA: '#0033AD', SOL: '#9945FF', DOGE: '#C2A633', DOT: '#E6007A',
  MATIC: '#8247E5', AVAX: '#E84142', LINK: '#2A5ADA', UNI: '#FF007A',
  ATOM: '#2E3148', LTC: '#345D9D', TRX: '#EF0027', NEAR: '#00C08B',
  APT: '#000000', ARB: '#28A0F0', OP: '#FF0420', SUI: '#4DA2FF',
  USDT: '#26A17B', USDC: '#2775CA', DAI: '#F5AC37', BUSD: '#F0B90B',
  AAVE: '#B6509E', SHIB: '#FFA409', PEPE: '#3D9E3D', BONK: '#F5A623',
  TIA: '#7B2BF9', STRK: '#EC796B', TON: '#0098EA', BCH: '#8DC351',
  XLM: '#000000', SAND: '#04ADEF', MANA: '#FF2D55', BASE: '#0052FF',
  TAO: '#000000', RENDER: '#000000', JUP: '#54C0CB', PYTH: '#5DADEC',
  ALGO: '#000000', FTM: '#1969FF', INJ: '#00F2FE', SEI: '#9B1C1C',
}

type Props = {
  symbol: string
  size?: number
  className?: string
  style?: React.CSSProperties
}

/**
 * Try sources in order:
 *   1. Curated CoinGecko URL (high quality for popular coins)
 *   2. CoinCap CDN (covers thousands by lowercase symbol)
 *   3. Cryptoicons.org (last-ditch CDN)
 *   4. Colored letter avatar
 */
function buildSourceList(sym: string): string[] {
  const lower = sym.toLowerCase()
  const sources: string[] = []
  const curated = LOGOS[sym] ?? LOGOS[sym.replace(/\.E$/, '')]
  if (curated) sources.push(curated)
  sources.push(`https://assets.coincap.io/assets/icons/${lower}@2x.png`)
  sources.push(`https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@master/svg/color/${lower}.svg`)
  sources.push(`https://cryptologos.cc/logos/${lower}-${lower}-logo.png`)
  return sources
}

export function CoinIcon({ symbol, size = 32, className, style }: Props) {
  const sym = (symbol || '').toUpperCase()
  const sources = buildSourceList(sym)
  const color = COLORS[sym] ?? '#1B8C3E'
  const [idx, setIdx] = useState(0)
  const url = sources[idx]
  const exhausted = idx >= sources.length

  const baseStyle: React.CSSProperties = {
    width: size,
    height: size,
    minWidth: size,
    borderRadius: '50%',
    background: !exhausted ? '#fff' : color,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    color: '#fff',
    fontSize: Math.round(size * 0.42),
    fontWeight: 800,
    lineHeight: 1,
    flexShrink: 0,
    ...style,
  }

  if (!exhausted) {
    return (
      <div className={className} style={baseStyle}>
        <img
          key={url}
          src={url}
          alt={sym}
          width={size}
          height={size}
          loading="lazy"
          decoding="async"
          onError={() => setIdx(i => i + 1)}
          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
        />
      </div>
    )
  }

  return (
    <div className={className} style={baseStyle} aria-label={sym}>
      {sym.slice(0, sym.length > 4 ? 1 : 2)}
    </div>
  )
}

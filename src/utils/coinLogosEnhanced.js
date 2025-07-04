/**
 * 향상된 코인 로고 URL 생성 유틸리티
 * 여러 소스를 활용하여 안정적인 로고 제공
 */

// CoinGecko 코인 ID 매핑
const COINGECKO_COIN_IDS = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  USDT: 'tether',
  BNB: 'binancecoin',
  XRP: 'ripple',
  ADA: 'cardano',
  DOGE: 'dogecoin',
  SOL: 'solana',
  DOT: 'polkadot',
  MATIC: 'matic-network',
  AVAX: 'avalanche-2',
  SHIB: 'shiba-inu',
  ATOM: 'cosmos',
  LTC: 'litecoin',
  UNI: 'uniswap',
  LINK: 'chainlink',
  TRX: 'tron',
  APT: 'aptos',
  ARB: 'arbitrum',
  OP: 'optimism',
  PEPE: 'pepe',
  WIF: 'dogwifcoin',
  FLOKI: 'floki',
  INJ: 'injective-protocol',
  SUI: 'sui',
  SEI: 'sei-network',
  TIA: 'celestia',
  PENDLE: 'pendle',
  ENA: 'ethena',
  ONDO: 'ondo-finance',
  AAVE: 'aave',
  MKR: 'maker',
  CRV: 'curve-dao-token',
  NEAR: 'near',
  FIL: 'filecoin',
  ICP: 'internet-computer',
  ALGO: 'algorand',
  VET: 'vechain',
  FTM: 'fantom',
  SAND: 'the-sandbox',
  MANA: 'decentraland',
  AXS: 'axie-infinity',
  GALA: 'gala',
  CHZ: 'chiliz',
  ENJ: 'enjincoin',
  THETA: 'theta-token',
  XLM: 'stellar',
  XMR: 'monero',
  EOS: 'eos',
  NEO: 'neo',
  DASH: 'dash',
  ZEC: 'zcash',
  ETC: 'ethereum-classic',
  COMP: 'compound-governance-token',
  SNX: 'synthetix-network-token',
  YFI: 'yearn-finance',
  SUSHI: 'sushi',
  BAT: 'basic-attention-token',
  ZRX: '0x',
  QTUM: 'qtum',
  OMG: 'omisego',
  ICX: 'icon',
  ZIL: 'zilliqa',
  WAVES: 'waves',
  BTT: 'bittorrent',
  KAVA: 'kava',
  BAND: 'band-protocol',
  REN: 'republic-protocol',
  BAL: 'balancer',
  RSR: 'reserve-rights-token',
  NMR: 'numeraire',
  OCEAN: 'ocean-protocol',
  ANKR: 'ankr',
  GRT: 'the-graph',
  1INCH: '1inch',
  CELO: 'celo',
  MASK: 'mask-network',
  LRC: 'loopring',
  KEEP: 'keep-network',
  PERP: 'perpetual-protocol',
  DYDX: 'dydx',
  IMX: 'immutable-x',
  JASMY: 'jasmy',
  SPELL: 'spell-token',
  AGLD: 'adventure-gold',
  CELR: 'celer-network',
  ALICE: 'my-neighbor-alice',
  BICO: 'biconomy',
  DAR: 'mines-of-dalarnia',
  RNDR: 'render-token',
  AUDIO: 'audius',
  API3: 'api3',
  FET: 'fetch-ai',
  LPT: 'livepeer',
  XTZ: 'tezos',
  KSM: 'kusama',
  BCH: 'bitcoin-cash',
  HBAR: 'hedera',
  EGLD: 'elrond-erd-2',
  MINA: 'mina-protocol',
  FLOW: 'flow',
  KDA: 'kadena',
  ROSE: 'oasis-network',
  MOVR: 'moonriver',
  KNC: 'kyber-network-crystal',
  IOTA: 'iota',
  KLAY: 'klay-token'
};

// CryptoCompare 심볼 ID (대부분 심볼 그대로 사용)
// 특수한 경우만 매핑
const CRYPTOCOMPARE_SYMBOL_MAP = {
  MIOTA: 'IOTA',
  // 필요시 추가
};

/**
 * 여러 소스에서 코인 로고 URL 생성 (우선순위 적용)
 * @param {string} symbol - 코인 심볼 (예: BTC, ETH)
 * @param {string} preferredSource - 선호하는 소스 ('coingecko', 'cryptocompare', 'bitget')
 * @returns {string} 로고 이미지 URL
 */
export function getCoinLogoUrl(symbol, preferredSource = 'coingecko') {
  if (!symbol) return '';
  
  // USDT 등 스테이블코인 접미사 제거
  const cleanSymbol = symbol.replace(/USDT$/, '').toUpperCase();
  
  // 선호 소스에 따른 URL 반환
  switch (preferredSource) {
    case 'coingecko':
      return getCoinGeckoLogoUrl(cleanSymbol);
    case 'cryptocompare':
      return getCryptoCompareLogoUrl(cleanSymbol);
    case 'bitget':
      return getBitgetLogoUrl(cleanSymbol);
    default:
      return getCoinGeckoLogoUrl(cleanSymbol);
  }
}

/**
 * CoinGecko 로고 URL 생성
 * @param {string} symbol - 코인 심볼
 * @returns {string} CoinGecko 로고 URL
 */
export function getCoinGeckoLogoUrl(symbol) {
  const coinId = COINGECKO_COIN_IDS[symbol];
  
  if (coinId) {
    // CoinGecko 이미지 URL 형식
    // large: 200x200, small: 60x60, thumb: 25x25
    return `https://assets.coingecko.com/coins/images/${getCoingeckoImageId(coinId)}/large/${coinId}.png`;
  }
  
  // 매핑이 없는 경우 기본 폴백
  return getDefaultLogoUrl(symbol);
}

/**
 * CoinGecko 이미지 ID 추출 (하드코딩된 주요 코인들)
 * 실제로는 API를 통해 가져와야 하지만, 주요 코인들은 고정값 사용
 */
function getCoingeckoImageId(coinId) {
  const imageIds = {
    'bitcoin': '1',
    'ethereum': '279',
    'tether': '325',
    'binancecoin': '825',
    'ripple': '44',
    'cardano': '975',
    'dogecoin': '5',
    'solana': '4128',
    'polkadot': '12171',
    'matic-network': '4713',
    'avalanche-2': '12559',
    'shiba-inu': '11939',
    'cosmos': '1481',
    'litecoin': '2',
    'uniswap': '12504',
    'chainlink': '877',
    'tron': '1094',
    'aptos': '26455',
    'arbitrum': '16547',
    'optimism': '25244'
  };
  
  return imageIds[coinId] || '1'; // 기본값은 비트코인 ID
}

/**
 * CryptoCompare 로고 URL 생성
 * @param {string} symbol - 코인 심볼
 * @returns {string} CryptoCompare 로고 URL
 */
export function getCryptoCompareLogoUrl(symbol) {
  // CryptoCompare 특수 심볼 처리
  const mappedSymbol = CRYPTOCOMPARE_SYMBOL_MAP[symbol] || symbol;
  
  // CryptoCompare CDN URL
  return `https://www.cryptocompare.com/media/37746251/${mappedSymbol.toLowerCase()}.png`;
}

/**
 * Bitget 로고 URL 생성 (폴백용)
 * @param {string} symbol - 코인 심볼
 * @returns {string} Bitget 로고 URL
 */
export function getBitgetLogoUrl(symbol) {
  // 비트겟 CDN URL 패턴 (현재 403 에러 발생 중)
  return `https://img.bitgetimg.com/multiLang/web/${symbol}.png`;
}

/**
 * 기본 로고 URL 또는 플레이스홀더 생성
 * @param {string} symbol - 코인 심볼
 * @returns {string} 기본 로고 URL
 */
export function getDefaultLogoUrl(symbol) {
  // CoinGecko의 일반적인 패턴으로 시도
  return `https://assets.coingecko.com/coins/images/1/large/${symbol.toLowerCase()}.png`;
}

/**
 * 로고 URL 배열 생성 (폴백 체인)
 * 여러 소스를 시도할 수 있도록 배열로 반환
 * @param {string} symbol - 코인 심볼
 * @returns {string[]} 로고 URL 배열 (우선순위 순)
 */
export function getCoinLogoUrlChain(symbol) {
  if (!symbol) return [];
  
  const cleanSymbol = symbol.replace(/USDT$/, '').toUpperCase();
  const urls = [];
  
  // 1순위: CoinGecko (가장 안정적)
  urls.push(getCoinGeckoLogoUrl(cleanSymbol));
  
  // 2순위: CryptoCompare
  urls.push(getCryptoCompareLogoUrl(cleanSymbol));
  
  // 3순위: Bitget (현재 작동하지 않을 가능성 있음)
  urls.push(getBitgetLogoUrl(cleanSymbol));
  
  // 중복 제거
  return [...new Set(urls)];
}

/**
 * React 컴포넌트에서 사용할 수 있는 이미지 로더
 * onError 이벤트 시 다음 URL로 자동 전환
 */
export function createLogoLoader(symbol) {
  const urls = getCoinLogoUrlChain(symbol);
  let currentIndex = 0;
  
  return {
    getCurrentUrl: () => urls[currentIndex] || '',
    getNextUrl: () => {
      currentIndex++;
      return urls[currentIndex] || null;
    },
    hasNext: () => currentIndex < urls.length - 1,
    reset: () => {
      currentIndex = 0;
    }
  };
}

// 내보내기
export default {
  getCoinLogoUrl,
  getCoinGeckoLogoUrl,
  getCryptoCompareLogoUrl,
  getBitgetLogoUrl,
  getDefaultLogoUrl,
  getCoinLogoUrlChain,
  createLogoLoader,
  COINGECKO_COIN_IDS,
  CRYPTOCOMPARE_SYMBOL_MAP
};
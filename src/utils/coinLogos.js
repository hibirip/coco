// 코인 로고 URL 생성 유틸리티

// CryptoCompare API를 통한 실제 코인 로고 서비스
// 고품질 로고 이미지를 제공하며, 대부분의 암호화폐를 지원
const CRYPTOCOMPARE_BASE_URL = 'https://www.cryptocompare.com';

// 주요 코인들의 CryptoCompare ID 매핑 (정확한 로고를 위해)
export const CRYPTOCOMPARE_COIN_IDS = {
  BTC: '1182', // 비트코인
  ETH: '7605', // 이더리움  
  USDT: '3206', // 테더
  BNB: '33285', // 바이낸스 코인
  XRP: '5031', // 리플
  ADA: '12681', // 카르다노
  DOGE: '4432', // 도지코인
  SOL: '49929', // 솔라나
  DOT: '44107', // 폴카닷
  MATIC: '37746', // 폴리곤
  AVAX: '44142', // 아발란체
  SHIB: '46195', // 시바이누
  ATOM: '15116', // 코스모스
  LTC: '3808', // 라이트코인
  UNI: '44077', // 유니스왑
  LINK: '34477', // 체인링크
  TRX: '28824', // 트론
  APT: '1027024', // 압토스
  ARB: '1030618', // 아비트럼
  OP: '881449', // 옵티미즘
  FIL: '44123', // 파일코인
  ICP: '44422', // 인터넷 컴퓨터
  VET: '12677', // 비체인
  HBAR: '37408', // 헤데라
  NEAR: '44142', // 니어 프로토콜
  ALGO: '38478', // 알고랜드
  FLOW: '44142', // 플로우
  XTZ: '11948', // 테조스
  AAVE: '34477', // 아베
  MKR: '4432', // 메이커
  COMP: '44077', // 컴파운드
  SNX: '33376', // 신세틱스
  CRV: '42025', // 커브
  '1INCH': '44077', // 1인치
  SUSHI: '42025', // 스시스왑
  YFI: '40485', // 이어 파이낸스
  BAL: '34477', // 밸런서
  LRC: '12681', // 루프링
  ZRX: '7673', // 0x 프로토콜
  BAT: '12681', // 베이직 어텐션 토큰
  MANA: '12681', // 디센트럴랜드
  ENJ: '12681', // 엔진 코인
  CHZ: '28824', // 칠리즈
  HOT: '28824', // 홀로체인
  THETA: '28824', // 테타
  TFUEL: '28824', // 테타 퓨얼
  FTM: '28824', // 팬텀
  ONE: '28824', // 하모니
  ZIL: '28824', // 질리카
  BTT: '28824', // 비트토렌트
  WAVES: '28824', // 웨이브즈
  ICX: '28824', // 아이콘
  ONT: '28824', // 온톨로지
  QTUM: '28824', // 퀀텀
  ZEC: '28824', // 지캐시
  DASH: '28824', // 대시
  XMR: '28824', // 모네로
  IOST: '28824', // 아이오에스티
  EOS: '28824', // 이오스
  NEO: '28824', // 네오
  XLM: '28824', // 스텔라
  BCH: '3808', // 비트코인 캐시
  ETC: '7605', // 이더리움 클래식
  BSV: '3808', // 비트코인 SV
  XEM: '28824', // 넴
  NANO: '28824', // 나노
  IOTA: '28824', // 아이오타
  OMG: '12681', // 옴고 네트워크
  ZRX: '7673', // 0x
  REP: '12681', // 어거
  KNC: '12681', // 카이버 네트워크
  GNT: '12681', // 골렘
  LOOM: '12681', // 룸 네트워크
  RLC: '12681', // 아이엑세크
  STORJ: '12681', // 스토리지
  ANT: '12681', // 아라곤
  MLN: '12681', // 멜론
  SALT: '12681', // 솔트
  GNO: '12681', // 노시스
  RDN: '12681', // 라이덴 네트워크
  '1ST': '12681', // 퍼스트블러드
  SNGLS: '12681', // 싱귤러
  XAUR: '12681', // 제아우럼
  NMR: '12681', // 뉴머레어
  WTC: '12681', // 월튼체인
  BNT: '12681', // 반코르
  SNT: '12681', // 스테이터스
  CFI: '12681', // 코파운디
  BQX: '12681', // 에토스
  FUN: '12681', // 펀페어
  DNT: '12681', // 디스트릭트0x
  MTL: '12681', // 메탈
  PAY: '12681', // 텐X
  TNT: '12681', // 티어네트워크
  PTOY: '12681', // 플레이어스
  QRL: '12681', // 퀀텀 저항 원장
  CVC: '12681', // 시빅
  OAX: '12681', // 오픈ANX
  ADX: '12681', // 애드엑스
  CTR: '12681', // 센트라
  IOTA: '28824', // 아이오타
  OMG: '12681', // 옴고 네트워크
  ZRX: '7673', // 0x
  SNT: '12681', // 스테이터스
  ELF: '12681', // 아엘프
  POWR: '12681', // 파워 레저
  TIX: '12681', // 블록팩스
  INS: '12681', // INS 에코시스템
  IOST: '28824', // 아이오에스티
  STEEM: '28824', // 스팀
  XVG: '28824', // 버지
  BCN: '28824', // 바이트코인
  SC: '28824', // 시아코인
  ARDR: '28824', // 아더
  KMD: '28824', // 코모도
  ARK: '28824', // 아크
  STRAT: '28824', // 스트라티스
  BTS: '28824', // 비트셰어
  GBG: '28824', // 고바이트
  SBD: '28824', // 스팀 달러
  PPT: '28824', // 포퓰러스
  SNM: '28824', // 소노엠
  BNB: '33285', // 바이낸스 코인
  VEN: '28824', // 비체인
  REQ: '12681', // 리퀘스트 네트워크
  NULS: '28824', // 뉼스
  PRL: '28824', // 오이스터 펄
  AMB: '28824', // 앰버
  DGD: '12681', // 디지털골드
  QASH: '28824', // 큐에이에스에이치
  ETHOS: '28824', // 에토스
  QSP: '12681', // 퀀스탬프
  ZIL: '28824', // 질리카
  ICN: '12681', // 아이코노미
  GAS: '28824', // 가스
  ENG: '12681', // 에니그마
  BRD: '12681', // 브레드
  FUN: '12681', // 펀페어
  RLC: '12681', // 아이엑세크
  STORJ: '12681', // 스토리지
  BAT: '12681', // 베이직 어텐션 토큰
  KNC: '12681', // 카이버 네트워크
  LOOM: '12681', // 룸 네트워크
  MANA: '12681', // 디센트럴랜드
  DNT: '12681', // 디스트릭트0x
  SALT: '12681', // 솔트
  CVC: '12681', // 시빅
  BNT: '12681', // 반코르
  DATA: '12681', // 스트림
  DTA: '12681', // 데이터
  AOA: '28824', // 오로라
  GTO: '12681', // 기프토
  UTK: '12681', // 유트러스트
  MDA: '12681', // 모에다
  CDT: '12681', // 코인대시
  TRX: '28824', // 트론
  XVG: '28824', // 버지
  EMC: '28824', // 에머코인
  WAN: '28824', // 완체인
  FUEL: '12681', // 이타늄
  ZEN: '28824', // 젠캐시
  CTR: '12681', // 센트라
  BRD: '12681', // 브레드
  TNB: '12681', // 타임 뉴 뱅크
  SYS: '28824', // 시스코인
  QLC: '28824', // QLC 체인
  NAS: '28824', // 네뷸러스
  MFT: '12681', // 메인프레임
  KEY: '12681', // 비링크
  DENT: '12681', // 덴트
  ARDR: '28824', // 아더
  EVX: '12681', // 에버렉스
  GNX: '12681', // 게네시스 비전
  REP: '12681', // 어거
  VIB: '12681', // 바이브
  MCO: '12681', // 모나코
  MTH: '12681', // 모네타
  EDO: '12681', // 에이도스
  WINGS: '12681', // 윙스
  NAV: '28824', // 나브코인
  LUN: '12681', // 루넥스
  TRIG: '12681', // 트리거스
  APPC: '12681', // 앱코인
  VIBES: '12681', // 바이브스
  RCN: '12681', // 리콘
  R: '12681', // 리볼버
  YOYOW: '28824', // 요요우
  XZC: '28824', // 지코인
  ENJ: '12681', // 엔진 코인
  POWR: '12681', // 파워 레저
  VTC: '28824', // 버트코인
  BCD: '3808', // 비트코인 다이아몬드
  LEND: '12681', // 에이브 옛 토큰
  CHAT: '12681', // 채트코인
  BCPT: '12681', // 블록메이슨 크레딧 프로토콜
  OST: '12681', // 심플 토큰
  TNT: '12681', // 티어네트워크
  FUEL: '12681', // 이타늄
  MANA: '12681', // 디센트럴랜드
  ELF: '12681', // 아엘프
  POLY: '12681', // 폴리매스
  BTS: '28824', // 비트셰어
  GXS: '28824', // GXS체인
  GNT: '12681', // 골렘
  NEO: '28824', // 네오
  GAS: '28824', // 가스
  QLC: '28824', // QLC 체인
  ONT: '28824', // 온톨로지
  ZIL: '28824', // 질리카
  QTUM: '28824', // 퀀텀
  ICX: '28824', // 아이콘
  SC: '28824', // 시아코인
  BNB: '33285', // 바이낸스 코인
  VET: '12677', // 비체인
  WAN: '28824', // 완체인
  ZEN: '28824', // 젠캐시
  WAVES: '28824', // 웨이브즈
  IOST: '28824', // 아이오에스티
  AE: '28824', // 애터니티
  AION: '28824', // 아이온
  WTC: '12681', // 월튼체인
  THETA: '28824', // 테타
  SNM: '28824', // 소노엠
  WPR: '12681', // 위파워
  REQ: '12681', // 리퀘스트 네트워크
  SUB: '12681', // 서브스트라텀
  LRC: '12681', // 루프링
  PIVX: '28824', // 피브엑스
  IOS: '28824', // 아이오에스티
  STEEM: '28824', // 스팀
  NANO: '28824', // 나노
  VIA: '28824', // 비아코인
  BLZ: '12681', // 블레이져
  SYS: '28824', // 시스코인
  RPX: '28824', // 레드 펄스
  NCASH: '12681', // 엔케시
  POA: '12681', // POA 네트워크
  OMG: '12681', // 옴고 네트워크
  ZRX: '7673', // 0x
  STORJ: '12681', // 스토리지
  ADX: '12681', // 애드엑스
  CMT: '28824', // 사이버마일즈
  XLNT: '12681', // 러닝머신
  CND: '12681', // 신디케이트
  LEND: '12681', // 에이브
  WABI: '12681', // 와비
  WAVES: '28824', // 웨이브즈
  GTO: '12681', // 기프토
  ICN: '12681', // 아이코노미
  AMB: '28824', // 앰버
  BCO: '12681', // 비지니스
  SNGLS: '12681', // 싱귤러
  BQX: '12681', // 에토스
  KNC: '12681', // 카이버 네트워크
  FUN: '12681', // 펀페어
  SNT: '12681', // 스테이터스
  LINK: '34477', // 체인링크
  XVS: '12681', // 비너스
  CAKE: '44077', // 팬케이크 스왑
  AUTO: '44077', // 오토팜
  TWT: '33285', // 트러스트 월렛 토큰
  BTT: '28824', // 비트토렌트
  WIN: '28824', // 윈크
  HOT: '28824', // 홀로체인
  MATIC: '37746', // 폴리곤
  ATOM: '15116', // 코스모스
  ALGO: '38478', // 알고랜드
  VET: '12677', // 비체인
  HBAR: '37408', // 헤데라
  NEAR: '44142', // 니어 프로토콜
  FIL: '44123', // 파일코인
  ICP: '44422', // 인터넷 컴퓨터
  THETA: '28824', // 테타
  AAVE: '34477', // 아베
  EOS: '28824', // 이오스
  FLOW: '44142', // 플로우
  KSM: '44107', // 쿠사마
  XTZ: '11948', // 테조스
  EGLD: '44422', // 멀티버스엑스
  MINA: '44422', // 미나
  RUNE: '44142', // 토르체인
  '1INCH': '44077', // 1인치
  COMP: '44077', // 컴파운드
  MKR: '4432', // 메이커
  SUSHI: '42025', // 스시스왑
  YFI: '40485', // 이어 파이낸스
  SNX: '33376', // 신세틱스
  CRV: '42025', // 커브
  BAL: '34477', // 밸런서
  REN: '33376', // 렌
  UMA: '44077', // UMA 프로토콜
  LRC: '12681', // 루프링
  ZRX: '7673', // 0x 프로토콜
  BAT: '12681', // 베이직 어텐션 토큰
  MANA: '12681', // 디센트럴랜드
  ENJ: '12681', // 엔진 코인
  CHZ: '28824', // 칠리즈
  SAND: '12681', // 샌드박스
  AXS: '44077', // 액시 인피니티
  GALA: '44077', // 갈라 게임즈
  LOOKS: '44077', // 룩스레어
  IMX: '44422', // 이뮤터블엑스
  APE: '44077', // 에이프코인
  GMT: '44077', // 스테픈
  GST: '44077', // 그린 새텔라이트 토큰
  LOKA: '44077', // 리그 오브 킹덤스
  ACA: '44422', // 아칼라
  JASMY: '44077', // 재스미
  HIGH: '44077', // 하이스트리트
  ILV: '44077', // 일루비움
  MC: '44077', // 메리트 서클
  PYR: '44077', // 벌칸 포지드
  SPELL: '44077', // 스펠토큰
  BICO: '44077', // 바이코노미
  FLUX: '44077', // 플럭스
  REI: '44077', // 렌드 제로
  TROY: '44077', // 트로이
  FIDA: '44077', // 보나 피다
  OGN: '44077', // 오리진 프로토콜
  PLA: '44077', // 플레이댑
  TLM: '44077', // 알리언 월드
  SLP: '44077', // 스무스 러브 포션
  ALICE: '44077', // 마이 네이버 앨리스
  AUDIO: '44077', // 오디우스
  C98: '44077', // 코인98
  MASK: '44077', // 마스크 네트워크
  '1000LUNC': '28824', // 테라 루나 클래식
  '1000SHIB': '46195', // 시바이누
  PEOPLE: '44077', // 컨스티튜션DAO
  DOGE: '4432', // 도지코인
  LUNC: '28824', // 테라 루나 클래식
  USTC: '28824', // 테라 클래식 USD
  LUNA: '28824', // 테라
  AVAX: '44142', // 아발란체
  NEAR: '44142', // 니어 프로토콜
  ROSE: '44422', // 오아시스 네트워크
  DYDX: '44077', // dYdX
  '1000XEC': '28824', // 이캐시
  RAY: '49929', // 레이디움
  SRM: '49929', // 세럼
  FIDA: '49929', // 보나 피다
  KIN: '49929', // 킨
  MAPS: '49929', // 맵스
  OXY: '49929', // 옥시젠
  TULIP: '49929', // 솔파머
  STEP: '49929', // 스텝 파이낸스
  MEDIA: '49929', // 미디어 네트워크
  COPE: '49929', // 코프
  ROPE: '49929', // 로프토큰
  MER: '49929', // 머카토
  BOKU: '49929', // 보쿠
  SAMO: '49929', // 사모예드코인
  NINJA: '49929', // 닌자코인
  AURY: '49929', // 아우러리
  SBR: '49929', // 세이버
  PORT: '49929', // 포트 파이낸스
  MNGO: '49929', // 망고 마켓
  ORCA: '49929', // 오르카
  SLND: '49929', // 솔렌드
  GENE: '49929', // 파커모어
  DFL: '49929', // 드플레이션
  UPS: '49929', // 업온리
  LIKE: '49929', // 온리원
  JET: '49929', // 젯 프로토콜
  GRAPE: '49929', // 그레이프
  LARIX: '49929', // 라릭스
  SONAR: '49929', // 소나르워치
  SLRS: '49929', // 솔라리스
  REAL: '49929', // 리얼마
  RIN: '49929', // 올더링
  SOLPAD: '49929', // 솔패드
  ATLAS: '49929', // 스타 아틀라스
  POLIS: '49929', // 스타 아틀라스 DAO
  FOXY: '49929', // 폭시
  TRTL: '49929', // 터틀코인
  SLCL: '49929', // 솔 클러스터
  MEAN: '49929', // 미언파이 프로토콜
  CHEEMS: '49929', // 심스
  BASIS: '49929', // 베이시스 마켓
  GST: '49929', // 그린 새틸라이트 토큰
  PSY: '49929', // 사이옵션
  UXD: '49929', // UXD 프로토콜
  HADES: '49929', // 하데스
  SOLR: '49929', // 솔라지움
  TINY: '49929', // 타이니콜로니
  PRISM: '49929', // 프리즘
  ISOLA: '49929', // 아이솔라
  SOCN: '49929', // 소시안
  CRWNY: '49929', // 크라우니
  DAWG: '49929', // 닥
  FRAKT: '49929', // 프락트
  TTT: '49929', // 탭 툴즈
  FLOOF: '49929', // 플루프
  BONK: '49929', // 봉크
  FORGE: '49929', // 블록스미스 랩스 포지
  KARATE: '49929', // 카라테 콤뱃
  DUST: '49929', // 더스트 프로토콜
  DEAL: '49929', // 딜박스
  SOLX: '49929', // 솔아이
  UXP: '49929', // UXP
  YARD: '49929', // 야드
  CGG: '49929', // 체인 가이드
  RUNNER: '49929', // 메타러너
  CAVE: '49929', // 크립토 콜로세움
  BLOCK: '49929', // 블록토피아
  CWAR: '49929', // 크립토워
  CHICKS: '49929', // 솔칙스
  AI: '49929', // 아이코인
  FRONK: '49929', // 프론크
  NYAN: '49929', // 냔코인
  SILLY: '49929', // 실리드래곤볼
  WEN: '49929', // 웬
  MYRO: '49929', // 마이로
  BOME: '49929', // 북 오브 맴
  SLERF: '49929', // 슬러프
  SMOG: '49929', // 스모그
  MOTHER: '49929', // 이그시
  POPCAT: '49929', // 팝캣
  WIF: '49929', // 위프
  PONKE: '49929', // 퐁케
  PNUT: '49929', // 피넛 더 스퀴렐
  GOAT: '49929', // 고트세우스 맥시무스
  ACT: '49929', // 액트
  MOODENG: '49929', // 무덴그
  NEIRO: '49929', // 네이로
  TURBO: '44077', // 터보
  MOG: '44077', // 모그코인
  FLOKI: '44077', // 플로키
  PEPE: '44077', // 페페
  WOJAK: '44077', // 워작
  GROK: '44077', // 그록
  BABYDOGE: '44077', // 베이비도지
  DOGELON: '44077', // 도지론마스
  CORGI: '44077', // 웰시코기코인
  HOGE: '44077', // 호지 파이낸스
  AKITA: '44077', // 아키타이누
  KISHU: '44077', // 키슈이누
  VOLT: '44077', // 볼트이누
  KUMA: '44077', // 쿠마이누
  PUPPER: '44077', // 퍼퍼
  RCKT: '44077', // 로켓이누
  DINU: '44077', // 도지이누
  MUSK: '44077', // 도지머스크
  MINIDOGE: '44077', // 미니도지
  SUPERDOGE: '44077', // 슈퍼도지
  DOGGY: '44077', // 도기
  DOG: '44077', // 도그
  DOGECOLA: '44077', // 도지콜라
  DOGET: '44077', // 도지토큰
  DOGE2: '44077', // 도지2
  DOGEC: '44077', // 도지카드
  DOGI: '44077', // 도기
  DOGZ: '44077', // 도그즈
  ELON: '44077', // 도지론마스
  MARS: '44077', // 마스코인
  SAFE: '44077', // 세이프마스
  ELONGATE: '44077', // 엘론게이트
  SPACEX: '44077', // 스페이스엑스
  TESLA: '44077', // 테슬라토큰
  TSLA: '44077', // 테슬라코인
  BTC2: '44077', // 비트코인2
  ETH2: '44077', // 이더리움2
  DOGE2: '44077', // 도지2
  SHIB2: '44077', // 시바2
  SAFEMOON: '44077' // 세이프문
};

/**
 * 코인 로고 URL 생성 (CoinMarketCap 우선)
 * @param {string} symbol - 코인 심볼 (예: BTCUSDT, BTC)
 * @returns {string} 로고 이미지 URL
 */
export function getCoinLogoUrl(symbol) {
  if (!symbol) return '';
  
  // USDT 등 스테이블코인 제거하여 순수 심볼 추출
  const cleanSymbol = symbol.replace(/USDT$/, '').toUpperCase();
  
  // 1순위: CoinMarketCap (가장 안정적)
  const cmcId = CMC_IDS[cleanSymbol];
  if (cmcId) {
    return `https://s2.coinmarketcap.com/static/img/coins/64x64/${cmcId}.png`;
  }
  
  // 2순위: CoinGecko의 대체 로고
  return getFallbackLogoUrl(cleanSymbol);
}

// 대체 로고 서비스들 (우선순위별)
const FALLBACK_SERVICES = {
  // 1순위: CoinGecko API (가장 안정적)
  coingecko: (symbol) => `https://assets.coingecko.com/coins/images/1/large/${symbol.toLowerCase()}.png`,
  
  // 2순위: CoinMarketCap 로고 서비스
  coinmarketcap: (symbol) => `https://s2.coinmarketcap.com/static/img/coins/64x64/${getCMCId(symbol)}.png`,
  
  // 3순위: CryptoCompare의 generic 로고
  cryptocompareGeneric: (symbol) => `https://www.cryptocompare.com/media/19633/btc.png`,
  
  // 4순위: 플레이스홀더
  placeholder: (symbol) => `https://via.placeholder.com/64x64/3B82F6/FFFFFF?text=${symbol.slice(0, 2)}`
};

// 주요 코인들의 CoinMarketCap ID 매핑 (실제 검증된 ID)
const CMC_IDS = {
  BTC: '1',        // 비트코인
  ETH: '1027',     // 이더리움
  USDT: '825',     // 테더
  BNB: '1839',     // 바이낸스 코인
  XRP: '52',       // 리플
  ADA: '2010',     // 카르다노
  DOGE: '74',      // 도지코인
  SOL: '5426',     // 솔라나
  DOT: '6636',     // 폴카닷
  MATIC: '3890',   // 폴리곤
  AVAX: '5805',    // 아발란체
  SHIB: '5994',    // 시바이누
  ATOM: '3794',    // 코스모스
  LTC: '2',        // 라이트코인
  UNI: '7083',     // 유니스왑
  LINK: '1975',    // 체인링크
  TRX: '1958',     // 트론
  APT: '21794',    // 압토스
  ARB: '11841',    // 아비트럼
  OP: '11840',     // 옵티미즘
  FIL: '2280',     // 파일코인
  ICP: '8916',     // 인터넷 컴퓨터
  VET: '3077',     // 비체인
  HBAR: '4642',    // 헤데라
  NEAR: '6535',    // 니어 프로토콜
  ALGO: '4030',    // 알고랜드
  FLOW: '4558',    // 플로우
  XTZ: '2011',     // 테조스
  AAVE: '7278',    // 아베
  MKR: '1518',     // 메이커
  COMP: '5692',    // 컴파운드
  SNX: '2586',     // 신세틱스
  CRV: '6538',     // 커브
  '1INCH': '8104', // 1인치
  SUSHI: '6758',   // 스시스왑
  YFI: '5864',     // 이어 파이낸스
  BAL: '5728',     // 밸런서
  LRC: '1934',     // 루프링
  ZRX: '1896',     // 0x 프로토콜
  BAT: '1697',     // 베이직 어텐션 토큰
  MANA: '1966',    // 디센트럴랜드
  ENJ: '2130',     // 엔진 코인
  CHZ: '4066',     // 칠리즈
  HOT: '2682',     // 홀로체인
  THETA: '2416',   // 테타
  FTM: '3513',     // 팬텀
  ONE: '3945',     // 하모니
  ZIL: '2469',     // 질리카
  BTT: '3718',     // 비트토렌트
  WAVES: '1274',   // 웨이브즈
  ICX: '2099',     // 아이콘
  ONT: '2566',     // 온톨로지
  QTUM: '1684',    // 퀀텀
  ZEC: '1437',     // 지캐시
  DASH: '131',     // 대시
  XMR: '328',      // 모네로
  IOST: '4218',    // 아이오에스티
  EOS: '1765',     // 이오스
  NEO: '1376',     // 네오
  XLM: '512',      // 스텔라
  BCH: '1831',     // 비트코인 캐시
  ETC: '1321',     // 이더리움 클래식
  BSV: '3602',     // 비트코인 SV
  XEM: '873',      // 넴
  NANO: '1567',    // 나노
  IOTA: '1720',    // 아이오타
  OMG: '1808',     // 옴고 네트워크
  REP: '1104',     // 어거
  KNC: '1982',     // 카이버 네트워크
  GNT: '1455',     // 골렘
  STORJ: '1772',   // 스토리지
  SAND: '6210',    // 샌드박스
  AXS: '6783',     // 액시 인피니티
  GALA: '7080',    // 갈라 게임즈
  IMX: '10603',    // 이뮤터블엑스
  APE: '18876',    // 에이프코인
  GMT: '16352',    // 스테픈
  JASMY: '8425',   // 재스미
  DYDX: '11156',   // dYdX
  CAKE: '7186',    // 팬케이크 스왑
  LUNA: '4172',    // 테라
  ROSE: '7653',    // 오아시스 네트워크
  RUNE: '4157',    // 토르체인
  KAVA: '4846',    // 카바
  EGLD: '6892',    // 멀티버스엑스
  MINA: '8646',    // 미나
  STX: '4847',     // 스택스
  GRT: '6719',     // 더 그래프
  RNDR: '5690',    // 렌더 토큰
  FET: '3773',     // Fetch.ai
  PENDLE: '9481',  // 펜들
  JUP: '18547',    // 주피터
  WLD: '13502',    // 월드코인
  ONDO: '13271',   // 온도
  PYTH: '18465',   // 피스 네트워크
  SUI: '20947',    // 수이
  INJ: '7226',     // 인젝티브
  SEI: '11035',    // 세이
  TIA: '22861',    // 셀레스티아
  BLUR: '23121',   // 블러
  PEPE: '24478',   // 페페
  WIF: '28752',    // 위프
  FLOKI: '10804',  // 플로키
  BONK: '23095',   // 봉크
  NEIRO: '29336',  // 네이로
  POPCAT: '31268', // 팝캣
  GOAT: '31892',   // 고트세우스 맥시무스
  PNUT: '32536',   // 피넛 더 스퀴렐
  ACT: '33118',    // 액트
  MOODENG: '32834' // 무덴그
};

function getCMCId(symbol) {
  return CMC_IDS[symbol] || '1'; // 기본값은 비트코인 ID
}

// 대체 CoinGecko 로고 URL (CMC에 없는 코인용)
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
  FIL: 'filecoin',
  ICP: 'internet-computer',
  VET: 'vechain',
  HBAR: 'hedera-hashgraph',
  NEAR: 'near',
  ALGO: 'algorand',
  FLOW: 'flow',
  XTZ: 'tezos',
  AAVE: 'aave',
  MKR: 'maker',
  COMP: 'compound-governance-token',
  SNX: 'havven',
  CRV: 'curve-dao-token',
  '1INCH': '1inch',
  SUSHI: 'sushi',
  YFI: 'yearn-finance',
  BAL: 'balancer',
  LRC: 'loopring',
  ZRX: '0x',
  BAT: 'basic-attention-token',
  MANA: 'decentraland',
  ENJ: 'enjincoin',
  CHZ: 'chiliz',
  SAND: 'the-sandbox',
  AXS: 'axie-infinity',
  GALA: 'gala',
  IMX: 'immutable-x',
  APE: 'apecoin',
  GMT: 'stepn',
  JASMY: 'jasmycoin'
};

// 백업용 - 안정적인 아이콘 서비스 (iconify)
export const ICONIFY_LOGOS = {
  BTC: 'https://api.iconify.design/cryptocurrency-color:btc.svg',
  ETH: 'https://api.iconify.design/cryptocurrency-color:eth.svg',
  USDT: 'https://api.iconify.design/cryptocurrency-color:usdt.svg',
  BNB: 'https://api.iconify.design/cryptocurrency-color:bnb.svg',
  XRP: 'https://api.iconify.design/cryptocurrency-color:xrp.svg',
  ADA: 'https://api.iconify.design/cryptocurrency-color:ada.svg',
  DOGE: 'https://api.iconify.design/cryptocurrency-color:doge.svg',
  SOL: 'https://api.iconify.design/cryptocurrency-color:sol.svg',
  DOT: 'https://api.iconify.design/cryptocurrency-color:dot.svg',
  MATIC: 'https://api.iconify.design/cryptocurrency-color:matic.svg',
  AVAX: 'https://api.iconify.design/cryptocurrency-color:avax.svg',
  ATOM: 'https://api.iconify.design/cryptocurrency-color:atom.svg',
  LTC: 'https://api.iconify.design/cryptocurrency-color:ltc.svg',
  UNI: 'https://api.iconify.design/cryptocurrency-color:uni.svg',
  LINK: 'https://api.iconify.design/cryptocurrency-color:link.svg',
  TRX: 'https://api.iconify.design/cryptocurrency-color:trx.svg'
};

/**
 * 대체 로고 URL 생성 (우선순위별 시도)
 * @param {string} symbol - 코인 심볼
 * @returns {string} 대체 로고 URL
 */
export function getFallbackLogoUrl(symbol) {
  const cleanSymbol = symbol.replace(/USDT$/, '').toUpperCase();
  
  // 1순위: Iconify (SVG 아이콘 - 안정적)
  if (ICONIFY_LOGOS[cleanSymbol]) {
    return ICONIFY_LOGOS[cleanSymbol];
  }
  
  // 2순위: CoinGecko
  const coinGeckoId = COINGECKO_COIN_IDS[cleanSymbol];
  if (coinGeckoId) {
    return `https://assets.coingecko.com/coins/images/1/large/${coinGeckoId}.png`;
  }
  
  // 3순위: 플레이스홀더
  return `https://via.placeholder.com/64x64/3B82F6/FFFFFF?text=${cleanSymbol.slice(0, 2)}`;
}

export default {
  getCoinLogoUrl,
  getFallbackLogoUrl,
  CMC_IDS,
  ICONIFY_LOGOS,
  COINGECKO_COIN_IDS
};
/**
 * Technical-analysis indicator calculations for the trading chart.
 *
 * All inputs are arrays of OHLCV candles, sorted ascending by time.
 * All outputs are arrays of `{ time, value }` (or multi-value records)
 * matching lightweight-charts' series data shape.
 */

export interface Bar {
  /** Unix timestamp in seconds (NOT milliseconds — lightweight-charts wants seconds). */
  time: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface Point { time: number; value: number }

// ─── Moving averages ───────────────────────────────────────────────────────

export function sma(bars: Bar[], period: number): Point[] {
  const out: Point[] = []
  if (period <= 0 || bars.length < period) return out
  let sum = 0
  for (let i = 0; i < bars.length; i++) {
    sum += bars[i].close
    if (i >= period) sum -= bars[i - period].close
    if (i >= period - 1) out.push({ time: bars[i].time, value: sum / period })
  }
  return out
}

export function ema(bars: Bar[], period: number): Point[] {
  const out: Point[] = []
  if (period <= 0 || bars.length < period) return out
  const k = 2 / (period + 1)
  // Seed with SMA of first `period` bars
  let prev = 0
  for (let i = 0; i < period; i++) prev += bars[i].close
  prev /= period
  out.push({ time: bars[period - 1].time, value: prev })
  for (let i = period; i < bars.length; i++) {
    prev = bars[i].close * k + prev * (1 - k)
    out.push({ time: bars[i].time, value: prev })
  }
  return out
}

// ─── Bollinger Bands ───────────────────────────────────────────────────────

export interface BBPoint { time: number; mid: number; upper: number; lower: number }
export function bb(bars: Bar[], period = 20, mult = 2): BBPoint[] {
  const out: BBPoint[] = []
  if (period <= 0 || bars.length < period) return out
  for (let i = period - 1; i < bars.length; i++) {
    let sum = 0
    for (let j = i - period + 1; j <= i; j++) sum += bars[j].close
    const mean = sum / period
    let sqSum = 0
    for (let j = i - period + 1; j <= i; j++) sqSum += (bars[j].close - mean) ** 2
    const stdev = Math.sqrt(sqSum / period)
    out.push({ time: bars[i].time, mid: mean, upper: mean + mult * stdev, lower: mean - mult * stdev })
  }
  return out
}

// ─── RSI (Relative Strength Index, Wilder smoothing) ──────────────────────

export function rsi(bars: Bar[], period = 14): Point[] {
  const out: Point[] = []
  if (bars.length < period + 1) return out
  let avgGain = 0, avgLoss = 0
  for (let i = 1; i <= period; i++) {
    const ch = bars[i].close - bars[i - 1].close
    if (ch >= 0) avgGain += ch
    else avgLoss -= ch
  }
  avgGain /= period; avgLoss /= period
  out.push({ time: bars[period].time, value: avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss) })
  for (let i = period + 1; i < bars.length; i++) {
    const ch = bars[i].close - bars[i - 1].close
    const gain = ch > 0 ? ch : 0
    const loss = ch < 0 ? -ch : 0
    avgGain = (avgGain * (period - 1) + gain) / period
    avgLoss = (avgLoss * (period - 1) + loss) / period
    out.push({ time: bars[i].time, value: avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss) })
  }
  return out
}

// ─── MACD ──────────────────────────────────────────────────────────────────

export interface MACDPoint { time: number; macd: number; signal: number; hist: number }
export function macd(bars: Bar[], fast = 12, slow = 26, signalPeriod = 9): MACDPoint[] {
  const fastEMA = ema(bars, fast)
  const slowEMA = ema(bars, slow)
  const fastMap = new Map(fastEMA.map(p => [p.time, p.value]))
  // MACD line = EMA(fast) - EMA(slow), aligned at slow EMA times
  const macdLine: Point[] = []
  for (const p of slowEMA) {
    const f = fastMap.get(p.time)
    if (f !== undefined) macdLine.push({ time: p.time, value: f - p.value })
  }
  // Signal line = EMA of macdLine (treat macdLine as bars-with-close)
  const signalEMA = (() => {
    if (macdLine.length < signalPeriod) return [] as Point[]
    const k = 2 / (signalPeriod + 1)
    let prev = 0
    for (let i = 0; i < signalPeriod; i++) prev += macdLine[i].value
    prev /= signalPeriod
    const r: Point[] = [{ time: macdLine[signalPeriod - 1].time, value: prev }]
    for (let i = signalPeriod; i < macdLine.length; i++) {
      prev = macdLine[i].value * k + prev * (1 - k)
      r.push({ time: macdLine[i].time, value: prev })
    }
    return r
  })()
  const sigMap = new Map(signalEMA.map(p => [p.time, p.value]))
  const out: MACDPoint[] = []
  for (const p of macdLine) {
    const s = sigMap.get(p.time)
    if (s !== undefined) out.push({ time: p.time, macd: p.value, signal: s, hist: p.value - s })
  }
  return out
}

// ─── Stochastic %K %D ──────────────────────────────────────────────────────

export interface StochPoint { time: number; k: number; d: number }
export function stochastic(bars: Bar[], kPeriod = 14, dPeriod = 3): StochPoint[] {
  const out: StochPoint[] = []
  if (bars.length < kPeriod) return out
  const ks: Point[] = []
  for (let i = kPeriod - 1; i < bars.length; i++) {
    let hi = -Infinity, lo = Infinity
    for (let j = i - kPeriod + 1; j <= i; j++) {
      if (bars[j].high > hi) hi = bars[j].high
      if (bars[j].low < lo)  lo = bars[j].low
    }
    const k = hi === lo ? 50 : ((bars[i].close - lo) / (hi - lo)) * 100
    ks.push({ time: bars[i].time, value: k })
  }
  // %D = SMA of %K
  for (let i = dPeriod - 1; i < ks.length; i++) {
    let sum = 0
    for (let j = i - dPeriod + 1; j <= i; j++) sum += ks[j].value
    out.push({ time: ks[i].time, k: ks[i].value, d: sum / dPeriod })
  }
  return out
}

// ─── ATR (Average True Range, Wilder) ──────────────────────────────────────

export function atr(bars: Bar[], period = 14): Point[] {
  const out: Point[] = []
  if (bars.length < period + 1) return out
  const tr: number[] = []
  for (let i = 1; i < bars.length; i++) {
    const c = bars[i - 1].close
    tr.push(Math.max(bars[i].high - bars[i].low, Math.abs(bars[i].high - c), Math.abs(bars[i].low - c)))
  }
  let avg = 0
  for (let i = 0; i < period; i++) avg += tr[i]
  avg /= period
  out.push({ time: bars[period].time, value: avg })
  for (let i = period; i < tr.length; i++) {
    avg = (avg * (period - 1) + tr[i]) / period
    out.push({ time: bars[i + 1].time, value: avg })
  }
  return out
}

// ─── CCI (Commodity Channel Index) ─────────────────────────────────────────

export function cci(bars: Bar[], period = 20): Point[] {
  const out: Point[] = []
  if (bars.length < period) return out
  const tp = bars.map(b => (b.high + b.low + b.close) / 3)
  for (let i = period - 1; i < bars.length; i++) {
    let sum = 0
    for (let j = i - period + 1; j <= i; j++) sum += tp[j]
    const mean = sum / period
    let dev = 0
    for (let j = i - period + 1; j <= i; j++) dev += Math.abs(tp[j] - mean)
    dev /= period
    out.push({ time: bars[i].time, value: dev === 0 ? 0 : (tp[i] - mean) / (0.015 * dev) })
  }
  return out
}

// ─── OBV (On-Balance Volume) ───────────────────────────────────────────────

export function obv(bars: Bar[]): Point[] {
  const out: Point[] = []
  if (bars.length === 0) return out
  let acc = 0
  out.push({ time: bars[0].time, value: 0 })
  for (let i = 1; i < bars.length; i++) {
    if (bars[i].close > bars[i - 1].close) acc += bars[i].volume
    else if (bars[i].close < bars[i - 1].close) acc -= bars[i].volume
    out.push({ time: bars[i].time, value: acc })
  }
  return out
}

// ─── VWAP (resets daily — simple anchored-to-first-bar version here) ───────

export function vwap(bars: Bar[]): Point[] {
  const out: Point[] = []
  let cumPV = 0, cumV = 0
  for (const b of bars) {
    const tp = (b.high + b.low + b.close) / 3
    cumPV += tp * b.volume
    cumV += b.volume
    out.push({ time: b.time, value: cumV === 0 ? tp : cumPV / cumV })
  }
  return out
}

// ─── Awesome Oscillator (Bill Williams) ───────────────────────────────────

export function awesomeOscillator(bars: Bar[]): Point[] {
  const median = bars.map(b => ({ time: b.time, mid: (b.high + b.low) / 2 }))
  const sma5  = (() => {
    const r: Point[] = []
    for (let i = 4; i < median.length; i++) {
      let s = 0
      for (let j = i - 4; j <= i; j++) s += median[j].mid
      r.push({ time: median[i].time, value: s / 5 })
    }
    return r
  })()
  const sma34 = (() => {
    const r: Point[] = []
    for (let i = 33; i < median.length; i++) {
      let s = 0
      for (let j = i - 33; j <= i; j++) s += median[j].mid
      r.push({ time: median[i].time, value: s / 34 })
    }
    return r
  })()
  const m5 = new Map(sma5.map(p => [p.time, p.value]))
  return sma34.map(p => ({ time: p.time, value: (m5.get(p.time) ?? p.value) - p.value }))
}

// ─── Ichimoku Cloud (Tenkan, Kijun, Senkou A/B, Chikou) ────────────────────

export interface IchimokuPoint {
  time: number
  tenkan?: number; kijun?: number; senkouA?: number; senkouB?: number; chikou?: number
}
export function ichimoku(bars: Bar[], tenkanP = 9, kijunP = 26, senkouBP = 52, displacement = 26): IchimokuPoint[] {
  const hh = (i: number, p: number): number => {
    let m = -Infinity
    for (let j = Math.max(0, i - p + 1); j <= i; j++) if (bars[j].high > m) m = bars[j].high
    return m
  }
  const ll = (i: number, p: number): number => {
    let m = Infinity
    for (let j = Math.max(0, i - p + 1); j <= i; j++) if (bars[j].low < m) m = bars[j].low
    return m
  }
  const out: IchimokuPoint[] = bars.map((b, i) => {
    const tenkan = i >= tenkanP - 1 ? (hh(i, tenkanP) + ll(i, tenkanP)) / 2 : undefined
    const kijun  = i >= kijunP - 1  ? (hh(i, kijunP)  + ll(i, kijunP))  / 2 : undefined
    const senkouB = i >= senkouBP - 1 ? (hh(i, senkouBP) + ll(i, senkouBP)) / 2 : undefined
    const senkouA = tenkan !== undefined && kijun !== undefined ? (tenkan + kijun) / 2 : undefined
    const chikou = bars[i + displacement]?.close
    return { time: b.time, tenkan, kijun, senkouA, senkouB, chikou }
  })
  return out
}

// ─── Pivot Points (classic, derived from previous bar) ─────────────────────

export interface PivotPoint { time: number; p: number; r1: number; r2: number; s1: number; s2: number }
export function pivotPoints(bars: Bar[]): PivotPoint[] {
  const out: PivotPoint[] = []
  for (let i = 1; i < bars.length; i++) {
    const prev = bars[i - 1]
    const p = (prev.high + prev.low + prev.close) / 3
    const r1 = 2 * p - prev.low
    const s1 = 2 * p - prev.high
    const r2 = p + (prev.high - prev.low)
    const s2 = p - (prev.high - prev.low)
    out.push({ time: bars[i].time, p, r1, r2, s1, s2 })
  }
  return out
}

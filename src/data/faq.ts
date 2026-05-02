// Curated FAQ catalog. Used by HelpCenter / Article screens until the
// backend exposes /support/articles (which it doesn't today).
//
// Articles render as paragraphs / numbered steps / bullet lists derived
// from the markdown-light body. The Article screen renders body lines
// as a flat list; bold via **text**, italics via *text*, links via
// [label](url). New articles can be added without code changes.

export type FaqCategory =
  | 'deposits'
  | 'withdrawals'
  | 'trading'
  | 'security'
  | 'kyc'
  | 'card'
  | 'ai'
  | 'other'

export type FaqArticle = {
  slug: string
  category: FaqCategory
  title: string
  /** One-sentence preview shown in the Quick Answers list */
  preview: string
  /** Article body. Each entry becomes a paragraph. Sections start with
   *  '## ' to render as a heading; lines starting with '- ' render as
   *  bullets; lines starting with a number-dot render as numbered steps. */
  body: string[]
  /** Optional URL to a deeper read on the website */
  externalUrl?: string
  /** Estimated read time in minutes (UI hint) */
  readTimeMin?: number
  /** Helpful rating shown at the top — derived stub */
  helpfulPct?: number
  helpfulCount?: number
}

export const FAQ_ARTICLES: FaqArticle[] = [
  // ───────────────────── DEPOSITS ─────────────────────
  {
    slug: 'how-to-deposit-crypto',
    category: 'deposits',
    title: 'How to deposit crypto',
    preview: 'Generate an address, send from your other wallet or exchange, wait for confirmations.',
    readTimeMin: 2,
    helpfulPct: 96, helpfulCount: 1840,
    body: [
      'Depositing crypto into your CrymadX account takes 3 steps. The address you receive is yours forever — you can reuse it for future deposits.',
      '## Steps',
      '1. Open the **Wallet** tab and tap **Receive** (or go to Services → Deposit).',
      '2. Pick the asset and the network. The same coin can live on multiple chains (e.g. USDT exists on Ethereum, BSC, Tron) — sending on the wrong network can lose your funds.',
      '3. Copy the address (or scan the QR) and paste it into the sending wallet/exchange.',
      '## How long it takes',
      'Most chains land within 10 minutes. Bitcoin can take 30–60 minutes for the first confirmation. You\'ll get a push notification when funds arrive.',
      '## Common mistakes',
      '- Wrong network: sending USDT-ERC20 to a USDT-TRC20 address — funds are usually unrecoverable',
      '- Missing memo/tag (XRP, XLM, EOS) — always include the memo we provide if it shows on the deposit screen',
    ],
  },
  {
    slug: 'deposit-not-arrived',
    category: 'deposits',
    title: 'My deposit hasn\'t arrived yet',
    preview: 'Check confirmations on the explorer, then verify the network matches.',
    readTimeMin: 2,
    helpfulPct: 91, helpfulCount: 622,
    body: [
      'If your deposit is taking longer than expected, work through this checklist before opening a ticket.',
      '## Quick checks',
      '1. Find the **transaction hash (TXID)** in your sending wallet/exchange.',
      '2. Paste it into a public block explorer (e.g. blockchain.com for BTC, etherscan.io for ETH).',
      '3. Look at the number of confirmations. CrymadX waits for: BTC=2, ETH=12, SOL=32, USDT-TRX=20, others vary.',
      '## Still missing after enough confirmations?',
      '- Verify you sent on the **same network** that we showed on the deposit screen',
      '- Verify the **destination address** in the explorer matches what we showed',
      '- If a memo/tag was required, verify it was included',
      'If everything checks out, open a support ticket with the TXID, the asset, and the network — we\'ll trace it.',
    ],
  },
  {
    slug: 'fiat-deposit-buy-crypto',
    category: 'deposits',
    title: 'Buying crypto with bank card or transfer',
    preview: 'Use Buy Crypto to fund with card / Apple Pay / SEPA / bank transfer.',
    readTimeMin: 2,
    helpfulPct: 88, helpfulCount: 410,
    body: [
      'You can buy crypto directly with a bank card or local transfer through the Buy Crypto tile on the home screen.',
      '## Steps',
      '1. Tap **Buy Crypto** on the dashboard.',
      '2. Pick the asset (BTC, ETH, USDT, etc.) and enter the amount in your local currency.',
      '3. Pick a payment method — card / Apple Pay / Google Pay / bank transfer where available.',
      '4. Complete the third-party gateway flow (Guardarian). KYC is required for amounts above your tier limit.',
      'Settlement usually takes 5–15 minutes. Bank transfers can take longer depending on country.',
    ],
  },

  // ───────────────────── WITHDRAWALS ─────────────────────
  {
    slug: 'how-to-withdraw',
    category: 'withdrawals',
    title: 'How to withdraw crypto',
    preview: 'Pick the asset and network, paste the destination address, confirm with 2FA.',
    readTimeMin: 2,
    helpfulPct: 94, helpfulCount: 1320,
    body: [
      'Withdrawals require account verification (KYC level 1+) and 2FA on your account.',
      '## Steps',
      '1. Open **Wallet → Send** (or Services → Send).',
      '2. Pick the asset, then the network. Match the network exactly to where you\'re withdrawing.',
      '3. Paste the destination address. We support address whitelisting (Saved Addresses) — if you withdraw to the same address often, save it for one-tap reuse.',
      '4. Enter the amount and review the network fee.',
      '5. Confirm with your 2FA code or biometric.',
      '## Limits',
      'Daily and monthly limits depend on your KYC tier. See KYC → KYC Levels for the breakdown.',
    ],
  },
  {
    slug: 'withdrawal-stuck',
    category: 'withdrawals',
    title: 'My withdrawal is stuck on pending',
    preview: 'Check the TXID on the explorer; pending = network congestion, not stuck CrymadX-side.',
    readTimeMin: 2,
    helpfulPct: 89, helpfulCount: 580,
    body: [
      'Once you confirm a withdrawal, CrymadX broadcasts the transaction to the blockchain immediately. After that point, it\'s out of our hands and the network decides how fast it confirms.',
      '## What to do',
      '1. Find the TXID on your withdrawal detail page.',
      '2. Paste it into a public block explorer.',
      '3. Look at confirmations and current network gas/fee level.',
      '## When to contact support',
      'If 2 hours have passed with no on-chain trace at all, or the explorer shows the tx as failed, open a ticket with the withdrawal ID and TXID.',
    ],
  },
  {
    slug: 'withdrawal-fees',
    category: 'withdrawals',
    title: 'Why am I being charged a withdrawal fee?',
    preview: 'Most fee goes straight to the blockchain network — CrymadX takes a small handling fee.',
    readTimeMin: 1,
    helpfulPct: 84, helpfulCount: 290,
    body: [
      'Every blockchain charges a fee to include your transaction in a block. CrymadX displays this network fee on the confirmation screen and forwards it directly to the network.',
      '## Where fees go',
      '- **Network fee**: paid to validators / miners (BTC, ETH, etc.). We don\'t take a cut of this.',
      '- **CrymadX handling fee**: a flat per-asset fee for processing. Listed on the website at crymadx.io/fees.',
      'For small amounts on expensive chains (e.g. ETH mainnet), the fee can be a noticeable percentage. Use a cheaper chain like Polygon or Arbitrum where supported.',
    ],
  },

  // ───────────────────── TRADING & SWAPS ─────────────────────
  {
    slug: 'spot-vs-convert',
    category: 'trading',
    title: 'What\'s the difference between Spot Trade and Convert?',
    preview: 'Spot uses an order book — better price, more control. Convert is one-tap — easier but slightly worse price.',
    readTimeMin: 2,
    helpfulPct: 92, helpfulCount: 770,
    body: [
      'Both ultimately swap one asset for another, but they use very different mechanics.',
      '## Convert',
      'Best for first-timers and small amounts. We give you a quote, you accept, the swap happens. The price you see is the price you pay (no slippage). The catch: there\'s a small spread baked in to compensate the market maker.',
      '## Spot Trade',
      'Best for serious traders and larger sizes. You place limit or market orders against the live order book. You get the actual mid-market price minus a maker/taker fee (0.10% / 0.15%), but you need to understand order types and slippage.',
      '## Rule of thumb',
      'Under $500 → Convert. Above $500, or if you want a specific entry → Spot.',
    ],
  },
  {
    slug: 'maker-vs-taker',
    category: 'trading',
    title: 'Maker vs taker fees explained',
    preview: 'Maker = you add liquidity and pay 0.10%. Taker = you remove liquidity and pay 0.15%.',
    readTimeMin: 1,
    helpfulPct: 90, helpfulCount: 320,
    body: [
      'When you place an order on a spot market, you\'re either ADDING liquidity (a maker) or REMOVING it (a taker).',
      '- **Maker**: limit order that doesn\'t immediately fill — it sits in the order book waiting for someone else to match it. Cheaper at 0.10% because you helped the market.',
      '- **Taker**: market order or any order that fills immediately by matching an existing order. 0.15%.',
      'Higher KYC tiers get reduced fees — see Rewards Hub.',
    ],
  },
  {
    slug: 'how-to-set-price-alert',
    category: 'trading',
    title: 'How to set a price alert',
    preview: 'Go to Settings → Price Alerts, pick a pair and a target.',
    readTimeMin: 1,
    helpfulPct: 87, helpfulCount: 180,
    body: [
      'Price alerts let you get a push notification when a market hits a level you care about.',
      '1. Open **Settings → Price Alerts** (or Services → Price Alerts).',
      '2. Tap **+ New Alert**.',
      '3. Pick the pair (e.g. BTC/USDT), choose **Above** or **Below**, enter the target price.',
      '4. Save. We\'ll push you a notification within ~10 seconds of the trigger.',
      'Alerts auto-disarm after firing once. Re-enable them in the same screen if you want them recurring.',
    ],
  },

  // ───────────────────── SECURITY & 2FA ─────────────────────
  {
    slug: 'enable-2fa',
    category: 'security',
    title: 'How to enable Two-Factor Authentication (2FA)',
    preview: 'Use an authenticator app (Google Authenticator / Authy / 1Password). SMS 2FA is not supported — it\'s vulnerable to SIM swap attacks.',
    readTimeMin: 3,
    helpfulPct: 97, helpfulCount: 1240,
    body: [
      'Two-factor authentication (2FA) adds an extra layer of security. Even if someone gets your password, they can\'t log in without your second factor.',
      '## Step 1: Download an Authenticator App',
      'We recommend Google Authenticator, Authy, or 1Password. Avoid SMS-based 2FA — it\'s vulnerable to SIM swap attacks.',
      '## Step 2: Enable in CrymadX',
      'Go to **Profile → Security → Two-Factor Auth → Enable**. We\'ll show a QR code.',
      '## Step 3: Scan the QR Code',
      'Open your authenticator app, tap **+**, and scan the QR with your camera. The app will start generating 6-digit codes that change every 30 seconds.',
      '## Step 4: Save Backup Codes',
      'We\'ll show you 10 one-time backup codes. **Save these** somewhere safe. If you lose your phone, they\'re how you get back in.',
      '## Step 5: Verify',
      'Enter the current 6-digit code from your authenticator and tap Verify. 2FA is now active.',
    ],
  },
  {
    slug: 'lost-2fa-device',
    category: 'security',
    title: 'I lost my 2FA device',
    preview: 'Use one of your backup codes to log in, then re-enable 2FA on the new device.',
    readTimeMin: 2,
    helpfulPct: 93, helpfulCount: 410,
    body: [
      'If you saved your backup codes when you set up 2FA, recovery is simple.',
      '## With backup codes',
      '1. Log in with email + password.',
      '2. When prompted for 2FA, tap **Use backup code** instead.',
      '3. Enter one of your unused backup codes. Each code can only be used once.',
      '4. Once logged in, go to **Security → 2FA → Reset** and re-enroll on your new device.',
      '## Without backup codes',
      'Open a support ticket with the **2FA Reset** category. We require additional identity verification (a video selfie matching your KYC document) before we can disable 2FA. Expect 24–48 hours for review.',
    ],
  },
  {
    slug: 'anti-phishing-code',
    category: 'security',
    title: 'What is an anti-phishing code?',
    preview: 'A short phrase that appears in every legitimate email from CrymadX so you can spot fakes.',
    readTimeMin: 1,
    helpfulPct: 89, helpfulCount: 230,
    body: [
      'An anti-phishing code is a personal phrase you set up that we include in every email we send you.',
      '## Why it matters',
      'Scammers send fake "CrymadX" emails trying to steal your password. If a so-called CrymadX email **doesn\'t contain your phrase**, it\'s a phishing attempt.',
      '## How to set one up',
      'Go to **Security → Anti-Phishing → Set Code**, choose a memorable phrase (avoid your name or password), and confirm. Every future email from us will include it in the header.',
    ],
  },

  // ───────────────────── KYC & ACCOUNT ─────────────────────
  {
    slug: 'why-kyc',
    category: 'kyc',
    title: 'Why do I need to complete KYC?',
    preview: 'Required by financial regulations. Higher KYC tiers unlock higher limits and more features.',
    readTimeMin: 2,
    helpfulPct: 86, helpfulCount: 510,
    body: [
      'KYC ("Know Your Customer") is a regulatory requirement for any platform that handles fiat or crypto. Verifying your identity protects you and the platform from fraud and money laundering.',
      '## Tier benefits',
      '- **Tier 0** (email only): browse, deposit/withdraw small amounts',
      '- **Tier 1** (ID + selfie): full deposit/withdrawal limits, fiat purchase, P2P',
      '- **Tier 2** (proof of address): higher daily limits, card eligibility',
      '- **Tier 3** (source of funds): institutional / OTC tier',
      '## What we collect',
      'A government-issued ID, a selfie, and (for higher tiers) a recent utility bill / bank statement. All processed by our KYC partner Gokuvision and stored encrypted.',
    ],
  },
  {
    slug: 'kyc-rejected',
    category: 'kyc',
    title: 'My KYC was rejected — what now?',
    preview: 'Check the rejection reason in the KYC status screen and re-submit.',
    readTimeMin: 2,
    helpfulPct: 84, helpfulCount: 220,
    body: [
      'Common rejection reasons and how to fix them:',
      '- **Document image blurry**: Re-shoot in good lighting, hold the camera steady, tap to focus on the ID',
      '- **Information mismatch**: The name/DOB on your ID must match what you typed in the form',
      '- **Selfie doesn\'t match ID**: Remove glasses, hat, mask. Take in natural light',
      '- **Document expired**: Use a current ID',
      '- **Unsupported document**: Use a passport, national ID, or driver\'s license. Bills and student IDs aren\'t accepted',
      'Open the **KYC** screen to see the specific rejection reason and tap **Re-submit** to try again.',
    ],
  },
  {
    slug: 'change-email-or-phone',
    category: 'kyc',
    title: 'How do I change my email or phone?',
    preview: 'Email is locked after KYC. Phone can be changed in Settings.',
    readTimeMin: 1,
    helpfulPct: 78, helpfulCount: 95,
    body: [
      'Phone number can be changed any time from **Profile → Edit → Phone**.',
      'Email is **locked once you complete KYC**. This is intentional — your email is one of your strongest authentication factors.',
      'If you absolutely need to change your email post-KYC, open a support ticket with the **Account** category. We require: a video selfie, the new email\'s OTP verification, and 24–48 hours review.',
    ],
  },

  // ───────────────────── CARD & SPEND ─────────────────────
  {
    slug: 'apply-for-card',
    category: 'card',
    title: 'How do I apply for a CrymadX Visa card?',
    preview: 'Open Card → Apply, complete card-specific KYC, top up with USDC.',
    readTimeMin: 3,
    helpfulPct: 91, helpfulCount: 340,
    body: [
      'The CrymadX Visa card lets you spend crypto at 80M+ Visa merchants worldwide.',
      '## Eligibility',
      '- Account-level KYC tier 2 or above',
      '- Aged 18+',
      '- Resident of a supported country (full list at crymadx.io/card)',
      '## Apply',
      '1. Tap **Card → Apply for Card** (or Services → Card → Apply).',
      '2. Complete the card-specific KYC (handled by our partner Alchemy Pay / fiat24). Quick if your account KYC is already done.',
      '3. Pay the $20 issuance fee. Add a $10 minimum top-up so the card is ready to use.',
      '4. Your virtual card is ready in 2–5 minutes — you\'ll see the card number, expiry, and CVC right in-app.',
    ],
  },
  {
    slug: 'card-cashback',
    category: 'card',
    title: 'How does cashback work?',
    preview: 'Up to 3% in USDC, paid weekly. Tier-based: higher KYC = higher cashback.',
    readTimeMin: 1,
    helpfulPct: 88, helpfulCount: 180,
    body: [
      'Every card transaction earns cashback paid in USDC, credited to your CrymadX wallet weekly.',
      '## Rates',
      '- Bronze tier: 1%',
      '- Silver: 1.5%',
      '- Gold: 2%',
      '- Platinum / Diamond: 3%',
      'Cashback is automatic — no opt-in. Refunded purchases reverse the cashback. Cashback is capped at $1,000/month per account.',
    ],
  },
  {
    slug: 'card-declined',
    category: 'card',
    title: 'My card was declined',
    preview: 'Most common: insufficient balance, wrong PIN, or merchant not supported in your region.',
    readTimeMin: 1,
    helpfulPct: 82, helpfulCount: 150,
    body: [
      'A few quick things to check before contacting support:',
      '1. **Balance**: open Card → confirm you have at least the purchase amount + 3% buffer for FX',
      '2. **PIN**: 3 wrong PIN attempts trigger a temporary lock. Reset from Card Settings',
      '3. **Region**: some merchants block crypto cards (most airlines, some streaming services)',
      '4. **Frozen**: check Card Settings → Card Status. If frozen, unfreeze and retry',
      'Still declined? Open a support ticket under **Card** category with the merchant name and approximate time.',
    ],
  },

  // ───────────────────── AI ASSISTANT ─────────────────────
  {
    slug: 'what-can-ai-do',
    category: 'ai',
    title: 'What can the AI Assistant do for me?',
    preview: 'Trade, swap, set alerts, fetch balances, automate strategies — by voice or chat.',
    readTimeMin: 2,
    helpfulPct: 94, helpfulCount: 280,
    body: [
      'CrymadX AI is a hands-free copilot for everything in the app. Some examples:',
      '- "What\'s my BTC balance?"',
      '- "Convert 0.05 ETH to USDT"',
      '- "Set an alert if SOL drops below $140"',
      '- "Show me my last 5 transactions"',
      '- "Buy 0.1 ETH if BTC dips below 65k"',
      'Trades and transfers always require a final confirmation (PIN or biometric) — the AI never moves funds without you saying yes.',
    ],
  },
  {
    slug: 'ai-voice-mode',
    category: 'ai',
    title: 'Using voice mode',
    preview: 'Tap the mic on the AI screen and speak naturally. Works hands-free.',
    readTimeMin: 1,
    helpfulPct: 90, helpfulCount: 110,
    body: [
      'Voice mode lets you talk to the AI without typing.',
      '1. Open the **AI** tab and tap the **microphone**.',
      '2. Wait for the orb to pulse green, then speak naturally.',
      '3. The AI replies out loud and shows the action in the chat.',
      'Tip: voice mode works with all 14 supported languages. Switch language in Settings → Language.',
    ],
  },
  {
    slug: 'ai-permissions',
    category: 'ai',
    title: 'Why is the AI asking for permission?',
    preview: 'High-risk actions (trade, send, large transfer) need explicit approval each time.',
    readTimeMin: 1,
    helpfulPct: 87, helpfulCount: 60,
    body: [
      'Some AI capabilities require your approval before they run. We split actions into three risk tiers:',
      '- **Low (auto-allowed)**: read balances, fetch prices, summarize history',
      '- **Medium (PIN required)**: small swaps, set alerts, save addresses',
      '- **High (biometric + confirm)**: send funds, trade above your daily threshold, change security settings',
      'You can review and adjust the per-tool permissions in **AI → Settings → Tools**.',
    ],
  },

  // ───────────────────── OTHER ─────────────────────
  {
    slug: 'how-referrals-work',
    category: 'other',
    title: 'How do referrals work?',
    preview: 'Share your link, earn 20% of trading fees from your referrals for life.',
    readTimeMin: 1,
    helpfulPct: 85, helpfulCount: 240,
    body: [
      'Refer & Earn pays you 20% of every trading fee your referrals generate, forever.',
      '## How',
      '1. Open **Refer & Earn** from Services or Profile.',
      '2. Copy your referral link or QR.',
      '3. Share. When someone signs up via your link, they\'re permanently linked to your account.',
      '## Payouts',
      'Earnings credit weekly to your USDT wallet. No minimum to earn — you can withdraw or trade them like any other balance.',
    ],
  },
  {
    slug: 'how-to-contact-support',
    category: 'other',
    title: 'How do I contact CrymadX support?',
    preview: 'Open a ticket from Help → New Ticket. Average response under 2 hours.',
    readTimeMin: 1,
    helpfulPct: 96, helpfulCount: 720,
    body: [
      'The fastest channel is the in-app ticket system — it includes your account context so we can resolve faster than email.',
      '1. Open **Help Center → New Ticket** (or Services → Help Center).',
      '2. Pick the category that best fits your issue.',
      '3. Write a clear subject and description. Include screenshots, transaction IDs, and any error messages.',
      '4. Submit. We\'ll reply via in-app message **and** email — average response time is under 2 hours during business hours.',
      'Live chat is rolling out gradually — when available, you\'ll see a Live Chat button on the Tickets screen.',
    ],
  },
  {
    slug: 'change-language-currency',
    category: 'other',
    title: 'Change app language or display currency',
    preview: 'Settings → Language for app text. Settings → Display Currency for fiat values.',
    readTimeMin: 1,
    helpfulPct: 86, helpfulCount: 90,
    body: [
      '**Language** — affects every screen of the app. Settings → Language. We support 14 languages including English, Spanish, French, Portuguese, Arabic, Chinese, Japanese, and more.',
      '**Display currency** — affects only how fiat values are shown (e.g. balance card, market caps). Settings → Display Currency. Supports USD, EUR, GBP, NGN, and 30+ others.',
      'Changing display currency does NOT convert your balances — your crypto balances stay in their native asset and just get re-priced for display.',
    ],
  },
  {
    slug: 'delete-account',
    category: 'other',
    title: 'How do I delete my account?',
    preview: 'Withdraw all balances first, then open a deletion ticket. Required AML data is retained 7 years.',
    readTimeMin: 2,
    helpfulPct: 78, helpfulCount: 75,
    body: [
      'Account deletion is irreversible. Here\'s how it works.',
      '## Before you delete',
      '- Withdraw all crypto and fiat balances. We can\'t restore funds after deletion.',
      '- Cancel any active subscriptions (card, premium, etc.).',
      '## Request deletion',
      'Open a support ticket under **Account** category, subject "Delete my account". We confirm with a one-time email link to prevent malicious requests.',
      '## What we keep',
      'AML / KYC regulations require us to retain certain identity and transaction records for 7 years after deletion, even if your profile is removed. After that period, all personal data is permanently purged.',
    ],
  },
]

export const FAQ_CATEGORIES: Array<{ id: FaqCategory; label: string; icon: 'wallet' | 'arrow' | 'swap' | 'shield' | 'user' | 'card' | 'msg' | 'help' }> = [
  { id: 'deposits',    label: 'Deposits',         icon: 'wallet' },
  { id: 'withdrawals', label: 'Withdrawals',      icon: 'arrow' },
  { id: 'trading',     label: 'Trading & Swaps',  icon: 'swap' },
  { id: 'security',    label: 'Security & 2FA',   icon: 'shield' },
  { id: 'kyc',         label: 'KYC & Account',    icon: 'user' },
  { id: 'card',        label: 'Card & Spend',     icon: 'card' },
  { id: 'ai',          label: 'AI Assistant',     icon: 'msg' },
  { id: 'other',       label: 'Other',            icon: 'help' },
]

export function findArticle(slug: string): FaqArticle | undefined {
  return FAQ_ARTICLES.find(a => a.slug === slug)
}

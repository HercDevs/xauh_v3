# XAUH Analytics Dashboard - Project Reference

> **Purpose:** Comprehensive reference document for Claude AI assistants to understand the project architecture, codebase structure, and implementation details.

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Architecture & Data Flow](#architecture--data-flow)
5. [Database Schema](#database-schema)
6. [API Endpoints](#api-endpoints)
7. [Environment Variables](#environment-variables)
8. [Development Workflows](#development-workflows)
9. [Key Implementation Details](#key-implementation-details)

---

## Project Overview

**XAUH Analytics Dashboard** is a full-stack web analytics application tracking the complete conversion funnel from social media engagement to blockchain DEX swaps.

### Core Purpose
Track and visualize the customer journey:
```
Social Media Post → Website Visit → DEX Link Click → Token Swap on Blockchain
```

### Key Metrics
- Social media posts (Twitter/X and Telegram)
- Website visitor sessions with UTM attribution
- DEX clickout events
- On-chain swap transactions
- Conversion rates at each funnel stage
- 30-day trend analysis

---

## Technology Stack

### Frontend
- **Next.js 14** (App Router) - React framework with server/client components
- **React 18** - UI library
- **TypeScript 5.5** - Type safety
- **Tailwind CSS 3.4** - Utility-first styling (custom gold/brown theme)
- **Recharts 2.12** - Data visualization library

### Backend
- **Next.js API Routes** - Serverless functions on Node.js runtime
- **Prisma 5.19** - Type-safe ORM
- **PostgreSQL** - Database (hosted on Neon)

### External Integrations
- **Twitter/X API v2** - Social media post sync
- **Telegram Client API** - Telegram message sync
- **TON Blockchain API** (tonapi.io) - DEX swap transaction data

### Build Tools
- **tsx** - TypeScript execution for scripts
- **PostCSS + Autoprefixer** - CSS processing

---

## Project Structure

```
xauh-dashboard-v2/
├── app/                          # Next.js App Router
│   ├── api/                       # API Routes (serverless functions)
│   │   ├── collect/route.ts       # Web analytics event collection endpoint
│   │   ├── stats/route.ts         # KPI aggregation & conversion rates
│   │   ├── timeseries/route.ts    # 30-day trend data for charts
│   │   └── cron/                  # Scheduled sync jobs
│   │       ├── sync-x/route.ts        # Twitter/X post sync
│   │       ├── sync-telegram/route.ts # Telegram message sync (placeholder)
│   │       └── sync-ton/route.ts      # TON blockchain swap sync
│   ├── layout.tsx                 # Root layout with metadata
│   ├── page.tsx                   # Main dashboard component (client)
│   ├── globals.css                # Global styles + CSS variables
│   └── test/page.tsx              # Tracking pixel test page
│
├── components/                    # Reusable React components (currently empty)
│
├── lib/
│   └── prisma.ts                  # Prisma client singleton (prevents connection pool issues)
│
├── prisma/
│   ├── schema.prisma              # Database models (8 tables)
│   └── seed.ts                    # Demo data seeding script
│
├── scripts/                       # CLI utilities for manual sync
│   ├── sync-x.ts                  # Manual X post sync
│   ├── sync-telegram.ts           # Manual Telegram sync
│   ├── sync-ton.ts                # Manual TON swap sync
│   └── check-ton-token.ts         # Token verification utility
│
├── public/
│   └── pixel.js                   # Client-side tracking pixel JavaScript
│
├── package.json                   # Dependencies & npm scripts
├── tsconfig.json                  # TypeScript config (ES2017, strict mode)
├── tailwind.config.js             # Tailwind customization (gold theme)
├── next.config.js                 # Next.js configuration
├── vercel.json                    # Vercel deployment + cron jobs config
└── .env                           # Environment variables (not in git)
```

### Key Directory Purposes

| Directory | Purpose |
|-----------|---------|
| `app/` | Next.js 14 App Router pages and API routes |
| `app/api/` | RESTful API endpoints (serverless functions) |
| `app/api/cron/` | Scheduled jobs (triggered by Vercel Cron) |
| `lib/` | Shared utilities (Prisma client singleton) |
| `prisma/` | Database schema and migrations |
| `scripts/` | One-off CLI tasks (manual syncs) |
| `public/` | Static assets served directly (tracking pixel) |

---

## Architecture & Data Flow

### System Architecture Pattern
Three-tier architecture with separation of concerns:

```
┌─────────────────────────────────────────────────────────────────┐
│                      DATA SOURCES                                │
├──────────────┬──────────────────────┬───────────────────────────┤
│  Social Media │   Website Visitors   │  Blockchain (TON DEX)    │
│  (X, Telegram)│  (Multiple Domains)  │  (CapitalDEX Pool)       │
└──────┬───────┴──────────┬───────────┴──────────┬────────────────┘
       │                  │                      │
       v                  v                      v
┌──────────────┐  ┌──────────────┐    ┌──────────────────┐
│ Cron API     │  │ Tracking     │    │ Cron API         │
│ sync-x       │  │ Pixel (JS)   │    │ sync-ton         │
│ sync-telegram│  │ /api/collect │    │ (TON API)        │
└──────┬───────┘  └──────┬───────┘    └────────┬─────────┘
       │                 │                     │
       v                 v                     v
┌─────────────────────────────────────────────────────────────────┐
│                    RAW DATA LAYER (Staging)                      │
│  RawXPost | RawTelegramMessage | RawWebEvent | RawSwap          │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       v
┌─────────────────────────────────────────────────────────────────┐
│                 CANONICAL DATA LAYER (Cleaned)                   │
│       Post | Session | Clickout | Swap                           │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       v
┌─────────────────────────────────────────────────────────────────┐
│                   API AGGREGATION LAYER                          │
│       /api/stats (KPIs) | /api/timeseries (Trends)               │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       v
┌─────────────────────────────────────────────────────────────────┐
│                  VISUALIZATION LAYER (React)                     │
│    Dashboard Page | KPI Cards | Funnel | Charts                 │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow Details

#### 1. Social Media Ingestion
- **Trigger:** Vercel Cron (daily at 00:00 UTC) or manual script execution
- **Sources:** Twitter/X API v2, Telegram Client API
- **Process:**
  1. Fetch latest posts/messages (last 100 tweets, recent Telegram messages)
  2. Store raw data in `RawXPost` or `RawTelegramMessage`
  3. Deduplicate by `postId` or `messageId`
  4. Create canonical `Post` record with unified schema
- **Files:** [app/api/cron/sync-x/route.ts](app/api/cron/sync-x/route.ts), [scripts/sync-telegram.ts](scripts/sync-telegram.ts)

#### 2. Website Visitor Tracking
- **Trigger:** JavaScript tracking pixel on page load/click
- **Sources:** Embedded script on multiple Herculis websites
- **Process:**
  1. Browser loads [pixel.js](public/pixel.js)
  2. Generates/retrieves session ID from localStorage (30-min TTL)
  3. Sends events to [/api/collect](app/api/collect/route.ts)
  4. Creates `RawWebEvent` record
  5. Auto-creates `Session` on first page view (with UTM attribution)
  6. Auto-creates `Clickout` on DEX link click
- **Event Types:** `page_view`, `dex_clickout`, `custom`

#### 3. Blockchain Swap Ingestion
- **Trigger:** Vercel Cron (daily at 00:00 UTC) or manual script
- **Source:** TON API (tonapi.io) querying CapitalDEX pool address
- **Process:**
  1. Query pool transactions (limit 100)
  2. Parse transaction messages for in/out amounts
  3. Filter by minimum value (0.01 TON)
  4. Store in `RawSwap` table
  5. Deduplicate by `txHash`
  6. Create canonical `Swap` record
- **File:** [app/api/cron/sync-ton/route.ts](app/api/cron/sync-ton/route.ts)

#### 4. Dashboard Visualization
- **Trigger:** User visits [/](app/page.tsx) (dashboard page)
- **Process:**
  1. Fetch KPIs from [/api/stats](app/api/stats/route.ts)
  2. Fetch 30-day trends from [/api/timeseries](app/api/timeseries/route.ts)
  3. Calculate conversion rates
  4. Render React components with Recharts
- **Update Frequency:** 30 seconds (auto-refresh)

---

## Database Schema

### Raw Data Tables (Staging Layer)

**Purpose:** Immutable copies of external API responses for audit trail and reprocessing

#### `RawXPost`
```prisma
model RawXPost {
  id            String   @id @default(cuid())
  postId        String   @unique              // Twitter post ID
  createdAt     DateTime                       // Post timestamp
  text          String                         // Tweet content
  url           String                         // Permalink
  impressions   Int      @default(0)
  likes         Int      @default(0)
  replies       Int      @default(0)
  reposts       Int      @default(0)
  linkClicks    Int      @default(0)
  fetchedAt     DateTime @default(now())      // Last sync time
}
```

#### `RawTelegramMessage`
```prisma
model RawTelegramMessage {
  id          String   @id @default(cuid())
  messageId   Int      @unique                // Telegram message ID
  postedAt    DateTime
  text        String
  views       Int      @default(0)
  forwards    Int      @default(0)
  fetchedAt   DateTime @default(now())
}
```

#### `RawWebEvent`
```prisma
model RawWebEvent {
  id          String   @id @default(cuid())
  sessionId   String   @@index               // Browser session ID
  eventType   String   @@index               // page_view, dex_clickout, custom
  path        String?                        // URL path
  hostname    String?                        // Landing website domain
  referrer    String?                        // HTTP referrer
  utmSource   String?                        // First-touch attribution
  utmMedium   String?
  utmCampaign String?
  utmContent  String?
  utmTerm     String?
  elementId   String?                        // Clicked element ID (for custom events)
  label       String?                        // Custom event label
  href        String?                        // DEX URL clicked
  createdAt   DateTime @default(now())
}
```

#### `RawSwap`
```prisma
model RawSwap {
  id          String   @id @default(cuid())
  txHash      String   @unique               // Blockchain transaction hash
  wallet      String   @@index               // Wallet address
  side        String                         // "buy" or "sell"
  amountIn    Float                          // TON amount in
  amountOut   Float                          // XAUH token amount out
  tonValueUsd Float                          // USD value at time of swap
  swapAt      DateTime @@index               // Transaction timestamp
  fetchedAt   DateTime @default(now())
}
```

---

### Canonical Data Tables (Cleaned/Analytical Layer)

**Purpose:** Unified, deduplicated, and normalized data for querying and reporting

#### `Post`
```prisma
model Post {
  id          String   @id @default(cuid())
  channel     String   @@index               // "X" or "TG"
  externalId  String   @unique               // postId or "tg_{messageId}"
  postedAt    DateTime @@index
  permalink   String
  text        String
}
```

#### `Session`
```prisma
model Session {
  id                String     @id @default(cuid())
  sessionId         String     @unique         // Browser-generated session ID
  firstUtmSource    String?
  firstUtmMedium    String?
  firstUtmCampaign  String?
  firstUtmContent   String?
  firstUtmTerm      String?
  firstReferrer     String?
  firstLandingPath  String?
  firstLandingAt    DateTime
  clickouts         Clickout[]                // One-to-many relation
}
```

#### `Clickout`
```prisma
model Clickout {
  id          String   @id @default(cuid())
  clickId     String   @unique
  sessionId   String   @@index
  dest        String                          // DEX URL clicked
  utmSource   String?
  utmMedium   String?
  utmCampaign String?
  createdAt   DateTime @@index
  session     Session  @relation(fields: [sessionId], references: [sessionId])
}
```

#### `Swap`
```prisma
model Swap {
  id          String   @id @default(cuid())
  txHash      String   @unique
  wallet      String   @@index
  side        String                          // "buy" or "sell"
  amountIn    Float
  amountOut   Float
  tonValueUsd Float
  swapAt      DateTime @@index
}
```

### Database Design Decisions

1. **Two-Tier Schema:** Raw tables preserve original API responses; canonical tables provide clean analytical views
2. **CUID Primary Keys:** Better distribution in serverless environments vs. sequential IDs
3. **Strategic Indexes:** Applied to frequently filtered columns (`sessionId`, `wallet`, `swapAt`, `postedAt`, `eventType`)
4. **Immutable Raw Data:** Raw tables are append-only for audit trail
5. **Deduplication:** Unique constraints on external IDs (`postId`, `txHash`, `sessionId`)

---

## API Endpoints

### Data Collection

#### `POST /api/collect`
Receives web analytics events from tracking pixel.

**Authentication:** None (open CORS for cross-domain tracking)

**Request Body:**
```json
{
  "sessionId": "abc123",
  "eventType": "page_view" | "dex_clickout" | "custom",
  "path": "/",
  "hostname": "herculis.io",
  "referrer": "https://twitter.com",
  "utmSource": "twitter",
  "utmMedium": "social",
  "utmCampaign": "launch",
  "utmContent": "post1",
  "utmTerm": "crypto",
  "href": "https://capitaldex.io/swap/XAUH" // for dex_clickout
}
```

**Response:**
```json
{ "success": true }
```

**Side Effects:**
- Creates `RawWebEvent` record
- Auto-creates `Session` if new (on first page_view)
- Auto-creates `Clickout` if dex_clickout event

**File:** [app/api/collect/route.ts](app/api/collect/route.ts)

---

### Data Retrieval

#### `GET /api/stats`
Returns aggregated KPIs and conversion rates.

**Authentication:** None

**Response:**
```json
{
  "posts": 45,
  "sessions": 1234,
  "clickouts": 89,
  "swaps": 12,
  "totalVolumeUsd": 5432.10,
  "totalCoinsOut": 123456.78,
  "conversionRates": {
    "sessionToClickout": 7.21,
    "clickoutToSwap": 13.48,
    "endToEnd": 0.97
  },
  "sessionsByWebsite": [
    { "website": "herculis.io", "count": 567 },
    { "website": "xauh.com", "count": 234 }
  ]
}
```

**Calculations:**
- `sessionToClickout = (clickouts / sessions) * 100`
- `clickoutToSwap = (swaps / clickouts) * 100`
- `endToEnd = (swaps / sessions) * 100`

**File:** [app/api/stats/route.ts](app/api/stats/route.ts)

---

#### `GET /api/timeseries`
Returns 30-day trend data for charting.

**Authentication:** None

**Response:**
```json
[
  {
    "date": "2025-11-01",
    "posts": 2,
    "sessions": 45,
    "clickouts": 3,
    "swaps": 0,
    "volume": 0
  },
  {
    "date": "2025-11-02",
    "posts": 1,
    "sessions": 52,
    "clickouts": 4,
    "swaps": 1,
    "volume": 234.56
  }
  // ... 28 more days
]
```

**File:** [app/api/timeseries/route.ts](app/api/timeseries/route.ts)

---

### Scheduled Data Sync (Cron Jobs)

All cron endpoints require Bearer token authentication:
```
Authorization: Bearer {CRON_SECRET}
```

#### `GET /api/cron/sync-x`
Syncs latest Twitter/X posts.

**Trigger:** Vercel Cron (daily at 00:00 UTC) or manual

**Process:**
1. Get user ID from `X_USERNAME` via Twitter API
2. Fetch last 100 tweets with metrics
3. Upsert to `RawXPost` (update if exists, insert if new)
4. Create canonical `Post` record

**Response:**
```json
{
  "success": true,
  "newTweets": 5,
  "updatedTweets": 95,
  "totalProcessed": 100
}
```

**File:** [app/api/cron/sync-x/route.ts](app/api/cron/sync-x/route.ts)

---

#### `GET /api/cron/sync-telegram`
Syncs latest Telegram messages (placeholder).

**Status:** Not implemented (returns placeholder data)

**Reason:** Telegram Client API requires persistent session, incompatible with serverless functions

**Alternative:** Use manual script: `npx tsx scripts/sync-telegram.ts`

**File:** [app/api/cron/sync-telegram/route.ts](app/api/cron/sync-telegram/route.ts)

---

#### `GET /api/cron/sync-ton`
Syncs latest DEX swaps from TON blockchain.

**Trigger:** Vercel Cron (daily at 00:00 UTC) or manual

**Process:**
1. Query TON API for transactions on CapitalDEX pool address
2. Parse transaction messages for in/out amounts
3. Filter swaps with value >= 0.01 TON
4. Create `RawSwap` and `Swap` records
5. Deduplicate by `txHash`

**Response:**
```json
{
  "success": true,
  "newSwaps": 3,
  "skippedSwaps": 97,
  "totalProcessed": 100
}
```

**File:** [app/api/cron/sync-ton/route.ts](app/api/cron/sync-ton/route.ts)

---

## Environment Variables

**Required Configuration (`.env` file):**

```bash
# Database Connection
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require

# Twitter/X API (v2)
X_BEARER_TOKEN=AAAAAAAAAAAAAAAAAAAAAxxxxx
X_USERNAME=herculis_network

# Telegram Client API
TELEGRAM_API_ID=12345678
TELEGRAM_API_HASH=abcdef1234567890abcdef1234567890
TELEGRAM_CHANNEL=herculis_chat

# TON Blockchain API
TON_API_KEY=AExxxxxxxxxxxxxxxxxxxxx
XAUH_TOKEN_ADDRESS=EQC...xyz
CAPITALDEX_POOL_ADDRESS=EQD...abc

# Cron Job Authentication
CRON_SECRET=your-secure-random-string-here
```

### Variable Descriptions

| Variable | Purpose | Where Used |
|----------|---------|------------|
| `DATABASE_URL` | PostgreSQL connection string (Neon) | Prisma client |
| `X_BEARER_TOKEN` | Twitter API authentication | sync-x cron |
| `X_USERNAME` | Twitter handle to sync | sync-x cron |
| `TELEGRAM_API_ID` | Telegram app ID | sync-telegram script |
| `TELEGRAM_API_HASH` | Telegram app secret | sync-telegram script |
| `TELEGRAM_CHANNEL` | Telegram channel username | sync-telegram script |
| `TON_API_KEY` | TON API authentication | sync-ton cron |
| `XAUH_TOKEN_ADDRESS` | Token contract address | Token verification |
| `CAPITALDEX_POOL_ADDRESS` | DEX pool to query | sync-ton cron |
| `CRON_SECRET` | Protects cron endpoints | All /api/cron/* routes |

---

## Development Workflows

### Local Development

```bash
# Install dependencies
npm install

# Start development server (http://localhost:3000)
npm run dev

# Database operations
npm run db:push        # Apply schema changes to database
npm run db:seed        # Seed demo data for testing

# Manual sync scripts
npx tsx scripts/sync-x.ts           # Sync X posts
npx tsx scripts/sync-telegram.ts    # Sync Telegram messages
npx tsx scripts/sync-ton.ts         # Sync TON swaps
npx tsx scripts/check-ton-token.ts  # Verify token address
```

### Testing

**Tracking Pixel Test Page:**
- Navigate to [http://localhost:3000/test](http://localhost:3000/test)
- Click DEX links (CapitalDEX, DeDust, Ston.fi)
- Open browser DevTools Network tab
- Verify POST requests to `/api/collect`

**Manual Cron Testing:**
```bash
# Test X sync
curl -X GET http://localhost:3000/api/cron/sync-x \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# Test TON sync
curl -X GET http://localhost:3000/api/cron/sync-ton \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Production Deployment (Vercel)

**Automatic Deployment:**
- Push to `main` branch triggers build
- Environment variables set in Vercel dashboard
- Cron jobs configured via [vercel.json](vercel.json)

**Vercel Cron Configuration:**
```json
{
  "crons": [
    {
      "path": "/api/cron/sync-x",
      "schedule": "0 0 * * *"
    },
    {
      "path": "/api/cron/sync-ton",
      "schedule": "0 0 * * *"
    }
  ]
}
```

**Cron Schedule:** `0 0 * * *` = Daily at 00:00 UTC (midnight)

---

## Key Implementation Details

### Prisma Client Singleton Pattern

**Problem:** Serverless functions create new database connections on every invocation, leading to connection pool exhaustion.

**Solution:** [lib/prisma.ts](lib/prisma.ts) uses a singleton pattern to reuse connections across hot starts:

```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

**Usage:** Always import from `@/lib/prisma` instead of creating new `PrismaClient()` instances.

---

### Tracking Pixel Design

**File:** [public/pixel.js](public/pixel.js)

**Key Features:**
1. **Cross-Domain Support:** Works on any website via script embed
2. **Session Persistence:** 30-minute TTL in localStorage
3. **Auto-Detection:** Derives API endpoint from script `src` attribute
4. **Automatic Tracking:**
   - Page views on load
   - DEX link clicks (href contains "dex", "swap", "trade", "capital", "dedust", "ston")
5. **Manual Tracking:** Exposes `window.xauhTrack(eventType, properties)`

**Embed Code:**
```html
<script src="https://your-domain.com/pixel.js"></script>
```

**Manual Event Example:**
```javascript
window.xauhTrack('custom', {
  label: 'whitepaper_download',
  href: '/whitepaper.pdf'
})
```

---

### CORS Configuration

**Why Open CORS on /api/collect?**
- Tracking pixel embeds on multiple external domains (herculis.io, xauh.com, etc.)
- Needs to send POST requests cross-origin
- No sensitive data exposed (write-only endpoint)

**Implementation:**
```typescript
return new Response(JSON.stringify({ success: true }), {
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  },
})
```

---

### Time Series Data Generation

**Challenge:** Missing dates should show as 0 in charts, not gaps.

**Solution:** [app/api/timeseries/route.ts](app/api/timeseries/route.ts) pre-generates 30 empty date entries, then fills with actual data:

```typescript
const last30Days = Array.from({ length: 30 }, (_, i) => {
  const date = new Date()
  date.setDate(date.getDate() - (29 - i))
  return date.toISOString().split('T')[0]
})

// ... fetch and group by date ...

return last30Days.map(date => ({
  date,
  posts: aggregatedData[date]?.posts || 0,
  sessions: aggregatedData[date]?.sessions || 0,
  // ...
}))
```

---

### Deduplication Strategy

**Social Media Posts:**
- **Key:** `postId` (X) or `messageId` (Telegram)
- **Method:** Prisma `upsert` (update if exists, create if new)
- **Why:** Metrics update over time (impressions, likes increase)

**Web Events:**
- **No Deduplication:** All events stored (intentional for analytics)
- **Session Deduplication:** Only one `Session` per `sessionId`

**Swaps:**
- **Key:** `txHash` (blockchain transaction hash)
- **Method:** Check existence before insert, skip if exists
- **Why:** Blockchain data is immutable

---

### Dashboard Auto-Refresh

**Implementation:** [app/page.tsx](app/page.tsx) uses `useEffect` with 30-second interval:

```typescript
useEffect(() => {
  fetchData()
  const interval = setInterval(fetchData, 30000) // 30 seconds
  return () => clearInterval(interval)
}, [])
```

**Why 30 seconds?**
- Balance between real-time updates and API rate limits
- Dashboard is internal tool (low concurrent user count)

---

### Custom Tailwind Theme

**File:** [tailwind.config.js](tailwind.config.js)

**Brand Colors (Gold/Brown Luxury Aesthetic):**
```javascript
colors: {
  border: "hsl(var(--border))",
  background: "hsl(var(--background))",
  foreground: "hsl(var(--foreground))",
  primary: {
    DEFAULT: "hsl(var(--primary))",
    foreground: "hsl(var(--primary-foreground))",
  },
  // ... custom gold/brown shades defined in globals.css
}
```

**CSS Variables:** [app/globals.css](app/globals.css) defines HSL color values for dynamic theming.

---

### Current State & Known Limitations

**Fully Functional:**
- Twitter/X post sync (cron + manual)
- TON blockchain swap sync (cron + manual)
- Web event collection and session tracking
- Dashboard visualization with Recharts
- Conversion funnel calculation
- 30-day trend analysis

**Placeholders/Incomplete:**
- Telegram sync returns mock data (use manual script: `npx tsx scripts/sync-telegram.ts`)
- Reason: Telegram Client API requires persistent session, incompatible with Vercel serverless

**Recent Work (from git history):**
- Vercel cron job policy investigation (5th most recent commit)
- Hostname tracking for multi-website session categorization
- CORS header fixes for cross-domain tracking

---

## Common Tasks Reference

### Adding a New Social Media Source

1. Create API sync script in `scripts/sync-{platform}.ts`
2. Define raw table in [prisma/schema.prisma](prisma/schema.prisma):
   ```prisma
   model Raw{Platform}Post {
     id        String @id @default(cuid())
     postId    String @unique
     // ... platform-specific fields
     fetchedAt DateTime @default(now())
   }
   ```
3. Update canonical `Post` model if needed
4. Add cron route in `app/api/cron/sync-{platform}/route.ts`
5. Add to [vercel.json](vercel.json) cron schedule
6. Update [app/api/stats/route.ts](app/api/stats/route.ts) to aggregate new posts

### Adding a New Event Type

1. Update [public/pixel.js](public/pixel.js) to track new event
2. Add event type to `RawWebEvent.eventType` (no schema change needed)
3. Update [app/api/collect/route.ts](app/api/collect/route.ts) to handle event
4. Create canonical table if needed (e.g., `Signup`, `Download`)
5. Update dashboard to display new metric

### Modifying Dashboard Visualizations

1. Edit [app/page.tsx](app/page.tsx) React components
2. Modify Recharts configuration for chart styling
3. Update [app/api/stats/route.ts](app/api/stats/route.ts) for new KPIs
4. Update [app/api/timeseries/route.ts](app/api/timeseries/route.ts) for trend data

---

## Support & Resources

**Documentation:**
- Next.js: https://nextjs.org/docs
- Prisma: https://www.prisma.io/docs
- Tailwind CSS: https://tailwindcss.com/docs
- Recharts: https://recharts.org/en-US

**External APIs:**
- Twitter API: https://developer.twitter.com/en/docs
- Telegram API: https://core.telegram.org/api
- TON API: https://tonapi.io/docs

**Git Repository:**
- Current branch: `main`
- Recent commits focus on Vercel deployment and CORS fixes

---

## Quick Reference Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Production build
npm run start            # Start production server

# Database
npm run db:push          # Apply schema changes
npm run db:seed          # Seed demo data
npx prisma studio        # Open Prisma Studio (GUI)

# Manual Syncs
npx tsx scripts/sync-x.ts           # Sync Twitter
npx tsx scripts/sync-telegram.ts    # Sync Telegram
npx tsx scripts/sync-ton.ts         # Sync TON swaps

# Testing
curl http://localhost:3000/api/stats              # Test stats API
curl http://localhost:3000/api/timeseries         # Test timeseries API
curl -X POST http://localhost:3000/api/collect \  # Test event collection
  -H "Content-Type: application/json" \
  -d '{"sessionId":"test","eventType":"page_view","path":"/"}'
```

---

**Last Updated:** 2025-11-27
**Project Status:** Production (deployed on Vercel)
**Database:** PostgreSQL on Neon
**Primary Branch:** main

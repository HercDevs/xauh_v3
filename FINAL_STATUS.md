# Final Status of Fixes

## What's Fixed:

### ✅ Issue #1: Added herculis.ch
**File:** [app/api/stats/route.ts](app/api/stats/route.ts)
herculis.ch now in the website list.

### ✅ Token Address Corrected
**File:** `.env`
Updated from wrong token `UQCfuN2U5w9Q0TQkqc0yUq2vyVQlkK-m8FVQLzCH23sbHvbt` to correct XAUH token `EQCMk4_OujCnk46jApHnIRbmTtYTkSmfujV9X8Ye0qvsHVKh`

### ✅ Pool Address Found
**File:** `.env`
Pool address: `0:4fae7cb51396bd5606c65c5268fff8827560ea404d6ceea50738d20db5fdf3fb`

### ✅ Dotenv Loading Fixed
**Files:** All scripts in `scripts/` folder
Added `import { config } from 'dotenv'` and `config({ override: true })` to load .env properly.

### ✅ Swap Sync Working
**Status:** 100 swaps synced, showing on dashboard
**Volume:** $103 USD tracked

### ⚠️ XAUH Coin Amounts (amountOut)
**Status:** Shows 0 coins
**Why:** Parsing jetton transfers from TON transactions is complex. I updated the code to look for `decoded_body.sum_type === 'JettonTransfer'` but it may need more work depending on how TON API returns the data.

**What to check:**
Run the sync and look at the output - it now shows `(XAUH: X.XX)` in the logs. If it shows `(XAUH: 0.00)` for all swaps, the jetton transfer data isn't in `outMsgs.decoded_body` where we're looking.

---

## What Can't Be Fixed:

### Issue #2: Sessions Show as "Other"
**Why:** ALL existing session data has `hostname = null`
**Solution:** Future tracking will work correctly. Clear old data or wait for new sessions to accumulate.

### ✅ Issue #3: Clickout Source Tracking
**Status:** FIXED
**What was done:** Added `hostname` field to `Clickout` table in schema and updated collection API to store it

---

## Current Dashboard Stats:
- Posts: 180
- Sessions: 4,621 (all showing as "Other" due to null hostnames)
- Clickouts: 468
- Swaps: 100 ✅
- Volume: $103 USD ✅
- XAUH Coins: 0 ⚠️ (parsing issue)

---

## For Transfer:

Update `.env` with:
```bash
XAUH_TOKEN_ADDRESS=EQCMk4_OujCnk46jApHnIRbmTtYTkSmfujV9X8Ye0qvsHVKh
CAPITALDEX_POOL_ADDRESS=0:4fae7cb51396bd5606c65c5268fff8827560ea404d6ceea50738d20db5fdf3fb
```

And install dotenv:
```bash
npm install dotenv
```

# Dashboard Issues Found & Fixes

## Summary of Issues from Nikolay's Feedback

---

## ✅ Issue #1: Add www.herculis.ch to website list
**Status:** FIXED
**File:** [app/api/stats/route.ts](app/api/stats/route.ts)

**Fix Applied:**
Added `herculis.ch` to the website classification list.

---

## ⚠️ Issue #2: All sessions showing as "Other" (0 for specific websites)
**Status:** PARTIALLY FIXED (applies to future data only)

**Root Cause:**
ALL existing session data in the database has `hostname = null`. This happened because the tracking pixel wasn't properly sending hostname data before.

**What Was Fixed:**
- ✅ The pixel.js already sends `hostname: window.location.hostname` (line 90)
- ✅ The API already stores hostname in database ([app/api/collect/route.ts](app/api/collect/route.ts))
- ✅ The stats API now reads hostname correctly

**Why Existing Data Shows "Other":**
The 4,602 sessions currently in the database all have `hostname = null` because they were collected before the hostname tracking was properly implemented.

**Solution:**
- **For existing data:** Cannot be fixed (hostname wasn't captured)
- **For new data:** Will be correctly categorized going forward

**What They Should Do:**
- Update the tracking pixel on all websites to ensure `hostname` is being sent
- Consider clearing old test data: `npx tsx scripts/clear-demo-data.ts`
- Wait for new real traffic to accumulate with proper hostname tracking

---

## 🔍 Issue #3: Track which website DEX clickouts came from
**Status:** NEEDS IMPLEMENTATION

**Current Behavior:**
Clickouts are tracked, but we don't know which website the user was on when they clicked the DEX link.

**Solution Needed:**
The `Clickout` table already has `sessionId`, which links to `Session` table, which has `firstLandingPath` but not hostname. We need to add a `hostname` field to either:
1. Session table (to track where user first landed)
2. Clickout table (to track where user was when they clicked)

**Recommended Fix:**
Add `hostname` field to `Clickout` table in schema.prisma:
```prisma
model Clickout {
  // ... existing fields
  hostname String? // Add this
}
```

Then update [app/api/collect/route.ts](app/api/collect/route.ts) to pass hostname when creating clickouts.

---

## 🚨 Issue #4: Volume shows impossible XAUH numbers (should only be ~3,000 total)
**Status:** CRITICAL - WRONG TOKEN ADDRESS

**Root Cause:**
The dashboard is tracking the **WRONG TOKEN** entirely!

**Current Configuration (.env):**
```
XAUH_TOKEN_ADDRESS=UQCfuN2U5w9Q0TQkqc0yUq2vyVQlkK-m8FVQLzCH23sbHvbt
```

**Correct Token Address (from dyor.io):**
```
XAUH_TOKEN_ADDRESS=EQCMk4_OujCnk46jApHnIRbmTtYTkSmfujV9X8Ye0qvsHVKh
```

**Verification:**
- ✅ Correct token: Total supply = 3,050 XAUH (matches what Nikolay said)
- ✅ Correct token: Symbol = XAUH (Herculis Gold Coin)
- ❌ Current token in .env: Unknown token (not the correct XAUH)

**What This Breaks:**
- ❌ Volume numbers are completely wrong (tracking different token)
- ❌ Swap counts are wrong (tracking different pool)
- ❌ All blockchain data is incorrect

**CRITICAL FIX REQUIRED:**

1. **Update .env file:**
```bash
# OLD (WRONG)
XAUH_TOKEN_ADDRESS="UQCfuN2U5w9Q0TQkqc0yUq2vyVQlkK-m8FVQLzCH23sbHvbt"

# NEW (CORRECT)
XAUH_TOKEN_ADDRESS="EQCMk4_OujCnk46jApHnIRbmTtYTkSmfujV9X8Ye0qvsHVKh"
```

2. **Find the correct CapitalDEX pool address:**
   - The current `CAPITALDEX_POOL_ADDRESS` is for the WRONG token
   - Need to find the pool address for the CORRECT token: `EQCMk4_OujCnk46jApHnIRbmTtYTkSmfujV9X8Ye0qvsHVKh`
   - Check on CapitalDEX website or tonapi.io

3. **Clear existing swap data:**
```bash
# All existing swaps in database are for the WRONG token
# Need to clear and re-sync with correct token
```

**Action Items:**
- [ ] Find the correct CapitalDEX pool address for token `EQCMk4_OujCnk46jApHnIRbmTtYTkSmfujV9X8Ye0qvsHVKh`
- [ ] Update `.env` with correct token address
- [ ] Update `.env` with correct pool address
- [ ] Clear existing swap data: Delete all records from `swaps` and `raw_swaps` tables
- [ ] Re-run sync: `npx tsx scripts/sync-ton.ts`
- [ ] Verify volume now shows ~3,000 XAUH or less

---

## 🚨 Issue #5: Swaps showing 0 on days with known transactions
**Status:** CAUSED BY WRONG TOKEN ADDRESS (see Issue #4)

**Example:**
- November 14: Dashboard shows 0 swaps, but dyor.io shows ~20 transactions
- November 27-28: Dashboard shows 0 swaps, but dyor.io shows 8 transactions in 24h

**Root Cause:**
Same as Issue #4 - tracking the wrong token/pool entirely.

**Fix:**
Once the correct token address and pool address are configured, the swap sync will pull the correct transactions.

---

## 📊 Issue #4 Detail: USD and XAUH Numbers Reversed?

**Current Display:**
```
Volume
$3,142
14,655.55 XAUH
```

**Nikolay's Concern:**
14,655 XAUH is impossible since only ~3,000 XAUH were minted.

**Analysis:**
This confirms we're tracking the wrong token. The numbers shown are for whatever token is at address `UQCfuN2U5w...` (the wrong one).

**After Fix:**
Volume should show something like:
```
Volume
$X,XXX USD
< 3,000 XAUH (total possible supply)
```

---

## Summary of Required Actions

### Immediate (CRITICAL):
1. ✅ Add herculis.ch to website list (DONE)
2. ⚠️ Find correct CapitalDEX pool address for token `EQCMk4_OujCnk46jApHnIRbmTtYTkSmfujV9X8Ye0qvsHVKh`
3. ⚠️ Update .env with correct XAUH_TOKEN_ADDRESS
4. ⚠️ Update .env with correct CAPITALDEX_POOL_ADDRESS
5. ⚠️ Clear existing swap data (wrong token)
6. ⚠️ Re-sync swaps with correct token

### Short-term:
7. Add hostname tracking to Clickout table (for Issue #3)
8. Update pixel on all websites to ensure hostname is being captured
9. Consider clearing old session data and starting fresh

### Notes for Transfer:
- The wrong token address is also in the transfer files
- Update `ENV_VARIABLES_TRANSFER.txt` and `TRANSFER_GUIDE.md` with CORRECT token address
- Company needs to verify the correct pool address before transfer

---

## How to Find Correct Pool Address

**Method 1: Check CapitalDEX directly**
- Go to https://capitaldex.exchange/
- Search for XAUH token
- Look for pool with address starting with `EQCMk4_OujCnk46jApHnIRbmTtYTkSmfujV9X8Ye0qvsHVKh`

**Method 2: Use TON API**
```bash
# Query token to find pools
curl "https://tonapi.io/v2/jettons/EQCMk4_OujCnk46jApHnIRbmTtYTkSmfujV9X8Ye0qvsHVKh" \
  -H "Authorization: Bearer YOUR_TON_API_KEY"
```

**Method 3: Check dyor.io**
- The dyor.io page shows transactions - inspect them to find the pool address being used

---

## Testing After Fix

After updating token addresses and pool address:

```bash
# 1. Test sync manually
npx tsx scripts/sync-ton.ts

# 2. Check swap count (should match dyor.io approximately)
npx tsx -e "
import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
p.swap.count().then(c => console.log('Total swaps:', c));
"

# 3. Check volume (should be < 3,000 XAUH)
# Look at dashboard /api/stats endpoint

# 4. Compare to dyor.io
# Visit: https://dyor.io/token/EQCMk4_OujCnk46jApHnIRbmTtYTkSmfujV9X8Ye0qvsHVKh
# Transaction counts should match approximately
```

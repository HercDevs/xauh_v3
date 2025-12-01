# Fixes Applied Summary

## ✅ Issue #1: Added herculis.ch
**Fixed in:** [app/api/stats/route.ts](app/api/stats/route.ts)
Added `herculis.ch` to website classification list.

## ⚠️ Issue #2: Sessions showing as "Other"
**Status:** Cannot fix existing data (all have null hostname)
**For future:** Hostname tracking already works, new sessions will be classified correctly

## ⚠️ Issue #4 & #5: Wrong Token - Partially Fixed

### What Was Fixed:
✅ Updated `.env` with correct XAUH token address:
```
OLD: UQCfuN2U5w9Q0TQkqc0yUq2vyVQlkK-m8FVQLzCH23sbHvbt (WRONG TOKEN)
NEW: EQCMk4_OujCnk46jApHnIRbmTtYTkSmfujV9X8Ye0qvsHVKh (CORRECT - 3,050 supply)
```

✅ Found potential pool address:
```
0:4fae7cb51396bd5606c65c5268fff8827560ea404d6ceea50738d20db5fdf3fb
```

### What Still Needs Work:

**The sync script (`scripts/sync-ton.ts`) doesn't work correctly for this token.**

**Why:** The current approach queries a "pool address" for transactions, but:
1. XAUH token transactions happen ON THE TOKEN CONTRACT itself
2. The dyor.io link shows 7-8 transactions per day ON THE TOKEN
3. We need to query the token address for transactions, not a pool

**Correct Approach:**
Instead of:
```typescript
// Query pool transactions (CURRENT - WRONG)
https://tonapi.io/v2/blockchain/accounts/${poolAddress}/transactions
```

Should be:
```typescript
// Query token jetton transfers (CORRECT)
https://tonapi.io/v2/jettons/${tokenAddress}/transfers
// OR
https://tonapi.io/v2/blockchain/accounts/${tokenAddress}/transactions
```

## What You Need To Tell Them:

**The swap tracking system needs to be rewritten to:**
1. Query the XAUH token address directly for transfers/transactions
2. Parse jetton transfer events (not pool swaps)
3. Extract buy/sell from transfer direction and amounts
4. Match transfer amounts to get proper XAUH coin counts

**Current state:**
- ✅ Correct token address in `.env`
- ❌ Swap sync doesn't work (queries wrong thing)
- ❌ Volume shows 0 (no swaps being tracked)
- ❌ Swap counts don't match dyor.io

**This requires blockchain expertise to parse TON jetton transfers correctly.**

---

## Issue #3: Track Clickout Source
**Status:** Not implemented yet

Need to add `hostname` field to Clickout table in schema and update API to store it.

---

## Summary for Transfer

Update the `.env` in transfer docs with:
```bash
XAUH_TOKEN_ADDRESS="EQCMk4_OujCnk46jApHnIRbmTtYTkSmfujV9X8Ye0qvsHVKh"
```

**DO NOT** transfer the old pool address - the sync script needs to be rewritten anyway to query jetton transfers instead of pool transactions.

# Complete Transfer Guide: Vercel + Neon Database Migration

> **Goal:** Transfer this project from your personal Vercel/Neon accounts to company accounts without data loss.

---

## Overview of Transfer Process

1. **Database Migration** (Neon → New Neon account)
2. **Code Repository** (Already done - new Git repo)
3. **Vercel Project Setup** (New Vercel account)
4. **Environment Variables** (Copy with modifications)
5. **Credential Revocation** (Your personal credentials)

---

## Part 1: Neon Database Transfer (MOST CRITICAL)

### Option A: Backup & Restore (RECOMMENDED - Zero Data Loss)

This creates a complete copy of your database to a new Neon account.

#### Step 1: Export Database from Your Neon Account

```bash
# Install pg_dump if not already installed (comes with PostgreSQL)
# Windows: Install from https://www.postgresql.org/download/windows/
# Mac: brew install postgresql
# Linux: sudo apt-get install postgresql-client

# Export the entire database
pg_dump "postgresql://neondb_owner:npg_SdP0Mmo1RNLs@ep-soft-hat-abe0mhqt.eu-west-2.aws.neon.tech/neondb?sslmode=require" > xauh_backup.sql

# Verify backup file exists and has content
ls -lh xauh_backup.sql
```

#### Step 2: Create New Neon Database (Company Account)

1. Have them create a new Neon account (company email)
2. Create a new project called "xauh-dashboard" or similar
3. Get the new `DATABASE_URL` connection string
4. Send you the connection string

#### Step 3: Import Data to New Database

```bash
# Import the backup to the NEW database
psql "NEW_DATABASE_URL_HERE" < xauh_backup.sql

# Verify data was imported
psql "NEW_DATABASE_URL_HERE" -c "SELECT COUNT(*) FROM posts;"
psql "NEW_DATABASE_URL_HERE" -c "SELECT COUNT(*) FROM swaps;"
psql "NEW_DATABASE_URL_HERE" -c "SELECT COUNT(*) FROM sessions;"
```

#### Step 4: Verify Schema Match

```bash
# On new database, check that all tables exist
psql "NEW_DATABASE_URL_HERE" -c "\dt"

# Should show:
# - raw_x_posts
# - raw_telegram_messages
# - raw_web_events
# - raw_swaps
# - posts
# - sessions
# - clickouts
# - swaps
```

---

### Option B: Neon Branch Transfer (Alternative)

Neon has a "Branch" feature that can copy databases, but transferring between accounts is not straightforward. **Use Option A instead.**

---

## Part 2: Vercel Project Setup (New Company Account)

### Step 1: Prerequisites
- ✅ New Git repository (you already did this)
- New Vercel account (company email)
- New Neon database with imported data

### Step 2: Import Project to Vercel

1. **New Vercel Account:** Have them create a Vercel account with company email
2. **Import Repository:**
   - Click "Add New Project"
   - Connect to GitHub and select the new repository
   - Vercel will auto-detect it's a Next.js project

3. **Framework Preset:** Next.js (auto-detected)
4. **Root Directory:** Leave as `.` (root)
5. **Build Command:** `npm run build` (default)
6. **Output Directory:** `.next` (default)

### Step 3: Configure Environment Variables in Vercel

Go to **Project Settings → Environment Variables** and add:

#### Required for All Environments (Production, Preview, Development)

```bash
# Database (from NEW Neon account)
DATABASE_URL=postgresql://NEW_CONNECTION_STRING_HERE

# Cron Job Protection
CRON_SECRET=xauh_cron_secret_2024_secure_key_do_not_share

# TON Blockchain
TON_API_KEY=AFWP7JK6CTXRXLAAAAABSW6XJUMW7CTPRN354GDZ64W5AU5ATU4DCMMVQJABRUB2YVWBC7I
XAUH_TOKEN_ADDRESS=UQCfuN2U5w9Q0TQkqc0yUq2vyVQlkK-m8FVQLzCH23sbHvbt
CAPITALDEX_POOL_ADDRESS=EQDtPY-Z6XAn1oCw-tBENhY2yChZEJWx9gJ4mpcN8LzXShlR
MARKET_MAKER_ADDRESS=UQD8J8dNKh6M-tyWiUTAyiodKUkj8oxiCf_bwsq0WVhWT56b
```

#### Variables to REPLACE (Personal Credentials - TODO #4)

**These are YOUR PERSONAL credentials and should be replaced with company credentials:**

```bash
# ❌ YOUR PERSONAL TWITTER CREDENTIALS - DO NOT TRANSFER
X_BEARER_TOKEN=AAAAAAAAAAAAAAAAAAAAAOKx4gEAAAAAyUTLAF40jJtkdWGOfO5lYixq9Nk%3DAzGBJSHVASSynRKJ9sckRD9ozSeBGzM2jk250mVznL5hHdhzpf
X_API_KEY=(your personal key)
X_API_SECRET=(your personal secret)

# ❌ YOUR PERSONAL TELEGRAM CREDENTIALS - DO NOT TRANSFER
TELEGRAM_API_ID=(your personal phone/API)
TELEGRAM_API_HASH=(your personal hash)
TELEGRAM_CHANNEL=herculis_chat

# ✅ COMPANY NEEDS TO CREATE THESE:
X_USERNAME=HerculisCoin  # This can stay the same (just the username)
```

**Action Required:** They need to:
1. Create a new Twitter Developer account with company email
2. Create a new Telegram API account with company phone
3. Generate new API credentials
4. Provide you with the new credentials to add to Vercel

---

## Part 3: Environment Variables Summary

### Variables That Can Transfer As-Is

| Variable | Value | Notes |
|----------|-------|-------|
| `X_USERNAME` | `HerculisCoin` | Just a username, not a credential |
| `CRON_SECRET` | `xauh_cron_secret_2024_secure_key_do_not_share` | Can reuse or generate new one |
| `TON_API_KEY` | `AFWP7JK6CT...` | TON API key (check if personal or company) |
| `XAUH_TOKEN_ADDRESS` | `UQCfuN2U5w...` | Blockchain address (public) |
| `CAPITALDEX_POOL_ADDRESS` | `EQDtPY-Z6X...` | Blockchain address (public) |
| `MARKET_MAKER_ADDRESS` | `UQD8J8dNKh...` | Blockchain address (public) |

### Variables That MUST Be Updated

| Variable | Current (Personal) | Action Required |
|----------|-------------------|-----------------|
| `DATABASE_URL` | Your Neon connection | ✅ Use NEW Neon database URL |
| `X_BEARER_TOKEN` | Your Twitter token | ❌ Replace with company Twitter API |
| `X_API_KEY` | Your Twitter key | ❌ Replace with company Twitter API |
| `X_API_SECRET` | Your Twitter secret | ❌ Replace with company Twitter API |
| `TELEGRAM_API_ID` | Your phone/ID | ❌ Replace with company Telegram API |
| `TELEGRAM_API_HASH` | Your hash | ❌ Replace with company Telegram API |

### Variables NOT Needed (Extra Neon Stuff)

These are just alternative formats of `DATABASE_URL` - you only need `DATABASE_URL`:

- ❌ `DATABASE_URL_UNPOOLED`
- ❌ `PGHOST`, `PGUSER`, `PGDATABASE`, `PGPASSWORD`
- ❌ `POSTGRES_URL`, `POSTGRES_USER`, etc.
- ❌ `NEXT_PUBLIC_STACK_PROJECT_ID` (Neon Auth - not used in this project)

---

## Part 4: Vercel Cron Jobs Setup

After deploying, verify cron jobs are configured:

1. Go to **Project Settings → Cron Jobs**
2. Verify these are listed (auto-detected from `vercel.json`):
   - `/api/cron/sync-x` - Daily at 00:00 UTC
   - `/api/cron/sync-ton` - Daily at 00:00 UTC

3. **Test cron jobs manually:**
   ```bash
   # Test X sync
   curl -X GET https://your-new-vercel-url.vercel.app/api/cron/sync-x \
     -H "Authorization: Bearer xauh_cron_secret_2024_secure_key_do_not_share"

   # Test TON sync
   curl -X GET https://your-new-vercel-url.vercel.app/api/cron/sync-ton \
     -H "Authorization: Bearer xauh_cron_secret_2024_secure_key_do_not_share"
   ```

---

## Part 5: Credential Revocation (Your Personal Accounts)

### After Transfer is Complete and Verified

#### Revoke Twitter API Access
1. Go to https://developer.twitter.com/en/portal/dashboard
2. Find your app/project used for this dashboard
3. **Regenerate** or **Revoke** the Bearer Token
4. This will break the sync on your old deployment (intentional)

#### Revoke Telegram API Session
1. Go to https://my.telegram.org/auth
2. Log in with your phone number
3. Go to "API development tools"
4. **Delete** the app you created for this dashboard
5. Or simply don't share the credentials anymore

#### Neon Database
1. **After verifying new database works**, you can delete the old Neon project
2. Go to Neon dashboard → Project Settings → Delete Project
3. ⚠️ **ONLY DO THIS AFTER** confirming the new database has all data!

#### TON API Key
- Check if the TON API key is tied to your personal account
- If yes, have them create a new one at https://tonconsole.com/

---

## Part 6: Transfer Checklist

### Before Transfer
- [ ] Create new Git repository (✅ DONE)
- [ ] Push code to new repository (✅ DONE)
- [ ] Backup current database with `pg_dump`
- [ ] Verify backup file has data

### During Transfer (Company Actions Required)
- [ ] Create new Neon account (company email)
- [ ] Import database backup to new Neon
- [ ] Verify data imported correctly (run COUNT queries)
- [ ] Create new Vercel account (company email)
- [ ] Import Git repository to Vercel
- [ ] Create new Twitter Developer account (company email)
- [ ] Generate new Twitter API credentials
- [ ] Create new Telegram API credentials (company phone)
- [ ] Add all environment variables to Vercel
- [ ] Deploy and test the application

### After Transfer (Verification)
- [ ] Dashboard loads correctly at new Vercel URL
- [ ] Stats API returns correct data (`/api/stats`)
- [ ] Time series API works (`/api/timeseries`)
- [ ] X sync cron works (test manually first)
- [ ] TON sync cron works (test manually first)
- [ ] Tracking pixel works on websites
- [ ] All database tables have data

### After Verification (Cleanup)
- [ ] Revoke your personal Twitter API credentials
- [ ] Delete Telegram API app from your account
- [ ] Delete old Neon database project
- [ ] Delete old Vercel project
- [ ] Remove your access to their new Vercel/Neon if desired

---

## Part 7: Handling Data During Transfer

### Zero Downtime Strategy

If they need the dashboard to work during transfer:

1. **Keep old system running** while setting up new one
2. **Export database** at a specific time (e.g., end of day)
3. **Import to new database**
4. **Deploy to new Vercel**
5. **Update DNS/URLs** to point to new deployment
6. **Run sync scripts manually** to catch up on any data since export:
   ```bash
   npx tsx scripts/sync-x.ts
   npx tsx scripts/sync-ton.ts
   ```

### Accepting Some Data Loss

If a few hours of data loss is acceptable:

1. Note the exact time you export the database
2. After import and deployment, let cron jobs catch up naturally
3. Any web analytics events during the transfer window will be lost (sessions/clickouts)
4. Social media and blockchain data will sync on next cron run (no loss)

---

## Part 8: Common Issues & Troubleshooting

### Issue: "Cannot connect to database"
**Solution:** Check that `DATABASE_URL` in Vercel matches new Neon connection string exactly.

### Issue: "Cron jobs not running"
**Solution:**
1. Check `vercel.json` is in the repository
2. Manually trigger via curl to test
3. Check Vercel logs for errors

### Issue: "Twitter sync fails"
**Solution:** New Twitter credentials likely invalid. Verify:
- Bearer token is correct
- Username exists and matches

### Issue: "Missing data after transfer"
**Solution:**
- Check `pg_dump` backup file is not empty
- Re-import the backup
- Verify using `psql` queries

---

## Part 9: Quick Reference Commands

### Database Backup
```bash
pg_dump "OLD_DATABASE_URL" > backup.sql
```

### Database Restore
```bash
psql "NEW_DATABASE_URL" < backup.sql
```

### Verify Data
```bash
psql "DATABASE_URL" -c "SELECT COUNT(*) FROM posts;"
psql "DATABASE_URL" -c "SELECT COUNT(*) FROM swaps;"
psql "DATABASE_URL" -c "SELECT COUNT(*) FROM sessions;"
psql "DATABASE_URL" -c "SELECT COUNT(*) FROM raw_x_posts;"
```

### Test Cron Jobs
```bash
curl -X GET https://your-app.vercel.app/api/cron/sync-x \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Manual Sync
```bash
npx tsx scripts/sync-x.ts
npx tsx scripts/sync-ton.ts
npx tsx scripts/sync-telegram.ts
```

---

## Final Notes

- **Do NOT delete your Neon database** until you've verified the new one works
- **Do NOT revoke Twitter/Telegram credentials** until new ones are working
- **Test everything** on the new deployment before removing old one
- **Keep backups** - save the `pg_dump` file somewhere safe

This transfer should take about 1-2 hours if they have everything ready (new accounts, credentials, etc.)

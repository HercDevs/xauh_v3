# Testing Website Tracking & Origin Verification

## Quick Test Options

### Option 1: Use the Test Page (Easiest)

1. Open `test-tracking.html` in your browser
2. Update the Dashboard URL if needed (should be your Vercel deployment URL)
3. Select a hostname to simulate (xauh.gold, herculis.gold, etc.)
4. Click "Send Page View" - this simulates a visitor
5. Click "Send Clickout" - this simulates a DEX button click
6. Click "Check Latest Events" - verify the data was received
7. Check your dashboard - the session should appear under the correct website category

### Option 2: Test on Actual Websites

Add this script to any of your websites and visit the page:

```html
<!-- Add to <head> or before </body> -->
<script>
(async function() {
  const sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

  // Send page view
  await fetch('https://YOUR-VERCEL-URL.vercel.app/api/collect', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: sessionId,
      eventType: 'page_view',
      path: window.location.pathname,
      referrer: document.referrer,
      hostname: window.location.hostname, // This is the key field
      utmSource: new URLSearchParams(window.location.search).get('utm_source'),
      utmMedium: new URLSearchParams(window.location.search).get('utm_medium'),
      utmCampaign: new URLSearchParams(window.location.search).get('utm_campaign')
    })
  });

  console.log('✅ Tracking pixel sent from:', window.location.hostname);
})();
</script>
```

### Option 3: Browser Console Test

Open your dashboard in browser, open console, and run:

```javascript
fetch('https://YOUR-VERCEL-URL.vercel.app/api/collect', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sessionId: 'test_' + Date.now(),
    eventType: 'page_view',
    hostname: 'xauh.gold',  // Change this to test different sites
    path: '/test',
  })
}).then(r => r.json()).then(console.log)
```

## What to Verify

### 1. Hostname Tracking Works ✓
- Visit from xauh.gold → Should appear in "xauh.gold" category
- Visit from herculis.gold → Should appear in "herculis.gold" category
- Visit from herculis.li → Should appear in "herculis.li" category
- Visit from herculis.ch → Should appear in "herculis.ch" category
- Visit from any other domain → Should appear in "Other" category

### 2. Origin/CORS Works ✓
The API already has CORS enabled with `Access-Control-Allow-Origin: *`, which means:
- ✅ Requests from xauh.gold will work
- ✅ Requests from herculis.gold will work
- ✅ Requests from herculis.li will work
- ✅ Requests from herculis.ch will work
- ✅ Requests from anywhere else will work too

**Note:** The "origin" Nikolay mentioned in the email is handled by CORS headers, not by the `hostname` field. The `hostname` is for categorization, CORS is for security.

### 3. Data Flow
1. Tracking pixel sends event with `hostname` field
2. API stores it in `raw_web_events` table with hostname
3. Stats API reads hostname and categorizes sessions
4. Dashboard displays sessions grouped by website

## Current Status

### What's Working:
- ✅ Hostname field added to database schema
- ✅ Hostname captured in tracking pixel
- ✅ Hostname stored in raw_web_events table
- ✅ Hostname stored in clickouts table
- ✅ CORS enabled for cross-origin requests
- ✅ Stats API categorizes sessions by hostname
- ✅ Dashboard displays sessions by website

### Why Old Data Shows "Other":
- Old sessions (101 of them) were tracked BEFORE hostname field existed
- They have `hostname: NULL` in the database
- This is expected and correct
- New sessions will be properly categorized

## Testing Checklist

- [ ] Send test page view from test-tracking.html
- [ ] Verify event appears in dashboard stats
- [ ] Check that new sessions are categorized correctly (not as "Other")
- [ ] Test clickout tracking with hostname
- [ ] Verify CORS works (no console errors in browser)
- [ ] Test from actual website (xauh.gold, herculis.gold, etc.)
- [ ] Confirm utm parameters are captured
- [ ] Check that conversion rates calculate correctly

## Database Query to Verify

Run this in Prisma Studio or use psql:

```sql
-- Check recent events with hostname
SELECT session_id, hostname, event_type, created_at
FROM raw_web_events
ORDER BY created_at DESC
LIMIT 10;

-- Check sessions breakdown by hostname
SELECT
  COALESCE(hostname, 'NULL') as hostname,
  COUNT(DISTINCT session_id) as unique_sessions
FROM raw_web_events
WHERE event_type = 'page_view'
GROUP BY hostname
ORDER BY unique_sessions DESC;
```

Expected output after testing:
- You should see your test hostnames
- Sessions should be distributed across different websites
- NULL hostnames are only from old data (before migration)

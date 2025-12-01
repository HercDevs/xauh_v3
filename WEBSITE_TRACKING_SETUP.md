# Website Tracking Setup - SIMPLE UPDATE

## Is Tracking Already Installed?

**YES** - If the websites already have tracking pixels → **ONLY CHANGE THE URL**
**NO** - If tracking pixels are NOT installed → Follow full setup below

---

## OPTION A: Tracking Already Installed (Just Update URL)

If tracking pixels are already on the websites, you ONLY need to:

### Find and Replace:

Look for the existing dashboard URL in the tracking code and replace it with the new one:

**OLD URL (find this):**
- Could be: `xauh-dashboard.vercel.app`
- Could be: `xauh-dashboard-v2.vercel.app`
- Or any other old URL

**NEW URL (replace with this):**
```
xauh-v3.vercel.app
```

**Where to find it:**
- Look in the `<head>` section for: `fetch('https://OLD-URL/api/collect'`
- Look before `</body>` for: `fetch('https://OLD-URL/api/collect'`

**Just do a find/replace:**
1. Open website code
2. Find: `OLD-URL/api/collect`
3. Replace with: `xauh-v3.vercel.app/api/collect`
4. Save
5. Done!

---

## OPTION B: No Tracking Installed (Full Setup)

### For Each Website (xauh.gold, herculis.gold, herculis.li, herculis.ch)

### Step 1: Add Tracking Script to EVERY Page

**WHERE:** Add this just before the closing `</head>` tag on EVERY page of the website.

**WHAT TO PASTE:**

```html
<!-- XAUH Analytics Tracking -->
<script>
(function() {
  // Generate or get session ID
  function getSessionId() {
    let sessionId = localStorage.getItem('xauh_session_id');
    if (!sessionId) {
      sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substring(7);
      localStorage.setItem('xauh_session_id', sessionId);
    }
    return sessionId;
  }

  // Get UTM parameters
  function getUTMParams() {
    const params = new URLSearchParams(window.location.search);
    return {
      utmSource: params.get('utm_source'),
      utmMedium: params.get('utm_medium'),
      utmCampaign: params.get('utm_campaign'),
      utmContent: params.get('utm_content'),
      utmTerm: params.get('utm_term')
    };
  }

  // Track page view
  const utm = getUTMParams();
  fetch('https://xauh-v3.vercel.app/api/collect', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: getSessionId(),
      eventType: 'page_view',
      path: window.location.pathname,
      referrer: document.referrer,
      hostname: window.location.hostname,
      utmSource: utm.utmSource,
      utmMedium: utm.utmMedium,
      utmCampaign: utm.utmCampaign,
      utmContent: utm.utmContent,
      utmTerm: utm.utmTerm
    })
  }).catch(function(e) {
    console.error('Analytics error:', e);
  });
})();
</script>
<!-- End XAUH Analytics -->
```

---

### Step 2: Add Clickout Tracking to DEX Buttons

**WHERE:** Find EVERY button/link that goes to the DEX (swap page). This could be:
- "Buy XAUH" buttons
- "Swap Now" buttons
- "Get XAUH" links
- Any link to ston.fi or dedust.io

**WHAT TO DO:**

**Option A - If using `<a>` tag:**

Replace this:
```html
<a href="https://app.ston.fi/swap?chartVisible=false&ft=TON&tt=XAUH">Buy XAUH</a>
```

With this:
```html
<a href="https://app.ston.fi/swap?chartVisible=false&ft=TON&tt=XAUH" onclick="trackDEXClick(event, this.href)">Buy XAUH</a>
```

**Option B - If using `<button>` with onclick:**

Replace this:
```html
<button onclick="window.location.href='https://app.ston.fi/swap?chartVisible=false&ft=TON&tt=XAUH'">Buy XAUH</button>
```

With this:
```html
<button onclick="trackDEXClick(event, 'https://app.ston.fi/swap?chartVisible=false&ft=TON&tt=XAUH')">Buy XAUH</button>
```

---

### Step 3: Add Clickout Tracking Function

**WHERE:** Add this just before the closing `</body>` tag on EVERY page that has DEX buttons.

**WHAT TO PASTE:**

```html
<!-- XAUH DEX Click Tracking -->
<script>
function trackDEXClick(event, url) {
  event.preventDefault();

  // Get session ID
  var sessionId = localStorage.getItem('xauh_session_id') || 'session_' + Date.now();

  // Get UTM parameters
  var params = new URLSearchParams(window.location.search);

  // Track the click
  fetch('https://xauh-v3.vercel.app/api/collect', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: sessionId,
      eventType: 'dex_clickout',
      hostname: window.location.hostname,
      href: url,
      utmSource: params.get('utm_source'),
      utmMedium: params.get('utm_medium'),
      utmCampaign: params.get('utm_campaign')
    })
  }).catch(function(e) {
    console.error('Click tracking error:', e);
  }).finally(function() {
    // Redirect after tracking (with small delay)
    setTimeout(function() {
      window.location.href = url;
    }, 100);
  });
}
</script>
<!-- End XAUH DEX Click Tracking -->
```

---

### Step 4: Add Google Analytics (Optional)

**WHERE:** Add this just before the closing `</head>` tag.

**WHAT TO PASTE:**

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
<!-- End Google Analytics -->
```

**NOTE:** Replace `G-XXXXXXXXXX` with the actual Google Analytics ID when you create it.

---

## Complete Example Page

Here's what a complete page should look like:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Buy XAUH - Herculis Gold</title>

    <!-- XAUH Analytics Tracking -->
    <script>
    (function() {
      function getSessionId() {
        let sessionId = localStorage.getItem('xauh_session_id');
        if (!sessionId) {
          sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substring(7);
          localStorage.setItem('xauh_session_id', sessionId);
        }
        return sessionId;
      }

      function getUTMParams() {
        const params = new URLSearchParams(window.location.search);
        return {
          utmSource: params.get('utm_source'),
          utmMedium: params.get('utm_medium'),
          utmCampaign: params.get('utm_campaign'),
          utmContent: params.get('utm_content'),
          utmTerm: params.get('utm_term')
        };
      }

      const utm = getUTMParams();
      fetch('https://xauh-v3.vercel.app/api/collect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: getSessionId(),
          eventType: 'page_view',
          path: window.location.pathname,
          referrer: document.referrer,
          hostname: window.location.hostname,
          utmSource: utm.utmSource,
          utmMedium: utm.utmMedium,
          utmCampaign: utm.utmCampaign,
          utmContent: utm.utmContent,
          utmTerm: utm.utmTerm
        })
      }).catch(function(e) {
        console.error('Analytics error:', e);
      });
    })();
    </script>
    <!-- End XAUH Analytics -->

    <!-- Google Analytics (OPTIONAL) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-XXXXXXXXXX');
    </script>
    <!-- End Google Analytics -->
</head>
<body>
    <h1>Buy XAUH Gold Coin</h1>

    <a href="https://app.ston.fi/swap?chartVisible=false&ft=TON&tt=XAUH" onclick="trackDEXClick(event, this.href)">
        Buy XAUH Now
    </a>

    <!-- XAUH DEX Click Tracking -->
    <script>
    function trackDEXClick(event, url) {
      event.preventDefault();
      var sessionId = localStorage.getItem('xauh_session_id') || 'session_' + Date.now();
      var params = new URLSearchParams(window.location.search);

      fetch('https://xauh-v3.vercel.app/api/collect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionId,
          eventType: 'dex_clickout',
          hostname: window.location.hostname,
          href: url,
          utmSource: params.get('utm_source'),
          utmMedium: params.get('utm_medium'),
          utmCampaign: params.get('utm_campaign')
        })
      }).catch(function(e) {
        console.error('Click tracking error:', e);
      }).finally(function() {
        setTimeout(function() {
          window.location.href = url;
        }, 100);
      });
    }
    </script>
    <!-- End XAUH DEX Click Tracking -->
</body>
</html>
```

---

## Checklist for Each Website

### xauh.gold
- [ ] Added page view tracking to `<head>` on all pages
- [ ] Added `onclick="trackDEXClick(event, this.href)"` to all DEX links
- [ ] Added `trackDEXClick()` function before `</body>` on all pages with DEX links
- [ ] Tested: Visited page, checked browser console for errors
- [ ] Tested: Clicked DEX button, verified redirect works

### herculis.gold
- [ ] Added page view tracking to `<head>` on all pages
- [ ] Added `onclick="trackDEXClick(event, this.href)"` to all DEX links
- [ ] Added `trackDEXClick()` function before `</body>` on all pages with DEX links
- [ ] Tested: Visited page, checked browser console for errors
- [ ] Tested: Clicked DEX button, verified redirect works

### herculis.li
- [ ] Added page view tracking to `<head>` on all pages
- [ ] Added `onclick="trackDEXClick(event, this.href)"` to all DEX links
- [ ] Added `trackDEXClick()` function before `</body>` on all pages with DEX links
- [ ] Tested: Visited page, checked browser console for errors
- [ ] Tested: Clicked DEX button, verified redirect works

### herculis.ch
- [ ] Added page view tracking to `<head>` on all pages
- [ ] Added `onclick="trackDEXClick(event, this.href)"` to all DEX links
- [ ] Added `trackDEXClick()` function before `</body>` on all pages with DEX links
- [ ] Tested: Visited page, checked browser console for errors
- [ ] Tested: Clicked DEX button, verified redirect works

---

## How to Verify It's Working

1. **Open browser console** (F12 → Console tab)
2. **Visit the website**
3. **Look for:** No errors in console
4. **Check dashboard:** Visit https://xauh-v3.vercel.app
5. **Wait 10 seconds** then refresh dashboard
6. **Verify:** Session count increased and shows correct website name (not "Other")
7. **Click a DEX button**
8. **Verify:** Clickout count increased and shows correct website

---

## Common Mistakes to Avoid

❌ **DON'T** forget to add tracking to ALL pages (homepage, about, contact, etc.)
❌ **DON'T** forget to add clickout tracking to ALL DEX buttons/links
❌ **DON'T** copy the `<script>` tags if they're already there (no duplicates!)
❌ **DON'T** change `xauh-v3.vercel.app` to anything else
❌ **DON'T** remove the `event.preventDefault()` from trackDEXClick

✅ **DO** test every page after adding code
✅ **DO** check browser console for errors
✅ **DO** verify dashboard shows the correct website name
✅ **DO** make sure DEX buttons still redirect correctly

---

## Need Help?

If tracking isn't working:

1. Open browser console (F12)
2. Look for error messages in red
3. Check Network tab for failed requests to `xauh-v3.vercel.app/api/collect`
4. Verify the hostname matches exactly: `xauh.gold`, `herculis.gold`, `herculis.li`, or `herculis.ch`
5. Make sure there are no typos in the dashboard URL

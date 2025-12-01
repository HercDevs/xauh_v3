# XAUH Analytics Tracking Pixel and GA - Update

This tracking pixel captures website visitor data (page views, UTM parameters, and DEX clickouts) and sends it to the analytics dashboard.

---

## Step 1: Update Tracking Script URL on All Websites

**IMPORTANT:** The tracking pixel script URL needs to be updated from the old dashboard to the new one.

### What to Change:

**OLD URL (currently on websites):**
```html
<script src="https://xauh-v2.vercel.app/pixel.js" async></script>
```

**NEW URL (update to this):**
```html
<script src="https://xauh-v3.vercel.app/pixel.js" async></script>
```

**Just change:** `xauh-v2.vercel.app` → `xauh-v3.vercel.app`

---

## Websites Updating:

### Currently Live (UPDATE THESE NOW):
1. **xauh.gold**
2. **herculis.gold**
3. **herculis.li**
4. **herculis.ch** (if live)

### When ready:
- herculis.house (if live)

---

## Where to Make the Change:

**If using Nuxt.js:**

Update `nuxt.config.js` in the `head` section:

```javascript
export default {
  head: {
    script: [
      {
        src: 'https://xauh-v3.vercel.app/pixel.js',  // ← Changed from v2 to v3
        async: true
      }
    ]
  }
}
```

**Or if in `app.html` or layout file:**

```html
<head>
  <!-- Existing head content -->
  <script src="https://xauh-v3.vercel.app/pixel.js" async></script>
</head>
```

---

## Google Analytics (Already Installed) Checks

The Google Analytics code is already set up with ID: `G-HP2DJPTVJM`

**Add this to `<head>` for all 4 sites:**

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-HP2DJPTVJM"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-HP2DJPTVJM');
</script>
```

---

## What the Pixel Tracks

1. **Page Views** - Automatically tracked when visitor lands on any page
2. **UTM Parameters** - Captures utm_source, utm_medium, utm_campaign, etc. from URL
3. **Website Source** - Now tracks which website the visit came from (xauh.gold, herculis.gold, etc.)
4. **DEX Clickouts** - Automatically tracks clicks to:
   - capitaldex.exchange
   - dedust.io
   - ston.fi
   - Any link with `data-xauh-track` attribute

---

## Testing After Update

1. Deploy the website with the new pixel URL
2. Visit the website
3. Open browser Developer Tools (F12)
4. Check **Console tab** - you should see: "XAUH Analytics Pixel loaded"
5. Check **Network tab** - filter by "collect" - you should see POST requests to `xauh-v3.vercel.app/api/collect`
6. Visit the new dashboard at https://xauh-v3.vercel.app
7. Check that new sessions appear under the correct website name (not "Other")

---

## New Dashboard Links

- **Main Dashboard:** https://xauh-v3.vercel.app/
- **Clickouts by Website:** https://xauh-v3.vercel.app/clickouts
- **Test Page:** Use `test-tracking.html` in the repo

---

/**
 * XAUH Analytics Tracking Pixel
 * Embed this script on your website to track visits and conversions
 * 
 * Usage:
 * <script src="https://your-dashboard.vercel.app/pixel.js"></script>
 */

(function() {
  'use strict';

  // Configuration
  const API_ENDPOINT = '/api/collect'; // Will use same domain as the script
  
  // Generate or retrieve session ID (persists for 30 minutes)
  function getSessionId() {
    const SESSION_KEY = 'xauh_session_id';
    const SESSION_DURATION = 30 * 60 * 1000; // 30 minutes

    let sessionData = localStorage.getItem(SESSION_KEY);
    
    if (sessionData) {
      try {
        const { id, timestamp } = JSON.parse(sessionData);
        const now = Date.now();
        
        // Check if session is still valid
        if (now - timestamp < SESSION_DURATION) {
          return id;
        }
      } catch (e) {
        // Invalid session data, create new one
      }
    }

    // Create new session
    const newSessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substring(7);
    const newSessionData = {
      id: newSessionId,
      timestamp: Date.now(),
    };
    
    localStorage.setItem(SESSION_KEY, JSON.stringify(newSessionData));
    return newSessionId;
  }

  // Extract UTM parameters from URL
  function getUtmParams() {
    const params = new URLSearchParams(window.location.search);
    return {
      utmSource: params.get('utm_source') || undefined,
      utmMedium: params.get('utm_medium') || undefined,
      utmCampaign: params.get('utm_campaign') || undefined,
      utmContent: params.get('utm_content') || undefined,
      utmTerm: params.get('utm_term') || undefined,
    };
  }

  // Send event to API
  async function sendEvent(eventData) {
    try {
      // Get the script's origin to determine API endpoint
      const scriptTag = document.querySelector('script[src*="pixel.js"]');
      const scriptSrc = scriptTag ? scriptTag.src : '';
      const scriptOrigin = scriptSrc ? new URL(scriptSrc).origin : window.location.origin;
      
      const response = await fetch(scriptOrigin + API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });

      if (!response.ok) {
        console.error('XAUH Pixel: Failed to send event', response.status);
      }
    } catch (error) {
      console.error('XAUH Pixel: Error sending event', error);
    }
  }

  // Track page view
  function trackPageView() {
    const sessionId = getSessionId();
    const utmParams = getUtmParams();

    const eventData = {
      sessionId,
      eventType: 'page_view',
      path: window.location.pathname,
      referrer: document.referrer || undefined,
      ...utmParams,
    };

    sendEvent(eventData);
  }

  // Track DEX clickouts
  function trackDexClickouts() {
    const sessionId = getSessionId();
    const utmParams = getUtmParams();

    // Find all links pointing to DEX or with data-xauh-track attribute
    const dexDomains = [
      'capitaldex.exchange',
      'dedust.io',
      'ston.fi',
    ];

    document.addEventListener('click', function(event) {
      // Check if click is on a link
      let target = event.target;
      
      // Traverse up to find an <a> tag
      while (target && target.tagName !== 'A') {
        target = target.parentElement;
      }

      if (!target || target.tagName !== 'A') return;

      const href = target.href;
      if (!href) return;

      // Check if it's a DEX link
      const isDexLink = dexDomains.some(domain => href.includes(domain));
      const isTracked = target.hasAttribute('data-xauh-track');

      if (isDexLink || isTracked) {
        const eventData = {
          sessionId,
          eventType: 'dex_clickout',
          path: window.location.pathname,
          href,
          elementId: target.id || undefined,
          label: target.textContent?.trim() || undefined,
          ...utmParams,
        };

        sendEvent(eventData);
      }
    });
  }

  // Initialize tracking
  function init() {
    // Track initial page view
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', trackPageView);
    } else {
      trackPageView();
    }

    // Set up clickout tracking
    trackDexClickouts();

    // Expose global function for manual tracking
    window.xauhTrack = function(eventType, data = {}) {
      const sessionId = getSessionId();
      const utmParams = getUtmParams();
      
      sendEvent({
        sessionId,
        eventType,
        path: window.location.pathname,
        ...utmParams,
        ...data,
      });
    };
  }

  // Start tracking
  init();

  console.log('XAUH Analytics Pixel loaded');
})();

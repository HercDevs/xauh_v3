'use client'

import { useEffect } from 'react'

export default function TestPage() {
  useEffect(() => {
    // Inline pixel tracking code
    const SESSION_KEY = 'xauh_session_id';
    const SESSION_DURATION = 30 * 60 * 1000;

    function getSessionId() {
      let sessionData = localStorage.getItem(SESSION_KEY);
      
      if (sessionData) {
        try {
          const { id, timestamp } = JSON.parse(sessionData);
          const now = Date.now();
          
          if (now - timestamp < SESSION_DURATION) {
            return id;
          }
        } catch (e) {
          // Invalid session data
        }
      }

      const newSessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substring(7);
      const newSessionData = {
        id: newSessionId,
        timestamp: Date.now(),
      };
      
      localStorage.setItem(SESSION_KEY, JSON.stringify(newSessionData));
      return newSessionId;
    }

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

    async function sendEvent(eventData: any) {
      try {
        const response = await fetch('/api/collect', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(eventData),
        });

        if (!response.ok) {
          console.error('XAUH Pixel: Failed to send event', response.status);
        } else {
          console.log('✅ Event tracked:', eventData.eventType);
        }
      } catch (error) {
        console.error('XAUH Pixel: Error sending event', error);
      }
    }

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

    function trackDexClickouts() {
      const sessionId = getSessionId();
      const utmParams = getUtmParams();

      const dexDomains = [
        'capitaldex.exchange',
        'dedust.io',
        'ston.fi',
      ];

      document.addEventListener('click', function(event) {
        let target = event.target as HTMLElement;
        
        while (target && target.tagName !== 'A') {
          target = target.parentElement as HTMLElement;
        }

        if (!target || target.tagName !== 'A') return;

        const href = (target as HTMLAnchorElement).href;
        if (!href) return;

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

    // Initialize
    trackPageView();
    trackDexClickouts();

    // Expose global tracking function
    (window as any).xauhTrack = function(eventType: string, data: any = {}) {
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

    console.log('✅ XAUH Analytics Pixel loaded (inline)');
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🧪 Tracking Pixel Test Page
          </h1>
          <p className="text-lg text-gray-600 mb-4">
            This page demonstrates the XAUH analytics tracking pixel in action.
          </p>
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              ✅ <strong>Page View Tracked:</strong> When you loaded this page, a "page_view" event was automatically sent to the database.
            </p>
          </div>
        </div>

        {/* UTM Parameter Test */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            📊 UTM Parameter Tracking
          </h2>
          <p className="text-gray-700 mb-4">
            Try adding UTM parameters to this page URL:
          </p>
          <div className="bg-gray-50 rounded p-4 mb-4 font-mono text-sm break-all">
            http://localhost:3000/test?utm_source=twitter&utm_campaign=launch
          </div>
          <p className="text-sm text-gray-600">
            The pixel automatically captures these parameters and associates them with your session.
          </p>
        </div>

        {/* DEX Clickout Test */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            🎯 DEX Clickout Tracking
          </h2>
          <p className="text-gray-700 mb-6">
            Click these buttons to test DEX clickout tracking:
          </p>
          
          <div className="space-y-4">
            <a
              href="https://capitaldex.exchange/swap/xauh"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold py-4 px-6 rounded-lg transition-all shadow-lg hover:shadow-xl text-center"
            >
              🔄 Go to CapitalDEX (Auto-tracked)
            </a>

            <a
              href="https://dedust.io"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-4 px-6 rounded-lg transition-all shadow-lg hover:shadow-xl text-center"
            >
              💧 Go to DeDust (Auto-tracked)
            </a>

            <a
              href="https://example.com"
              data-xauh-track
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-4 px-6 rounded-lg transition-all shadow-lg hover:shadow-xl text-center"
            >
              ✅ Custom Tracked Link (data-xauh-track attribute)
            </a>

            <a
              href="https://google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold py-4 px-6 rounded-lg transition-all text-center"
            >
              ❌ Untracked Link (no tracking)
            </a>
          </div>

          <div className="mt-6 bg-green-50 border-2 border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-900">
              <strong>What happens when you click:</strong> A "dex_clickout" event is sent to the database with the destination URL, before you're redirected.
            </p>
          </div>
        </div>

        {/* Manual Tracking Test */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            🎮 Manual Event Tracking
          </h2>
          <p className="text-gray-700 mb-4">
            You can also manually track custom events using JavaScript:
          </p>
          
          <button
            onClick={() => {
              if (typeof window !== 'undefined' && (window as any).xauhTrack) {
                (window as any).xauhTrack('custom_event', {
                  label: 'Test Button Click',
                  elementId: 'manual-test-button',
                });
                alert('Custom event tracked! Check console and Network tab.');
              }
            }}
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold py-4 px-6 rounded-lg transition-all shadow-lg hover:shadow-xl"
          >
            🚀 Track Custom Event
          </button>

          <div className="mt-4 bg-gray-50 rounded p-4 font-mono text-sm">
            <code>
              window.xauhTrack('custom_event', &#123;<br />
              &nbsp;&nbsp;label: 'Test Button Click',<br />
              &nbsp;&nbsp;elementId: 'manual-test-button'<br />
              &#125;);
            </code>
          </div>
        </div>

        {/* Verification Instructions */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            ✅ How to Verify Tracking
          </h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>Open your browser's Developer Tools (F12) - already open ✓</li>
            <li>Go to the <strong>Console</strong> tab - look for "✅ XAUH Analytics Pixel loaded"</li>
            <li>Go to the <strong>Network</strong> tab</li>
            <li>Filter by "collect"</li>
            <li>Click one of the DEX buttons above</li>
            <li>You should see a POST request to <code className="bg-gray-100 px-2 py-1 rounded">collect</code></li>
            <li>Click on it to see the event data (sessionId, eventType, etc.)</li>
          </ol>

          <div className="mt-6 bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
            <p className="text-sm text-purple-900">
              <strong>Right now:</strong> Check your Console - you should see the pixel loaded message and a "✅ Event tracked: page_view" confirmation!
            </p>
          </div>
        </div>

        {/* Back to Dashboard */}
        <div className="mt-8 text-center">
          <a
            href="/"
            className="inline-block bg-gray-800 hover:bg-gray-900 text-white font-semibold py-3 px-8 rounded-lg transition-all"
          >
            ← Back to Dashboard
          </a>
        </div>
      </div>
    </div>
  )
}

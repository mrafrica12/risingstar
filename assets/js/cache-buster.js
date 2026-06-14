/* ═══════════════════════════════════════════════════════
   RISING STARS ATLANTA — Cache Buster
   Prevents browsers from serving stale cached content
═══════════════════════════════════════════════════════ */

(function() {
  'use strict';

  const CACHE_VERSION_KEY = 'rsaLastCacheVersion';
  const CACHE_CHECK_INTERVAL = 3600000; // 1 hour
  const CURRENT_VERSION = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  // Check if cache needs busting
  function checkCacheVersion() {
    const lastVersion = localStorage.getItem(CACHE_VERSION_KEY);
    const today = CURRENT_VERSION;

    // If version changed (new day), clear old cache
    if (lastVersion && lastVersion !== today) {
      clearOldCache();
      localStorage.setItem(CACHE_VERSION_KEY, today);

      // Reload page with fresh content
      if (performance.navigation.type === 1) {
        // Don't reload on back button
        return;
      }
      window.location.reload(true); // Force reload from server
    } else if (!lastVersion) {
      localStorage.setItem(CACHE_VERSION_KEY, today);
    }
  }

  // Clear IndexedDB and old data
  function clearOldCache() {
    try {
      // Clear IndexedDB
      const dbs = ['risingStars', 'rsaCache', 'appCache'];
      dbs.forEach(dbName => {
        const deleteDB = indexedDB.deleteDatabase(dbName);
        deleteDB.onerror = () => console.log(`Failed to delete ${dbName}`);
      });

      // Clear Application Cache if using AppCache
      if ('applicationCache' in window) {
        window.applicationCache.update();
      }
    } catch (err) {
      console.log('Cache clearing error (expected):', err.message);
    }
  }

  // Add anti-cache headers to fetch requests
  function setupFetchInterceptor() {
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
      const request = args[0];
      const options = args[1] || {};

      // Add no-cache headers to all requests
      options.headers = options.headers || {};
      options.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
      options.headers['Pragma'] = 'no-cache';
      options.headers['Expires'] = '0';

      return originalFetch.apply(this, [request, options]);
    };
  }

  // Prevent back button from serving cached page
  function preventBackButtonCache() {
    window.addEventListener('pageshow', (e) => {
      if (e.persisted) {
        // Page was loaded from back button cache
        console.log('Reloading from back button cache...');
        window.location.reload(true);
      }
    });
  }

  // Add version query parameter to dynamic requests
  function addVersionToDynamicRequests() {
    const version = CURRENT_VERSION;
    window.addEventListener('load', () => {
      // Update any data-fetch attributes with version
      document.querySelectorAll('[data-fetch]').forEach(el => {
        let url = el.dataset.fetch;
        if (!url.includes('?v=') && !url.includes('&v=')) {
          url += (url.includes('?') ? '&' : '?') + 'v=' + version;
          el.dataset.fetch = url;
        }
      });
    });
  }

  // Disable aggressive caching by setting max-age to 0
  function disableAggressiveCaching() {
    const meta = document.createElement('meta');
    meta.httpEquiv = 'Cache-Control';
    meta.content = 'no-cache, no-store, must-revalidate, max-age=0';
    document.head.insertBefore(meta, document.head.firstChild);

    const pragmaMeta = document.createElement('meta');
    pragmaMeta.httpEquiv = 'Pragma';
    pragmaMeta.content = 'no-cache';
    document.head.insertBefore(pragmaMeta, document.head.firstChild);

    const expiresMeta = document.createElement('meta');
    expiresMeta.httpEquiv = 'Expires';
    expiresMeta.content = '-1';
    document.head.insertBefore(expiresMeta, document.head.firstChild);
  }

  // Initialize on page load
  function init() {
    // Add cache-control meta tags
    disableAggressiveCaching();

    // Check version and reload if needed
    checkCacheVersion();

    // Setup fetch interceptor
    setupFetchInterceptor();

    // Prevent back button cache
    preventBackButtonCache();

    // Add versions to dynamic requests
    addVersionToDynamicRequests();

    // Log cache buster status
    console.log(`🔄 Cache Buster Active (v${CURRENT_VERSION})`);
  }

  // Run immediately (don't wait for DOM ready)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
    init(); // Also run immediately
  } else {
    init();
  }

  // Expose public API
  window.CacheBuster = {
    version: CURRENT_VERSION,
    checkCache: checkCacheVersion,
    clearCache: clearOldCache,
    forceReload: () => {
      localStorage.removeItem(CACHE_VERSION_KEY);
      window.location.reload(true);
    }
  };
})();

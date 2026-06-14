/**
 * RISING STARS ATLANTA - GOOGLE SHEET INTEGRATION
 * Real-time data syncing between frontend and Google Sheet
 */

const SheetIntegration = (() => {
  // Configuration
  const CONFIG = {
    endpoint: 'https://script.google.com/macros/s/AKfycbxcn3vfdh1UHyOTuEdJGZXT3mc0_aRCDBl3U7doBEJ_eeMkDolW4hsgCgFORQmQD6i4/exec',
    cacheTime: 5 * 60 * 1000, // 5 minutes
    refreshInterval: 10 * 60 * 1000, // 10 minutes auto-refresh
    siteId: 'rising-stars-atlanta'
  };

  // Cache management
  const cache = {
    data: null,
    timestamp: null,
    isValid() {
      return this.data && (Date.now() - this.timestamp < CONFIG.cacheTime);
    },
    set(data) {
      this.data = data;
      this.timestamp = Date.now();
      localStorage.setItem('sheetIntegrationCache', JSON.stringify({
        data,
        timestamp: this.timestamp
      }));
    },
    get() {
      return this.data;
    },
    load() {
      try {
        const stored = JSON.parse(localStorage.getItem('sheetIntegrationCache'));
        if (stored && (Date.now() - stored.timestamp < CONFIG.cacheTime)) {
          this.data = stored.data;
          this.timestamp = stored.timestamp;
          return true;
        }
      } catch (e) {
        console.warn('Cache load failed:', e);
      }
      return false;
    },
    clear() {
      this.data = null;
      this.timestamp = null;
      localStorage.removeItem('sheetIntegrationCache');
    }
  };

  // Fetch data from Google Sheet
  async function fetchSheetData() {
    try {
      console.log('📊 Fetching data from Google Sheet...');
      const response = await fetch(CONFIG.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'getData',
          siteId: CONFIG.siteId
        })
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const result = await response.json();

      if (result.ok && result.data) {
        cache.set(result.data);
        console.log('✅ Sheet data loaded successfully');
        return result.data;
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (error) {
      console.error('❌ Failed to fetch sheet data:', error);
      // Try to use cached data as fallback
      if (cache.load()) {
        console.log('⚠️ Using cached data');
        return cache.get();
      }
      throw error;
    }
  }

  // Get data with caching
  async function getData() {
    if (cache.isValid()) {
      console.log('📦 Using cached data');
      return cache.get();
    }
    return await fetchSheetData();
  }

  // Get specific data type
  async function getDataByType(type) {
    const data = await getData();
    return data[type] || [];
  }

  // Render programs
  function renderPrograms(container, programs) {
    if (!programs || programs.length === 0) {
      container.innerHTML = '<p class="muted">No programs available</p>';
      return;
    }

    const html = programs.map(prog => `
      <div class="program-card" id="${prog.PROGRAM_ID}">
        <h3>${prog.PROGRAM_NAME}</h3>
        <p class="type">${prog.TYPE}</p>
        <p class="desc">${prog.DESCRIPTION}</p>
        <div class="program-meta">
          <span class="price">${prog.PRICE}</span>
          <span class="level">${prog.SKILL_LEVEL}</span>
        </div>
        <a href="${prog.WEBPAGE_URL}" class="btn">Learn More</a>
      </div>
    `).join('');

    container.innerHTML = html;
  }

  // Render tournaments
  function renderTournaments(container, tournaments) {
    if (!tournaments || tournaments.length === 0) {
      container.innerHTML = '<p class="muted">No tournaments available</p>';
      return;
    }

    const html = tournaments.map(tourn => `
      <div class="tournament-card" id="${tourn.TOURNAMENT_ID}">
        <h3>${tourn.NAME}</h3>
        <div class="tournament-meta">
          <span class="date">📅 ${tourn.DATE}</span>
          <span class="format">${tourn.FORMAT}</span>
          <span class="ages">${tourn.AGE_GROUPS}</span>
        </div>
        <p class="location">📍 ${tourn.LOCATION}</p>
        <div class="status ${tourn.STATUS.toLowerCase()}">${tourn.STATUS}</div>
        <a href="${tourn.REGISTRATION_LINK}" class="btn" target="_blank">Register Now</a>
      </div>
    `).join('');

    container.innerHTML = html;
  }

  // Render schedules
  function renderSchedules(container, schedules) {
    if (!schedules || schedules.length === 0) {
      container.innerHTML = '<p class="muted">No schedules available</p>';
      return;
    }

    const html = schedules.map(sched => `
      <div class="schedule-item">
        <div class="schedule-date">${sched.DATE} • ${sched.DAY}</div>
        <div class="schedule-time">${sched.START_TIME} - ${sched.END_TIME} (${sched.DURATION})</div>
        <div class="schedule-activity">${sched.ACTIVITY}</div>
        <div class="schedule-details">
          <span>📍 ${sched.LOCATION}</span>
          <span>👨‍🏫 ${sched.COACH}</span>
          <span>👥 ${sched.AGE_GROUP}</span>
        </div>
      </div>
    `).join('');

    container.innerHTML = html;
  }

  // Render coaches
  function renderCoaches(container, coaches) {
    if (!coaches || coaches.length === 0) {
      container.innerHTML = '<p class="muted">No coaches available</p>';
      return;
    }

    const html = coaches.map(coach => `
      <div class="coach-card" id="${coach.STAFF_ID}">
        <h3>${coach.NAME}</h3>
        <p class="position">${coach.POSITION}</p>
        <p class="specialties">Specialties: ${coach.SPECIALTIES}</p>
        <p class="bio">${coach.BIO}</p>
        <div class="coach-contact">
          <a href="mailto:${coach.EMAIL}">📧 ${coach.EMAIL}</a>
          <a href="tel:${coach.PHONE}">📱 ${coach.PHONE}</a>
        </div>
        <div class="status ${coach.STATUS.toLowerCase()}">${coach.STATUS}</div>
      </div>
    `).join('');

    container.innerHTML = html;
  }

  // Render resources
  function renderResources(container, resources) {
    if (!resources || resources.length === 0) {
      container.innerHTML = '<p class="muted">No resources available</p>';
      return;
    }

    const html = resources.map(res => `
      <div class="resource-item">
        <h4>${res.TITLE}</h4>
        <p class="category">${res.CATEGORY}</p>
        <p class="description">${res.DESCRIPTION}</p>
        <a href="${res.LINK}" class="btn" target="_blank">View</a>
      </div>
    `).join('');

    container.innerHTML = html;
  }

  // Auto-refresh data
  function startAutoRefresh() {
    setInterval(async () => {
      try {
        console.log('🔄 Auto-refreshing data from sheet...');
        cache.clear();
        await getData();
        console.log('✅ Auto-refresh complete');

        // Dispatch custom event for pages to update
        window.dispatchEvent(new CustomEvent('sheetDataRefreshed'));
      } catch (error) {
        console.warn('⚠️ Auto-refresh failed:', error);
      }
    }, CONFIG.refreshInterval);
  }

  // Manual refresh
  async function refresh() {
    cache.clear();
    return await getData();
  }

  // Public API
  return {
    getData,
    getDataByType,
    renderPrograms,
    renderTournaments,
    renderSchedules,
    renderCoaches,
    renderResources,
    refresh,
    startAutoRefresh,
    getConfig: () => CONFIG
  };
})();

// Start auto-refresh when page loads
window.addEventListener('load', () => {
  SheetIntegration.startAutoRefresh();
});

// Listen for manual refresh requests
window.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key === 'r' && e.shiftKey) {
    e.preventDefault();
    SheetIntegration.refresh().then(() => {
      alert('✅ Data refreshed from Google Sheet!');
      location.reload();
    }).catch(err => {
      alert('❌ Refresh failed: ' + err.message);
    });
  }
});

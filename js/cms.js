(function () {
  const config = window.RSA_CMS_CONFIG || {};
  const endpoint = (config.PUBLIC_API_URL || '').trim();
  if (!endpoint) return;

  const state = { data: null };
  const page = location.pathname.split('/').pop() || 'index.html';

  const qs = (sel, root = document) => root.querySelector(sel);
  const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const esc = value => String(value == null ? '' : value)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  function apiUrl(action) {
    const url = new URL(endpoint);
    url.searchParams.set('action', action);
    url.searchParams.set('siteId', config.SITE_ID || 'rising-stars-atlanta');
    return url.toString();
  }

  function activeRows(rows) {
    return (rows || []).filter(row => String(row.status || row.active || 'Active').toLowerCase() !== 'inactive');
  }

  function sortedRows(rows) {
    return activeRows(rows).sort((a, b) => Number(a.sortOrder || 999) - Number(b.sortOrder || 999));
  }

  async function loadContent() {
    try {
      const res = await fetch(apiUrl('getPublicContent'), { method: 'GET' });
      if (!res.ok) throw new Error('Content request failed');
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || 'Content response failed');
      state.data = json.data || {};
      renderShared();
      renderPage();
      document.dispatchEvent(new CustomEvent('rsa:content-ready', { detail: state.data }));
    } catch (error) {
      console.warn('[Rising Stars CMS]', error.message);
    }
  }

  function renderShared() {
    const settings = state.data.settings || {};
    qsa('a[href^="mailto:"]').forEach(link => {
      if (settings.contactEmail) link.href = `mailto:${settings.contactEmail}`;
    });
    qsa('a[href^="tel:"]').forEach(link => {
      if (!settings.contactPhone) return;
      const number = String(settings.contactPhone).replace(/\D/g, '');
      link.href = `tel:+${number}`;
    });
  }

  function renderHome() {
    const banners = sortedRows(state.data.heroBanners);
    const settings = state.data.settings || {};
    const ticker = sortedRows(state.data.siteContent).filter(item => item.section === 'ticker');
    const tournaments = sortedRows(state.data.tournaments).slice(0, 3);
    const programs = sortedRows(state.data.programs).slice(0, 3);

    if (banners[0]) {
      const hero = banners[0];
      const slide = qs('.hero-slide.active');
      if (slide && hero.imageUrl) slide.style.backgroundImage = `url('${hero.imageUrl}')`;
      if (hero.eyebrow && qs('.hero-eyebrow')) qs('.hero-eyebrow').textContent = hero.eyebrow;
      if (hero.title && qs('.hero-title')) qs('.hero-title').innerHTML = esc(hero.title).replace(/\|/g, '<br><em>') + (hero.title.includes('|') ? '</em>' : '');
      if (hero.subtitle && qs('.hero-subtitle')) qs('.hero-subtitle').textContent = hero.subtitle;
      const primary = qs('.hero-actions .btn-primary');
      if (primary && hero.ctaLabel) {
        primary.textContent = hero.ctaLabel;
        primary.href = hero.ctaUrl || primary.href;
      }
    }

    if (settings.registrationStatus && qs('.live-badge span')) {
      qs('.live-badge span').textContent = `Registration ${settings.registrationStatus}`;
    }

    if (settings.countdownTarget) {
      window.RSA_COUNTDOWN_TARGET = settings.countdownTarget;
    }

    if (ticker.length && qs('#ticker .ticker-track')) {
      const items = ticker.concat(ticker).map(item =>
        `<span class="ticker-item"><span class="ticker-dot" aria-hidden="true"></span>${esc(item.title || item.value || item.message)}</span>`
      ).join('');
      qs('#ticker .ticker-track').innerHTML = items;
    }

    if (tournaments.length && qs('#tournaments .t-grid')) {
      qs('#tournaments .t-grid').innerHTML = tournaments.map((t, i) => tournamentCard(t, i === 0)).join('');
    }

    if (programs.length && qs('#programs .prog-grid')) {
      qs('#programs .prog-grid').innerHTML = programs.map(programCard).join('');
    }
  }

  function tournamentCard(t, featured) {
    const capacity = Number(t.capacity || 0);
    const registered = Number(t.registered || 0);
    const pct = capacity ? Math.min(100, Math.round((registered / capacity) * 100)) : Number(t.capacityPercent || 0);
    const left = capacity ? Math.max(0, capacity - registered) : '';
    return `<article class="t-card reveal ${featured ? '' : 'reveal-delay-1'}">
      <img src="${esc(t.flyerUrl || t.imageUrl || 'assets/images/risingstar_04.webp')}" alt="${esc(t.name || 'Rising Stars tournament')}" loading="lazy" decoding="async" width="800" height="500">
      <div class="t-card-overlay" aria-hidden="true"></div>
      <div class="t-card-body">
        <p class="t-type">${esc(t.type || 'Tournament')}</p>
        <h3 class="t-name">${esc(t.name || 'Tournament')}</h3>
        <div class="t-tags"><span class="t-tag">${esc(t.format || '5v5 & 7v7')}</span><span class="t-tag">${esc(t.ageGroups || 'Ages 4-17')}</span><span class="t-tag">${esc(t.location || 'Atlanta, GA')}</span></div>
        <div class="t-spots"><div class="spots-bar"><div class="spots-fill" style="width:${pct}%"></div></div><span>${left || (100 - pct) + '%'} Spots Left</span></div>
        <br><a href="${esc(t.registrationUrl || 'register.html')}" class="btn-primary" style="font-size:10px;padding:12px 24px">Register ↗</a>
      </div>
    </article>`;
  }

  function programCard(p) {
    const features = String(p.features || '').split('|').filter(Boolean).slice(0, 4);
    return `<div class="prog-card reveal">
      <div class="prog-icon" aria-hidden="true">${esc(p.icon || '⚽')}</div>
      <h3 class="prog-name">${esc(p.name)}</h3>
      <span class="prog-tag">${esc(p.ageGroups || '')}</span>
      <p class="prog-desc">${esc(p.description || '')}</p>
      <ul class="prog-features">${features.map(f => `<li class="prog-feature">${esc(f)}</li>`).join('')}</ul>
      <div class="prog-price"><div><span class="prog-price-num">${esc(p.price || '')}</span></div><a href="${esc(p.registrationUrl || 'register.html')}">Register ↗</a></div>
    </div>`;
  }

  function renderTournaments() {
    const rows = sortedRows(state.data.tournaments);
    const grid = qs('[data-cms-tournaments]');
    if (grid && rows.length) {
      grid.innerHTML = rows.map(t => cmsTournamentTile(t)).join('');
    }
  }

  function cmsTournamentTile(t) {
    return `<article class="cms-card">
      <img src="${esc(t.flyerUrl || t.imageUrl || 'assets/images/risingstar_04.webp')}" alt="${esc(t.name)}" loading="lazy" decoding="async" width="800" height="500">
      <div class="cms-card-body">
        <p class="label">${esc(t.status || 'Open')}</p>
        <h3>${esc(t.name)}</h3>
        <p>${esc(t.date || '')} · ${esc(t.location || '')}</p>
        <p>${esc(t.ageGroups || '')} · ${esc(t.entryFee || '')}</p>
        <a class="btn-primary" href="${esc(t.registrationUrl || 'register.html')}">Register ↗</a>
      </div>
    </article>`;
  }

  function renderPrograms() {
    const rows = sortedRows(state.data.programs);
    const grid = qs('[data-cms-programs]');
    if (grid && rows.length) grid.innerHTML = rows.map(programCard).join('');
  }

  function renderSchedules() {
    const rows = sortedRows(state.data.schedules);
    const grid = qs('[data-cms-schedules]');
    if (grid && rows.length) {
      grid.innerHTML = rows.map(s => `<article class="cms-card cms-schedule-card">
        <div class="cms-card-body">
          <p class="label">${esc(s.type || 'Schedule')}</p>
          <h3>${esc(s.title)}</h3>
          <p>${esc(s.date || s.day || '')} · ${esc(s.time || '')}</p>
          <p>${esc(s.location || '')}</p>
          ${s.alert ? `<p class="cms-alert">${esc(s.alert)}</p>` : ''}
          ${s.fileUrl ? `<a class="btn-outline" href="${esc(s.fileUrl)}" target="_blank" rel="noopener">Download PDF</a>` : ''}
        </div>
      </article>`).join('');
    }
  }

  function renderGallery() {
    const rows = sortedRows(state.data.mediaLibrary).filter(m => /^image|video/.test(String(m.mimeType || 'image')));
    const grid = qs('#galleryGrid');
    if (grid && rows.length) {
      grid.innerHTML = rows.map((m, i) => `<div class="g-item reveal" data-cat="${esc(m.category || 'community')}" data-index="${i}">
        <img src="${esc(m.fileUrl)}" alt="${esc(m.altText || m.title || 'Rising Stars media')}" loading="${i ? 'lazy' : 'eager'}" decoding="async" width="800" height="523">
        <div class="g-overlay"><div class="g-overlay-icon">⊕</div><div class="g-overlay-label">View</div></div>
      </div>`).join('');
      const count = qs('#galleryCount');
      if (count) count.textContent = `${rows.length} Media`;
    }
  }

  function renderResources() {
    const rows = sortedRows(state.data.resources);
    const grid = qs('[data-cms-resources]');
    if (grid && rows.length) {
      grid.innerHTML = rows.map(r => `<article class="download-card">
        <div class="download-icon">📄</div>
        <div class="download-body"><div class="download-title">${esc(r.title)}</div><div class="download-meta">${esc(r.category || 'Document')} · ${esc(r.updatedAt || '')}</div></div>
        ${r.fileUrl ? `<a class="download-btn" href="${esc(r.fileUrl)}" target="_blank" rel="noopener">Open</a>` : '<span class="download-btn" aria-disabled="true">Pending</span>'}
      </article>`).join('');
    }
  }

  function renderPage() {
    renderHome();
    if (page === 'tournaments.html') renderTournaments();
    if (page === 'programs.html') renderPrograms();
    if (page === 'schedules.html') renderSchedules();
    if (page === 'gallery.html') renderGallery();
    if (page === 'resources.html') renderResources();
  }

  document.addEventListener('DOMContentLoaded', loadContent);
})();

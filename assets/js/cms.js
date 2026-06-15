(function () {
  function initNavDropdowns() {
    const dropdowns = Array.from(document.querySelectorAll('.nav-dropdown'));
    if (!dropdowns.length) return;

    const closeAll = except => {
      dropdowns.forEach(dropdown => {
        if (dropdown === except) return;
        dropdown.classList.remove('open');
        const trigger = Array.from(dropdown.children).find(child => child.matches && child.matches('a'));
        if (trigger) trigger.setAttribute('aria-expanded', 'false');
      });
    };

    dropdowns.forEach(dropdown => {
      const trigger = Array.from(dropdown.children).find(child => child.matches && child.matches('a'));
      const menu = dropdown.querySelector('.nav-dropdown-menu');
      if (!trigger || !menu) return;

      trigger.setAttribute('aria-haspopup', 'true');
      trigger.setAttribute('aria-expanded', dropdown.classList.contains('open') ? 'true' : 'false');

      trigger.addEventListener('click', event => {
        const navLinks = trigger.closest('.nav-links');
        const navLinksVisible = navLinks && getComputedStyle(navLinks).display !== 'none';
        if (!navLinksVisible || dropdown.classList.contains('open')) return;
        event.preventDefault();
        closeAll(dropdown);
        dropdown.classList.add('open');
        trigger.setAttribute('aria-expanded', 'true');
      });

      trigger.addEventListener('keydown', event => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        if (dropdown.classList.contains('open')) return;
        event.preventDefault();
        closeAll(dropdown);
        dropdown.classList.add('open');
        trigger.setAttribute('aria-expanded', 'true');
      });

      menu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => closeAll());
      });

      dropdown.addEventListener('focusout', () => {
        window.setTimeout(() => {
          if (dropdown.contains(document.activeElement)) return;
          dropdown.classList.remove('open');
          trigger.setAttribute('aria-expanded', 'false');
        }, 0);
      });
    });

    document.addEventListener('click', event => {
      if (event.target.closest('.nav-dropdown')) return;
      closeAll();
    });

    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') closeAll();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNavDropdowns);
  } else {
    initNavDropdowns();
  }

  const config = window.RSA_CMS_CONFIG || {};
  const endpoint = (config.PUBLIC_API_URL || '').trim();
  if (!endpoint) return;

  const state = { data: null };
  const page = location.pathname.split('/').pop() || 'index.html';
  const inPagesDir = location.pathname.includes('/pages/');

  const qs = (sel, root = document) => root.querySelector(sel);
  const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const esc = value => String(value == null ? '' : value)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const assetPath = path => `${inPagesDir ? '../assets/' : 'assets/'}${path}`;
  const pagePath = path => {
    if (!path) return '';
    if (/^(?:[a-z]+:|\/\/|#|\/)/i.test(path)) return path;
    return inPagesDir || path.startsWith('pages/') ? path : `pages/${path}`;
  };

  function activeRows(rows) {
    return (rows || []).filter(row => String(row.status || row.active || 'Active').toLowerCase() !== 'inactive');
  }

  function sortedRows(rows) {
    return activeRows(rows).sort((a, b) => Number(a.sortOrder || 999) - Number(b.sortOrder || 999));
  }

  function slugify(value) {
    return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  const tournamentAnchorIds = {
    'TOURN-001': 'memorial-day-5v5',
    'TOURN-002': 'summer-elite-5v5',
    'TOURN-003': 'championship-cup-5v5',
    'TOURN-004': 'elite-7v7-summer',
    'TOURN-005': 'labor-day-5v5',
    'TOURN-006': 'winter-elite-5v5',
  };

  function settingValue(rows, name) {
    const match = (rows || []).find(row => String(row.SETTING || row.setting || '').toLowerCase() === name.toLowerCase());
    return match ? (match.VALUE || match.value || '') : '';
  }

  function firstContact(rows) {
    return (rows || []).find(row => String(row.STATUS || row.status || 'Active').toLowerCase() !== 'inactive') || {};
  }

  function normalizeData(data) {
    if (!data) return {};
    if (data.tournaments || data.programs || data.schedules || data.resources || data.tournamentLinks || data.TournamentLinks) {
      return {
        ...data,
        tournamentLinks: data.tournamentLinks || data.TournamentLinks || data.tournaments || [],
      };
    }

    const contact = firstContact(data.CONTACT_INFO);
    return {
      settings: {
        siteName: settingValue(data.SETTINGS, 'Site Name'),
        contactEmail: settingValue(data.SETTINGS, 'Contact Email') || contact.EMAIL || '',
        contactPhone: settingValue(data.SETTINGS, 'Contact Phone') || contact.PHONE || '',
        registrationStatus: settingValue(data.SETTINGS, 'Registration Status') || 'Open',
      },
      tournaments: (data.TOURNAMENTS || []).map(row => ({
        id: row.TOURNAMENT_ID,
        name: row.NAME,
        date: row.DATE,
        format: row.FORMAT,
        ageGroups: row.AGE_GROUPS,
        location: row.LOCATION,
        status: row.STATUS,
        registrationUrl: row.REGISTRATION_LINK || row.WEBPAGE_URL,
        type: 'Tournament',
      })),
      programs: (data.PROGRAMS || []).map(row => ({
        id: row.PROGRAM_ID,
        name: row.PROGRAM_NAME,
        type: row.TYPE,
        description: row.DESCRIPTION,
        price: row.PRICE,
        ageGroups: row.SKILL_LEVEL,
        status: row.STATUS,
        registrationUrl: row.WEBPAGE_URL,
      })),
      schedules: (data.SCHEDULES || []).map(row => ({
        id: row.SCHEDULE_ID || `${row.DATE || ''}-${row.ACTIVITY || ''}`,
        title: row.ACTIVITY,
        date: row.DATE || row.DAY,
        day: row.DAY,
        time: row.START_TIME,
        location: row.LOCATION,
        status: row.STATUS,
        alert: row.NOTES,
        type: 'Schedule',
      })),
      mediaLibrary: (data.MEDIA_GALLERY || []).map(row => ({
        id: row.MEDIA_ID,
        title: row.DESCRIPTION || row.FILENAME,
        category: row.CATEGORY || row.EVENT_TYPE,
        fileUrl: row.FILE_URL && row.FILE_URL.includes('/assets/images/')
          ? assetPath(`images/gallery/events/${row.FILENAME || row.FILE_URL.split('/').pop()}`)
          : row.FILE_URL,
        altText: row.DESCRIPTION || row.FILENAME,
        status: row.STATUS,
        mimeType: 'image/webp',
      })),
      resources: (data.RESOURCES || []).map(row => ({
        id: row.RESOURCE_ID,
        title: row.TITLE,
        category: row.CATEGORY,
        description: row.DESCRIPTION,
        fileUrl: row.LINK,
        status: row.STATUS,
        updatedAt: row.CREATED_DATE,
      })),
      tournamentLinks: (data.TOURNAMENTS || []).map(row => ({
        id: row.TOURNAMENT_ID,
        tournament_id: row.TOURNAMENT_ID,
        name: row.NAME,
        sincsports_url: row.REGISTRATION_LINK,
        webpage_url: row.WEBPAGE_URL,
        status: row.STATUS,
      })),
    };
  }

  async function loadContent() {
    try {
      const url = new URL(endpoint);
      url.searchParams.set('action', 'getData');
      url.searchParams.set('siteId', config.SITE_ID || 'rising-stars-atlanta');
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error('Content request failed');
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || 'Content response failed');
      state.data = normalizeData(json.data || {});
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
    renderTournamentNavigation();
  }

  function tournamentNavLinks() {
    const rows = sortedRows(state.data.tournamentLinks || state.data.tournaments || []);
    const links = [{
      label: 'All Tournaments',
      href: 'tournaments.html',
      type: 'internal',
    }];

    rows.forEach(row => {
      const label = row.name || row.NAME || row.TOURNAMENT_NAME || row.title || '';
      if (!label) return;
      const externalUrl = row.sincsports_url || row.registrationUrl || row.REGISTRATION_LINK || '';
      const rowId = row.tournament_id || row.id || row.TOURNAMENT_ID || '';
      const webpageUrl = row.webpage_url || row.WEBPAGE_URL || '';
      const fallbackId = tournamentAnchorIds[rowId] || (webpageUrl.includes('#') ? webpageUrl.split('#').pop() : '') || slugify(label);
      links.push({
        label,
        href: externalUrl || `tournaments.html#${fallbackId}`,
        type: externalUrl ? 'external' : 'internal',
      });
    });

    return links;
  }

  function renderTournamentNavigation() {
    const links = tournamentNavLinks();
    if (links.length <= 1) return;

    qsa('.nav-dropdown').forEach(dropdown => {
      const trigger = Array.from(dropdown.children).find(child => child.matches && child.matches('a[href*="tournaments.html"]'));
      const menu = dropdown.querySelector('.nav-dropdown-menu');
      if (!trigger || !menu) return;

      menu.innerHTML = links.map(link => {
        const href = link.type === 'external' ? link.href : pagePath(link.href);
        const externalAttrs = link.type === 'external' ? ' target="_blank" rel="noopener noreferrer"' : '';
        return `<a href="${esc(href)}"${externalAttrs}>${esc(link.label)}</a>`;
      }).join('');
      menu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => dropdown.classList.remove('open'));
      });
    });

    if (window.MobileNav && typeof window.MobileNav.setTournamentLinks === 'function') {
      window.MobileNav.setTournamentLinks(links);
    } else {
      document.addEventListener('DOMContentLoaded', () => {
        if (window.MobileNav && typeof window.MobileNav.setTournamentLinks === 'function') {
          window.MobileNav.setTournamentLinks(links);
        }
      }, { once: true });
    }
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
        primary.href = pagePath(hero.ctaUrl) || primary.href;
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
      <img src="${esc(t.flyerUrl || t.imageUrl || assetPath('images/gallery/events/risingstar_04.webp'))}" alt="${esc(t.name || 'Rising Stars tournament')}" loading="lazy" decoding="async" width="800" height="500">
      <div class="t-card-overlay" aria-hidden="true"></div>
      <div class="t-card-body">
        <p class="t-type">${esc(t.type || 'Tournament')}</p>
        <h3 class="t-name">${esc(t.name || 'Tournament')}</h3>
        <div class="t-tags"><span class="t-tag">${esc(t.format || '5v5 & 7v7')}</span><span class="t-tag">${esc(t.ageGroups || 'Ages 4-17')}</span><span class="t-tag">${esc(t.location || 'Atlanta, GA')}</span></div>
        <div class="t-spots"><div class="spots-bar"><div class="spots-fill" style="width:${pct}%"></div></div><span>${left || (100 - pct) + '%'} Spots Left</span></div>
        <br><a href="${esc(pagePath(t.registrationUrl || 'tournaments.html'))}" class="btn-primary" style="font-size:10px;padding:12px 24px">Register ↗</a>
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
      <div class="prog-price"><div><span class="prog-price-num">${esc(p.price || '')}</span></div><a href="${esc(pagePath(p.registrationUrl || 'tournaments.html'))}">Register ↗</a></div>
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
      <img src="${esc(t.flyerUrl || t.imageUrl || assetPath('images/gallery/events/risingstar_04.webp'))}" alt="${esc(t.name)}" loading="lazy" decoding="async" width="800" height="500">
      <div class="cms-card-body">
        <p class="label">${esc(t.status || 'Open')}</p>
        <h3>${esc(t.name)}</h3>
        <p>${esc(t.date || '')} · ${esc(t.location || '')}</p>
        <p>${esc(t.ageGroups || '')} · ${esc(t.entryFee || '')}</p>
        <a class="btn-primary" href="${esc(pagePath(t.registrationUrl || 'tournaments.html'))}">Register ↗</a>
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
      grid.innerHTML = rows.map((m, i) => `<div class="g-item reveal" data-cat="${esc(slugify(m.category || 'community'))}" data-index="${i}">
        <img src="${esc(m.fileUrl)}" alt="${esc(m.altText || m.title || 'Rising Stars media')}" loading="${i ? 'lazy' : 'eager'}" decoding="async" width="800" height="523">
        <div class="g-overlay"><div class="g-overlay-icon">⊕</div><div class="g-overlay-label">View</div></div>
      </div>`).join('');
      const count = qs('#galleryCount');
      if (count) count.textContent = `${rows.length} Media`;
      document.dispatchEvent(new CustomEvent('rsa:gallery-updated'));
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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadContent);
  } else {
    loadContent();
  }
})();

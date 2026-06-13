/* ═══════════════════════════════════════════════════════
   RISING STARS ATLANTA — ADMIN APP
   Core functionality for admin portal
═══════════════════════════════════════════════════════ */

/* ── LOGIN ─────────────────────────────────────────── */
(function() {
  const AUTH_KEY = 'rsaAdminAuth2026';
  const VALID_USER = 'admin';
  const VALID_PASS = 'Welcome2026';

  const overlay  = document.getElementById('loginOverlay');
  const form     = document.getElementById('loginForm');
  const errEl    = document.getElementById('loginError');
  const userEl   = document.getElementById('loginUser');
  const passEl   = document.getElementById('loginPass');

  if (sessionStorage.getItem(AUTH_KEY) === '1') {
    overlay.classList.add('hidden');
    return;
  }

  form.addEventListener('submit', function(e) {
    e.preventDefault();
    const u = userEl.value.trim();
    const p = passEl.value;
    if (u === VALID_USER && p === VALID_PASS) {
      sessionStorage.setItem(AUTH_KEY, '1');
      overlay.style.transition = 'opacity .45s';
      overlay.style.opacity = '0';
      setTimeout(() => overlay.classList.add('hidden'), 460);
    } else {
      errEl.classList.add('show');
      passEl.value = '';
      passEl.focus();
      setTimeout(() => errEl.classList.remove('show'), 3500);
    }
  });

  [userEl, passEl].forEach(el =>
    el.addEventListener('input', () => errEl.classList.remove('show'))
  );

  document.getElementById('logoutBtn').addEventListener('click', function() {
    sessionStorage.removeItem(AUTH_KEY);
    location.reload();
  });
})();

/* ── CORE STATE ────────────────────────────────────── */
const ADMIN = {
  endpoint: sessionStorage.getItem('rsaAdminEndpoint') || '',
  token: sessionStorage.getItem('rsaAdminToken') || '',
  data: {},
  sortOrders: {
    coaches: [],
    gallery: [],
    winners: {}
  }
};

const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));
const toast = msg => {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => el.classList.remove('show'), 2800);
};

/* ── CONNECTION SETUP ──────────────────────────────── */
$('#apiUrl').value = ADMIN.endpoint;
$('#adminToken').value = ADMIN.token;
updateConnection();

function updateConnection() {
  $('#connectionStatus').textContent = ADMIN.endpoint && ADMIN.token
    ? 'Connected: token stored for this session'
    : 'Not connected: add Web App URL and admin token';
}

$('#saveConnectionBtn').addEventListener('click', () => {
  ADMIN.endpoint = $('#apiUrl').value.trim();
  ADMIN.token = $('#adminToken').value.trim();
  sessionStorage.setItem('rsaAdminEndpoint', ADMIN.endpoint);
  sessionStorage.setItem('rsaAdminToken', ADMIN.token);
  updateConnection();
  toast('Connection saved');
});

/* ── PANEL NAVIGATION ──────────────────────────────── */
$('#adminNav').addEventListener('click', e => {
  const btn = e.target.closest('button[data-panel]');
  if (!btn) return;
  $$('#adminNav button').forEach(b => b.classList.toggle('active', b === btn));
  $$('.panel').forEach(p => p.classList.toggle('active', p.id === btn.dataset.panel));
  $('#panelTitle').textContent = btn.textContent;
});

/* ── API HELPER ────────────────────────────────────── */
async function api(action, payload = {}) {
  if (!ADMIN.endpoint) throw new Error('Add the Web App URL first.');
  const res = await fetch(ADMIN.endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({
      action,
      token: ADMIN.token,
      siteId: 'rising-stars-atlanta',
      ...payload
    })
  });
  const json = await res.json();
  if (!json.ok) throw new Error(json.error || 'Request failed');
  return json;
}

/* ── REFRESH ALL DATA ──────────────────────────────── */
async function refreshAll() {
  try {
    const json = await api('listAll');
    ADMIN.data = json.data || {};

    $('#metricTournamentLinks').textContent = (ADMIN.data.TournamentLinks || []).length;
    $('#metricRegistrations').textContent = (ADMIN.data.PrivateCoachingReg || []).length;
    $('#metricCoaches').textContent = (ADMIN.data.Coaches || []).length;
    $('#metricMedia').textContent = (ADMIN.data.GalleryMedia || []).length;

    renderRegistrations();
    renderCoaches();
    renderGallery();
    renderWinners();
    renderNews();
    toast('Data refreshed');
  } catch (err) {
    toast(err.message);
  }
}

$('#refreshBtn').addEventListener('click', refreshAll);

/* ── TOURNAMENT LINKS MANAGER ──────────────────────── */
document.querySelectorAll('.save-link-btn').forEach(btn => {
  btn.addEventListener('click', async () => {
    const row = btn.closest('tr[data-tid]');
    const tid = row.dataset.tid;
    const url = row.querySelector('.tourn-url-input').value.trim();
    try {
      const name = row.querySelector('td').textContent.trim().split('\n')[0];
      await api('upsertRow', {
        sheet: 'TournamentLinks',
        data: {
          id: tid,
          tournament_id: tid,
          name,
          sincsports_url: url,
          status: 'Active',
          updatedAt: new Date().toISOString()
        }
      });
      toast(`Saved: ${name}`);
    } catch (err) {
      toast(err.message);
    }
  });
});

document.querySelectorAll('.remove-link-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const row = btn.closest('tr[data-tid]');
    row.querySelector('.tourn-url-input').value = '';
    row.querySelector('.save-link-btn').click();
  });
});

$('#saveAllLinksBtn').addEventListener('click', async () => {
  const buttons = document.querySelectorAll('.save-link-btn');
  for (const btn of buttons) {
    btn.click();
    await new Promise(r => setTimeout(r, 200));
  }
  toast('All tournament links saved ✓');
});

/* ── PROGRAM LINKS MANAGER ────────────────────────── */
document.querySelectorAll('.save-prog-link-btn').forEach(btn => {
  btn.addEventListener('click', async () => {
    const row = btn.closest('tr[data-progid]');
    const progid = row.dataset.progid;
    const url = row.querySelector('.prog-url-input').value.trim();
    try {
      const name = row.querySelector('td').textContent.trim();
      await api('upsertRow', {
        sheet: 'ProgramLinks',
        data: {
          id: progid,
          program_id: progid,
          name,
          url: url,
          status: 'Active',
          updatedAt: new Date().toISOString()
        }
      });
      toast(`Saved: ${name}`);
    } catch (err) {
      toast(err.message);
    }
  });
});

document.querySelectorAll('.remove-prog-link-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const row = btn.closest('tr[data-progid]');
    row.querySelector('.prog-url-input').value = '';
    row.querySelector('.save-prog-link-btn').click();
  });
});

$('#saveAllProgLinksBtn').addEventListener('click', async () => {
  const buttons = document.querySelectorAll('.save-prog-link-btn');
  for (const btn of buttons) {
    btn.click();
    await new Promise(r => setTimeout(r, 200));
  }
  toast('All program links saved ✓');
});

/* ── PRIVATE COACHING REGISTRATIONS ────────────────── */
function renderRegistrations() {
  const tbody = $('#registrationsTable');
  const rows = (ADMIN.data.PrivateCoachingReg || []).sort((a, b) =>
    new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
  );

  if (!rows.length) {
    tbody.innerHTML = '<tr><td colspan="9" class="muted">No registrations yet.</td></tr>';
    return;
  }

  tbody.innerHTML = rows.map(r => `
    <tr>
      <td style="font-weight:600">${r.playerName || ''}</td>
      <td>${r.playerAge || ''}</td>
      <td>${r.parentName || ''}</td>
      <td>${r.parentPhone || ''}</td>
      <td>${r.experienceLevel || ''}</td>
      <td>${r.sessionType || ''}</td>
      <td style="font-size:12px">${r.preferredTimes || ''}</td>
      <td>
        <select class="reg-status-select" data-id="${r.id}" onchange="updateRegStatus(this)">
          <option value="New" ${r.status === 'New' ? 'selected' : ''}>New</option>
          <option value="Contacted" ${r.status === 'Contacted' ? 'selected' : ''}>Contacted</option>
          <option value="Enrolled" ${r.status === 'Enrolled' ? 'selected' : ''}>Enrolled</option>
          <option value="Pending" ${r.status === 'Pending' ? 'selected' : ''}>Pending</option>
        </select>
      </td>
      <td><button class="btn outline danger" onclick='deleteRow("PrivateCoachingReg","${r.id||''}");'>Delete</button></td>
    </tr>
  `).join('');
}

window.updateRegStatus = async (select) => {
  const id = select.dataset.id;
  const status = select.value;
  try {
    await api('upsertRow', {
      sheet: 'PrivateCoachingReg',
      data: { id, status }
    });
    toast(`Status updated to ${status}`);
  } catch (err) {
    toast(err.message);
  }
};

$('#exportRegistrationsBtn').addEventListener('click', () => {
  const rows = ADMIN.data.PrivateCoachingReg || [];
  if (!rows.length) return toast('No registrations to export');

  const headers = ['Player Name', 'Age', 'Parent/Guardian', 'Phone', 'Experience', 'Session Type', 'Preferred Times', 'Sessions/Month', 'Status', 'Date'];
  const csv = [
    headers.join(','),
    ...rows.map(r => [
      `"${r.playerName || ''}"`,
      r.playerAge || '',
      `"${r.parentName || ''}"`,
      r.parentPhone || '',
      r.experienceLevel || '',
      r.sessionType || '',
      `"${r.preferredTimes || ''}"`,
      r.sessionsPerMonth || '',
      r.status || 'New',
      r.createdAt?.split('T')[0] || ''
    ].join(','))
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `registrations-${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  toast('CSV exported');
});

/* ── COACHING STAFF ────────────────────────────────── */
function renderCoaches() {
  const grid = $('#coachesGrid');
  const coaches = (ADMIN.data.Coaches || []).sort((a, b) => (a.sortOrder || 999) - (b.sortOrder || 999));

  if (!coaches.length) {
    grid.innerHTML = '<div class="muted" style="grid-column:1/-1;padding:20px">No coaches yet — add one above.</div>';
    return;
  }

  grid.innerHTML = coaches.map((c, i) => `
    <div class="sortable-item" data-id="${c.id}" data-type="coach" data-index="${i}">
      <div class="sort-handle" title="Drag to reorder">≡</div>
      ${c.photoUrl ? `<img src="${c.photoUrl}" alt="${c.name || 'Coach'}">` : '<div style="aspect-ratio:1;background:var(--card);display:flex;align-items:center;justify-content:center;color:var(--muted)">No photo</div>'}
      <div style="font-size:11px;font-weight:600;margin-bottom:4px">${c.name || 'Unnamed'}</div>
      <div style="font-size:9px;color:var(--muted);margin-bottom:6px">${c.role || ''}</div>
      <div style="display:flex;gap:4px">
        <button class="btn outline" style="padding:4px 8px;font-size:9px;flex:1" onclick="editCoach(${JSON.stringify(c).replace(/"/g, '&quot;')})">Edit</button>
        <button class="btn outline danger" style="padding:4px 8px;font-size:9px;flex:1" onclick='deleteRow("Coaches","${c.id||''}");'>Delete</button>
      </div>
    </div>
  `).join('');

  setupDragDrop('coach');
}

$('#saveCoachBtn').addEventListener('click', async () => {
  const form = $('#coachForm');
  const data = Object.fromEntries(new FormData(form).entries());
  data.id = data.id || `COACH-${Date.now().toString(36).toUpperCase()}`;

  try {
    await api('upsertRow', { sheet: 'Coaches', data });
    toast('Coach saved ✓');
    form.reset();
    $('#coachPhotoPreview').style.display = 'none';
    refreshAll();
  } catch (err) {
    toast(err.message);
  }
});

window.editCoach = function(coach) {
  const form = $('#coachForm');
  Object.keys(coach).forEach(k => {
    const el = form.querySelector(`[name="${k}"]`);
    if (el) el.value = coach[k] || '';
  });
  if (coach.photoUrl) previewCoachPhoto(coach.photoUrl);
  form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  toast('Coach loaded — edit and save');
};

function previewCoachPhoto(url) {
  const wrap = $('#coachPhotoPreview');
  const img = $('#coachPhotoImg');
  if (url) {
    img.src = url;
    wrap.style.display = 'block';
  } else {
    wrap.style.display = 'none';
  }
}

async function uploadCoachPhoto(input) {
  const file = input.files[0];
  if (!file) return;
  try {
    toast('Uploading and compressing photo…');
    const compressed = await compressImage(file, 400, 400, 0.85);
    const res = await api('uploadFile', {
      file: { name: file.name, mimeType: 'image/jpeg', base64: compressed },
      metadata: { category: 'coaches', altText: $('#coachForm [name="name"]').value || file.name }
    });
    const url = res.data.fileUrl || '';
    $('#coachPhotoUrl').value = url;
    previewCoachPhoto(url);
    toast('Photo uploaded and compressed ✓');
  } catch (err) {
    toast(err.message);
  }
}

/* ── MEDIA GALLERY ────────────────────────────────── */
function renderGallery() {
  const grid = $('#galleryGrid');
  const items = (ADMIN.data.GalleryMedia || []).sort((a, b) => (a.sortOrder || 999) - (b.sortOrder || 999));

  if (!items.length) {
    grid.innerHTML = '<div class="muted" style="grid-column:1/-1;padding:20px">No gallery items yet — upload images above.</div>';
    return;
  }

  grid.innerHTML = items.map((item, i) => `
    <div class="sortable-item" data-id="${item.id}" data-type="gallery" data-index="${i}">
      <div class="sort-handle" title="Drag to reorder">≡</div>
      <img src="${item.imageUrl || ''}" alt="${item.altText || 'Gallery'}">
      <div style="font-size:10px;color:var(--muted);margin-bottom:6px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${item.category || ''}</div>
      <button class="btn outline danger" style="padding:4px 8px;font-size:9px;width:100%" onclick='deleteRow("GalleryMedia","${item.id||''}");'>Delete</button>
    </div>
  `).join('');

  setupDragDrop('gallery');
}

$('#uploadGalleryBtn').addEventListener('click', async () => {
  const files = Array.from($('#galleryFileInput').files || []);
  if (!files.length) return toast('Choose files first');

  for (const file of files) {
    try {
      toast(`Compressing ${file.name}…`);
      const compressed = await compressImage(file, 1200, 800, 0.8);
      await api('uploadFile', {
        file: { name: file.name, mimeType: 'image/jpeg', base64: compressed },
        metadata: {
          category: $('#galleryCategory').value,
          altText: $('#galleryAlt').value || file.name,
          type: 'gallery'
        }
      });
    } catch (err) {
      toast(`Error: ${file.name} - ${err.message}`);
      return;
    }
  }

  toast(`${files.length} image(s) uploaded and compressed ✓`);
  $('#galleryFileInput').value = '';
  refreshAll();
});

/* ── TOURNAMENT WINNERS GALLERY ────────────────────── */
function renderWinners() {
  const grid = $('#winnersGrid');
  const items = (ADMIN.data.TournamentWinners || []).sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return (a.sortOrder || 999) - (b.sortOrder || 999);
  });

  if (!items.length) {
    grid.innerHTML = '<div class="muted" style="grid-column:1/-1;padding:20px">No tournament winners photos yet.</div>';
    return;
  }

  grid.innerHTML = items.map((item, i) => `
    <div class="sortable-item" data-id="${item.id}" data-type="winners" data-index="${i}">
      <div class="sort-handle" title="Drag to reorder">≡</div>
      <img src="${item.imageUrl || ''}" alt="${item.altText || 'Winner'}">
      <div style="font-size:9px;color:var(--gold);margin-bottom:2px;font-weight:600">${item.year || ''}</div>
      <div style="font-size:9px;color:var(--muted);margin-bottom:6px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${item.tournament || ''}</div>
      <button class="btn outline danger" style="padding:4px 8px;font-size:9px;width:100%" onclick='deleteRow("TournamentWinners","${item.id||''}");'>Delete</button>
    </div>
  `).join('');

  setupDragDrop('winners');
  populateYearsFilter();
}

function populateYearsFilter() {
  const items = ADMIN.data.TournamentWinners || [];
  const years = [...new Set(items.map(i => i.year))].sort((a, b) => b - a);
  const select = $('#winnersYearFilter');
  select.innerHTML = '<option value="">All Years</option>' + years.map(y =>
    `<option value="${y}">${y}</option>`
  ).join('');
}

window.filterWinnersByYear = () => {
  const year = $('#winnersYearFilter').value;
  const items = document.querySelectorAll('#winnersGrid .sortable-item');
  items.forEach(item => {
    const itemYear = item.querySelector('[data-year]')?.dataset.year || item.textContent.match(/\b(20\d{2})\b/)?.[1];
    item.style.display = (year === '' || itemYear == year) ? 'block' : 'none';
  });
};

$('#uploadWinnersBtn').addEventListener('click', async () => {
  const files = Array.from($('#winnersFileInput').files || []);
  const tourn = $('#winnersTourn').value;
  const year = $('#winnersYear').value;
  const alt = $('#winnersAlt').value;

  if (!files.length) return toast('Choose files first');
  if (!year) return toast('Select a year');

  for (const file of files) {
    try {
      toast(`Compressing ${file.name}…`);
      const compressed = await compressImage(file, 1200, 800, 0.8);
      await api('uploadFile', {
        file: { name: file.name, mimeType: 'image/jpeg', base64: compressed },
        metadata: {
          tournament: tourn,
          year: parseInt(year),
          altText: alt || file.name,
          type: 'tournament-winners'
        }
      });
    } catch (err) {
      toast(`Error: ${file.name}`);
      return;
    }
  }

  toast(`${files.length} winner photos uploaded ✓`);
  $('#winnersFileInput').value = '';
  refreshAll();
});

/* ── NEWS & ALERTS ────────────────────────────────── */
function renderNews() {
  const tbody = $('#newsTable');
  const items = (ADMIN.data.NewsAlerts || []).sort((a, b) => (a.sortOrder || 999) - (b.sortOrder || 999));

  if (!items.length) {
    tbody.innerHTML = '<tr><td colspan="5" class="muted">No news items yet.</td></tr>';
    return;
  }

  tbody.innerHTML = items.map(item => `
    <tr>
      <td style="font-weight:600">${item.title || ''}</td>
      <td>${item.date || ''}</td>
      <td><span class="pill">${item.iconType || 'info'}</span></td>
      <td><span class="pill" style="${item.status === 'Active' ? 'color:var(--green);background:rgba(34,197,94,.12)' : ''}">${item.status || 'Inactive'}</span></td>
      <td><button class="btn outline" onclick="editNews(${JSON.stringify(item).replace(/"/g, '&quot;')})">Edit</button> <button class="btn outline danger" onclick='deleteRow("NewsAlerts","${item.id||''}");'>Delete</button></td>
    </tr>
  `).join('');
}

$('#saveNewsBtn').addEventListener('click', async () => {
  const data = {
    id: `NEWS-${Date.now().toString(36).toUpperCase()}`,
    title: $('#newsTitle').value,
    date: $('#newsDate').value,
    description: $('#newsDesc').value,
    iconType: $('#newsIcon').value,
    status: $('#newsStatus').value,
    sortOrder: parseInt($('#newsSort').value) || 0
  };

  if (!data.title || !data.date) return toast('Fill in title and date');

  try {
    await api('upsertRow', { sheet: 'NewsAlerts', data });
    toast('News saved ✓');
    $('#newsForm').reset();
    refreshAll();
  } catch (err) {
    toast(err.message);
  }
});

window.editNews = function(item) {
  $('#newsTitle').value = item.title || '';
  $('#newsDate').value = item.date || '';
  $('#newsDesc').value = item.description || '';
  $('#newsIcon').value = item.iconType || 'info';
  $('#newsStatus').value = item.status || 'Active';
  $('#newsSort').value = item.sortOrder || 0;
  $('button[data-panel="news"]').click();
  $('#newsTitle').focus();
};

/* ── SETTINGS ──────────────────────────────────────── */
$('#saveSettingsBtn').addEventListener('click', async () => {
  const data = {
    contactPhone: $('#settingsPhone').value,
    contactEmail: $('#settingsEmail').value,
    registrationStatus: $('#settingsRegStatus').value
  };

  try {
    await api('saveSettings', { settings: data });
    toast('Settings saved ✓');
  } catch (err) {
    toast(err.message);
  }
});

/* ── DELETE ROW HELPER ──────────────────────────────── */
window.deleteRow = async (sheet, id) => {
  if (!id) return toast('Row has no id');
  if (!confirm(`Delete this item from ${sheet}?`)) return;
  try {
    await api('deleteRow', { sheet, id });
    toast('Deleted ✓');
    refreshAll();
  } catch (err) {
    toast(err.message);
  }
};

/* ── IMAGE COMPRESSION ────────────────────────────── */
async function compressImage(file, maxWidth, maxHeight, quality) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let w = img.width;
        let h = img.height;

        if (w > h) {
          if (w > maxWidth) {
            h = Math.round((h * maxWidth) / w);
            w = maxWidth;
          }
        } else {
          if (h > maxHeight) {
            w = Math.round((w * maxHeight) / h);
            h = maxHeight;
          }
        }

        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);

        canvas.toBlob(
          (blob) => {
            const r = new FileReader();
            r.onload = () => resolve(r.result.split(',')[1]);
            r.readAsDataURL(blob);
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/* ── DRAG & DROP REORDERING ────────────────────────── */
function setupDragDrop(type) {
  const items = document.querySelectorAll(`.sortable-item[data-type="${type}"]`);
  let draggedItem = null;

  items.forEach(item => {
    item.draggable = true;
    item.addEventListener('dragstart', (e) => {
      draggedItem = item;
      item.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });

    item.addEventListener('dragend', () => {
      item.classList.remove('dragging');
      saveSortOrder(type);
    });

    item.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      if (draggedItem && draggedItem !== item) {
        const rect = item.getBoundingClientRect();
        const nextItem = (e.clientY - rect.top) / rect.height > 0.5 ? item.nextSibling : item;
        item.parentNode.insertBefore(draggedItem, nextItem);
      }
    });
  });
}

async function saveSortOrder(type) {
  const items = document.querySelectorAll(`.sortable-item[data-type="${type}"]`);
  const order = Array.from(items).map((item, idx) => ({
    id: item.dataset.id,
    sortOrder: idx
  }));

  try {
    for (const item of order) {
      const sheet = type === 'coach' ? 'Coaches' : type === 'gallery' ? 'GalleryMedia' : 'TournamentWinners';
      await api('upsertRow', { sheet, data: { id: item.id, sortOrder: item.sortOrder } });
    }
    toast('Order saved ✓');
  } catch (err) {
    toast(`Error saving order: ${err.message}`);
  }
}

/* ── INIT ON LOAD ──────────────────────────────────── */
window.addEventListener('load', () => {
  if (sessionStorage.getItem('rsaAdminAuth2026') === '1') {
    refreshAll();
  }
});

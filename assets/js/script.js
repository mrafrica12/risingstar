/**
 * Rising Stars Atlanta — Main Script
 * Modular, lightweight, mobile-first
 * ─────────────────────────────────────────────────────
 */

/* ─────────────────────────────────────────────────────
   CONFIG  — update these values before deploying
───────────────────────────────────────────────────── */
const CONFIG = {
  GAS_ENDPOINT:      'https://script.google.com/macros/s/AKfycbyEFeyDAPkPqWUJ-FMmMzAofbrzV0HsKXZygO_70pOeh4ecHubT8eu1NDJTNh-sETyO/exec',
  TOURNAMENT_DATE:   '2026-07-18T09:00:00',
  SLIDESHOW_INTERVAL: 6000,
  FORM_TIMEOUT:       12000,
};

/* ─────────────────────────────────────────────────────
   BOOT
───────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initMobileMenu();
  initHeroSlides();
  initCountdown();
  initScrollReveal();
  initCounters();
  initTestimonials();
  initForm();
});

/* ─────────────────────────────────────────────────────
   NAV — scroll state + sticky CTA
───────────────────────────────────────────────────── */
function initNav() {
  const nav      = document.getElementById('nav');
  const stickyCta = document.getElementById('stickyCta');
  const stickyCtaLink = stickyCta?.querySelector('a');
  if (!nav) return;

  const onScroll = () => {
    const y = window.scrollY;
    nav.classList.toggle('scrolled', y > 40);
    if (stickyCta) {
      const visible = y > 500;
      stickyCta.classList.toggle('visible', visible);
      stickyCta.setAttribute('aria-hidden', visible ? 'false' : 'true');
      if (stickyCtaLink) stickyCtaLink.tabIndex = visible ? 0 : -1;
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // run once on load
}

/* ─────────────────────────────────────────────────────
   MOBILE MENU
───────────────────────────────────────────────────── */
function initMobileMenu() {
  const toggle = document.getElementById('navToggle');
  const menu   = document.getElementById('mobileMenu');
  if (!toggle || !menu) return;

  const focusable = () => Array.from(menu.querySelectorAll('a[href], button:not([disabled])'));

  const open  = () => {
    menu.hidden = false;
    requestAnimationFrame(() => menu.classList.add('open'));
    toggle.classList.add('active');
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Close navigation menu');
    document.body.style.overflow = 'hidden';
    window.setTimeout(() => {
      const firstLink = focusable()[0];
      if (firstLink) firstLink.focus();
    }, 60);
  };

  const close = () => {
    menu.classList.remove('open');
    toggle.classList.remove('active');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open navigation menu');
    document.body.style.overflow = '';
    window.setTimeout(() => { if (!menu.classList.contains('open')) menu.hidden = true; }, 400);
  };

  toggle.addEventListener('click', () => menu.classList.contains('open') ? close() : open());

  // Close button inside the mobile menu
  const mmClose = document.getElementById('mmClose');
  if (mmClose) mmClose.addEventListener('click', close);

  // Close on any menu link click
  menu.querySelectorAll('a').forEach(a => a.addEventListener('click', close));

  // Close on Escape
  document.addEventListener('keydown', e => {
    if (!menu.classList.contains('open')) return;
    if (e.key === 'Escape') {
      close();
      toggle.focus();
    }
    if (e.key === 'Tab') {
      const items = focusable();
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });

  // Close on backdrop tap
  menu.addEventListener('click', e => { if (e.target === menu) close(); });
}

/* ─────────────────────────────────────────────────────
   HERO SLIDES — Ken Burns slideshow
───────────────────────────────────────────────────── */
function initHeroSlides() {
  const slides = document.querySelectorAll('.hero-slide');
  if (slides.length < 2) return;

  let cur = 0;

  setInterval(() => {
    slides[cur].classList.remove('active');
    cur = (cur + 1) % slides.length;
    const next = slides[cur];
    // Force reflow so animation replays
    next.style.animation = 'none';
    next.offsetHeight;      // trigger reflow
    next.style.animation = '';
    next.classList.add('active');
  }, CONFIG.SLIDESHOW_INTERVAL);
}

/* ─────────────────────────────────────────────────────
   COUNTDOWN — tournament date timer
───────────────────────────────────────────────────── */
function initCountdown() {
  const els = {
    d: document.getElementById('cd-days'),
    h: document.getElementById('cd-hours'),
    m: document.getElementById('cd-mins'),
    s: document.getElementById('cd-secs'),
  };
  if (!els.d) return;

  const target = new Date(CONFIG.TOURNAMENT_DATE).getTime();

  const pad   = n => String(n).padStart(2, '0');
  const tick  = () => {
    const diff = Math.max(0, target - Date.now());
    els.d.textContent = pad(Math.floor(diff / 86400000));
    els.h.textContent = pad(Math.floor((diff % 86400000) / 3600000));
    els.m.textContent = pad(Math.floor((diff % 3600000) / 60000));
    els.s.textContent = pad(Math.floor((diff % 60000) / 1000));
  };

  tick();
  setInterval(tick, 1000);
}

/* ─────────────────────────────────────────────────────
   SCROLL REVEAL — IntersectionObserver fade-up
───────────────────────────────────────────────────── */
function initScrollReveal() {
  const items = document.querySelectorAll('.reveal');
  if (!items.length) return;

  const obs = new IntersectionObserver(
    entries => entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        obs.unobserve(e.target);
      }
    }),
    { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
  );

  items.forEach(el => obs.observe(el));
}

/* ─────────────────────────────────────────────────────
   COUNTERS — animated stat numbers
───────────────────────────────────────────────────── */
function initCounters() {
  const els = document.querySelectorAll('.stat-num[data-target]');
  if (!els.length) return;

  const animate = el => {
    const target = +el.dataset.target;
    const dur    = 2000;
    const start  = Date.now();
    const suffix = target >= 100 ? '+' : '';
    const run = () => {
      const p  = Math.min(1, (Date.now() - start) / dur);
      const e  = 1 - Math.pow(1 - p, 3); // ease-out cubic
      el.textContent = Math.round(e * target) + suffix;
      if (p < 1) requestAnimationFrame(run);
    };
    run();
  };

  const obs = new IntersectionObserver(
    entries => entries.forEach(e => {
      if (e.isIntersecting) { animate(e.target); obs.unobserve(e.target); }
    }),
    { threshold: 0.5 }
  );

  els.forEach(el => obs.observe(el));
}

/* ─────────────────────────────────────────────────────
   TESTIMONIALS — touch-enabled slider
───────────────────────────────────────────────────── */
function initTestimonials() {
  const track = document.getElementById('testiTrack');
  const prev  = document.getElementById('testiPrev');
  const next  = document.getElementById('testiNext');
  if (!track) return;

  const cards = track.querySelectorAll('.testi-card');
  let idx = 0;
  let touchStart = 0;

  const slideTo = i => {
    idx = (i + cards.length) % cards.length;
    const w = cards[0].offsetWidth + 2; // +2 for gap
    track.style.transform = `translateX(-${idx * w}px)`;
  };

  if (prev) prev.addEventListener('click', () => slideTo(idx - 1));
  if (next) next.addEventListener('click', () => slideTo(idx + 1));

  // Touch swipe
  track.addEventListener('touchstart', e => { touchStart = e.touches[0].clientX; }, { passive: true });
  track.addEventListener('touchend',   e => {
    const delta = touchStart - e.changedTouches[0].clientX;
    if (Math.abs(delta) > 50) slideTo(delta > 0 ? idx + 1 : idx - 1);
  });

  // Auto-slide every 8s
  setInterval(() => slideTo(idx + 1), 8000);
}

/* ─────────────────────────────────────────────────────
   FORM — validation + Google Sheets
───────────────────────────────────────────────────── */
function initForm() {
  const form    = document.getElementById('registerForm');
  const success = document.getElementById('formSuccess');
  if (!form) return;

  form.addEventListener('input', e => {
    const field = e.target.closest('input, select, textarea');
    if (field) validateField(field, false);
  });

  form.addEventListener('change', e => {
    const field = e.target.closest('input, select, textarea');
    if (field) validateField(field, false);
  });

  form.addEventListener('submit', async e => {
    e.preventDefault();

    // Honeypot check (spam bots fill hidden fields)
    if (form.querySelector('[name="website"]')?.value) return;

    if (!validateForm(form)) return;

    const btn = form.querySelector('[type="submit"]');
    const origLabel = btn.innerHTML;
    btn.disabled   = true;
    btn.innerHTML  = 'Submitting…';
    setFormMessage(form, '');

    const payload = buildPayload(form);

    try {
      await submitToGoogleAppsScript(payload);
      showFormSuccess(form, success, payload);
    } catch (err) {
      btn.disabled  = false;
      btn.innerHTML = origLabel;
      showFormError(form, err.message);
    }
  });
}

function validateForm(form) {
  let valid = true;

  form.querySelectorAll('[required]').forEach(field => {
    if (!validateField(field, true)) valid = false;
  });

  if (!valid) {
    const firstInvalid = form.querySelector('.invalid');
    firstInvalid?.focus();
    firstInvalid?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  return valid;
}

function validateField(field, showError) {
  if (field.name === 'website') return true;

  const value = field.value.trim();
  let message = '';

  if (field.required && !value) {
    message = 'Required';
  } else if (field.type === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    message = 'Enter a valid email';
  } else if (field.type === 'tel' && value && value.replace(/\D/g, '').length < 10) {
    message = 'Enter a valid phone number';
  }

  const group = field.closest('.form-field');
  const err = group?.querySelector('.form-field-error');
  const invalid = Boolean(message);

  field.classList.toggle('invalid', invalid);
  field.setAttribute('aria-invalid', invalid ? 'true' : 'false');
  group?.classList.toggle('has-error', invalid);
  if (err) err.textContent = showError || invalid ? message : '';

  return !invalid;
}

function buildPayload(form) {
  const fd = new FormData(form);
  return {
    regId:       'RSA-' + Date.now().toString(36).toUpperCase(),
    timestamp:   new Date().toISOString(),
    formType:    'Quick Registration',
    source:      'homepage',
    parentName:  fd.get('parentName')  || '',
    playerName:  fd.get('playerName')  || '',
    email:       fd.get('email')       || '',
    phone:       fd.get('phone')       || '',
    ageGroup:    fd.get('ageGroup')    || '',
    program:     fd.get('program')     || '',
    pageUrl:      window.location.href,
    userAgent:    navigator.userAgent,
    status:      'New Registration',
  };
}

function showFormSuccess(form, successEl, payload) {
  form.style.display = 'none';
  if (!successEl) return;
  successEl.hidden = false;
  const refEl = successEl.querySelector('.success-ref');
  if (refEl) refEl.textContent = payload.regId;
  successEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function showFormError(form, message) {
  const fallback = 'We could not save your registration. Please try again or contact us by phone or email.';
  const errEl = form.querySelector('.form-error-msg');
  if (errEl) {
    errEl.textContent = message || fallback;
    errEl.style.display = 'block';
  } else {
    alert(message || fallback);
  }
}

function setFormMessage(form, message) {
  const errEl = form.querySelector('.form-error-msg');
  if (!errEl) return;
  errEl.textContent = message;
  errEl.style.display = message ? 'block' : 'none';
}

function submitToGoogleAppsScript(payload) {
  const endpoint = CONFIG.GAS_ENDPOINT || (window.RSA_CMS_CONFIG && window.RSA_CMS_CONFIG.PUBLIC_API_URL) || '';

  if (!endpoint) {
    return Promise.reject(new Error('Registration is not connected yet. Please contact us by phone or email.'));
  }

  return new Promise((resolve, reject) => {
    const token = payload.regId;
    const iframeName = `gas_iframe_${token}`;
    const iframe = document.createElement('iframe');
    const form = document.createElement('form');
    let settled = false;

    const cleanup = () => {
      window.removeEventListener('message', onMessage);
      iframe.remove();
      form.remove();
    };

    const finish = (fn, value) => {
      if (settled) return;
      settled = true;
      cleanup();
      fn(value);
    };

    const timer = window.setTimeout(() => {
      finish(reject, new Error('The registration service did not respond. Please try again.'));
    }, CONFIG.FORM_TIMEOUT);

    const onMessage = event => {
      const data = event.data || {};
      if (data.source !== 'rising-stars-registration' || data.token !== token) return;
      window.clearTimeout(timer);
      if (data.ok) {
        finish(resolve, data);
      } else {
        finish(reject, new Error(data.error || 'The registration could not be saved.'));
      }
    };

    window.addEventListener('message', onMessage);

    iframe.name = iframeName;
    iframe.hidden = true;
    form.hidden = true;
    form.method = 'POST';
    form.action = endpoint;
    form.target = iframeName;

    Object.entries({ ...payload, token }).forEach(([name, value]) => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = name;
      input.value = value == null ? '' : String(value);
      form.appendChild(input);
    });

    document.body.append(iframe, form);
    form.submit();
  });
}

/* ═══════════════════════════════════════════════════════
   RISING STARS ATLANTA — Mobile Bottom Navigation Script
   Handles tab switching, active states, and menu dropdown
═══════════════════════════════════════════════════════ */

(function() {
  'use strict';

  // ── CONFIGURATION ────────────────────────────────
  const NAV_CONFIG = {
    breakpoint: 768, // Mobile breakpoint
    activeClass: 'active',
    menuDropdownId: 'mobileMenuDropdown',
    menuButtonClass: 'mobile-nav-menu'
  };

  // ── PAGE MAPPING ─────────────────────────────────
  const PAGE_MAP = {
    'index.html': 'home',
    '/': 'home',
    'pages/tournaments.html': 'tournaments',
    'pages/programs.html': 'programs',
    'pages/gallery.html': 'gallery',
    'pages/about.html': 'menu',
    'pages/schedules.html': 'menu',
    'pages/resources.html': 'menu',
    'pages/merchandise.html': 'menu',
    'pages/partner.html': 'menu'
  };

  // ── DOM HELPERS ──────────────────────────────────
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  // ── DETERMINE CURRENT PAGE ───────────────────────
  function getCurrentPage() {
    let pathname = window.location.pathname;

    // Handle different path formats
    if (pathname === '/' || pathname.endsWith('index.html')) return 'home';
    if (pathname.includes('tournaments')) return 'tournaments';
    if (pathname.includes('programs')) return 'programs';
    if (pathname.includes('gallery')) return 'gallery';

    // Default to menu for other pages
    return 'menu';
  }

  // ── SET ACTIVE NAV ITEM ──────────────────────────
  function setActiveNav(tab) {
    // Remove active from all
    $$('.mobile-nav-item').forEach(item => {
      item.classList.remove(NAV_CONFIG.activeClass);
      item.setAttribute('aria-current', 'false');
    });

    // Add active to current
    const activeItem = $(`[data-nav-tab="${tab}"]`);
    if (activeItem) {
      activeItem.classList.add(NAV_CONFIG.activeClass);
      activeItem.setAttribute('aria-current', 'page');
    }

    // Close menu dropdown if open
    closeMenuDropdown();
  }

  // ── TOGGLE MENU DROPDOWN ─────────────────────────
  function toggleMenuDropdown() {
    const dropdown = $(`#${NAV_CONFIG.menuDropdownId}`);
    if (!dropdown) return;

    const isOpen = dropdown.classList.contains('open');
    if (isOpen) {
      closeMenuDropdown();
    } else {
      openMenuDropdown();
    }
  }

  function openMenuDropdown() {
    const dropdown = $(`#${NAV_CONFIG.menuDropdownId}`);
    if (dropdown) {
      dropdown.classList.add('open');
      $(`[data-nav-tab="menu"]`)?.setAttribute('aria-expanded', 'true');
    }
  }

  function closeMenuDropdown() {
    const dropdown = $(`#${NAV_CONFIG.menuDropdownId}`);
    if (dropdown) {
      dropdown.classList.remove('open');
      $(`[data-nav-tab="menu"]`)?.setAttribute('aria-expanded', 'false');
    }
  }

  // ── HANDLE NAV CLICKS ────────────────────────────
  function handleNavClick(e) {
    const item = e.target.closest('.mobile-nav-item');
    if (!item) return;

    const tab = item.dataset.navTab;
    if (!tab) return;

    if (tab === 'menu') {
      e.preventDefault();
      toggleMenuDropdown();
    } else {
      // Navigate to page
      const href = item.getAttribute('href');
      if (href) {
        window.location.href = href;
      }
      setActiveNav(tab);
      closeMenuDropdown();
    }
  }

  // ── HANDLE MENU LINK CLICKS ──────────────────────
  function handleMenuLinkClick(e) {
    const link = e.target.closest('.mobile-menu-link');
    if (link) {
      closeMenuDropdown();
      setActiveNav('menu');
    }
  }

  // ── CLOSE MENU ON OUTSIDE CLICK ──────────────────
  function handleOutsideClick(e) {
    const nav = $('.mobile-bottom-nav');
    const dropdown = $(`#${NAV_CONFIG.menuDropdownId}`);

    if (!nav || !dropdown) return;
    if (!nav.contains(e.target) && !dropdown.contains(e.target)) {
      closeMenuDropdown();
    }
  }

  // ── INIT ─────────────────────────────────────────
  function init() {
    // Check if on mobile
    if (window.innerWidth > NAV_CONFIG.breakpoint) return;

    // Set initial active tab
    const currentPage = getCurrentPage();
    setActiveNav(currentPage);

    // Event listeners
    $$('.mobile-nav-item').forEach(item => {
      item.addEventListener('click', handleNavClick);
    });

    $$('.mobile-menu-link').forEach(link => {
      link.addEventListener('click', handleMenuLinkClick);
    });

    document.addEventListener('click', handleOutsideClick);

    // Handle resize
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        closeMenuDropdown();
      }, 150);
    });

    // Handle escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeMenuDropdown();
      }
    });
  }

  // ── RUN ON LOAD ──────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ── EXPOSE PUBLIC API ────────────────────────────
  window.MobileNav = {
    setActive: setActiveNav,
    openMenu: openMenuDropdown,
    closeMenu: closeMenuDropdown,
    toggleMenu: toggleMenuDropdown
  };
})();

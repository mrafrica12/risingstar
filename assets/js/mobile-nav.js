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
    tournamentMenuId: 'mobileTournamentMenu',
    menuButtonClass: 'mobile-nav-menu'
  };

  const TOURNAMENT_LINKS = [
    ['All Tournaments', 'tournaments.html'],
    ['Memorial Day 5v5', 'tournaments.html#memorial-day-5v5'],
    ['Summer Elite 5v5', 'tournaments.html#summer-elite-5v5'],
    ['Championship Cup 5v5', 'tournaments.html#championship-cup-5v5'],
    ['Elite 7v7 Summer Series', 'tournaments.html#elite-7v7-summer'],
    ['Labor Day 5v5', 'tournaments.html#labor-day-5v5'],
    ['Winter Elite 5v5', 'tournaments.html#winter-elite-5v5']
  ];

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
    closeTournamentMenu();
  }

  function getPagePrefix() {
    const path = window.location.pathname;
    const inPagesDir = path.includes('/pages/');
    return inPagesDir ? '' : 'pages/';
  }

  function pageHref(path) {
    if (/^(?:[a-z]+:|\/\/|#|\/)/i.test(path)) return path;
    return `${getPagePrefix()}${path}`;
  }

  function ensureTournamentMenu() {
    let menu = $(`#${NAV_CONFIG.tournamentMenuId}`);
    if (menu) return menu;

    menu = document.createElement('div');
    menu.className = 'mobile-tournament-menu';
    menu.id = NAV_CONFIG.tournamentMenuId;
    menu.setAttribute('role', 'menu');
    menu.setAttribute('aria-label', 'Tournament links');
    menu.innerHTML = `
      <div class="mobile-menu-section">
        <div class="mobile-menu-section-title">Tournaments</div>
        ${TOURNAMENT_LINKS.map(([label, href]) => (
          `<a href="${pageHref(href)}" class="mobile-menu-link" role="menuitem">${label}</a>`
        )).join('')}
      </div>
    `;

    document.body.appendChild(menu);
    $(`[data-nav-tab="tournaments"]`)?.setAttribute('aria-haspopup', 'menu');
    $(`[data-nav-tab="tournaments"]`)?.setAttribute('aria-expanded', 'false');
    menu.querySelectorAll('.mobile-menu-link').forEach(link => {
      link.addEventListener('click', () => {
        closeTournamentMenu();
        setActiveNav('tournaments');
      });
    });

    return menu;
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
      closeTournamentMenu();
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

  function toggleTournamentMenu() {
    const menu = ensureTournamentMenu();
    const isOpen = menu.classList.contains('open');
    if (isOpen) {
      closeTournamentMenu();
    } else {
      openTournamentMenu();
    }
  }

  function openTournamentMenu() {
    const menu = ensureTournamentMenu();
    closeMenuDropdown();
    menu.classList.add('open');
    $(`[data-nav-tab="tournaments"]`)?.setAttribute('aria-expanded', 'true');
  }

  function closeTournamentMenu() {
    const menu = $(`#${NAV_CONFIG.tournamentMenuId}`);
    if (menu) {
      menu.classList.remove('open');
      $(`[data-nav-tab="tournaments"]`)?.setAttribute('aria-expanded', 'false');
      if (getCurrentPage() !== 'tournaments') {
        const tournamentItem = $(`[data-nav-tab="tournaments"]`);
        const currentItem = $(`[data-nav-tab="${getCurrentPage()}"]`);
        tournamentItem?.classList.remove(NAV_CONFIG.activeClass);
        tournamentItem?.setAttribute('aria-current', 'false');
        currentItem?.classList.add(NAV_CONFIG.activeClass);
        currentItem?.setAttribute('aria-current', 'page');
      }
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
    } else if (tab === 'tournaments') {
      e.preventDefault();
      $$('.mobile-nav-item').forEach(navItem => {
        navItem.classList.remove(NAV_CONFIG.activeClass);
        navItem.setAttribute('aria-current', 'false');
      });
      item.classList.add(NAV_CONFIG.activeClass);
      item.setAttribute('aria-current', 'page');
      toggleTournamentMenu();
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
    const tournamentMenu = $(`#${NAV_CONFIG.tournamentMenuId}`);

    if (!nav) return;
    const clickedMenu = dropdown && dropdown.contains(e.target);
    const clickedTournamentMenu = tournamentMenu && tournamentMenu.contains(e.target);
    if (!nav.contains(e.target) && !clickedMenu && !clickedTournamentMenu) {
      closeMenuDropdown();
      closeTournamentMenu();
    }
  }

  // ── INIT ─────────────────────────────────────────
  function init() {
    // Set initial active tab
    const currentPage = getCurrentPage();
    setActiveNav(currentPage);
    ensureTournamentMenu();

    // Event listeners
    $$('.mobile-nav-item').forEach(item => {
      item.addEventListener('click', handleNavClick);
    });

    const menuDropdown = $(`#${NAV_CONFIG.menuDropdownId}`);
    const menuLinks = menuDropdown ? Array.from(menuDropdown.querySelectorAll('.mobile-menu-link')) : [];
    menuLinks.forEach(link => {
      link.addEventListener('click', handleMenuLinkClick);
    });

    document.addEventListener('click', handleOutsideClick);

    // Handle resize
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        closeMenuDropdown();
        closeTournamentMenu();
      }, 150);
    });

    // Handle escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeMenuDropdown();
        closeTournamentMenu();
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
    toggleMenu: toggleMenuDropdown,
    openTournaments: openTournamentMenu,
    closeTournaments: closeTournamentMenu,
    toggleTournaments: toggleTournamentMenu
  };
})();

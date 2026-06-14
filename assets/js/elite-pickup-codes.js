/* ═══════════════════════════════════════════════════════
   RISING STARS ATLANTA — Elite Pickup Invite Code Validator
   Validates invite codes and reveals registration link
═══════════════════════════════════════════════════════ */

(function() {
  'use strict';

  const STORAGE_KEY = 'risingStars_elitePickupCodes';
  const STORAGE_LINK_KEY = 'risingStars_elitePickupLink';
  const VERIFIED_KEY = 'risingStars_elitePickupVerified';

  // Get codes from localStorage
  function getCodes() {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  // Get registration link from localStorage
  function getRegistrationLink() {
    return localStorage.getItem(STORAGE_LINK_KEY) || '';
  }

  // Validate entered code
  function validateCode(enteredCode) {
    const codes = getCodes();
    const normalized = (enteredCode || '').trim().toUpperCase();

    if (!normalized) {
      return { valid: false, message: 'Please enter a code.' };
    }

    const codeData = codes.find(c => c.code.toUpperCase() === normalized);

    if (!codeData) {
      return { valid: false, message: 'Invalid code. Please check and try again.' };
    }

    if (codeData.status !== 'active') {
      return { valid: false, message: 'This code is no longer active.' };
    }

    // Check usage limit
    if (codeData.limit > 0 && codeData.used >= codeData.limit) {
      return { valid: false, message: 'This code has reached its limit.' };
    }

    return { valid: true, message: 'Code verified! ✓', code: codeData };
  }

  // Reveal registration link
  function revealRegistrationLink() {
    const link = getRegistrationLink();
    if (!link) {
      showMessage('Registration link not yet configured. Please contact staff.', 'error');
      return false;
    }

    const container = document.getElementById('registrationContainer');
    const linkElement = document.getElementById('elitePickupLink');

    if (container && linkElement) {
      container.style.display = 'block';
      linkElement.href = link;
      linkElement.textContent = 'Register Elite Pickup ↗';
    }

    return true;
  }

  // Show message to user
  function showMessage(text, type = 'info') {
    const msg = document.getElementById('codeMessage');
    if (msg) {
      msg.textContent = text;
      msg.style.color = type === 'error' ? '#ef4444' : type === 'success' ? '#22c55e' : 'rgba(255,255,255,.52)';
    }
  }

  // Handle code verification
  function handleCodeVerification(e) {
    e.preventDefault();

    const input = document.getElementById('eliteCodeInput');
    if (!input) return;

    const enteredCode = input.value.trim().toUpperCase();
    const result = validateCode(enteredCode);

    if (result.valid) {
      // Mark as verified in session
      sessionStorage.setItem(VERIFIED_KEY, 'true');
      sessionStorage.setItem('lastVerifiedCode', result.code.code);

      showMessage('Code verified! Redirecting to registration... ✓', 'success');
      input.value = '';

      // Reveal registration link
      setTimeout(() => revealRegistrationLink(), 300);
    } else {
      showMessage(result.message, 'error');
      input.value = '';
    }
  }

  // Auto-verify if already verified in this session
  function checkSessionVerification() {
    if (sessionStorage.getItem(VERIFIED_KEY) === 'true') {
      revealRegistrationLink();
    }
  }

  // Initialize
  function init() {
    const validateBtn = document.getElementById('validateCodeBtn');
    const codeInput = document.getElementById('eliteCodeInput');

    if (validateBtn) {
      validateBtn.addEventListener('click', handleCodeVerification);
    }

    if (codeInput) {
      codeInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          handleCodeVerification(e);
        }
      });
    }

    // Check if already verified in this session
    checkSessionVerification();
  }

  // Run on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose API for admin panel
  window.ElitePickupCodes = {
    validate: validateCode,
    getCodes: getCodes,
    getLink: getRegistrationLink,
    revealLink: revealRegistrationLink
  };
})();

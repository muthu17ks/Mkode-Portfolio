/**
 * ==========================================================================
 * Main Application Script
 * Handles global UI interactions, animations, theme management, and forms.
 * ==========================================================================
 */

'use strict';

/**
 * Module: Theme Management System
 */
(function () {
  const root = document.documentElement;
  const savedTheme = localStorage.getItem('theme') || 'light';
  const toggleBtn = document.getElementById('theme-toggle');

  root.classList.add(savedTheme === 'dark' ? 'dark-theme' : 'light-theme');

  function updateIcon(theme) {
    if (!toggleBtn) return;
    toggleBtn.innerHTML = theme === 'dark'
      ? '<i data-lucide="moon"></i>'
      : '<i data-lucide="sun"></i>';
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
      lucide.createIcons();
    }
  }

  updateIcon(savedTheme);

  if (!toggleBtn) return;

  toggleBtn.addEventListener('click', () => {
    const isDark = root.classList.contains('dark-theme');
    const nextTheme = isDark ? 'light' : 'dark';
    root.classList.toggle('dark-theme', !isDark);
    root.classList.toggle('light-theme', isDark);
    localStorage.setItem('theme', nextTheme);
    updateIcon(nextTheme);
  });
})();

/**
 * Module: Navigation Router & Mobile Text Updater
 */
(function () {
  const nav = document.querySelector('.navbar__menu');
  const mobileBtn = document.getElementById('mobile-menu-btn');
  const mobileBtnText = mobileBtn ? mobileBtn.querySelector('.btn-text') : null;

  if (!nav) return;

  const homeUrl = nav.dataset.homeUrl || '/';
  const homePath = new URL(homeUrl, location.origin).pathname;
  const links = Array.from(nav.querySelectorAll('a[href^="#"]'));
  const linkMap = new Map(links.map((a) => [a.getAttribute('href'), a]));
  const sections = Array.from(document.querySelectorAll('section[id]'));

  if (mobileBtn) {
    mobileBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = nav.classList.toggle('is-open');
      mobileBtn.setAttribute('aria-expanded', isOpen);
      if (!isOpen) updateActiveState();
    });

    document.addEventListener('click', (e) => {
      if (nav.classList.contains('is-open') && !nav.contains(e.target) && e.target !== mobileBtn) {
        nav.classList.remove('is-open');
        mobileBtn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  function updateMobileText(text) {
    if (mobileBtnText) mobileBtnText.textContent = text || 'Menu';
  }

  function clearActive() {
    links.forEach((a) => {
      a.classList.remove('is-active');
      a.removeAttribute('aria-current');
    });
  }

  function setActiveHash(hash) {
    if (!hash) return;
    const link = linkMap.get(hash);
    clearActive();
    if (link) {
      link.classList.add('is-active');
      link.setAttribute('aria-current', 'page');
      updateMobileText(link.textContent);
    } else {
      updateMobileText('Menu');
    }
  }

  nav.addEventListener('click', (ev) => {
    const el = ev.target.closest('a[href^="#"]');
    if (!el) return;
    nav.classList.remove('is-open');
    if (mobileBtn) mobileBtn.setAttribute('aria-expanded', 'false');
    ev.preventDefault();
    const href = el.getAttribute('href');

    if (location.pathname !== homePath) {
      location.href = homeUrl + href;
      return;
    }
    const target = document.querySelector(href);
    if (target) {
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
      history.pushState(null, '', href);
      setActiveHash(href);
    }
  });

  function updateActiveState() {
    if (window.scrollY < 50) {
      const homeLink = linkMap.get('#main');
      if (homeLink) setActiveHash('#main');
      else {
        clearActive();
        updateMobileText('Menu');
      }
      return;
    }
    let current = null;
    const scrollPos = window.scrollY + window.innerHeight * 0.35;
    for (const sec of sections) {
      const top = sec.offsetTop;
      const bottom = top + sec.offsetHeight;
      if (scrollPos >= top && scrollPos < bottom) {
        current = '#' + sec.id;
        break;
      }
    }
    if (current) setActiveHash(current);
  }

  if ('IntersectionObserver' in window && sections.length) {
    const observer = new IntersectionObserver((entries) => {
      const visible = entries
        .filter(e => e.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) setActiveHash('#' + visible.target.id);
    }, { rootMargin: '-40% 0px -50% 0px', threshold: [0, 0.25, 0.5] });
    sections.forEach(s => observer.observe(s));
  } else {
    window.addEventListener('scroll', updateActiveState, { passive: true });
  }

  window.addEventListener('load', () => {
    if (location.hash) setActiveHash(location.hash);
    else updateActiveState();
  });
})();

/**
 * Module: Back-To-Top Utility
 */
(function () {
  const btn = document.getElementById('to-top');
  if (!btn) return;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function onScroll() {
    if (window.scrollY > 200) btn.classList.add('to-top--visible');
    else btn.classList.remove('to-top--visible');
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  });
})();

/**
 * Module: Scroll Reveal Animations
 */
(function () {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return;

  const autoAnimConfig = [
    { sel: '.hero__title', cls: 'reveal-up' },
    { sel: '.hero__role', cls: 'reveal-up', delay: 'delay-100' },
    { sel: '.hero__blurb', cls: 'reveal-up', delay: 'delay-200' },
    { sel: '.hero__cta', cls: 'reveal-up', delay: 'delay-300' },
    { sel: '.hero__avatar', cls: 'reveal-in', delay: 'delay-300' },
    { sel: '.section-title', cls: 'reveal-up' },
    { sel: '.section-subtitle, .section-description', cls: 'reveal-up', delay: 'delay-100' },
    { sel: '.about__story', cls: 'reveal-up', delay: 'delay-200' },
    { sel: '.about__visual', cls: 'reveal-in', delay: 'delay-200' },
    { sel: '.tech-item', cls: 'reveal-in', stagger: 50 },
    { sel: '.award-card', cls: 'reveal-up', stagger: 100 },
    { sel: '.contact-layout', cls: 'reveal-up' },
  ];

  autoAnimConfig.forEach((config) => {
    const elements = document.querySelectorAll(config.sel);
    elements.forEach((el, index) => {
      el.classList.add(config.cls);
      if (config.delay) el.classList.add(config.delay);
      if (config.stagger) el.style.transitionDelay = `${index * config.stagger}ms`;
    });
  });

  // Use class based staggered reveal for projects
  const projects = document.querySelectorAll('.project-card');
  projects.forEach((el, index) => {
    el.classList.add(index % 2 === 0 ? 'reveal-from-left' : 'reveal-from-right');
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-revealed');
        observer.unobserve(entry.target);
      }
    });
  }, { root: null, rootMargin: '0px 0px -10% 0px', threshold: 0.1 });

  const animatedElements = document.querySelectorAll('.reveal-up, .reveal-in, .reveal-from-left, .reveal-from-right');
  animatedElements.forEach((el) => observer.observe(el));
})();

/**
 * Module: Custom Cursor (Optimized)
 */
(function () {
  // STRICT CHECK: If it's a touch device, DO NOT RUN.
  if (window.matchMedia('(hover: none) and (pointer: coarse)').matches) return;

  const dot = document.querySelector('.cursor__dot');
  const ring = document.querySelector('.cursor__ring');
  const avatar = document.querySelector('.hero__avatar');

  if (!dot || !ring) return;

  let mouseX = -100, mouseY = -100;
  let ringX = -100, ringY = -100;
  let ringW = 40, ringH = 40;

  let lockedItem = null;
  let hasMoved = false;
  let isUnlocking = false;
  let isIdle = false;

  const LERP_SPEED = 0.15;

  dot.style.opacity = '0';
  ring.style.opacity = '0';

  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    if (!hasMoved) {
      ringX = mouseX; ringY = mouseY; hasMoved = true;
      dot.style.opacity = '1'; ring.style.opacity = '1';
    }

    if (isIdle) {
      isIdle = false;
      loop();
    }

    dot.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%)`;
  });

  // 1. UPDATED: Removed '.project-card' from this list
  const interactiveSelectors = [
    'a', 'button', '.btn-main', '.btn-hero-primary',
    '.hero__avatar', '.tech-item', '[role="button"]'
  ].join(',');

  function shouldIgnore(el) {
    if (!el) return true;
    if (el.hasAttribute('data-cursor-ignore')) return true;

    // 2. UPDATED: Ignore cursor logic on project media/images
    if (el.closest('.project-card__media')) return true;

    if (el.closest('.contact-form-wrapper')) {
      if (el.matches('input, textarea, select, label')) return true;
    }
    return false;
  }

  function attachCursorListeners() {
    const candidates = Array.from(document.querySelectorAll(interactiveSelectors))
      .filter((el) => !el.__cursorAttached && !shouldIgnore(el));

    candidates.forEach((el) => {
      el.__cursorAttached = true;
      el.addEventListener('mouseenter', () => { lockedItem = el; ring.classList.add('is-locked'); });
      el.addEventListener('mouseleave', () => {
        if (lockedItem === el) {
          lockedItem = null; ring.classList.remove('is-locked'); isUnlocking = true;
          el.style.transform = ''; el.style.transition = 'transform 0.3s ease';
          setTimeout(() => { isUnlocking = false; }, 200);
        }
      });
    });
  }
  attachCursorListeners();

  if ('MutationObserver' in window) {
    const mo = new MutationObserver(() => { setTimeout(attachCursorListeners, 50); });
    mo.observe(document.body, { childList: true, subtree: true });
  }

  function loop() {
    if (!hasMoved) { requestAnimationFrame(loop); return; }

    const distMoved = Math.abs(mouseX - ringX) + Math.abs(mouseY - ringY);
    const sizeDiff = Math.abs(ringW - 40) + Math.abs(ringH - 40);

    if (distMoved < 0.1 && sizeDiff < 0.5 && !lockedItem && !isUnlocking) {
      isIdle = true;
      return;
    }

    let targetX = mouseX, targetY = mouseY;
    let targetWidth = 40, targetHeight = 40;
    let targetRadius = '50%';
    let scaleX = 1, scaleY = 1, rotation = 0;

    if (lockedItem) {
      const rect = lockedItem.getBoundingClientRect();
      targetX = rect.left + rect.width / 2;
      targetY = rect.top + rect.height / 2;
      targetWidth = rect.width + 16;
      targetHeight = rect.height + 16;
      const style = window.getComputedStyle(lockedItem);
      targetRadius = style.borderRadius || '50%';

      if (lockedItem !== avatar) {
        const dx = mouseX - targetX, dy = mouseY - targetY;
        lockedItem.style.transform = `translate(${dx * 0.3}px, ${dy * 0.3}px)`;
        lockedItem.style.transition = 'transform 0.1s linear';
      } else {
        const dx = mouseX - targetX, dy = mouseY - targetY;
        if (Math.hypot(dx, dy) < Math.max(160, rect.width * 0.6)) {
          avatar.style.transform = `translate(${dx * 0.25}px, ${dy * 0.25}px)`;
          avatar.style.transition = 'transform 0.12s linear';
        } else {
          avatar.style.transform = '';
        }
      }
    } else {
      targetX = mouseX;
      targetY = mouseY;
    }

    ringX += (targetX - ringX) * LERP_SPEED;
    ringY += (targetY - ringY) * LERP_SPEED;
    ringW += (targetWidth - ringW) * LERP_SPEED;
    ringH += (targetHeight - ringH) * LERP_SPEED;

    if (!lockedItem && !isUnlocking) {
      const deltaX = targetX - ringX, deltaY = targetY - ringY;
      const dist = Math.sqrt(deltaX ** 2 + deltaY ** 2);
      const stretch = Math.min(dist * 0.004, 0.3);
      scaleX = 1 + stretch; scaleY = 1 - stretch * 0.5;
      if (dist > 1) rotation = Math.atan2(deltaY, deltaX);
    }

    ring.style.width = `${ringW}px`;
    ring.style.height = `${ringH}px`;
    ring.style.borderRadius = targetRadius;
    ring.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%) rotate(${rotation}rad) scale(${scaleX}, ${scaleY})`;

    requestAnimationFrame(loop);
  }
  loop();
})();

/**
 * Module: AJAX Contact Form & Toast Notifications
 */
(function () {
  const form = document.querySelector('.contact-form'); // Updated selector
  if (!form) return;
  const submitBtn = form.querySelector('button[type="submit"]');
  const originalBtnContent = submitBtn.innerHTML;

  function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    let iconName = 'info';
    if (type === 'success') iconName = 'check-circle';
    if (type === 'error') iconName = 'alert-circle';
    if (type === 'loading') iconName = 'loader-2';

    toast.innerHTML = `
      <div class="toast__icon"><i data-lucide="${iconName}" class="${type === 'loading' ? 'spin-anim' : ''}"></i></div>
      <div class="toast__message">${message}</div>
      <button class="toast__close" aria-label="Close" type="button" data-cursor-ignore><i data-lucide="x"></i></button>
    `;
    container.appendChild(toast);
    if (window.lucide && window.lucide.createIcons) window.lucide.createIcons();

    if (type === 'loading' && !document.getElementById('spin-style')) {
      const style = document.createElement('style');
      style.id = 'spin-style';
      style.innerHTML = `@keyframes spin { 100% { transform: rotate(360deg); } } .spin-anim { animation: spin 1s linear infinite; }`;
      document.head.appendChild(style);
    }

    let autoCloseTimer = null;
    const removeToast = () => {
      if (autoCloseTimer) clearTimeout(autoCloseTimer);
      toast.classList.add('is-hiding');
      const onEnd = () => { if (toast.parentElement) toast.remove(); };
      toast.addEventListener('transitionend', onEnd, { once: true });
      setTimeout(onEnd, 400);
    };
    toast.querySelector('.toast__close').addEventListener('click', (e) => { e.stopPropagation(); removeToast(); });
    if (type !== 'loading') autoCloseTimer = setTimeout(removeToast, 5000);
    return { remove: removeToast };
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<i data-lucide="loader-2" class="spin-anim"></i> <span>Sending...</span>`;
    if (window.lucide && window.lucide.createIcons) window.lucide.createIcons();
    const loadingToastControl = showToast('Sending your message...', 'loading');

    try {
      const formData = new FormData(form);
      const response = await fetch(form.action, { method: 'POST', body: formData, headers: { 'X-Requested-With': 'XMLHttpRequest' } });
      const data = await response.json();
      if (loadingToastControl) loadingToastControl.remove();

      if (response.ok && data.status === 'success') {
        showToast(data.message, 'success');
        form.reset();
      } else {
        showToast(data.message || 'Something went wrong.', 'error');
      }
    } catch (error) {
      if (loadingToastControl) loadingToastControl.remove();
      showToast('Network error.', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnContent;
      if (window.lucide && window.lucide.createIcons) window.lucide.createIcons();
    }
  });
})();

/**
 * Module: Page Preloader
 */
(function () {
  const preloader = document.getElementById('preloader');
  if (!preloader) return;
  const dismissPreloader = () => {
    preloader.classList.add('is-loaded');
    setTimeout(() => { preloader.style.display = 'none'; }, 650);
  };
  window.addEventListener('load', () => { setTimeout(dismissPreloader, 400); });
  setTimeout(dismissPreloader, 8000);
})();
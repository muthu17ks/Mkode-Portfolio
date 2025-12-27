/**
 * Main Application Script
 */
'use strict';

/* 1. Theme Picker & Color Manager */
(function () {
  const root = document.documentElement;
  const toggleBtn = document.getElementById('theme-toggle');
  const paletteBtn = document.getElementById('palette-toggle');
  const modal = document.getElementById('theme-modal');
  const closeBtn = document.getElementById('close-theme-modal');
  const grid = document.getElementById('palette-grid');
  const refreshBtn = document.getElementById('refresh-palettes');

  const DEFAULT_PALETTE = ['#0f4c75', '#3282b8', '#bbe1fa', '#1b262c'];

  const PALETTE_LIBRARY = [
    DEFAULT_PALETTE,
    ['#1b3c53', '#234c6a', '#456882', '#e3e3e3'],
    ['#213448', '#547792', '#94b4c1', '#eae0cf'],
    ['#050e3c', '#002455', '#dc0000', '#ff3838'],
    ['#005461', '#018790', '#00b7b5', '#f4f4f4'],
    ['#360185', '#8f0177', '#de1a58', '#f4b342'],
    ['#1b211a', '#628141', '#8bae66', '#ebd5ab'],
    ['#434e78', '#607b8f', '#f7e396', '#e97f4a'],
    ['#5a9cb5', '#face68', '#faac68', '#fa6868'],
    ['#3291b6', '#bb8ed0', '#e0a8a8', '#f1e2e2'],
    ['#001f3d', '#ed985f', '#f7b980', '#e6e6e6'],
    ['#8a8635', '#aa2b1d', '#cc561e', '#f3cf7a'],
    ['#000080', '#ff0000', '#9e2a3a', '#3a2525'],
    ['#4d2b8c', '#85409d', '#eea727', '#ffef5f'],
    ['#222831', '#393e46', '#00adb5', '#eeeeee'],
    ['#3f72af', '#112d4e', '#dbe2ef', '#f9f7f7'],
    ['#ad8b73', '#ceab93', '#e3caa5', '#fffbe9'],
    ['#1b262c', '#0f4c75', '#3282b8', '#bbe1fa'],
    ['#27374d', '#526d82', '#9db2bf', '#dde6ed'],
    ['#6096b4', '#93bfcf', '#bdcdd6', '#eee9da'],
    ['#2c3e50', '#e74c3c', '#ecf0f1', '#3498db'],
    ['#e94560', '#0f3460', '#16213e', '#1a1a2e'],
    ['#008170', '#005b41', '#232d3f', '#0f0f0f'],
    ['#bb2525', '#ff6969', '#141e46', '#fff5e4'],
  ];

  function hexToHSL(H) {
    let r = 0, g = 0, b = 0;
    if (H.length == 4) {
      r = "0x" + H[1] + H[1]; g = "0x" + H[2] + H[2]; b = "0x" + H[3] + H[3];
    } else if (H.length == 7) {
      r = "0x" + H[1] + H[2]; g = "0x" + H[3] + H[4]; b = "0x" + H[5] + H[6];
    }
    r /= 255; g /= 255; b /= 255;
    let cmin = Math.min(r,g,b), cmax = Math.max(r,g,b), delta = cmax - cmin;
    let h = 0, s = 0, l = 0;
    if (delta == 0) h = 0;
    else if (cmax == r) h = ((g - b) / delta) % 6;
    else if (cmax == g) h = (b - r) / delta + 2;
    else h = (r - g) / delta + 4;
    h = Math.round(h * 60);
    if (h < 0) h += 360;
    l = (cmax + cmin) / 2;
    s = delta == 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
    s = +(s * 100).toFixed(1);
    l = +(l * 100).toFixed(1);
    return { h, s, l };
  }

  function updateMetaThemeColor(color) {
    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'theme-color';
      document.head.appendChild(meta);
    }
    meta.content = color;
  }

  function applyPalette(colors) {
    const vars = ['--p', '--s', '--t', '--n'];

    updateMetaThemeColor(colors[0]);

    colors.forEach((hex, index) => {
      if (index > 3) return;
      const hsl = hexToHSL(hex);
      const prefix = vars[index];

      root.style.setProperty(`${prefix}-h`, hsl.h);

      if (index === 0) {
         root.style.setProperty(`${prefix}-s`, hsl.s + '%');
         root.style.setProperty(`${prefix}-l`, hsl.l + '%');
         root.style.setProperty('--color-btn-text', '#ffffff');
      } else if (index === 3) {
         root.style.setProperty(`${prefix}-s`, Math.min(hsl.s, 20) + '%');
         root.style.removeProperty(`${prefix}-l`);
      } else {
         root.style.setProperty(`${prefix}-s`, hsl.s + '%');
         root.style.setProperty(`${prefix}-l`, hsl.l + '%');
      }
    });

    localStorage.setItem('custom-palette', JSON.stringify(colors));
    updateActiveGridState(colors);
  }

  function updateActiveGridState(activeColors) {
    const cards = document.querySelectorAll('.palette-card');
    cards.forEach(card => {
        const cardColors = JSON.parse(card.getAttribute('data-colors'));
        if (JSON.stringify(cardColors) === JSON.stringify(activeColors)) {
            card.classList.add('is-active-palette');
            card.style.ring = '2px solid var(--color-text)';
            card.style.transform = 'scale(0.95)';
        } else {
            card.classList.remove('is-active-palette');
            card.style.ring = 'none';
            card.style.transform = '';
        }
    });
  }

  function renderPalettes() {
    if (!grid) return;
    grid.innerHTML = '';

    const current = JSON.parse(localStorage.getItem('custom-palette')) || DEFAULT_PALETTE;

    const others = PALETTE_LIBRARY
        .filter(p => JSON.stringify(p) !== JSON.stringify(current))
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);

    const displayList = [current, ...others];

    displayList.forEach(colors => {
      const card = document.createElement('button');
      card.className = 'palette-card';
      card.setAttribute('aria-label', 'Select this color palette');
      card.setAttribute('data-colors', JSON.stringify(colors));

      const preview = document.createElement('div');
      preview.className = 'palette-preview';

      colors.forEach(c => {
        const stripe = document.createElement('div');
        stripe.style.backgroundColor = c;
        preview.appendChild(stripe);
      });

      card.appendChild(preview);

      if (JSON.stringify(colors) === JSON.stringify(current)) {
          card.classList.add('is-active-palette');
      }

      card.addEventListener('click', () => {
        if (document.startViewTransition) {
             document.startViewTransition(() => applyPalette(colors));
        } else {
             applyPalette(colors);
        }
        setTimeout(() => modal.close(), 300);
      });

      grid.appendChild(card);
    });
  }

  const savedTheme = localStorage.getItem('theme') || 'light';
  const savedPalette = JSON.parse(localStorage.getItem('custom-palette')) || DEFAULT_PALETTE;

  root.classList.add(savedTheme === 'dark' ? 'dark-theme' : 'light-theme');
  applyPalette(savedPalette);

  function updateIcon(theme) {
    if (!toggleBtn) return;
    toggleBtn.innerHTML = theme === 'dark'
      ? '<i data-lucide="moon"></i>'
      : '<i data-lucide="sun"></i>';
    if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
  }
  updateIcon(savedTheme);

  if (toggleBtn) {
    toggleBtn.addEventListener('click', (e) => {
      const isDark = root.classList.contains('dark-theme');
      const nextTheme = isDark ? 'light' : 'dark';

      const transition = () => {
        root.classList.toggle('dark-theme', !isDark);
        root.classList.toggle('light-theme', isDark);
        localStorage.setItem('theme', nextTheme);
        updateIcon(nextTheme);
      };

      if (document.startViewTransition) document.startViewTransition(transition);
      else transition();
    });
  }

  if (paletteBtn && modal) {
    paletteBtn.addEventListener('click', (e) => { e.stopPropagation(); renderPalettes(); modal.showModal(); });
  }
  if (closeBtn) closeBtn.addEventListener('click', () => modal.close());
  if (refreshBtn) refreshBtn.addEventListener('click', renderPalettes);
  if (modal) {
    modal.addEventListener('click', (e) => {
      const rect = modal.getBoundingClientRect();
      if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) {
        modal.close();
      }
    });
  }
})();

/* 2. Navigation Router */
(function () {
  const navMenu = document.querySelector('.navbar__menu');
  const mobileBtn = document.getElementById('mobile-menu-btn');
  const mobileBtnText = mobileBtn ? mobileBtn.querySelector('.btn-text') : null;

  const allNavLinks = document.querySelectorAll('a[href^="#"]');
  const sections = Array.from(document.querySelectorAll('section[id]'));

  if (mobileBtn && navMenu) {
    mobileBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = navMenu.classList.toggle('is-open');
      mobileBtn.setAttribute('aria-expanded', isOpen);
    });

    document.addEventListener('click', (e) => {
      if (navMenu.classList.contains('is-open') && !navMenu.contains(e.target) && e.target !== mobileBtn) {
        navMenu.classList.remove('is-open');
        mobileBtn.setAttribute('aria-expanded', 'false');
      }
    });
  }

document.addEventListener('click', (ev) => {
    const el = ev.target.closest('a[href^="#"]');
    if (!el) return;

    ev.preventDefault();
    el.blur();

    const href = el.getAttribute('href');

    if (navMenu && navMenu.classList.contains('is-open')) {
      navMenu.classList.remove('is-open');
      if (mobileBtn) mobileBtn.setAttribute('aria-expanded', 'false');
    }

    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
      history.pushState(null, '', href);
    }
  });
  function updateActiveState() {
    let current = null;

    if (window.scrollY < 100) {
       current = '#main';
    } else {
       const scrollPos = window.scrollY + window.innerHeight * 0.4;
       for (const sec of sections) {
         const top = sec.offsetTop;
         const bottom = top + sec.offsetHeight;
         if (scrollPos >= top && scrollPos < bottom) {
           current = '#' + sec.id;
           break;
         }
       }
    }

    allNavLinks.forEach(a => {
        a.classList.remove('is-active');
        a.removeAttribute('aria-current');
    });

    if (current) {
        const activeLinks = document.querySelectorAll(`a[href="${current}"]`);
        activeLinks.forEach(link => {
            link.classList.add('is-active');
            link.setAttribute('aria-current', 'page');
            if (mobileBtnText && link.closest('.navbar__menu')) {
                mobileBtnText.textContent = link.textContent;
            }
        });
    } else {
        if (mobileBtnText) mobileBtnText.textContent = 'Menu';
    }
  }

  window.addEventListener('scroll', updateActiveState, { passive: true });

  window.addEventListener('load', () => {
    if (location.hash) {
      const target = document.querySelector(location.hash);
      if (target) {
        setTimeout(() => {
          target.scrollIntoView({ behavior: 'auto' });
          updateActiveState();
        }, 100);
      }
    } else {
        updateActiveState();
    }
  });
})();

/* 3. Back-To-Top Utility */
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
    const behavior = (reduceMotion || window.innerWidth < 1024) ? 'auto' : 'smooth';
    window.scrollTo({ top: 0, behavior: behavior });
  });
})();

/* 4. Scroll Reveal Animations */
(function () {
  if (window.innerWidth < 1024) return;

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

  const projects = document.querySelectorAll('.project-card');
  projects.forEach((el) => {
    el.classList.add('reveal-up');
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

/* 5. Custom Cursor (Capability Aware) */
(function () {
  const dot = document.querySelector('.cursor__dot');
  const ring = document.querySelector('.cursor__ring');
  const avatar = document.querySelector('.hero__avatar');

  if (!dot || !ring) return;

  let mouseX = -100, mouseY = -100;
  let ringX = -100, ringY = -100;
  let isCursorActive = false;
  let lockedItem = null;
  let hasMoved = false;
  let isUnlocking = false;

  const capabilityQuery = window.matchMedia('(hover: hover) and (pointer: fine)');

  function handleCapabilityChange(e) {
    if (e.matches) {
      startCursor();
    } else {
      stopCursor();
    }
  }

  capabilityQuery.addEventListener('change', handleCapabilityChange);

  function startCursor() {
    if (isCursorActive) return;
    isCursorActive = true;

    dot.style.display = 'block';
    ring.style.display = 'block';

    window.addEventListener('mousemove', onMouseMove);
    attachCursorListeners();
    requestAnimationFrame(loop);
  }

  function stopCursor() {
    isCursorActive = false;
    dot.style.display = 'none';
    ring.style.display = 'none';
    window.removeEventListener('mousemove', onMouseMove);

    if (lockedItem) {
      lockedItem.style.transform = '';
      lockedItem = null;
    }
  }

  function onMouseMove(e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
    if (!hasMoved) {
      ringX = mouseX; ringY = mouseY; hasMoved = true;
      dot.style.opacity = '1'; ring.style.opacity = '1';
    }
    dot.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%)`;
  }

  const interactiveSelectors = [
    'a', 'button', '.btn-main', '.btn-hero-primary',
    '.hero__avatar', '.tech-item', '[role="button"]', '.tech-badge',
    '.action-badge', '.tech-tag'
  ].join(',');

  function shouldIgnore(el) {
    if (!el) return true;
    if (el.hasAttribute('data-cursor-ignore')) return true;

    if (el.classList.contains('action-badge')) return false;

    if (el.closest('.project-card__media')) return true;
    if (el.closest('.contact-form-wrapper')) {
      if (el.matches('input, textarea, select, label')) return true;
    }
    return false;
  }

  function attachCursorListeners() {
    if (!isCursorActive) return;

    const candidates = Array.from(document.querySelectorAll(interactiveSelectors))
      .filter((el) => !el.__cursorAttached && !shouldIgnore(el));

    candidates.forEach((el) => {
      el.__cursorAttached = true;
      el.addEventListener('mouseenter', () => {
        if (isCursorActive) { lockedItem = el; ring.classList.add('is-locked'); }
      });
      el.addEventListener('mouseleave', () => {
        if (isCursorActive && lockedItem === el) {
          lockedItem = null; ring.classList.remove('is-locked'); isUnlocking = true;
          el.style.transform = '';
          el.style.transition = 'transform 0.3s ease';
          setTimeout(() => { isUnlocking = false; }, 200);
        }
      });
    });
  }

  if ('MutationObserver' in window) {
    const mo = new MutationObserver(() => { if (isCursorActive) setTimeout(attachCursorListeners, 50); });
    mo.observe(document.body, { childList: true, subtree: true });
  }

  function loop() {
    if (!isCursorActive) return;
    if (!hasMoved) { requestAnimationFrame(loop); return; }

    let targetX = mouseX, targetY = mouseY;
    let targetWidth = 40, targetHeight = 40;
    let targetRadius = '50%';
    let scaleX = 1, scaleY = 1, rotation = 0;
    const RING_LERP = lockedItem ? 0.2 : 0.15;

    if (lockedItem) {
      const rect = lockedItem.getBoundingClientRect();
      const style = window.getComputedStyle(lockedItem);
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      targetX = centerX; targetY = centerY;
      targetWidth = rect.width + 12; targetHeight = rect.height + 12;
      targetRadius = style.borderRadius || '50%';

      if (lockedItem !== avatar) {
        const moveX = mouseX - centerX, moveY = mouseY - centerY;
        lockedItem.style.transform = `translate(${moveX * 0.3}px, ${moveY * 0.3}px)`;
        lockedItem.style.transition = 'transform 0.1s linear';
      } else {
        const moveX = mouseX - centerX, moveY = mouseY - centerY;
        if (Math.hypot(moveX, moveY) < Math.max(160, rect.width * 0.6)) {
          avatar.style.transform = `translate(${moveX * 0.25}px, ${moveY * 0.25}px)`;
          avatar.style.transition = 'transform 0.12s linear';
        } else {
          avatar.style.transform = '';
        }
      }
      scaleX = 1; scaleY = 1; rotation = 0;
    } else {
      if (!isUnlocking) {
        const deltaX = mouseX - ringX, deltaY = mouseY - ringY;
        const dist = Math.sqrt(deltaX ** 2 + deltaY ** 2);
        const stretch = Math.min(dist * 0.004, 0.3);
        scaleX = 1 + stretch; scaleY = 1 - stretch * 0.5;
        if (dist > 1) rotation = Math.atan2(deltaY, deltaX);
      }
    }

    ringX += (targetX - ringX) * RING_LERP;
    ringY += (targetY - ringY) * RING_LERP;

    ring.style.width = `${targetWidth}px`;
    ring.style.height = `${targetHeight}px`;
    ring.style.borderRadius = targetRadius;
    ring.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%) rotate(${rotation}rad) scale(${scaleX}, ${scaleY})`;

    requestAnimationFrame(loop);
  }

  if (capabilityQuery.matches) {
    startCursor();
  }
})();

/* 6. Contact Form & Toasts */
(function () {
  const form = document.querySelector('.contact-form');
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

    const removeToast = () => {
      toast.classList.add('is-hiding');
      toast.addEventListener('transitionend', () => toast.remove());
      setTimeout(() => { if(toast.parentElement) toast.remove(); }, 400);
    };

    toast.querySelector('.toast__close').addEventListener('click', removeToast);

    if (type !== 'loading') {
        setTimeout(removeToast, 5000);
    }

    return { remove: removeToast };
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    submitBtn.disabled = true;
    submitBtn.style.cursor = 'not-allowed';
    submitBtn.innerHTML = `<i data-lucide="loader-2" class="spin-anim"></i> <span>Sending...</span>`;

    if (window.lucide && window.lucide.createIcons) window.lucide.createIcons();

    const loadingToast = showToast('Sending your message...', 'loading');

    try {
      const formData = new FormData(form);
      const response = await fetch(form.action, {
          method: 'POST',
          body: formData,
          headers: { 'X-Requested-With': 'XMLHttpRequest' }
      });

      const data = await response.json();
      if (loadingToast) loadingToast.remove();

      if (response.ok && data.status === 'success') {
        showToast(data.message, 'success');
        form.reset();
      } else {
        showToast(data.message || 'Something went wrong.', 'error');
      }
    } catch (error) {
      if (loadingToast) loadingToast.remove();
      showToast('Network error. Please try again.', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.style.cursor = '';
      submitBtn.innerHTML = originalBtnContent;
      if (window.lucide && window.lucide.createIcons) window.lucide.createIcons();
    }
  });
})();

/* 7. Page Preloader & Smart Scroll */
(function () {
  const preloader = document.getElementById('preloader');
  if (!preloader) return;

  const dismissPreloader = () => {
    preloader.classList.add('is-loaded');
    setTimeout(() => {
      preloader.style.display = 'none';
    }, 650);
  };

  window.addEventListener('load', () => {
    setTimeout(dismissPreloader, 100);
  });

  setTimeout(dismissPreloader, 5000);
})();


/* 10. Dynamic Rail Track Logic (Smooth Curves) */
(function() {
  const tocNav = document.querySelector('.toc-nav');
  if (!tocNav) return;

  const svg = tocNav.querySelector('.toc-rail-svg');
  const trackPath = svg.querySelector('.rail-track');
  const fillPath = svg.querySelector('.rail-fill');
  const linksWrapper = tocNav.querySelector('.toc-links-wrapper');
  const links = Array.from(linksWrapper.querySelectorAll('.toc-link'));

  if (links.length === 0) return;

  // --- Configuration ---
  const parentX = 1;      // Left Track X
  const childX = 16;      // Right Track X (Matches CSS indentation)

  let pathD = "";
  let points = [];

  // 1. Calculate Points based on Text Position
  links.forEach((link, index) => {
    const isChild = link.classList.contains('is-child');
    const targetX = isChild ? childX : parentX;

    // Y-Center of the text link
    const linkCenterY = link.offsetTop + (link.offsetHeight / 2);

    points.push({ x: targetX, y: linkCenterY });
  });

  // 2. Draw Smooth Path
  if (points.length > 0) {
    // Start at top of first item
    pathD += `M ${points[0].x} 0 `;
    // Line to first item center
    pathD += `L ${points[0].x} ${points[0].y} `;

    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i+1];

      if (p1.x !== p2.x) {
        // Lane Change: Draw a smooth S-curve
        // Control points determine the "smoothness"
        const distY = p2.y - p1.y;
        const cpY1 = p1.y + (distY * 0.5); // Control point 1 Y
        const cpY2 = p1.y + (distY * 0.5); // Control point 2 Y

        // Cubic Bezier: C (cp1x, cp1y), (cp2x, cp2y), (endx, endy)
        pathD += `C ${p1.x} ${cpY1}, ${p2.x} ${cpY2}, ${p2.x} ${p2.y} `;
      } else {
        // Straight Line
        pathD += `L ${p2.x} ${p2.y} `;
      }
    }

    // Extend to bottom of list
    const lastP = points[points.length - 1];
    pathD += `L ${lastP.x} ${linksWrapper.offsetHeight} `;
  }

  trackPath.setAttribute('d', pathD);
  fillPath.setAttribute('d', pathD);

  // --- 3. Scroll Sync ---
  const totalLength = trackPath.getTotalLength();
  fillPath.style.strokeDasharray = `${totalLength} ${totalLength}`;
  fillPath.style.strokeDashoffset = totalLength;

  const updateRail = () => {
    const scrollPos = window.scrollY + 120; // Navbar offset

    // Identify Active Section
    let activeIndex = -1;
    for (let i = 0; i < links.length; i++) {
      const id = links[i].getAttribute('href');
      // Handle the '#preview' special case or standard ID
      const target = document.querySelector(id);

      if (target) {
        // Use a slightly larger offset for detection
        if (target.offsetTop <= scrollPos + 100) {
          activeIndex = i;
        }
      }
    }

    // Fallback: If at bottom of page, highlight last item
    if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 50) {
      activeIndex = links.length - 1;
    }

    // Update Visuals
    links.forEach((l, i) => {
      if (i === activeIndex) l.classList.add('is-active');
      else l.classList.remove('is-active');
    });

    if (activeIndex >= 0) {
      // Calculate how much line to fill
      const activePoint = points[activeIndex];

      // We can use getPointAtLength to be precise, or just estimate ratio
      // Since our path is vertical-ish, Y-ratio is good enough
      const percent = activePoint.y / linksWrapper.offsetHeight;

      // LOGIC CHANGE: Only add the 0.05 buffer if we are at the last item (scrolled all headings)
      const isLastItem = activeIndex === links.length - 1;
      const buffer = isLastItem ? 0.05 : 0;

      // Calculate exact dash offset
      fillPath.style.strokeDashoffset = totalLength - (totalLength * (percent + buffer));
    } else {
      fillPath.style.strokeDashoffset = totalLength;
    }
  };

  window.addEventListener('scroll', updateRail, { passive: true });
  window.addEventListener('resize', () => location.reload());
  setTimeout(updateRail, 150);
})();

/* 9. Image Carousel Logic (Infinite Loop + View-Based Autoplay) */
(function() {
  const carousel = document.querySelector('.project-carousel');
  if (!carousel) return;

  const track = carousel.querySelector('.carousel-track');
  const slides = Array.from(track.children);
  const nextBtn = carousel.querySelector('.btn--right');
  const prevBtn = carousel.querySelector('.btn--left');
  const dotsNav = carousel.querySelector('.carousel-nav');
  const dots = dotsNav ? Array.from(dotsNav.children) : [];

  let autoPlayInterval;
  let isHovered = false;

  // --- 1. Core Switching Logic ---

  const moveToSlide = (targetIndex) => {
    const currentSlide = track.querySelector('.current-slide');
    const targetSlide = slides[targetIndex];

    if (!currentSlide || !targetSlide) return;

    // 1. Update Slide Classes (CSS handles opacity fade)
    currentSlide.classList.remove('current-slide');
    targetSlide.classList.add('current-slide');

    // 2. Update Dots
    if (dotsNav) {
      const currentDot = dotsNav.querySelector('.current-slide');
      const targetDot = dots[targetIndex];
      if(currentDot) currentDot.classList.remove('current-slide');
      if(targetDot) targetDot.classList.add('current-slide');
    }
  };

  // --- 2. Directional Logic (Infinite Loop) ---

  const showNextSlide = () => {
    const currentSlide = track.querySelector('.current-slide');
    const currentIndex = slides.findIndex(s => s === currentSlide);

    // Loop: If at end (length - 1), go to 0. Else +1.
    let nextIndex = currentIndex + 1;
    if (nextIndex >= slides.length) {
      nextIndex = 0;
    }

    moveToSlide(nextIndex);
  };

  const showPrevSlide = () => {
    const currentSlide = track.querySelector('.current-slide');
    const currentIndex = slides.findIndex(s => s === currentSlide);

    // Loop: If at 0, go to end (length - 1). Else -1.
    let prevIndex = currentIndex - 1;
    if (prevIndex < 0) {
      prevIndex = slides.length - 1;
    }

    moveToSlide(prevIndex);
  };

  // --- 3. Event Listeners ---

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      showNextSlide();
      // Reset timer on manual interaction so it doesn't jump immediately after
      stopAutoplay();
      startAutoplay();
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      showPrevSlide();
      stopAutoplay();
      startAutoplay();
    });
  }

  if (dotsNav) {
    dotsNav.addEventListener('click', e => {
      const targetDot = e.target.closest('button');
      if (!targetDot) return;
      const targetIndex = dots.findIndex(dot => dot === targetDot);

      moveToSlide(targetIndex);
      stopAutoplay();
      startAutoplay();
    });
  }

  // --- 4. Autoplay Logic (View-Based) ---

  const startAutoplay = () => {
    stopAutoplay(); // Clear existing to prevent double timers
    autoPlayInterval = setInterval(() => {
      if (!isHovered) showNextSlide();
    }, 3000); // 3 Seconds Interval
  };

  const stopAutoplay = () => {
    if (autoPlayInterval) clearInterval(autoPlayInterval);
  };

  // Pause on Hover (UX Best Practice)
  carousel.addEventListener('mouseenter', () => { isHovered = true; });
  carousel.addEventListener('mouseleave', () => { isHovered = false; });

  // Intersection Observer: Only run when visible
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Wait 1s before starting so it's not jarring
        setTimeout(startAutoplay, 1000);
      } else {
        stopAutoplay();
      }
    });
  }, { threshold: 0.5 }); // 50% visible to start

  // Only init if we have multiple slides
  if (slides.length > 1) {
    observer.observe(carousel);
    // Ensure arrows are visible (remove is-hidden if it was set in HTML)
    if(prevBtn) prevBtn.classList.remove('is-hidden');
    if(nextBtn) nextBtn.classList.remove('is-hidden');
  } else {
    // Hide controls if single image
    if(prevBtn) prevBtn.style.display = 'none';
    if(nextBtn) nextBtn.style.display = 'none';
    if(dotsNav) dotsNav.style.display = 'none';
  }

})();

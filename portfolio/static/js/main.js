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
    if (H.length == 4) { r = "0x" + H[1] + H[1]; g = "0x" + H[2] + H[2]; b = "0x" + H[3] + H[3]; }
    else if (H.length == 7) { r = "0x" + H[1] + H[2]; g = "0x" + H[3] + H[4]; b = "0x" + H[5] + H[6]; }
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
    if (!meta) { meta = document.createElement('meta'); meta.name = 'theme-color'; document.head.appendChild(meta); }
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
    const others = PALETTE_LIBRARY.filter(p => JSON.stringify(p) !== JSON.stringify(current)).sort(() => 0.5 - Math.random()).slice(0, 3);
    const displayList = [current, ...others];
    displayList.forEach(colors => {
      const card = document.createElement('button');
      card.className = 'palette-card';
      card.setAttribute('aria-label', 'Select this color palette');
      card.setAttribute('data-colors', JSON.stringify(colors));
      const preview = document.createElement('div');
      preview.className = 'palette-preview';
      colors.forEach(c => { const stripe = document.createElement('div'); stripe.style.backgroundColor = c; preview.appendChild(stripe); });
      card.appendChild(preview);
      if (JSON.stringify(colors) === JSON.stringify(current)) card.classList.add('is-active-palette');
      card.addEventListener('click', () => {
        if (document.startViewTransition) document.startViewTransition(() => applyPalette(colors));
        else applyPalette(colors);
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
    if (toggleBtn) toggleBtn.innerHTML = theme === 'dark' ? '<i data-lucide="moon"></i>' : '<i data-lucide="sun"></i>';
    const cpThemeBtn = document.getElementById('cp-theme-btn');
    if (cpThemeBtn) cpThemeBtn.innerHTML = theme === 'dark' ? '<i data-lucide="moon"></i>' : '<i data-lucide="sun"></i>';
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
      if (document.startViewTransition) document.startViewTransition(transition); else transition();
    });
  }
  if (paletteBtn && modal) paletteBtn.addEventListener('click', (e) => { e.stopPropagation(); renderPalettes(); modal.showModal(); });
  if (closeBtn) closeBtn.addEventListener('click', () => modal.close());
  if (refreshBtn) refreshBtn.addEventListener('click', renderPalettes);
  if (modal) modal.addEventListener('click', (e) => { const rect = modal.getBoundingClientRect(); if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) modal.close(); });
})();

/* 2. Navigation Router */
(function () {
  const navMenu = document.querySelector('.navbar__menu');
  const mobileBtn = document.getElementById('mobile-menu-btn');
  const mobileBtnText = mobileBtn ? mobileBtn.querySelector('.btn-text') : null;
  const allNavLinks = document.querySelectorAll('a[href^="#"]');
  const sections = Array.from(document.querySelectorAll('section[id]'));
  if (mobileBtn && navMenu) {
    mobileBtn.addEventListener('click', (e) => { e.stopPropagation(); const isOpen = navMenu.classList.toggle('is-open'); mobileBtn.setAttribute('aria-expanded', isOpen); });
    document.addEventListener('click', (e) => { if (navMenu.classList.contains('is-open') && !navMenu.contains(e.target) && e.target !== mobileBtn) { navMenu.classList.remove('is-open'); mobileBtn.setAttribute('aria-expanded', 'false'); } });
  }
  document.addEventListener('click', (ev) => {
    const el = ev.target.closest('a[href^="#"]');
    if (!el) return;
    el.blur();
    if (navMenu && navMenu.classList.contains('is-open')) { navMenu.classList.remove('is-open'); if (mobileBtn) mobileBtn.setAttribute('aria-expanded', 'false'); }
  });
  function updateActiveState() {
    let current = null;
    if (window.scrollY < 100) current = '#main';
    else {
       const scrollPos = window.scrollY + window.innerHeight * 0.4;
       for (const sec of sections) {
         const top = sec.offsetTop;
         const bottom = top + sec.offsetHeight;
         if (scrollPos >= top && scrollPos < bottom) { current = '#' + sec.id; break; }
       }
    }
    allNavLinks.forEach(a => { a.classList.remove('is-active'); a.removeAttribute('aria-current'); });
    if (current) {
        const activeLinks = document.querySelectorAll(`a[href*="${current}"]`);
        activeLinks.forEach(link => {
            link.classList.add('is-active');
            link.setAttribute('aria-current', 'page');
            if (mobileBtnText && link.closest('.navbar__menu')) mobileBtnText.textContent = link.textContent;
        });
    } else if (mobileBtnText) mobileBtnText.textContent = 'Menu';
  }
  window.addEventListener('scroll', updateActiveState, { passive: true });
  window.addEventListener('load', () => {
    if (location.hash) {
      const target = document.querySelector(location.hash);
      if (target) { setTimeout(() => { target.scrollIntoView({ behavior: 'auto' }); updateActiveState(); }, 100); }
    } else updateActiveState();
  });
})();

/* 3. Command Palette System */
(function() {
  const triggerBtn = document.getElementById('cp-trigger');
  const modal = document.getElementById('cp-modal');
  const input = document.getElementById('cp-input');
  const resultsContainer = document.getElementById('cp-results');
  const backdrop = document.querySelector('.cp-backdrop');
  const closeBtn = document.getElementById('cp-close-btn');
  const themeBtn = document.getElementById('cp-theme-btn');
  if (!modal || !input) return;
  let allData = null, isOpen = false, selectedIndex = 0, filteredCommands = [];
  const MAX_RECENTS = 3;
  async function fetchData() {
    try { const res = await fetch('/api/search-data'); if (!res.ok) throw new Error('Failed'); allData = await res.json(); } catch { allData = { pages: [], projects: [], connect: [], resume: [] }; }
  }
  function getRecents() { try { return JSON.parse(localStorage.getItem('cp_recents')) || []; } catch { return []; } }
  function addRecent(item) {
    let recents = getRecents().filter(r => r.id !== item.id);
    recents.unshift(item);
    if (recents.length > MAX_RECENTS) recents = recents.slice(0, MAX_RECENTS);
    localStorage.setItem('cp_recents', JSON.stringify(recents));
  }
  function removeRecent(id, e) {
    if (e) e.stopPropagation();
    localStorage.setItem('cp_recents', JSON.stringify(getRecents().filter(r => r.id !== id)));
    filterCommands(input.value);
  }
  function clearRecents() { localStorage.removeItem('cp_recents'); filterCommands(input.value); }
  async function openPalette() {
    isOpen = true; modal.classList.add('is-open'); document.body.classList.add('is-modal-open');
    if (!allData) await fetchData();
    input.value = ''; filterCommands('');
    setTimeout(() => input.focus(), 100); document.body.style.overflow = 'hidden';
  }
  function closePalette() { isOpen = false; modal.classList.remove('is-open'); document.body.classList.remove('is-modal-open'); document.body.style.overflow = ''; }
  function filterCommands(query) {
    const q = query.toLowerCase().trim();
    if (q === '') {
      const recents = getRecents().map(r => ({ ...r, group: 'Recent' }));
      const topProjects = (allData.projects || []).slice(0, 3).map(p => ({...p, group: 'Top Projects'}));
      filteredCommands = [...recents, ...allData.pages, ...topProjects, ...allData.connect, ...allData.resume];
    } else {
      const pool = [...allData.pages, ...allData.projects, ...allData.connect, ...allData.resume];
      filteredCommands = pool.map(item => {
        let score = 0;
        const t = item.title.toLowerCase(), tag = (item.search_tags || '').toLowerCase(), tok = (item.tokens || '').toLowerCase();
        if (t === q) score = 150; else if (t.startsWith(q)) score = 100; else if (tag.split(' ').some(x => x.startsWith(q))) score = 80; else if (t.includes(q)) score = 60; else if (tag.includes(q)) score = 40; else if (tok.includes(q) || (item.desc && item.desc.toLowerCase().includes(q))) score = 20;
        return { ...item, _score: score };
      }).filter(i => i._score > 0).sort((a, b) => b._score - a._score);
    }
    selectedIndex = 0; renderCommands(q === '');
  }
  function renderCommands(isDefault) {
    resultsContainer.innerHTML = '';
    if (filteredCommands.length === 0) { resultsContainer.innerHTML = `<div style="padding:20px; text-align:center; color:var(--about-text-muted); font-size:13px;">No results found.</div>`; return; }
    if (!isDefault) {
        const groups = {}, order = [];
        filteredCommands.forEach(c => { let g = c.group; if(g === 'Top Projects') g = 'Projects'; if(!groups[g]) { groups[g] = []; order.push(g); } groups[g].push(c); });
        order.forEach(g => createGroup(g, groups[g]));
    } else {
        const groups = {}, order = ['Recent', 'Pages', 'Top Projects', 'Connect', 'Resume'];
        filteredCommands.forEach(c => { if(!groups[c.group]) groups[c.group] = []; groups[c.group].push(c); });
        order.forEach(g => { if(groups[g]) createGroup(g, groups[g]); });
    }
    function createGroup(name, items) {
        if (!items || items.length === 0) return;
        const h = document.createElement('div'); h.className = 'cp-group-header';
        h.innerHTML = `<span class="cp-group-title">${name}</span>` + (name === 'Recent' ? `<button class="cp-clear-all-btn">Clear</button>` : '');
        resultsContainer.appendChild(h);
        if (name === 'Recent') h.querySelector('.cp-clear-all-btn').addEventListener('click', clearRecents);
        items.forEach(item => {
            const idx = filteredCommands.indexOf(item);
            const d = document.createElement('div'); d.className = `cp-item ${idx === selectedIndex ? 'is-selected' : ''}`;
            d.innerHTML = `<i data-lucide="${item.icon}" class="cp-item-icon"></i><div class="cp-info"><span class="cp-title">${item.title}</span><span class="cp-desc">${item.desc}</span></div>` + (name === 'Recent' ? `<button class="cp-delete-btn"><i data-lucide="x"></i></button>` : '');
            d.addEventListener('click', () => executeCommand(item));
            d.addEventListener('mouseenter', () => { selectedIndex = idx; document.querySelectorAll('.cp-item').forEach(e => e.classList.remove('is-selected')); d.classList.add('is-selected'); });
            if (name === 'Recent') d.querySelector('.cp-delete-btn').addEventListener('click', (e) => removeRecent(item.id, e));
            resultsContainer.appendChild(d);
        });
    }
    if (window.lucide) window.lucide.createIcons();
    const sel = resultsContainer.querySelector('.is-selected'); if (sel) sel.scrollIntoView({ block: 'nearest' });
  }
  function executeCommand(cmd) { addRecent(cmd); if (cmd.external) window.open(cmd.url, '_blank'); else window.location.href = cmd.url; closePalette(); }
  if (triggerBtn) triggerBtn.addEventListener('click', openPalette);
  if (closeBtn) closeBtn.addEventListener('click', closePalette);
  if (backdrop) backdrop.addEventListener('click', closePalette);
  if (themeBtn) themeBtn.addEventListener('click', () => { document.getElementById('theme-toggle').click(); input.focus(); });
  input.addEventListener('input', (e) => filterCommands(e.target.value));
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); selectedIndex = (selectedIndex + 1) % filteredCommands.length; renderCommands(input.value === ''); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); selectedIndex = (selectedIndex - 1 + filteredCommands.length) % filteredCommands.length; renderCommands(input.value === ''); }
    else if (e.key === 'Enter') { e.preventDefault(); if (filteredCommands[selectedIndex]) executeCommand(filteredCommands[selectedIndex]); }
    else if (e.key === 'Escape') closePalette();
  });
  document.addEventListener('keydown', (e) => { if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); if (isOpen) closePalette(); else openPalette(); } });
})();

/* 4. Custom Cursor */
(function () {
  const dot = document.querySelector('.cursor__dot');
  const ring = document.querySelector('.cursor__ring');
  const avatar = document.querySelector('.hero__avatar');
  if (!dot || !ring) return;
  let mouseX = -100, mouseY = -100, ringX = -100, ringY = -100, isCursorActive = false, lockedItem = null, hasMoved = false, isUnlocking = false;
  const capabilityQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
  function handleCapabilityChange(e) { if (e.matches) startCursor(); else stopCursor(); }
  capabilityQuery.addEventListener('change', handleCapabilityChange);
  function startCursor() { if (isCursorActive) return; isCursorActive = true; dot.style.display = 'block'; ring.style.display = 'block'; window.addEventListener('mousemove', onMouseMove); attachCursorListeners(); requestAnimationFrame(loop); }
  function stopCursor() { isCursorActive = false; dot.style.display = 'none'; ring.style.display = 'none'; window.removeEventListener('mousemove', onMouseMove); if (lockedItem) { lockedItem.style.transform = ''; lockedItem = null; } }
  function onMouseMove(e) { mouseX = e.clientX; mouseY = e.clientY; if (!hasMoved) { ringX = mouseX; ringY = mouseY; hasMoved = true; dot.style.opacity = '1'; ring.style.opacity = '1'; } dot.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%)`; }
  const interactiveSelectors = ['a', 'button', '.btn-main', '.btn-hero-primary', '.hero__avatar', '.tech-item', '[role="button"]', '.tech-badge', '.action-badge', '.tech-tag'].join(',');
  function shouldIgnore(el) { if (!el) return true; if (el.hasAttribute('data-cursor-ignore')) return true; if (el.classList.contains('action-badge')) return false; if (el.closest('.project-card__media')) return true; if (el.closest('.contact-form-wrapper')) { if (el.matches('input, textarea, select, label')) return true; } return false; }
  function attachCursorListeners() {
    if (!isCursorActive) return;
    Array.from(document.querySelectorAll(interactiveSelectors)).filter(el => !el.__cursorAttached && !shouldIgnore(el)).forEach(el => {
      el.__cursorAttached = true;
      el.addEventListener('mouseenter', () => { if (isCursorActive) { lockedItem = el; ring.classList.add('is-locked'); } });
      el.addEventListener('mouseleave', () => { if (isCursorActive && lockedItem === el) { lockedItem = null; ring.classList.remove('is-locked'); isUnlocking = true; el.style.transform = ''; el.style.transition = 'transform 0.3s ease'; setTimeout(() => { isUnlocking = false; }, 200); } });
    });
  }
  if ('MutationObserver' in window) { const mo = new MutationObserver(() => { if (isCursorActive) setTimeout(attachCursorListeners, 50); }); mo.observe(document.body, { childList: true, subtree: true }); }
  function loop() {
    if (document.body.classList.contains('is-modal-open')) { if (lockedItem) { lockedItem.style.transform = ''; lockedItem = null; ring.classList.remove('is-locked'); } ringX = mouseX; ringY = mouseY; dot.style.opacity = '0'; ring.style.opacity = '0'; requestAnimationFrame(loop); return; } else if(hasMoved) { dot.style.opacity = '1'; ring.style.opacity = '1'; }
    if (!isCursorActive || !hasMoved) { requestAnimationFrame(loop); return; }
    let targetX = mouseX, targetY = mouseY, targetWidth = 40, targetHeight = 40, targetRadius = '50%', scaleX = 1, scaleY = 1, rotation = 0;
    const RING_LERP = lockedItem ? 0.2 : 0.15;
    if (lockedItem) {
      const rect = lockedItem.getBoundingClientRect();
      const style = window.getComputedStyle(lockedItem);
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      targetX = centerX; targetY = centerY; targetWidth = rect.width + 12; targetHeight = rect.height + 12; targetRadius = style.borderRadius || '50%';
      if (lockedItem !== avatar) { const moveX = mouseX - centerX, moveY = mouseY - centerY; lockedItem.style.transform = `translate(${moveX * 0.3}px, ${moveY * 0.3}px)`; lockedItem.style.transition = 'transform 0.1s linear'; }
      else { const moveX = mouseX - centerX, moveY = mouseY - centerY; if (Math.hypot(moveX, moveY) < Math.max(160, rect.width * 0.6)) { avatar.style.transform = `translate(${moveX * 0.25}px, ${moveY * 0.25}px)`; avatar.style.transition = 'transform 0.12s linear'; } else avatar.style.transform = ''; }
    } else if (!isUnlocking) {
        const deltaX = mouseX - ringX, deltaY = mouseY - ringY, dist = Math.sqrt(deltaX ** 2 + deltaY ** 2), stretch = Math.min(dist * 0.004, 0.3);
        scaleX = 1 + stretch; scaleY = 1 - stretch * 0.5; if (dist > 1) rotation = Math.atan2(deltaY, deltaX);
    }
    ringX += (targetX - ringX) * RING_LERP; ringY += (targetY - ringY) * RING_LERP;
    ring.style.width = `${targetWidth}px`; ring.style.height = `${targetHeight}px`; ring.style.borderRadius = targetRadius;
    ring.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%) rotate(${rotation}rad) scale(${scaleX}, ${scaleY})`;
    requestAnimationFrame(loop);
  }
  if (capabilityQuery.matches) startCursor();
})();

/* 5. Contact Form */
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
    let iconName = 'info'; if (type === 'success') iconName = 'check-circle'; if (type === 'error') iconName = 'alert-circle'; if (type === 'loading') iconName = 'loader-2';
    toast.innerHTML = `<div class="toast__icon"><i data-lucide="${iconName}" class="${type === 'loading' ? 'spin-anim' : ''}"></i></div><div class="toast__message">${message}</div><button class="toast__close" aria-label="Close" type="button" data-cursor-ignore><i data-lucide="x"></i></button>`;
    container.appendChild(toast);
    if (window.lucide) window.lucide.createIcons();
    const removeToast = () => { toast.classList.add('is-hiding'); toast.addEventListener('transitionend', () => toast.remove()); setTimeout(() => { if(toast.parentElement) toast.remove(); }, 400); };
    toast.querySelector('.toast__close').addEventListener('click', removeToast);
    if (type !== 'loading') setTimeout(removeToast, 5000);
    return { remove: removeToast };
  }
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    submitBtn.disabled = true; submitBtn.style.cursor = 'not-allowed'; submitBtn.innerHTML = `<i data-lucide="loader-2" class="spin-anim"></i> <span>Sending...</span>`;
    if (window.lucide) window.lucide.createIcons();
    const loadingToast = showToast('Sending your message...', 'loading');
    try {
      const res = await fetch(form.action, { method: 'POST', body: new FormData(form), headers: { 'X-Requested-With': 'XMLHttpRequest' } });
      const data = await res.json();
      if (loadingToast) loadingToast.remove();
      if (res.ok && data.status === 'success') { showToast(data.message, 'success'); form.reset(); } else showToast(data.message || 'Something went wrong.', 'error');
    } catch { if (loadingToast) loadingToast.remove(); showToast('Network error. Please try again.', 'error'); }
    finally { submitBtn.disabled = false; submitBtn.style.cursor = ''; submitBtn.innerHTML = originalBtnContent; if (window.lucide) window.lucide.createIcons(); }
  });
})();

/* 6. Back-To-Top */
(function () {
  const btn = document.getElementById('to-top');
  if (!btn) return;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.addEventListener('scroll', () => { if (window.scrollY > 200) btn.classList.add('to-top--visible'); else btn.classList.remove('to-top--visible'); }, { passive: true });
  btn.addEventListener('click', (e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: (reduceMotion || window.innerWidth < 1024) ? 'auto' : 'smooth' }); });
})();

/* 7. Scroll Reveal */
(function () {
  if (window.innerWidth < 1024) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const config = [
    { sel: '.hero__title', cls: 'reveal-up' }, { sel: '.hero__role', cls: 'reveal-up', delay: 'delay-100' }, { sel: '.hero__blurb', cls: 'reveal-up', delay: 'delay-200' },
    { sel: '.hero__cta', cls: 'reveal-up', delay: 'delay-300' }, { sel: '.hero__avatar', cls: 'reveal-in', delay: 'delay-300' },
    { sel: '.section-title', cls: 'reveal-up' }, { sel: '.section-subtitle, .section-description', cls: 'reveal-up', delay: 'delay-100' },
    { sel: '.about__story', cls: 'reveal-up', delay: 'delay-200' }, { sel: '.about__visual', cls: 'reveal-in', delay: 'delay-200' },
    { sel: '.tech-item', cls: 'reveal-in', stagger: 50 }, { sel: '.award-card', cls: 'reveal-up', stagger: 100 }, { sel: '.contact-layout', cls: 'reveal-up' },
  ];
  config.forEach(c => { document.querySelectorAll(c.sel).forEach((el, i) => { el.classList.add(c.cls); if (c.delay) el.classList.add(c.delay); if (c.stagger) el.style.transitionDelay = `${i * c.stagger}ms`; }); });
  document.querySelectorAll('.project-card').forEach(el => el.classList.add('reveal-up'));
  const obs = new IntersectionObserver((entries) => { entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('is-revealed'); obs.unobserve(entry.target); } }); }, { root: null, rootMargin: '0px 0px -10% 0px', threshold: 0.1 });
  document.querySelectorAll('.reveal-up, .reveal-in, .reveal-from-left, .reveal-from-right').forEach(el => obs.observe(el));
})();

/* 8. Preloader */
(function () {
  const p = document.getElementById('preloader');
  if (!p) return;
  const dismiss = () => { p.classList.add('is-loaded'); setTimeout(() => { p.style.display = 'none'; }, 650); };
  window.addEventListener('load', () => setTimeout(dismiss, 100)); setTimeout(dismiss, 5000);
})();

/* 9. Carousel */
(function() {
  const c = document.querySelector('.project-carousel'); if (!c) return;
  const track = c.querySelector('.carousel-track'), slides = Array.from(track.children), next = c.querySelector('.btn--right'), prev = c.querySelector('.btn--left'), dotsNav = c.querySelector('.carousel-nav'), dots = dotsNav ? Array.from(dotsNav.children) : [];
  let idx = 0, interval, hovered = false;
  const update = () => { track.style.transform = `translateX(-${idx * 100}%)`; if (dotsNav) { dotsNav.querySelector('.current-slide')?.classList.remove('current-slide'); dots[idx]?.classList.add('current-slide'); } };
  const showNext = () => { idx = (idx + 1) % slides.length; update(); };
  const showPrev = () => { idx = (idx - 1 + slides.length) % slides.length; update(); };
  if (next) next.addEventListener('click', (e) => { e.stopPropagation(); showNext(); resetAuto(); });
  if (prev) prev.addEventListener('click', (e) => { e.stopPropagation(); showPrev(); resetAuto(); });
  if (dotsNav) dotsNav.addEventListener('click', e => { e.stopPropagation(); const t = e.target.closest('button'); if (!t) return; idx = dots.findIndex(d => d === t); update(); resetAuto(); });
  const startAuto = () => { stopAuto(); interval = setInterval(() => { if (!hovered) showNext(); }, 4000); };
  const stopAuto = () => { if (interval) clearInterval(interval); };
  const resetAuto = () => { stopAuto(); startAuto(); };
  c.addEventListener('mouseenter', () => { hovered = true; }); c.addEventListener('mouseleave', () => { hovered = false; });
  if (slides.length > 1) {
    if(prev) prev.classList.remove('is-hidden'); if(next) next.classList.remove('is-hidden');
    const obs = new IntersectionObserver((e) => { e.forEach(entry => { if (entry.isIntersecting) startAuto(); else stopAuto(); }); }, { threshold: 0.5 });
    obs.observe(c);
  } else { if(prev) prev.style.display = 'none'; if(next) next.style.display = 'none'; if(dotsNav) dotsNav.style.display = 'none'; }
})();

/* 10. Rail Track Logic (UPDATED TRIGGER) */
(function() {
  const toc = document.querySelector('.toc-nav'); if (!toc) return;
  const svg = toc.querySelector('.toc-rail-svg'), track = svg.querySelector('.rail-track'), fill = svg.querySelector('.rail-fill'), wrapper = toc.querySelector('.toc-links-wrapper'), links = Array.from(wrapper.querySelectorAll('.toc-link'));
  if (links.length === 0) return;
  const px = 1, cx = 16; let path = "", pts = [];
  links.forEach(l => { pts.push({ x: l.classList.contains('is-child') ? cx : px, y: l.offsetTop + (l.offsetHeight / 2) }); });
  if (pts.length > 0) {
    path += `M ${pts[0].x} 0 L ${pts[0].x} ${pts[0].y} `;
    for (let i = 0; i < pts.length - 1; i++) {
      const p1 = pts[i], p2 = pts[i+1];
      if (p1.x !== p2.x) { const cy = p1.y + (p2.y - p1.y) * 0.5; path += `C ${p1.x} ${cy}, ${p2.x} ${cy}, ${p2.x} ${p2.y} `; } else path += `L ${p2.x} ${p2.y} `;
    }
    path += `L ${pts[pts.length - 1].x} ${wrapper.offsetHeight} `;
  }
  track.setAttribute('d', path); fill.setAttribute('d', path);
  const len = track.getTotalLength(); fill.style.strokeDasharray = `${len} ${len}`; fill.style.strokeDashoffset = len;
  const update = () => {
    // ADJUSTED TRIGGER: Matches scroll-margin-top: calc(var(--nav-height) + 300px);
    const trigger = window.scrollY + 380;
    let active = -1;
    for (let i = 0; i < links.length; i++) {
      const t = document.querySelector(links[i].getAttribute('href'));
      if (t && (t.getBoundingClientRect().top + window.scrollY) <= trigger) active = i;
    }
    if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 50) active = links.length - 1;
    links.forEach((l, i) => { if (i === active) l.classList.add('is-active'); else l.classList.remove('is-active'); });
    if (active >= 0) { const p = pts[active].y / wrapper.offsetHeight; fill.style.strokeDashoffset = len - (active === links.length - 1 ? len : len * p); } else fill.style.strokeDashoffset = len;
  };
  window.addEventListener('scroll', update, { passive: true });
  let w = window.innerWidth; window.addEventListener('resize', () => { if (window.innerWidth !== w) { w = window.innerWidth; location.reload(); } });
  setTimeout(update, 150);
})();

/* 11. Palette Toggle */
(function() {
  const input = document.getElementById('palette-visibility-toggle');
  const btn = document.getElementById('palette-toggle');
  if (!input || !btn) return;
  const show = localStorage.getItem('show-floating-palette') === 'true';
  input.checked = show; if (!show) btn.classList.add('is-hidden'); else btn.classList.remove('is-hidden');
  input.addEventListener('change', (e) => { if (e.target.checked) btn.classList.remove('is-hidden'); else btn.classList.add('is-hidden'); localStorage.setItem('show-floating-palette', e.target.checked); });
})();

/* 12. Lightbox */
(function() {
  const modal = document.getElementById('lightbox-modal');
  const img = document.getElementById('lightbox-image');
  const close = document.getElementById('lightbox-close');
  const back = document.querySelector('.lightbox-backdrop');
  if (!modal || !img) return;
  const open = (src) => { if(!src) return; img.src = src; modal.classList.add('is-open'); document.body.style.overflow = 'hidden'; };
  const hide = () => { modal.classList.remove('is-open'); document.body.style.overflow = ''; setTimeout(() => { img.src = ''; }, 300); };
  document.querySelectorAll('.carousel-slide img, .media-image-container img').forEach(el => {
    if (el.dataset.lb) return; el.dataset.lb = "true";
    el.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); open(el.src); });
  });
  if (close) close.addEventListener('click', hide);
  if (back) back.addEventListener('click', hide);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modal.classList.contains('is-open')) hide(); });
})();
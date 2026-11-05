// CarGoa front-end: mobile nav, rate-board filters, booking choice, scenes/videos, photo lightbox.
document.documentElement.classList.add('js');

// Mobile nav
(function () {
  const btn = document.querySelector('.nav-toggle');
  const nav = document.getElementById('nav');
  if (!btn || !nav) return;
  const close = () => { nav.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); btn.textContent = 'Menu'; };
  btn.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    btn.setAttribute('aria-expanded', String(open));
    btn.textContent = open ? 'Close' : 'Menu';
  });
  nav.addEventListener('click', (e) => { if (e.target.closest('a')) close(); });
})();

// Rate-board filters: one body type at a time, plus an automatic-only toggle
document.querySelectorAll('.board-sec').forEach((sec) => {
  const chips = sec.querySelectorAll('.chip[data-type]');
  const auto = sec.querySelector('.chip[data-auto]');
  const rows = sec.querySelectorAll('.row');
  const empty = sec.querySelector('.board-empty');
  if (!chips.length) return;
  let type = 'all';
  function apply() {
    const autoOnly = auto && auto.getAttribute('aria-pressed') === 'true';
    let shown = 0;
    rows.forEach((r) => {
      const ok = (type === 'all' || r.dataset.type === type) && (!autoOnly || r.dataset.auto === 'true');
      r.hidden = !ok;
      if (ok) shown++;
    });
    if (empty) empty.hidden = shown > 0;
  }
  chips.forEach((c) => c.addEventListener('click', () => {
    type = c.dataset.type;
    chips.forEach((o) => o.setAttribute('aria-pressed', String(o === c)));
    apply();
  }));
  if (auto) auto.addEventListener('click', () => {
    auto.setAttribute('aria-pressed', String(auto.getAttribute('aria-pressed') !== 'true'));
    apply();
  });
});

// "Book now": offer WhatsApp chat or a phone call. Without JS the link goes straight to WhatsApp.
(function () {
  const dlg = document.getElementById('book-dlg');
  if (!dlg || typeof dlg.showModal !== 'function') return;
  const carEl = dlg.querySelector('.dlg-car');
  const waEl = dlg.querySelector('.dlg-wa');
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[data-book]');
    if (!a) return;
    e.preventDefault();
    const car = a.dataset.book;
    carEl.textContent = car ? 'the ' + car : 'a car';
    waEl.href = a.href; // already carries the right pre-filled message
    dlg.showModal();
    waEl.focus();
  });
  // Click on the backdrop closes it
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
})();

// Driving scenes: pause when off screen; a real clip plays only while visible; visitors can pause
(function () {
  const scenes = document.querySelectorAll('.scene');
  if (!scenes.length) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  scenes.forEach((s) => {
    const btn = s.querySelector('.sc-toggle');
    const video = s.querySelector('video');
    s.userPaused = reduce;
    function sync() {
      const run = s.visible && !s.userPaused;
      s.classList.toggle('paused', !run);
      btn.setAttribute('aria-pressed', String(s.userPaused));
      btn.setAttribute('aria-label', s.userPaused ? 'Play animation' : 'Pause animation');
      if (video) {
        if (run) { video.preload = 'auto'; video.play().catch(() => {}); }
        else video.pause();
      }
    }
    s.sync = sync;
    btn.addEventListener('click', () => { s.userPaused = !s.userPaused; sync(); });
    if (video) video.addEventListener('error', () => video.remove()); // fall back to the animation
    sync();
  });
  const io = new IntersectionObserver((entries) => entries.forEach((en) => { en.target.visible = en.isIntersecting; en.target.sync(); }), { threshold: 0.15 });
  scenes.forEach((s) => io.observe(s));
})();

// Home hero reel: crossfade through the featured cars; "Now showing" follows along
(function () {
  const imgs = [...document.querySelectorAll('.hero-media img')];
  const now = document.querySelector('.hero-now');
  if (imgs.length < 2 || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const label = now && now.querySelector('span');
  let i = 0, visible = true;
  new IntersectionObserver(([en]) => { visible = en.isIntersecting; }).observe(document.querySelector('.hero'));
  setInterval(() => {
    if (!visible || document.hidden) return;
    imgs[i].classList.remove('on');
    i = (i + 1) % imgs.length;
    imgs[i].classList.add('on');
    if (now) {
      now.href = imgs[i].dataset.url;
      label.style.opacity = 0;
      setTimeout(() => { label.textContent = imgs[i].dataset.car; label.style.opacity = 1; }, 400);
    }
  }, 6000);
})();

// Car photo reel: crossfade to the next photo every few seconds while on screen
document.querySelectorAll('[data-reel]').forEach((reel) => {
  const imgs = [...reel.querySelectorAll('img')];
  const btn = reel.querySelector('.sc-toggle');
  if (imgs.length < 2) return;
  let i = 0, visible = false, userPaused = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const sync = () => {
    reel.classList.toggle('paused', userPaused || !visible);
    btn.setAttribute('aria-pressed', String(userPaused));
    btn.setAttribute('aria-label', userPaused ? 'Play slideshow' : 'Pause slideshow');
  };
  setInterval(() => {
    if (userPaused || !visible || document.hidden) return;
    imgs[i].classList.remove('on');
    i = (i + 1) % imgs.length;
    imgs[i].classList.add('on');
  }, 5000);
  btn.addEventListener('click', () => { userPaused = !userPaused; sync(); });
  new IntersectionObserver(([en]) => { visible = en.isIntersecting; sync(); }, { threshold: 0.2 }).observe(reel);
  sync();
});

// Car photo lightbox
(function () {
  const items = [...document.querySelectorAll('.gal-item')];
  const box = document.querySelector('.lightbox');
  if (!items.length || !box || typeof box.showModal !== 'function') return;
  const img = box.querySelector('img');
  let i = 0;
  const show = (n) => { i = (n + items.length) % items.length; img.src = items[i].dataset.full; img.alt = items[i].querySelector('img').alt; };
  items.forEach((it, n) => it.addEventListener('click', () => { show(n); box.showModal(); }));
  box.querySelector('.lb-prev').addEventListener('click', () => show(i - 1));
  box.querySelector('.lb-next').addEventListener('click', () => show(i + 1));
  box.addEventListener('keydown', (e) => { if (e.key === 'ArrowLeft') show(i - 1); if (e.key === 'ArrowRight') show(i + 1); });
  box.addEventListener('click', (e) => { if (e.target === box) box.close(); });
})();

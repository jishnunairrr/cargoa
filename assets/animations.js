// CarGoa motion, built on GSAP + ScrollTrigger.
// Everything is visible without this file: if GSAP fails to load or the visitor
// prefers reduced motion, the showroom still swaps cars, just without movement.
(function () {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const gs = window.gsap && window.ScrollTrigger ? window.gsap : null;
  const animate = !!gs && !reduce;
  if (gs) gs.registerPlugin(window.ScrollTrigger);

  /* ===== Header: compact with a shadow once you scroll ===== */
  const head = document.querySelector('.site-head');
  if (head) {
    const onScroll = () => head.classList.toggle('scrolled', scrollY > 12);
    addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ===== Showroom: swap the car on the road ===== */
  (function () {
    const root = document.getElementById('showroom');
    const dataEl = document.getElementById('sr-data');
    if (!root || !dataEl) return;
    const cars = JSON.parse(dataEl.textContent);
    const thumbs = [...root.querySelectorAll('.sr-thumb')];
    const q = (s) => root.querySelector(s);
    const nameEl = q('.sr-name'), blurbEl = q('.sr-blurb');
    const waEl = q('.sr-wa'), linkEl = q('.sr-link'), road = q('.sr-road');
    const spec = (k) => q(`[data-k="${k}"]`);
    // front/back are logical roles, swapped on every click, so fast clicking
    // always animates from the car that's showing to the one requested.
    let front = q('.sr-front'), back = q('.sr-back');
    let current = Math.max(0, thumbs.findIndex((t) => t.getAttribute('aria-pressed') === 'true'));

    function select(i, dir) {
      i = (i + cars.length) % cars.length;
      if (i === current) return;
      dir = dir || (i > current ? 1 : -1);
      const c = cars[i];

      thumbs.forEach((t, k) => t.setAttribute('aria-pressed', String(k === i)));
      const strip = thumbs[i].parentElement;
      strip.scrollTo({ left: thumbs[i].offsetLeft - strip.clientWidth / 2 + thumbs[i].clientWidth / 2, behavior: animate ? 'smooth' : 'auto' });

      back.innerHTML = c.svg;
      const outEl = front, inEl = back;
      front = inEl; back = outEl;
      outEl.setAttribute('aria-hidden', 'true'); inEl.removeAttribute('aria-hidden');

      nameEl.textContent = c.name;
      blurbEl.textContent = c.blurb;
      spec('seats').textContent = c.seats;
      spec('gearbox').textContent = c.gearbox;
      spec('fuel').textContent = c.fuel;
      waEl.href = c.wa;
      waEl.dataset.book = c.name;
      linkEl.href = c.url;

      if (animate) {
        gs.killTweensOf([outEl, inEl]);
        // Old car drives off, new car drives in from the other side
        gs.to(outEl, { xPercent: -70 * dir, opacity: 0, duration: 0.5, ease: 'power2.in' });
        gs.fromTo(inEl, { xPercent: 70 * dir, opacity: 0 }, { xPercent: 0, opacity: 1, duration: 0.85, ease: 'power3.out', delay: 0.12 });
        // Photos settle in with a slight zoom; drawn cars spin their wheels
        const photo = inEl.querySelector('.sr-photo');
        if (photo) gs.fromTo(photo, { scale: 1.12 }, { scale: 1, duration: 1.4, ease: 'power3.out', delay: 0.12 });
        const wheels = inEl.querySelectorAll('.wheel');
        if (wheels.length) gs.fromTo(wheels, { rotation: 720 * dir }, { rotation: 0, transformOrigin: '50% 50%', duration: 0.95, ease: 'power3.out', delay: 0.12 });
        if (road) gs.fromTo(road, { '--dash': '0px' }, { '--dash': `${-240 * dir}px`, duration: 0.9, ease: 'power3.out' });
        gs.fromTo([nameEl, blurbEl], { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, stagger: 0.06, ease: 'power2.out' });
      } else {
        outEl.style.opacity = 0;
        inEl.style.opacity = 1;
        inEl.style.transform = 'none';
      }
      current = i;
    }

    thumbs.forEach((t, i) => t.addEventListener('click', () => select(i)));
    q('.sr-prev').addEventListener('click', () => select(current - 1, -1));
    q('.sr-next').addEventListener('click', () => select(current + 1, 1));
    // Clicking the car itself also moves on (people tap it expecting something to happen)
    q('.sr-stage').addEventListener('click', (e) => { if (!e.target.closest('.sr-arrow')) select(current + 1, 1); });
    root.addEventListener('keydown', (e) => {
      if (!e.target.closest('.sr-strip, .sr-stage')) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); select(current + 1, 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); select(current - 1, -1); }
    });
  })();

  if (!animate) return;
  const ST = window.ScrollTrigger;

  /* ===== Hero entrance: words rise, the plate is hung up and swings ===== */
  (function () {
    const h1 = document.querySelector('.hero h1');
    if (!h1) return;
    h1.setAttribute('aria-label', h1.textContent);
    h1.innerHTML = h1.textContent.split(' ').map((w) => `<span class="w" aria-hidden="true"><span class="wi">${w}</span></span>`).join(' ');

    // Cinematic open: the photo eases in from dark, words rise, then the plate is hung up and swings
    const tl = gs.timeline({ defaults: { ease: 'power3.out' } });
    tl.from('.hero-media', { opacity: 0, duration: 1.6, ease: 'power2.out' }, 0)
      .from('.hero h1 .wi', { yPercent: 115, duration: 1, stagger: 0.05 }, 0.3)
      .from('.hero .lead, .hero-cta > *', { y: 18, opacity: 0, duration: 0.7, stagger: 0.08 }, '-=0.6')
      .from('.hero-foot', { opacity: 0, duration: 0.8 }, '-=0.3')
      .from('.hero-plate .plate', { y: -40, rotation: -9, opacity: 0, transformOrigin: '22% 0%', duration: 1.6, ease: 'elastic.out(1, 0.4)' }, '-=0.6');

    // The photo sinks slower than the page as you scroll (parallax) and the copy fades out
    gs.to('.hero-media', { yPercent: 14, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    gs.to('.hero-inner', { opacity: 0, y: -40, ease: 'none', scrollTrigger: { trigger: '.hero', start: '30% top', end: 'bottom top', scrub: true } });
  })();

  /* ===== Car page: the car drives into its scene, or the photo reel opens ===== */
  if (document.querySelector('.scene-car, .reel')) {
    if (document.querySelector('.scene-car')) gs.from('.scene-car .sc-car', { xPercent: -220, duration: 1.5, ease: 'power3.out', delay: 0.15 });
    else gs.from('.reel', { clipPath: 'inset(0 0 0 100%)', duration: 1.2, ease: 'power3.inOut' });
    gs.from('.car-hero h1, .car-hero .lead, .specs > div, .car-hero .hero-cta > *', { y: 16, opacity: 0, duration: 0.6, stagger: 0.05, ease: 'power2.out', delay: 0.2 });
  }

  // Goa drives: each photo is unveiled from the bottom with a slow settle, one after another
  gs.utils.toArray('.drive .place, .drive .scene-tile').forEach((t, i) => {
    const st = { trigger: t, start: 'top 85%', once: true };
    gs.from(t, { clipPath: 'inset(100% 0 0 0)', duration: 1.2, delay: i * 0.12, ease: 'power3.inOut', scrollTrigger: st });
    const inner = t.querySelector('img, .sc-car');
    if (inner) gs.from(inner, { scale: 1.25, duration: 1.8, delay: i * 0.12, ease: 'power3.out', scrollTrigger: st });
  });
  // Each drive photo drifts slightly against the scroll
  gs.utils.toArray('.place img').forEach((img) => gs.fromTo(img, { yPercent: -6 }, { yPercent: 6, ease: 'none', scrollTrigger: { trigger: img, start: 'top bottom', end: 'bottom top', scrub: true } }));
  // Closing band: the sunset slides under the copy
  if (document.querySelector('.band-bg')) gs.fromTo('.band-bg', { yPercent: -10, scale: 1.15 }, { yPercent: 10, scale: 1.15, ease: 'none', scrollTrigger: { trigger: '.band-sec', start: 'top bottom', end: 'bottom top', scrub: true } });

  /* ===== Scroll reveals ===== */
  gs.utils.toArray('.sec-head, .faq-wrap > h2, .bring > h2, .form-grid > div').forEach((el) => {
    gs.from(el.matches('.sec-head') ? el.children : el, { y: 28, opacity: 0, duration: 0.8, stagger: 0.08, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
  });

  // Rate board rows slide in one after another; each car rolls in
  const rows = gs.utils.toArray('.row');
  if (rows.length) {
    // One trigger per row (not ScrollTrigger.batch, which skipped rows already on screen
    // when the page was reloaded part-way down). Rows on screen together get a small stagger.
    rows.forEach((r) => {
      const st = { trigger: r, start: 'top 94%', once: true };
      const delay = () => (r.getBoundingClientRect().top / innerHeight) * 0.25;
      gs.from(r, { opacity: 0, x: -24, duration: 0.7, ease: 'power2.out', delay, scrollTrigger: st });
      const art = r.querySelector('.car-sil, .row-thumb');
      if (art) gs.from(art, { x: -36, duration: 0.9, ease: 'power3.out', delay, scrollTrigger: st });
    });
    // Filtering shows rows that may never have scrolled in; drop their pending reveals
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.chip')) return;
      rows.forEach((r) => gs.killTweensOf([r, r.querySelector('.car-sil, .row-thumb')]));
      gs.set(rows, { opacity: 1, x: 0 });
      ST.refresh();
    });
  }

  // Showroom stage and thumbnails
  if (document.querySelector('.sr')) {
    gs.from('.sr-stage', { clipPath: 'inset(0 100% 0 0)', duration: 1.2, ease: 'power3.inOut', scrollTrigger: { trigger: '.sr', start: 'top 80%', once: true } });
    gs.from('.sr-front', { xPercent: -80, opacity: 0, duration: 1, delay: 0.5, ease: 'power3.out', scrollTrigger: { trigger: '.sr', start: 'top 80%', once: true } });
    gs.from('.sr-info > *', { y: 20, opacity: 0, duration: 0.6, stagger: 0.07, delay: 0.3, ease: 'power2.out', scrollTrigger: { trigger: '.sr', start: 'top 80%', once: true } });
    gs.from('.sr-thumb', { y: 24, opacity: 0, duration: 0.5, stagger: 0.04, ease: 'power2.out', scrollTrigger: { trigger: '.sr-strip', start: 'top 95%', once: true } });
  }

  // Booking steps: the yellow line fills as you scroll through them
  if (document.querySelector('.steps')) {
    gs.fromTo('.steps-progress span', { scaleX: 0 }, { scaleX: 1, ease: 'none', scrollTrigger: { trigger: '.steps', start: 'top 80%', end: 'bottom 55%', scrub: 0.4 } });
    gs.from('.steps li', { y: 40, opacity: 0, duration: 0.7, stagger: 0.12, ease: 'power3.out', scrollTrigger: { trigger: '.steps', start: 'top 82%', once: true } });
  }

  [['.deliv-item', '.deliv'], ['.bring dl > div', '.bring dl'], ['.faq details', '.faq'], ['.enq > *', '.enq']].forEach(([items, trigger]) => {
    if (!document.querySelector(trigger)) return;
    gs.from(items, { y: 22, opacity: 0, duration: 0.55, stagger: 0.05, ease: 'power2.out', scrollTrigger: { trigger, start: 'top 88%', once: true } });
  });

  // Recalculate once fonts and layout settle so start positions are right
  addEventListener('load', () => ST.refresh());

  /* ===== Cursor glow (real mouse only, not touch) ===== */
  if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
    const dot = document.createElement('div'); dot.id = 'cur-dot';
    const ring = document.createElement('div'); ring.id = 'cur-ring';
    document.body.append(ring, dot);
    const dx = gs.quickTo(dot, 'x', { duration: 0.12 }), dy = gs.quickTo(dot, 'y', { duration: 0.12 });
    const rx = gs.quickTo(ring, 'x', { duration: 0.45, ease: 'power3' }), ry = gs.quickTo(ring, 'y', { duration: 0.45, ease: 'power3' });
    addEventListener('pointermove', (e) => {
      document.body.classList.add('cur-on');
      dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY);
    }, { passive: true });
    document.addEventListener('pointerleave', () => document.body.classList.remove('cur-on'));
    const hot = 'a, button, input, select, textarea, summary, .sr-stage';
    document.addEventListener('pointerover', (e) => ring.classList.toggle('hot', !!e.target.closest(hot)));
  }
})();

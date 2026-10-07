/* main.js — interactions: preloader, cursor, nav, reveal, tilt, marquee pause */
(function () {
  'use strict';

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- preloader ---------- */
  const preloader = document.getElementById('preloader');
  const preBar = document.getElementById('preBar');
  let progress = 0;
  const tick = setInterval(() => {
    progress = Math.min(100, progress + Math.random() * 22);
    if (preBar) preBar.style.width = progress + '%';
    if (progress >= 100) {
      clearInterval(tick);
      setTimeout(() => {
        if (preloader) preloader.classList.add('done');
      }, 250);
    }
  }, 120);
  // safety: never trap the user behind the loader
  setTimeout(() => {
    clearInterval(tick);
    if (preloader) preloader.classList.add('done');
  }, 2500);

  /* ---------- custom cursor ---------- */
  const dot = document.getElementById('cursorDot');
  const ring = document.getElementById('cursorRing');
  if (dot && ring && !prefersReduced && window.matchMedia('(hover:hover)').matches) {
    let mx = -100, my = -100, rx = -100, ry = -100;
    window.addEventListener('mousemove', (e) => {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = `translate(${mx}px,${my}px) translate(-50%,-50%)`;
    }, { passive: true });
    (function follow() {
      rx += (mx - rx) * 0.16;
      ry += (my - ry) * 0.16;
      ring.style.transform = `translate(${rx}px,${ry}px) translate(-50%,-50%)`;
      requestAnimationFrame(follow);
    })();
    document.querySelectorAll('a, button, [data-cursor]').forEach((el) => {
      el.addEventListener('mouseenter', () => ring.classList.add('hovering'));
      el.addEventListener('mouseleave', () => ring.classList.remove('hovering'));
    });
  }

  /* ---------- nav: scrolled state + hide on scroll down ---------- */
  const nav = document.getElementById('nav');
  let lastY = 0;
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    nav.classList.toggle('scrolled', y > 40);
    if (y > lastY && y > 300) nav.classList.add('hide');
    else nav.classList.remove('hide');
    lastY = y;
  }, { passive: true });

  /* ---------- progress bar ---------- */
  const bar = document.getElementById('progressBar');
  window.addEventListener('scroll', () => {
    const h = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = (h > 0 ? (window.scrollY / h) * 100 : 0) + '%';
  }, { passive: true });

  /* ---------- mobile menu ---------- */
  const burger = document.getElementById('burger');
  const mobileMenu = document.getElementById('mobileMenu');
  function closeMenu() {
    burger.classList.remove('open');
    mobileMenu.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }
  burger.addEventListener('click', () => {
    const open = !mobileMenu.classList.contains('open');
    burger.classList.toggle('open', open);
    mobileMenu.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
  });
  mobileMenu.querySelectorAll('a').forEach((a) => a.addEventListener('click', closeMenu));

  /* ---------- language toggle ---------- */
  const langToggle = document.getElementById('langToggle');
  langToggle.addEventListener('click', () => {
    const next = document.documentElement.lang === 'tr' ? 'en' : 'tr';
    document.body.classList.add('lang-switching');
    // i18n.js exposes applyLang globally
    if (typeof window.applyLang === 'function') window.applyLang(next);
    setTimeout(() => document.body.classList.remove('lang-switching'), 500);
  });

  /* ---------- reveal on scroll ---------- */
  const reveals = document.querySelectorAll('.reveal');
  if (!prefersReduced && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            en.target.classList.add('visible');
            io.unobserve(en.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add('visible'));
  }

  /* ---------- project card tilt ---------- */
  if (!prefersReduced && window.matchMedia('(hover:hover)').matches) {
    document.querySelectorAll('[data-tilt]').forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = `perspective(900px) rotateX(${(-y * 3).toFixed(2)}deg) rotateY(${(x * 3).toFixed(2)}deg) translateY(-2px)`;
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
      });
    });
  }

  /* ---------- marquee: pause on hover ---------- */
  const track = document.getElementById('marqueeTrack');
  const marquee = track && track.parentElement;
  if (marquee) {
    marquee.addEventListener('mouseenter', () => (track.style.animationPlayState = 'paused'));
    marquee.addEventListener('mouseleave', () => (track.style.animationPlayState = 'running'));
  }

  /* ---------- back to top ---------- */
  document.getElementById('toTop').addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: prefersReduced ? 'auto' : 'smooth' });
  });

  /* ---------- parallax orbs ---------- */
  if (!prefersReduced) {
    const orbs = document.querySelectorAll('.orb');
    window.addEventListener('mousemove', (e) => {
      const cx = e.clientX / window.innerWidth - 0.5;
      const cy = e.clientY / window.innerHeight - 0.5;
      orbs.forEach((orb, i) => {
        const f = i === 0 ? 26 : -18;
        orb.style.marginLeft = (cx * f) + 'px';
        orb.style.marginTop = (cy * f) + 'px';
      });
    }, { passive: true });
  }
})();

/* MONOLIT — UI overlay controller
 * Exposes window.UI = { getScrollProgress, onScroll, setLang, currentLang }
 * Sections are fixed; #journey (700vh) drives window scroll → progress 0..1.
 * Reveal windows in progress space:
 *   hero    0.00–0.15  (fade out by 0.15)
 *   about   0.15–0.35
 *   work    0.35–0.60
 *   exp     0.60–0.82
 *   contact 0.82–1.00
 */
(function () {
  "use strict";

  /* ---------------- i18n dictionary ---------------- */
  var I18N = {
    tr: {
      "nav.works": "İşler",
      "nav.about": "Hakkımda",
      "nav.experience": "Deneyim",
      "nav.contact": "İletişim",

      "hero.kicker": "Portfolyo — 2026",
      "hero.first": "ŞAHİN",
      "hero.last": "ŞANLI",
      "hero.role": "iOS & Flutter Geliştiricisi · QA Test Otomasyonu",

      "about.title": "Hakkımda",
      "about.lead":
        "KTÜ Yazılım Mühendisliği mezunuyum. Native iOS ve Flutter ile uçtan uca mobil geliştirme; ~80 otomasyon testi yazdım. Hızlı öğrenen, işini sahiplenen bir geliştiriciyim.",
      "about.f1.k": "Eğitim",
      "about.f1.v": "Yazılım Mühendisliği — KTÜ, 2022–2026",
      "about.f2.k": "Odak",
      "about.f2.v": "Swift · UIKit · SwiftUI · Flutter · Dart",
      "about.f3.k": "Otomasyon",
      "about.f3.v": "Playwright · TypeScript · ~80 test senaryosu",
      "about.f4.k": "Mimari",
      "about.f4.v": "Clean Architecture · Repository · DI · Firebase",
      "about.s1": "Swift / UIKit / SwiftUI",
      "about.s2": "Flutter / Dart / Provider",
      "about.s3": "Playwright / TypeScript",
      "about.s4": "Firebase",
      "about.s5": "C / C++ / Java",
      "about.s6": "Clean Architecture · Repository · DI",
      "about.s7": "Linux",

      "work.title": "Seçilmiş İşler",
      "work.p1.d":
        "SwiftUI + SwiftData ile ses transkripsiyonu ve özet; Gemini API entegrasyonu. Mezuniyet projesi.",
      "work.p2.d":
        "Flutter izleme listesi uygulaması; TMDB, Clean Architecture, Provider, Dio, Firebase Auth + Firestore.",
      "work.p3.d":
        "Harita tabanlı ses keşif uygulaması; UIKit, MapKit, AVFoundation, Firebase.",
      "work.repo": "→ github.com/sahinsanli",

      "exp.title": "Deneyim",
      "exp.e1.r": "Uzun Dönem SWE Stajyeri",
      "exp.e1.d":
        "Tuula web uygulamasında Playwright + TypeScript ile ~80 test senaryosu yazdım.",
      "exp.e2.r": "iOS Stajyeri",
      "exp.e2.d":
        "Soundmap'i UIKit, CoreLocation, MapKit ve AVFoundation ile uçtan uca geliştirdim (1 ay).",
      "exp.e3.r": "Flutter Stajyeri",
      "exp.e3.d":
        "Ön muhasebe öğrenme uygulaması; kurumsal kimliğe uygun arayüz geliştirdim.",
      "exp.edu.k": "Eğitim",
      "exp.edu.v":
        "Yazılım Mühendisliği · Karadeniz Teknik Üniversitesi · 2022–2026",

      "contact.title": "İletişim",
      "contact.made": "MONOLIT — WebGL portfolyo",
      "contact.top": "↑ Başa dön"
    },
    en: {
      "nav.works": "Work",
      "nav.about": "About",
      "nav.experience": "Experience",
      "nav.contact": "Contact",

      "hero.kicker": "Portfolio — 2026",
      "hero.first": "ŞAHİN",
      "hero.last": "ŞANLI",
      "hero.role": "iOS & Flutter Developer · QA Test Automation",

      "about.title": "About",
      "about.lead":
        "KTÜ Software Engineering graduate. End-to-end mobile development with native iOS and Flutter; wrote ~80 automation tests. A fast-learning developer who takes ownership.",
      "about.f1.k": "Education",
      "about.f1.v": "Software Engineering — KTU, 2022–2026",
      "about.f2.k": "Focus",
      "about.f2.v": "Swift · UIKit · SwiftUI · Flutter · Dart",
      "about.f3.k": "Automation",
      "about.f3.v": "Playwright · TypeScript · ~80 test scenarios",
      "about.f4.k": "Architecture",
      "about.f4.v": "Clean Architecture · Repository · DI · Firebase",
      "about.s1": "Swift / UIKit / SwiftUI",
      "about.s2": "Flutter / Dart / Provider",
      "about.s3": "Playwright / TypeScript",
      "about.s4": "Firebase",
      "about.s5": "C / C++ / Java",
      "about.s6": "Clean Architecture · Repository · DI",
      "about.s7": "Linux",

      "work.title": "Selected Work",
      "work.p1.d":
        "Audio transcription and summarisation with SwiftUI + SwiftData; Gemini API integration. Graduation project.",
      "work.p2.d":
        "Flutter watchlist app; TMDB, Clean Architecture, Provider, Dio, Firebase Auth + Firestore.",
      "work.p3.d":
        "Map-based sound discovery app; UIKit, MapKit, AVFoundation, Firebase.",
      "work.repo": "→ github.com/sahinsanli",

      "exp.title": "Experience",
      "exp.e1.r": "Long-term SWE Intern",
      "exp.e1.d":
        "Wrote ~80 test scenarios with Playwright + TypeScript for the Tuula web app.",
      "exp.e2.r": "iOS Intern",
      "exp.e2.d":
        "Built Soundmap end-to-end with UIKit, CoreLocation, MapKit and AVFoundation (1 month).",
      "exp.e3.r": "Flutter Intern",
      "exp.e3.d":
        "Pre-accounting learning app; developed the interface to match the corporate identity.",
      "exp.edu.k": "Education",
      "exp.edu.v":
        "Software Engineering · Karadeniz Technical University · 2022–2026",

      "contact.title": "Contact",
      "contact.made": "MONOLIT — WebGL portfolio",
      "contact.top": "↑ Back to top"
    }
  };

  var LANG_KEY = "monolith-lang";
  var DEFAULT_LANG = "tr";

  /* ---------------- state ---------------- */
  var progress = 0;
  var listeners = [];
  var currentLang = DEFAULT_LANG;
  var rafPending = false;

  /* reveal windows in progress space [start, end] */
  var WINDOWS = {
    "sec-hero": [0.0, 0.15],
    "sec-about": [0.15, 0.35],
    "sec-work": [0.35, 0.6],
    "sec-exp": [0.6, 0.82],
    "sec-contact": [0.82, 1.0]
  };

  /* fade ramp inside a window: fully visible between
     start+ramp and end-ramp, eased in/out on the edges */
  var RAMP = 0.045;
  var sections = {};

  /* ---------------- helpers ---------------- */
  function clamp01(v) {
    return v < 0 ? 0 : v > 1 ? 1 : v;
  }

  function ease(t) {
    /* cubic in-out for smooth reveal edges */
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  /* visibility factor for a section at progress p */
  function windowAlpha(id, p) {
    var w = WINDOWS[id];
    var span = w[1] - w[0];
    var ramp = Math.min(RAMP, span * 0.4);
    /* first section fully visible at p=0, last at p=1 */
    if (id === "sec-hero" && p <= w[0]) return 1;
    if (id === "sec-contact" && p >= w[1]) return 1;
    if (p <= w[0] || p >= w[1]) return 0;
    if (p < w[0] + ramp) return ease((p - w[0]) / ramp);
    if (p > w[1] - ramp) return ease((w[1] - p) / ramp);
    return 1;
  }

  function computeProgress() {
    var doc = document.documentElement;
    var max = (doc.scrollHeight - window.innerHeight) || 1;
    return clamp01((window.pageYOffset || doc.scrollTop || 0) / max);
  }

  /* ---------------- reveal engine ---------------- */
  function applyReveal() {
    var p = progress;
    for (var id in sections) {
      if (!sections.hasOwnProperty(id)) continue;
      var el = sections[id];
      var a = windowAlpha(id, p);
      var visible = a > 0.001;
      el.style.opacity = a.toFixed(3);

      /* translate: incoming from below, outgoing drifts up */
      var w = WINDOWS[id];
      var mid = (w[0] + w[1]) / 2;
      var dir = p < mid ? 1 : -1;
      var shift = (1 - a) * 40 * dir;
      el.style.transform = "translateY(" + shift.toFixed(1) + "px)";

      var active = a > 0.5;
      if (active !== el.classList.contains("active")) {
        el.classList.toggle("active", active);
      }
      el.style.pointerEvents = visible ? "auto" : "none";
      el.style.visibility = visible ? "visible" : "hidden";
    }
  }

  function emit() {
    for (var i = 0; i < listeners.length; i++) {
      try {
        listeners[i](progress);
      } catch (e) {
        /* subscriber errors must not break the loop */
      }
    }
  }

  function frame() {
    rafPending = false;
    var p = computeProgress();
    if (p !== progress) {
      progress = p;
      applyReveal();
      emit();
    }
  }

  function requestFrame() {
    if (rafPending) return;
    rafPending = true;
    window.requestAnimationFrame(frame);
  }

  /* ---------------- language ---------------- */
  function applyLang(lang) {
    var dict = I18N[lang];
    if (!dict) return;
    currentLang = lang;

    var nodes = document.querySelectorAll("[data-i18n]");
    for (var i = 0; i < nodes.length; i++) {
      var key = nodes[i].getAttribute("data-i18n");
      if (dict.hasOwnProperty(key)) {
        nodes[i].textContent = dict[key];
      }
    }

    var btn = document.getElementById("lang");
    if (btn) btn.textContent = lang === "tr" ? "EN" : "TR";
    document.documentElement.setAttribute("lang", lang);
  }

  function storeLang(lang) {
    try {
      localStorage.setItem(LANG_KEY, lang);
    } catch (e) {
      /* private mode etc. — persistence is best-effort */
    }
  }

  function loadLang() {
    try {
      var saved = localStorage.getItem(LANG_KEY);
      if (saved && I18N[saved]) return saved;
    } catch (e) {
      /* ignore */
    }
    var nav = (navigator.language || "").toLowerCase();
    return nav.indexOf("tr") === 0 ? "tr" : "tr"; /* TR default */
  }

  function toggleLang() {
    var next = currentLang === "tr" ? "en" : "tr";
    applyLang(next);
    storeLang(next);
  }

  /* ---------------- nav ---------------- */
  function scrollToSection(id) {
    var w = WINDOWS[id];
    if (!w) return;
    var doc = document.documentElement;
    var max = (doc.scrollHeight - window.innerHeight) || 1;
    var target = ((w[0] + w[1]) / 2) * max;
    window.scrollTo({ top: target, behavior: "smooth" });
  }

  function bindNav() {
    var links = document.querySelectorAll("[data-nav]");
    for (var i = 0; i < links.length; i++) {
      links[i].addEventListener("click", function (ev) {
        ev.preventDefault();
        scrollToSection("sec-" + this.getAttribute("data-nav"));
      });
    }
    var langBtn = document.getElementById("lang");
    if (langBtn) langBtn.addEventListener("click", toggleLang);
  }

  /* ---------------- loader ---------------- */
  function runLoader() {
    var loader = document.getElementById("loader");
    if (!loader) return;
    /* CSS handles the 0.6s delay via transition-delay; total ~600ms visible */
    window.setTimeout(function () {
      loader.classList.add("done");
      window.setTimeout(function () {
        if (loader.parentNode) loader.parentNode.removeChild(loader);
      }, 1600);
    }, 600);
  }

  /* ---------------- public API ---------------- */
  window.UI = {
    getScrollProgress: function () {
      /* pure: recompute on demand WITHOUT mutating internal state —
         frame()'s change detection must remain the sole writer */
      return computeProgress();
    },
    onScroll: function (cb) {
      if (typeof cb === "function") {
        listeners.push(cb);
        /* fire immediately so subscribers can sync */
        try {
          cb(progress);
        } catch (e) {
          /* ignore */
        }
      }
    },
    setLang: function (lang) {
      if (I18N[lang]) {
        applyLang(lang);
        storeLang(lang);
      }
    },
    currentLang: function () {
      return currentLang;
    }
  };

  /* ---------------- init ---------------- */
  function init() {
    var ids = ["sec-hero", "sec-about", "sec-work", "sec-exp", "sec-contact"];
    for (var i = 0; i < ids.length; i++) {
      sections[ids[i]] = document.getElementById(ids[i]);
    }

    applyLang(loadLang());
    bindNav();
    runLoader();

    progress = computeProgress();
    applyReveal();

    window.addEventListener("scroll", requestFrame, { passive: true });
    window.addEventListener("resize", requestFrame, { passive: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

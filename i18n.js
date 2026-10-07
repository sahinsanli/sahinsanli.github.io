/* i18n — TR/EN dictionary */
const I18N = {
  tr: {
    navWork: 'İşler', navAbout: 'Hakkımda', navExperience: 'Deneyim', navContact: 'İletişim',
    heroAvailable: 'Yeni fırsatlara açığım',
    role1: 'iOS Geliştirici', role2: 'Flutter Geliştirici', role3: 'QA Otomasyon',
    ctaWork: 'İşlerimi gör', ctaContact: 'İletişime geç',
    scrollHint: 'Kaydır',
    workTitle: 'Seçili', workTitleAccent: 'İşler',
    workSub: 'Uçtan uca geliştirdiğim mobil uygulamalar',
    p1desc: 'Google Gemini API ile ses kayıtlarını otomatik transkribe eden ve özetleyen iOS uygulaması. SwiftData ile tam offline erişim. Mezuniyet projesi.',
    p2desc: 'Film izleme listesi uygulaması. Clean Architecture, Repository pattern ve dependency injection; state için Provider, ağ için Dio, bulut senkronizasyonu için Firebase Auth + Firestore.',
    p3desc: 'Harita tabanlı ses keşif uygulaması — harita entegrasyonu, ses kayıt/oynatma, tüm arayüz ve Firebase altyapısı dahil tek başıma, 1 ayda tasarımından çalışan ürüne taşıdım.',
    aboutTitle: 'Hakkımda &', aboutTitleAccent: 'Yetenekler',
    aboutLead: 'Karadeniz Teknik Üniversitesi Yazılım Mühendisliği mezunuyum.',
    aboutP1: 'Native iOS (Swift/UIKit) ve Flutter ile uçtan uca mobil uygulama geliştiriyorum. Soundmap uygulamasını harita entegrasyonu, ses kayıt/oynatma ve Firebase altyapısı dahil tek başıma geliştirdim.',
    aboutP2: 'Playwright/TypeScript ile ~80 UI ve regresyon test senaryosu kodlayarak yazılım kalite süreçlerine katkı sağladım. Hızlı öğrenen, analitik ve sahiplenici bir yaklaşımla çalışıyorum.',
    fact1: 'Staj & proje', fact2: 'Otomasyon testi', fact3: 'Platform — iOS & Flutter',
    skillsTitle: 'Yetenekler',
    skillCat1: 'Mobil', skillCat2: 'Kalite & Web', skillCat3: 'Backend & Araçlar', skillCat4: 'Mimari & Dil',
    expTitle: 'Deneyim &', expTitleAccent: 'Eğitim',
    e1role: 'Uzun Dönem Yazılım Mühendisliği Stajyeri',
    e1desc: 'Hollanda merkezli Tuula web uygulaması için Playwright ve TypeScript ile önceden planlanmış ~80 test senaryosunu sıfırdan kodladım; lokalde regresyon ve UI testleri geliştirerek test kapsamını genişlettim.',
    e2role: 'iOS Geliştirici Stajyeri',
    e2desc: "Soundmap'i UIKit, CoreLocation, MapKit ve AVFoundation ile uçtan uca tek başıma geliştirdim; 1 ayda tasarımdan çalışan ürüne taşıdım.",
    e3role: 'Flutter Geliştirici Stajyeri',
    e3desc: "Şirketin ön muhasebe yazılımı için muhasebe terimlerini öğreten Flutter uygulamasını sıfırdan tasarlayıp geliştirdim; kurumsal kimliğe uygun özel arayüz uyguladım.",
    eduRole: 'Yazılım Mühendisliği', eduOrg: 'Karadeniz Teknik Üniversitesi', eduDesc: 'Lisans derecesi.',
    contactEyebrow: 'Bir sonraki projen mi var?',
    contactLine1: 'Birlikte bir şeyler', contactLine2: 'inşa edelim',
    footerNote: 'Saf HTML/CSS/JS ile elle yapıldı',
  },
  en: {
    navWork: 'Work', navAbout: 'About', navExperience: 'Experience', navContact: 'Contact',
    heroAvailable: 'Open to new opportunities',
    role1: 'iOS Developer', role2: 'Flutter Developer', role3: 'QA Automation',
    ctaWork: 'See my work', ctaContact: 'Get in touch',
    scrollHint: 'Scroll',
    workTitle: 'Selected', workTitleAccent: 'Work',
    workSub: 'Mobile apps I built end-to-end',
    p1desc: 'iOS app that automatically transcribes and summarizes voice recordings using the Google Gemini API. Full offline access with SwiftData. Graduation project.',
    p2desc: 'Movie watchlist app. Clean Architecture, Repository pattern and dependency injection; Provider for state, Dio for networking, Firebase Auth + Firestore for cloud sync.',
    p3desc: 'Map-based audio discovery app — map integration, audio recording/playback, the full UI and Firebase backend, built single-handedly from design to a working product in one month.',
    aboutTitle: 'About &', aboutTitleAccent: 'Skills',
    aboutLead: "Software Engineering graduate of Karadeniz Technical University.",
    aboutP1: 'I build mobile apps end-to-end with native iOS (Swift/UIKit) and Flutter. I developed Soundmap independently, including map integration, audio recording/playback, and the Firebase backend.',
    aboutP2: "I coded ~80 UI and regression test scenarios with Playwright/TypeScript, contributing to software quality processes. Fast learner with a proactive, ownership-driven approach.",
    fact1: 'Internships & projects', fact2: 'Automation tests', fact3: 'Platforms — iOS & Flutter',
    skillsTitle: 'Skills',
    skillCat1: 'Mobile', skillCat2: 'Quality & Web', skillCat3: 'Backend & Tools', skillCat4: 'Architecture & Languages',
    expTitle: 'Experience &', expTitleAccent: 'Education',
    e1role: 'Long-Term Software Engineering Intern',
    e1desc: 'Coded roughly 80 planned-but-unimplemented test scenarios from scratch with Playwright and TypeScript for Tuula, a Netherlands-based web app; expanded test coverage with local regression and UI tests.',
    e2role: 'iOS Developer Intern',
    e2desc: 'Developed Soundmap end-to-end single-handedly with UIKit, CoreLocation, MapKit and AVFoundation; delivered from design to working product in one month.',
    e3role: 'Flutter Developer Intern',
    e3desc: 'Designed and built a Flutter learning app for the company’s bookkeeping software, teaching accounting terms through list and detail screens with a custom brand-matched UI.',
    eduRole: 'Software Engineering', eduOrg: 'Karadeniz Technical University', eduDesc: "Bachelor's degree.",
    contactEyebrow: 'Got a next project?',
    contactLine1: "Let's build", contactLine2: 'something together',
    footerNote: 'Handcrafted with plain HTML/CSS/JS',
  },
};

/* apply language to every [data-i18n] element */
function applyLang(lang) {
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (I18N[lang][key] !== undefined) el.textContent = I18N[lang][key];
  });
  const label = document.querySelector('[data-lang-label]');
  if (label) label.textContent = lang === 'tr' ? 'EN' : 'TR';
  document.title =
    lang === 'tr'
      ? 'Şahin Şanlı — Mobil Geliştirici'
      : 'Sahin Sanli — Mobile Developer';
  try { localStorage.setItem('lang', lang); } catch (e) {}
}

/* init */
(function () {
  let saved = null;
  try { saved = localStorage.getItem('lang'); } catch (e) {}
  const initial = saved === 'en' || saved === 'tr' ? saved : 'tr';
  applyLang(initial);
})();

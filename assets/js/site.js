// The Atlas Network - shared page behaviour.

// In the embedded preview, refreshing reloads the site from its homepage. Remember the page
// being viewed and return to it after a refresh. Only runs when the site is inside a frame,
// so the live website and the back button behave normally.
(() => {
  if (window.self === window.top) return;
  // Remember the page only (not a #section), so a refresh always opens it at the top.
  const page = location.pathname.split('/').pop() || 'index.html';
  try {
    const nav = (performance.getEntriesByType('navigation')[0] || {}).type;
    const clicked = sessionStorage.getItem('atlas:clicked');
    sessionStorage.removeItem('atlas:clicked');
    const last = sessionStorage.getItem('atlas:page');
    if (page.startsWith('index.html') && last && !last.startsWith('index.html') && !clicked && nav !== 'back_forward') {
      location.replace(last);
      return;
    }
    sessionStorage.setItem('atlas:page', page);
    document.addEventListener('click', e => {
      const a = e.target.closest('a[href]');
      if (a && a.origin === location.origin) sessionStorage.setItem('atlas:clicked', '1');
    });
  } catch (e) { /* storage unavailable: refresh simply returns to the homepage */ }
})();

const btn = document.getElementById('menu-btn');
const menu = document.getElementById('menu');

// Every page opens at the top: after clicking a menu link, going back or forward, or refreshing.
// Only a fresh click on a link to a specific section (#anchor) lands on that section.
// Works the same on phones: mobile Safari and Chrome restore pages from the back/forward cache
// and can reapply an old scroll position just after load, so the jump is repeated briefly.
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
const navType = (performance.getEntriesByType('navigation')[0] || {}).type || 'navigate';
let userMoved = false;
['touchstart', 'wheel', 'keydown'].forEach(t => addEventListener(t, () => { userMoved = true; }, { passive: true }));
const jumpTop = () => {
  const root = document.documentElement;
  const smooth = root.style.scrollBehavior;
  root.style.scrollBehavior = 'auto';  // instant, not the page's smooth scrolling
  scrollTo(0, 0);
  root.scrollTop = 0;
  document.body.scrollTop = 0;
  root.style.scrollBehavior = smooth;
};
const goToTop = () => {
  if (location.hash) history.replaceState(null, '', location.pathname + location.search);
  userMoved = false;
  jumpTop();
  // Catch a late scroll restore (mainly iOS Safari) unless the visitor has started scrolling.
  requestAnimationFrame(() => { if (!userMoved) jumpTop(); });
  [60, 250].forEach(ms => setTimeout(() => { if (!userMoved && scrollY > 0) jumpTop(); }, ms));
};
const startsAtTop = () => navType !== 'navigate' || !location.hash;
if (startsAtTop()) goToTop();
addEventListener('load', () => { if (startsAtTop() && !userMoved) jumpTop(); });
addEventListener('pageshow', e => {
  if (e.persisted) {
    // Restored from the back/forward cache: close the mobile menu, start at the top
    // and play the entrance animations again.
    const openMenu = document.getElementById('menu');
    const menuBtn = document.getElementById('menu-btn');
    if (openMenu) openMenu.classList.remove('open');
    if (menuBtn) menuBtn.setAttribute('aria-expanded', 'false');
    goToTop();
    document.dispatchEvent(new Event('atlas:replay'));
  } else if (startsAtTop()) {
    goToTop();
  }
});

// About header logo: line its left edge up with the last link in the top menu.
const headLogo = document.querySelector('.head-logo');
if (headLogo) {
  const placeLogo = () => {
    const links = document.querySelectorAll('.topbar a[href="disclaimer.html"]');
    const link = [...links].find(a => a.offsetParent !== null);
    if (!link) return;
    const box = headLogo.parentElement.getBoundingClientRect();
    headLogo.style.setProperty('--logo-x', `${link.getBoundingClientRect().left - box.left}px`);
  };
  placeLogo();
  addEventListener('resize', placeLogo);
  if (document.fonts) document.fonts.ready.then(placeLogo);
}

// Video play buttons: start the video, then fade the button out a second later.
// It comes back whenever the video is paused or finishes.
document.querySelectorAll('.video-play').forEach(button => {
  const video = button.parentElement.querySelector('video');
  if (!video) return;
  let timer;
  const hideSoon = () => { clearTimeout(timer); timer = setTimeout(() => button.classList.add('is-hidden'), 1000); };
  const show = () => { clearTimeout(timer); button.classList.remove('is-hidden'); };
  button.addEventListener('click', () => { video.play(); hideSoon(); });
  video.addEventListener('play', hideSoon);
  video.addEventListener('pause', show);
  video.addEventListener('ended', show);
});

// Respect reduced-motion settings: show the banner's first frame instead of the loop.
const bannerVideo = document.querySelector('.banner video');
if (bannerVideo && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  bannerVideo.removeAttribute('autoplay');
  bannerVideo.pause();
}

// Mobile menu toggle
if (btn && menu) {
  btn.addEventListener('click', () => {
    const open = menu.classList.toggle('open');
    btn.setAttribute('aria-expanded', String(open));
  });
}

// In-page links scroll smoothly and close the mobile menu.
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth' });
    history.replaceState(null, '', a.getAttribute('href'));
    if (menu) menu.classList.remove('open');
    if (btn) btn.setAttribute('aria-expanded', 'false');
  });
});

// Motion system: progressive, restrained and completely optional. Content stays visible
// when JavaScript is unavailable, and every effect is disabled for reduced-motion users.
(() => {
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const topbar = document.querySelector('.topbar');
  const page = document.documentElement;

  const revealSelectors = [
    '.page-head > .container', '.section-head', '.detail-head',
    '.detail-grid > *', '.service', '.tile', '.faq details', '.next-card',
    '.facts li', '.ref-block', '.ref-list li', '.timeline li',
    '.brief-head', '.brief-card', '.footer-cols > *', '.legal-doc > *',
    '.prose-cols > *', '.includes li', '.scm-intro', '.referral-text > *',
    '.video-frame', '.join-cta', '.split > *'
  ];
  const revealItems = [...document.querySelectorAll(revealSelectors.join(','))];

  revealItems.forEach((item, index) => {
    item.classList.add('reveal');
    const parent = item.parentElement;
    const siblingIndex = parent ? [...parent.children].indexOf(item) : index;
    item.style.setProperty('--reveal-delay', `${Math.min(siblingIndex, 5) * 70}ms`);
  });

  // Only switch on hidden starting states once all reveal targets are prepared.
  page.classList.add('motion-ready');

  if (!reducedMotion.matches && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -7% 0px' });
    revealItems.forEach(item => observer.observe(item));

    // Replay: hide everything again and let it animate back in as it comes into view.
    document.addEventListener('atlas:replay', () => {
      revealItems.forEach(item => { item.classList.remove('is-visible'); observer.observe(item); });
      document.querySelectorAll('.banner .container > *').forEach(el => {
        el.style.animation = 'none';
        void el.offsetWidth;
        el.style.animation = '';
      });
    });
  } else {
    revealItems.forEach(item => item.classList.add('is-visible'));
  }

  // Gentle depth on selected media. The range is intentionally small so the layout
  // still feels precise and professional rather than effect-driven.
  const parallaxItems = [];
  const registerParallax = (element, depth) => {
    if (!element) return;
    element.classList.add('js-parallax-media');
    parallaxItems.push({ element, depth });
  };
  registerParallax(document.querySelector('.banner > video, .banner > img'), 0.12);
  document.querySelectorAll('.detail-media img, .video-frame video').forEach((item, index) => {
    registerParallax(item, index % 2 ? 0.045 : 0.065);
  });

  let ticking = false;
  const updateMotion = () => {
    ticking = false;
    if (topbar) topbar.classList.toggle('is-scrolled', scrollY > 18);

    if (reducedMotion.matches) return;
    parallaxItems.forEach(({ element, depth }) => {
      const host = element.parentElement;
      if (!host) return;
      const rect = host.getBoundingClientRect();
      if (rect.bottom < -120 || rect.top > innerHeight + 120) return;
      const centerOffset = rect.top + rect.height / 2 - innerHeight / 2;
      const shift = Math.max(-28, Math.min(28, -centerOffset * depth));
      element.style.setProperty('--parallax-y', `${shift.toFixed(2)}px`);
    });
  };
  const requestMotion = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(updateMotion);
  };

  addEventListener('scroll', requestMotion, { passive: true });
  addEventListener('resize', requestMotion, { passive: true });
  reducedMotion.addEventListener?.('change', requestMotion);
  updateMotion();
})();

// The Atlas Network - shared page behaviour.

// In the embedded preview, refreshing reloads the site from its homepage. Remember the page
// being viewed and return to it after a refresh. Only runs when the site is inside a frame,
// so the live website and the back button behave normally.
(() => {
  if (window.self === window.top) return;
  const page = (location.pathname.split('/').pop() || 'index.html') + location.hash;
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
    addEventListener('hashchange', () => sessionStorage.setItem('atlas:page', (location.pathname.split('/').pop() || 'index.html') + location.hash));
  } catch (e) { /* storage unavailable: refresh simply returns to the homepage */ }
})();

const btn = document.getElementById('menu-btn');
const menu = document.getElementById('menu');

// Open every page at the top, including when returning with the back button.
// A link to a section (#anchor) still lands on that section.
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
addEventListener('pageshow', () => { if (!location.hash) scrollTo(0, 0); });

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
btn.addEventListener('click', () => {
  const open = menu.classList.toggle('open');
  btn.setAttribute('aria-expanded', String(open));
});

// In-page links scroll smoothly and close the mobile menu.
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth' });
    history.replaceState(null, '', a.getAttribute('href'));
    menu.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
  });
});

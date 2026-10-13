// The Atlas Network - shared page behaviour.
const btn = document.getElementById('menu-btn');
const menu = document.getElementById('menu');

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

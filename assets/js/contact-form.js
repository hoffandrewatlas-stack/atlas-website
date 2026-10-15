// Contact form: validation and confirmation.
// Sending is not wired up yet. To deliver messages, post `new FormData(form)`
// to your form service or email endpoint where marked below.
(() => {
  const form = document.getElementById('contact-form-el');
  if (!form) return;
  const done = document.getElementById('contact-done');
  const again = document.getElementById('contact-again');

  // Validate one required field and show or hide its message.
  function check(el) {
    const ok = el.value.trim() !== '' && (el.type !== 'email' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value.trim()));
    el.closest('.field').classList.toggle('invalid', !ok);
    return ok;
  }
  const required = [...form.querySelectorAll('[required]')];
  required.forEach(el => el.addEventListener('input', () => {
    if (el.closest('.field').classList.contains('invalid')) check(el);
  }));

  form.addEventListener('submit', e => {
    e.preventDefault();
    const results = required.map(check);
    if (results.includes(false)) { required[results.indexOf(false)].focus(); return; }
    // Send the message here, e.g. fetch('/api/contact', { method: 'POST', body: new FormData(form) }).
    form.hidden = true;
    done.hidden = false;
    done.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  again.addEventListener('click', () => {
    form.reset();
    done.hidden = true;
    form.hidden = false;
  });
})();

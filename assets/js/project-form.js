// Start Your Project form: validation, file drop zone and confirmation.
// Sending is not wired up yet. To deliver briefs, post `new FormData(form)` plus `files`
// to your form service or email endpoint where marked below.
(() => {
  const form = document.getElementById('brief-form');
  if (!form) return;
  const done = document.getElementById('form-done');
  const again = document.getElementById('form-again');
  const zone = document.getElementById('drop-zone');
  const input = document.getElementById('f-files');
  const list = document.getElementById('file-list');
  const sizeLabel = document.getElementById('drop-size');
  const filesField = document.getElementById('files-field');
  const LIMIT = 50 * 1024 * 1024;
  let files = [];

  const fmt = b => b < 1024 ? `${b} B` : b < 1048576 ? `${(b / 1024).toFixed(0)} KB` : `${(b / 1048576).toFixed(1)} MB`;
  const total = () => files.reduce((sum, f) => sum + f.size, 0);

  function renderFiles() {
    list.innerHTML = '';
    files.forEach((f, i) => {
      const li = document.createElement('li');
      li.innerHTML = '<span class="name"></span><span class="size"></span><button type="button" aria-label="Remove file">×</button>';
      li.querySelector('.name').textContent = f.name;
      li.querySelector('.size').textContent = fmt(f.size);
      li.querySelector('button').addEventListener('click', () => { files.splice(i, 1); renderFiles(); });
      list.appendChild(li);
    });
    sizeLabel.textContent = `${fmt(total())} / 50 MB`;
    filesField.classList.toggle('invalid', total() > LIMIT);
  }

  function addFiles(newFiles) {
    for (const f of newFiles) {
      if (!files.some(x => x.name === f.name && x.size === f.size)) files.push(f);
    }
    renderFiles();
  }

  input.addEventListener('change', () => { addFiles(input.files); input.value = ''; });
  ['dragenter', 'dragover'].forEach(t => zone.addEventListener(t, e => { e.preventDefault(); zone.classList.add('over'); }));
  ['dragleave', 'drop'].forEach(t => zone.addEventListener(t, e => { e.preventDefault(); zone.classList.remove('over'); }));
  zone.addEventListener('drop', e => addFiles(e.dataTransfer.files));

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
    const filesOk = total() <= LIMIT;
    if (results.includes(false) || !filesOk) {
      const first = required[results.indexOf(false)] || input;
      first.focus();
      return;
    }
    // Send the brief here, e.g. fetch('/api/brief', { method: 'POST', body: formData }).
    form.hidden = true;
    done.hidden = false;
    done.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  again.addEventListener('click', () => {
    form.reset();
    files = [];
    renderFiles();
    done.hidden = true;
    form.hidden = false;
  });
})();

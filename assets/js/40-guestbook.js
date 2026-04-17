(function () {
  const { refs } = window.OGD;
  const KEY = 'ogdGuestPreview';

  function loadGuestPreview() {
    try {
      return JSON.parse(localStorage.getItem(KEY) || '[]');
    } catch {
      return [];
    }
  }

  function saveGuestPreview(entries) {
    try {
      localStorage.setItem(KEY, JSON.stringify(entries.slice(0, 6)));
    } catch {}
  }

  function setStatus(text, tone = '') {
    if (!refs.guestStatus) return;
    refs.guestStatus.className = `guest-status${tone ? ` ${tone}` : ''}`;
    refs.guestStatus.textContent = text;
  }

  function buildPreviewItem(entry) {
    const article = document.createElement('article');
    article.className = 'guest-preview-item';
    const strong = document.createElement('strong');
    strong.textContent = `${entry.name} · ${entry.platform}`;
    const p = document.createElement('p');
    p.textContent = entry.message;
    article.append(strong, p);
    return article;
  }

  function renderGuestPreview() {
    if (!refs.guestPreviewList) return;
    const entries = loadGuestPreview();
    refs.guestPreviewList.innerHTML = '';
    if (!entries.length) {
      const fallback = document.createElement('div');
      fallback.className = 'guest-preview-item';
      const strong = document.createElement('strong');
      strong.textContent = 'Nessun messaggio ancora';
      const p = document.createElement('p');
      p.textContent = 'Le anteprime locali appariranno qui dopo il primo salvataggio.';
      fallback.append(strong, p);
      refs.guestPreviewList.appendChild(fallback);
      return;
    }
    entries.forEach((entry) => refs.guestPreviewList.appendChild(buildPreviewItem(entry)));
  }

  function getPayload() {
    return {
      name: refs.guestNameInput ? refs.guestNameInput.value.trim() : '',
      platform: refs.guestPlatformInput ? refs.guestPlatformInput.value.trim() : '',
      message: refs.guestMessageInput ? refs.guestMessageInput.value.trim() : ''
    };
  }

  function validatePayload(payload) {
    return Boolean(payload.name && payload.platform && payload.message);
  }

  function storeGuestPreview() {
    const payload = getPayload();
    if (!validatePayload(payload)) {
      setStatus('Compila tutti i campi prima di salvare l’anteprima.', 'warn');
      return false;
    }
    const entries = loadGuestPreview();
    entries.unshift(payload);
    saveGuestPreview(entries);
    renderGuestPreview();
    setStatus('Anteprima locale salvata correttamente su questo browser.', 'ok');
    return true;
  }

  function setupGuestbook() {
    if (!refs.guestbookForm) return;
    refs.guestbookForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const payload = getPayload();
      if (!validatePayload(payload)) {
        setStatus('Compila tutti i campi prima di inviare il messaggio.', 'err');
        return;
      }
      storeGuestPreview();
      const subject = encodeURIComponent(`Guest Book message from ${payload.name}`);
      const body = encodeURIComponent(`Nome: ${payload.name}\nPiattaforma: ${payload.platform}\n\nMessaggio:\n${payload.message}`);
      window.location.href = `mailto:darkplayer84tvlive@outlook.com?subject=${subject}&body=${body}`;
    });
    if (refs.guestPreviewButton) refs.guestPreviewButton.addEventListener('click', storeGuestPreview);
    renderGuestPreview();
  }

  window.OGD.setupGuestbook = setupGuestbook;
})();

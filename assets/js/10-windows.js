(function () {
  const { refs, state, data } = window.OGD;
  const WIDE_WINDOW_IDS = new Set(['gamesWindow', 'guestbookWindow', 'explorerWindow']);

  function markWindowOpened(win, opened) {
    win.dataset.opened = opened ? 'true' : 'false';
  }

  function getViewportBounds() {
    return {
      width: window.innerWidth,
      height: window.innerHeight,
      safeLeft: 14,
      safeTop: 14,
      safeRight: 14,
      safeBottom: 74
    };
  }

  function getPreferredWindowSize(win, maxWidth, maxHeight) {
    const currentRect = win.getBoundingClientRect();
    const currentWidth = currentRect.width || parseFloat(win.style.width) || 420;
    const currentHeight = currentRect.height || parseFloat(win.style.height) || 320;

    if (win.id === 'gamesWindow') {
      return {
        width: Math.min(maxWidth, Math.max(1120, Math.round(window.innerWidth * 0.78))),
        height: Math.min(maxHeight, Math.max(620, Math.round(window.innerHeight * 0.76)))
      };
    }

    if (WIDE_WINDOW_IDS.has(win.id)) {
      return {
        width: Math.min(maxWidth, Math.max(currentWidth, Math.round(window.innerWidth * 0.54))),
        height: Math.min(maxHeight, Math.max(currentHeight, Math.round(window.innerHeight * 0.58)))
      };
    }

    return {
      width: Math.min(currentWidth, maxWidth),
      height: Math.min(currentHeight, maxHeight)
    };
  }

  function shouldCenterWindow(win) {
    return WIDE_WINDOW_IDS.has(win.id) || win.classList.contains('maximized');
  }

  function applyWindowBounds(win, nextWidth, nextHeight, bounds) {
    const width = Math.max(320, nextWidth);
    const height = Math.max(220, nextHeight);
    const availableWidth = bounds.width - bounds.safeLeft - bounds.safeRight;
    const availableHeight = bounds.height - bounds.safeTop - bounds.safeBottom;
    const maxLeft = Math.max(bounds.safeLeft, bounds.width - width - bounds.safeRight);
    const maxTop = Math.max(bounds.safeTop, bounds.height - height - bounds.safeBottom);
    const rawLeft = parseFloat(win.style.left) || bounds.safeLeft;
    const rawTop = parseFloat(win.style.top) || bounds.safeTop;
    const centeredLeft = bounds.safeLeft + Math.max(0, Math.round((availableWidth - width) / 2));
    const centeredTop = bounds.safeTop + Math.max(0, Math.round((availableHeight - height) / 2));
    const nextLeft = shouldCenterWindow(win)
      ? centeredLeft
      : Math.min(Math.max(bounds.safeLeft, rawLeft), maxLeft);
    const nextTop = shouldCenterWindow(win)
      ? centeredTop
      : Math.min(Math.max(bounds.safeTop, rawTop), maxTop);

    win.style.width = `${width}px`;
    if (win.style.height || height) {
      win.style.height = `${height}px`;
    }
    win.style.left = `${nextLeft}px`;
    win.style.top = `${nextTop}px`;
  }

  function bringToFront(win) {
    state.highestZ += 1;
    refs.windowsList.forEach((item) => item.classList.remove('focused'));
    win.style.zIndex = String(state.highestZ);
    win.classList.add('focused');
    syncTaskbar();
  }

  function openWindow(id) {
    const win = document.getElementById(id);
    if (!win) return;
    win.classList.add('active');
    win.dataset.minimized = 'false';
    markWindowOpened(win, true);
    adaptWindowsToViewport();
    bringToFront(win);
    if (id === 'gamesWindow' && typeof window.OGD.playArcadeIntro === 'function') {
      window.OGD.playArcadeIntro();
    }
    if (typeof window.OGD.updateRaceTournamentLayout === 'function') {
      window.OGD.updateRaceTournamentLayout();
    }
    syncTaskbar();
  }

  function closeWindow(id) {
    const win = document.getElementById(id);
    if (!win) return;
    win.classList.remove('active', 'maximized');
    win.dataset.minimized = 'false';
    markWindowOpened(win, false);
    syncTaskbar();
  }

  function toggleMaximize(win) {
    win.classList.toggle('maximized');
    win.dataset.minimized = 'false';
    markWindowOpened(win, true);
    if (!win.classList.contains('maximized')) {
      adaptWindowsToViewport();
    }
    bringToFront(win);
    if (typeof window.OGD.updateRaceTournamentLayout === 'function') {
      window.setTimeout(window.OGD.updateRaceTournamentLayout, 60);
    }
  }

  function minimizeWindow(win) {
    win.classList.remove('active');
    win.dataset.minimized = 'true';
    markWindowOpened(win, true);
    syncTaskbar();
  }

  function syncTaskbar() {
    if (!refs.taskbarWindows) return;
    refs.taskbarWindows.innerHTML = '';
    refs.windowsList
      .filter((win) => win.dataset.opened === 'true' || win.classList.contains('active') || win.dataset.minimized === 'true')
      .forEach((win) => {
        const chip = document.createElement('button');
        chip.className = 'taskbar-chip';
        chip.type = 'button';
        chip.textContent = win.dataset.title || win.id;
        if (win.classList.contains('active')) chip.classList.add('active');
        chip.addEventListener('click', () => {
          if (win.classList.contains('active')) {
            minimizeWindow(win);
          } else {
            openWindow(win.id);
          }
        });
        refs.taskbarWindows.appendChild(chip);
      });
  }

  function adaptWindowsToViewport() {
    if (window.innerWidth <= 900) return;
    const bounds = getViewportBounds();
    const maxWidth = bounds.width - bounds.safeLeft - bounds.safeRight;
    const maxHeight = bounds.height - bounds.safeTop - bounds.safeBottom;

    refs.windowsList.forEach((win) => {
      if (win.classList.contains('maximized')) return;
      const preferred = getPreferredWindowSize(win, maxWidth, maxHeight);
      applyWindowBounds(win, preferred.width, preferred.height, bounds);
    });

    if (typeof window.OGD.updateRaceTournamentLayout === 'function') {
      window.OGD.updateRaceTournamentLayout();
    }
  }

  function bindWindowControls() {
    refs.windowsList.forEach((win) => {
      if (win.classList.contains('active')) markWindowOpened(win, true);
      const header = win.querySelector('.window-header');
      const buttons = win.querySelectorAll('.window-btn');
      if (header) {
        header.addEventListener('pointerdown', (event) => {
          if (event.button !== 0) return;
          if (window.innerWidth <= 900 || win.classList.contains('maximized')) return;
          if (event.target.closest('.window-actions')) return;
          bringToFront(win);
          const startX = event.clientX;
          const startY = event.clientY;
          const rect = win.getBoundingClientRect();
          const offsetX = startX - rect.left;
          const offsetY = startY - rect.top;
          const onMove = (moveEvent) => {
            win.style.left = `${moveEvent.clientX - offsetX}px`;
            win.style.top = `${Math.max(10, moveEvent.clientY - offsetY)}px`;
          };
          const onUp = () => {
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', onUp);
          };
          window.addEventListener('pointermove', onMove);
          window.addEventListener('pointerup', onUp);
        });
      }
      win.addEventListener('mousedown', () => bringToFront(win));
      buttons.forEach((button) => {
        button.addEventListener('pointerdown', (event) => event.stopPropagation());
        button.addEventListener('click', (event) => {
          event.stopPropagation();
          const action = button.dataset.action;
          if (action === 'close') closeWindow(win.id);
          if (action === 'minimize') minimizeWindow(win);
          if (action === 'maximize') toggleMaximize(win);
        });
      });
    });
  }

  function renderFolder(folderKey) {
    const folder = data.folders[folderKey];
    if (!folder || !refs.pathBar || !refs.folderGrid) return;
    document.querySelectorAll('.folder-link').forEach((button) => {
      button.classList.toggle('active', button.dataset.folder === folderKey);
    });
    refs.pathBar.textContent = folder.path;
    refs.folderGrid.innerHTML = '';
    folder.items.forEach((item) => {
      const card = document.createElement('article');
      card.className = 'folder-card';
      const strong = document.createElement('strong');
      strong.textContent = item.title;
      const span = document.createElement('span');
      span.textContent = item.text;
      card.append(strong, span);
      refs.folderGrid.appendChild(card);
    });
  }

  function bindLaunchers() {
    document.querySelectorAll('[data-window]').forEach((trigger) => {
      trigger.addEventListener('click', () => {
        openWindow(trigger.dataset.window);
        if (refs.startMenu) refs.startMenu.classList.remove('open');
      });
    });

    document.querySelectorAll('.folder-link').forEach((button) => {
      button.addEventListener('click', () => renderFolder(button.dataset.folder));
    });

    if (refs.startButton && refs.startMenu) {
      refs.startButton.addEventListener('click', () => refs.startMenu.classList.toggle('open'));
      document.addEventListener('click', (event) => {
        const clickedInsideMenu = refs.startMenu.contains(event.target);
        const clickedStart = refs.startButton.contains(event.target);
        if (!clickedInsideMenu && !clickedStart) refs.startMenu.classList.remove('open');
      });
      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') refs.startMenu.classList.remove('open');
      });
    }
  }

  function updateClock() {
    if (!refs.clockLabel) return;
    const now = new Date();
    refs.clockLabel.textContent = now.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
  }

  function renderResponseBook() {
    if (!refs.responseBookList) return;
    refs.responseBookList.innerHTML = '';
    data.responseEntries.forEach((entry) => {
      const article = document.createElement('article');
      article.className = 'response-entry';
      const title = document.createElement('strong');
      title.textContent = entry.title;
      const body = document.createElement('p');
      body.textContent = entry.body;
      article.append(title, body);
      refs.responseBookList.appendChild(article);
    });
  }

  window.OGD.openWindow = openWindow;
  window.OGD.closeWindow = closeWindow;
  window.OGD.bringToFront = bringToFront;
  window.OGD.toggleMaximize = toggleMaximize;
  window.OGD.minimizeWindow = minimizeWindow;
  window.OGD.syncTaskbar = syncTaskbar;
  window.OGD.adaptWindowsToViewport = adaptWindowsToViewport;
  window.OGD.bindWindowControls = bindWindowControls;
  window.OGD.renderFolder = renderFolder;
  window.OGD.bindLaunchers = bindLaunchers;
  window.OGD.updateClock = updateClock;
  window.OGD.renderResponseBook = renderResponseBook;
})();

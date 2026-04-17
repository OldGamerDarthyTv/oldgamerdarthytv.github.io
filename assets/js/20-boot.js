(function () {
  const { refs, state, data } = window.OGD;
  const VERBOSE_STEP_MS = 140;
  const VERBOSE_TAIL_MS = 320;
  const SECOND_BOOT_MS = 520;
  const FAILSAFE_BOOT_MS = 5200;
  const ABSOLUTE_FAILSAFE_BOOT_MS = 6500;

  function rememberTimer(id) {
    state.bootTimers.push(id);
    return id;
  }

  function clearBootTimers() {
    state.bootTimers.forEach((id) => window.clearTimeout(id));
    state.bootTimers = [];
  }

  function hideOverlay(node) {
    if (!node) return;
    node.classList.add('hidden', 'is-hidden', 'done', 'completed');
    node.setAttribute('aria-hidden', 'true');
    node.style.opacity = '0';
    node.style.visibility = 'hidden';
    node.style.pointerEvents = 'none';
    node.style.display = 'none';
  }

  function revealDesktop() {
    const desktop = refs.desktop || document.getElementById('desktop') || document.querySelector('.desktop');
    const taskbar = refs.taskbar || document.querySelector('.taskbar');

    if (desktop) {
      desktop.style.opacity = '1';
      desktop.style.visibility = 'visible';
      desktop.style.pointerEvents = 'auto';
      desktop.style.display = '';
    }

    if (taskbar) {
      taskbar.style.opacity = '1';
      taskbar.style.visibility = 'visible';
      taskbar.style.pointerEvents = 'auto';
      taskbar.style.display = '';
    }
  }

  function setGamesLockedState(locked) {
    if (!refs.gamesSwitcher) return;
    refs.gamesSwitcher.classList.toggle('games-locked', locked);
  }

  function unlockGamesHub() {
    state.arcadeUnlocked = true;
    if (refs.arcadeIntro) refs.arcadeIntro.classList.remove('active');
    setGamesLockedState(false);
  }

  function startArcadeCanvasIntro() {
    if (!refs.arcadeIntroCanvas || typeof refs.arcadeIntroCanvas.getContext !== 'function') return;
    const canvas = refs.arcadeIntroCanvas;
    const ctx = canvas.getContext('2d');
    let frameId = null;
    let t = 0;

    if (typeof ctx.roundRect !== 'function') {
      ctx.roundRect = function roundRect(x, y, w, h, r) {
        this.beginPath();
        this.moveTo(x + r, y);
        this.arcTo(x + w, y, x + w, y + h, r);
        this.arcTo(x + w, y + h, x, y + h, r);
        this.arcTo(x, y + h, x, y, r);
        this.arcTo(x, y, x + w, y, r);
        return this;
      };
    }

    function frame() {
      t += 0.016;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, '#04070d');
      gradient.addColorStop(1, '#0b111d');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < 56; i += 1) {
        const x = (i * 137.7) % canvas.width;
        const y = (i * 91.3 + Math.sin(t + i) * 18) % canvas.height;
        const r = (i % 3) + 1;
        ctx.fillStyle = i % 5 === 0 ? 'rgba(244,219,162,0.95)' : 'rgba(230,239,255,0.72)';
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = 'rgba(12, 17, 26, 0.98)';
      ctx.roundRect(canvas.width / 2 - 110, canvas.height / 2 - 86, 220, 172, 18);
      ctx.fill();
      ctx.strokeStyle = 'rgba(244,219,162,0.28)';
      ctx.lineWidth = 2;
      ctx.stroke();

      const glow = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2 - 30, 16, canvas.width / 2, canvas.height / 2 - 30, 80);
      glow.addColorStop(0, 'rgba(244,219,162,0.38)');
      glow.addColorStop(1, 'rgba(244,219,162,0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height / 2 - 30, 80, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#f5f7fb';
      ctx.font = '700 28px Orbitron';
      ctx.textAlign = 'center';
      ctx.fillText('OGD', canvas.width / 2, canvas.height / 2 - 16);
      ctx.font = '600 14px Rajdhani';
      ctx.fillStyle = 'rgba(237, 244, 255, 0.72)';
      ctx.fillText('ARCADE GATE', canvas.width / 2, canvas.height / 2 + 14);

      frameId = window.requestAnimationFrame(frame);
      state.arcadeIntroFrame = frameId;
    }

    frame();
  }

  function playArcadeIntro() {
    if (!refs.arcadeIntro || state.arcadeUnlocked || state.arcadeSequenceStarted) return;
    state.arcadeSequenceStarted = true;
    setGamesLockedState(true);
    startArcadeCanvasIntro();
    rememberTimer(window.setTimeout(unlockGamesHub, 3600));
  }

  function finishBoot(reason = 'normal') {
    if (state.bootFinished) return;
    state.bootFinished = true;
    clearBootTimers();
    hideOverlay(refs.verboseLoader);
    hideOverlay(refs.bootScreen);
    revealDesktop();
    document.body.classList.add('boot-complete');
    document.body.dataset.bootState = 'complete';
    document.documentElement.classList.add('boot-complete');
    window.OGD.lastBootCompletionReason = reason;
  }

  function runVerboseLoader() {
    if (!refs.verboseConsole || !refs.verboseLoader || !refs.bootScreen) return;
    state.bootFinished = false;
    document.body.dataset.bootState = 'running';
    refs.verboseLoader.classList.remove('hidden');
    refs.verboseLoader.style.display = '';
    refs.verboseLoader.style.visibility = '';
    refs.verboseLoader.style.pointerEvents = '';
    refs.bootScreen.style.display = '';
    refs.verboseConsole.innerHTML = '';
    refs.bootScreen.classList.add('hidden');
    if (refs.verbosePercent) refs.verbosePercent.textContent = '0%';
    if (refs.verbosePhase) refs.verbosePhase.textContent = 'Phase 01 / Identity';

    data.verboseLines.forEach((line, index) => {
      rememberTimer(window.setTimeout(() => {
        if (state.bootFinished) return;
        const row = document.createElement('div');
        row.className = 'verbose-line';
        row.textContent = line;
        refs.verboseConsole.appendChild(row);
        refs.verboseConsole.scrollTop = refs.verboseConsole.scrollHeight;
        const progress = Math.round(((index + 1) / data.verboseLines.length) * 100);
        if (refs.verbosePercent) refs.verbosePercent.textContent = `${progress}%`;
        const phase = data.phaseBreakpoints.find((item) => index <= item.upto);
        if (phase && refs.verbosePhase) refs.verbosePhase.textContent = phase.label;
      }, index * VERBOSE_STEP_MS));
    });

    const verboseDuration = data.verboseLines.length * VERBOSE_STEP_MS + VERBOSE_TAIL_MS;
    rememberTimer(window.setTimeout(() => {
      if (state.bootFinished) return;
      refs.verboseLoader.classList.add('hidden');
      refs.bootScreen.classList.remove('hidden');
    }, verboseDuration));

    rememberTimer(window.setTimeout(() => {
      if (state.bootFinished) return;
      finishBoot('boot-sequence');
    }, verboseDuration + SECOND_BOOT_MS));

    rememberTimer(window.setTimeout(() => {
      if (!state.bootFinished) finishBoot('failsafe');
    }, FAILSAFE_BOOT_MS));
  }

  function initBoot() {
    refs.skipBootButtons.forEach((button) => button.addEventListener('click', () => finishBoot('skip')));
    document.addEventListener('keydown', (event) => {
      if (event.key.toLowerCase() === 'escape') finishBoot('escape');
    });
    if (refs.arcadeEnterButton) refs.arcadeEnterButton.addEventListener('click', unlockGamesHub);
    document.body.dataset.bootState = 'running';
    runVerboseLoader();
    rememberTimer(window.setTimeout(() => finishBoot('absolute-failsafe'), ABSOLUTE_FAILSAFE_BOOT_MS));
  }

  window.OGD.setGamesLockedState = setGamesLockedState;
  window.OGD.unlockGamesHub = unlockGamesHub;
  window.OGD.playArcadeIntro = playArcadeIntro;
  window.OGD.initBoot = initBoot;
  window.OGD.finishBoot = finishBoot;
})();

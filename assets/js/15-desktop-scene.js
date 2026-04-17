(function () {
  const { refs, state } = window.OGD;
  const WAIT_MS = 30 * 60 * 1000;
  const TICK_MS = 1000;

  function formatCountdown(ms) {
    const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
    const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
    const seconds = String(totalSeconds % 60).padStart(2, '0');
    return `${minutes}:${seconds}`;
  }

  function setScene(mode) {
    state.sceneMode = mode;
    document.body.dataset.scene = mode;
    if (refs.spaceScene) refs.spaceScene.classList.toggle('active', mode === 'space');
    if (refs.tournamentScene) refs.tournamentScene.classList.toggle('active', mode === 'tournament');
  }

  function updateSpaceHud() {
    if (refs.desktopSceneCountdown) {
      const remaining = WAIT_MS - state.desktopVisibleMs;
      refs.desktopSceneCountdown.textContent = `Prossimo torneo tra ${formatCountdown(remaining)}`;
    }
    if (refs.desktopSceneStatus && !state.desktopSceneLocked) {
      refs.desktopSceneStatus.textContent = 'Wallpaper narrativo attivo. Il desktop resta in contemplazione finché non si apre il prossimo torneo automatico.';
    }
  }

  function resetDesktopCountdown() {
    state.desktopVisibleMs = 0;
    state.desktopSceneLocked = false;
    setScene('space');
    updateSpaceHud();
  }

  function showTournamentScene() {
    state.desktopSceneLocked = true;
    setScene('tournament');
    if (refs.desktopSceneStatus) {
      refs.desktopSceneStatus.textContent = 'La pista sta emergendo dal wallpaper e i motori si stanno caricando.';
    }
    if (refs.desktopSceneCountdown) {
      refs.desktopSceneCountdown.textContent = 'Trasformazione in corso…';
    }
    if (refs.tournamentTitle) {
      refs.tournamentTitle.textContent = 'Il desktop entra in modalità torneo.';
    }
    if (refs.tournamentStatus) {
      refs.tournamentStatus.textContent = 'I 20 bolidi si allineano alla griglia di partenza. La corsa sta per iniziare.';
    }
  }

  function startTournamentFlow() {
    if (state.desktopSceneLocked || state.tournamentRunning || typeof window.OGD.startTournamentRace !== 'function') return;
    showTournamentScene();
    window.setTimeout(() => {
      window.OGD.startTournamentRace({
        onComplete: () => {
          resetDesktopCountdown();
        }
      });
    }, 2400);
  }

  function tickDesktopScene() {
    if (document.visibilityState !== 'visible') return;
    if (state.desktopSceneLocked || state.tournamentRunning || state.tournamentCooldownActive) return;
    if (state.sceneMode !== 'space') return;
    state.desktopVisibleMs = Math.min(WAIT_MS, state.desktopVisibleMs + TICK_MS);
    updateSpaceHud();
    if (state.desktopVisibleMs >= WAIT_MS) {
      startTournamentFlow();
    }
  }

  function initDesktopScene() {
    if (!refs.desktopScene) return;
    refs.desktopScene.setAttribute('aria-hidden', 'true');
    setScene('space');
    updateSpaceHud();
    window.setInterval(tickDesktopScene, TICK_MS);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && state.sceneMode === 'space') updateSpaceHud();
    });
  }

  window.OGD.initDesktopScene = initDesktopScene;
  window.OGD.resetDesktopCountdown = resetDesktopCountdown;
  window.OGD.setDesktopScene = setScene;
  window.OGD.startTournamentFlow = startTournamentFlow;
})();

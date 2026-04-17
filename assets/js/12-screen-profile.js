(function () {
  const root = document.documentElement;
  const body = document.body;

  function getScreenProfile() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const aspect = height > 0 ? width / height : 1;
    const orientation = width >= height ? 'landscape' : 'portrait';
    const ratio = aspect >= 1.72 ? 'landscape-wide' : aspect >= 1.45 ? 'landscape-standard' : 'portrait';
    let mode = 'compact';

    if (width >= 1800 && height >= 960) {
      mode = 'large';
    } else if (width >= 1400 && height >= 860) {
      mode = 'standard';
    }

    if (width >= 2200 || aspect >= 2) {
      mode = 'cinema';
    }

    return {
      width,
      height,
      aspect,
      orientation,
      ratio,
      mode
    };
  }

  function applyScreenProfile(profile) {
    const nextProfile = profile || getScreenProfile();
    const viewportSafeHeight = Math.max(540, nextProfile.height - 120);
    const gameCanvasHeight = Math.max(320, Math.min(620, Math.round(viewportSafeHeight * 0.58)));

    body.dataset.screenMode = nextProfile.mode;
    body.dataset.screenRatio = nextProfile.ratio;
    body.dataset.screenOrientation = nextProfile.orientation;
    root.style.setProperty('--screen-width', `${nextProfile.width}px`);
    root.style.setProperty('--screen-height', `${nextProfile.height}px`);
    root.style.setProperty('--viewport-safe-height', `${viewportSafeHeight}px`);
    root.style.setProperty('--game-canvas-height', `${gameCanvasHeight}px`);

    if (window.OGD && window.OGD.state) {
      window.OGD.state.screenProfile = nextProfile;
    }

    return nextProfile;
  }

  function initScreenProfile() {
    return applyScreenProfile();
  }

  window.OGD = window.OGD || {};
  window.OGD.getScreenProfile = getScreenProfile;
  window.OGD.applyScreenProfile = applyScreenProfile;
  window.OGD.initScreenProfile = initScreenProfile;
})();

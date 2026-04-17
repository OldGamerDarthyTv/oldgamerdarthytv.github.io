(function () {
  const { refs, state } = window.OGD;

  function setupLaunchLinks() {
    const links = document.querySelectorAll('.launch-link');
    if (!links.length || !refs.siteLaunchOverlay || !refs.siteLaunchCore) return;

    links.forEach((link) => {
      link.addEventListener('click', (event) => {
        event.preventDefault();
        const href = link.getAttribute('href');
        const site = link.dataset.site || 'External Site';
        const theme = link.dataset.theme || 'default';
        const line = link.dataset.line || 'Preparing destination';
        const mark = site.replace(/[^A-Za-z0-9]/g, '').slice(0, 3).toUpperCase() || 'OGD';
        refs.siteLaunchCore.className = 'site-launch-core';
        refs.siteLaunchCore.classList.add(`theme-${theme}`);
        if (refs.siteLaunchTitle) refs.siteLaunchTitle.textContent = site;
        if (refs.siteLaunchLine) refs.siteLaunchLine.textContent = line;
        if (refs.siteLaunchMarkText) refs.siteLaunchMarkText.textContent = mark;
        refs.siteLaunchOverlay.classList.add('active');
        refs.siteLaunchOverlay.setAttribute('aria-hidden', 'false');
        clearTimeout(state.launchOverlayTimer);
        state.launchOverlayTimer = setTimeout(() => {
          refs.siteLaunchOverlay.classList.remove('active');
          refs.siteLaunchOverlay.setAttribute('aria-hidden', 'true');
          const popup = window.open(href, '_blank', 'noopener,noreferrer');
          if (!popup) window.location.href = href;
        }, 1450);
      });
    });
  }

  window.OGD.setupLaunchLinks = setupLaunchLinks;
})();

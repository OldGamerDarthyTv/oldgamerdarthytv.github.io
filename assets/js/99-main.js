(function () {
  const app = window.OGD || {};

  function safe(label, fn) {
    try {
      if (typeof fn === 'function') fn();
    } catch (error) {
      console.error(`[OGD:${label}]`, error);
    }
  }

  safe('initBoot', app.initBoot);
  safe('initScreenProfile', app.initScreenProfile);
  safe('bindWindowControls', app.bindWindowControls);
  safe('bindLaunchers', app.bindLaunchers);
  safe('renderFolder', () => app.renderFolder && app.renderFolder('desktop'));
  safe('renderResponseBook', app.renderResponseBook);
  safe('syncTaskbar', app.syncTaskbar);
  safe('updateClock', app.updateClock);
  safe('initDesktopScene', app.initDesktopScene);
  safe('initRaceTournament', app.initRaceTournament);
  safe('setupLaunchLinks', app.setupLaunchLinks);
  safe('setupGuestbook', app.setupGuestbook);
  safe('setupGamesHub', app.setupGamesHub);
  safe('adaptWindowsToViewport', app.adaptWindowsToViewport);
  if (typeof app.finishBoot === 'function') {
    window.OGD_FORCE_BOOT_COMPLETE = app.finishBoot;
  }

  window.setInterval(() => safe('updateClockInterval', app.updateClock), 1000);
  window.addEventListener('resize', () => {
    safe('resizeScreenProfile', app.initScreenProfile);
    safe('resize', app.adaptWindowsToViewport);
  });
})();

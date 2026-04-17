(function () {
  const refs = {
    windowsList: [...document.querySelectorAll('.window')],
    startButton: document.getElementById('startButton'),
    startMenu: document.getElementById('startMenu'),
    desktop: document.getElementById('desktop'),
    taskbar: document.querySelector('.taskbar'),
    taskbarWindows: document.getElementById('taskbarWindows'),
    clockLabel: document.getElementById('clockLabel'),
    bootScreen: document.getElementById('bootScreen'),
    verboseLoader: document.getElementById('verboseLoader'),
    verboseConsole: document.getElementById('verboseConsole'),
    pathBar: document.getElementById('pathBar'),
    folderGrid: document.getElementById('folderGrid'),
    verbosePhase: document.getElementById('verbosePhase'),
    verbosePercent: document.getElementById('verbosePercent'),
    siteLaunchOverlay: document.getElementById('siteLaunchOverlay'),
    siteLaunchCore: document.getElementById('siteLaunchCore'),
    siteLaunchTitle: document.getElementById('siteLaunchTitle'),
    siteLaunchLine: document.getElementById('siteLaunchLine'),
    siteLaunchMarkText: document.getElementById('siteLaunchMarkText'),
    guestbookForm: document.getElementById('guestbookForm'),
    guestNameInput: document.getElementById('guestName'),
    guestPlatformInput: document.getElementById('guestPlatform'),
    guestMessageInput: document.getElementById('guestMessage'),
    guestPreviewButton: document.getElementById('guestPreviewButton'),
    guestPreviewList: document.getElementById('guestPreviewList'),
    guestStatus: document.getElementById('guestStatus'),
    responseBookList: document.getElementById('responseBookList'),
    arcadeIntro: document.getElementById('arcadeIntro'),
    arcadeEnterButton: document.getElementById('arcadeEnterButton'),
    arcadeIntroCanvas: document.getElementById('arcadeIntroCanvas'),
    gamesSwitcher: document.getElementById('gamesSwitcher'),
    leaderboardList: document.getElementById('leaderboardList'),
    desktopScene: document.getElementById('desktopScene'),
    spaceScene: document.getElementById('spaceScene'),
    tournamentScene: document.getElementById('tournamentScene'),
    desktopSceneStatus: document.getElementById('desktopSceneStatus'),
    desktopSceneCountdown: document.getElementById('desktopSceneCountdown'),
    tournamentTitle: document.getElementById('tournamentTitle'),
    tournamentStatus: document.getElementById('tournamentStatus'),
    seasonProgress: document.getElementById('seasonProgress'),
    seasonChampion: document.getElementById('seasonChampion'),
    recentWinners: document.getElementById('recentWinners'),
    trackLanes: document.getElementById('trackLanes'),
    skipBootButtons: [document.getElementById('skipBootButton'), document.getElementById('skipBootButtonSecondary')].filter(Boolean)
  };

  const state = {
    highestZ: 20,
    launchOverlayTimer: null,
    arcadeIntroFrame: null,
    arcadeSequenceStarted: false,
    arcadeUnlocked: false,
    bootSkipped: false,
    bootFinished: false,
    bootTimers: [],
    screenProfile: null,
    sceneMode: 'space',
    desktopVisibleMs: 0,
    desktopSceneLocked: false,
    tournamentRunning: false,
    tournamentCooldownActive: false
  };

  const data = {
    verboseLines: [
      '[INIT] Securing creator environment ... OK',
      '[IDENTITY] Loading Luigi Sestili Spurio profile ... OK',
      '[IDENTITY] Activating public brand: OldGamerDarthy Official ... OK',
      '[MEDIA] Mapping video, music and art layers ... OK',
      '[MODDING] Syncing technical tools and creator workflow ... OK',
      '[COMMUNITY] Discord and Steam bridges connected ... OK',
      '[NETWORK] Official public channels indexed ... OK',
      '[UI] Desktop shell calibrated ... OK',
      '[UI] Window manager and taskbar online ... OK',
      '[ARCADE] Interactive modules ready ... OK',
      '[FINAL] OldGamerDarthy OS is ready'
    ],
    phaseBreakpoints: [
      { upto: 2, label: 'Phase 01 / Identity' },
      { upto: 4, label: 'Phase 02 / Media Core' },
      { upto: 6, label: 'Phase 03 / Community' },
      { upto: 8, label: 'Phase 04 / Interface' },
      { upto: 99, label: 'Phase 05 / Launch' }
    ],
    folders: {
      desktop: {
        path: 'C:\\CreatorOS\\Desktop',
        items: [
          { title: 'OldGamerDarthy.profile', text: 'Scheda identitaria del creator: presenza pubblica, tono del brand e accesso rapido ai nuclei principali del progetto.' },
          { title: 'CreatorOS.readme', text: 'Versione desktop-web del sito ufficiale: una shell narrativa che fonde vetrina, atmosfera e funzioni reali.' },
          { title: 'DarkPlayer84TvProductions.core', text: 'Firma produttiva che collega contenuti, stile, modding, direzione artistica e packaging dei progetti.' }
        ]
      },
      profile: {
        path: 'C:\\CreatorOS\\Profile',
        items: [
          { title: 'Luigi_Sestili_Spurio.txt', text: 'Nome reale dietro il brand OldGamerDarthy e base umana di tutto il progetto.' },
          { title: 'Creator_Identity.md', text: 'Profilo multidisciplinare: gaming, modding, musica elettronica, arte digitale, vlog e divulgazione tech.' },
          { title: 'Mission.statement', text: 'Comunicazione diretta, autenticità, supporto concreto alla community e desiderio di creare qualcosa di utile.' }
        ]
      },
      modding: {
        path: 'C:\\CreatorOS\\Modding',
        items: [
          { title: 'Optimization_Lab', text: 'Mod tecniche, fix grafici e strumenti pensati per migliorare stabilità, prestazioni e pulizia generale dell’esperienza.' },
          { title: 'Gameplay_Respect.note', text: 'Approccio orientato a migliorare l’esperienza senza stravolgere il cuore dei giochi originali.' },
          { title: 'Community_Tools.package', text: 'Condivisione gratuita, supporto agli utenti e attenzione pratica ai problemi reali della community.' }
        ]
      },
      media: {
        path: 'C:\\CreatorOS\\Media',
        items: [
          { title: 'YouTube_Twitch.sync', text: 'Vlog, opinioni, live, commenti, musica e aggiornamenti sui progetti in corso.' },
          { title: 'TikTok_Vimeo.feed', text: 'Clip creative, video brevi, contenuti sperimentali e materiali secondari.' },
          { title: 'SoundCloud_DeviantArt.vault', text: 'Musica elettronica, arte digitale e archivio visual/audio che completa il lato più emotivo del brand.' }
        ]
      },
      community: {
        path: 'C:\\CreatorOS\\Community',
        items: [
          { title: 'Discord_Gateway', text: 'Hub principale di conversazione, supporto reciproco, annunci ed eventi condivisi.' },
          { title: 'Steam_Group.link', text: 'Gruppo multigaming e presenza community nel mondo Steam, tra giochi, recensioni e ritrovi.' },
          { title: 'GuestBook.queue', text: 'Spazio per messaggi, feedback, idee e memoria viva delle interazioni con il pubblico.' }
        ]
      },
      archive: {
        path: 'C:\\CreatorOS\\Archive',
        items: [
          { title: 'Identity_Archive', text: 'Memoria dell’evoluzione del creator, delle sue release e del linguaggio del brand.' },
          { title: 'Production_Notes', text: 'Visione, metodo, direzione artistica, roadmap e filosofia di lavoro del progetto.' },
          { title: 'Future_Growth', text: 'Base per espansioni future, nuove release, vetrine dedicate e collaborazioni creative assistite da IA.' }
        ]
      }
    },
    responseEntries: [
      {
        title: 'Benvenuti nel Guest Book ufficiale',
        body: 'Ogni messaggio ricevuto può diventare parte della memoria del progetto. Qui c’è spazio per parole sincere, supporto reciproco, idee utili e piccoli frammenti di community reale.'
      },
      {
        title: 'Linea guida del progetto',
        body: 'Questo spazio nasce per raccogliere pensieri autentici, feedback costruttivi, proposte creative e testimonianze capaci di rafforzare il percorso di OldGamerDarthy Official.'
      },
      {
        title: 'Privacy e anteprima locale',
        body: 'L’anteprima salvata dal sito resta in locale nel browser che stai usando. L’invio reale del messaggio passa invece attraverso il tuo client email.'
      }
    ]
  };

  window.OGD = { refs, state, data };
})();

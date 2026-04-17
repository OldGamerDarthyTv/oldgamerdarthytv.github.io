(function () {
  const { refs, state } = window.OGD;
  const STORAGE_KEY = 'ogdDesktopRaceSeason';
  const RACE_DURATION_MIN = 6400;
  const RACE_DURATION_MAX = 10800;
  const CHAMPION_BONUS = 900;
  const POST_RACE_HOLD = 7000;
  const TRACK_PADDING = 88;

  const cars = [
    { id: 'car-01', number: '01', name: 'Obsidian Warden', accent: '#d6b36a' },
    { id: 'car-02', number: '02', name: 'Nebula Fang', accent: '#9aa7c2' },
    { id: 'car-03', number: '03', name: 'Iron Seraph', accent: '#b44f36' },
    { id: 'car-04', number: '04', name: 'Zero Howl', accent: '#7c8aa3' },
    { id: 'car-05', number: '05', name: 'Midnight Pulse', accent: '#6c90d8' },
    { id: 'car-06', number: '06', name: 'Solar Rift', accent: '#d38c4d' },
    { id: 'car-07', number: '07', name: 'Grim Atlas', accent: '#76818f' },
    { id: 'car-08', number: '08', name: 'Black Halo', accent: '#c5a16f' },
    { id: 'car-09', number: '09', name: 'Star Reaver', accent: '#4f7ab7' },
    { id: 'car-10', number: '10', name: 'Titan Shade', accent: '#b6becb' },
    { id: 'car-11', number: '11', name: 'Dawn Cipher', accent: '#d39d5f' },
    { id: 'car-12', number: '12', name: 'Phantom Crown', accent: '#8d98b1' },
    { id: 'car-13', number: '13', name: 'Chrome Raven', accent: '#7ea8d8' },
    { id: 'car-14', number: '14', name: 'Ashbreaker', accent: '#b25a44' },
    { id: 'car-15', number: '15', name: 'Lunar Bastion', accent: '#c2c8d2' },
    { id: 'car-16', number: '16', name: 'Gilded Venom', accent: '#e0bc77' },
    { id: 'car-17', number: '17', name: 'Vanta Rook', accent: '#7f8899' },
    { id: 'car-18', number: '18', name: 'Nova Sentinel', accent: '#5583c8' },
    { id: 'car-19', number: '19', name: 'Dust Monarch', accent: '#d58a63' },
    { id: 'car-20', number: '20', name: 'Void Charger', accent: '#9ea6b7' }
  ];

  function shuffled(input) {
    const array = [...input];
    for (let i = array.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  function pickCandidate(pool, schedule) {
    const recent = schedule.slice(-2);
    const blockedId = recent.length === 2 && recent[0] === recent[1] ? recent[0] : null;
    const filtered = blockedId ? pool.filter((id) => id !== blockedId) : pool;
    const source = filtered.length ? filtered : pool;
    return source[Math.floor(Math.random() * source.length)];
  }

  function createSeasonSchedule() {
    const required = shuffled(cars.map((car) => car.id));
    let extraSlots = 10;
    const schedule = [];

    while (required.length || extraSlots > 0) {
      const mustUseRequired = required.length > 0 && required.length >= (required.length + extraSlots);
      const preferRequired = required.length > 0 && (mustUseRequired || Math.random() < 0.62);
      if (preferRequired) {
        const candidate = pickCandidate(required, schedule);
        schedule.push(candidate);
        required.splice(required.indexOf(candidate), 1);
        continue;
      }

      const candidate = pickCandidate(cars.map((car) => car.id), schedule);
      const requiredIndex = required.indexOf(candidate);
      schedule.push(candidate);
      if (requiredIndex >= 0) {
        required.splice(requiredIndex, 1);
      } else {
        extraSlots -= 1;
      }
    }

    return schedule;
  }

  function loadSeasonState() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (!parsed || !Array.isArray(parsed.schedule) || !parsed.schedule.length) return null;
      return parsed;
    } catch {
      return null;
    }
  }

  function createSeasonState(previousSeason = 0) {
    return {
      season: previousSeason + 1,
      schedule: createSeasonSchedule(),
      pointer: 0,
      uniqueChampions: [],
      recentChampions: []
    };
  }

  function getSeasonState() {
    const loaded = loadSeasonState();
    if (loaded) return loaded;
    const fresh = createSeasonState();
    saveSeasonState(fresh);
    return fresh;
  }

  function saveSeasonState(payload) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {}
  }

  function getCarById(id) {
    return cars.find((car) => car.id === id);
  }

  function ensureSeasonState() {
    let seasonState = getSeasonState();
    if (seasonState.pointer >= seasonState.schedule.length) {
      seasonState = createSeasonState(seasonState.season);
      saveSeasonState(seasonState);
    }
    return seasonState;
  }

  function nextChampion() {
    const seasonState = ensureSeasonState();
    const championId = seasonState.schedule[seasonState.pointer];
    seasonState.pointer += 1;
    if (!seasonState.uniqueChampions.includes(championId)) {
      seasonState.uniqueChampions.push(championId);
    }
    seasonState.recentChampions.unshift(championId);
    seasonState.recentChampions = seasonState.recentChampions.slice(0, 6);
    saveSeasonState(seasonState);
    return { championId, seasonState };
  }

  function buildLanes() {
    if (!refs.trackLanes) return;
    refs.trackLanes.innerHTML = '';
    cars.forEach((car) => {
      const lane = document.createElement('article');
      lane.className = 'race-lane';
      lane.dataset.carId = car.id;
      lane.style.setProperty('--car-accent', car.accent);
      lane.innerHTML = `
        <div class="lane-label">
          <span class="lane-number">${car.number}</span>
          <strong>${car.name}</strong>
        </div>
        <div class="lane-track">
          <span class="finish-line"></span>
          <div class="race-car" aria-hidden="true">
            <span class="car-glow"></span>
            <span class="car-body"></span>
            <span class="car-tail"></span>
          </div>
        </div>
      `;
      refs.trackLanes.appendChild(lane);
    });
    updateLaneTravel();
  }

  function updateLaneTravel() {
    if (!refs.trackLanes) return;
    refs.trackLanes.querySelectorAll('.race-lane').forEach((lane) => {
      const track = lane.querySelector('.lane-track');
      const car = lane.querySelector('.race-car');
      if (!track || !car) return;
      const travel = Math.max(80, track.clientWidth - car.clientWidth - TRACK_PADDING);
      lane.style.setProperty('--travel-distance', `${travel}px`);
    });
  }

  function updateSeasonBoard() {
    const seasonState = ensureSeasonState();
    if (refs.seasonProgress) {
      refs.seasonProgress.textContent = `${seasonState.uniqueChampions.length} / ${cars.length} campioni unici`;
    }
    if (refs.seasonChampion) {
      if (!seasonState.recentChampions.length) {
        refs.seasonChampion.textContent = 'Nessun campione proclamato in questa sessione.';
      } else {
        const current = getCarById(seasonState.recentChampions[0]);
        refs.seasonChampion.textContent = `Ultimo campione: ${current.name} · stagione ${seasonState.season}`;
      }
    }
    if (refs.recentWinners) {
      refs.recentWinners.innerHTML = '';
      seasonState.recentChampions.forEach((id, index) => {
        const item = document.createElement('li');
        const car = getCarById(id);
        item.textContent = `${index + 1}. ${car.name}`;
        refs.recentWinners.appendChild(item);
      });
      if (!seasonState.recentChampions.length) {
        const item = document.createElement('li');
        item.textContent = 'La stagione deve ancora incoronare il primo vincitore.';
        refs.recentWinners.appendChild(item);
      }
    }
  }

  function resetCarsVisuals() {
    if (!refs.trackLanes) return;
    refs.trackLanes.querySelectorAll('.race-lane').forEach((lane) => {
      lane.classList.remove('winner', 'racing');
      const car = lane.querySelector('.race-car');
      if (!car) return;
      car.style.transition = 'none';
      car.style.transform = 'translate3d(0,0,0)';
      void car.offsetWidth;
    });
  }

  function buildTimes(championId) {
    const times = new Map();
    cars.forEach((car) => {
      const base = Math.floor(Math.random() * (RACE_DURATION_MAX - RACE_DURATION_MIN + 1)) + RACE_DURATION_MIN;
      times.set(car.id, base);
    });
    const championTime = Math.max(4400, (times.get(championId) || RACE_DURATION_MIN) - CHAMPION_BONUS - Math.floor(Math.random() * 700));
    times.set(championId, championTime);
    return times;
  }

  function runRaceAnimation(championId, seasonState, onComplete) {
    if (!refs.trackLanes) return;
    state.tournamentRunning = true;
    state.tournamentCooldownActive = true;
    updateLaneTravel();
    resetCarsVisuals();
    if (refs.tournamentTitle) refs.tournamentTitle.textContent = `Stagione ${seasonState.season} · torneo in corso`;
    if (refs.tournamentStatus) refs.tournamentStatus.textContent = 'I motori si accendono e la griglia parte: il vincitore verrà scelto dalla dinamica della stagione.';
    const times = buildTimes(championId);
    let maxDuration = 0;

    refs.trackLanes.querySelectorAll('.race-lane').forEach((lane) => {
      const car = lane.querySelector('.race-car');
      const carId = lane.dataset.carId;
      const duration = times.get(carId) || RACE_DURATION_MAX;
      maxDuration = Math.max(maxDuration, duration);
      lane.classList.add('racing');
      car.style.transition = `transform ${duration}ms cubic-bezier(0.22, 1, 0.36, 1)`;
      requestAnimationFrame(() => {
        car.style.transform = 'translate3d(var(--travel-distance), 0, 0)';
      });
      if (carId === championId) {
        window.setTimeout(() => {
          lane.classList.add('winner');
          const champion = getCarById(championId);
          if (refs.tournamentTitle) refs.tournamentTitle.textContent = `${champion.name} conquista il torneo!`;
          if (refs.tournamentStatus) refs.tournamentStatus.textContent = `Vittoria assegnata a ${champion.name}. La stagione continua e ogni bolide avrà il suo momento di gloria.`;
          updateSeasonBoard();
        }, duration + 160);
      }
    });

    window.setTimeout(() => {
      state.tournamentRunning = false;
      resetCarsVisuals();
      const seasonFresh = ensureSeasonState();
      if (seasonFresh.pointer >= seasonFresh.schedule.length && seasonFresh.uniqueChampions.length >= cars.length) {
        if (refs.tournamentStatus) refs.tournamentStatus.textContent = 'Stagione completata: tutti i 20 bolidi hanno conquistato almeno un torneo. Alla prossima corsa inizierà una nuova stagione.';
      }
      window.setTimeout(() => {
        state.tournamentCooldownActive = false;
        if (typeof onComplete === 'function') onComplete();
      }, POST_RACE_HOLD);
    }, maxDuration + 1000);
  }

  function startTournamentRace(options = {}) {
    if (state.tournamentRunning) return;
    const { championId, seasonState } = nextChampion();
    runRaceAnimation(championId, seasonState, options.onComplete);
  }

  function initRaceTournament() {
    if (!refs.trackLanes) return;
    buildLanes();
    updateSeasonBoard();
    window.addEventListener('resize', updateLaneTravel);
  }

  window.OGD.initRaceTournament = initRaceTournament;
  window.OGD.startTournamentRace = startTournamentRace;
  window.OGD.updateRaceTournamentLayout = updateLaneTravel;
})();

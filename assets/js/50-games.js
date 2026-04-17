(function () {
  const { refs } = window.OGD;
  const SCORE_KEY = 'ogdArcadeLeaderboard';

  function loadScores() {
    try {
      return JSON.parse(localStorage.getItem(SCORE_KEY) || '[]');
    } catch {
      return [];
    }
  }

  function saveScores(entries) {
    try {
      localStorage.setItem(SCORE_KEY, JSON.stringify(entries.slice(0, 8)));
    } catch {}
  }

  function renderScores() {
    if (!refs.leaderboardList) return;
    const entries = loadScores();
    refs.leaderboardList.innerHTML = entries.length
      ? entries.map((entry) => `<li><strong>${entry.name}</strong> · ${entry.game} · ${entry.score}</li>`).join('')
      : '<li>Nessun record ancora. Inizia tu la Hall of Fame.</li>';
  }

  function storeScore(game, score) {
    if (!score || score <= 0) return;
    const entries = loadScores();
    const threshold = entries.length < 8 ? 0 : entries[entries.length - 1].score;
    if (score <= threshold && entries.length >= 8) return;
    const raw = window.prompt(`Nuovo punteggio in ${game}. Nome per la classifica:`, 'OGD') || 'OGD';
    const name = raw.trim().slice(0, 12) || 'OGD';
    entries.push({ name, game, score });
    entries.sort((a, b) => b.score - a.score);
    saveScores(entries);
    renderScores();
  }

  function bindTabs() {
    const tabs = [...document.querySelectorAll('.game-tab')];
    const panels = [...document.querySelectorAll('.game-panel')];
    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        tabs.forEach((item) => item.classList.toggle('active', item === tab));
        panels.forEach((panel) => panel.classList.toggle('active', panel.id === `${tab.dataset.game}GamePanel`));
      });
    });
  }

  function setupSnake() {
    const canvas = document.getElementById('snakeCanvas');
    const scoreLabel = document.getElementById('snakeScore');
    const start = document.getElementById('snakeStart');
    if (!canvas || !scoreLabel || !start) return;
    const ctx = canvas.getContext('2d');
    const cell = 18;
    const cols = Math.floor(canvas.width / cell);
    const rows = Math.floor(canvas.height / cell);
    let body = [{ x: 6, y: 6 }];
    let dir = { x: 1, y: 0 };
    let nextDir = { x: 1, y: 0 };
    let food = { x: 14, y: 10 };
    let timer = null;
    let score = 0;

    function placeFood() {
      do {
        food = { x: Math.floor(Math.random() * cols), y: Math.floor(Math.random() * rows) };
      } while (body.some((p) => p.x === food.x && p.y === food.y));
    }

    function draw(ended = false) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#07111d';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = 'rgba(255,255,255,0.05)';
      for (let x = 0; x <= canvas.width; x += cell) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke(); }
      for (let y = 0; y <= canvas.height; y += cell) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke(); }
      ctx.fillStyle = '#d2b57c';
      ctx.fillRect(food.x * cell + 3, food.y * cell + 3, cell - 6, cell - 6);
      body.forEach((part, index) => {
        ctx.fillStyle = index === 0 ? '#f3f5f8' : '#9fa9bb';
        ctx.fillRect(part.x * cell + 2, part.y * cell + 2, cell - 4, cell - 4);
      });
      if (ended) {
        ctx.fillStyle = 'rgba(0,0,0,0.45)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#fff';
        ctx.font = '700 28px Rajdhani';
        ctx.fillText('Game Over', canvas.width / 2 - 70, canvas.height / 2);
      }
    }

    function end() {
      clearInterval(timer);
      timer = null;
      draw(true);
      storeScore('Snake Neon', score);
    }

    function tick() {
      dir = nextDir;
      const head = { x: body[0].x + dir.x, y: body[0].y + dir.y };
      if (head.x < 0 || head.y < 0 || head.x >= cols || head.y >= rows || body.some((p) => p.x === head.x && p.y === head.y)) {
        end();
        return;
      }
      body.unshift(head);
      if (head.x === food.x && head.y === food.y) {
        score += 1;
        scoreLabel.textContent = String(score);
        placeFood();
      } else {
        body.pop();
      }
      draw();
    }

    start.addEventListener('click', () => {
      clearInterval(timer);
      body = [{ x: 6, y: 6 }];
      dir = { x: 1, y: 0 };
      nextDir = { x: 1, y: 0 };
      score = 0;
      scoreLabel.textContent = '0';
      placeFood();
      draw();
      timer = setInterval(tick, 110);
    });

    document.addEventListener('keydown', (event) => {
      const key = event.key.toLowerCase();
      if ((key === 'arrowup' || key === 'w') && dir.y !== 1) nextDir = { x: 0, y: -1 };
      if ((key === 'arrowdown' || key === 's') && dir.y !== -1) nextDir = { x: 0, y: 1 };
      if ((key === 'arrowleft' || key === 'a') && dir.x !== 1) nextDir = { x: -1, y: 0 };
      if ((key === 'arrowright' || key === 'd') && dir.x !== -1) nextDir = { x: 1, y: 0 };
    });

    draw();
  }

  function setupCatcher() {
    const canvas = document.getElementById('catcherCanvas');
    const scoreLabel = document.getElementById('catcherScore');
    const start = document.getElementById('catcherStart');
    if (!canvas || !scoreLabel || !start) return;
    const ctx = canvas.getContext('2d');
    let paddleX = canvas.width / 2 - 60;
    let token = null;
    let frame = null;
    let score = 0;
    let left = false;
    let right = false;
    let running = false;

    function spawn() { token = { x: 30 + Math.random() * (canvas.width - 60), y: -20, speed: 2 + Math.random() * 1.5 }; }
    function draw(ended = false) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#07111d';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      if (token) {
        ctx.fillStyle = '#d2b57c';
        ctx.beginPath();
        ctx.arc(token.x, token.y, 16, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#e8edf7';
      ctx.fillRect(paddleX, canvas.height - 24, 120, 12);
      if (ended) {
        ctx.fillStyle = 'rgba(0,0,0,0.45)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
    function loop() {
      if (!running) return;
      if (left) paddleX -= 7;
      if (right) paddleX += 7;
      paddleX = Math.max(0, Math.min(canvas.width - 120, paddleX));
      token.y += token.speed;
      const caught = token.y + 16 >= canvas.height - 24 && token.x >= paddleX && token.x <= paddleX + 120;
      if (caught) {
        score += 1;
        scoreLabel.textContent = String(score);
        spawn();
      } else if (token.y > canvas.height + 20) {
        running = false;
        draw(true);
        storeScore('Logo Catch', score);
        return;
      }
      draw();
      frame = requestAnimationFrame(loop);
    }
    start.addEventListener('click', () => {
      cancelAnimationFrame(frame);
      paddleX = canvas.width / 2 - 60;
      score = 0;
      scoreLabel.textContent = '0';
      running = true;
      spawn();
      loop();
    });
    document.addEventListener('keydown', (event) => {
      const key = event.key.toLowerCase();
      if (key === 'arrowleft' || key === 'a') left = true;
      if (key === 'arrowright' || key === 'd') right = true;
    });
    document.addEventListener('keyup', (event) => {
      const key = event.key.toLowerCase();
      if (key === 'arrowleft' || key === 'a') left = false;
      if (key === 'arrowright' || key === 'd') right = false;
    });
    draw();
  }

  function setupDodger() {
    const canvas = document.getElementById('dodgerCanvas');
    const scoreLabel = document.getElementById('dodgerScore');
    const start = document.getElementById('dodgerStart');
    if (!canvas || !scoreLabel || !start) return;
    const ctx = canvas.getContext('2d');
    let shipX = canvas.width / 2;
    let obstacles = [];
    let frame = null;
    let left = false;
    let right = false;
    let score = 0;
    let running = false;
    let ticks = 0;

    function draw(ended = false) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#07111d';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      obstacles.forEach((item) => {
        ctx.fillStyle = item.c;
        ctx.fillRect(item.x, item.y, item.w, item.h);
      });
      ctx.fillStyle = '#e8edf7';
      ctx.beginPath();
      ctx.moveTo(shipX, canvas.height - 40);
      ctx.lineTo(shipX - 14, canvas.height - 14);
      ctx.lineTo(shipX + 14, canvas.height - 14);
      ctx.closePath();
      ctx.fill();
      if (ended) {
        ctx.fillStyle = 'rgba(0,0,0,0.45)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
    function loop() {
      if (!running) return;
      ticks += 1;
      if (left) shipX -= 7;
      if (right) shipX += 7;
      shipX = Math.max(18, Math.min(canvas.width - 18, shipX));
      if (ticks % 24 === 0) obstacles.push({ x: Math.random() * (canvas.width - 30), y: -30, w: 20 + Math.random() * 20, h: 12 + Math.random() * 16, c: Math.random() > 0.5 ? '#8e96a8' : '#d4dde9' });
      obstacles.forEach((item) => { item.y += 4; });
      obstacles = obstacles.filter((item) => item.y < canvas.height + 40);
      const hit = obstacles.some((item) => shipX + 14 > item.x && shipX - 14 < item.x + item.w && canvas.height - 40 < item.y + item.h && canvas.height - 14 > item.y);
      if (hit) {
        running = false;
        draw(true);
        storeScore('Star Dodger', Math.floor(score / 10));
        return;
      }
      score += 1;
      scoreLabel.textContent = String(Math.floor(score / 10));
      draw();
      frame = requestAnimationFrame(loop);
    }
    start.addEventListener('click', () => {
      cancelAnimationFrame(frame);
      shipX = canvas.width / 2;
      obstacles = [];
      score = 0;
      ticks = 0;
      scoreLabel.textContent = '0';
      running = true;
      loop();
    });
    document.addEventListener('keydown', (event) => {
      const key = event.key.toLowerCase();
      if (key === 'arrowleft' || key === 'a') left = true;
      if (key === 'arrowright' || key === 'd') right = true;
    });
    document.addEventListener('keyup', (event) => {
      const key = event.key.toLowerCase();
      if (key === 'arrowleft' || key === 'a') left = false;
      if (key === 'arrowright' || key === 'd') right = false;
    });
    draw();
  }

  function setupMemory() {
    const levelLabel = document.getElementById('memoryLevel');
    const start = document.getElementById('memoryStart');
    const status = document.getElementById('memoryStatus');
    const pads = [...document.querySelectorAll('.memory-pad')];
    if (!levelLabel || !start || !status || !pads.length) return;
    let sequence = [];
    let index = 0;
    let accepting = false;
    let level = 0;

    function flash(position) {
      pads[position].classList.add('active');
      setTimeout(() => pads[position].classList.remove('active'), 260);
    }
    function play() {
      accepting = false;
      status.textContent = 'Osserva la sequenza...';
      sequence.forEach((value, step) => setTimeout(() => flash(value), step * 500 + 250));
      setTimeout(() => {
        accepting = true;
        index = 0;
        status.textContent = 'Ripeti la sequenza.';
      }, sequence.length * 500 + 350);
    }
    start.addEventListener('click', () => {
      sequence = [Math.floor(Math.random() * 4)];
      level = 1;
      levelLabel.textContent = '1';
      play();
    });
    pads.forEach((pad, padIndex) => {
      pad.addEventListener('click', () => {
        if (!accepting) return;
        flash(padIndex);
        if (sequence[index] !== padIndex) {
          accepting = false;
          status.textContent = 'Sequenza errata. Premi Start / Restart.';
          storeScore('Memory Pulse', Math.max(0, level - 1));
          return;
        }
        index += 1;
        if (index >= sequence.length) {
          level += 1;
          levelLabel.textContent = String(level);
          sequence.push(Math.floor(Math.random() * 4));
          setTimeout(play, 700);
        }
      });
    });
  }

  function setupReactor() {
    const canvas = document.getElementById('reactorCanvas');
    const scoreLabel = document.getElementById('reactorScore');
    const start = document.getElementById('reactorStart');
    const status = document.getElementById('reactorStatus');
    if (!canvas || !scoreLabel || !start || !status) return;
    const ctx = canvas.getContext('2d');
    let target = null;
    let score = 0;
    let running = false;
    let endAt = 0;
    let frame = null;
    function spawn() { target = { x: 40 + Math.random() * (canvas.width - 80), y: 40 + Math.random() * (canvas.height - 80), r: 18 + Math.random() * 8 }; }
    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#07111d';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      if (target) {
        const gradient = ctx.createRadialGradient(target.x, target.y, 4, target.x, target.y, target.r);
        gradient.addColorStop(0, '#fff');
        gradient.addColorStop(0.3, '#d2b57c');
        gradient.addColorStop(1, 'rgba(210,181,124,0.15)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(target.x, target.y, target.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    function loop(now) {
      if (!running) return;
      if (now >= endAt) {
        running = false;
        status.textContent = 'Sessione terminata. Premi Start / Restart.';
        storeScore('Core Reactor', score);
        draw();
        return;
      }
      status.textContent = `Tempo rimasto: ${((endAt - now) / 1000).toFixed(1)}s`;
      draw();
      frame = requestAnimationFrame(loop);
    }
    start.addEventListener('click', () => {
      cancelAnimationFrame(frame);
      score = 0;
      scoreLabel.textContent = '0';
      running = true;
      endAt = performance.now() + 20000;
      spawn();
      loop(performance.now());
    });
    canvas.addEventListener('click', (event) => {
      if (!running || !target) return;
      const rect = canvas.getBoundingClientRect();
      const x = (event.clientX - rect.left) * (canvas.width / rect.width);
      const y = (event.clientY - rect.top) * (canvas.height / rect.height);
      if (Math.hypot(x - target.x, y - target.y) <= target.r) {
        score += 1;
        scoreLabel.textContent = String(score);
        spawn();
        draw();
      }
    });
    draw();
  }

  function setupGamesHub() {
    bindTabs();
    setupSnake();
    setupCatcher();
    setupDodger();
    setupMemory();
    setupReactor();
    renderScores();
  }

  window.OGD.setupGamesHub = setupGamesHub;
})();

(function () {
  const defaultFiles = [
    {
      id: 'readme-txt',
      name: 'README.TXT',
      folder: 'Documents',
      type: 'txt',
      size: '2 KB',
      content: 'WELCOME TO CHRONO-OS 95 (PIXEL CRT EDITION)\nCREATED & ENGINEERED BY GAVIRU FERNANDO\n===========================================\n\nIncluded Applications:\n1. RetroPad Editor - Full text studio with Find/Replace & virtual disk saving.\n2. Pixel Arcade 3-in-1 - Play Cyber Snake, Brick Breaker DX, and Minesweeper 95.\n3. Sci-Calc 95 - Scientific & standard calculator with interactive paper tape.\n4. Pixel Art Studio - 16x16 & 32x32 sprite editor with symmetry, flood fill & PNG export.\n5. Chiptune Synth Deck - 16-step 4-track synthesizer + Web Audio keyboard.\n6. CHRONO-DOS Shell - Command line with neofetch, matrix rain, calc & file ops.\n7. File Manager - Browse C:/ drive folders, create files, and inspect storage.\n8. Tasks & Pomodoro - Productivity task board with retro focus timer.\n9. System Diagnostics - Live CPU/RAM/VRAM telemetry and process killer.\n10. CRT & Theme Control - Switch between 5 vintage CRT phosphor & synthwave palettes.'
    },
    {
      id: 'lore-txt',
      name: 'CYBERDECK.LOG',
      folder: 'Documents',
      type: 'txt',
      size: '1 KB',
      content: 'SYSTEM LOG [OCT-1995]\n> CRT Phosphor calibration verified at 60Hz.\n> SoundBlaster 16 WebAudio FM Synthesis online.\n> Tip: Open CHRONO-DOS Shell and type "matrix" or "neofetch"!'
    },
    {
      id: 'config-sys',
      name: 'CONFIG.SYS',
      folder: 'System',
      type: 'sys',
      size: '1 KB',
      content: 'FILES=40\nBUFFERS=20\nDEVICE=C:/DOS\\HIMEM.SYS\nDOS=HIGH,UMB\nCRT_MODE=PHOSPHOR_RGB'
    },
    {
      id: 'scores-dat',
      name: 'HISCORES.TXT',
      folder: 'Games',
      type: 'txt',
      size: '1 KB',
      content: 'ARCADE HALL OF FAME\n===================\nCYBER SNAKE: 240 PTS\nBRICK BREAKER: 680 PTS\nMINESWEEPER: 42 SEC'
    }
  ];

  const defaultTodos = [
    { id: 't1', text: 'Calibrate CRT scanline intensity in Control Panel', priority: 'HIGH', done: false },
    { id: 't2', text: 'Beat 150 points in Cyber Snake 89', priority: 'MED', done: false },
    { id: 't3', text: 'Compose a 16-step synth loop in Chiptune Deck', priority: 'LOW', done: true }
  ];

  const appCatalog = [
    { id: 'notepad', title: 'RetroPad Editor', icon: '📝', width: 560, height: 430, x: 95, y: 36 },
    { id: 'arcade', title: 'Pixel Arcade 3-in-1', icon: '🕹️', width: 540, height: 490, x: 160, y: 28 },
    { id: 'calculator', title: 'Sci-Calc 95', icon: '🧮', width: 370, height: 440, x: 240, y: 55 },
    { id: 'paint', title: 'Pixel Art Studio', icon: '🎨', width: 590, height: 460, x: 130, y: 42 },
    { id: 'viewer', title: 'RetroView Image Lab', icon: '🖼️', width: 610, height: 470, x: 155, y: 38 },
    { id: 'synth', title: 'Chiptune Synth Deck', icon: '🎹', width: 640, height: 450, x: 110, y: 48 },
    { id: 'terminal', title: 'CHRONO-DOS Shell', icon: '💻', width: 560, height: 390, x: 180, y: 64 },
    { id: 'explorer', title: 'File Manager C:/', icon: '📁', width: 560, height: 410, x: 140, y: 54 },
    { id: 'tasks', title: 'Tasks & Pomodoro', icon: '⏱️', width: 500, height: 440, x: 210, y: 46 },
    { id: 'sysmon', title: 'System Diagnostics', icon: '📈', width: 520, height: 420, x: 250, y: 52 },
    { id: 'settings', title: 'CRT & Theme Control', icon: '⚙️', width: 500, height: 440, x: 280, y: 40 }
  ];

  function loadStorage(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function saveStorage(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      return false;
    }
    return true;
  }

  const state = {
    audioEnabled: true,
    volume: 0.35,
    crtScanlines: true,
    crtCurved: true,
    textGlow: false,
    theme: loadStorage('chrono_theme_v2', 'synthwave'),
    use24Hour: false,
    bootTimestamp: Date.now(),
    swRunning: false,
    swElapsedMs: 0,
    wallpaperMode: loadStorage('chrono_wallpaper', 'grid'),
    zIndexCounter: 100,
    activeAppId: null,
    windows: {},
    files: loadStorage('chrono_files', defaultFiles),
    currentFileId: 'readme-txt',
    images: [],
    currentImageId: 'img-invader',
    pendingPaintPixels: null,
    paintLoadPixelsFn: null,
    explorerFolder: 'All',
    calcExpr: '0',
    calcMemory: 0,
    calcTape: ['READY :: 64-BIT FLOAT'],
    arcadeGame: 'snake',
    snakeHigh: loadStorage('chrono_snake_hi', 120),
    breakoutHigh: loadStorage('chrono_breakout_hi', 300),
    todos: loadStorage('chrono_todos', defaultTodos),
    todoFilter: 'ALL',
    pomoSeconds: 25 * 60,
    pomoMode: 25,
    pomoRunning: false,
    pomoSessions: 0,
    overclock: false
  };

  let audioCtx = null;

  function ensureAudio() {
    if (!state.audioEnabled) return null;
    try {
      if (!audioCtx) {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (Ctx) audioCtx = new Ctx();
      }
      if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
    } catch (e) {
      return null;
    }
    return audioCtx;
  }

  function playTone(freq, duration, type, delay) {
    const ctx = ensureAudio();
    if (!ctx) return;
    const start = ctx.currentTime + (delay || 0);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type || 'square';
    osc.frequency.setValueAtTime(freq, start);
    gain.gain.setValueAtTime(Math.max(0.01, state.volume * 0.18), start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + duration);
  }

  function sfxClick() {
    playTone(680, 0.035, 'square', 0);
  }

  function sfxOpen() {
    playTone(440, 0.06, 'square', 0);
    playTone(660, 0.08, 'square', 0.06);
  }

  function sfxClose() {
    playTone(520, 0.05, 'triangle', 0);
    playTone(320, 0.07, 'triangle', 0.05);
  }

  function sfxSuccess() {
    playTone(523.25, 0.07, 'square', 0);
    playTone(659.25, 0.07, 'square', 0.07);
    playTone(783.99, 0.1, 'square', 0.14);
    playTone(1046.5, 0.16, 'square', 0.22);
  }

  function sfxError() {
    playTone(160, 0.14, 'sawtooth', 0);
    playTone(130, 0.18, 'sawtooth', 0.12);
  }

  function showToast(message) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'retro-toast';
    const textSpan = document.createElement('span');
    textSpan.textContent = message;
    const closeBtn = document.createElement('button');
    closeBtn.className = 'retro-btn win-ctrl-btn';
    closeBtn.type = 'button';
    closeBtn.textContent = 'X';
    closeBtn.addEventListener('click', function () {
      toast.remove();
    });
    toast.appendChild(textSpan);
    toast.appendChild(closeBtn);
    container.appendChild(toast);
    setTimeout(function () {
      if (toast.parentNode) toast.remove();
    }, 3400);
  }

  function applyTheme(themeName) {
    state.theme = themeName;
    saveStorage('chrono_theme_v2', themeName);
    document.body.classList.remove('theme-synthwave', 'theme-amber', 'theme-matrix', 'theme-vapor');
    if (themeName !== 'win95') {
      document.body.classList.add('theme-' + themeName);
    }
  }

  function updateCRTStyles() {
    const overlay = document.getElementById('scanline-overlay');
    const wrapper = document.getElementById('crt-wrapper');
    const crtBtn = document.getElementById('tray-crt-btn');
    if (overlay) {
      overlay.style.display = state.crtScanlines ? 'block' : 'none';
    }
    if (wrapper) {
      wrapper.classList.toggle('crt-curved', state.crtCurved);
    }
    document.documentElement.style.setProperty('--text-glow', state.textGlow ? '6px' : '0px');
    if (crtBtn) {
      crtBtn.textContent = state.crtScanlines ? '📺 CRT:ON' : '📺 CRT:OFF';
    }
  }

  function runBootSequence() {
    const bootScreen = document.getElementById('boot-screen');
    const bootLog = document.getElementById('boot-log');
    const bootBar = document.getElementById('boot-progress-bar');
    const bootStatus = document.getElementById('boot-status-text');
    if (!bootScreen || !bootLog || !bootBar) return;

    bootScreen.classList.remove('hidden');
    bootLog.innerHTML = '';
    bootBar.style.width = '0%';

    const lines = [
      'BIOS ROM CHECKSUM ................. OK',
      'DETECTING PRIMARY IDE MASTER ...... C:/ CHRONO-DISK 512MB',
      'INITIALIZING CRT PHOSPHOR MATRIX .. 60HZ SYNC LOCKED',
      'LOADING SOUND BLASTER 16 SYNTH .... PORT 220 IRQ 5 DMA 1',
      'MOUNTING PIXEL DESKTOP SHELL ...... 10 APPS REGISTERED',
      'SYSTEM READY. WELCOME OPERATOR.'
    ];

    let step = 0;
    const timer = setInterval(function () {
      if (bootScreen.classList.contains('hidden')) {
        clearInterval(timer);
        return;
      }
      if (step < lines.length) {
        const lineEl = document.createElement('div');
        lineEl.textContent = '> ' + lines[step];
        bootLog.appendChild(lineEl);
        step += 1;
        bootBar.style.width = Math.min(100, Math.round((step / lines.length) * 100)) + '%';
        playTone(300 + step * 90, 0.03, 'square', 0);
      } else {
        clearInterval(timer);
        if (bootStatus) bootStatus.textContent = 'Boot sequence complete.';
        setTimeout(function () {
          bootScreen.classList.add('hidden');
          sfxSuccess();
        }, 220);
      }
    }, 150);
  }

  function renderDesktopIcons() {
    const desktop = document.getElementById('desktop');
    if (!desktop) return;
    desktop.innerHTML = '';
    appCatalog.forEach(function (app) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'desktop-icon';
      btn.setAttribute('data-app-icon', app.id);
      btn.innerHTML =
        '<div class="desktop-icon-art">' + app.icon + '</div>' +
        '<span class="desktop-icon-label">' + app.title + '</span>';
      btn.addEventListener('click', function () {
        document.querySelectorAll('.desktop-icon').forEach(function (el) {
          el.classList.remove('selected');
        });
        btn.classList.add('selected');
        openApp(app.id);
      });
      desktop.appendChild(btn);
    });
  }

  function focusWindow(appId) {
    state.activeAppId = appId;
    state.zIndexCounter += 1;
    Object.keys(state.windows).forEach(function (id) {
      const w = state.windows[id];
      if (!w || !w.el) return;
      if (id === appId) {
        w.el.classList.add('active');
        w.el.style.zIndex = String(state.zIndexCounter);
      } else {
        w.el.classList.remove('active');
      }
    });
    renderTaskbar();
  }

  function openApp(appId) {
    const meta = appCatalog.find(function (a) { return a.id === appId; });
    if (!meta) return;
    sfxOpen();
    const startMenu = document.getElementById('start-menu');
    if (startMenu) startMenu.classList.add('hidden');

    if (state.windows[appId]) {
      const existing = state.windows[appId];
      existing.minimized = false;
      existing.el.classList.remove('minimized');
      focusWindow(appId);
      return;
    }

    const container = document.getElementById('windows-container');
    const winEl = document.createElement('section');
    winEl.className = 'os-window active';
    winEl.dataset.winId = appId;

    const vw = window.innerWidth;
    const vh = window.innerHeight - 48;
    const width = Math.min(meta.width, vw - 20);
    const height = Math.min(meta.height, vh - 20);
    const offsetCount = Object.keys(state.windows).length;
    const left = Math.max(8, Math.min(meta.x + (offsetCount % 5) * 22, vw - width - 10));
    const top = Math.max(8, Math.min(meta.y + (offsetCount % 5) * 20, vh - height - 10));

    winEl.style.width = width + 'px';
    winEl.style.height = height + 'px';
    winEl.style.left = left + 'px';
    winEl.style.top = top + 'px';

    winEl.innerHTML =
      '<header class="window-titlebar">' +
        '<div class="window-title-left"><span>' + meta.icon + '</span><span>' + meta.title + '</span></div>' +
        '<div class="window-controls">' +
          '<button type="button" class="retro-btn win-ctrl-btn" data-win-action="shade" title="Shade Window">^</button>' +
          '<button type="button" class="retro-btn win-ctrl-btn" data-win-action="minimize" title="Minimize">_</button>' +
          '<button type="button" class="retro-btn win-ctrl-btn" data-win-action="maximize" title="Maximize">□</button>' +
          '<button type="button" class="retro-btn win-ctrl-btn" data-win-action="close" title="Close">X</button>' +
        '</div>' +
      '</header>' +
      '<div class="window-body" id="win-body-' + appId + '"></div>' +
      '<div class="window-statusbar" id="win-status-' + appId + '">' +
        '<span>READY</span><span>PID:' + (1040 + offsetCount * 17) + '</span>' +
      '</div>';

    container.appendChild(winEl);

    state.windows[appId] = {
      id: appId,
      meta: meta,
      el: winEl,
      minimized: false,
      maximized: false,
      shaded: false
    };

    winEl.addEventListener('mousedown', function () {
      focusWindow(appId);
    });
    winEl.addEventListener('touchstart', function () {
      focusWindow(appId);
    }, { passive: true });

    const titlebar = winEl.querySelector('.window-titlebar');
    setupWindowDragging(winEl, titlebar, appId);

    winEl.querySelectorAll('[data-win-action]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        const act = btn.getAttribute('data-win-action');
        if (act === 'close') closeApp(appId);
        if (act === 'minimize') minimizeApp(appId);
        if (act === 'maximize') toggleMaximizeApp(appId);
        if (act === 'shade') toggleShadeApp(appId);
      });
    });

    mountAppContent(appId, winEl.querySelector('.window-body'), winEl.querySelector('.window-statusbar'));
    focusWindow(appId);
    refreshSysMonProcesses();
  }

  function closeApp(appId) {
    const w = state.windows[appId];
    if (!w) return;
    sfxClose();
    if (w.cleanup) w.cleanup();
    w.el.remove();
    delete state.windows[appId];
    const remaining = Object.keys(state.windows);
    state.activeAppId = remaining.length ? remaining[remaining.length - 1] : null;
    if (state.activeAppId) focusWindow(state.activeAppId);
    else renderTaskbar();
    refreshSysMonProcesses();
  }

  function minimizeApp(appId) {
    const w = state.windows[appId];
    if (!w) return;
    sfxClick();
    w.minimized = true;
    w.el.classList.add('minimized');
    if (state.activeAppId === appId) {
      state.activeAppId = null;
    }
    renderTaskbar();
  }

  function toggleMaximizeApp(appId) {
    const w = state.windows[appId];
    if (!w) return;
    sfxClick();
    w.maximized = !w.maximized;
    w.el.classList.toggle('maximized', w.maximized);
    focusWindow(appId);
  }

  function toggleShadeApp(appId) {
    const w = state.windows[appId];
    if (!w) return;
    sfxClick();
    w.shaded = !w.shaded;
    w.el.classList.toggle('shaded', w.shaded);
  }

  function cascadeWindows() {
    let idx = 0;
    Object.keys(state.windows).forEach(function (id) {
      const w = state.windows[id];
      if (!w) return;
      w.minimized = false;
      w.maximized = false;
      w.shaded = false;
      w.el.classList.remove('minimized', 'maximized', 'shaded');
      w.el.style.left = (40 + idx * 28) + 'px';
      w.el.style.top = (28 + idx * 26) + 'px';
      idx += 1;
    });
    renderTaskbar();
    showToast('Windows cascaded neatly across desktop.');
  }

  function setupWindowDragging(winEl, handleEl, appId) {
    let dragging = false;
    let startX = 0;
    let startY = 0;
    let origLeft = 0;
    let origTop = 0;

    function onStart(clientX, clientY, target) {
      if (target.closest('.window-controls')) return;
      const w = state.windows[appId];
      if (!w || w.maximized) return;
      dragging = true;
      startX = clientX;
      startY = clientY;
      origLeft = parseInt(winEl.style.left, 10) || 0;
      origTop = parseInt(winEl.style.top, 10) || 0;
      focusWindow(appId);
    }

    function onMove(clientX, clientY) {
      if (!dragging) return;
      const dx = clientX - startX;
      const dy = clientY - startY;
      const maxLeft = Math.max(0, window.innerWidth - 120);
      const maxTop = Math.max(0, window.innerHeight - 80);
      winEl.style.left = Math.min(maxLeft, Math.max(0, origLeft + dx)) + 'px';
      winEl.style.top = Math.min(maxTop, Math.max(0, origTop + dy)) + 'px';
    }

    function onEnd() {
      dragging = false;
    }

    handleEl.addEventListener('mousedown', function (e) {
      onStart(e.clientX, e.clientY, e.target);
    });
    window.addEventListener('mousemove', function (e) {
      onMove(e.clientX, e.clientY);
    });
    window.addEventListener('mouseup', onEnd);

    handleEl.addEventListener('touchstart', function (e) {
      if (e.touches.length === 1) {
        onStart(e.touches[0].clientX, e.touches[0].clientY, e.target);
      }
    }, { passive: true });
    window.addEventListener('touchmove', function (e) {
      if (dragging && e.touches.length === 1) {
        onMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });
    window.addEventListener('touchend', onEnd);
  }

  function renderTaskbar() {
    const bar = document.getElementById('taskbar-windows');
    if (!bar) return;
    bar.innerHTML = '';
    Object.keys(state.windows).forEach(function (appId) {
      const w = state.windows[appId];
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'retro-btn taskbar-tab' + (state.activeAppId === appId && !w.minimized ? ' active' : '');
      btn.innerHTML = '<span>' + w.meta.icon + '</span><span>' + w.meta.title + '</span>';
      btn.addEventListener('click', function () {
        sfxClick();
        if (w.minimized) {
          w.minimized = false;
          w.el.classList.remove('minimized');
          focusWindow(appId);
        } else if (state.activeAppId === appId) {
          minimizeApp(appId);
        } else {
          focusWindow(appId);
        }
      });
      bar.appendChild(btn);
    });
  }

  function mountAppContent(appId, bodyEl, statusEl) {
    if (appId === 'notepad') mountNotepad(bodyEl, statusEl);
    else if (appId === 'calculator') mountCalculator(bodyEl, statusEl);
    else if (appId === 'arcade') mountArcade(bodyEl, statusEl);
    else if (appId === 'paint') mountPaint(bodyEl, statusEl);
    else if (appId === 'viewer') mountImageViewer(bodyEl, statusEl);
    else if (appId === 'synth') mountSynth(bodyEl, statusEl);
    else if (appId === 'terminal') mountTerminal(bodyEl, statusEl);
    else if (appId === 'explorer') mountExplorer(bodyEl, statusEl);
    else if (appId === 'tasks') mountTasks(bodyEl, statusEl);
    else if (appId === 'sysmon') mountSysMon(bodyEl, statusEl);
    else if (appId === 'settings') mountSettings(bodyEl, statusEl);
  }

  function mountNotepad(bodyEl, statusEl) {
    const currentFile = state.files.find(function (f) { return f.id === state.currentFileId; }) || state.files[0];

    bodyEl.innerHTML =
      '<div class="window-menubar" style="margin:-8px -8px 4px -8px;">' +
        '<select id="notepad-file-select" class="retro-input" aria-label="Select File"></select>' +
        '<button type="button" class="retro-btn" id="np-new-btn">New</button>' +
        '<button type="button" class="retro-btn" id="np-save-btn">Save C:/</button>' +
        '<button type="button" class="retro-btn" id="np-download-btn">Export .TXT</button>' +
        '<button type="button" class="retro-btn" id="np-stamp-btn">+Timestamp</button>' +
        '<button type="button" class="retro-btn" id="np-upper-btn">UPPER</button>' +
      '</div>' +
      '<div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;">' +
        '<input type="text" id="np-find-in" class="retro-input" placeholder="Find text..." style="width:130px;">' +
        '<input type="text" id="np-rep-in" class="retro-input" placeholder="Replace with..." style="width:130px;">' +
        '<button type="button" class="retro-btn" id="np-replace-btn">Replace All</button>' +
        '<input type="text" id="np-filename-in" class="retro-input" placeholder="FILENAME.TXT" style="width:135px;margin-left:auto;">' +
      '</div>' +
      '<div class="retro-inset" style="flex:1;display:flex;">' +
        '<textarea id="np-textarea" class="notepad-textarea" spellcheck="false"></textarea>' +
      '</div>';

    const selectEl = bodyEl.querySelector('#notepad-file-select');
    const areaEl = bodyEl.querySelector('#np-textarea');
    const nameInput = bodyEl.querySelector('#np-filename-in');

    function populateSelect() {
      selectEl.innerHTML = '';
      state.files.forEach(function (f) {
        const opt = document.createElement('option');
        opt.value = f.id;
        opt.textContent = f.name + ' (' + f.folder + ')';
        if (f.id === state.currentFileId) opt.selected = true;
        selectEl.appendChild(opt);
      });
    }

    function loadSelectedFile(id) {
      const f = state.files.find(function (item) { return item.id === id; });
      if (!f) return;
      state.currentFileId = f.id;
      areaEl.value = f.content;
      nameInput.value = f.name;
      updateCounts();
    }

    function updateCounts() {
      const txt = areaEl.value;
      const words = txt.trim() ? txt.trim().split(/\s+/).length : 0;
      const lines = txt.split('\n').length;
      if (statusEl) {
        statusEl.innerHTML =
          '<span>FILE: ' + (nameInput.value || 'UNTITLED.TXT') + '</span>' +
          '<span>' + lines + ' LN | ' + words + ' WD | ' + txt.length + ' CH</span>';
      }
    }

    populateSelect();
    if (currentFile) loadSelectedFile(currentFile.id);

    selectEl.addEventListener('change', function () {
      loadSelectedFile(selectEl.value);
    });

    areaEl.addEventListener('input', updateCounts);

    bodyEl.querySelector('#np-new-btn').addEventListener('click', function () {
      sfxClick();
      const newId = 'doc-' + Date.now();
      const newName = 'NOTE_' + (state.files.length + 1) + '.TXT';
      state.files.push({
        id: newId,
        name: newName,
        folder: 'Documents',
        type: 'txt',
        size: '1 KB',
        content: 'New RetroPad Document\nCreated on ' + new Date().toLocaleTimeString() + '\n'
      });
      state.currentFileId = newId;
      saveStorage('chrono_files', state.files);
      populateSelect();
      loadSelectedFile(newId);
      refreshExplorerView();
      showToast('Created ' + newName + ' in C:/Documents');
    });

    bodyEl.querySelector('#np-save-btn').addEventListener('click', function () {
      sfxSuccess();
      let f = state.files.find(function (item) { return item.id === state.currentFileId; });
      const cleanName = (nameInput.value.trim() || 'NOTE.TXT').toUpperCase();
      if (!f) {
        f = { id: 'doc-' + Date.now(), name: cleanName, folder: 'Documents', type: 'txt', size: '1 KB', content: '' };
        state.files.push(f);
        state.currentFileId = f.id;
      }
      f.name = cleanName;
      f.content = areaEl.value;
      f.size = Math.max(1, Math.ceil(areaEl.value.length / 512)) + ' KB';
      saveStorage('chrono_files', state.files);
      populateSelect();
      updateCounts();
      refreshExplorerView();
      showToast('Saved ' + f.name + ' to C:/ drive!');
    });

    bodyEl.querySelector('#np-download-btn').addEventListener('click', function () {
      sfxClick();
      const blob = new Blob([areaEl.value], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = (nameInput.value.trim() || 'RETROPAD.TXT');
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      showToast('Exported text file to your device.');
    });

    bodyEl.querySelector('#np-stamp-btn').addEventListener('click', function () {
      sfxClick();
      areaEl.value += '\n[' + new Date().toLocaleString() + '] ';
      updateCounts();
    });

    bodyEl.querySelector('#np-upper-btn').addEventListener('click', function () {
      sfxClick();
      areaEl.value = areaEl.value.toUpperCase();
      updateCounts();
    });

    bodyEl.querySelector('#np-replace-btn').addEventListener('click', function () {
      const findStr = bodyEl.querySelector('#np-find-in').value;
      const repStr = bodyEl.querySelector('#np-rep-in').value;
      if (!findStr) return;
      sfxClick();
      areaEl.value = areaEl.value.split(findStr).join(repStr);
      updateCounts();
      showToast('Replaced occurrences of "' + findStr + '".');
    });
  }

  function mountCalculator(bodyEl, statusEl) {
    bodyEl.innerHTML =
      '<div class="retro-dark-inset" style="padding:10px;text-align:right;">' +
        '<div id="calc-mem-indicator" style="font-size:14px;color:var(--accent-secondary);min-height:18px;">MEM: 0</div>' +
        '<div id="calc-display" class="pixel-font" style="font-size:20px;overflow-x:auto;white-space:nowrap;padding:4px 0;">0</div>' +
      '</div>' +
      '<div class="retro-inset" id="calc-tape" style="height:82px;overflow-y:auto;padding:6px;font-size:15px;"></div>' +
      '<div class="calc-grid" id="calc-buttons"></div>';

    const displayEl = bodyEl.querySelector('#calc-display');
    const memEl = bodyEl.querySelector('#calc-mem-indicator');
    const tapeEl = bodyEl.querySelector('#calc-tape');
    const gridEl = bodyEl.querySelector('#calc-buttons');

    const keys = [
      'MC', 'MR', 'M+', 'M-', 'C',
      'sin', 'cos', 'tan', '√', '⌫',
      '7', '8', '9', '/', '^',
      '4', '5', '6', '*', 'log',
      '1', '2', '3', '-', 'π',
      '0', '.', '=', '+', '%'
    ];

    function renderCalc() {
      displayEl.textContent = state.calcExpr;
      memEl.textContent = 'MEM: ' + state.calcMemory + ' | CLICK TAPE TO REUSE';
      tapeEl.innerHTML = '';
      state.calcTape.slice(-8).forEach(function (entry) {
        const row = document.createElement('div');
        row.style.cursor = 'pointer';
        row.textContent = entry;
        row.addEventListener('click', function () {
          const parts = entry.split('=');
          if (parts.length > 1) {
            state.calcExpr = parts[1].trim();
            renderCalc();
          }
        });
        tapeEl.appendChild(row);
      });
      tapeEl.scrollTop = tapeEl.scrollHeight;
    }

    function safeEval(expr) {
      const sanitized = expr.replace(/π/g, String(Math.PI)).replace(/\^/g, '**');
      if (!/^[0-9+\-*/().%\s*]+$/.test(sanitized)) {
        return NaN;
      }
      try {
        return Function('"use strict"; return (' + sanitized + ')')();
      } catch (e) {
        return NaN;
      }
    }

    function handleKey(k) {
      sfxClick();
      if (k === 'C') {
        state.calcExpr = '0';
      } else if (k === '⌫') {
        state.calcExpr = state.calcExpr.length > 1 ? state.calcExpr.slice(0, -1) : '0';
      } else if (k === 'MC') {
        state.calcMemory = 0;
      } else if (k === 'MR') {
        state.calcExpr = String(state.calcMemory);
      } else if (k === 'M+') {
        const v = safeEval(state.calcExpr);
        if (!isNaN(v)) state.calcMemory += v;
      } else if (k === 'M-') {
        const v = safeEval(state.calcExpr);
        if (!isNaN(v)) state.calcMemory -= v;
      } else if (k === 'sin' || k === 'cos' || k === 'tan' || k === '√' || k === 'log') {
        const v = safeEval(state.calcExpr);
        if (!isNaN(v)) {
          let res = v;
          if (k === 'sin') res = Math.sin(v);
          if (k === 'cos') res = Math.cos(v);
          if (k === 'tan') res = Math.tan(v);
          if (k === '√') res = v >= 0 ? Math.sqrt(v) : NaN;
          if (k === 'log') res = v > 0 ? Math.log10(v) : NaN;
          const formatted = isNaN(res) ? 'ERR' : String(Number(res.toFixed(6)));
          state.calcTape.push(k + '(' + v + ') = ' + formatted);
          state.calcExpr = formatted;
        }
      } else if (k === '=') {
        const res = safeEval(state.calcExpr);
        if (isNaN(res) || !isFinite(res)) {
          sfxError();
          state.calcExpr = 'ERR';
        } else {
          const formatted = String(Number(res.toFixed(6)));
          state.calcTape.push(state.calcExpr + ' = ' + formatted);
          state.calcExpr = formatted;
          sfxSuccess();
        }
      } else {
        if (state.calcExpr === '0' || state.calcExpr === 'ERR') {
          state.calcExpr = k;
        } else {
          state.calcExpr += k;
        }
      }
      if (statusEl) statusEl.innerHTML = '<span>FPU: READY</span><span>TAPE: ' + state.calcTape.length + ' ENTRIES</span>';
      renderCalc();
    }

    keys.forEach(function (k) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'retro-btn calc-btn';
      btn.textContent = k;
      btn.addEventListener('click', function () {
        handleKey(k);
      });
      gridEl.appendChild(btn);
    });

    renderCalc();
  }

  function mountArcade(bodyEl, statusEl) {
    bodyEl.innerHTML =
      '<div class="arcade-layout">' +
        '<div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;justify-content:space-between;">' +
          '<div style="display:flex;gap:4px;">' +
            '<button type="button" class="retro-btn" data-game-tab="snake">🐍 Cyber Snake</button>' +
            '<button type="button" class="retro-btn" data-game-tab="breakout">🧱 Brick Breaker</button>' +
            '<button type="button" class="retro-btn" data-game-tab="mines">💣 Minesweeper 95</button>' +
          '</div>' +
          '<div style="display:flex;gap:6px;align-items:center;">' +
            '<span id="arcade-score-label" class="pixel-font" style="font-size:11px;">SCORE: 0</span>' +
            '<button type="button" class="retro-btn" id="arcade-restart-btn">RESTART</button>' +
          '</div>' +
        '</div>' +
        '<div class="arcade-canvas-wrap retro-dark-inset" id="arcade-stage">' +
          '<canvas id="arcade-canvas" width="420" height="270"></canvas>' +
          '<div id="minesweeper-wrap" style="display:none;width:100%;"></div>' +
        '</div>' +
        '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">' +
          '<div style="font-size:16px;" id="arcade-hint">Use Arrow Keys / WASD or On-Screen D-Pad</div>' +
          '<div class="dpad-controls">' +
            '<span></span><button type="button" class="retro-btn" data-dpad="UP">▲</button><span></span>' +
            '<button type="button" class="retro-btn" data-dpad="LEFT">◀</button>' +
            '<button type="button" class="retro-btn" data-dpad="DOWN">▼</button>' +
            '<button type="button" class="retro-btn" data-dpad="RIGHT">▶</button>' +
          '</div>' +
        '</div>' +
      '</div>';

    const canvas = bodyEl.querySelector('#arcade-canvas');
    const ctx = canvas.getContext('2d');
    const minesWrap = bodyEl.querySelector('#minesweeper-wrap');
    const scoreLabel = bodyEl.querySelector('#arcade-score-label');
    const hintLabel = bodyEl.querySelector('#arcade-hint');

    let loopId = null;
    let snakeTimer = null;
    let currentTab = state.arcadeGame || 'snake';

    const snakeState = {
      grid: 15,
      snake: [{ x: 8, y: 8 }, { x: 7, y: 8 }, { x: 6, y: 8 }],
      dir: { x: 1, y: 0 },
      nextDir: { x: 1, y: 0 },
      food: { x: 14, y: 8 },
      score: 0,
      over: false
    };

    const breakoutState = {
      paddleX: 165,
      paddleW: 84,
      ballX: 210,
      ballY: 210,
      vx: 3.2,
      vy: -3.2,
      score: 0,
      lives: 3,
      bricks: [],
      moveDir: 0
    };

    const mineState = {
      rows: 9,
      cols: 9,
      mines: 10,
      flagMode: false,
      board: [],
      gameOver: false,
      won: false
    };

    function stopLoops() {
      if (loopId) cancelAnimationFrame(loopId);
      if (snakeTimer) clearInterval(snakeTimer);
      loopId = null;
      snakeTimer = null;
    }

    function initSnake() {
      stopLoops();
      canvas.style.display = 'block';
      minesWrap.style.display = 'none';
      snakeState.snake = [{ x: 8, y: 8 }, { x: 7, y: 8 }, { x: 6, y: 8 }];
      snakeState.dir = { x: 1, y: 0 };
      snakeState.nextDir = { x: 1, y: 0 };
      snakeState.score = 0;
      snakeState.over = false;
      spawnFood();
      hintLabel.textContent = 'Snake: Eat red phosphor nodes! High Score: ' + state.snakeHigh;
      scoreLabel.textContent = 'SCORE: 0 | HI: ' + state.snakeHigh;

      snakeTimer = setInterval(stepSnake, 115);
      drawSnake();
    }

    function spawnFood() {
      const cols = Math.floor(canvas.width / snakeState.grid);
      const rows = Math.floor(canvas.height / snakeState.grid);
      snakeState.food = {
        x: Math.floor(Math.random() * cols),
        y: Math.floor(Math.random() * rows)
      };
    }

    function stepSnake() {
      if (snakeState.over) return;
      snakeState.dir = snakeState.nextDir;
      const cols = Math.floor(canvas.width / snakeState.grid);
      const rows = Math.floor(canvas.height / snakeState.grid);
      const head = {
        x: (snakeState.snake[0].x + snakeState.dir.x + cols) % cols,
        y: (snakeState.snake[0].y + snakeState.dir.y + rows) % rows
      };

      if (snakeState.snake.some(function (seg) { return seg.x === head.x && seg.y === head.y; })) {
        snakeState.over = true;
        sfxError();
        drawSnake();
        return;
      }

      snakeState.snake.unshift(head);
      if (head.x === snakeState.food.x && head.y === snakeState.food.y) {
        snakeState.score += 10;
        if (snakeState.score > state.snakeHigh) {
          state.snakeHigh = snakeState.score;
          saveStorage('chrono_snake_hi', state.snakeHigh);
        }
        playTone(720, 0.06, 'square', 0);
        scoreLabel.textContent = 'SCORE: ' + snakeState.score + ' | HI: ' + state.snakeHigh;
        spawnFood();
      } else {
        snakeState.snake.pop();
      }
      drawSnake();
    }

    function drawSnake() {
      ctx.fillStyle = '#050a06';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = 'rgba(51, 255, 102, 0.08)';
      for (let x = 0; x < canvas.width; x += snakeState.grid) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += snakeState.grid) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      ctx.fillStyle = '#ff3355';
      ctx.fillRect(
        snakeState.food.x * snakeState.grid + 1,
        snakeState.food.y * snakeState.grid + 1,
        snakeState.grid - 2,
        snakeState.grid - 2
      );

      snakeState.snake.forEach(function (seg, idx) {
        ctx.fillStyle = idx === 0 ? '#00ff9d' : '#26cc68';
        ctx.fillRect(
          seg.x * snakeState.grid + 1,
          seg.y * snakeState.grid + 1,
          snakeState.grid - 2,
          snakeState.grid - 2
        );
      });

      if (snakeState.over) {
        ctx.fillStyle = 'rgba(0,0,0,0.75)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ff3355';
        ctx.font = '16px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 8);
        ctx.fillStyle = '#ffffff';
        ctx.font = '18px "VT323", monospace';
        ctx.fillText('Press RESTART to play again', canvas.width / 2, canvas.height / 2 + 22);
      }
    }

    function initBreakout() {
      stopLoops();
      canvas.style.display = 'block';
      minesWrap.style.display = 'none';
      breakoutState.paddleX = 168;
      breakoutState.ballX = 210;
      breakoutState.ballY = 210;
      breakoutState.vx = 3.1;
      breakoutState.vy = -3.1;
      breakoutState.score = 0;
      breakoutState.lives = 3;
      breakoutState.bricks = [];
      const colors = ['#ff3355', '#ff9900', '#ffcc00', '#33ff66', '#00e5ff'];
      for (let r = 0; r < 5; r += 1) {
        for (let c = 0; c < 8; c += 1) {
          breakoutState.bricks.push({
            x: 12 + c * 50,
            y: 22 + r * 18,
            w: 46,
            h: 13,
            color: colors[r],
            alive: true
          });
        }
      }
      hintLabel.textContent = 'Breakout: Move with Left/Right keys, D-pad, or mouse!';
      scoreLabel.textContent = 'SCORE: 0 | LIVES: 3';
      loopBreakout();
    }

    function loopBreakout() {
      ctx.fillStyle = '#060814';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      breakoutState.paddleX = Math.max(0, Math.min(canvas.width - breakoutState.paddleW, breakoutState.paddleX + breakoutState.moveDir * 5));

      breakoutState.ballX += breakoutState.vx;
      breakoutState.ballY += breakoutState.vy;

      if (breakoutState.ballX < 6 || breakoutState.ballX > canvas.width - 6) {
        breakoutState.vx *= -1;
        playTone(380, 0.03, 'triangle', 0);
      }
      if (breakoutState.ballY < 6) {
        breakoutState.vy *= -1;
        playTone(420, 0.03, 'triangle', 0);
      }

      if (
        breakoutState.ballY >= 244 &&
        breakoutState.ballY <= 254 &&
        breakoutState.ballX >= breakoutState.paddleX &&
        breakoutState.ballX <= breakoutState.paddleX + breakoutState.paddleW
      ) {
        const hitPos = (breakoutState.ballX - (breakoutState.paddleX + breakoutState.paddleW / 2)) / (breakoutState.paddleW / 2);
        breakoutState.vx = hitPos * 4.2;
        breakoutState.vy = -Math.abs(breakoutState.vy);
        playTone(540, 0.04, 'square', 0);
      }

      breakoutState.bricks.forEach(function (b) {
        if (!b.alive) return;
        if (
          breakoutState.ballX > b.x &&
          breakoutState.ballX < b.x + b.w &&
          breakoutState.ballY > b.y &&
          breakoutState.ballY < b.y + b.h
        ) {
          b.alive = false;
          breakoutState.vy *= -1;
          breakoutState.score += 20;
          if (breakoutState.score > state.breakoutHigh) {
            state.breakoutHigh = breakoutState.score;
            saveStorage('chrono_breakout_hi', state.breakoutHigh);
          }
          playTone(680, 0.05, 'square', 0);
          scoreLabel.textContent = 'SCORE: ' + breakoutState.score + ' | LIVES: ' + breakoutState.lives;
        }
      });

      if (breakoutState.ballY > canvas.height) {
        breakoutState.lives -= 1;
        sfxError();
        scoreLabel.textContent = 'SCORE: ' + breakoutState.score + ' | LIVES: ' + breakoutState.lives;
        if (breakoutState.lives <= 0) {
          ctx.fillStyle = '#ff3355';
          ctx.font = '15px "Press Start 2P", monospace';
          ctx.textAlign = 'center';
          ctx.fillText('OUT OF LIVES!', canvas.width / 2, canvas.height / 2);
          return;
        }
        breakoutState.ballX = 210;
        breakoutState.ballY = 200;
        breakoutState.vy = -3.1;
      }

      ctx.fillStyle = '#00f0ff';
      ctx.fillRect(breakoutState.paddleX, 248, breakoutState.paddleW, 10);

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(breakoutState.ballX - 4, breakoutState.ballY - 4, 8, 8);

      breakoutState.bricks.forEach(function (b) {
        if (!b.alive) return;
        ctx.fillStyle = b.color;
        ctx.fillRect(b.x, b.y, b.w, b.h);
      });

      loopId = requestAnimationFrame(loopBreakout);
    }

    function initMinesweeper() {
      stopLoops();
      canvas.style.display = 'none';
      minesWrap.style.display = 'block';
      mineState.board = [];
      mineState.gameOver = false;
      mineState.won = false;

      for (let r = 0; r < mineState.rows; r += 1) {
        const row = [];
        for (let c = 0; c < mineState.cols; c += 1) {
          row.push({ r: r, c: c, mine: false, revealed: false, flagged: false, count: 0 });
        }
        mineState.board.push(row);
      }

      let placed = 0;
      while (placed < mineState.mines) {
        const rr = Math.floor(Math.random() * mineState.rows);
        const cc = Math.floor(Math.random() * mineState.cols);
        if (!mineState.board[rr][cc].mine) {
          mineState.board[rr][cc].mine = true;
          placed += 1;
        }
      }

      for (let r = 0; r < mineState.rows; r += 1) {
        for (let c = 0; c < mineState.cols; c += 1) {
          let count = 0;
          for (let dr = -1; dr <= 1; dr += 1) {
            for (let dc = -1; dc <= 1; dc += 1) {
              const nr = r + dr;
              const nc = c + dc;
              if (nr >= 0 && nr < mineState.rows && nc >= 0 && nc < mineState.cols && mineState.board[nr][nc].mine) {
                count += 1;
              }
            }
          }
          mineState.board[r][c].count = count;
        }
      }

      hintLabel.textContent = 'Minesweeper: Click to reveal, or toggle Flag Mode to mark mines.';
      scoreLabel.textContent = 'MINES: ' + mineState.mines;
      renderMinesweeper();
    }

    function revealCell(r, c) {
      const cell = mineState.board[r][c];
      if (cell.revealed || cell.flagged || mineState.gameOver) return;
      cell.revealed = true;
      if (cell.mine) {
        mineState.gameOver = true;
        sfxError();
        mineState.board.forEach(function (row) {
          row.forEach(function (item) {
            if (item.mine) item.revealed = true;
          });
        });
        scoreLabel.textContent = 'BOOM! GAME OVER';
        renderMinesweeper();
        return;
      }
      playTone(600 + cell.count * 80, 0.03, 'square', 0);
      if (cell.count === 0) {
        for (let dr = -1; dr <= 1; dr += 1) {
          for (let dc = -1; dc <= 1; dc += 1) {
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < mineState.rows && nc >= 0 && nc < mineState.cols) {
              if (!mineState.board[nr][nc].revealed) revealCell(nr, nc);
            }
          }
        }
      }
      checkMineWin();
    }

    function checkMineWin() {
      let unrevealedSafe = 0;
      mineState.board.forEach(function (row) {
        row.forEach(function (cell) {
          if (!cell.mine && !cell.revealed) unrevealedSafe += 1;
        });
      });
      if (unrevealedSafe === 0) {
        mineState.gameOver = true;
        mineState.won = true;
        sfxSuccess();
        scoreLabel.textContent = 'SECTOR CLEARED! YOU WIN!';
      }
    }

    function renderMinesweeper() {
      minesWrap.innerHTML =
        '<div style="display:flex;justify-content:center;gap:10px;margin-bottom:6px;">' +
          '<button type="button" class="retro-btn" id="mine-flag-toggle">' +
            (mineState.flagMode ? '🚩 FLAG MODE: ON' : '⛏️ DIG MODE: ON') +
          '</button>' +
        '</div>' +
        '<div class="minesweeper-board" id="mine-grid" style="grid-template-columns:repeat(9, 28px);"></div>';

      minesWrap.querySelector('#mine-flag-toggle').addEventListener('click', function () {
        sfxClick();
        mineState.flagMode = !mineState.flagMode;
        renderMinesweeper();
      });

      const grid = minesWrap.querySelector('#mine-grid');
      mineState.board.forEach(function (row) {
        row.forEach(function (cell) {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'retro-btn mine-cell' + (cell.revealed ? ' revealed' : '');
          if (cell.revealed) {
            if (cell.mine) btn.textContent = '💣';
            else if (cell.count > 0) btn.textContent = String(cell.count);
          } else if (cell.flagged) {
            btn.textContent = '🚩';
          }
          btn.addEventListener('click', function () {
            if (mineState.gameOver) return;
            if (mineState.flagMode) {
              cell.flagged = !cell.flagged;
              sfxClick();
              renderMinesweeper();
            } else {
              revealCell(cell.r, cell.c);
              renderMinesweeper();
            }
          });
          btn.addEventListener('contextmenu', function (e) {
            e.preventDefault();
            if (!cell.revealed && !mineState.gameOver) {
              cell.flagged = !cell.flagged;
              sfxClick();
              renderMinesweeper();
            }
          });
          grid.appendChild(btn);
        });
      });
    }

    function switchGame(tab) {
      currentTab = tab;
      state.arcadeGame = tab;
      if (tab === 'snake') initSnake();
      else if (tab === 'breakout') initBreakout();
      else initMinesweeper();
      if (statusEl) statusEl.innerHTML = '<span>ACTIVE ROM: ' + tab.toUpperCase() + '</span><span>60 FPS CRT</span>';
    }

    bodyEl.querySelectorAll('[data-game-tab]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        sfxClick();
        switchGame(btn.getAttribute('data-game-tab'));
      });
    });

    bodyEl.querySelector('#arcade-restart-btn').addEventListener('click', function () {
      sfxClick();
      switchGame(currentTab);
    });

    bodyEl.querySelectorAll('[data-dpad]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const dir = btn.getAttribute('data-dpad');
        if (currentTab === 'snake') {
          if (dir === 'UP' && snakeState.dir.y === 0) snakeState.nextDir = { x: 0, y: -1 };
          if (dir === 'DOWN' && snakeState.dir.y === 0) snakeState.nextDir = { x: 0, y: 1 };
          if (dir === 'LEFT' && snakeState.dir.x === 0) snakeState.nextDir = { x: -1, y: 0 };
          if (dir === 'RIGHT' && snakeState.dir.x === 0) snakeState.nextDir = { x: 1, y: 0 };
        } else if (currentTab === 'breakout') {
          if (dir === 'LEFT') breakoutState.paddleX = Math.max(0, breakoutState.paddleX - 28);
          if (dir === 'RIGHT') breakoutState.paddleX = Math.min(canvas.width - breakoutState.paddleW, breakoutState.paddleX + 28);
        }
      });
    });

    canvas.addEventListener('mousemove', function (e) {
      if (currentTab !== 'breakout') return;
      const rect = canvas.getBoundingClientRect();
      const relX = e.clientX - rect.left;
      breakoutState.paddleX = Math.max(0, Math.min(canvas.width - breakoutState.paddleW, relX - breakoutState.paddleW / 2));
    });

    function onKeyDown(e) {
      if (state.activeAppId !== 'arcade') return;
      if (currentTab === 'snake') {
        if ((e.key === 'ArrowUp' || e.key === 'w') && snakeState.dir.y === 0) snakeState.nextDir = { x: 0, y: -1 };
        if ((e.key === 'ArrowDown' || e.key === 's') && snakeState.dir.y === 0) snakeState.nextDir = { x: 0, y: 1 };
        if ((e.key === 'ArrowLeft' || e.key === 'a') && snakeState.dir.x === 0) snakeState.nextDir = { x: -1, y: 0 };
        if ((e.key === 'ArrowRight' || e.key === 'd') && snakeState.dir.x === 0) snakeState.nextDir = { x: 1, y: 0 };
      } else if (currentTab === 'breakout') {
        if (e.key === 'ArrowLeft' || e.key === 'a') breakoutState.moveDir = -1;
        if (e.key === 'ArrowRight' || e.key === 'd') breakoutState.moveDir = 1;
      }
    }

    function onKeyUp(e) {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'ArrowRight' || e.key === 'd') {
        breakoutState.moveDir = 0;
      }
    }

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    state.windows.arcade.cleanup = function () {
      stopLoops();
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };

    switchGame(currentTab);
  }

  function mountPaint(bodyEl, statusEl) {
    const palette = [
      '#000000', '#ffffff', '#ff0055', '#00ff9d',
      '#00e5ff', '#ffcc00', '#7928ca', '#ff6600',
      '#000080', '#008080', '#808080', '#c0c0c0',
      '#33ff66', '#ff71ce', '#01cdfe', '#b967ff'
    ];

    bodyEl.innerHTML =
      '<div class="paint-layout">' +
        '<div class="paint-sidebar">' +
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;">' +
            '<button type="button" class="retro-btn pressed" data-ptool="pen">✏️ Pen</button>' +
            '<button type="button" class="retro-btn" data-ptool="fill">🪣 Fill</button>' +
            '<button type="button" class="retro-btn" data-ptool="erase">🧽 Erase</button>' +
            '<button type="button" class="retro-btn" data-ptool="mirror">🦋 Mirror</button>' +
          '</div>' +
          '<div class="palette-grid" id="paint-palette"></div>' +
          '<input type="color" id="paint-custom-color" value="#00ff9d" style="width:100%;height:30px;cursor:pointer;">' +
          '<button type="button" class="retro-btn" id="paint-sprite-btn">👾 Load Invader</button>' +
          '<button type="button" class="retro-btn" id="paint-import-btn">📂 Import Image</button>' +
          '<input type="file" id="paint-file-input" accept="image/*" style="display:none;">' +
          '<button type="button" class="retro-btn" id="paint-to-viewer-btn">🖼️ Send to Viewer</button>' +
          '<button type="button" class="retro-btn" id="paint-clear-btn">🗑️ Clear Grid</button>' +
          '<button type="button" class="retro-btn" id="paint-export-btn">💾 Export PNG</button>' +
        '</div>' +
        '<div class="retro-dark-inset" style="flex:1;display:flex;justify-content:center;align-items:center;padding:10px;">' +
          '<canvas id="paint-canvas" width="320" height="320" style="background:#10141f;cursor:crosshair;max-width:100%;"></canvas>' +
        '</div>' +
      '</div>';

    const canvas = bodyEl.querySelector('#paint-canvas');
    const ctx = canvas.getContext('2d');
    const gridN = 16;
    const cellS = canvas.width / gridN;
    let activeColor = '#00ff9d';
    let activeTool = 'pen';
    let mirrorMode = false;
    let drawing = false;
    const pixels = Array.from({ length: gridN }, function () {
      return Array(gridN).fill('');
    });

    function renderGrid() {
      ctx.fillStyle = '#0c1017';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      for (let r = 0; r < gridN; r += 1) {
        for (let c = 0; c < gridN; c += 1) {
          if (pixels[r][c]) {
            ctx.fillStyle = pixels[r][c];
            ctx.fillRect(c * cellS, r * cellS, cellS, cellS);
          }
          ctx.strokeStyle = 'rgba(255,255,255,0.08)';
          ctx.strokeRect(c * cellS, r * cellS, cellS, cellS);
        }
      }
    }

    function floodFill(r, c, target, replacement) {
      if (target === replacement) return;
      if (r < 0 || r >= gridN || c < 0 || c >= gridN) return;
      if (pixels[r][c] !== target) return;
      pixels[r][c] = replacement;
      floodFill(r + 1, c, target, replacement);
      floodFill(r - 1, c, target, replacement);
      floodFill(r, c + 1, target, replacement);
      floodFill(r, c - 1, target, replacement);
    }

    function paintAt(clientX, clientY) {
      const rect = canvas.getBoundingClientRect();
      const c = Math.floor(((clientX - rect.left) / rect.width) * gridN);
      const r = Math.floor(((clientY - rect.top) / rect.height) * gridN);
      if (r < 0 || r >= gridN || c < 0 || c >= gridN) return;

      if (activeTool === 'fill') {
        floodFill(r, c, pixels[r][c], activeColor);
      } else {
        const val = activeTool === 'erase' ? '' : activeColor;
        pixels[r][c] = val;
        if (mirrorMode) {
          pixels[r][gridN - 1 - c] = val;
        }
      }
      renderGrid();
      if (statusEl) statusEl.innerHTML = '<span>POS: (' + c + ', ' + r + ')</span><span>GRID: 16x16 SPRITE</span>';
    }

    const palEl = bodyEl.querySelector('#paint-palette');
    palette.forEach(function (hex, idx) {
      const sw = document.createElement('div');
      sw.className = 'color-swatch' + (idx === 3 ? ' active' : '');
      sw.style.background = hex;
      sw.addEventListener('click', function () {
        sfxClick();
        activeColor = hex;
        palEl.querySelectorAll('.color-swatch').forEach(function (el) { el.classList.remove('active'); });
        sw.classList.add('active');
      });
      palEl.appendChild(sw);
    });

    bodyEl.querySelector('#paint-custom-color').addEventListener('input', function (e) {
      activeColor = e.target.value;
    });

    bodyEl.querySelectorAll('[data-ptool]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        sfxClick();
        const t = btn.getAttribute('data-ptool');
        if (t === 'mirror') {
          mirrorMode = !mirrorMode;
          btn.classList.toggle('pressed', mirrorMode);
          return;
        }
        activeTool = t;
        bodyEl.querySelectorAll('[data-ptool]').forEach(function (b) {
          if (b.getAttribute('data-ptool') !== 'mirror') b.classList.remove('pressed');
        });
        btn.classList.add('pressed');
      });
    });

    function loadInvaderPreset() {
      const pattern = [
        '0000111111000000',
        '0011111111110000',
        '0111111111111000',
        '0110011110011000',
        '0111111111111000',
        '0001100001100000',
        '0011011110110000',
        '1100000000001100'
      ];
      for (let r = 0; r < gridN; r += 1) {
        for (let c = 0; c < gridN; c += 1) {
          pixels[r][c] = '';
        }
      }
      pattern.forEach(function (rowStr, rIdx) {
        rowStr.split('').forEach(function (ch, cIdx) {
          if (ch === '1') pixels[rIdx + 4][cIdx + 1] = activeColor;
        });
      });
      renderGrid();
    }

    bodyEl.querySelector('#paint-sprite-btn').addEventListener('click', function () {
      sfxSuccess();
      loadInvaderPreset();
    });

    bodyEl.querySelector('#paint-clear-btn').addEventListener('click', function () {
      sfxClick();
      for (let r = 0; r < gridN; r += 1) {
        for (let c = 0; c < gridN; c += 1) pixels[r][c] = '';
      }
      renderGrid();
    });

    function exportCleanSpriteDataURL() {
      const off = document.createElement('canvas');
      off.width = 256;
      off.height = 256;
      const octx = off.getContext('2d');
      octx.fillStyle = '#0c1017';
      octx.fillRect(0, 0, 256, 256);
      const scale = 256 / gridN;
      for (let r = 0; r < gridN; r += 1) {
        for (let c = 0; c < gridN; c += 1) {
          if (pixels[r][c]) {
            octx.fillStyle = pixels[r][c];
            octx.fillRect(c * scale, r * scale, scale, scale);
          }
        }
      }
      return off.toDataURL('image/png');
    }

    function applyImportedImageToGrid(imgEl, labelName) {
      const samp = document.createElement('canvas');
      samp.width = gridN;
      samp.height = gridN;
      const sctx = samp.getContext('2d');
      sctx.drawImage(imgEl, 0, 0, gridN, gridN);
      const data = sctx.getImageData(0, 0, gridN, gridN).data;
      for (let r = 0; r < gridN; r += 1) {
        for (let c = 0; c < gridN; c += 1) {
          const idx = (r * gridN + c) * 4;
          const a = data[idx + 3];
          if (a < 40) {
            pixels[r][c] = '';
          } else {
            const hex = '#' +
              data[idx].toString(16).padStart(2, '0') +
              data[idx + 1].toString(16).padStart(2, '0') +
              data[idx + 2].toString(16).padStart(2, '0');
            pixels[r][c] = hex;
          }
        }
      }
      renderGrid();
      if (statusEl) statusEl.innerHTML = '<span>IMPORTED: ' + (labelName || 'IMAGE') + '</span><span>16x16 QUANTIZED</span>';
    }

    state.paintLoadPixelsFn = function (matrix, sourceTitle) {
      for (let r = 0; r < gridN; r += 1) {
        for (let c = 0; c < gridN; c += 1) {
          pixels[r][c] = (matrix[r] && matrix[r][c]) ? matrix[r][c] : '';
        }
      }
      renderGrid();
      if (statusEl) statusEl.innerHTML = '<span>SYNCED: ' + (sourceTitle || 'VIEWER') + '</span><span>16x16 SPRITE</span>';
    };

    const paintFileIn = bodyEl.querySelector('#paint-file-input');
    bodyEl.querySelector('#paint-import-btn').addEventListener('click', function () {
      sfxClick();
      paintFileIn.click();
    });

    paintFileIn.addEventListener('change', function (e) {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function (ev) {
        const img = new Image();
        img.onload = function () {
          sfxSuccess();
          applyImportedImageToGrid(img, file.name.toUpperCase());
          showToast('Imported ' + file.name + ' into 16x16 Pixel Grid!');
        };
        img.src = ev.target.result;
      };
      reader.readAsDataURL(file);
      paintFileIn.value = '';
    });

    bodyEl.querySelector('#paint-to-viewer-btn').addEventListener('click', function () {
      sfxSuccess();
      const dataUrl = exportCleanSpriteDataURL();
      const newImgId = 'sprite-' + Date.now();
      const newTitle = 'SPRITE_' + (state.images.length + 1) + '.PNG';
      const copiedMatrix = pixels.map(function (row) { return row.slice(); });
      state.images.unshift({
        id: newImgId,
        name: newTitle,
        dataUrl: dataUrl,
        width: 256,
        height: 256,
        pixelMatrix: copiedMatrix
      });
      state.files.push({
        id: newImgId,
        name: newTitle,
        folder: 'Pictures',
        type: 'img',
        size: '4 KB',
        content: 'PIXEL ART SPRITE IMAGE :: ' + newTitle,
        dataUrl: dataUrl
      });
      saveStorage('chrono_files', state.files);
      state.currentImageId = newImgId;
      openApp('viewer');
      if (refreshImageViewerFn) refreshImageViewerFn();
      refreshExplorerView();
      showToast('Sent ' + newTitle + ' to RetroView Image Lab!');
    });

    bodyEl.querySelector('#paint-export-btn').addEventListener('click', function () {
      sfxSuccess();
      const url = exportCleanSpriteDataURL();
      const a = document.createElement('a');
      a.href = url;
      a.download = 'pixel-sprite.png';
      document.body.appendChild(a);
      a.click();
      a.remove();
      showToast('Exported crisp Pixel Art PNG!');
    });

    canvas.addEventListener('mousedown', function (e) {
      drawing = true;
      paintAt(e.clientX, e.clientY);
    });
    window.addEventListener('mousemove', function (e) {
      if (drawing) paintAt(e.clientX, e.clientY);
    });
    window.addEventListener('mouseup', function () {
      drawing = false;
    });

    if (state.pendingPaintPixels) {
      state.paintLoadPixelsFn(state.pendingPaintPixels, 'RETROVIEW');
      state.pendingPaintPixels = null;
    } else {
      loadInvaderPreset();
    }
  }

  let refreshImageViewerFn = null;

  function createBuiltInImages() {
    if (state.images.length > 0) return;

    function makeArt(name, id, drawCb) {
      const c = document.createElement('canvas');
      c.width = 256;
      c.height = 256;
      const x = c.getContext('2d');
      drawCb(x, 256, 256);
      return { id: id, name: name, dataUrl: c.toDataURL('image/png'), width: 256, height: 256 };
    }

    const outrun = makeArt('OUTRUN_SUN.PNG', 'img-outrun', function (x, w, h) {
      const grad = x.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#120428');
      grad.addColorStop(0.55, '#59116b');
      grad.addColorStop(1, '#ff007f');
      x.fillStyle = grad;
      x.fillRect(0, 0, w, h);

      const sunGrad = x.createLinearGradient(0, 45, 0, 175);
      sunGrad.addColorStop(0, '#ffee55');
      sunGrad.addColorStop(1, '#ff007f');
      x.fillStyle = sunGrad;
      x.beginPath();
      x.arc(w / 2, 118, 62, 0, Math.PI * 2);
      x.fill();

      x.fillStyle = '#190630';
      for (let y = 115; y < 180; y += 12) {
        x.fillRect(45, y, 166, 4);
      }

      x.fillStyle = '#090214';
      x.fillRect(0, 165, w, h - 165);
      x.strokeStyle = '#00f0ff';
      x.lineWidth = 2;
      for (let i = -6; i <= 6; i += 1) {
        x.beginPath();
        x.moveTo(w / 2 + i * 10, 165);
        x.lineTo(w / 2 + i * 48, h);
        x.stroke();
      }
      for (let y = 172; y < h; y += 16) {
        x.beginPath();
        x.moveTo(0, y);
        x.lineTo(w, y);
        x.stroke();
      }
    });

    const invader = makeArt('INVADER_89.PNG', 'img-invader', function (x, w, h) {
      x.fillStyle = '#070b14';
      x.fillRect(0, 0, w, h);
      const pat = [
        '0000111111000000',
        '0011111111110000',
        '0111111111111000',
        '0110011110011000',
        '0111111111111000',
        '0001100001100000',
        '0011011110110000',
        '1100000000001100'
      ];
      x.fillStyle = '#00ff9d';
      pat.forEach(function (row, r) {
        row.split('').forEach(function (ch, c) {
          if (ch === '1') x.fillRect((c + 1) * 15, (r + 4) * 16, 14, 14);
        });
      });
    });

    const cyber = makeArt('CRT_GRID.PNG', 'img-grid', function (x, w, h) {
      x.fillStyle = '#04140a';
      x.fillRect(0, 0, w, h);
      x.strokeStyle = '#00ff66';
      x.lineWidth = 2;
      for (let i = 16; i < w; i += 32) {
        x.strokeRect(i, i, w - i * 2, h - i * 2);
      }
      x.fillStyle = '#ffb000';
      x.font = '20px monospace';
      x.fillText('CHRONO-95', 74, 134);
    });

    state.images.push(outrun, invader, cyber);
    state.images.forEach(function (im) {
      if (!state.files.some(function (f) { return f.id === im.id; })) {
        state.files.push({
          id: im.id,
          name: im.name,
          folder: 'Pictures',
          type: 'img',
          size: '4 KB',
          content: 'RETRO BITMAP IMAGE :: ' + im.name,
          dataUrl: im.dataUrl
        });
      }
    });
  }

  function mountImageViewer(bodyEl, statusEl) {
    createBuiltInImages();

    let zoom = 100;
    let rotation = 0;
    let flipH = false;
    let filterMode = 'none';

    bodyEl.innerHTML =
      '<div class="viewer-layout">' +
        '<div style="display:flex;gap:5px;flex-wrap:wrap;align-items:center;">' +
          '<button type="button" class="retro-btn" id="iv-import-btn">📂 Import Image</button>' +
          '<input type="file" id="iv-file-input" accept="image/*" style="display:none;">' +
          '<button type="button" class="retro-btn" id="iv-export-btn">💾 Export PNG</button>' +
          '<button type="button" class="retro-btn" id="iv-to-paint-btn">🎨 Edit in Pixel Studio</button>' +
          '<button type="button" class="retro-btn" id="iv-wallpaper-btn">🖥️ Set Wallpaper</button>' +
        '</div>' +
        '<div style="display:flex;gap:5px;flex-wrap:wrap;align-items:center;">' +
          '<button type="button" class="retro-btn" id="iv-zoom-in">🔍+</button>' +
          '<button type="button" class="retro-btn" id="iv-zoom-out">🔍-</button>' +
          '<button type="button" class="retro-btn" id="iv-rotate">↻ 90°</button>' +
          '<button type="button" class="retro-btn" id="iv-flip">⇄ Flip</button>' +
          '<select id="iv-filter-select" class="retro-input" aria-label="Image Filter" style="margin-left:auto;">' +
            '<option value="none">Filter: Original</option>' +
            '<option value="pixelate">Filter: 16-Bit Pixelate</option>' +
            '<option value="synth">Filter: Synthwave Neon</option>' +
            '<option value="crtgreen">Filter: Phosphor Green</option>' +
            '<option value="invert">Filter: Negative Invert</option>' +
            '<option value="grayscale">Filter: Monochrome</option>' +
          '</select>' +
        '</div>' +
        '<div class="retro-dark-inset viewer-stage">' +
          '<canvas id="iv-canvas" width="256" height="256"></canvas>' +
        '</div>' +
        '<div class="retro-inset viewer-thumbs" id="iv-thumbs"></div>' +
      '</div>';

    const viewCanvas = bodyEl.querySelector('#iv-canvas');
    const vctx = viewCanvas.getContext('2d');
    const thumbsEl = bodyEl.querySelector('#iv-thumbs');
    const fileInput = bodyEl.querySelector('#iv-file-input');
    const filterSelect = bodyEl.querySelector('#iv-filter-select');

    function getCurrentImgObj() {
      return state.images.find(function (im) { return im.id === state.currentImageId; }) || state.images[0];
    }

    function renderActiveImage() {
      const current = getCurrentImgObj();
      if (!current) return;
      const img = new Image();
      img.onload = function () {
        const baseW = 256;
        const baseH = 256;
        const scaledW = Math.round((baseW * zoom) / 100);
        const scaledH = Math.round((baseH * zoom) / 100);
        viewCanvas.width = scaledW;
        viewCanvas.height = scaledH;

        vctx.save();
        vctx.clearRect(0, 0, scaledW, scaledH);
        vctx.translate(scaledW / 2, scaledH / 2);
        vctx.rotate((rotation * Math.PI) / 180);
        vctx.scale(flipH ? -1 : 1, 1);

        if (filterMode === 'grayscale') vctx.filter = 'grayscale(100%) contrast(120%)';
        else if (filterMode === 'invert') vctx.filter = 'invert(100%)';
        else if (filterMode === 'synth') vctx.filter = 'hue-rotate(270deg) saturate(180%) contrast(115%)';
        else if (filterMode === 'crtgreen') vctx.filter = 'sepia(100%) hue-rotate(70deg) saturate(260%)';
        else vctx.filter = 'none';

        if (filterMode === 'pixelate') {
          const temp = document.createElement('canvas');
          temp.width = 24;
          temp.height = 24;
          const tctx = temp.getContext('2d');
          tctx.drawImage(img, 0, 0, 24, 24);
          vctx.imageSmoothingEnabled = false;
          vctx.drawImage(temp, -scaledW / 2, -scaledH / 2, scaledW, scaledH);
        } else {
          vctx.imageSmoothingEnabled = false;
          vctx.drawImage(img, -scaledW / 2, -scaledH / 2, scaledW, scaledH);
        }
        vctx.restore();

        if (statusEl) {
          statusEl.innerHTML =
            '<span>FILE: ' + current.name + '</span>' +
            '<span>ZOOM: ' + zoom + '% | ROT: ' + rotation + '°</span>';
        }
      };
      img.src = current.dataUrl;
    }

    function renderThumbnails() {
      thumbsEl.innerHTML = '';
      state.images.forEach(function (im) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'retro-btn viewer-thumb-btn' + (im.id === state.currentImageId ? ' pressed' : '');
        btn.textContent = '🖼️ ' + im.name;
        btn.addEventListener('click', function () {
          sfxClick();
          state.currentImageId = im.id;
          renderThumbnails();
          renderActiveImage();
        });
        thumbsEl.appendChild(btn);
      });
    }

    refreshImageViewerFn = function () {
      renderThumbnails();
      renderActiveImage();
    };

    bodyEl.querySelector('#iv-import-btn').addEventListener('click', function () {
      sfxClick();
      fileInput.click();
    });

    fileInput.addEventListener('change', function (e) {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function (ev) {
        const dataUrl = ev.target.result;
        const newId = 'img-' + Date.now();
        const cleanName = file.name.toUpperCase();
        state.images.unshift({
          id: newId,
          name: cleanName,
          dataUrl: dataUrl,
          width: 256,
          height: 256
        });
        state.files.push({
          id: newId,
          name: cleanName,
          folder: 'Pictures',
          type: 'img',
          size: Math.max(1, Math.round(file.size / 1024)) + ' KB',
          content: 'IMPORTED IMAGE FILE :: ' + cleanName,
          dataUrl: dataUrl
        });
        saveStorage('chrono_files', state.files);
        state.currentImageId = newId;
        sfxSuccess();
        renderThumbnails();
        renderActiveImage();
        refreshExplorerView();
        showToast('Imported ' + cleanName + ' into RetroView & C:/Pictures!');
      };
      reader.readAsDataURL(file);
      fileInput.value = '';
    });

    bodyEl.querySelector('#iv-export-btn').addEventListener('click', function () {
      const current = getCurrentImgObj();
      if (!current) return;
      sfxSuccess();
      const url = viewCanvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = 'RETROVIEW_' + current.name.replace(/[^A-Z0-9._-]/gi, '_');
      document.body.appendChild(a);
      a.click();
      a.remove();
      showToast('Exported rendered PNG from RetroView!');
    });

    bodyEl.querySelector('#iv-to-paint-btn').addEventListener('click', function () {
      const current = getCurrentImgObj();
      if (!current) return;
      sfxSuccess();
      const samp = document.createElement('canvas');
      samp.width = 16;
      samp.height = 16;
      const sctx = samp.getContext('2d');
      sctx.drawImage(viewCanvas, 0, 0, 16, 16);
      const data = sctx.getImageData(0, 0, 16, 16).data;
      const matrix = Array.from({ length: 16 }, function () { return Array(16).fill(''); });
      for (let r = 0; r < 16; r += 1) {
        for (let c = 0; c < 16; c += 1) {
          const idx = (r * 16 + c) * 4;
          if (data[idx + 3] >= 40) {
            matrix[r][c] = '#' +
              data[idx].toString(16).padStart(2, '0') +
              data[idx + 1].toString(16).padStart(2, '0') +
              data[idx + 2].toString(16).padStart(2, '0');
          }
        }
      }
      state.pendingPaintPixels = matrix;
      openApp('paint');
      if (state.paintLoadPixelsFn) {
        state.paintLoadPixelsFn(matrix, current.name);
        state.pendingPaintPixels = null;
      }
      showToast('Loaded ' + current.name + ' into Pixel Art Studio!');
    });

    bodyEl.querySelector('#iv-wallpaper-btn').addEventListener('click', function () {
      const current = getCurrentImgObj();
      if (!current) return;
      sfxSuccess();
      const crtWrap = document.getElementById('crt-wrapper');
      if (crtWrap) {
        crtWrap.style.backgroundImage = 'url(' + viewCanvas.toDataURL('image/png') + ')';
        crtWrap.style.backgroundSize = 'cover';
        crtWrap.style.backgroundPosition = 'center';
      }
      showToast('Set ' + current.name + ' as custom desktop wallpaper!');
    });

    bodyEl.querySelector('#iv-zoom-in').addEventListener('click', function () {
      sfxClick();
      zoom = Math.min(250, zoom + 25);
      renderActiveImage();
    });

    bodyEl.querySelector('#iv-zoom-out').addEventListener('click', function () {
      sfxClick();
      zoom = Math.max(50, zoom - 25);
      renderActiveImage();
    });

    bodyEl.querySelector('#iv-rotate').addEventListener('click', function () {
      sfxClick();
      rotation = (rotation + 90) % 360;
      renderActiveImage();
    });

    bodyEl.querySelector('#iv-flip').addEventListener('click', function () {
      sfxClick();
      flipH = !flipH;
      renderActiveImage();
    });

    filterSelect.addEventListener('change', function () {
      sfxClick();
      filterMode = filterSelect.value;
      renderActiveImage();
    });

    renderThumbnails();
    renderActiveImage();
  }

  function mountSynth(bodyEl, statusEl) {
    const trackNames = ['LEAD', 'ARP', 'BASS', 'PERC'];
    const trackFreqs = [659.25, 523.25, 261.63, 110.0];
    const trackTypes = ['square', 'triangle', 'sawtooth', 'square'];
    const steps = Array.from({ length: 4 }, function (_, r) {
      return Array.from({ length: 16 }, function (__, c) {
        return (r === 0 && c % 4 === 0) || (r === 2 && c % 2 === 0) || (r === 3 && c % 4 === 2);
      });
    });

    let playing = false;
    let currentStep = 0;
    let bpm = 128;
    let seqTimer = null;

    bodyEl.innerHTML =
      '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">' +
        '<button type="button" class="retro-btn" id="synth-play-btn">▶ PLAY LOOP</button>' +
        '<button type="button" class="retro-btn" id="synth-preset-btn">🎵 Demo Groove</button>' +
        '<button type="button" class="retro-btn" id="synth-clear-btn">Clear</button>' +
        '<label style="display:flex;align-items:center;gap:6px;margin-left:auto;">' +
          '<span>BPM: <strong id="synth-bpm-val">128</strong></span>' +
          '<input type="range" id="synth-bpm" min="70" max="180" value="128">' +
        '</label>' +
      '</div>' +
      '<div class="retro-inset" style="padding:8px;overflow-x:auto;">' +
        '<div class="sequencer-grid" id="synth-grid"></div>' +
      '</div>' +
      '<div style="font-size:15px;color:var(--text-muted);">LIVE 8-BIT KEYBOARD (CLICK KEYS TO JAM):</div>' +
      '<div class="piano-keys" id="synth-piano"></div>';

    const gridEl = bodyEl.querySelector('#synth-grid');
    const pianoEl = bodyEl.querySelector('#synth-piano');
    const playBtn = bodyEl.querySelector('#synth-play-btn');

    function renderSequencer() {
      gridEl.innerHTML = '';
      for (let r = 0; r < 4; r += 1) {
        const label = document.createElement('div');
        label.className = 'pixel-font';
        label.style.fontSize = '10px';
        label.textContent = trackNames[r];
        gridEl.appendChild(label);

        for (let c = 0; c < 16; c += 1) {
          const cell = document.createElement('button');
          cell.type = 'button';
          cell.className = 'seq-step' + (steps[r][c] ? ' on' : '') + (playing && currentStep === c ? ' playing' : '');
          cell.addEventListener('click', function () {
            steps[r][c] = !steps[r][c];
            if (steps[r][c]) playTone(trackFreqs[r], 0.08, trackTypes[r], 0);
            renderSequencer();
          });
          gridEl.appendChild(cell);
        }
      }
    }

    function tickSequencer() {
      const pentatonic = [1, 1.125, 1.25, 1.5, 1.667, 2];
      for (let r = 0; r < 4; r += 1) {
        if (steps[r][currentStep]) {
          const mult = pentatonic[(currentStep + r) % pentatonic.length];
          playTone(trackFreqs[r] * mult, 0.11, trackTypes[r], 0);
        }
      }
      renderSequencer();
      if (statusEl) statusEl.innerHTML = '<span>STEP: ' + (currentStep + 1) + '/16</span><span>WEB AUDIO SYNTH</span>';
      currentStep = (currentStep + 1) % 16;
    }

    function startSequencer() {
      if (seqTimer) clearInterval(seqTimer);
      const intervalMs = Math.round((60 / bpm / 4) * 1000);
      seqTimer = setInterval(tickSequencer, intervalMs);
    }

    playBtn.addEventListener('click', function () {
      playing = !playing;
      if (playing) {
        playBtn.textContent = '⏹ STOP LOOP';
        startSequencer();
      } else {
        playBtn.textContent = '▶ PLAY LOOP';
        if (seqTimer) clearInterval(seqTimer);
        renderSequencer();
      }
    });

    bodyEl.querySelector('#synth-\ preset-btn, [id="synth-preset-btn"]').addEventListener('click', function () {
      sfxSuccess();
      for (let r = 0; r < 4; r += 1) {
        for (let c = 0; c < 16; c += 1) {
          steps[r][c] = ((r + c) % 3 === 0) || (r === 2 && c % 2 === 0);
        }
      }
      renderSequencer();
    });

    bodyEl.querySelector('#synth-clear-btn').addEventListener('click', function () {
      sfxClick();
      for (let r = 0; r < 4; r += 1) {
        for (let c = 0; c < 16; c += 1) steps[r][c] = false;
      }
      renderSequencer();
    });

    bodyEl.querySelector('#synth-bpm').addEventListener('input', function (e) {
      bpm = Number(e.target.value) || 128;
      bodyEl.querySelector('#synth-bpm-val').textContent = String(bpm);
      if (playing) startSequencer();
    });

    const notes = [
      { n: 'C4', f: 261.63 }, { n: 'D4', f: 293.66 }, { n: 'E4', f: 329.63 },
      { n: 'F4', f: 349.23 }, { n: 'G4', f: 392.00 }, { n: 'A4', f: 440.00 },
      { n: 'B4', f: 493.88 }, { n: 'C5', f: 523.25 }, { n: 'D5', f: 587.33 },
      { n: 'E5', f: 659.25 }
    ];

    notes.forEach(function (note) {
      const k = document.createElement('button');
      k.type = 'button';
      k.className = 'retro-btn piano-key';
      k.textContent = note.n;
      k.addEventListener('mousedown', function () {
        playTone(note.f, 0.22, 'square', 0);
      });
      pianoEl.appendChild(k);
    });

    state.windows.synth.cleanup = function () {
      if (seqTimer) clearInterval(seqTimer);
    };

    renderSequencer();
  }

  function mountTerminal(bodyEl, statusEl) {
    bodyEl.innerHTML =
      '<div class="retro-dark-inset terminal-output" id="term-out"></div>' +
      '<form id="term-form" style="display:flex;gap:6px;align-items:center;">' +
        '<span style="font-weight:bold;">C:/&gt;</span>' +
        '<input type="text" id="term-in" class="retro-input" style="flex:1;" placeholder="Type help, neofetch, ls, matrix, calc 6*7, open arcade..." autocomplete="off">' +
        '<button type="button" class="retro-btn" id="term-run-btn">RUN</button>' +
      '</form>';

    const outEl = bodyEl.querySelector('#term-out');
    const inEl = bodyEl.querySelector('#term-in');
    const formEl = bodyEl.querySelector('#term-form');

    function printLine(txt) {
      outEl.textContent += txt + '\n';
      outEl.scrollTop = outEl.scrollHeight;
    }

    printLine('CHRONO-DOS v4.20 [CRT SHELL INTERPRETER]');
    printLine('Type "help" for available commands or "neofetch" for system specs.\n');

    function execCommand(raw) {
      const cmdLine = raw.trim();
      if (!cmdLine) return;
      printLine('C:/> ' + cmdLine);
      const parts = cmdLine.split(/\s+/);
      const cmd = parts[0].toLowerCase();
      const arg = parts.slice(1).join(' ');

      if (cmd === 'help') {
        printLine(
          'AVAILABLE COMMANDS:\n' +
          '  help           Show this command reference\n' +
          '  neofetch       Display ASCII retro hardware specifications\n' +
          '  ls / dir       List files on virtual C:/ drive\n' +
          '  cat <name>     Print contents of a file (e.g. cat README.TXT)\n' +
          '  open <app>     Launch an OS app (notepad, arcade, paint, synth, calc)\n' +
          '  theme <name>   Switch theme (win95, synthwave, amber, matrix, vapor)\n' +
          '  calc <expr>    Evaluate math expression\n' +
          '  matrix         Generate phosphor digital rain dump\n' +
          '  date           Display current system timestamp\n' +
          '  clear          Clear terminal buffer'
        );
      } else if (cmd === 'clear' || cmd === 'cls') {
        outEl.textContent = '';
      } else if (cmd === 'neofetch') {
        printLine(
          '   .-------------.     OPERATOR@CHRONO-OS-95\n' +
          '  |  .---------.  |    ---------------------\n' +
          '  |  | >_      |  |    OS: CHRONO-OS 95 Pixel CRT\n' +
          '  |  |         |  |    CPU: Intel 486DX2 @ 66MHz\n' +
          '  |  +---------+  |    DISPLAY: Sony Trinitron CRT\n' +
          '  +------===------+    AUDIO: WebAudio 8-Bit FM Synth\n' +
          '   /:::::::::::::\\\     THEME: ' + state.theme.toUpperCase() + '\n                    AUTHOR: Gaviru Fernando'
        );
      } else if (cmd === 'ls' || cmd === 'dir') {
        state.files.forEach(function (f) {
          printLine('  ' + f.name.padEnd(16, ' ') + f.folder.padEnd(12, ' ') + f.size);
        });
      } else if (cmd === 'cat') {
        const target = state.files.find(function (f) {
          return f.name.toLowerCase() === arg.toLowerCase();
        });
        if (target) printLine(target.content);
        else printLine('File not found: ' + arg);
      } else if (cmd === 'open') {
        const map = { calc: 'calculator' };
        const targetId = map[arg.toLowerCase()] || arg.toLowerCase();
        openApp(targetId);
        printLine('Launched application: ' + targetId);
      } else if (cmd === 'theme') {
        const valid = ['win95', 'synthwave', 'amber', 'matrix', 'vapor'];
        if (valid.indexOf(arg.toLowerCase()) !== -1) {
          applyTheme(arg.toLowerCase());
          printLine('Theme switched to ' + arg.toUpperCase());
        } else {
          printLine('Valid themes: ' + valid.join(', '));
        }
      } else if (cmd === 'calc') {
        try {
          const safe = arg.replace(/[^0-9+\-*/().%]/g, '');
          const res = Function('"use strict"; return (' + safe + ')')();
          printLine('RESULT = ' + res);
        } catch (e) {
          printLine('Syntax error in math expression.');
        }
      } else if (cmd === 'matrix') {
        for (let i = 0; i < 6; i += 1) {
          let row = '';
          for (let j = 0; j < 44; j += 1) {
            row += String.fromCharCode(0x30A0 + Math.floor(Math.random() * 64));
          }
          printLine(row);
        }
      } else if (cmd === 'date') {
        printLine(new Date().toString());
      } else {
        printLine('Unknown command: "' + cmd + '". Type "help" for a list of commands.');
      }
      if (statusEl) statusEl.innerHTML = '<span>LAST CMD: ' + cmd.toUpperCase() + '</span><span>SHELL READY</span>';
    }

    formEl.addEventListener('submit', function (e) {
      e.preventDefault();
      sfxClick();
      execCommand(inEl.value);
      inEl.value = '';
    });

    bodyEl.querySelector('#term-run-btn').addEventListener('click', function () {
      sfxClick();
      execCommand(inEl.value);
      inEl.value = '';
    });
  }

  let refreshExplorerView = function () {};

  function mountExplorer(bodyEl, statusEl) {
    bodyEl.innerHTML =
      '<div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;">' +
        '<button type="button" class="retro-btn" data-folder-btn="All">📁 All</button>' +
        '<button type="button" class="retro-btn" data-folder-btn="Documents">📄 Documents</button>' +
        '<button type="button" class="retro-btn" data-folder-btn="System">⚙️ System</button>' +
        '<button type="button" class="retro-btn" data-folder-btn="Games">🕹️ Games</button>' +
        '<button type="button" class="retro-btn" data-folder-btn="Pictures">🖼️ Pictures</button>' +
        '<button type="button" class="retro-btn" id="exp-new-file-btn" style="margin-left:auto;">+ New File</button>' +
      '</div>' +
      '<div class="retro-inset explorer-grid" id="explorer-items"></div>' +
      '<div class="retro-inset" id="explorer-preview" style="padding:8px;min-height:70px;font-size:16px;white-space:pre-wrap;">Click any file to preview or open in RetroPad Editor.</div>';

    const itemsEl = bodyEl.querySelector('#explorer-items');
    const previewEl = bodyEl.querySelector('#explorer-preview');

    function renderFiles() {
      itemsEl.innerHTML = '';
      const filtered = state.files.filter(function (f) {
        return state.explorerFolder === 'All' || f.folder === state.explorerFolder;
      });

      filtered.forEach(function (f) {
        const card = document.createElement('div');
        card.className = 'file-item';
        const icon = f.type === 'sys' ? '⚙️' : (f.type === 'img' ? '🖼️' : '📄');
        card.innerHTML =
          '<div style="font-size:28px;">' + icon + '</div>' +
          '<div style="font-weight:bold;margin-top:4px;">' + f.name + '</div>' +
          '<div style="font-size:14px;color:var(--text-muted);">' + f.size + '</div>';
        card.addEventListener('click', function () {
          sfxClick();
          previewEl.innerHTML = '';
          const header = document.createElement('div');
          header.style.display = 'flex';
          header.style.justifyContent = 'space-between';
          header.style.marginBottom = '4px';
          header.innerHTML = '<strong>C:/' + f.folder.toUpperCase() + '/' + f.name + '</strong>';

          const openBtn = document.createElement('button');
          openBtn.type = 'button';
          openBtn.className = 'retro-btn';
          openBtn.textContent = f.type === 'img' ? 'Open in RetroView' : 'Edit in RetroPad';
          openBtn.addEventListener('click', function () {
            if (f.type === 'img') {
              state.currentImageId = f.id;
              openApp('viewer');
              if (refreshImageViewerFn) refreshImageViewerFn();
            } else {
              state.currentFileId = f.id;
              if (state.windows.notepad) {
                closeApp('notepad');
              }
              openApp('notepad');
            }
          });
          header.appendChild(openBtn);
          previewEl.appendChild(header);

          const body = document.createElement('div');
          body.textContent = f.content.slice(0, 220);
          previewEl.appendChild(body);
        });
        itemsEl.appendChild(card);
      });

      if (statusEl) {
        statusEl.innerHTML = '<span>FOLDER: C:/' + state.explorerFolder.toUpperCase() + '</span><span>' + filtered.length + ' OBJECTS</span>';
      }
    }

    refreshExplorerView = renderFiles;

    bodyEl.querySelectorAll('[data-folder-btn]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        sfxClick();
        state.explorerFolder = btn.getAttribute('data-folder-btn');
        renderFiles();
      });
    });

    bodyEl.querySelector('#exp-new-file-btn').addEventListener('click', function () {
      sfxClick();
      const newFile = {
        id: 'file-' + Date.now(),
        name: 'DATA_' + (state.files.length + 1) + '.TXT',
        folder: state.explorerFolder === 'All' ? 'Documents' : state.explorerFolder,
        type: 'txt',
        size: '1 KB',
        content: 'Created from File Manager on ' + new Date().toLocaleTimeString()
      };
      state.files.push(newFile);
      saveStorage('chrono_files', state.files);
      renderFiles();
      showToast('Created ' + newFile.name);
    });

    renderFiles();
  }

  function mountTasks(bodyEl, statusEl) {
    bodyEl.innerHTML =
      '<div class="retro-dark-inset" style="padding:10px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">' +
        '<div>' +
          '<div style="font-size:14px;color:var(--accent-secondary);">POMODORO FOCUS CLOCK</div>' +
          '<div id="pomo-clock" class="pixel-font" style="font-size:22px;margin-top:4px;">25:00</div>' +
        '</div>' +
        '<div style="display:flex;gap:4px;flex-wrap:wrap;">' +
          '<button type="button" class="retro-btn" id="pomo-toggle-btn">▶ START</button>' +
          '<button type="button" class="retro-btn" data-pomo-min="25">25m</button>' +
          '<button type="button" class="retro-btn" data-pomo-min="5">5m Break</button>' +
        '</div>' +
      '</div>' +
      '<form id="todo-form" style="display:flex;gap:6px;">' +
        '<input type="text" id="todo-input" class="retro-input" style="flex:1;" placeholder="Add new mission task...">' +
        '<select id="todo-prio" class="retro-input"><option value="HIGH">HIGH</option><option value="MED">MED</option><option value="LOW">LOW</option></select>' +
        '<button type="submit" class="retro-btn">+ ADD</button>' +
      '</form>' +
      '<div class="retro-inset" id="todo-list" style="flex:1;overflow-y:auto;padding:8px;display:flex;flex-direction:column;gap:6px;"></div>';

    const clockEl = bodyEl.querySelector('#pomo-clock');
    const toggleBtn = bodyEl.querySelector('#pomo-toggle-btn');
    const listEl = bodyEl.querySelector('#todo-list');
    let pomoInterval = null;

    function formatTime(sec) {
      const m = String(Math.floor(sec / 60)).padStart(2, '0');
      const s = String(sec % 60).padStart(2, '0');
      return m + ':' + s;
    }

    function renderTodos() {
      listEl.innerHTML = '';
      state.todos.forEach(function (item) {
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.alignItems = 'center';
        row.style.justifyContent = 'space-between';
        row.style.gap = '8px';
        row.style.padding = '4px 6px';
        row.style.borderBottom = '1px dashed var(--border-dark)';

        const left = document.createElement('label');
        left.style.display = 'flex';
        left.style.alignItems = 'center';
        left.style.gap = '8px';
        left.style.cursor = 'pointer';
        left.style.flex = '1';

        const chk = document.createElement('input');
        chk.type = 'checkbox';
        chk.checked = item.done;
        chk.addEventListener('change', function () {
          sfxClick();
          item.done = chk.checked;
          saveStorage('chrono_todos', state.todos);
          renderTodos();
        });

        const txt = document.createElement('span');
        txt.textContent = '[' + item.priority + '] ' + item.text;
        if (item.done) txt.style.textDecoration = 'line-through';

        left.appendChild(chk);
        left.appendChild(txt);

        const delBtn = document.createElement('button');
        delBtn.type = 'button';
        delBtn.className = 'retro-btn win-ctrl-btn';
        delBtn.textContent = 'X';
        delBtn.addEventListener('click', function () {
          sfxClick();
          state.todos = state.todos.filter(function (t) { return t.id !== item.id; });
          saveStorage('chrono_todos', state.todos);
          renderTodos();
        });

        row.appendChild(left);
        row.appendChild(delBtn);
        listEl.appendChild(row);
      });

      const doneCount = state.todos.filter(function (t) { return t.done; }).length;
      if (statusEl) {
        statusEl.innerHTML = '<span>COMPLETED: ' + doneCount + '/' + state.todos.length + '</span><span>SESSIONS: ' + state.pomoSessions + '</span>';
      }
    }

    toggleBtn.addEventListener('click', function () {
      sfxClick();
      state.pomoRunning = !state.pomoRunning;
      toggleBtn.textContent = state.pomoRunning ? '⏸ PAUSE' : '▶ START';
    });

    bodyEl.querySelectorAll('[data-pomo-min]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        sfxClick();
        const mins = Number(btn.getAttribute('data-pomo-min')) || 25;
        state.pomoSeconds = mins * 60;
        state.pomoRunning = false;
        toggleBtn.textContent = '▶ START';
        clockEl.textContent = formatTime(state.pomoSeconds);
      });
    });

    pomoInterval = setInterval(function () {
      if (!state.pomoRunning) return;
      if (state.pomoSeconds > 0) {
        state.pomoSeconds -= 1;
        clockEl.textContent = formatTime(state.pomoSeconds);
      } else {
        state.pomoRunning = false;
        state.pomoSessions += 1;
        sfxSuccess();
        showToast('Pomodoro Focus Session Complete!');
        state.pomoSeconds = 25 * 60;
        clockEl.textContent = formatTime(state.pomoSeconds);
        toggleBtn.textContent = '▶ START';
        renderTodos();
      }
    }, 1000);

    bodyEl.querySelector('#todo-form').addEventListener('submit', function (e) {
      e.preventDefault();
      const input = bodyEl.querySelector('#todo-input');
      const prio = bodyEl.querySelector('#todo-prio');
      if (!input.value.trim()) return;
      sfxClick();
      state.todos.unshift({
        id: 'td-' + Date.now(),
        text: input.value.trim(),
        priority: prio.value,
        done: false
      });
      input.value = '';
      saveStorage('chrono_todos', state.todos);
      renderTodos();
    });

    state.windows.tasks.cleanup = function () {
      if (pomoInterval) clearInterval(pomoInterval);
    };

    clockEl.textContent = formatTime(state.pomoSeconds);
    renderTodos();
  }

  let refreshSysMonProcesses = function () {};

  function mountSysMon(bodyEl, statusEl) {
    bodyEl.innerHTML =
      '<div style="display:flex;justify-content:space-between;align-items:center;">' +
        '<span>REALTIME CRT TELEMETRY</span>' +
        '<button type="button" class="retro-btn" id="sys-turbo-btn">⚡ TURBO 66MHz: OFF</button>' +
      '</div>' +
      '<div class="retro-dark-inset" style="padding:6px;">' +
        '<canvas id="sysmon-canvas" width="460" height="140" style="width:100%;height:140px;"></canvas>' +
      '</div>' +
      '<div style="font-weight:bold;">ACTIVE WINDOW PROCESSES:</div>' +
      '<div class="retro-inset" id="sysmon-procs" style="flex:1;overflow-y:auto;padding:6px;"></div>';

    const canvas = bodyEl.querySelector('#sysmon-canvas');
    const ctx = canvas.getContext('2d');
    const procsEl = bodyEl.querySelector('#sysmon-procs');
    const turboBtn = bodyEl.querySelector('#sys-turbo-btn');
    const cpuHistory = Array(46).fill(24);
    const ramHistory = Array(46).fill(42);

    function renderProcs() {
      if (!procsEl) return;
      procsEl.innerHTML = '';
      const ids = Object.keys(state.windows);
      ids.forEach(function (id) {
        const w = state.windows[id];
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.justifyContent = 'space-between';
        row.style.alignItems = 'center';
        row.style.padding = '3px 4px';
        row.style.borderBottom = '1px solid var(--border-mid)';
        row.innerHTML = '<span>' + w.meta.icon + ' ' + w.meta.title + '</span>';

        const killBtn = document.createElement('button');
        killBtn.type = 'button';
        killBtn.className = 'retro-btn';
        killBtn.style.padding = '2px 6px';
        killBtn.textContent = 'End Task';
        killBtn.addEventListener('click', function () {
          closeApp(id);
        });
        row.appendChild(killBtn);
        procsEl.appendChild(row);
      });
    }

    refreshSysMonProcesses = renderProcs;

    turboBtn.addEventListener('click', function () {
      sfxClick();
      state.overclock = !state.overclock;
      turboBtn.textContent = state.overclock ? '⚡ TURBO 133MHz: ON' : '⚡ TURBO 66MHz: OFF';
      showToast(state.overclock ? 'CPU Turbo Overclock Engaged!' : 'CPU returned to 66MHz standard clock.');
    });

    const timer = setInterval(function () {
      const baseCpu = 18 + Object.keys(state.windows).length * 7 + (state.overclock ? 25 : 0);
      const nextCpu = Math.min(99, Math.max(8, Math.round(baseCpu + (Math.random() * 18 - 9))));
      const nextRam = Math.min(95, 32 + Object.keys(state.windows).length * 6);
      cpuHistory.push(nextCpu);
      cpuHistory.shift();
      ramHistory.push(nextRam);
      ramHistory.shift();

      ctx.fillStyle = '#040a06';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      for (let y = 20; y < canvas.height; y += 30) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      ctx.strokeStyle = '#00ff9d';
      ctx.lineWidth = 2;
      ctx.beginPath();
      cpuHistory.forEach(function (val, i) {
        const x = (i / (cpuHistory.length - 1)) * canvas.width;
        const y = canvas.height - (val / 100) * (canvas.height - 20) - 10;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      ctx.strokeStyle = '#ff007f';
      ctx.beginPath();
      ramHistory.forEach(function (val, i) {
        const x = (i / (ramHistory.length - 1)) * canvas.width;
        const y = canvas.height - (val / 100) * (canvas.height - 20) - 10;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      ctx.fillStyle = '#00ff9d';
      ctx.font = '15px "VT323", monospace';
      ctx.fillText('CPU: ' + nextCpu + '%', 10, 18);
      ctx.fillStyle = '#ff007f';
      ctx.fillText('RAM: ' + nextRam + '%', 95, 18);

      if (statusEl) {
        statusEl.innerHTML = '<span>TASKS: ' + Object.keys(state.windows).length + '</span><span>CPU: ' + nextCpu + '%</span>';
      }
    }, 500);

    state.windows.sysmon.cleanup = function () {
      clearInterval(timer);
    };

    renderProcs();
  }

  function mountSettings(bodyEl, statusEl) {
    bodyEl.innerHTML =
      '<div style="display:flex;flex-direction:column;gap:10px;">' +
        '<div><strong>1. COLOR PHOSPHOR &amp; OS PALETTE:</strong></div>' +
        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(135px,1fr));gap:6px;">' +
          '<button type="button" class="retro-btn" data-theme-pick="win95">Win95 Classic Teal</button>' +
          '<button type="button" class="retro-btn" data-theme-pick="synthwave">Synthwave Outrun</button>' +
          '<button type="button" class="retro-btn" data-theme-pick="amber">1981 Amber CRT</button>' +
          '<button type="button" class="retro-btn" data-theme-pick="matrix">VT100 Matrix Green</button>' +
          '<button type="button" class="retro-btn" data-theme-pick="vapor">Vaporwave Sunset</button>' +
        '</div>' +
        '<div><strong>2. CRT MONITOR HARDWARE EFFECTS:</strong></div>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap;">' +
          '<button type="button" class="retro-btn" id="set-scanline-btn">Toggle Scanlines</button>' +
          '<button type="button" class="retro-btn" id="set-curve-btn">Toggle CRT Bezel</button>' +
          '<button type="button" class="retro-btn" id="set-glow-btn">Toggle Phosphor Glow</button>' +
        '</div>' +
        '<div><strong>3. ANIMATED DESKTOP WALLPAPER:</strong></div>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap;">' +
          '<button type="button" class="retro-btn" data-wp-pick="grid">Synth Grid Horizon</button>' +
          '<button type="button" class="retro-btn" data-wp-pick="stars">Deep Starfield</button>' +
          '<button type="button" class="retro-btn" data-wp-pick="minimal">Clean Solid</button>' +
        '</div>' +
        '<div><strong>4. AUDIO &amp; STORAGE RESET:</strong></div>' +
        '<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">' +
          '<label>SFX Vol: <input type="range" id="set-vol-slider" min="0" max="100" value="' + Math.round(state.volume * 100) + '"></label>' +
          '<button type="button" class="retro-btn" id="set-reset-btn">Reset Saved Data</button>' +
        '</div>' +
      '</div>';

    bodyEl.querySelectorAll('[data-theme-pick]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        sfxClick();
        const t = btn.getAttribute('data-theme-pick');
        applyTheme(t);
        if (statusEl) statusEl.innerHTML = '<span>THEME: ' + t.toUpperCase() + '</span><span>SAVED</span>';
        showToast('Applied ' + t.toUpperCase() + ' color palette.');
      });
    });

    bodyEl.querySelector('#set-scanline-btn').addEventListener('click', function () {
      sfxClick();
      state.crtScanlines = !state.crtScanlines;
      updateCRTStyles();
    });

    bodyEl.querySelector('#set-curve-btn').addEventListener('click', function () {
      sfxClick();
      state.crtCurved = !state.crtCurved;
      updateCRTStyles();
    });

    bodyEl.querySelector('#set-glow-btn').addEventListener('click', function () {
      sfxClick();
      state.textGlow = !state.textGlow;
      updateCRTStyles();
    });

    bodyEl.querySelectorAll('[data-wp-pick]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        sfxClick();
        state.wallpaperMode = btn.getAttribute('data-wp-pick');
        saveStorage('chrono_wallpaper', state.wallpaperMode);
        showToast('Wallpaper mode set to ' + state.wallpaperMode.toUpperCase());
      });
    });

    bodyEl.querySelector('#set-vol-slider').addEventListener('input', function (e) {
      state.volume = (Number(e.target.value) || 0) / 100;
      playTone(520, 0.04, 'square', 0);
    });

    bodyEl.querySelector('#set-reset-btn').addEventListener('click', function () {
      sfxError();
      try {
        localStorage.clear();
      } catch (e) {}
      state.files = defaultFiles.slice();
      state.todos = defaultTodos.slice();
      applyTheme('synthwave');
      showToast('System storage restored to factory defaults.');
    });
  }

  function startWallpaperLoop() {
    const canvas = document.getElementById('wallpaper-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let offset = 0;
    const stars = Array.from({ length: 70 }, function () {
      return { x: Math.random(), y: Math.random(), s: 1 + Math.random() * 2, v: 0.0006 + Math.random() * 0.0018 };
    });

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (state.wallpaperMode === 'grid') {
        const horizon = canvas.height * 0.62;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
        ctx.lineWidth = 1;

        ctx.beginPath();
        ctx.arc(canvas.width * 0.5, horizon, 70, Math.PI, 0, false);
        ctx.fillStyle = 'rgba(255, 180, 0, 0.16)';
        ctx.fill();

        for (let i = -12; i <= 12; i += 1) {
          ctx.beginPath();
          ctx.moveTo(canvas.width / 2 + i * 25, horizon);
          ctx.lineTo(canvas.width / 2 + i * 150, canvas.height);
          ctx.stroke();
        }

        offset = (offset + 0.45) % 24;
        for (let y = horizon + offset; y < canvas.height; y += 24) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(canvas.width, y);
          ctx.stroke();
        }
      } else if (state.wallpaperMode === 'stars') {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
        stars.forEach(function (st) {
          st.x = (st.x + st.v) % 1;
          ctx.fillRect(st.x * canvas.width, st.y * canvas.height, st.s, st.s);
        });
      }
      requestAnimationFrame(draw);
    }
    draw();
  }

  function formatDuration(totalSec) {
    const hrs = String(Math.floor(totalSec / 3600)).padStart(2, '0');
    const mins = String(Math.floor((totalSec % 3600) / 60)).padStart(2, '0');
    const secs = String(totalSec % 60).padStart(2, '0');
    return hrs + ':' + mins + ':' + secs;
  }

  function updateClock() {
    const now = new Date();
    const clockEl = document.getElementById('tray-clock');
    if (clockEl) {
      clockEl.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: !state.use24Hour });
    }
    const hudClock = document.getElementById('hud-digital-clock');
    if (hudClock) {
      hudClock.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: !state.use24Hour });
    }
    const hudDate = document.getElementById('hud-date-text');
    if (hudDate) {
      hudDate.textContent = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: '2-digit', year: 'numeric' }).toUpperCase();
    }
    const hudUptime = document.getElementById('hud-uptime');
    if (hudUptime) {
      const upSec = Math.max(0, Math.floor((Date.now() - state.bootTimestamp) / 1000));
      hudUptime.textContent = formatDuration(upSec);
    }
    const hudUtc = document.getElementById('hud-utc-time');
    if (hudUtc) {
      const uh = String(now.getUTCHours()).padStart(2, '0');
      const um = String(now.getUTCMinutes()).padStart(2, '0');
      hudUtc.textContent = uh + ':' + um;
    }
  }

  function initOS() {
    createBuiltInImages();
    applyTheme(state.theme);
    updateCRTStyles();
    renderDesktopIcons();
    startWallpaperLoop();
    updateClock();
    setInterval(updateClock, 1000);

    const fmtBtn = document.getElementById('hud-fmt-btn');
    if (fmtBtn) {
      fmtBtn.addEventListener('click', function () {
        sfxClick();
        state.use24Hour = !state.use24Hour;
        fmtBtn.textContent = state.use24Hour ? '12H' : '24H';
        updateClock();
      });
    }

    const swDisplay = document.getElementById('hud-sw-display');
    const swToggle = document.getElementById('hud-sw-toggle');
    const swReset = document.getElementById('hud-sw-reset');
    let swTimer = null;

    function renderStopwatch() {
      if (!swDisplay) return;
      const totalTenths = Math.floor(state.swElapsedMs / 100);
      const mins = String(Math.floor(totalTenths / 600)).padStart(2, '0');
      const secs = String(Math.floor((totalTenths % 600) / 10)).padStart(2, '0');
      const tenths = totalTenths % 10;
      swDisplay.textContent = 'SW ' + mins + ':' + secs + '.' + tenths;
    }

    if (swToggle) {
      swToggle.addEventListener('click', function () {
        sfxClick();
        state.swRunning = !state.swRunning;
        swToggle.textContent = state.swRunning ? 'PAUSE' : 'START';
        if (state.swRunning) {
          let lastTick = Date.now();
          swTimer = setInterval(function () {
            const nowTick = Date.now();
            state.swElapsedMs += (nowTick - lastTick);
            lastTick = nowTick;
            renderStopwatch();
          }, 100);
        } else if (swTimer) {
          clearInterval(swTimer);
        }
      });
    }

    if (swReset) {
      swReset.addEventListener('click', function () {
        sfxClick();
        state.swRunning = false;
        state.swElapsedMs = 0;
        if (swTimer) clearInterval(swTimer);
        if (swToggle) swToggle.textContent = 'START';
        renderStopwatch();
      });
    }

    document.getElementById('skip-boot-btn').addEventListener('click', function () {
      document.getElementById('boot-screen').classList.add('hidden');
      sfxSuccess();
    });

    const startBtn = document.getElementById('start-btn');
    const startMenu = document.getElementById('start-menu');
    startBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      sfxClick();
      startMenu.classList.toggle('hidden');
    });

    document.querySelectorAll('[data-open-app]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        openApp(btn.getAttribute('data-open-app'));
      });
    });

    document.getElementById('tile-windows-btn').addEventListener('click', function () {
      startMenu.classList.add('hidden');
      cascadeWindows();
    });

    document.getElementById('reboot-os-btn').addEventListener('click', function () {
      startMenu.classList.add('hidden');
      runBootSequence();
    });

    document.getElementById('tray-crt-btn').addEventListener('click', function () {
      sfxClick();
      state.crtScanlines = !state.crtScanlines;
      updateCRTStyles();
    });

    const audioBtn = document.getElementById('tray-audio-btn');
    audioBtn.addEventListener('click', function () {
      state.audioEnabled = !state.audioEnabled;
      audioBtn.textContent = state.audioEnabled ? '🔊 SFX' : '🔇 MUTE';
      if (state.audioEnabled) sfxClick();
    });

    document.addEventListener('click', function (e) {
      if (!e.target.closest('#start-menu') && !e.target.closest('#start-btn')) {
        startMenu.classList.add('hidden');
      }
    });

    runBootSequence();
    openApp('notepad');
    openApp('arcade');
  }

  window.addEventListener('load', initOS);
})();

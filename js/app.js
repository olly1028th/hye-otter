/**
 * 혜달이의 상태 - 메인 앱 (Stitch Design + 스탯 반응형 시스템)
 * 스탯 수치에 따라 해달이 표정, 비주얼, 대사가 실시간으로 변합니다.
 */
(function App() {
  'use strict';

  let currentOtterState = 'default';
  let currentStats = { fullness: 50, cleanliness: 50, happiness: 50, exp: 0, expNeeded: 100, level: 1 };

  // 이전 무드 (전환 감지용)
  let prevMood = null;
  // 유저 수동 기분 선택 타이머
  let manualMoodTimeout = null;
  // 아이들 메시지 로테이션 타이머
  let idleMessageTimer = null;

  // === 혜달이 캐릭터 업데이트 (스탯 기반 오버레이 포함) ===
  function updateOtter(state, message) {
    currentOtterState = state || 'default';
    // 스탯을 함께 전달하여 SVG 오버레이 반영
    OtterSVG.mount('otter-container', currentOtterState, currentStats);

    const $statusText = document.getElementById('otter-status-text');
    if ($statusText && message) $statusText.textContent = message;

    if (message) showSpeech(message);
  }

  function showSpeech(text, duration = 3000) {
    const $speech = document.getElementById('otter-speech');
    const $text = document.getElementById('otter-speech-text');
    if (!$speech || !$text) return;

    $text.textContent = text;
    $speech.hidden = false;

    const container = document.querySelector('.otter-container');
    if (container) {
      container.classList.remove('otter--bounce');
      void container.offsetWidth;
      container.classList.add('otter--bounce');
    }

    clearTimeout(showSpeech._timer);
    showSpeech._timer = setTimeout(() => {
      $speech.hidden = true;
    }, duration);
  }

  // === 상태바 업데이트 ===
  function updateStatusBars(stats) {
    currentStats = { ...currentStats, ...stats };

    const bars = {
      fullness: document.getElementById('fullness-bar'),
      cleanliness: document.getElementById('cleanliness-bar'),
      happiness: document.getElementById('happiness-bar'),
    };
    const values = {
      fullness: document.getElementById('fullness-value'),
      cleanliness: document.getElementById('cleanliness-value'),
      happiness: document.getElementById('happiness-value'),
    };
    if (bars.fullness) bars.fullness.style.width = stats.fullness + '%';
    if (bars.cleanliness) bars.cleanliness.style.width = stats.cleanliness + '%';
    if (bars.happiness) bars.happiness.style.width = stats.happiness + '%';
    if (values.fullness) values.fullness.textContent = Math.round(stats.fullness) + '%';
    if (values.cleanliness) values.cleanliness.textContent = Math.round(stats.cleanliness) + '%';
    if (values.happiness) values.happiness.textContent = Math.round(stats.happiness) + '%';

    // 레벨 & 경험치
    const $level = document.getElementById('otter-level');
    const $levelTop = document.getElementById('otter-level-top');
    const $expBar = document.getElementById('exp-bar');
    const $expText = document.getElementById('exp-text');
    const $expMax = document.getElementById('exp-max');

    if ($level) $level.textContent = stats.level;
    if ($levelTop) $levelTop.textContent = stats.level;
    if ($expBar) $expBar.style.width = (stats.exp / stats.expNeeded * 100) + '%';
    if ($expText) $expText.textContent = stats.exp;
    if ($expMax) $expMax.textContent = stats.expNeeded;

    // 스탯 변화 → 자동 무드 판정 & 표정/대사 전환
    reactToStatChange();
  }

  // ============================================
  //  핵심: 스탯 변화에 따른 자동 표정/대사 전환
  // ============================================
  function reactToStatChange() {
    // 유저가 수동으로 기분 선택한 직후에는 자동 전환 스킵
    if (manualMoodTimeout) return;

    const details = Tamagotchi.getMoodDetails();
    const newMood = details.mood;

    // 무드가 바뀌었을 때만 표정과 대사 업데이트 (깜빡임 방지)
    if (newMood !== prevMood) {
      prevMood = newMood;
      updateOtter(newMood, details.message);
    } else {
      // 무드는 같지만 SVG 스탯 오버레이 갱신 (배고픔 라인 등)
      OtterSVG.mount('otter-container', currentOtterState, currentStats);
    }

    // 위급 경고 알림 (critical 스탯이 있으면 강조)
    const warnings = details.warnings;
    const criticalWarning = warnings.find(w => w.level === 'critical');
    if (criticalWarning) {
      const $statusText = document.getElementById('otter-status-text');
      if ($statusText) $statusText.textContent = criticalWarning.msg;
    }
  }

  // === 아이들 메시지 로테이션 (10초마다 상황별 대사 변경) ===
  function startIdleMessageRotation() {
    if (idleMessageTimer) clearInterval(idleMessageTimer);

    idleMessageTimer = setInterval(() => {
      // 수동 기분 선택 중이면 스킵
      if (manualMoodTimeout) return;

      const details = Tamagotchi.getMoodDetails();
      const $statusText = document.getElementById('otter-status-text');
      if ($statusText) {
        $statusText.textContent = details.message;
      }
    }, 10000);
  }

  // === 탭 전환 ===
  function initTabs() {
    const tabs = document.querySelectorAll('.tab');
    const panels = document.querySelectorAll('.tab-panel');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('tab--active'));
        panels.forEach(p => p.classList.remove('tab-panel--active'));

        tab.classList.add('tab--active');
        const panel = document.getElementById('tab-' + tab.dataset.tab);
        if (panel) panel.classList.add('tab-panel--active');
      });
    });
  }

  // === 하트 플로팅 ===
  function spawnHearts() {
    const container = document.getElementById('otter-hearts');
    if (!container) return;

    const hearts = ['❤️', '💕', '💖', '💗'];
    for (let i = 0; i < 5; i++) {
      const el = document.createElement('span');
      el.className = 'otter-heart';
      el.textContent = hearts[Math.floor(Math.random() * hearts.length)];
      el.style.left = (Math.random() * 60 - 30) + 'px';
      el.style.animationDelay = (Math.random() * 0.3) + 's';
      el.style.fontSize = (1.2 + Math.random() * 0.8) + 'rem';
      container.appendChild(el);
      setTimeout(() => el.remove(), 1300);
    }
  }

  // === 파티클 애니메이션 ===
  const particleEmojis = {
    'care-feed': ['🐚', '✨', '⭐'],
    'care-wash': ['🧼', '🫧', '💧'],
    'care-pet': ['❤️', '💕', '💖'],
  };

  function spawnParticles(btn, type) {
    const container = document.getElementById('particles');
    if (!container) return;

    const rect = btn.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top;
    const emojis = particleEmojis[type] || ['✨'];

    for (let i = 0; i < 8; i++) {
      const el = document.createElement('span');
      el.className = 'particle';
      el.textContent = emojis[Math.floor(Math.random() * emojis.length)];

      const offsetX = (Math.random() - 0.5) * 80;
      const delay = Math.random() * 0.2;
      el.style.left = (cx + offsetX) + 'px';
      el.style.top = cy + 'px';
      el.style.animationDelay = delay + 's';
      el.style.fontSize = (1 + Math.random() * 0.8) + 'rem';

      container.appendChild(el);
      setTimeout(() => el.remove(), 1500);
    }
  }

  // === 돌보기 액션 바인딩 ===
  function initCareActions() {
    const actions = {
      'care-feed': () => Tamagotchi.feed(),
      'care-wash': () => Tamagotchi.wash(),
      'care-pet': () => Tamagotchi.pet(),
    };

    Object.entries(actions).forEach(([id, action]) => {
      const btn = document.getElementById(id);
      if (!btn) return;

      btn.addEventListener('click', async () => {
        const result = await action();
        if (result.ok) {
          spawnParticles(btn, id);
          if (id === 'care-pet') spawnHearts();

          updateOtter(result.leveled ? 'levelup' : (result.state || 'happy'), result.msg);

          btn.classList.add('care--cooldown');
          setTimeout(() => btn.classList.remove('care--cooldown'), 3000);

          // 액션 후 잠시 대기 → 새 스탯 기반 자동 무드로 부드럽게 전환
          setTimeout(() => {
            prevMood = null; // 강제 재판정
            reactToStatChange();
          }, 2500);
        } else {
          showSpeech(result.msg, 2000);
        }
      });
    });
  }

  // === 공유 데이터로 읽기 전용 표시 ===
  function showSharedView(data) {
    if (data.mood) {
      updateOtter(data.mood);
    }

    const statusText = document.getElementById('otter-status-text');
    if (statusText) {
      const moodName = Mood.getMoodName(data.mood) || '';
      let msg = data.message || '';
      if (moodName) msg = moodName + (msg ? ' · ' + msg : '');
      statusText.textContent = msg || '혜달이의 현재 상태예요!';
    }

    if (data.fullness != null) {
      updateStatusBars({
        fullness: data.fullness,
        cleanliness: data.cleanliness || 50,
        happiness: data.happiness || 50,
        level: data.level || 1,
        exp: 0,
        expNeeded: 100,
      });
    }

    if (data.todos) {
      const $list = document.getElementById('todo-list');
      const $empty = document.getElementById('todo-empty');
      if ($list) {
        $list.innerHTML = '';
        data.todos.forEach(text => {
          const li = document.createElement('li');
          li.className = 'todo__item';
          li.innerHTML = `<span class="todo__text">${text}</span>`;
          $list.appendChild(li);
        });
      }
      if ($empty) $empty.hidden = data.todos.length > 0;
    }
  }

  // === 현재 상태 수집 (공유용) ===
  function collectState() {
    const tama = Tamagotchi.getState();
    const mood = Mood.getCurrent();
    const todos = Todo.getItems().filter(t => !t.done);

    return {
      mood: mood || Tamagotchi.getAutoMood(),
      fullness: tama.fullness,
      cleanliness: tama.cleanliness,
      happiness: tama.happiness,
      level: tama.level,
      todos,
    };
  }

  // === 초기화 ===
  function init() {
    initTabs();

    const sharedData = Share.init(collectState);
    if (sharedData) {
      showSharedView(sharedData);
      return;
    }

    // 다마고치 초기화 (서버 API 폴링 시작)
    Tamagotchi.init((stats) => {
      updateStatusBars(stats);
    });

    // 기분 모듈 초기화 (수동 기분 선택 → 30초 동안 자동 전환 잠금)
    Mood.init((mood) => {
      const otterState = mood || 'default';
      const messages = {
        happy: '기분이 좋구나! 나도 행복해~ 😊',
        focused: '집중 모드! 화이팅! 🔥',
        tired: '피곤하구나... 좀 쉬자! 💤',
        stressed: '힘들면 잠깐 쉬어도 괜찮아 🫂',
        excited: '와~ 신난다!! 🎉',
        bored: '심심해? 같이 놀까? 🎾',
        loved: '사랑해~ 행복해~ 💕',
        hungry: '배고프다! 맛있는 거 먹자! 🍽️',
      };
      updateOtter(otterState, messages[mood] || '');

      // 수동 기분 선택 후 30초 동안 자동 전환 잠금
      clearTimeout(manualMoodTimeout);
      manualMoodTimeout = setTimeout(() => {
        manualMoodTimeout = null;
        prevMood = null;
        reactToStatChange();
      }, 30000);
    });

    Todo.init();
    initCareActions();

    Notification_.requestPermission();
    document.addEventListener('click', function unlockAudio() {
      Notification_.playSplash && void 0;
      document.removeEventListener('click', unlockAudio);
    }, { once: true });

    window.addEventListener('beforeunload', () => {
      Tamagotchi.destroy();
      clearInterval(idleMessageTimer);
    });

    // 초기 렌더링
    const initialDetails = Tamagotchi.getMoodDetails();
    updateOtter(initialDetails.mood, '안녕! 나는 혜달이야 🦦');

    // 아이들 메시지 로테이션 시작
    startIdleMessageRotation();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

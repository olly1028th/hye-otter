/**
 * 혜달이의 상태 - 메인 앱 (Stitch Design + 스탯 반응형 시스템)
 * 스탯 수치에 따라 해달이 표정, 비주얼, 대사가 실시간으로 변합니다.
 * 돌봄 알림, 돌봄 기록, 상태별 제안 기능 포함.
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
  // 돌봄 알림 감지용 (마지막 액션 타임스탬프)
  let lastKnownActionAt = 0;

  // 상태별 혜달이 SVG 매핑
  const otterStateMap = {
    gaming: 'playing',
    studying: 'focused',
    resting: 'happy',
    sleeping: 'sleeping',
    eating: 'eating',
    out: 'excited',
  };

  // 상태별 메시지
  const moodMessages = {
    gaming: '게임 중이구나! 즐겨~ 🎮',
    studying: '공부 화이팅! 집중! 📚',
    resting: '푹 쉬어~ 편안하게~ ☕',
    sleeping: '쿨쿨... 좋은 꿈 꿔! 💤',
    eating: '맛있게 먹어! 냠냠~ 🍚',
    out: '외출 중이구나! 조심해~ 🚶',
  };

  // 상태별 돌봄 제안 (B8)
  const careSuggestions = {
    gaming: '게임 중인 혜달이에게 응원을 보내보세요!',
    studying: '공부 중인 혜달이, 간식으로 응원해주세요!',
    resting: '쉬고 있는 혜달이를 쓰다듬어 주세요~',
    sleeping: '자고 있어요... 살짝 쓰다듬어 줄까요?',
    eating: '밥 먹고 있어요! 같이 먹는 느낌으로 조개를!',
    out: '외출 중! 돌아오면 반겨줄 준비를 해요~',
  };

  // 액션 이모지
  const actionEmoji = {
    feed: '🐚',
    wash: '🧼',
    pet: '💕',
  };
  const actionName = {
    feed: '조개 주기',
    wash: '비누칠하기',
    pet: '쓰다듬기',
  };

  // === 혜달이 캐릭터 업데이트 (스탯 기반 오버레이 포함) ===
  function updateOtter(state, message) {
    currentOtterState = state || 'default';
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

  // === 돌봄 알림 토스트 (B6) ===
  function showCareToast(text) {
    const $toast = document.getElementById('care-toast');
    const $text = document.getElementById('care-toast-text');
    if (!$toast || !$text) return;

    $text.textContent = text;
    $toast.hidden = false;
    $toast.classList.remove('care-toast--hide');

    clearTimeout(showCareToast._timer);
    showCareToast._timer = setTimeout(() => {
      $toast.classList.add('care-toast--hide');
      setTimeout(() => { $toast.hidden = true; }, 300);
    }, 4000);

    // 브라우저 알림도 함께
    Notification_.showBrowserNotification('혜달이를 돌봐줬어요!', text);
    Notification_.playSplash();
  }

  // === 상태바 업데이트 ===
  function updateStatusBars(stats) {
    currentStats = { ...currentStats, ...stats };

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

    // 서버에서 mood가 오면 동기화
    if (stats.mood) {
      Mood.setFromServer(stats.mood);
    }

    // 돌봄 알림 감지 (B6) - lastActionAt가 바뀌면 누군가 돌봄
    if (stats.lastActionAt && stats.lastActionAt > lastKnownActionAt && lastKnownActionAt > 0) {
      showCareToast('누군가 혜달이를 돌봐줬어요! 🦦💕');
    }
    if (stats.lastActionAt) lastKnownActionAt = stats.lastActionAt;

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

    // 상태별 제안 업데이트 (B8)
    updateCareSuggestion();
  }

  // === 상태별 돌봄 제안 (B8) ===
  function updateCareSuggestion() {
    const mood = Mood.getCurrent();
    const $statusText = document.getElementById('otter-status-text');
    if (!mood || !$statusText) return;
    // 위급 상태가 아닐 때만 제안 표시
    const warnings = Tamagotchi.getWarnings();
    if (warnings.some(w => w.level === 'critical')) return;
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

        // 돌봄 기록 탭 열릴 때 로그 새로고침
        if (tab.dataset.tab === 'care-log') {
          loadCareLog();
        }
      });
    });
  }

  // === 돌봄 기록 로드 (A3 + B7) ===
  async function loadCareLog() {
    const data = await API.getLogs();
    renderCareLog(data);
  }

  function renderCareLog(data) {
    const $list = document.getElementById('care-log-list');
    const $empty = document.getElementById('care-log-empty');
    if (!$list) return;

    $list.innerHTML = '';

    // 오늘의 요약 (B7)
    const today = data.today || {};
    const $total = document.getElementById('care-today-total');
    const $feed = document.getElementById('care-today-feed');
    const $wash = document.getElementById('care-today-wash');
    const $pet = document.getElementById('care-today-pet');
    if ($total) $total.textContent = today.total || 0;
    if ($feed) $feed.textContent = today.feed || 0;
    if ($wash) $wash.textContent = today.wash || 0;
    if ($pet) $pet.textContent = today.pet || 0;

    const logs = data.logs || [];
    if ($empty) $empty.hidden = logs.length > 0;

    logs.forEach(log => {
      const li = document.createElement('li');
      li.className = 'care-log__item';

      const emoji = actionEmoji[log.action] || '✨';
      const name = actionName[log.action] || log.action;
      const time = formatLogTime(log.created_at);
      const msg = log.message ? `<span class="care-log__message">"${escapeHtml(log.message)}"</span>` : '';

      li.innerHTML = `
        <span class="care-log__emoji">${emoji}</span>
        <div class="care-log__detail">
          <span class="care-log__action">${name}</span>
          ${msg}
        </div>
        <span class="care-log__time">${time}</span>
      `;
      $list.appendChild(li);
    });
  }

  function formatLogTime(timestamp) {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diff = (now - date) / 1000;

    if (diff < 60) return '방금';
    if (diff < 3600) return Math.floor(diff / 60) + '분 전';
    if (diff < 86400) return Math.floor(diff / 3600) + '시간 전';

    return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
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

  // === 메시지 입력 가져오기 (B5) ===
  function getCareMessage() {
    const $input = document.getElementById('care-message');
    if (!$input) return '';
    const msg = $input.value.trim();
    $input.value = '';
    return msg;
  }

  // === 돌보기 액션 바인딩 ===
  function initCareActions() {
    const actions = {
      'care-feed': () => Tamagotchi.feed(getCareMessage()),
      'care-wash': () => Tamagotchi.wash(getCareMessage()),
      'care-pet': () => Tamagotchi.pet(getCareMessage()),
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

  // === 현재 상태 수집 (공유용) ===
  function collectState() {
    const tama = Tamagotchi.getState();
    const mood = Mood.getCurrent();

    return {
      mood: mood || Tamagotchi.getAutoMood(),
      fullness: tama.fullness,
      cleanliness: tama.cleanliness,
      happiness: tama.happiness,
      level: tama.level,
    };
  }

  // === 초기화 ===
  function init() {
    initTabs();

    Share.init(collectState);

    // 다마고치 초기화 (서버 API 폴링 시작)
    Tamagotchi.init((stats) => {
      updateStatusBars(stats);
    });

    // 기분 모듈 초기화 (수동 기분 선택 → 30초 동안 자동 전환 잠금)
    Mood.init((mood) => {
      const otterState = otterStateMap[mood] || 'default';
      updateOtter(otterState, moodMessages[mood] || '');

      // 수동 기분 선택 후 30초 동안 자동 전환 잠금
      clearTimeout(manualMoodTimeout);
      manualMoodTimeout = setTimeout(() => {
        manualMoodTimeout = null;
        prevMood = null;
        reactToStatChange();
      }, 30000);
    });

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

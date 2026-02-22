/**
 * 혜달이의 상태 - 메인 앱
 * 모든 모듈을 연결하고 초기화합니다.
 */
(function App() {
  'use strict';

  let currentOtterState = 'default';

  // === 혜달이 캐릭터 업데이트 ===
  function updateOtter(state, message) {
    currentOtterState = state || 'default';
    OtterSVG.mount('otter-container', currentOtterState);

    const $statusText = document.getElementById('otter-status-text');
    if ($statusText && message) $statusText.textContent = message;

    // 말풍선
    if (message) showSpeech(message);
  }

  function showSpeech(text, duration = 3000) {
    const $speech = document.getElementById('otter-speech');
    const $text = document.getElementById('otter-speech-text');
    if (!$speech || !$text) return;

    $text.textContent = text;
    $speech.hidden = false;

    // 바운스 효과
    const container = document.querySelector('.otter-container');
    if (container) {
      container.classList.remove('otter--bounce');
      void container.offsetWidth; // reflow
      container.classList.add('otter--bounce');
    }

    clearTimeout(showSpeech._timer);
    showSpeech._timer = setTimeout(() => {
      $speech.hidden = true;
    }, duration);
  }

  // === 상태바 업데이트 ===
  function updateStatusBars(stats) {
    const bars = {
      hunger: document.getElementById('hunger-bar'),
      happiness: document.getElementById('happiness-bar'),
      energy: document.getElementById('energy-bar'),
    };
    if (bars.hunger) bars.hunger.style.width = stats.hunger + '%';
    if (bars.happiness) bars.happiness.style.width = stats.happiness + '%';
    if (bars.energy) bars.energy.style.width = stats.energy + '%';

    // 레벨 & 경험치
    const $level = document.getElementById('otter-level');
    const $expBar = document.getElementById('exp-bar');
    const $expText = document.getElementById('exp-text');
    const $expMax = document.getElementById('exp-max');

    if ($level) $level.textContent = stats.level;
    if ($expBar) $expBar.style.width = (stats.exp / stats.expNeeded * 100) + '%';
    if ($expText) $expText.textContent = stats.exp;
    if ($expMax) $expMax.textContent = stats.expNeeded;
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

  // === 돌보기 액션 바인딩 ===
  function initCareActions() {
    const actions = {
      'care-feed': () => Tamagotchi.feed(),
      'care-play': () => Tamagotchi.play(),
      'care-sleep': () => Tamagotchi.sleep(),
      'care-pet': () => Tamagotchi.pet(),
    };

    Object.entries(actions).forEach(([id, action]) => {
      const btn = document.getElementById(id);
      if (!btn) return;

      btn.addEventListener('click', () => {
        const result = action();
        if (result.ok) {
          // 액션 성공
          const actionStates = {
            'care-feed': 'eating',
            'care-play': 'playing',
            'care-sleep': 'sleeping',
            'care-pet': 'happy',
          };
          updateOtter(result.leveled ? 'levelup' : (actionStates[id] || 'happy'), result.msg);

          // 쿨다운 표시
          btn.classList.add('care--cooldown');
          setTimeout(() => btn.classList.remove('care--cooldown'), 3000);

          // 잠시 후 기본 상태로 복귀
          setTimeout(() => {
            const autoMood = Mood.getCurrent() || Tamagotchi.getAutoMood();
            updateOtter(autoMood);
          }, 2500);
        } else {
          showSpeech(result.msg, 2000);
        }
      });
    });
  }

  // === 공유 데이터로 읽기 전용 표시 ===
  function showSharedView(data) {
    // 공유된 상태를 보여줍니다
    if (data.mood) {
      updateOtter(data.mood);
    }

    const statusText = document.getElementById('otter-status-text');
    if (statusText) {
      const moodName = Mood.getMoodName(data.mood) || '';
      let msg = data.message || '';
      if (data.timerRunning) {
        msg += data.timerBreak ? ' ☕ 휴식 중' : ' 🍅 집중 중';
      }
      if (moodName) msg = moodName + (msg ? ' · ' + msg : '');
      statusText.textContent = msg || '혜달이의 현재 상태예요!';
    }

    // 상태바 업데이트
    if (data.hunger != null) {
      updateStatusBars({
        hunger: data.hunger,
        happiness: data.happiness || 50,
        energy: data.energy || 50,
        level: data.level || 1,
        exp: 0,
        expNeeded: 100,
      });
    }

    // 할일 표시
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
    const timer = Timer.getStatus();
    const mood = Mood.getCurrent();
    const todos = Todo.getItems().filter(t => !t.done);

    return {
      mood: mood || Tamagotchi.getAutoMood(),
      hunger: tama.hunger,
      happiness: tama.happiness,
      energy: tama.energy,
      level: tama.level,
      timerRunning: timer.isRunning,
      timerBreak: timer.isBreak,
      pomoCount: timer.pomoCount,
      todos,
    };
  }

  // === 초기화 ===
  function init() {
    // 탭 초기화
    initTabs();

    // 공유 모듈 초기화 (URL 파라미터 체크)
    const sharedData = Share.init(collectState);

    if (sharedData) {
      // 공유 링크로 들어온 경우: 읽기 전용 표시
      showSharedView(sharedData);
      return;
    }

    // 다마고치 초기화
    Tamagotchi.init((stats) => {
      updateStatusBars(stats);
    });

    // 타이머 초기화
    Timer.init({
      onTick: ({ isRunning, isBreak }) => {
        if (isRunning) {
          const state = isBreak ? 'happy' : 'focused';
          const container = document.querySelector('.otter-container');
          if (container && currentOtterState !== state) {
            updateOtter(state, isBreak ? '휴식 중~ ☕' : '집중하는 중! 🔥');
          }
        }
      },
      onComplete: ({ isBreak, pomoCount }) => {
        if (isBreak) {
          updateOtter('happy', `집중 끝! ${pomoCount}번째 뽀모도로 완료! 🎉`);
        } else {
          updateOtter('excited', '휴식 끝! 다시 집중하자! 💪');
        }
      },
    });

    // 기분 모듈 초기화
    Mood.init((mood) => {
      // 기분 상태에 맞는 혜달이 표정 매핑
      const otterStateMap = {
        happy: 'happy',
        focused: 'focused',
        tired: 'tired',
        stressed: 'stressed',
        excited: 'excited',
        bored: 'bored',
        loved: 'loved',
        hungry: 'hungry',
      };
      const otterState = otterStateMap[mood] || 'default';
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
    });

    // 할일 모듈 초기화
    Todo.init();

    // 돌보기 액션 바인딩
    initCareActions();

    // 초기 혜달이 렌더링
    updateOtter('default', '안녕! 나는 혜달이야 🦦');
  }

  // DOM 준비되면 시작
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

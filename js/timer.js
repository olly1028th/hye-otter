/**
 * 뽀모도로 타이머 모듈
 */
const Timer = (() => {
  const STORAGE_KEY = 'hyeotter_timer';

  let totalSeconds = 25 * 60;
  let remaining = totalSeconds;
  let intervalId = null;
  let isRunning = false;
  let isBreak = false;
  let pomoCount = 0;
  let onTick = null;
  let onComplete = null;

  // DOM 요소 캐시
  let $display, $start, $pause, $reset, $mode, $focusMin, $breakMin, $count;

  function loadCount() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        const today = new Date().toDateString();
        if (data.date === today) {
          pomoCount = data.count || 0;
        }
      }
    } catch (e) {
      // 무시
    }
  }

  function saveCount() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        date: new Date().toDateString(),
        count: pomoCount,
      }));
    } catch (e) {
      // 무시
    }
  }

  function formatTime(sec) {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  function updateDisplay() {
    if ($display) {
      $display.textContent = formatTime(remaining);
      $display.classList.toggle('timer--running', isRunning && !isBreak);
      $display.classList.toggle('timer--break', isRunning && isBreak);
    }
    if ($count) $count.textContent = pomoCount;
    if ($mode) $mode.textContent = isBreak ? '휴식 시간' : '집중 시간';

    if ($start) $start.hidden = isRunning;
    if ($pause) $pause.hidden = !isRunning;
  }

  function tick() {
    remaining--;
    if (remaining <= 0) {
      stop();
      complete();
    }
    updateDisplay();
    if (onTick) onTick({ remaining, isRunning, isBreak });
  }

  function complete() {
    if (!isBreak) {
      pomoCount++;
      saveCount();
      // 집중 끝 → 휴식으로
      const breakMin = $breakMin ? parseInt($breakMin.value, 10) || 5 : 5;
      totalSeconds = breakMin * 60;
      remaining = totalSeconds;
      isBreak = true;
    } else {
      // 휴식 끝 → 집중으로
      const focusMin = $focusMin ? parseInt($focusMin.value, 10) || 25 : 25;
      totalSeconds = focusMin * 60;
      remaining = totalSeconds;
      isBreak = false;
    }
    updateDisplay();
    if (onComplete) onComplete({ isBreak, pomoCount });
  }

  function start() {
    if (isRunning) return;
    isRunning = true;
    intervalId = setInterval(tick, 1000);
    updateDisplay();
  }

  function pause() {
    isRunning = false;
    clearInterval(intervalId);
    intervalId = null;
    updateDisplay();
  }

  function stop() {
    pause();
  }

  function reset() {
    stop();
    isBreak = false;
    const focusMin = $focusMin ? parseInt($focusMin.value, 10) || 25 : 25;
    totalSeconds = focusMin * 60;
    remaining = totalSeconds;
    updateDisplay();
  }

  function init(options = {}) {
    onTick = options.onTick || null;
    onComplete = options.onComplete || null;

    $display = document.getElementById('timer-display');
    $start = document.getElementById('timer-start');
    $pause = document.getElementById('timer-pause');
    $reset = document.getElementById('timer-reset');
    $mode = document.getElementById('timer-mode');
    $focusMin = document.getElementById('focus-min');
    $breakMin = document.getElementById('break-min');
    $count = document.getElementById('pomo-count');

    loadCount();

    // 이벤트 바인딩
    if ($start) $start.addEventListener('click', start);
    if ($pause) $pause.addEventListener('click', pause);
    if ($reset) $reset.addEventListener('click', reset);

    // 시간 설정 변경
    if ($focusMin) {
      $focusMin.addEventListener('change', () => {
        if (!isRunning && !isBreak) {
          totalSeconds = (parseInt($focusMin.value, 10) || 25) * 60;
          remaining = totalSeconds;
          updateDisplay();
        }
      });
    }
    if ($breakMin) {
      $breakMin.addEventListener('change', () => {
        if (!isRunning && isBreak) {
          totalSeconds = (parseInt($breakMin.value, 10) || 5) * 60;
          remaining = totalSeconds;
          updateDisplay();
        }
      });
    }

    updateDisplay();
  }

  function getStatus() {
    return { remaining, isRunning, isBreak, pomoCount };
  }

  return { init, start, pause, reset, getStatus };
})();

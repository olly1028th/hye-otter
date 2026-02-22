/**
 * 기분/감정 상태 모듈
 */
const Mood = (() => {
  const STORAGE_KEY = 'hyeotter_mood';
  const MAX_LOG = 20;

  let currentMood = null;
  let moodLog = [];
  let onChange = null;

  const moodNames = {
    happy: '행복해 😊',
    focused: '집중! 🔥',
    tired: '피곤해 😴',
    stressed: '힘들어 😰',
    excited: '신나! 🥳',
    bored: '심심해 😑',
    loved: '사랑해 🥰',
    hungry: '배고파 🍽️',
  };

  function load() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        currentMood = data.current || null;
        moodLog = data.log || [];
      }
    } catch (e) {
      // 무시
    }
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        current: currentMood,
        log: moodLog,
      }));
    } catch (e) {
      // 무시
    }
  }

  function formatTime(date) {
    return new Date(date).toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function renderLog() {
    const $list = document.getElementById('mood-log-list');
    if (!$list) return;
    $list.innerHTML = '';
    moodLog.slice().reverse().forEach(entry => {
      const li = document.createElement('li');
      li.innerHTML = `<span>${moodNames[entry.mood] || entry.mood}</span><span class="mood-time">${formatTime(entry.time)}</span>`;
      $list.appendChild(li);
    });
  }

  function updateButtons() {
    document.querySelectorAll('.mood__btn').forEach(btn => {
      btn.classList.toggle('mood--selected', btn.dataset.mood === currentMood);
    });
  }

  function selectMood(mood) {
    currentMood = mood;
    moodLog.push({ mood, time: Date.now() });
    if (moodLog.length > MAX_LOG) moodLog.shift();
    save();
    updateButtons();
    renderLog();
    if (onChange) onChange(mood);
  }

  function init(callback) {
    onChange = callback;
    load();

    // 이벤트 바인딩
    document.querySelectorAll('.mood__btn').forEach(btn => {
      btn.addEventListener('click', () => selectMood(btn.dataset.mood));
    });

    updateButtons();
    renderLog();
  }

  function getCurrent() {
    return currentMood;
  }

  function getMoodName(mood) {
    return moodNames[mood] || '';
  }

  return { init, getCurrent, getMoodName, moodNames };
})();

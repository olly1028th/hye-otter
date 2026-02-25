/**
 * 기분/감정 상태 모듈
 * 서버에 상태를 저장하고, 폴링으로 동기화합니다.
 */
const Mood = (() => {
  let currentMood = null;
  let onChange = null;

  const moodNames = {
    gaming: '게임중 🎮',
    studying: '공부중 📚',
    resting: '휴식중 ☕',
    sleeping: '쿨쿨 😴',
    eating: '밥먹는중 🍚',
    out: '외출중 🚶',
  };

  function updateButtons() {
    document.querySelectorAll('.mood__btn').forEach(btn => {
      btn.classList.toggle('mood--selected', btn.dataset.mood === currentMood);
    });
  }

  function selectMood(mood) {
    currentMood = mood;
    updateButtons();
    // 서버에 저장
    API.setMood(mood);
    if (onChange) onChange(mood);
  }

  /** 서버 폴링 데이터로 기분 동기화 (방문자가 볼 수 있도록) */
  function setFromServer(mood) {
    if (mood && mood !== currentMood) {
      currentMood = mood;
      updateButtons();
    }
  }

  function init(callback) {
    onChange = callback;

    // 이벤트 바인딩
    document.querySelectorAll('.mood__btn').forEach(btn => {
      btn.addEventListener('click', () => selectMood(btn.dataset.mood));
    });

    updateButtons();
  }

  function getCurrent() {
    return currentMood;
  }

  function getMoodName(mood) {
    return moodNames[mood] || '';
  }

  return { init, getCurrent, getMoodName, setFromServer, moodNames };
})();

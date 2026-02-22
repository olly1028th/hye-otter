/**
 * 다마고치 상태 관리 모듈
 * 배고픔, 행복도, 에너지를 관리하고 레벨 시스템을 제공합니다.
 */
const Tamagotchi = (() => {
  const STORAGE_KEY = 'hyeotter_tamagotchi';
  const DECAY_INTERVAL = 60_000; // 1분마다 상태 감소
  const COOLDOWN = 3_000; // 액션 쿨다운 3초

  // 초기 상태
  const defaultState = {
    hunger: 50,
    happiness: 50,
    energy: 50,
    exp: 0,
    level: 1,
    lastUpdate: Date.now(),
    lastFeed: 0,
    lastPlay: 0,
    lastSleep: 0,
    lastPet: 0,
  };

  let state = { ...defaultState };
  let decayTimer = null;
  let onChange = null;

  function load() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        state = { ...defaultState, ...JSON.parse(saved) };
        applyTimeDecay();
      }
    } catch (e) {
      // localStorage 사용 불가 시 기본값 사용
    }
  }

  function save() {
    state.lastUpdate = Date.now();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      // 무시
    }
  }

  /** 시간 경과에 따른 상태 감소 */
  function applyTimeDecay() {
    const elapsed = Date.now() - state.lastUpdate;
    const minutes = Math.floor(elapsed / 60_000);
    if (minutes > 0) {
      state.hunger = Math.max(0, state.hunger - minutes * 2);
      state.happiness = Math.max(0, state.happiness - minutes * 1);
      state.energy = Math.max(0, state.energy - minutes * 1);
    }
  }

  /** 주기적 감소 시작 */
  function startDecay() {
    decayTimer = setInterval(() => {
      state.hunger = Math.max(0, state.hunger - 2);
      state.happiness = Math.max(0, state.happiness - 1);
      state.energy = Math.max(0, state.energy - 1);
      save();
      notify();
    }, DECAY_INTERVAL);
  }

  function clamp(val) {
    return Math.max(0, Math.min(100, Math.round(val)));
  }

  function addExp(amount) {
    state.exp += amount;
    const expNeeded = getExpNeeded();
    if (state.exp >= expNeeded) {
      state.exp -= expNeeded;
      state.level++;
      save();
      notify();
      return true; // 레벨업!
    }
    return false;
  }

  function getExpNeeded() {
    return 80 + state.level * 20;
  }

  function isOnCooldown(lastTime) {
    return Date.now() - lastTime < COOLDOWN;
  }

  function notify() {
    if (onChange) onChange(getState());
  }

  // === 공개 API ===

  function init(callback) {
    onChange = callback;
    load();
    startDecay();
    notify();
  }

  function getState() {
    return {
      hunger: clamp(state.hunger),
      happiness: clamp(state.happiness),
      energy: clamp(state.energy),
      exp: state.exp,
      expNeeded: getExpNeeded(),
      level: state.level,
    };
  }

  /** 밥 주기: 배고픔 +25, 행복 +5 */
  function feed() {
    if (isOnCooldown(state.lastFeed)) return { ok: false, msg: '아직 배부른 것 같아요!' };
    state.hunger = clamp(state.hunger + 25);
    state.happiness = clamp(state.happiness + 5);
    state.lastFeed = Date.now();
    const leveled = addExp(10);
    save();
    notify();
    return { ok: true, msg: '냠냠! 맛있다~ 🐟', leveled };
  }

  /** 놀아주기: 행복 +20, 에너지 -10 */
  function play() {
    if (isOnCooldown(state.lastPlay)) return { ok: false, msg: '조금 쉬고 놀자!' };
    if (state.energy < 10) return { ok: false, msg: '너무 피곤해서 못 놀아... 💤' };
    state.happiness = clamp(state.happiness + 20);
    state.energy = clamp(state.energy - 10);
    state.lastPlay = Date.now();
    const leveled = addExp(10);
    save();
    notify();
    return { ok: true, msg: '신나다! ⚽', leveled };
  }

  /** 재우기: 에너지 +30, 배고픔 -5 */
  function sleep() {
    if (isOnCooldown(state.lastSleep)) return { ok: false, msg: '아직 안 졸려~' };
    state.energy = clamp(state.energy + 30);
    state.hunger = clamp(state.hunger - 5);
    state.lastSleep = Date.now();
    const leveled = addExp(5);
    save();
    notify();
    return { ok: true, msg: '쿨쿨... 💤', leveled };
  }

  /** 쓰다듬기: 행복 +10, 에너지 +5 */
  function pet() {
    if (isOnCooldown(state.lastPet)) return { ok: false, msg: '기분 좋아~ 잠깐만!' };
    state.happiness = clamp(state.happiness + 10);
    state.energy = clamp(state.energy + 5);
    state.lastPet = Date.now();
    const leveled = addExp(5);
    save();
    notify();
    return { ok: true, msg: '좋아좋아~ 💕', leveled };
  }

  /** 혜달이의 현재 기분을 자동 판단 */
  function getAutoMood() {
    const s = getState();
    if (s.hunger < 20) return 'hungry';
    if (s.energy < 20) return 'tired';
    if (s.happiness < 20) return 'sad';
    if (s.happiness > 80 && s.energy > 60) return 'excited';
    if (s.happiness > 60) return 'happy';
    return 'default';
  }

  function destroy() {
    if (decayTimer) clearInterval(decayTimer);
  }

  return { init, getState, feed, play, sleep, pet, getAutoMood, destroy };
})();

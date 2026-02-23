/**
 * 다마고치 상태 관리 모듈
 * 서버 API를 통해 공유 상태를 관리합니다.
 * 포만감, 청결도, 행복도 + 레벨 시스템
 */
const Tamagotchi = (() => {
  const COOLDOWN = 3_000;

  let state = {
    fullness: 50,
    cleanliness: 50,
    happiness: 50,
    exp: 0,
    expNeeded: 100,
    level: 1,
  };
  let onChange = null;
  let lastAction = { feed: 0, wash: 0, pet: 0 };

  function isOnCooldown(action) {
    return Date.now() - (lastAction[action] || 0) < COOLDOWN;
  }

  function notify() {
    if (onChange) onChange(getState());
  }

  function updateFromServer(serverStats) {
    state = { ...state, ...serverStats };
    notify();
  }

  // === 공개 API ===

  function init(callback) {
    onChange = callback;
    API.startPolling(updateFromServer);
  }

  function getState() {
    return { ...state };
  }

  async function feed() {
    if (isOnCooldown('feed')) return { ok: false, msg: '아직 배부른 것 같아요!' };
    lastAction.feed = Date.now();
    const result = await API.doAction('feed');
    if (result.ok && result.stats) updateFromServer(result.stats);
    return result;
  }

  async function wash() {
    if (isOnCooldown('wash')) return { ok: false, msg: '아직 깨끗해요!' };
    lastAction.wash = Date.now();
    const result = await API.doAction('wash');
    if (result.ok && result.stats) updateFromServer(result.stats);
    return result;
  }

  async function pet() {
    if (isOnCooldown('pet')) return { ok: false, msg: '기분 좋아~ 잠깐만!' };
    lastAction.pet = Date.now();
    const result = await API.doAction('pet');
    if (result.ok && result.stats) updateFromServer(result.stats);
    return result;
  }

  function getAutoMood() {
    if (state.fullness < 20) return 'hungry';
    if (state.cleanliness < 20) return 'stressed';
    if (state.happiness < 20) return 'sad';
    if (state.happiness > 80 && state.fullness > 60) return 'excited';
    if (state.happiness > 60) return 'happy';
    return 'default';
  }

  function destroy() {
    API.stopPolling();
  }

  return { init, getState, feed, wash, pet, getAutoMood, destroy };
})();

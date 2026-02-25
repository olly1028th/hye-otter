/**
 * 다마고치 상태 관리 모듈 (정교한 상태 변화 시스템)
 * 서버 API를 통해 공유 상태를 관리합니다.
 * 포만감, 청결도, 행복도 + 레벨 시스템 + 복합 상태 판정
 */
const Tamagotchi = (() => {
  const COOLDOWN = 3_000;

  // === 상태 임계치 정의 ===
  const THRESHOLD = {
    CRITICAL: 15,   // 위험 (즉시 반응 필요)
    LOW: 30,        // 낮음 (주의 필요)
    MEDIUM: 50,     // 보통
    HIGH: 70,       // 좋음
    GREAT: 85,      // 매우 좋음
    MAX: 95,        // 최고
  };

  let state = {
    fullness: 50,
    cleanliness: 50,
    happiness: 50,
    exp: 0,
    expNeeded: 100,
    level: 1,
    mood: null,
    lastActionAt: 0,
  };
  let onChange = null;
  let lastAction = { feed: 0, wash: 0, pet: 0 };

  // === 마지막 감지 무드 (전환 판정용) ===
  let prevAutoMood = 'default';

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

  // === 스탯 레벨 판정 ===
  function getStatLevel(value) {
    if (value <= THRESHOLD.CRITICAL) return 'critical';
    if (value <= THRESHOLD.LOW) return 'low';
    if (value <= THRESHOLD.MEDIUM) return 'medium';
    if (value <= THRESHOLD.HIGH) return 'high';
    if (value <= THRESHOLD.GREAT) return 'great';
    return 'max';
  }

  // === 전체 건강도 점수 (0-100 가중 평균) ===
  function getWellnessScore() {
    return (
      state.fullness * 0.3 +
      state.cleanliness * 0.25 +
      state.happiness * 0.45
    );
  }

  // === 시간대 판정 ===
  function getTimeOfDay() {
    const hour = new Date().getHours();
    if (hour >= 22 || hour < 6) return 'night';
    if (hour >= 6 && hour < 9) return 'morning';
    if (hour >= 12 && hour < 14) return 'lunch';
    return 'day';
  }

  // === 스탯 경고 생성 ===
  function getWarnings() {
    const warnings = [];
    const fl = getStatLevel(state.fullness);
    const cl = getStatLevel(state.cleanliness);
    const hl = getStatLevel(state.happiness);

    if (fl === 'critical') warnings.push({ stat: 'fullness', level: 'critical', msg: '배가 너무 고파요!' });
    else if (fl === 'low') warnings.push({ stat: 'fullness', level: 'low', msg: '슬슬 배가 고프다...' });

    if (cl === 'critical') warnings.push({ stat: 'cleanliness', level: 'critical', msg: '씻어줘요...!' });
    else if (cl === 'low') warnings.push({ stat: 'cleanliness', level: 'low', msg: '조금 찝찝해...' });

    if (hl === 'critical') warnings.push({ stat: 'happiness', level: 'critical', msg: '외로워요...' });
    else if (hl === 'low') warnings.push({ stat: 'happiness', level: 'low', msg: '심심해...' });

    return warnings;
  }

  // ============================================
  //  정교한 자동 무드 판정 시스템
  //  우선순위 기반 + 복합 조건 + 시간대 반영
  // ============================================
  function getAutoMood() {
    const fl = getStatLevel(state.fullness);
    const cl = getStatLevel(state.cleanliness);
    const hl = getStatLevel(state.happiness);
    const { fullness: f, cleanliness: c, happiness: h } = state;
    const wellness = getWellnessScore();
    const time = getTimeOfDay();

    let mood = 'default';

    // --- 1단계: 위급 상태 (critical) - 최우선 ---
    if (fl === 'critical' && cl === 'critical' && hl === 'critical') {
      mood = 'sad';
    }
    else if (fl === 'critical') {
      mood = 'hungry';
    }
    else if (cl === 'critical' && (hl === 'critical' || hl === 'low')) {
      mood = 'stressed';
    }
    else if (cl === 'critical') {
      mood = 'stressed';
    }
    else if (hl === 'critical') {
      mood = 'sad';
    }

    // --- 2단계: 주의 상태 (low) ---
    else if (fl === 'low' && hl === 'low') {
      mood = 'hungry';
    }
    else if (fl === 'low') {
      mood = 'hungry';
    }
    else if (cl === 'low' && hl === 'low') {
      mood = 'bored';
    }
    else if (hl === 'low') {
      mood = 'sad';
    }
    else if (cl === 'low') {
      mood = 'bored';
    }

    // --- 3단계: 최상 상태 (모두 높음) ---
    else if (fl === 'max' && cl === 'max' && hl === 'max') {
      mood = 'excited';
    }
    else if ((hl === 'max' || hl === 'great') && fl !== 'low' && cl !== 'low') {
      if (f > THRESHOLD.HIGH && c > THRESHOLD.HIGH) {
        mood = 'loved';
      } else {
        mood = 'excited';
      }
    }
    else if ((hl === 'high' || hl === 'great') && fl !== 'low') {
      mood = 'happy';
    }

    // --- 4단계: 시간대 보정 ---
    else if (time === 'night' && h > THRESHOLD.LOW && wellness > 35) {
      mood = 'tired';
    }
    else if (time === 'lunch' && fl === 'medium') {
      mood = 'hungry';
    }

    // --- 5단계: 보통 상태 ---
    else if (wellness >= 60) {
      mood = 'happy';
    }
    else if (wellness >= 40) {
      mood = 'default';
    }
    else {
      mood = 'bored';
    }

    prevAutoMood = mood;
    return mood;
  }

  /**
   * 상세 무드 정보 반환 (app.js에서 메시지 표시에 활용)
   */
  function getMoodDetails() {
    const mood = getAutoMood();
    const wellness = getWellnessScore();
    const warnings = getWarnings();
    const time = getTimeOfDay();

    let intensity = 0.5;
    if (mood === 'hungry') intensity = 1 - (state.fullness / 100);
    else if (mood === 'stressed') intensity = 1 - (state.cleanliness / 100);
    else if (mood === 'sad') intensity = 1 - (state.happiness / 100);
    else if (mood === 'happy' || mood === 'excited' || mood === 'loved') intensity = wellness / 100;
    else if (mood === 'tired') intensity = time === 'night' ? 0.8 : 0.4;

    const messages = {
      hungry: [
        { min: 0.8, text: '너무 배고파... 조개 줘! 🥺' },
        { min: 0.5, text: '슬슬 배가 고프다~ 🐚' },
        { min: 0, text: '간식 먹고 싶다~' },
      ],
      stressed: [
        { min: 0.8, text: '으으... 빨리 씻겨줘! 😣' },
        { min: 0.5, text: '좀 찝찝한 기분이야...' },
        { min: 0, text: '씻으면 기분 좋아질 것 같아~' },
      ],
      sad: [
        { min: 0.8, text: '아무도 나한테 관심 없나 봐... 😢' },
        { min: 0.5, text: '좀 외로워...' },
        { min: 0, text: '쓰다듬어 주면 좋겠다~' },
      ],
      happy: [
        { min: 0.7, text: '기분이 너무 좋아! 😊' },
        { min: 0, text: '오늘 좋은 하루야~ ✨' },
      ],
      excited: [
        { min: 0.8, text: '와아아! 최고의 기분이야!! 🎉' },
        { min: 0, text: '신난다! 😆' },
      ],
      loved: [
        { min: 0.8, text: '너무 행복해... 사랑해! 💕' },
        { min: 0, text: '사랑받고 있는 느낌~ 🥰' },
      ],
      bored: [
        { min: 0.5, text: '심심해... 뭐 하고 놀까? 😑' },
        { min: 0, text: '할 거 없나~' },
      ],
      tired: [
        { min: 0.7, text: 'zzZ... 졸려... 😴' },
        { min: 0, text: '좀 쉬고 싶다~' },
      ],
      default: [
        { min: 0, text: '혜달이가 기다리고 있어요!' },
      ],
    };

    const pool = messages[mood] || messages.default;
    const message = (pool.find(m => intensity >= m.min) || pool[pool.length - 1]).text;

    return { mood, intensity, message, wellness, warnings };
  }

  // === 공개 API ===

  function init(callback) {
    onChange = callback;
    API.startPolling(updateFromServer);
  }

  function getState() {
    return { ...state };
  }

  async function feed(message) {
    if (isOnCooldown('feed')) return { ok: false, msg: '아직 배부른 것 같아요!' };
    lastAction.feed = Date.now();
    const result = await API.doAction('feed', message);
    if (result.ok && result.stats) updateFromServer(result.stats);
    return result;
  }

  async function wash(message) {
    if (isOnCooldown('wash')) return { ok: false, msg: '아직 깨끗해요!' };
    lastAction.wash = Date.now();
    const result = await API.doAction('wash', message);
    if (result.ok && result.stats) updateFromServer(result.stats);
    return result;
  }

  async function pet(message) {
    if (isOnCooldown('pet')) return { ok: false, msg: '기분 좋아~ 잠깐만!' };
    lastAction.pet = Date.now();
    const result = await API.doAction('pet', message);
    if (result.ok && result.stats) updateFromServer(result.stats);
    return result;
  }

  function destroy() {
    API.stopPolling();
  }

  return {
    init,
    getState,
    feed,
    wash,
    pet,
    getAutoMood,
    getMoodDetails,
    getWellnessScore,
    getWarnings,
    destroy,
    THRESHOLD,
  };
})();

/**
 * 알림 모듈
 * 뽀모도로 완료 시 '첨벙!' 물소리 + 브라우저 알림
 */
const Notification_ = (() => {
  let audioCtx = null;

  function getAudioCtx() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtx;
  }

  /** Web Audio API로 '첨벙!' 물소리 생성 */
  function playSplash() {
    try {
      const ctx = getAudioCtx();
      const now = ctx.currentTime;

      // --- 1) 물방울 버블 (톤 2개) ---
      [400, 600].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.4, now + 0.3);

        filter.type = 'bandpass';
        filter.frequency.value = freq;
        filter.Q.value = 2;

        gain.gain.setValueAtTime(0.3, now + i * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4 + i * 0.05);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + i * 0.05);
        osc.stop(now + 0.5 + i * 0.05);
      });

      // --- 2) 물 튀기는 소리 (노이즈 버스트) ---
      const bufferSize = ctx.sampleRate * 0.4;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.15));
      }

      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuffer;

      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.value = 800;
      noiseFilter.Q.value = 0.8;

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.5, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(ctx.destination);

      noise.start(now);
      noise.stop(now + 0.4);

      // --- 3) 잔물결 (딜레이된 작은 버블들) ---
      [0.2, 0.35, 0.45].forEach((delay, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        const f = 300 + Math.random() * 400;
        osc.frequency.setValueAtTime(f, now + delay);
        osc.frequency.exponentialRampToValueAtTime(f * 0.5, now + delay + 0.15);

        gain.gain.setValueAtTime(0.1 - i * 0.025, now + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.15);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + delay);
        osc.stop(now + delay + 0.2);
      });

    } catch (e) {
      // Web Audio API 미지원 시 무시
    }
  }

  /** 브라우저 Notification 권한 요청 */
  function requestPermission() {
    if ('Notification' in window && window.Notification.permission === 'default') {
      window.Notification.requestPermission();
    }
  }

  /** 브라우저 알림 표시 */
  function showBrowserNotification(title, body) {
    if (!('Notification' in window)) return;
    if (window.Notification.permission !== 'granted') return;

    try {
      new window.Notification(title, {
        body: body,
        icon: 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><text y="50" font-size="50">🦦</text></svg>'),
        tag: 'hyeotter-timer',
      });
    } catch (e) {
      // 알림 실패 시 무시
    }
  }

  /** 뽀모도로 완료 알림 (소리 + 브라우저 알림) */
  function notifyTimerComplete(isBreak, pomoCount) {
    playSplash();

    if (isBreak) {
      showBrowserNotification(
        '첨벙! 집중 시간 끝! 🦦',
        `${pomoCount}번째 뽀모도로 완료! 잠깐 쉬어가자~`
      );
    } else {
      showBrowserNotification(
        '첨벙! 휴식 끝! 🦦',
        '다시 집중할 시간이야! 화이팅!'
      );
    }
  }

  return { requestPermission, notifyTimerComplete, playSplash };
})();

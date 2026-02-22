/**
 * 상태 공유 모듈
 * URL 파라미터로 현재 상태를 인코딩하여 공유합니다.
 */
const Share = (() => {
  let onLoadShared = null;

  /** 현재 상태를 URL 파라미터로 인코딩 */
  function encodeState(data) {
    const params = new URLSearchParams();
    if (data.mood) params.set('m', data.mood);
    if (data.hunger != null) params.set('h', data.hunger);
    if (data.happiness != null) params.set('hp', data.happiness);
    if (data.energy != null) params.set('e', data.energy);
    if (data.level != null) params.set('lv', data.level);
    if (data.timerRunning) params.set('tr', '1');
    if (data.timerBreak) params.set('tb', '1');
    if (data.pomoCount) params.set('pc', data.pomoCount);
    if (data.message) params.set('msg', data.message);
    if (data.todos && data.todos.length > 0) {
      params.set('td', JSON.stringify(data.todos.slice(0, 5).map(t => t.text)));
    }
    return params.toString();
  }

  /** URL 파라미터에서 상태 디코딩 */
  function decodeState(search) {
    const params = new URLSearchParams(search);
    if (!params.has('m') && !params.has('h')) return null;

    const data = {};
    if (params.has('m')) data.mood = params.get('m');
    if (params.has('h')) data.hunger = Number(params.get('h'));
    if (params.has('hp')) data.happiness = Number(params.get('hp'));
    if (params.has('e')) data.energy = Number(params.get('e'));
    if (params.has('lv')) data.level = Number(params.get('lv'));
    if (params.has('tr')) data.timerRunning = true;
    if (params.has('tb')) data.timerBreak = true;
    if (params.has('pc')) data.pomoCount = Number(params.get('pc'));
    if (params.has('msg')) data.message = params.get('msg');
    if (params.has('td')) {
      try { data.todos = JSON.parse(params.get('td')); } catch (e) { /* 무시 */ }
    }
    return data;
  }

  /** 공유 URL 생성 */
  function generateUrl(stateData) {
    const encoded = encodeState(stateData);
    const base = window.location.origin + window.location.pathname;
    return base + '?' + encoded;
  }

  /** 공유 모달 열기 */
  function openModal(stateData) {
    const $modal = document.getElementById('share-modal');
    const $url = document.getElementById('share-url');
    const $preview = document.getElementById('share-preview');

    if (!$modal) return;

    const url = generateUrl(stateData);
    if ($url) $url.value = url;

    // 미리보기 렌더링
    if ($preview) {
      const moodName = Mood.getMoodName(stateData.mood) || '기본';
      const status = stateData.timerRunning
        ? (stateData.timerBreak ? '☕ 휴식 중' : '🍅 집중 중')
        : '대기 중';

      $preview.innerHTML = `
        <div class="preview-otter">${OtterSVG.render(stateData.mood || 'default')}</div>
        <div class="preview-mood">기분: ${moodName}</div>
        <div class="preview-status">${status} · Lv.${stateData.level || 1}</div>
      `;
    }

    $modal.hidden = false;
  }

  function closeModal() {
    const $modal = document.getElementById('share-modal');
    if ($modal) $modal.hidden = true;
  }

  function copyUrl() {
    const $url = document.getElementById('share-url');
    if (!$url) return;
    $url.select();
    try {
      navigator.clipboard.writeText($url.value);
    } catch (e) {
      document.execCommand('copy');
    }
  }

  function init(callback) {
    onLoadShared = callback;

    // 이벤트 바인딩
    const $shareBtn = document.getElementById('share-btn');
    const $copyBtn = document.getElementById('copy-url');
    const $closeBtn = document.getElementById('close-modal');
    const $backdrop = document.querySelector('.modal__backdrop');

    if ($shareBtn) $shareBtn.addEventListener('click', () => {
      if (onLoadShared) {
        const state = onLoadShared();
        openModal(state);
      }
    });
    if ($copyBtn) $copyBtn.addEventListener('click', copyUrl);
    if ($closeBtn) $closeBtn.addEventListener('click', closeModal);
    if ($backdrop) $backdrop.addEventListener('click', closeModal);

    // URL에 공유 데이터가 있으면 읽기 모드로 표시
    const shared = decodeState(window.location.search);
    return shared;
  }

  return { init, generateUrl, decodeState };
})();

/**
 * 상태 공유 모듈
 * 서버에 모든 상태가 저장되므로 페이지 URL만 공유합니다.
 */
const Share = (() => {
  function openModal() {
    const $modal = document.getElementById('share-modal');
    const $url = document.getElementById('share-url');
    if (!$modal) return;

    const url = window.location.origin + window.location.pathname;
    if ($url) $url.value = url;
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

  function init() {
    const $shareBtn = document.getElementById('share-btn');
    const $copyBtn = document.getElementById('copy-url');
    const $closeBtn = document.getElementById('close-modal');
    const $backdrop = document.querySelector('.modal__backdrop');

    if ($shareBtn) $shareBtn.addEventListener('click', openModal);
    if ($copyBtn) $copyBtn.addEventListener('click', copyUrl);
    if ($closeBtn) $closeBtn.addEventListener('click', closeModal);
    if ($backdrop) $backdrop.addEventListener('click', closeModal);
  }

  return { init };
})();

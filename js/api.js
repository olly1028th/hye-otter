/**
 * API 통신 모듈
 * 서버와 통신하여 공유 상태를 관리합니다.
 */
const API = (() => {
  const POLL_INTERVAL = 3000;
  let pollTimer = null;
  let onChange = null;

  async function fetchStats() {
    try {
      const res = await fetch('/api/stats');
      if (!res.ok) throw new Error(res.status);
      return await res.json();
    } catch (e) {
      return null;
    }
  }

  async function doAction(action) {
    try {
      const res = await fetch('/api/action/' + action, { method: 'POST' });
      if (!res.ok) throw new Error(res.status);
      return await res.json();
    } catch (e) {
      return { ok: false, msg: '서버 연결에 실패했어요 😢' };
    }
  }

  async function poll() {
    const stats = await fetchStats();
    if (stats && onChange) onChange(stats);
  }

  function startPolling(callback) {
    onChange = callback;
    poll();
    pollTimer = setInterval(poll, POLL_INTERVAL);
  }

  function stopPolling() {
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
  }

  return { fetchStats, doAction, startPolling, stopPolling };
})();

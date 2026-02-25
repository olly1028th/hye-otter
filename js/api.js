/**
 * API 통신 모듈
 * 서버와 통신하여 공유 상태를 관리합니다.
 * 연결 실패 시 오프라인 배너를 표시합니다.
 */
const API = (() => {
  const POLL_INTERVAL = 3000;
  let pollTimer = null;
  let onChange = null;
  let connected = false;
  let failCount = 0;

  function updateBanner(isConnected) {
    if (connected === isConnected && failCount > 1) return;
    connected = isConnected;
    let banner = document.getElementById('api-status-banner');
    if (!isConnected) {
      if (!banner) {
        banner = document.createElement('div');
        banner.id = 'api-status-banner';
        banner.className = 'api-banner api-banner--offline';
        banner.textContent = '서버에 연결할 수 없어요 — 로컬 모드로 동작 중';
        const app = document.getElementById('app');
        if (app) app.prepend(banner);
      }
      banner.hidden = false;
    } else if (banner) {
      banner.hidden = true;
    }
  }

  async function fetchStats() {
    try {
      const res = await fetch('/api/stats');
      if (!res.ok) throw new Error(res.status);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      failCount = 0;
      updateBanner(true);
      return data;
    } catch (e) {
      failCount++;
      if (failCount >= 2) updateBanner(false);
      return null;
    }
  }

  async function doAction(action, message) {
    try {
      const body = {};
      if (message) body.message = message;
      const res = await fetch('/api/action/' + action, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(res.status);
      return await res.json();
    } catch (e) {
      return { ok: false, msg: '서버 연결에 실패했어요 😢' };
    }
  }

  async function setMood(mood) {
    try {
      const res = await fetch('/api/mood', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mood }),
      });
      if (!res.ok) throw new Error(res.status);
      return await res.json();
    } catch (e) {
      return { ok: false, msg: '서버 연결에 실패했어요 😢' };
    }
  }

  async function getLogs() {
    try {
      const res = await fetch('/api/logs');
      if (!res.ok) throw new Error(res.status);
      return await res.json();
    } catch (e) {
      return { logs: [], today: { total: 0 } };
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

  function isConnected() {
    return connected;
  }

  return { fetchStats, doAction, setMood, getLogs, startPolling, stopPolling, isConnected };
})();

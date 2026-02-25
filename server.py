#!/usr/bin/env python3
"""
혜달이의 상태 - 백엔드 서버
SQLite로 공유 상태 관리 + 정적 파일 서빙
"""
import http.server
import json
import sqlite3
import time
import os
import urllib.parse
from collections import defaultdict

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'hyeotter.db')
STATIC_DIR = os.path.dirname(os.path.abspath(__file__))

# --- 레이트 리밋: IP별 요청 기록 ---
_rate_log = defaultdict(list)
ACTION_COOLDOWN = 2  # 액션 최소 간격 (초)
VALID_ACTIONS = {'feed', 'wash', 'pet'}  # 허용된 액션 목록
VALID_MOODS = {'gaming', 'studying', 'resting', 'sleeping', 'eating', 'out'}


def check_rate_limit(ip, max_per_min=60):
    """IP당 분당 최대 요청 수 제한. 초과 시 False 반환."""
    now = time.time()
    _rate_log[ip] = [t for t in _rate_log[ip] if now - t < 60]
    if len(_rate_log[ip]) >= max_per_min:
        return False
    _rate_log[ip].append(now)
    return True

# 분당 감소율
DECAY_PER_MIN = {
    'fullness': 2,
    'cleanliness': 1,
    'happiness': 1,
}


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db()
    conn.execute('''CREATE TABLE IF NOT EXISTS otter_stats (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        fullness REAL NOT NULL DEFAULT 50,
        cleanliness REAL NOT NULL DEFAULT 50,
        happiness REAL NOT NULL DEFAULT 50,
        exp INTEGER NOT NULL DEFAULT 0,
        level INTEGER NOT NULL DEFAULT 1,
        last_update REAL NOT NULL
    )''')
    # mood 컬럼 추가 (기존 DB 호환)
    try:
        conn.execute('ALTER TABLE otter_stats ADD COLUMN mood TEXT DEFAULT NULL')
    except sqlite3.OperationalError:
        pass  # 이미 존재
    # 돌봄 기록 테이블
    conn.execute('''CREATE TABLE IF NOT EXISTS action_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        action TEXT NOT NULL,
        message TEXT,
        created_at REAL NOT NULL
    )''')
    conn.execute(
        'INSERT OR IGNORE INTO otter_stats (id, last_update) VALUES (1, ?)',
        (time.time(),)
    )
    conn.commit()
    conn.close()


def clamp(v):
    return round(max(0, min(100, v)), 1)


def apply_decay(conn):
    row = conn.execute('SELECT * FROM otter_stats WHERE id = 1').fetchone()
    now = time.time()
    elapsed = (now - row['last_update']) / 60

    if elapsed < 0.05:
        return

    fullness = max(0, row['fullness'] - elapsed * DECAY_PER_MIN['fullness'])
    cleanliness = max(0, row['cleanliness'] - elapsed * DECAY_PER_MIN['cleanliness'])
    happiness = max(0, row['happiness'] - elapsed * DECAY_PER_MIN['happiness'])

    conn.execute(
        '''UPDATE otter_stats SET
        fullness=?, cleanliness=?, happiness=?, last_update=?
        WHERE id=1''',
        (fullness, cleanliness, happiness, now)
    )
    conn.commit()


def get_stats_dict(conn):
    apply_decay(conn)
    row = conn.execute('SELECT * FROM otter_stats WHERE id = 1').fetchone()
    last_log = conn.execute(
        'SELECT created_at FROM action_logs ORDER BY created_at DESC LIMIT 1'
    ).fetchone()
    return {
        'fullness': clamp(row['fullness']),
        'cleanliness': clamp(row['cleanliness']),
        'happiness': clamp(row['happiness']),
        'exp': row['exp'],
        'expNeeded': 80 + row['level'] * 20,
        'level': row['level'],
        'mood': row['mood'],
        'lastActionAt': last_log['created_at'] if last_log else 0,
    }


def handle_action(action, message=None):
    # 입력 검증: 허용된 액션만 통과
    if action not in VALID_ACTIONS:
        return {'ok': False, 'msg': '알 수 없는 행동이에요'}

    conn = get_db()
    apply_decay(conn)
    row = conn.execute('SELECT * FROM otter_stats WHERE id = 1').fetchone()

    fullness = row['fullness']
    cleanliness = row['cleanliness']
    happiness = row['happiness']
    exp = row['exp']
    level = row['level']

    if action == 'feed':
        fullness = min(100, fullness + 25)
        happiness = min(100, happiness + 5)
        msg = '조개다! 냠냠 맛있어~ 🐚'
        otter_state = 'eating'
        exp += 10
    elif action == 'wash':
        cleanliness = min(100, cleanliness + 25)
        happiness = min(100, happiness + 5)
        msg = '뽀득뽀득! 깨끗해졌다~ 🧼'
        otter_state = 'playing'
        exp += 10
    elif action == 'pet':
        happiness = min(100, happiness + 20)
        cleanliness = min(100, cleanliness + 5)
        msg = '좋아좋아~ 더 해줘! 💕'
        otter_state = 'happy'
        exp += 5
    else:
        conn.close()
        return {'ok': False, 'msg': '알 수 없는 행동이에요'}

    leveled = False
    exp_needed = 80 + level * 20
    if exp >= exp_needed:
        exp -= exp_needed
        level += 1
        leveled = True

    now = time.time()
    conn.execute(
        '''UPDATE otter_stats SET
        fullness=?, cleanliness=?, happiness=?, exp=?, level=?, last_update=?
        WHERE id=1''',
        (fullness, cleanliness, happiness, exp, level, now)
    )
    # 돌봄 기록 저장
    clean_msg = (message or '').strip()[:30]
    conn.execute(
        'INSERT INTO action_logs (action, message, created_at) VALUES (?, ?, ?)',
        (action, clean_msg if clean_msg else None, now)
    )
    # 오래된 기록 정리 (최근 50개만 유지)
    conn.execute('''
        DELETE FROM action_logs WHERE id NOT IN (
            SELECT id FROM action_logs ORDER BY created_at DESC LIMIT 50
        )
    ''')
    conn.commit()

    stats = get_stats_dict(conn)
    conn.close()

    return {
        'ok': True,
        'msg': msg,
        'state': 'levelup' if leveled else otter_state,
        'leveled': leveled,
        'stats': stats,
    }


def set_mood(mood):
    if mood not in VALID_MOODS:
        return {'ok': False, 'msg': '알 수 없는 상태예요'}
    conn = get_db()
    conn.execute('UPDATE otter_stats SET mood = ? WHERE id = 1', (mood,))
    conn.commit()
    conn.close()
    return {'ok': True, 'mood': mood}


def get_logs(limit=20):
    conn = get_db()
    rows = conn.execute(
        'SELECT id, action, message, created_at FROM action_logs ORDER BY created_at DESC LIMIT ?',
        (limit,)
    ).fetchall()
    # 오늘의 요약
    import calendar
    from datetime import datetime, timezone
    now = datetime.now(timezone.utc)
    today_start = calendar.timegm(now.replace(hour=0, minute=0, second=0, microsecond=0).timetuple())
    today_rows = conn.execute(
        'SELECT action, COUNT(*) as cnt FROM action_logs WHERE created_at >= ? GROUP BY action',
        (today_start,)
    ).fetchall()
    conn.close()

    logs = [{'id': r['id'], 'action': r['action'], 'message': r['message'], 'created_at': r['created_at']} for r in rows]
    today = {r['action']: r['cnt'] for r in today_rows}
    total_today = sum(today.values())

    return {'logs': logs, 'today': {'total': total_today, **today}}


class OtterHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=STATIC_DIR, **kwargs)

    def _read_body(self):
        length = int(self.headers.get('Content-Length', 0))
        if length > 0:
            return json.loads(self.rfile.read(length))
        return {}

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == '/api/stats':
            conn = get_db()
            stats = get_stats_dict(conn)
            conn.close()
            self._json(stats)
        elif parsed.path == '/api/logs':
            result = get_logs()
            self._json(result)
        elif parsed.path == '/api/health':
            self._health_check()
        else:
            super().do_GET()

    def _health_check(self):
        """서버 + DB 상태 확인"""
        try:
            conn = get_db()
            conn.execute('SELECT 1').fetchone()
            conn.close()
            self._json({'status': 'ok', 'db': 'connected', 'time': time.time()})
        except Exception as e:
            self._json({'status': 'error', 'db': 'disconnected', 'error': str(e)}, 500)

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path.startswith('/api/action/'):
            # 레이트 리밋 체크
            client_ip = self.client_address[0]
            if not check_rate_limit(client_ip):
                self._json({'ok': False, 'msg': '너무 빨라요! 잠시 후 다시 시도해주세요 🦦'}, 429)
                return
            body = self._read_body()
            action = parsed.path.rsplit('/', 1)[-1]
            message = body.get('message', '')
            result = handle_action(action, message)
            self._json(result)
        elif parsed.path == '/api/mood':
            body = self._read_body()
            mood = body.get('mood', '')
            result = set_mood(mood)
            self._json(result)
        else:
            self.send_error(404)

    def do_OPTIONS(self):
        """CORS preflight 요청 처리"""
        self.send_response(204)
        self._cors_headers()
        self.end_headers()

    def _cors_headers(self):
        """CORS 헤더 추가"""
        origin = self.headers.get('Origin', '')
        allowed = os.environ.get('ALLOWED_ORIGIN', '*')
        self.send_header('Access-Control-Allow-Origin', allowed)
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Access-Control-Max-Age', '86400')

    def _json(self, data, status=200):
        body = json.dumps(data, ensure_ascii=False).encode('utf-8')
        self.send_response(status)
        self._cors_headers()
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', len(body))
        self.send_header('Cache-Control', 'no-cache')
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, fmt, *args):
        pass


if __name__ == '__main__':
    init_db()
    port = int(os.environ.get('PORT', 8080))
    with http.server.HTTPServer(('', port), OtterHandler) as srv:
        print(f'🦦 혜달이 서버 시작! http://localhost:{port}')
        srv.serve_forever()

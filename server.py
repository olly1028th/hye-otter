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

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'hyeotter.db')
STATIC_DIR = os.path.dirname(os.path.abspath(__file__))

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
    return {
        'fullness': clamp(row['fullness']),
        'cleanliness': clamp(row['cleanliness']),
        'happiness': clamp(row['happiness']),
        'exp': row['exp'],
        'expNeeded': 80 + row['level'] * 20,
        'level': row['level'],
    }


def handle_action(action):
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

    conn.execute(
        '''UPDATE otter_stats SET
        fullness=?, cleanliness=?, happiness=?, exp=?, level=?, last_update=?
        WHERE id=1''',
        (fullness, cleanliness, happiness, exp, level, time.time())
    )
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


class OtterHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=STATIC_DIR, **kwargs)

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == '/api/stats':
            conn = get_db()
            stats = get_stats_dict(conn)
            conn.close()
            self._json(stats)
        else:
            super().do_GET()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path.startswith('/api/action/'):
            action = parsed.path.rsplit('/', 1)[-1]
            result = handle_action(action)
            self._json(result)
        else:
            self.send_error(404)

    def _json(self, data):
        body = json.dumps(data, ensure_ascii=False).encode('utf-8')
        self.send_response(200)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', len(body))
        self.send_header('Cache-Control', 'no-cache')
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, fmt, *args):
        pass


if __name__ == '__main__':
    init_db()
    port = 8080
    with http.server.HTTPServer(('', port), OtterHandler) as srv:
        print(f'🦦 혜달이 서버 시작! http://localhost:{port}')
        srv.serve_forever()

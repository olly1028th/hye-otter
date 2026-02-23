"""
혜달이 서버리스 공유 DB 모듈
Vercel 서버리스 환경에서는 /tmp 에 SQLite 저장
"""
import sqlite3
import time
import os

DB_PATH = '/tmp/hyeotter.db'

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
    init_db()
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

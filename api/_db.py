"""
혜달이 서버리스 공유 DB 모듈 - Supabase 연동
환경변수: SUPABASE_URL, SUPABASE_KEY
"""
import os
import time
from supabase import create_client

SUPABASE_URL = os.environ.get('SUPABASE_URL', '')
SUPABASE_KEY = os.environ.get('SUPABASE_KEY', '')

DECAY_PER_MIN = {
    'fullness': 2,
    'cleanliness': 1,
    'happiness': 1,
}


def get_sb():
    return create_client(SUPABASE_URL, SUPABASE_KEY)


def get_row(sb):
    res = sb.table('otter_stats').select('*').eq('id', 1).execute()
    if res.data:
        return res.data[0]
    # 첫 실행: 초기 데이터 삽입
    sb.table('otter_stats').insert({
        'id': 1,
        'fullness': 50,
        'cleanliness': 50,
        'happiness': 50,
        'exp': 0,
        'level': 1,
        'last_update': time.time(),
    }).execute()
    return sb.table('otter_stats').select('*').eq('id', 1).execute().data[0]


def clamp(v):
    return round(max(0, min(100, v)), 1)


def apply_decay(sb, row):
    now = time.time()
    elapsed = (now - row['last_update']) / 60

    if elapsed < 0.05:
        return row

    fullness = max(0, row['fullness'] - elapsed * DECAY_PER_MIN['fullness'])
    cleanliness = max(0, row['cleanliness'] - elapsed * DECAY_PER_MIN['cleanliness'])
    happiness = max(0, row['happiness'] - elapsed * DECAY_PER_MIN['happiness'])

    sb.table('otter_stats').update({
        'fullness': fullness,
        'cleanliness': cleanliness,
        'happiness': happiness,
        'last_update': now,
    }).eq('id', 1).execute()

    row = dict(row)
    row.update(fullness=fullness, cleanliness=cleanliness, happiness=happiness, last_update=now)
    return row


def get_stats_dict():
    sb = get_sb()
    row = get_row(sb)
    row = apply_decay(sb, row)
    return {
        'fullness': clamp(row['fullness']),
        'cleanliness': clamp(row['cleanliness']),
        'happiness': clamp(row['happiness']),
        'exp': row['exp'],
        'expNeeded': 80 + row['level'] * 20,
        'level': row['level'],
    }


def handle_action(action):
    sb = get_sb()
    row = get_row(sb)
    row = apply_decay(sb, row)

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
        return {'ok': False, 'msg': '알 수 없는 행동이에요'}

    leveled = False
    exp_needed = 80 + level * 20
    if exp >= exp_needed:
        exp -= exp_needed
        level += 1
        leveled = True

    sb.table('otter_stats').update({
        'fullness': fullness,
        'cleanliness': cleanliness,
        'happiness': happiness,
        'exp': exp,
        'level': level,
        'last_update': time.time(),
    }).eq('id', 1).execute()

    row_updated = sb.table('otter_stats').select('*').eq('id', 1).execute().data[0]
    stats = {
        'fullness': clamp(row_updated['fullness']),
        'cleanliness': clamp(row_updated['cleanliness']),
        'happiness': clamp(row_updated['happiness']),
        'exp': row_updated['exp'],
        'expNeeded': 80 + row_updated['level'] * 20,
        'level': row_updated['level'],
    }

    return {
        'ok': True,
        'msg': msg,
        'state': 'levelup' if leveled else otter_state,
        'leveled': leveled,
        'stats': stats,
    }

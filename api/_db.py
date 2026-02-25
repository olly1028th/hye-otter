"""
혜달이 서버리스 공유 DB 모듈 - Supabase 연동
환경변수: SUPABASE_URL, SUPABASE_KEY
"""
import os
import sys
import time
from supabase import create_client

SUPABASE_URL = os.environ.get('SUPABASE_URL', '')
SUPABASE_KEY = os.environ.get('SUPABASE_KEY', '')

ACTION_COOLDOWN = 2  # 액션 최소 간격 (초)
VALID_ACTIONS = {'feed', 'wash', 'pet'}  # 허용된 액션 목록
VALID_MOODS = {'gaming', 'studying', 'resting', 'sleeping', 'eating', 'out'}

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
        'mood': None,
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
    try:
        sb = get_sb()
        row = get_row(sb)
        row = apply_decay(sb, row)
        last_log = sb.table('action_logs').select('created_at').order(
            'created_at', desc=True
        ).limit(1).execute()
        last_action_at = last_log.data[0]['created_at'] if last_log.data else 0
        return {
            'fullness': clamp(row['fullness']),
            'cleanliness': clamp(row['cleanliness']),
            'happiness': clamp(row['happiness']),
            'exp': row['exp'],
            'expNeeded': 80 + row['level'] * 20,
            'level': row['level'],
            'mood': row.get('mood'),
            'lastActionAt': last_action_at,
        }
    except Exception as e:
        print(f'[ERROR] get_stats_dict: {e}', file=sys.stderr)
        return None


def handle_action(action, message=None):
    # 입력 검증: 허용된 액션만 통과
    if action not in VALID_ACTIONS:
        return {'ok': False, 'msg': '알 수 없는 행동이에요'}

    try:
        sb = get_sb()
        row = get_row(sb)

        # 레이트 리밋: 마지막 업데이트로부터 최소 간격 체크
        if time.time() - row['last_update'] < ACTION_COOLDOWN:
            return {'ok': False, 'msg': '너무 빨라요! 잠시 후 다시 시도해주세요 🦦'}

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

        leveled = False
        exp_needed = 80 + level * 20
        if exp >= exp_needed:
            exp -= exp_needed
            level += 1
            leveled = True

        now = time.time()
        sb.table('otter_stats').update({
            'fullness': fullness,
            'cleanliness': cleanliness,
            'happiness': happiness,
            'exp': exp,
            'level': level,
            'last_update': now,
        }).eq('id', 1).execute()

        # 돌봄 기록 저장
        clean_msg = (message or '').strip()[:30]
        sb.table('action_logs').insert({
            'action': action,
            'message': clean_msg if clean_msg else None,
            'created_at': now,
        }).execute()

        # 오래된 기록 정리 (최근 50개만 유지)
        old_logs = sb.table('action_logs').select('id').order(
            'created_at', desc=True
        ).range(50, 999).execute()
        if old_logs.data:
            old_ids = [r['id'] for r in old_logs.data]
            sb.table('action_logs').delete().in_('id', old_ids).execute()

        row_updated = sb.table('otter_stats').select('*').eq('id', 1).execute().data[0]
        last_log = sb.table('action_logs').select('created_at').order(
            'created_at', desc=True
        ).limit(1).execute()
        stats = {
            'fullness': clamp(row_updated['fullness']),
            'cleanliness': clamp(row_updated['cleanliness']),
            'happiness': clamp(row_updated['happiness']),
            'exp': row_updated['exp'],
            'expNeeded': 80 + row_updated['level'] * 20,
            'level': row_updated['level'],
            'mood': row_updated.get('mood'),
            'lastActionAt': last_log.data[0]['created_at'] if last_log.data else 0,
        }

        return {
            'ok': True,
            'msg': msg,
            'state': 'levelup' if leveled else otter_state,
            'leveled': leveled,
            'stats': stats,
        }
    except Exception as e:
        print(f'[ERROR] handle_action({action}): {e}', file=sys.stderr)
        return {'ok': False, 'msg': '서버에 문제가 생겼어요 😢'}


def set_mood(mood):
    if mood not in VALID_MOODS:
        return {'ok': False, 'msg': '알 수 없는 상태예요'}
    try:
        sb = get_sb()
        sb.table('otter_stats').update({'mood': mood}).eq('id', 1).execute()
        return {'ok': True, 'mood': mood}
    except Exception as e:
        print(f'[ERROR] set_mood({mood}): {e}', file=sys.stderr)
        return {'ok': False, 'msg': '서버에 문제가 생겼어요 😢'}


def get_logs(limit=20):
    try:
        sb = get_sb()
        rows = sb.table('action_logs').select('id, action, message, created_at').order(
            'created_at', desc=True
        ).limit(limit).execute()

        import calendar
        from datetime import datetime, timezone
        now = datetime.now(timezone.utc)
        today_start = calendar.timegm(
            now.replace(hour=0, minute=0, second=0, microsecond=0).timetuple()
        )
        today_rows = sb.table('action_logs').select('action').gte(
            'created_at', today_start
        ).execute()

        logs = [{'id': r['id'], 'action': r['action'], 'message': r['message'], 'created_at': r['created_at']} for r in rows.data]

        today = {}
        for r in today_rows.data:
            today[r['action']] = today.get(r['action'], 0) + 1
        total_today = sum(today.values())

        return {'logs': logs, 'today': {'total': total_today, **today}}
    except Exception as e:
        print(f'[ERROR] get_logs: {e}', file=sys.stderr)
        return {'logs': [], 'today': {'total': 0}}

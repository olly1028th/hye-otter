"""GET /api/health - 서버 + DB 상태 확인"""
from http.server import BaseHTTPRequestHandler
import json
import os
import time
from _db import get_sb

ALLOWED_ORIGIN = os.environ.get('ALLOWED_ORIGIN', '*')


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            sb = get_sb()
            sb.table('otter_stats').select('id').eq('id', 1).execute()
            self._json({'status': 'ok', 'db': 'connected', 'time': time.time()})
        except Exception as e:
            self._json({'status': 'error', 'db': 'disconnected', 'error': str(e)}, 500)

    def _json(self, data, status=200):
        body = json.dumps(data, ensure_ascii=False).encode('utf-8')
        self.send_response(status)
        self.send_header('Access-Control-Allow-Origin', ALLOWED_ORIGIN)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Cache-Control', 'no-cache')
        self.end_headers()
        self.wfile.write(body)

"""GET /api/stats - 혜달이 상태 조회"""
from http.server import BaseHTTPRequestHandler
import json
import os
from _db import get_stats_dict

ALLOWED_ORIGIN = os.environ.get('ALLOWED_ORIGIN', '*')


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        stats = get_stats_dict()
        if stats is None:
            self._json({'error': '서버에 문제가 생겼어요 😢'}, 500)
            return
        self._json(stats)

    def do_OPTIONS(self):
        self.send_response(204)
        self._cors_headers()
        self.end_headers()

    def _cors_headers(self):
        self.send_header('Access-Control-Allow-Origin', ALLOWED_ORIGIN)
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')

    def _json(self, data, status=200):
        body = json.dumps(data, ensure_ascii=False).encode('utf-8')
        self.send_response(status)
        self._cors_headers()
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Cache-Control', 'no-cache')
        self.end_headers()
        self.wfile.write(body)

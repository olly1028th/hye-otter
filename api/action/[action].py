"""POST /api/action/{action} - 혜달이 행동 실행"""
from http.server import BaseHTTPRequestHandler
import json
import os
import sys
from urllib.parse import urlparse

# api/ 디렉토리를 Python 경로에 추가 (상위 모듈 임포트용)
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from _db import handle_action

ALLOWED_ORIGIN = os.environ.get('ALLOWED_ORIGIN', '*')


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        path = urlparse(self.path).path
        action = path.rsplit('/', 1)[-1]
        result = handle_action(action)
        self._json(result)

    def do_OPTIONS(self):
        self.send_response(204)
        self._cors_headers()
        self.end_headers()

    def _cors_headers(self):
        self.send_header('Access-Control-Allow-Origin', ALLOWED_ORIGIN)
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')

    def _json(self, data, status=200):
        body = json.dumps(data, ensure_ascii=False).encode('utf-8')
        self.send_response(status)
        self._cors_headers()
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Cache-Control', 'no-cache')
        self.end_headers()
        self.wfile.write(body)

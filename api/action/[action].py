"""POST /api/action/{action} - 혜달이 행동 실행"""
from http.server import BaseHTTPRequestHandler
import json
from urllib.parse import urlparse
from _db import handle_action


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        # URL에서 action 파라미터 추출
        path = urlparse(self.path).path
        action = path.rsplit('/', 1)[-1]

        result = handle_action(action)

        body = json.dumps(result, ensure_ascii=False).encode('utf-8')
        self.send_response(200)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Cache-Control', 'no-cache')
        self.end_headers()
        self.wfile.write(body)

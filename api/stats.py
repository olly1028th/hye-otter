"""GET /api/stats - 혜달이 상태 조회"""
from http.server import BaseHTTPRequestHandler
import json
from _db import get_stats_dict


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        stats = get_stats_dict()

        body = json.dumps(stats, ensure_ascii=False).encode('utf-8')
        self.send_response(200)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Cache-Control', 'no-cache')
        self.end_headers()
        self.wfile.write(body)

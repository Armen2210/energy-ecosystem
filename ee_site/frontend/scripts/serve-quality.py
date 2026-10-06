"""Serve a local Vite production build with SPA fallback, without compression."""
import argparse
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument('directory', nargs='?', default='dist')
parser.add_argument('--port', type=int, default=4175)
args = parser.parse_args()
root = Path(args.directory).resolve()


class SPA(SimpleHTTPRequestHandler):
    def __init__(self, *handler_args, **kwargs):
        super().__init__(*handler_args, directory=str(root), **kwargs)

    def do_GET(self):
        if not Path(self.translate_path(self.path)).is_file() and '.' not in self.path.rsplit('/', 1)[-1]:
            self.path = '/index.html'
        super().do_GET()


ThreadingHTTPServer(('127.0.0.1', args.port), SPA).serve_forever()

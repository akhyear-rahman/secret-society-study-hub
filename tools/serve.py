#!/usr/bin/env python3
"""Local preview server.

The app is plain static files, but ES modules and fetch() need a real HTTP
origin — opening index.html with file:// will not work. Run this instead:

    python tools/serve.py            # http://localhost:8000
    python tools/serve.py 5173       # a different port

Caching is disabled so edits to a JSON file show on refresh.
"""

from __future__ import annotations

import http.server
import sys
import webbrowser
from functools import partial
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


class Handler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        ".js": "text/javascript",
        ".mjs": "text/javascript",
        ".json": "application/json",
        ".webmanifest": "application/manifest+json",
        ".svg": "image/svg+xml",
        ".md": "text/markdown; charset=utf-8",
    }

    def end_headers(self):
        self.send_header("Cache-Control", "no-store, must-revalidate")
        super().end_headers()

    def log_message(self, fmt, *args):
        # Keep the console readable: only report problems.
        status = args[1] if len(args) > 1 else ""
        if str(status).startswith(("4", "5")):
            super().log_message(fmt, *args)


def main() -> int:
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    handler = partial(Handler, directory=str(ROOT))
    # Threaded, not the single-threaded TCPServer: the app pulls a dozen ES
    # modules plus JSON in parallel, and one stalled connection on a
    # single-threaded server wedges every other request — the page then hangs
    # with nothing on it and no error to show for it.
    http.server.ThreadingHTTPServer.allow_reuse_address = True
    http.server.ThreadingHTTPServer.daemon_threads = True
    try:
        with http.server.ThreadingHTTPServer(("127.0.0.1", port), handler) as httpd:
            url = f"http://localhost:{port}/"
            print(f"Serving {ROOT}\n  {url}\nCtrl-C to stop.")
            try:
                webbrowser.open(url)
            except Exception:
                pass
            httpd.serve_forever()
    except OSError as e:
        print(f"Could not bind port {port}: {e}")
        print("Try another port, e.g.  python tools/serve.py 8001")
        return 1
    except KeyboardInterrupt:
        print("\nStopped.")
    return 0


if __name__ == "__main__":
    sys.exit(main())

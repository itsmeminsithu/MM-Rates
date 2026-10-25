#!/usr/bin/env python3
"""Run the MM Rates UI with realistic mock data and no npm/native SQLite install."""

from __future__ import annotations

import json
import math
import mimetypes
import os
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
PORT = int(os.environ.get("PORT", "3000"))

PAIR_DATA = {
    "USD_MMK_MARKET": (4450.0, 4420.0, 4480.0, "manual-market", 1.25),
    "USD_MMK_OFFICIAL": (2100.0, None, None, "cbm-official", 0.00),
    "THB_MMK_MARKET": (136.2, 135.6, 136.8, "manual-market", -0.35),
    "SGD_MMK_MARKET": (3482.0, 3465.0, 3499.0, "manual-market", 0.44),
    "EUR_MMK_MARKET": (5210.0, 5185.0, 5235.0, "manual-market", -0.12),
    "MYR_MMK_MARKET": (1058.0, 1048.0, 1068.0, "manual-market", 0.18),
    "JPY_MMK_MARKET": (30.7, 30.4, 31.0, "manual-market", 0.09),
    "CNY_MMK_MARKET": (617.0, 612.0, 622.0, "manual-market", -0.08),
    "USDT_MMK_P2P": (4515.0, 4490.0, 4540.0, "binance-p2p", 0.78),
    "GOLD_YGN_KYATTHA": (7_850_000.0, None, None, "manual-gold", 0.22),
    "BTC_USD": (117_540.0, None, None, "coingecko", 2.18),
    "ETH_USD": (6_460.0, None, None, "coingecko", 1.42),
    "USDT_USD": (1.0, None, None, "coingecko", 0.01),
    "XAU_USD_PROXY": (3_340.0, None, None, "coingecko", 0.31),
}


def now_ms() -> int:
    return int(time.time() * 1000)


def rate_rows() -> list[dict]:
    now = now_ms()
    rows = []
    for pair, (mid, buy, sell, source, pct) in PAIR_DATA.items():
        effective = now - (5 * 60_000 if source != "manual-gold" else 25 * 60_000)
        rows.append({
            "pair": pair,
            "source": source,
            "buy": buy,
            "sell": sell,
            "mid": mid,
            "fetched_at": effective,
            "source_published_at": effective,
            "collected_at": now - 30_000,
            "effective_at": effective,
            "timestamp_kind": "source_published",
            "age_ms": now - effective,
            "freshness": "fresh",
            "change24h": {"pct": pct, "old": mid / (1 + pct / 100)} if pct else {"pct": 0, "old": mid},
        })
    return rows


def sources() -> list[dict]:
    now = now_ms()
    return [
        {"source": "market-rates", "core": False, "last_success": now - 300_000, "last_attempt": now - 120_000, "last_data_at": now - 300_000, "last_collected_at": now - 120_000, "last_error": "Automatic community feed is stale; manual verified fallback shown.", "check_status": "error", "accepted_rows": 0, "rejected_rows": 8, "age_ms": 300_000, "checked_age_ms": 120_000, "status": "fresh"},
        {"source": "manual-market", "core": False, "last_success": now - 300_000, "last_attempt": now - 300_000, "last_data_at": now - 300_000, "last_collected_at": now - 300_000, "last_error": None, "check_status": "ok", "accepted_rows": 8, "rejected_rows": 0, "age_ms": 300_000, "checked_age_ms": 300_000, "status": "fresh"},
        {"source": "cbm-official", "core": False, "last_success": now - 600_000, "last_attempt": now - 120_000, "last_data_at": now - 600_000, "last_collected_at": now - 120_000, "last_error": None, "check_status": "ok", "accepted_rows": 1, "rejected_rows": 0, "age_ms": 600_000, "checked_age_ms": 120_000, "status": "fresh"},
        {"source": "coingecko", "core": False, "last_success": now - 300_000, "last_attempt": now - 120_000, "last_data_at": now - 300_000, "last_collected_at": now - 120_000, "last_error": None, "check_status": "ok", "accepted_rows": 4, "rejected_rows": 0, "age_ms": 300_000, "checked_age_ms": 120_000, "status": "fresh"},
        {"source": "binance-p2p", "core": False, "last_success": now - 300_000, "last_attempt": now - 120_000, "last_data_at": now - 300_000, "last_collected_at": now - 120_000, "last_error": None, "check_status": "ok", "accepted_rows": 1, "rejected_rows": 0, "age_ms": 300_000, "checked_age_ms": 120_000, "status": "fresh"},
    ]


def latest_payload(refresh: bool = False) -> dict:
    now = now_ms()
    payload = {
        "server_time": now,
        "data_updated_at": now - 300_000,
        "data_collected_at": now - 120_000,
        "core_updated_at": now - 300_000,
        "collection": {"running": False, "last_attempt_at": now - 120_000},
        "sources": sources(),
        "rates": rate_rows(),
    }
    if refresh:
        payload["refresh"] = {
            "started": True,
            "joined": False,
            "skipped": False,
            "reason": None,
            "next_refresh_in_ms": 600_000,
            "attempted_at": now - 900,
            "finished_at": now,
            "collection_changed": True,
            "changed_pairs": ["USDT_MMK_P2P", "BTC_USD"],
            "success_count": 3,
            "failure_count": 1,
            "failed_sources": ["market-rates"],
            "accepted_rows": 6,
            "rejected_rows": 8,
        }
    return payload


def history(pair: str, range_name: str) -> dict:
    base = PAIR_DATA.get(pair, (100.0, None, None, "demo", 0))[0]
    counts = {"24h": 40, "7d": 50, "30d": 60, "90d": 70}
    steps = {"24h": 36 * 60_000, "7d": 3 * 60 * 60_000, "30d": 12 * 60 * 60_000, "90d": 30 * 60 * 60_000}
    count = counts.get(range_name, 40)
    step = steps.get(range_name, steps["24h"])
    end = now_ms()
    points = []
    for i in range(count):
        wave = math.sin(i / 5.2) * 0.006 + (i / max(1, count - 1) - 0.5) * 0.012
        points.append({"t": end - (count - 1 - i) * step, "mid": round(base * (1 + wave), 4)})
    return {"pair": pair, "range": range_name, "points": points}


class Handler(BaseHTTPRequestHandler):
    server_version = "MMRatesDemo/1.4.1"

    def log_message(self, fmt: str, *args) -> None:
        print(f"[{self.log_date_time_string()}] {fmt % args}")

    def send_json(self, status: int, value: object) -> None:
        data = json.dumps(value, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path == "/v1/latest":
            self.send_json(200, latest_payload())
            return
        if parsed.path == "/v1/history":
            query = parse_qs(parsed.query)
            self.send_json(200, history(query.get("pair", ["USD_MMK_MARKET"])[0], query.get("range", ["24h"])[0]))
            return
        if parsed.path == "/v1/health/live":
            self.send_json(200, {"status": "live", "demo": True})
            return
        if parsed.path == "/v1/health/ready":
            self.send_json(200, {"status": "degraded", "ready": True, "demo": True, "reason": "manual_market_fallback"})
            return
        self.serve_static(parsed.path)

    def do_POST(self) -> None:
        parsed = urlparse(self.path)
        length = int(self.headers.get("Content-Length", "0"))
        if length:
            self.rfile.read(length)
        if parsed.path in {"/v1/refresh", "/v1/sync"}:
            self.send_json(200, latest_payload(refresh=True))
            return
        self.send_json(404, {"error": "not_found"})

    def serve_static(self, request_path: str) -> None:
        relative = "index.html" if request_path in {"", "/"} else request_path.lstrip("/")
        target = (PUBLIC / relative).resolve()
        if not str(target).startswith(str(PUBLIC.resolve())) or not target.is_file():
            self.send_error(404)
            return
        content = target.read_bytes()
        content_type = mimetypes.guess_type(str(target))[0] or "application/octet-stream"
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(content)))
        self.send_header("Cache-Control", "no-cache")
        self.end_headers()
        self.wfile.write(content)


if __name__ == "__main__":
    server = ThreadingHTTPServer(("0.0.0.0", PORT), Handler)
    print(f"MM Rates demo running at http://localhost:{PORT}")
    print("Press Control+C to stop.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()

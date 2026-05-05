from __future__ import annotations

import contextlib
import io
import json
import os
import sys
from pathlib import Path


def read_request() -> dict:
    raw = sys.stdin.read()
    if not raw.strip():
        raise RuntimeError("Empty MetaGPT bridge request")
    return json.loads(raw)


def write_response(payload: dict) -> None:
    sys.stdout.write(json.dumps(payload, ensure_ascii=False))
    sys.stdout.flush()


def load_mock_handler():
    script_dir = Path(__file__).resolve().parent
    if str(script_dir) not in sys.path:
        sys.path.insert(0, str(script_dir))
    from metagpt_bridge_mock import handle_request

    return handle_request


def load_real_handler():
    module_name = os.getenv("METAGPT_RUNNER_MODULE", "metagpt_runner")
    repo_path = os.getenv("METAGPT_REPO_PATH", "").strip()
    if repo_path:
        resolved_repo_path = (Path.cwd() / repo_path).resolve()
        if str(resolved_repo_path) not in sys.path:
            sys.path.insert(0, str(resolved_repo_path))
    module = __import__(module_name, fromlist=["handle_request"])
    handle_request = getattr(module, "handle_request", None)
    if handle_request is None:
        raise RuntimeError(f"{module_name} does not export handle_request")
    return handle_request


def main() -> None:
    request = read_request()
    backend = os.getenv("METAGPT_BACKEND", "mock").strip().lower() or "mock"

    if backend == "mock":
        write_response(load_mock_handler()(request))
        return

    if backend == "metagpt":
        capture = io.StringIO()
        with contextlib.redirect_stdout(capture):
            response = load_real_handler()(request)
        write_response(response)
        return

    raise RuntimeError(f"Unsupported METAGPT_BACKEND: {backend}")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:  # pragma: no cover - bridge level safety
        sys.stderr.write(str(exc))
        sys.exit(1)

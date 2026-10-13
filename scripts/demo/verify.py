"""Verify published demo bytes and truthful capture metadata."""

import hashlib
import json
from pathlib import Path

demo = Path("docs/demo")
capture = json.loads((demo / "capture.json").read_text())
source = json.loads((demo / "source-manifest.json").read_text())
if capture["recorded_application_source_sha"] != source["recorded_application_source_sha"]:
    raise SystemExit("Demo and source manifest disagree")
expected = {"atlas-demo.mp4", "atlas-demo.gif", "poster.png"}
if set(capture["artifacts"]) != expected:
    raise SystemExit("Capture manifest must cover MP4, GIF and poster")
for name, record in capture["artifacts"].items():
    payload = (demo / name).read_bytes()
    actual = hashlib.sha256(payload).hexdigest()
    if len(payload) != record["bytes"] or actual != record["sha256"]:
        raise SystemExit(f"Demo artifact mismatch: {name}")
receipt = capture["browser_receipt"]
if receipt["page_errors"] or receipt["blocked_remote_requests"]:
    raise SystemExit("Published capture records browser errors or unexpected requests")
if receipt["gpx_export"]["bytes"] < 1000:
    raise SystemExit("Published capture does not prove a meaningful GPX export")
if len(capture.get("truth_limits", [])) < 3:
    raise SystemExit("Published capture is missing its evidence limits")
print("Verified demo MP4, GIF and poster bytes plus source and browser receipts")

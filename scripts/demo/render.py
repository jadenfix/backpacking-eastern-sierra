"""Render the reviewed browser-frame timeline as deterministic MP4 and GIF."""

import hashlib
import json
from pathlib import Path
import subprocess

demo = Path("docs/demo")
frames_dir = demo / "frames"
record = json.loads((frames_dir / "frames.json").read_text())
source = json.loads((demo / "source-manifest.json").read_text())
if record["recorded_application_source_sha"] != source["recorded_application_source_sha"]:
    raise SystemExit("Captured frames do not match the pinned application source")
if record["page_errors"] or record["blocked_remote_requests"]:
    raise SystemExit("Capture contains browser errors or unexpected remote requests")
if not record.get("export_receipt"):
    raise SystemExit("Capture did not exercise and validate the GPX export")

frames = record["frames"]
if len(frames) < 40:
    raise SystemExit("Capture is unexpectedly short")
concat = []
for index, frame in enumerate(frames):
    duration = (
        frames[index + 1]["at"] - frame["at"]
        if index + 1 < len(frames)
        else 0.8
    )
    concat.extend([f"file '{frame['name']}'", f"duration {max(duration, 0.04):.4f}"])
concat.append(f"file '{frames[-1]['name']}'")
(frames_dir / "concat.txt").write_text("\n".join(concat) + "\n")

subprocess.run(
    [
        "ffmpeg",
        "-y",
        "-threads",
        "1",
        "-filter_threads",
        "1",
        "-f",
        "concat",
        "-safe",
        "0",
        "-i",
        str(frames_dir / "concat.txt"),
        "-vf",
        "scale=1280:-2:flags=lanczos,fps=12",
        "-c:v",
        "libx264",
        "-threads",
        "1",
        "-preset",
        "veryfast",
        "-crf",
        "22",
        "-pix_fmt",
        "yuv420p",
        "-movflags",
        "+faststart",
        str(demo / "atlas-demo.mp4"),
    ],
    check=True,
)
subprocess.run(
    [
        "ffmpeg",
        "-y",
        "-threads",
        "1",
        "-filter_complex_threads",
        "1",
        "-i",
        str(demo / "atlas-demo.mp4"),
        "-filter_complex",
        "fps=6,scale=960:-2:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=96:stats_mode=diff[p];[s1][p]paletteuse=dither=bayer:bayer_scale=4",
        "-loop",
        "0",
        str(demo / "atlas-demo.gif"),
    ],
    check=True,
)

artifacts = {}
for name in ["atlas-demo.mp4", "atlas-demo.gif", "poster.png"]:
    payload = (demo / name).read_bytes()
    artifacts[name] = {
        "bytes": len(payload),
        "sha256": hashlib.sha256(payload).hexdigest(),
    }
capture = {
    "schema": 1,
    "recorded_application_source_sha": source["recorded_application_source_sha"],
    "scope": "Actual local production-browser workflow over versioned agency-derived planning data and licensed historical photographs. Public basemap/font requests may occur.",
    "truth_limits": [
        "Permit inventory is a historical October 11, 2026 snapshot; nothing was reserved, paid for or issued.",
        "Parking, road access, snow, water, trail conditions and a Class 2 ceiling are not field-verified.",
        "This planning atlas is not safety clearance, a current field report or a hosted-deployment receipt.",
    ],
    "browser_receipt": {
        "chapters": record["chapters"],
        "allowed_remote_domains": record["allowed_remote_domains"],
        "page_errors": record["page_errors"],
        "blocked_remote_requests": record["blocked_remote_requests"],
        "gpx_export": record["export_receipt"],
    },
    "artifacts": artifacts,
}
(demo / "capture.json").write_text(json.dumps(capture, indent=2) + "\n")
print(json.dumps(capture, indent=2))

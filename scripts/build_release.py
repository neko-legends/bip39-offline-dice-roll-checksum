"""Build a deterministic offline release ZIP and its SHA-256 checksum."""

from __future__ import annotations

import argparse
import hashlib
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile, ZipInfo


ROOT = Path(__file__).resolve().parent.parent
RELEASE_FILES = (
    "README.md",
    "index.html",
    "app.js",
    "bip39-wordlist.js",
    "assets/app-screenshot.webp",
    "assets/cat-logo.webp",
)
TEXT_SUFFIXES = {".md", ".html", ".js"}


def normalized_bytes(path: Path) -> bytes:
    data = path.read_bytes()
    if path.suffix in TEXT_SUFFIXES:
        return data.replace(b"\r\n", b"\n").replace(b"\r", b"\n")
    return data


def build(version: str) -> tuple[Path, Path]:
    output_dir = ROOT / "dist"
    output_dir.mkdir(exist_ok=True)
    archive = output_dir / f"bip39-offline-dice-roll-checksum-{version}.zip"

    with ZipFile(archive, "w", compression=ZIP_DEFLATED, compresslevel=9) as bundle:
        for relative_name in RELEASE_FILES:
            source = ROOT / relative_name
            if not source.is_file():
                raise FileNotFoundError(f"Required release file is missing: {relative_name}")
            info = ZipInfo(relative_name, date_time=(2020, 1, 1, 0, 0, 0))
            info.compress_type = ZIP_DEFLATED
            info.create_system = 3
            info.external_attr = 0o100644 << 16
            bundle.writestr(info, normalized_bytes(source), compresslevel=9)

    with ZipFile(archive, "r") as bundle:
        if bundle.testzip() is not None or tuple(bundle.namelist()) != RELEASE_FILES:
            raise RuntimeError("Release ZIP verification failed")

    digest = hashlib.sha256(archive.read_bytes()).hexdigest()
    checksum_file = output_dir / "SHA256SUMS"
    checksum_file.write_text(f"{digest}  {archive.name}\n", encoding="ascii", newline="\n")
    return archive, checksum_file


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--version", default="dev", help="Version used in the ZIP filename")
    args = parser.parse_args()
    archive_path, sums_path = build(args.version)
    print(archive_path.relative_to(ROOT))
    print(sums_path.relative_to(ROOT))

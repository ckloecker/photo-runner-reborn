import html
import re
import sys
from pathlib import Path


def stamp(page: Path, branch: str, commit: str) -> None:
    if not branch or any(character in branch for character in "\r\n"):
        raise ValueError("A valid source branch is required.")
    if not re.fullmatch(r"[0-9a-f]{40}", commit):
        raise ValueError("A full 40-character source commit SHA is required.")
    content = page.read_text(encoding="utf-8")
    for name, value in (
        ("game-source-branch", html.escape(branch, quote=True)),
        ("game-source-commit", commit),
    ):
        pattern = rf'(<meta\s+name="{re.escape(name)}"\s+content=")[^"]*("\s*>)'
        content, replacements = re.subn(pattern, rf"\g<1>{value}\g<2>", content)
        if replacements != 1:
            raise ValueError(f"Expected exactly one {name} metadata tag.")
    page.write_text(content, encoding="utf-8")


if __name__ == "__main__":
    if len(sys.argv) != 4:
        raise SystemExit("Usage: stamp-deployment.py ENTRY_PAGE BRANCH COMMIT_SHA")
    try:
        stamp(Path(sys.argv[1]), sys.argv[2], sys.argv[3])
    except (OSError, ValueError) as error:
        raise SystemExit(str(error)) from error

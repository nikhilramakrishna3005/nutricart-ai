"""
Local dev entrypoint: stable auto-reload (excludes virtualenvs and caches).

Run from the backend directory:
    python dev.py

Uvicorn still watches the project root under the hood, but reload-excludes
filter out ``.venv`` / ``venv`` (and common cache paths) so edits there do not
restart the server.
"""

from __future__ import annotations

import os
from pathlib import Path

import uvicorn


def main() -> None:
    root = Path(__file__).resolve().parent
    os.chdir(root)

    uvicorn.run(
        "app.main:app",
        host="127.0.0.1",
        port=8000,
        reload=True,
        reload_dirs=["app", "data"],
        reload_excludes=[
            ".venv",
            "venv",
            "**/.venv/**",
            "**/venv/**",
            "**/__pycache__/**",
            "**/__pycache__",
            "**/*.pyc",
            "**/*.pyo",
        ],
    )


if __name__ == "__main__":
    main()

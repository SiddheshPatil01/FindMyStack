# FindMyStack

Type what you want to build. Laya reads the idea, and you get the simplest stack that fits.

## Run

Double-click `start.bat`. It opens http://127.0.0.1:8765. Laya takes about 45 s to load; the page shows when it is ready.

It uses the Laya venv at `%USERPROFILE%\laya\.venv` if present, otherwise `python` on your PATH.
If the Laya English checkpoint is already in the Hugging Face cache it loads offline; otherwise it downloads once.
Override with `LAYA_PY` (python.exe) and `LAYA_MODEL_PATH` (checkpoint folder or hub id).

Fresh machine: `pip install -r requirements.txt`, then run `start.bat` (or `python -m uvicorn app:app --port 8765`).

## How it decides

1. **Laya** (one forward pass, ~5 s on CPU) answers five typed questions about the idea:
   project type (11 options), user scale (0-3), and yes/no for payments, live updates and AI.
2. **Keyword cues** from your own words ("phone", "game", "Chrome extension", "subscription") narrow the type,
   and Laya picks among the cued options. On 14 test ideas Laya alone got 11 right; the cues fix the misses.
3. **Stack rules** in `static/stacks.js` turn type + needs + scale + the language you know into concrete picks.
   AI turns on only when you mention AI (Laya over-calls it). Payments and live updates also accept a Laya yes at 50%+.
   You can click any part of Laya's read to correct it and the stack updates instantly, without rerunning Laya.

## Files

- `app.py` FastAPI server
- `reader.py` Laya questions + keyword cues
- `static/stacks.js` the stack rules (edit these to change recommendations)
- `static/app.js`, `static/index.html`, `static/style.css` the UI

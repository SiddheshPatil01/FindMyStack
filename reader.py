import os
import re
import threading
import time
from pathlib import Path

LOCAL_SNAPSHOT = Path.home() / ".cache/huggingface/hub/models--convaiinnovations--laya/snapshots/1c5edc17a7acd8701df6fc341c0d179f1c62c982"

MODEL_PATH = os.environ.get("LAYA_MODEL_PATH") or (str(LOCAL_SNAPSHOT) if LOCAL_SNAPSHOT.exists() else "convaiinnovations/laya")
if Path(MODEL_PATH).exists():
    os.environ.setdefault("HF_HUB_OFFLINE", "1")

import laya

QUESTIONS = {
    "kind": {
        "type": "choice",
        "instructions": "What kind of software does the person want to build?",
        "criteria": {
            "website": "marketing site, portfolio, blog or docs",
            "webapp": "web app or SaaS with users and dashboards",
            "mobile": "app installed on an iPhone or Android phone",
            "api": "backend API or service with no UI",
            "ai": "AI chatbot, assistant or ML tool",
            "data": "data dashboard, reports or analytics",
            "desktop": "program installed on Windows or Mac",
            "script": "script, CLI or automation bot",
            "game": "a game people play",
            "store": "online shop selling products",
            "extension": "Chrome or Firefox browser extension",
        },
    },
    "scale": {
        "type": "score",
        "instructions": "How many users will it need to serve?",
        "criteria": ["just me", "a small group", "thousands", "millions"],
    },
    "payments": {"type": "noul", "instructions": "Will it charge money, sell items or bill subscriptions?"},
    "realtime": {"type": "noul", "instructions": "Must several people see changes instantly, like chat or live play?"},
    "ai": {"type": "noul", "instructions": "Does it use AI or a language model?"},
}


def _rx(pattern):
    return re.compile(pattern, re.I)


KIND_CUES = {
    "website": _rx(r"\b(portfolio|blog|landing page|marketing (site|website)|personal (site|website)|docs site|documentation site)\b"),
    "webapp": _rx(r"\b(saas|crm|web ?app|admin panel|portal)\b"),
    "mobile": _rx(r"\b(iphone|android|ios|mobile app|phone app|on (my|their|your) phones?|app store|play store)\b"),
    "api": _rx(r"\b(rest api|graphql|api|apis|endpoints?|microservices?|webhooks?)\b"),
    "ai": _rx(r"\b(chat ?bot|llm|gpt|chatgpt|rag|ai (assistant|agent|bot|tool)|machine learning|ml model)\b"),
    "data": _rx(r"\b(dashboards?|analytics|reports?|reporting|charts?|kpis?)\b"),
    "desktop": _rx(r"\b(desktop( app)?|windows app|mac app|macos app|on my (laptop|pc|computer))\b"),
    "script": _rx(r"\b(script|cli|command[- ]line|cron|scheduled job|automate|automation|scraper|scrape)\b"),
    "game": _rx(r"\b(game|games|gaming|multiplayer|platformer|rpg)\b"),
    "store": _rx(r"\b(e-?commerce|online (shop|store)|web ?shop|storefront|shop|sell(ing|s)? (my |our )?(products|handmade|items|goods|clothes|merch|candles))\b"),
    "extension": _rx(r"\b((chrome|firefox|edge|browser) (extension|add-?on|plugin)s?|extension for (chrome|firefox|edge))\b"),
}

FLAG_CUES = {
    "login": _rx(r"\b(log ?in|sign ?(in|up)|accounts?|users?|members?|profiles?|follow)\b|(?<!to )(?<!on )(?<!in )(?<!microsoft )(?<!ms )\bteams?\b"),
    "payments": _rx(r"\b(pay|paid|payments?|subscriptions?|billing|checkout|stripe|charge|charging|sell|selling|sells|pricing|rent(ing)? out|fees?)\b"),
    "realtime": _rx(r"\b(real[- ]?time|live|chat|chatting|multiplayer|collaborat\w*|instantly|notifications?|websockets?)\b"),
    "ai": _rx(r"\b(ai|llm|gpt|chatgpt|claude|gemini|chat ?bot|machine learning|ml|rag|embeddings?|openai|anthropic)\b"),
}

SCALE_CUES = [
    (3, _rx(r"\b(millions?|at scale|high traffic|huge traffic)\b")),
    (2, _rx(r"\b(thousands?|lots of (users|people|customers))\b")),
    (1, _rx(r"\b(my (team|family|wife|husband|partner|friends|class|office)|small team|our team|me and my)\b")),
    (0, _rx(r"\b(just me|only me|for myself|personal use|for me)\b")),
]

LANG_CUES = [
    ("ts", _rx(r"\b(typescript|javascript|react|node(\.?js)?|next\.?js|vue|angular|svelte)\b")),
    ("py", _rx(r"\b(python|django|flask|fastapi|pandas)\b")),
    ("net", _rx(r"(\bc#|\.net\b|\bdotnet\b|\basp\.net\b|\bblazor\b)")),
    ("java", _rx(r"\b(java|spring( boot)?|kotlin)\b")),
    ("go", _rx(r"\b(golang|go lang|in go|using go)\b")),
]


def _first(rx, text):
    m = rx.search(text)
    return m.group(0) if m else None


class Reader:
    def __init__(self):
        self._agent = None
        self._lock = threading.Lock()
        self._cache = {}
        self.state = "loading"
        self.error = None
        self.load_seconds = None

    def load(self):
        t0 = time.perf_counter()
        try:
            agent = laya.load(MODEL_PATH)
            agent.predict("A simple website", QUESTIONS)
            self._agent = agent
            self.state = "ready"
        except Exception as e:
            self.state = "error"
            self.error = f"{type(e).__name__}: {e}"
        self.load_seconds = round(time.perf_counter() - t0, 1)

    def status(self):
        return {
            "state": self.state,
            "error": self.error,
            "load_seconds": self.load_seconds,
            "device": str(self._agent.device) if self._agent else None,
        }

    def read(self, idea):
        key = " ".join(idea.lower().split())
        if key in self._cache:
            return {**self._cache[key], "cached": True}

        with self._lock:
            t0 = time.perf_counter()
            answers = self._agent.predict(idea, QUESTIONS)["answers"]
            ms = int((time.perf_counter() - t0) * 1000)

        scale_cue = next(((lvl, w) for lvl, rx in SCALE_CUES if (w := _first(rx, idea))), None)
        lang_cue = next(((lang, w) for lang, rx in LANG_CUES if (w := _first(rx, idea))), None)

        result = {
            "kind": {
                "laya": answers["kind"]["probabilities"],
                "cues": {k: w for k, rx in KIND_CUES.items() if (w := _first(rx, idea))},
            },
            "flags": {
                name: {
                    "laya": answers[name]["noul"] if name in answers else None,
                    "cue": _first(rx, idea),
                }
                for name, rx in FLAG_CUES.items()
            },
            "scale": {
                "laya": answers["scale"]["score"],
                "cue": {"level": scale_cue[0], "word": scale_cue[1]} if scale_cue else None,
            },
            "lang": {"value": lang_cue[0], "word": lang_cue[1]} if lang_cue else None,
            "ms": ms,
            "cached": False,
        }
        if len(self._cache) > 256:
            self._cache.clear()
        self._cache[key] = result
        return result

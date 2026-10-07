const $ = (id) => document.getElementById(id);

const EXAMPLES = [
  ["Photo portfolio", "A personal portfolio site to show my photography"],
  ["Phone expense tracker", "Expense tracker app on my phone for me and my wife"],
  ["SaaS with billing", "A SaaS where hotel suppliers upload contracts and teams review them, with subscription billing"],
  ["Chatbot over PDFs", "A chatbot that answers questions from our company PDFs"],
  ["Daily ticket summary", "Script that pulls Freshdesk tickets every morning and emails me a summary"],
  ["Multiplayer quiz", "Multiplayer trivia game friends can play in the browser in real time"],
  ["Candle shop", "Online store selling handmade candles"],
  ["Chrome extension", "Chrome extension that highlights hotel names on booking sites"],
];

const THRESHOLD = { payments: 0.5, realtime: 0.5 };
const KIND_DEFAULTS = { login: ["webapp"], payments: ["store"], realtime: [], ai: ["ai"] };

const st = {
  idea: "",
  raw: null,
  lang: "any",
  langPicked: false,
  kind: null,
  kindWhy: "",
  flagOverrides: {},
  scale: 1,
  scaleWhy: "",
};

const pct = (p) => `${Math.round(p * 100)}%`;
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function segButtons(container, items, current, onPick) {
  container.innerHTML = "";
  for (const [value, label] of items) {
    const b = document.createElement("button");
    b.type = "button";
    b.setAttribute("role", "radio");
    b.setAttribute("aria-checked", String(value === current));
    b.textContent = label;
    b.onclick = () => onPick(value);
    container.appendChild(b);
  }
}

function renderLangs() {
  segButtons($("langs"), Object.entries(LANGS), st.lang, (v) => {
    st.lang = v;
    st.langPicked = true;
    renderLangs();
    if (st.raw) renderStack();
  });
}

function renderExamples() {
  const box = $("examples");
  for (const [label, text] of EXAMPLES) {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = label;
    b.onclick = () => { $("idea").value = text; run(); };
    box.appendChild(b);
  }
}

async function pollStatus() {
  const el = $("status");
  const text = $("statusText");
  for (;;) {
    try {
      const s = await (await fetch("/api/status")).json();
      el.className = `status ${s.state}`;
      if (s.state === "ready") {
        text.textContent = `Laya ready · ${s.device === "cpu" ? "CPU" : "GPU"}`;
        el.title = `Model loaded in ${s.load_seconds} s`;
        return;
      }
      if (s.state === "error") {
        text.textContent = "Laya failed to load";
        el.title = s.error || "";
        return;
      }
      text.textContent = "Laya is warming up";
    } catch {
      el.className = "status error";
      text.textContent = "Server offline";
    }
    await sleep(1500);
  }
}

function decideKind() {
  const p = st.raw.kind.laya;
  const cues = st.raw.kind.cues;
  const layaTop = Object.keys(p).reduce((a, b) => (p[b] > p[a] ? b : a));
  const cueKinds = Object.keys(cues);
  if (!cueKinds.length) {
    st.kind = layaTop;
    st.kindWhy = `Laya is <b>${pct(p[layaTop])}</b> sure.`;
    return;
  }
  const best = cueKinds.reduce((a, b) => (p[b] > p[a] ? b : a));
  st.kind = best;
  st.kindWhy = best === layaTop
    ? `Laya is <b>${pct(p[best])}</b> sure, and you wrote “${esc(cues[best])}”.`
    : `You wrote “${esc(cues[best])}”. Laya alone guessed ${esc(KINDS[layaTop])} (${pct(p[layaTop])}).`;
}

function decideScale() {
  const s = st.raw.scale;
  if (s.cue) {
    st.scale = s.cue.level;
    st.scaleWhy = `You wrote “${esc(s.cue.word)}”.`;
  } else {
    st.scale = Math.max(0, Math.min(3, Math.round(s.laya)));
    st.scaleWhy = "Laya's estimate.";
  }
}

function autoFlag(name) {
  const r = st.raw.flags[name];
  if (r.cue) return { on: true, src: `You wrote “${r.cue}”` };
  if (r.laya != null && THRESHOLD[name] && r.laya >= THRESHOLD[name]) return { on: true, src: `Laya ${pct(r.laya)}` };
  if (KIND_DEFAULTS[name].includes(st.kind)) return { on: true, src: `Usual for a ${KINDS[st.kind].toLowerCase()}` };
  if (name === "ai" && r.laya >= 0.5) return { on: false, src: `Laya ${pct(r.laya)}, but you didn't mention AI` };
  return { on: false, src: r.laya != null ? `Laya ${pct(r.laya)} · not needed` : "Not mentioned" };
}

function flagState(name) {
  if (name in st.flagOverrides) return { on: st.flagOverrides[name], src: "Set by you" };
  return autoFlag(name);
}

function renderRead() {
  const sel = $("kindSelect");
  sel.innerHTML = Object.entries(KINDS).map(([k, v]) => `<option value="${k}">${esc(v)}</option>`).join("");
  sel.value = st.kind;
  $("kindWhy").innerHTML = st.kindWhy;

  const p = st.raw.kind.laya;
  const alts = Object.entries(p)
    .filter(([k, v]) => k !== st.kind && v >= 0.05)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  const altBox = $("kindAlt");
  altBox.innerHTML = "";
  for (const [k, v] of alts) {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = `${KINDS[k]} · ${pct(v)}`;
    b.title = "Switch to this";
    b.onclick = () => setKind(k);
    altBox.appendChild(b);
  }

  const flags = $("flags");
  flags.innerHTML = "";
  for (const [name, label] of Object.entries(FLAGS)) {
    const f = flagState(name);
    const b = document.createElement("button");
    b.type = "button";
    b.className = "flag";
    b.setAttribute("role", "switch");
    b.setAttribute("aria-checked", String(f.on));
    b.innerHTML = `<span class="sw"></span><span class="txt"><span class="name">${esc(label)}</span><span class="src">${esc(f.src)}</span></span>`;
    b.onclick = () => {
      st.flagOverrides[name] = !f.on;
      renderRead();
      renderStack();
    };
    flags.appendChild(b);
  }

  segButtons($("scale"), SCALES.map((s, i) => [i, s]), st.scale, (v) => {
    st.scale = v;
    st.scaleWhy = "Set by you.";
    renderRead();
    renderStack();
  });
  $("scaleWhy").innerHTML = st.scaleWhy;

  renderRaw();
}

function bar(label, v, text) {
  return `<div class="bar-row"><span>${esc(label)}</span><span class="bar"><i style="width:${Math.round(v * 100)}%"></i></span><span class="v">${text ?? pct(v)}</span></div>`;
}

function renderRaw() {
  const r = st.raw;
  const kinds = Object.entries(r.kind.laya).sort((a, b) => b[1] - a[1]);
  let html = "<h4>Type</h4>" + kinds.map(([k, v]) => bar(KINDS[k].split(" / ")[0], v)).join("");
  html += "<h4>Yes / no</h4>";
  for (const name of ["payments", "realtime", "ai"]) html += bar(FLAGS[name], r.flags[name].laya);
  html += "<h4>Users (0 to 3)</h4>" + bar("Estimate", r.scale.laya / 3, r.scale.laya.toFixed(2));
  html += `<p class="muted">${r.cached ? "From cache" : `${(r.ms / 1000).toFixed(1)} s on this machine`}</p>`;
  $("raw").innerHTML = html;
}

function renderStack() {
  const flags = Object.fromEntries(Object.keys(FLAGS).map((n) => [n, flagState(n).on]));
  const out = buildStack({ kind: st.kind, lang: st.lang, flags, scale: st.scale }, st.idea);

  $("title").textContent = out.title;
  $("summary").textContent = out.summary;
  $("tags").innerHTML = `<span class="tag ${out.difficulty.toLowerCase()}">${out.difficulty}</span><span class="tag">${esc(out.cost)}</span>`;

  $("layers").innerHTML = out.layers.map((l, i) => `
    <div class="layer" style="animation-delay:${i * 35}ms">
      <div class="role">${esc(l.role)}</div>
      <div class="name">${esc(l.name)}</div>
      <p class="why">${esc(l.why)}</p>
    </div>`).join("");

  $("cmd").textContent = out.start.cmd;
  $("cmdNote").textContent = out.start.note || "";
  $("cmdNote").hidden = !out.start.note;
  $("alt").textContent = out.alt;
}

function setKind(k) {
  st.kind = k;
  st.kindWhy = "Set by you.";
  renderRead();
  renderStack();
}

function showError(msg) {
  const e = $("error");
  e.textContent = msg;
  e.hidden = false;
}

async function run() {
  const idea = $("idea").value.trim();
  if (idea.length < 3) {
    $("idea").focus();
    return;
  }
  const btn = $("go");
  btn.disabled = true;
  $("error").hidden = true;
  $("result").hidden = true;
  $("loading").hidden = false;
  const t0 = performance.now();
  const tick = setInterval(() => { $("elapsed").textContent = ((performance.now() - t0) / 1000).toFixed(1); }, 100);

  try {
    let raw = null;
    const deadline = Date.now() + 180000;
    while (!raw) {
      const res = await fetch("/api/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea }),
      });
      if (res.status === 503 && Date.now() < deadline) {
        document.querySelector(".loading-title").textContent = "Laya is still warming up, your idea is next…";
        await sleep(1500);
        continue;
      }
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.detail ? (typeof body.detail === "string" ? body.detail : "Please describe your idea in a few more words.") : `Server error ${res.status}`);
      raw = body;
    }

    st.idea = idea;
    st.raw = raw;
    st.flagOverrides = {};
    decideKind();
    decideScale();
    if (raw.lang && !st.langPicked) {
      st.lang = raw.lang.value;
      renderLangs();
    }
    renderRead();
    renderStack();
    document.body.classList.add("compact");
    $("result").hidden = false;
    if (window.innerWidth < 880) $("result").scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (err) {
    showError(err.message === "Failed to fetch" ? "Cannot reach the server. Is start.bat still running?" : err.message);
  } finally {
    clearInterval(tick);
    $("loading").hidden = true;
    document.querySelector(".loading-title").textContent = "Laya is reading your idea…";
    btn.disabled = false;
  }
}

$("form").addEventListener("submit", (e) => { e.preventDefault(); run(); });
$("idea").addEventListener("keydown", (e) => {
  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); run(); }
});
$("kindSelect").addEventListener("change", (e) => setKind(e.target.value));
$("copy").addEventListener("click", async () => {
  const b = $("copy");
  try {
    await navigator.clipboard.writeText($("cmd").textContent);
    b.textContent = "Copied";
  } catch {
    b.textContent = "Select it";
  }
  setTimeout(() => { b.textContent = "Copy"; }, 1400);
});

renderLangs();
renderExamples();
pollStatus();
$("idea").focus();

const preset = new URLSearchParams(location.search).get("q");
if (preset) {
  $("idea").value = preset;
  run();
}

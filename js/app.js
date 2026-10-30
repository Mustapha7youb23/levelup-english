(() => {
  "use strict";

  const LEVELS = window.LEVELS || {};
  const LV = ["A1", "A2", "B1", "B2", "C1", "C2"].filter(l => LEVELS[l]);
  const INFO = window.LEVEL_INFO;
  const PASS = 60;           // % needed to pass a level test
  const STRONG = 80;         // % for a strong pass
  const TEST_SIZE = { gv: 15, reading: 2, listening: 2 };
  const PLACEMENT_PER_LEVEL = 6;
  const PLACEMENT_PASS = 4;  // correct answers out of 6 to move up
  const MAX_PLAYS = 2;
  const SPEECH_RATE = { A1: .8, A2: .87, B1: .93, B2: .98, C1: 1, C2: 1.03 };
  const SKILLS = ["grammar", "vocabulary", "reading", "listening"];
  const SKILL_LABEL = { grammar: "Grammar", vocabulary: "Vocabulary", reading: "Reading", listening: "Listening", writing: "Writing" };
  // One line-icon family (2px stroke, 24px grid), decorative unless labelled.
  const ICONS = {
    pencil: '<path d="M17 3a2.8 2.8 0 0 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/>',
    book: '<path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2z"/><path d="M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z"/>',
    headphones: '<path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3"/>',
    write: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h5"/>',
    compass: '<circle cx="12" cy="12" r="10"/><path d="m16.2 7.8-2.1 6.3-6.3 2.1 2.1-6.3z"/>',
    target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
    pause: '<rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
    save: '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/>',
    bulb: '<path d="M9 18h6M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.3h6c0-1 .4-1.8 1-2.3A7 7 0 0 0 12 2z"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    circle: '<circle cx="12" cy="12" r="9" stroke-dasharray="3 3"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    volume: '<path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/>',
    stairs: '<path d="M3 21h5v-5h5v-5h5V6h3"/>'
  };
  const icon = (name, cls = "") => `<svg class="i ${cls}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${ICONS[name]}</svg>`;
  const PLAY_ICON = `<svg class="i fill" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M7 4v16l13-8z"/></svg>`;
  const PART_INFO = {
    gv: { icon: "pencil", how: "Choose the word or phrase that best completes each sentence." },
    reading: { icon: "book", how: "Read each text, then answer the questions next to it." },
    listening: { icon: "headphones", how: `Read the questions first, then press play. You can play each recording ${MAX_PLAYS} times, like the real exam.` },
    writing: { icon: "write", how: "Write your answer. It isn't scored here, but you can check it with the list and get a free CEFR mark from Cambridge." }
  };
  const LETTERS = "ABCD";
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const app = document.getElementById("app");
  let timerId = null;
  let current = null; // the test being taken

  /* ---------- storage (safe if blocked) ---------- */
  const store = {
    get(k, d) { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* ignore */ } },
    del(k) { try { localStorage.removeItem(k); } catch { /* ignore */ } }
  };
  const HISTORY = "lu.history", CURRENT = "lu.current";
  const history = () => store.get(HISTORY, []);
  const save = () => current && store.set(CURRENT, current);

  /* ---------- helpers ---------- */
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const pick = (n, count) => shuffle([...Array(n).keys()]).slice(0, count).sort((a, b) => a - b);
  const pct = (c, t) => t ? Math.round(c / t * 100) : 0;
  const fmtTime = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  const fmtDate = t => new Date(t).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
  const lvlColor = l => `var(--${l})`;
  const badge = (l, cls = "") => `<span class="level-badge ${cls}" style="--lvl:${lvlColor(l)}">${l}</span>`;
  const words = t => (t.trim().match(/\S+/g) || []).length;
  const scoreColor = p => p >= PASS ? "var(--good)" : p >= PASS - 10 ? "var(--warn)" : "var(--bad)";
  const plural = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;
  // In-page confirm dialog (artifact viewers block window.confirm/alert).
  function ask(text, okLabel = "OK", cancelLabel = "Cancel") {
    const m = document.getElementById("modal");
    document.getElementById("modal-text").textContent = text;
    const ok = document.getElementById("modal-ok"), cancel = document.getElementById("modal-cancel");
    ok.textContent = okLabel; cancel.textContent = cancelLabel;
    const back = document.activeElement;
    m.hidden = false; ok.focus();
    return new Promise(res => {
      const done = v => { m.hidden = true; ok.onclick = cancel.onclick = m.onclick = document.onkeydown = null; if (back && back.focus) back.focus(); res(v); };
      ok.onclick = () => done(true);
      cancel.onclick = () => done(false);
      m.onclick = e => { if (e.target === m) done(false); };
      // Escape closes; Tab stays inside the dialog.
      document.onkeydown = e => {
        if (e.key === "Escape") done(false);
        if (e.key === "Tab") { e.preventDefault(); (document.activeElement === ok ? cancel : ok).focus(); }
      };
    });
  }
  const announce = text => { const l = document.getElementById("live"); if (l) l.textContent = text; };
  const verdictOf = p => p >= STRONG ? ["Strong pass", "v-strong"] : p >= PASS ? ["Pass", "v-pass"] : p >= PASS - 10 ? ["Almost there", "v-close"] : ["Not yet", "v-fail"];

  /* ---------- question access ---------- */
  // Every question has an id: gv:i | rd:p:q | ls:p:q | pl:LEVEL:i
  function getQ(level, id) {
    const L = LEVELS[level], [k, a, b] = id.split(":");
    if (k === "gv") return { ...L.grammarVocab[+a], skill: L.grammarVocab[+a].skill === "vocabulary" ? "vocabulary" : "grammar" };
    if (k === "rd") return { ...L.reading[+a].questions[+b], skill: "reading" };
    if (k === "ls") return { ...L.listening[+a].questions[+b], skill: "listening" };
  }
  function partQuestions(t, part) {
    const L = LEVELS[t.level];
    if (part.kind === "gv") return part.items.map(i => `gv:${i}`);
    if (part.kind === "reading") return part.items.flatMap(p => L.reading[p].questions.map((_, q) => `rd:${p}:${q}`));
    if (part.kind === "listening") return part.items.flatMap(p => L.listening[p].questions.map((_, q) => `ls:${p}:${q}`));
    return [];
  }
  const allQuestions = t => t.parts.flatMap(p => partQuestions(t, p));
  const questionCount = l => TEST_SIZE.gv + LEVELS[l].reading[0].questions.length * TEST_SIZE.reading + LEVELS[l].listening[0].questions.length * TEST_SIZE.listening;

  /* ---------- building tests ---------- */
  function newLevelTest(level) {
    const L = LEVELS[level];
    return {
      type: "level", level, partIdx: 0, answers: {}, plays: {}, writing: "", checks: [],
      remaining: INFO[level].minutes * 60, startedAt: Date.now(),
      parts: [
        { kind: "gv", title: "Grammar & Vocabulary", items: pick(L.grammarVocab.length, TEST_SIZE.gv) },
        { kind: "reading", title: "Reading", items: pick(L.reading.length, TEST_SIZE.reading) },
        { kind: "listening", title: "Listening", items: pick(L.listening.length, TEST_SIZE.listening) },
        { kind: "writing", title: "Writing" }
      ]
    };
  }
  function newPlacement() {
    return {
      type: "placement", stage: 0, answers: {}, startedAt: Date.now(),
      rounds: LV.map(l => ({ level: l, items: pick(LEVELS[l].grammarVocab.length, PLACEMENT_PER_LEVEL) }))
    };
  }

  /* ---------- scoring ---------- */
  function scoreLevel(t) {
    const sec = Object.fromEntries(SKILLS.map(s => [s, [0, 0]]));
    const ids = allQuestions(t);
    let correct = 0;
    ids.forEach(id => {
      const q = getQ(t.level, id), ok = t.answers[id] === q.answer;
      sec[q.skill][1]++; if (ok) { sec[q.skill][0]++; correct++; }
    });
    return { correct, total: ids.length, pct: pct(correct, ids.length), sections: sec };
  }
  function scorePlacement(t) {
    let placed = null;
    const rounds = [];
    for (let i = 0; i <= t.stage && i < t.rounds.length; i++) {
      const r = t.rounds[i];
      const c = r.items.filter(n => t.answers[`${r.level}:${n}`] === LEVELS[r.level].grammarVocab[n].answer).length;
      rounds.push({ level: r.level, correct: c, total: r.items.length });
      if (c >= PLACEMENT_PASS) placed = r.level; else break;
    }
    return { placed, rounds };
  }

  /* ---------- speech (listening) ---------- */
  const synth = window.speechSynthesis;
  function bestVoice() {
    const v = synth ? synth.getVoices().filter(v => /^en[-_]/i.test(v.lang)) : [];
    const prefer = ["Google UK English Female", "Google US English", "Samantha", "Daniel", "Serena", "Karen", "Moira"];
    for (const name of prefer) { const f = v.find(x => x.name.includes(name)); if (f) return f; }
    return v.find(x => /en-GB/i.test(x.lang)) || v.find(x => /en-US/i.test(x.lang)) || v[0] || null;
  }
  function speak(text, rate, onEnd) {
    synth.cancel();
    // Speak sentence by sentence: long single utterances get cut off in some browsers.
    const parts = text.match(/[^.!?]+[.!?]+["']?|\S[^.!?]*$/g) || [text];
    const voice = bestVoice();
    parts.forEach((p, i) => {
      const u = new SpeechSynthesisUtterance(p.trim());
      u.lang = voice ? voice.lang : "en-GB"; if (voice) u.voice = voice; u.rate = rate;
      if (i === parts.length - 1) u.onend = onEnd;
      synth.speak(u);
    });
  }
  if (synth) synth.onvoiceschanged = () => {};

  /* ---------- timer ---------- */
  function startTimer() {
    stopTimer();
    timerId = setInterval(() => {
      if (!current || current.type !== "level") return stopTimer();
      current.remaining = Math.max(0, current.remaining - 1);
      const el = document.getElementById("timer");
      if (el) { document.getElementById("timer-text").textContent = fmtTime(current.remaining); el.classList.toggle("low", current.remaining < 300); }
      if (current.remaining === 300) announce("5 minutes left.");
      if (current.remaining === 60) announce("1 minute left.");
      if (current.remaining % 5 === 0) save();
      if (current.remaining === 0) finishLevel();
    }, 1000);
  }
  function stopTimer() { clearInterval(timerId); timerId = null; }

  /* ---------- navigation ---------- */
  function go(view, arg) {
    stopTimer(); if (synth) synth.cancel();
    window.scrollTo(0, 0);
    const nav = { home: "home", intro: "home", history: "history" }[view];
    document.querySelectorAll("[data-nav]").forEach(a => a.classList.toggle("active", a.dataset.nav === nav));
    ({ home: renderHome, history: renderHistory, intro: renderIntro, level: renderTest, placement: renderPlacement, result: renderResult }[view] || renderHome)(arg);
    app.classList.remove("view"); void app.offsetWidth; app.classList.add("view");
  }

  document.addEventListener("click", e => {
    const g = e.target.closest("[data-go]");
    if (g) {
      e.preventDefault();
      if (current) { save(); current = null; } // progress is saved; user can continue from Home
      return go(g.dataset.go);
    }
    const i = e.target.closest("[data-intro]");
    if (i) return go("intro", i.dataset.intro);
    const s = e.target.closest("[data-scroll]");
    if (s) document.getElementById(s.dataset.scroll).scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
  });

  /* ---------- HOME ---------- */
  function bestScores() {
    const best = {};
    history().filter(h => h.type === "level").forEach(h => { if (!best[h.level] || h.pct > best[h.level].pct) best[h.level] = h; });
    return best;
  }
  function currentLevel() {
    const best = bestScores();
    let lvl = null;
    LV.forEach(l => { if (best[l] && best[l].pct >= PASS) lvl = l; });
    const lastPl = history().filter(h => h.type === "placement").pop();
    return { passed: lvl, placement: lastPl ? lastPl.placed : undefined };
  }

  function renderHome() {
    current = null;
    const saved = store.get(CURRENT, null);
    const best = bestScores();
    const me = currentLevel();
    const hist = history();
    const here = me.passed || me.placement || null;
    const next = me.passed ? LV[Math.min(LV.indexOf(me.passed) + 1, LV.length - 1)] : (me.placement || (hist.length ? "A1" : null));

    const hero = hist.length ? `
        <p class="eyebrow">Welcome back</p>
        <h1>${here ? `You're at <span class="mark">${here}</span>.${next !== here ? ` Next step: ${next}.` : " Keep it sharp."}` : `Ready for <span class="mark">your next</span> test?`}</h1>
        <p class="lead">${plural(hist.length, "test")} taken so far. ${me.passed ? `Your highest pass is ${me.passed} ${INFO[me.passed].name}.` : me.placement ? `Your placement test says about ${me.placement}. Take the full test to confirm it.` : "Every test gives you a study plan, so each try makes you stronger."}</p>
        <div class="row">
          <button class="btn big" data-intro="${next}">Take the ${next} test <span class="arrow">→</span></button>
          <button class="btn big ghost" data-go="history">My results</button>
        </div>` : `
        <p class="eyebrow">Free CEFR English test · A1 to C2</p>
        <h1>What's your real English <span class="mark">level</span>?</h1>
        <p class="lead">Timed tests with grammar, vocabulary, reading, listening and writing. Your score comes with a study plan: what to fix, or how to reach the next level.</p>
        <div class="row">
          <button class="btn big" id="placement-hero">Find my level <span class="arrow">→</span></button>
          <button class="btn big ghost" data-scroll="levels">I know my level</button>
        </div>
        <ul class="hero-facts"><li>No sign-up</li><li>Results saved on this device</li><li>Works on your phone</li></ul>`;

    app.innerHTML = `
      <section class="hero">
        <div>${hero}</div>
        <div class="stairs" role="list" aria-label="The six CEFR levels">
          ${LV.map((l, i) => `<button class="stair" role="listitem" style="--i:${i};--lvl:${lvlColor(l)}" data-intro="${l}" aria-label="${l} ${INFO[l].name} test${l === here ? ", your level" : ""}${best[l] && best[l].pct >= PASS ? ", passed" : ""}">
            ${l === here ? `<span class="pin">You are here</span>` : ""}
            ${best[l] && best[l].pct >= PASS ? `<span class="tick">${icon("check")}</span>` : ""}
            <b>${l}</b><span class="nm">${INFO[l].name}</span>
          </button>`).join("")}
        </div>
      </section>

      ${saved ? `
        <div class="card banner resume section" style="margin-top:32px">
          <div><h3>${icon("pause")} You have an unfinished test: ${saved.type === "placement" ? "Placement test" : saved.level + " " + INFO[saved.level].name}</h3>
          <p class="muted small">Your answers are saved.${saved.type === "level" ? " Time left: " + fmtTime(saved.remaining) + "." : ""}</p></div>
          <div class="row"><button class="btn" id="resume">Continue <span class="arrow">→</span></button><button class="btn ghost" id="discard">Discard</button></div>
        </div>` : ""}

      <section class="section">
        <div class="section-head"><h2>Two ways to start</h2></div>
        <div class="paths">
          <div class="card path featured">
            <span class="icon">${icon("compass")}</span>
            <h3>Not sure? Take the placement test</h3>
            <p>About 10 minutes. It starts easy and gets harder until it finds your level. Then take the full test for that level.</p>
            <button class="btn" id="placement">Start placement test <span class="arrow">→</span></button>
          </div>
          <div class="card path">
            <span class="icon">${icon("target")}</span>
            <h3>Know your level? Take a full test</h3>
            <p>Pick A1 to C2 below. Each test is timed and has all four parts, like a real exam. You need ${PASS}% to pass.</p>
            <button class="btn ghost" data-scroll="levels">Choose a level ↓</button>
          </div>
        </div>
      </section>

      <section class="section" id="levels">
        <div class="section-head">
          <h2>Full level tests</h2>
          <p class="muted small">15 grammar & vocabulary questions, 2 reading texts, 2 listening recordings and a writing task. New questions every time.</p>
        </div>
        <div class="levels">
          ${LV.map(l => {
            const b = best[l];
            return `<button class="card level-card ${l === next ? "recommended" : ""}" style="--lvl:${lvlColor(l)}" data-intro="${l}">
              <div class="top">${badge(l)}${b ? `<span class="chip ${b.pct >= PASS ? "pass-chip" : "fail-chip"}">Best ${b.pct}%</span>` : l === next ? `<span class="chip" style="background:var(--mark);color:var(--mark-ink)">Recommended</span>` : ""}</div>
              <h3>${INFO[l].name}</h3>
              <p class="can">${esc(INFO[l].can)}</p>
              <div class="meta"><span>${icon("clock")} ${INFO[l].minutes} min</span><span>${icon("list")} ${questionCount(l)} questions + writing</span></div>
              <span class="small muted">Like ${esc(INFO[l].exam)}</span>
              <span class="go">Start ${l} test →</span>
            </button>`;
          }).join("")}
        </div>
      </section>

      <section class="section">
        <div class="section-head"><h2>How it works</h2></div>
        <ol class="how">
          <li class="card"><b>Take a test</b><span>Answer at your own pace. Your answers save as you go, so you can close the page and continue later.</span></li>
          <li class="card"><b>See your score by skill</b><span>Find out exactly where you lose points: grammar, vocabulary, reading or listening.</span></li>
          <li class="card"><b>Get your study plan</b><span>Didn't pass? Free resources to learn that level. Passed? Resources to reach the next one.</span></li>
        </ol>
      </section>

      <section class="section">
        <div class="section-head"><h2>Need an official certificate?</h2><p class="muted small">These tests estimate your level. For a result you can show to a school or employer:</p></div>
        <div class="res-list">${window.OFFICIAL_TESTS.map(r => resItem(r)).join("")}</div>
      </section>`;

    const startPlacement = async () => {
      if (store.get(CURRENT, null) && !(await ask("You have an unfinished test. Start the placement test and lose it?", "Start placement test"))) return;
      current = newPlacement(); save(); go("placement");
    };
    document.getElementById("placement").onclick = startPlacement;
    const ph = document.getElementById("placement-hero");
    if (ph) ph.onclick = startPlacement;
    const r = document.getElementById("resume");
    if (r) {
      r.onclick = () => { current = saved; go(saved.type === "placement" ? "placement" : "level"); };
      document.getElementById("discard").onclick = async () => { if (await ask("Discard this unfinished test? Your answers will be lost.", "Discard")) { store.del(CURRENT); renderHome(); } };
    }
  }

  /* ---------- TEST INTRO ---------- */
  function renderIntro(level) {
    if (!LEVELS[level]) return renderHome();
    const L = LEVELS[level];
    const rq = L.reading[0].questions.length * TEST_SIZE.reading, lq = L.listening[0].questions.length * TEST_SIZE.listening;
    app.innerHTML = `
      <div class="intro">
        <button class="btn ghost small" data-go="home">← All tests</button>
        <div class="intro-head" style="margin-top:20px">
          <div class="me-level"><span class="big-badge" style="--lvl:${lvlColor(level)}">${level}</span></div>
          <div><p class="eyebrow" style="margin:0 0 4px">Like ${esc(INFO[level].exam)}</p><h1>${INFO[level].name} test</h1></div>
        </div>
        <div class="card stack">
          <p style="margin:0">${esc(INFO[level].can)}</p>
          <div class="facts">
            <div class="fact"><b>${INFO[level].minutes}</b><span>minutes</span></div>
            <div class="fact"><b>${questionCount(level)}</b><span>questions</span></div>
            <div class="fact"><b>${PASS}%</b><span>to pass</span></div>
          </div>
          <ol class="parts-list">
            <li><span class="ico">${icon(PART_INFO.gv.icon)}</span><div><b>Grammar & Vocabulary</b><span class="muted">Complete the sentences</span></div><span class="n">${TEST_SIZE.gv} q</span></li>
            <li><span class="ico">${icon(PART_INFO.reading.icon)}</span><div><b>Reading</b><span class="muted">${TEST_SIZE.reading} texts</span></div><span class="n">${rq} q</span></li>
            <li><span class="ico">${icon(PART_INFO.listening.icon)}</span><div><b>Listening</b><span class="muted">${TEST_SIZE.listening} recordings, play each twice</span></div><span class="n">${lq} q</span></li>
            <li><span class="ico">${icon(PART_INFO.writing.icon)}</span><div><b>Writing</b><span class="muted">${esc(L.writing.words)}, self-checked</span></div><span class="n">not scored</span></li>
          </ol>
          <ul class="tips muted">
            <li>${icon("volume")}<span>Turn your sound on for the listening part.</span></li>
            <li>${icon("save")}<span>Your answers save by themselves. You can leave and continue later.</span></li>
            <li>${icon("clock")}<span>When the time runs out, the test finishes and you get your score.</span></li>
          </ul>
          <div class="row">
            <button class="btn big" id="begin">Start the test <span class="arrow">→</span></button>
            <span class="muted small">The timer starts when you press start.</span>
          </div>
        </div>
      </div>`;
    document.getElementById("begin").onclick = async () => {
      if (store.get(CURRENT, null) && !(await ask("You have an unfinished test. Start a new one and lose it?", "Start new test"))) return;
      current = newLevelTest(level); save(); go("level");
    };
  }

  /* ---------- questions (shared by level + placement tests) ---------- */
  const gapHTML = (text, chosen) => esc(text).replace(/_{3,}/, `<span class="gap ${chosen ? "filled" : ""}">${chosen ? esc(chosen) : "&nbsp;"}</span>`);
  function questionHTML(q, id, n, chosen) {
    const long = q.options.some(o => o.length > 30);
    return `<div class="question ${chosen !== undefined ? "answered" : ""}" data-q="${id}">
      <div class="q-text"><span class="q-num">${n}</span><span>${gapHTML(q.q, chosen !== undefined ? q.options[chosen] : "")}</span></div>
      <div class="options ${long ? "long" : ""}" role="radiogroup">${q.options.map((o, i) => `
        <label class="option ${chosen === i ? "selected" : ""}">
          <input type="radio" name="${id}" value="${i}" ${chosen === i ? "checked" : ""}>
          <span class="bubble">${LETTERS[i]}</span>
          <span>${esc(o)}</span>
        </label>`).join("")}
      </div></div>`;
  }
  // Wire radio buttons: save the answer, fill the gap, then glide to the next open question.
  function bindAnswers(answers, getQuestion, onChange, glide) {
    app.querySelectorAll('input[type="radio"]').forEach(inp => inp.onchange = () => {
      answers[inp.name] = +inp.value; save();
      const box = inp.closest(".question");
      box.classList.add("answered");
      box.querySelectorAll(".option").forEach(o => o.classList.toggle("selected", o.contains(inp)));
      const gap = box.querySelector(".gap");
      if (gap) { gap.textContent = getQuestion(inp.name).options[+inp.value]; gap.classList.add("filled"); }
      onChange();
      if (!glide) return;
      const nextQ = [...app.querySelectorAll(".question")].slice([...app.querySelectorAll(".question")].indexOf(box) + 1).find(q => !q.classList.contains("answered"));
      if (nextQ && nextQ.getBoundingClientRect().top > window.innerHeight * .55)
        setTimeout(() => nextQ.scrollIntoView({ block: "center", behavior: reduceMotion ? "auto" : "smooth" }), 260);
    });
  }

  /* ---------- LEVEL TEST ---------- */
  function renderTest() {
    const t = current;
    if (!t) return renderHome();
    const L = LEVELS[t.level];
    const part = t.parts[t.partIdx];
    const ids = allQuestions(t);
    const done = id => t.answers[id] !== undefined;
    // Question numbers continue across parts, like a real paper.
    const startNum = p => t.parts.slice(0, p).reduce((s, x) => s + partQuestions(t, x).length, 0);
    let n = startNum(t.partIdx);

    let body = "";
    if (part.kind === "gv") {
      body = `<div class="card">${part.items.map(i => questionHTML(L.grammarVocab[i], `gv:${i}`, ++n, t.answers[`gv:${i}`])).join("")}</div>`;
    } else if (part.kind === "reading") {
      body = part.items.map((p, k) => {
        const R = L.reading[p];
        return `<div class="card text-card">
          <h3>Text ${k + 1}: ${esc(R.title)}</h3>
          <div class="split">
            <div class="passage">${esc(R.text)}</div>
            <div>${R.questions.map((q, j) => questionHTML(q, `rd:${p}:${j}`, ++n, t.answers[`rd:${p}:${j}`])).join("")}</div>
          </div></div>`;
      }).join("");
    } else if (part.kind === "listening") {
      body = (synth ? "" : `<p class="tip">Your browser can't play audio speech. Open this site in Chrome, Edge or Safari to do the listening part.</p>`) +
        part.items.map((p, k) => {
          const S = L.listening[p], used = t.plays[p] || 0;
          return `<div class="card text-card">
            <h3>Recording ${k + 1}: ${esc(S.title)}</h3>
            <div class="player" id="player-${p}">
              <button class="play-btn" data-play="${p}" aria-label="Play recording ${k + 1}" ${used >= MAX_PLAYS || !synth ? "disabled" : ""}>${PLAY_ICON}</button>
              <div class="info"><b id="pstate-${p}">${playLabel(used)}</b><span class="muted small">Plays left <span class="dots" id="dots-${p}">${dotsHTML(used)}</span></span></div>
              <div class="eq" aria-hidden="true">${"<i></i>".repeat(7)}</div>
            </div>
            ${S.questions.map((q, j) => questionHTML(q, `ls:${p}:${j}`, ++n, t.answers[`ls:${p}:${j}`])).join("")}
          </div>`;
        }).join("");
    } else {
      const W = L.writing;
      body = `<div class="card">
        <div class="passage">${esc(W.prompt)}</div>
        <textarea id="writing" placeholder="Write your answer here…" aria-label="Your writing">${esc(t.writing)}</textarea>
        <div class="wc-meter"><span id="wc">${words(t.writing)} words</span><div class="bar"><span id="wc-bar"></span></div><span>${esc(W.words)}</span></div>
        <div class="checklist"><b>Check your writing before you finish:</b>
          ${W.checklist.map((c, i) => `<label><input type="checkbox" data-check="${i}" ${t.checks.includes(i) ? "checked" : ""}> <span>${esc(c)}</span></label>`).join("")}
        </div>
        <p class="muted small" style="margin:14px 0 0">Want a real mark? After the test, paste your text into <a href="https://writeandimprove.com/" target="_blank" rel="noopener">Write & Improve</a> (free, by Cambridge) for a CEFR level.</p>
      </div>`;
    }

    const last = t.partIdx === t.parts.length - 1;
    const nextTitle = last ? "" : t.parts[t.partIdx + 1].title.replace(" & Vocabulary", "");
    app.innerHTML = `
      <div class="testbar"><div class="testbar-in">
        <div class="head">
          <div class="title">${badge(t.level, "sm")}<b>${INFO[t.level].name} test</b></div>
          <span class="timer ${t.remaining < 300 ? "low" : ""}" id="timer" role="timer" aria-label="Time left">${icon("clock")}<span id="timer-text">${fmtTime(t.remaining)}</span></span>
        </div>
        <div class="tabs">${t.parts.map((p, i) => {
          const q = partQuestions(t, p), a = q.filter(done).length;
          return `<button class="tab ${i === t.partIdx ? "active" : ""} ${q.length && a === q.length ? "complete" : ""}" data-part="${i}" ${i === t.partIdx ? 'aria-current="step"' : ""}>${icon(PART_INFO[p.kind].icon)} ${p.title.replace(" & Vocabulary", " & Vocab")}${q.length ? `<span class="cnt" data-cnt="${i}">${a}/${q.length}</span>` : ""}</button>`;
        }).join("")}</div>
      </div><div class="progress"><span id="prog" style="width:${pct(ids.filter(done).length, ids.length)}%"></span></div></div>

      <div class="part-head">
        <p class="eyebrow">Part ${t.partIdx + 1} of ${t.parts.length}</p>
        <h2>${part.title}</h2>
        <p>${PART_INFO[part.kind].how}</p>
      </div>
      ${body}

      <div class="actionbar">
        <div class="qnav" id="qnav" hidden>
          <p>Jump to any question. Blue ones are answered.</p>
          <div class="qgrid">${(() => { let k = 0; return t.parts.map((p, pi) => { const q = partQuestions(t, p); return q.length ? `<span class="sep">${p.title}</span>` + q.map(id => `<button data-jump="${pi}|${id}" class="${done(id) ? "done" : ""} ${pi === t.partIdx ? "here" : ""}" aria-label="Question ${++k}, ${done(id) ? "answered" : "not answered"}">${k}</button>`).join("") : ""; }).join(""); })()}</div>
        </div>
        <div class="actionbar-in">
          <button class="btn ghost" id="prev" aria-label="Previous part" ${t.partIdx === 0 ? 'style="visibility:hidden"' : ""}>← <span class="hide-sm">Back</span></button>
          <button class="qnav-toggle" id="qtoggle" aria-expanded="false" aria-controls="qnav">${icon("grid")} <span id="answered">${ids.filter(done).length}/${ids.length}</span><span class="lbl">answered</span></button>
          <button class="btn" id="next">${last ? "Finish & see score" : `<span>Next<span class="hide-sm">: ${nextTitle}</span></span> <span class="arrow">→</span>`}</button>
        </div>
      </div>`;

    // On narrow screens keep the active part tab in view.
    const tabs = app.querySelector(".tabs"), activeTab = tabs.querySelector(".active");
    tabs.scrollLeft = activeTab.offsetLeft - tabs.offsetLeft - (tabs.clientWidth - activeTab.offsetWidth) / 2;

    const refresh = () => {
      const a = ids.filter(done).length;
      document.getElementById("answered").textContent = `${a}/${ids.length}`;
      document.getElementById("prog").style.width = pct(a, ids.length) + "%";
      t.parts.forEach((p, i) => {
        const q = partQuestions(t, p), c = app.querySelector(`[data-cnt="${i}"]`);
        if (c) { const k = q.filter(done).length; c.textContent = `${k}/${q.length}`; c.parentElement.classList.toggle("complete", k === q.length); }
      });
      app.querySelectorAll("[data-jump]").forEach(b => {
        const ok = done(b.dataset.jump.split("|")[1]);
        b.classList.toggle("done", ok); b.setAttribute("aria-label", `Question ${b.textContent}, ${ok ? "answered" : "not answered"}`);
      });
    };
    bindAnswers(t.answers, id => getQ(t.level, id), refresh, part.kind === "gv");

    app.querySelectorAll("[data-play]").forEach(b => b.onclick = () => {
      const p = +b.dataset.play;
      if ((t.plays[p] || 0) >= MAX_PLAYS) return;
      t.plays[p] = (t.plays[p] || 0) + 1; save();
      app.querySelectorAll("[data-play]").forEach(x => x.disabled = true);
      const pl = document.getElementById(`player-${p}`);
      pl.classList.add("playing");
      b.innerHTML = icon("volume"); b.setAttribute("aria-label", "Playing");
      document.getElementById(`pstate-${p}`).textContent = "Playing… listen carefully";
      document.getElementById(`dots-${p}`).innerHTML = dotsHTML(t.plays[p]);
      speak(L.listening[p].script, SPEECH_RATE[t.level], () => {
        pl.classList.remove("playing");
        app.querySelectorAll("[data-play]").forEach(x => {
          const k = +x.dataset.play, u = t.plays[k] || 0;
          x.disabled = u >= MAX_PLAYS; x.innerHTML = PLAY_ICON; x.setAttribute("aria-label", "Play recording again");
          document.getElementById(`pstate-${k}`).textContent = playLabel(u);
        });
      });
    });

    const ta = document.getElementById("writing");
    if (ta) {
      const [lo, hi] = wordRange(L.writing.words);
      const meter = () => {
        const w = words(ta.value), bar = document.getElementById("wc-bar");
        document.getElementById("wc").textContent = plural(w, "word");
        bar.style.width = Math.min(100, pct(w, hi)) + "%";
        bar.style.background = w < lo ? "var(--primary)" : w <= hi * 1.1 ? "var(--good)" : "var(--warn)";
      };
      meter();
      ta.oninput = () => { t.writing = ta.value; meter(); save(); };
    }
    app.querySelectorAll("[data-check]").forEach(c => c.onchange = () => {
      const i = +c.dataset.check; t.checks = c.checked ? [...new Set([...t.checks, i])] : t.checks.filter(x => x !== i); save();
    });

    app.querySelectorAll("[data-part]").forEach(b => b.onclick = () => { t.partIdx = +b.dataset.part; save(); go("level"); });
    const qnav = document.getElementById("qnav"), qt = document.getElementById("qtoggle");
    qt.onclick = () => { qnav.hidden = !qnav.hidden; qt.setAttribute("aria-expanded", !qnav.hidden); };
    app.querySelectorAll("[data-jump]").forEach(b => b.onclick = () => {
      const [pi, id] = b.dataset.jump.split("|");
      if (+pi !== t.partIdx) { t.partIdx = +pi; save(); go("level"); } else qnav.hidden = true;
      const el = app.querySelector(`[data-q="${id}"]`);
      if (el) el.scrollIntoView({ block: "center" });
    });
    document.getElementById("prev").onclick = () => { t.partIdx--; save(); go("level"); };
    document.getElementById("next").onclick = async () => {
      if (!last) { t.partIdx++; save(); return go("level"); }
      const left = ids.length - ids.filter(done).length;
      if (left && !(await ask(`You have ${plural(left, "unanswered question")}. Finish anyway?`, "Finish", "Keep working"))) return;
      finishLevel();
    };
    startTimer();
  }
  const playLabel = used => used >= MAX_PLAYS ? "No plays left" : used ? "Press play to listen again" : "Press play to listen";
  const dotsHTML = used => Array.from({ length: MAX_PLAYS }, (_, i) => `<i class="${i < used ? "used" : ""}"></i>`).join("");
  function wordRange(text) {
    const n = (text.match(/\d+/g) || ["100"]).map(Number);
    return n.length > 1 ? n : [Math.round(n[0] * .85), Math.round(n[0] * 1.15)];
  }

  function finishLevel() {
    stopTimer(); if (synth) synth.cancel();
    const t = current, s = scoreLevel(t);
    const entry = { id: Date.now(), type: "level", level: t.level, date: Date.now(), pct: s.pct, correct: s.correct, total: s.total, sections: s.sections, test: t };
    store.set(HISTORY, [...history(), entry]);
    store.del(CURRENT); current = null;
    go("result", entry.id);
  }

  /* ---------- PLACEMENT ---------- */
  function renderPlacement() {
    const t = current;
    if (!t) return renderHome();
    const r = t.rounds[t.stage], L = LEVELS[r.level];
    const ids = r.items.map(i => `${r.level}:${i}`);
    const done = id => t.answers[id] !== undefined;
    let n = t.stage * PLACEMENT_PER_LEVEL;
    app.innerHTML = `
      <div class="testbar"><div class="testbar-in">
        <div class="head">
          <div class="title"><b>${icon("compass")} Placement test</b></div>
          <span class="muted small">Stage ${t.stage + 1} of ${t.rounds.length}</span>
        </div>
        <div class="tabs">${t.rounds.map((x, i) => `<span class="tab ${i === t.stage ? "active" : ""} ${i < t.stage ? "complete" : ""}" style="cursor:default">${i < t.stage ? icon("check") + " " : ""}${x.level}</span>`).join("")}</div>
      </div><div class="progress"><span style="width:${pct(t.stage, t.rounds.length)}%"></span></div></div>

      <div class="part-head">
        <p class="eyebrow">${r.level} questions</p>
        <h2>${t.stage ? "Nice! Now a little harder." : "Let's start easy."}</h2>
        <p>Choose the best answer. If you don't know, pick what sounds most natural, but don't guess wildly. Get ${PLACEMENT_PASS} of ${PLACEMENT_PER_LEVEL} right to move up.</p>
      </div>
      <div class="card">${r.items.map(i => questionHTML(L.grammarVocab[i], `${r.level}:${i}`, ++n, t.answers[`${r.level}:${i}`])).join("")}</div>

      <div class="actionbar"><div class="actionbar-in">
        <button class="btn ghost" data-go="home">Pause</button>
        <span class="muted small"><b id="answered">${ids.filter(done).length}/${ids.length}</b> answered</span>
        <button class="btn" id="next">${t.stage < t.rounds.length - 1 ? "Next stage" : "See my level"} <span class="arrow">→</span></button>
      </div></div>`;
    bindAnswers(t.answers, id => L.grammarVocab[+id.split(":")[1]], () => {
      document.getElementById("answered").textContent = `${ids.filter(done).length}/${ids.length}`;
    }, true);
    document.getElementById("next").onclick = async () => {
      const missing = ids.filter(id => !done(id)).length;
      if (missing && !(await ask(`${missing} question${missing > 1 ? "s are" : " is"} not answered. Continue?`, "Continue", "Go back"))) return;
      const c = r.items.filter(i => t.answers[`${r.level}:${i}`] === L.grammarVocab[i].answer).length;
      if (c >= PLACEMENT_PASS && t.stage < t.rounds.length - 1) { t.stage++; save(); return go("placement"); }
      const s = scorePlacement(t);
      const entry = { id: Date.now(), type: "placement", date: Date.now(), placed: s.placed, rounds: s.rounds, test: t };
      store.set(HISTORY, [...history(), entry]);
      store.del(CURRENT); current = null;
      go("result", entry.id);
    };
  }

  /* ---------- RESULTS ---------- */
  function resItem(r, weak) {
    const inner = `<span class="tag ${weak ? "weak" : ""}">${weak ? "Fix: " : ""}${SKILL_LABEL[r.skill] || "Official test"}</span><b>${esc(r.name)}</b><span class="d">${esc(r.desc)}</span>`;
    return r.url ? `<a class="res" href="${esc(r.url)}" target="_blank" rel="noopener">${inner}</a>` : `<div class="res">${inner}</div>`;
  }

  function resourcesFor(level, weakSkills, limit = 9) {
    const list = window.RESOURCES[level] || [];
    const weak = list.filter(r => weakSkills.includes(r.skill));
    const rest = list.filter(r => !weakSkills.includes(r.skill));
    return [...weak.map(r => resItem(r, true)), ...rest.map(r => resItem(r, false))].slice(0, Math.max(limit, weak.length));
  }

  // Ring and number count up from 0 to the score.
  function animateScore(p) {
    const ring = app.querySelector(".score-ring"), num = document.getElementById("score-num");
    if (!ring) return;
    if (reduceMotion) { ring.style.setProperty("--p", p); num.textContent = p + "%"; return; }
    const t0 = performance.now(), dur = 1000;
    const step = now => {
      const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3), v = Math.round(p * e);
      ring.style.setProperty("--p", p * e); num.textContent = v + "%";
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  function renderResult(id) {
    const e = history().find(h => h.id === id);
    if (!e) return renderHome();
    if (e.type === "placement") return renderPlacementResult(e);

    const [vText, vClass] = verdictOf(e.pct);
    const passed = e.pct >= PASS;
    const close = !passed && e.pct >= PASS - 10;
    const idx = LV.indexOf(e.level);
    const nextLevel = LV[idx + 1];
    const lowerLevel = LV[idx - 1];
    const weak = SKILLS.filter(s => e.sections[s][1] && pct(...e.sections[s]) < PASS);
    const t = e.test;

    let headline, advice, resHtml;
    if (passed) {
      headline = e.pct >= STRONG ? `Excellent! You are a solid ${e.level}.` : `You passed ${e.level}!`;
      advice = nextLevel
        ? `${INFO[e.level].can} Now build the skills for <b>${nextLevel} ${INFO[nextLevel].name}</b> with your study plan, then take the ${nextLevel} test.`
        : `${INFO[e.level].can} You're at the top of the scale. Keep your English sharp with real-world material and consider the official ${INFO.C2.exam} for a certificate.`;
      resHtml = `
        ${weak.length ? `<h3>First, fix your weak spots at ${e.level}</h3><div class="res-list">${resourcesFor(e.level, weak, 0).join("")}</div>` : ""}
        <h3>${nextLevel ? `Get stronger: move up to ${nextLevel}` : "Keep your C2 English sharp"}</h3>
        <div class="res-list">${resourcesFor(nextLevel || e.level, weak).join("")}</div>`;
    } else {
      headline = close ? `So close! You need ${PASS}% to pass ${e.level}.` : `${e.level} isn't your level yet, and that's OK.`;
      advice = `Study the resources in your plan (your weak skills come first), then try the ${e.level} test again with new questions.` +
        (lowerLevel && e.pct < PASS - 15 ? ` Try the <b>${lowerLevel} test</b> too, to make sure the basics are solid.` : "");
      resHtml = `<h3>Learn what you need for ${e.level}</h3><div class="res-list">${resourcesFor(e.level, weak).join("")}</div>`;
    }

    const review = t.parts.filter(p => p.kind !== "writing").map(p => {
      const L = LEVELS[t.level];
      const qids = partQuestions(t, p);
      const right = qids.filter(qid => t.answers[qid] === getQ(t.level, qid).answer).length;
      const qs = qids.map((qid, k) => {
        const q = getQ(t.level, qid), a = t.answers[qid];
        return `<div class="question">
          <div class="q-text"><span class="q-num">${k + 1}</span><span>${esc(q.q)}</span>${a === q.answer ? `<span class="q-state ok">${icon("check")} Correct</span>` : a === undefined ? `<span class="q-state skip">${icon("circle")} No answer</span>` : `<span class="q-state no">${icon("x")} Wrong</span>`}</div>
          <div class="options ${q.options.some(o => o.length > 30) ? "long" : ""}">${q.options.map((o, i) => `<div class="option ${i === q.answer ? "correct" : i === a ? "wrong" : ""}"><span class="bubble">${LETTERS[i]}</span><span>${esc(o)}</span>${i === q.answer ? `<span class="opt-note">${i === a ? "Your answer · correct" : "Correct answer"}</span>` : i === a ? `<span class="opt-note">Your answer</span>` : ""}</div>`).join("")}</div>
          <div class="explain">${icon("bulb")}${esc(q.explain)}</div></div>`;
      }).join("");
      const texts = p.kind === "reading" ? p.items.map(i => `<details style="margin:10px 0"><summary>Show text: ${esc(L.reading[i].title)}</summary><div class="passage" style="margin-top:8px">${esc(L.reading[i].text)}</div></details>`).join("")
        : p.kind === "listening" ? p.items.map(i => `<details style="margin:10px 0"><summary>Show transcript: ${esc(L.listening[i].title)}</summary><div class="passage" style="margin-top:8px">${esc(L.listening[i].script)}</div></details>`).join("") : "";
      return `<details class="card review"><summary><span>${icon(PART_INFO[p.kind].icon)} ${p.title} <span class="muted small" style="font-family:var(--body)">· ${right}/${qids.length} correct</span></span></summary>${texts}${qs}</details>`;
    }).join("");

    const ringColor = scoreColor(e.pct);
    app.innerHTML = `
      <div class="card result-hero">
        <span class="stamp ${passed ? "good" : close ? "close" : "bad"}">${passed ? "Passed" : close ? "Almost" : "Not yet"}</span>
        <div class="score-ring" style="--ring:${ringColor}"><div><div><b id="score-num">0%</b><div class="muted small">${e.correct} of ${e.total} correct</div></div></div></div>
        <div>
          <div class="row" style="gap:8px">${badge(e.level)}<span class="verdict ${vClass}">${vText}</span></div>
          <h2>${headline}</h2>
          <p>${advice}</p>
          <p class="muted small" style="margin:0">${fmtDate(e.date)} · Pass mark ${PASS}%</p>
        </div>
      </div>

      <div class="grid-2" style="margin-top:16px">
        <div class="card">
          <h3>Score by skill</h3>
          <div class="bars">${SKILLS.map(s => {
            const [c, n] = e.sections[s], p = pct(c, n);
            return `<div class="bar-row"><span>${SKILL_LABEL[s]}</span><div class="bar"><span style="width:${p}%;background:${scoreColor(p)}"></span></div><b>${c}/${n}</b></div>`;
          }).join("")}</div>
        </div>
        <div class="card stack">
          <h3 style="margin:0">${weak.length ? "What to work on" : "No weak skills"}</h3>
          ${weak.length ? weak.map(s => `<div class="tip"><b>${SKILL_LABEL[s]}:</b> ${esc(window.SKILL_TIPS[s])}</div>`).join("") : `<p class="muted" style="margin:0">Every section is at ${PASS}% or more. Use the plan below to keep climbing.</p>`}
        </div>
      </div>

      <section class="section">
        <div class="section-head"><h2>Your study plan</h2><p class="muted small">Free resources picked for your score. Your weak skills come first.</p></div>
        <div class="stack">${resHtml}</div>
      </section>

      ${t.writing.trim() ? `<div class="card section">
        <h3>Your writing (${plural(words(t.writing), "word")})</h3>
        <div class="passage" id="mytext">${esc(t.writing)}</div>
        <p class="small">Self-check: ${t.checks.length}/${LEVELS[t.level].writing.checklist.length} points ticked. For a real CEFR mark, copy it into <a href="https://writeandimprove.com/" target="_blank" rel="noopener">Write & Improve</a>.</p>
        <button class="btn ghost" id="copyw">Copy my text</button></div>` : ""}

      <section class="section">
        <div class="section-head"><h2>Review your answers</h2><p class="muted small">Open a part to see the right answers and why.</p></div>
        <div class="stack">${review}</div>
      </section>

      <div class="row section" style="margin-top:32px">
        <button class="btn big" data-intro="${passed && nextLevel ? nextLevel : e.level}">${passed && nextLevel ? `Take the ${nextLevel} test` : `Try ${e.level} again (new questions)`} <span class="arrow">→</span></button>
        <button class="btn big ghost" data-go="home">All tests</button>
      </div>`;

    animateScore(e.pct);
    const cw = document.getElementById("copyw");
    if (cw) cw.onclick = () => {
      const fallback = () => { const r = document.createRange(); r.selectNodeContents(document.getElementById("mytext")); getSelection().removeAllRanges(); getSelection().addRange(r); cw.textContent = "Text selected – press Copy"; };
      try { navigator.clipboard.writeText(t.writing).then(() => cw.textContent = "Copied ✓", fallback); } catch { fallback(); }
    };
  }

  function renderPlacementResult(e) {
    const lvl = e.placed;
    const start = lvl || "A1";
    const nextL = lvl ? LV[LV.indexOf(lvl) + 1] : null;
    app.innerHTML = `
      <div class="card result-hero">
        <span class="stamp good">Placed</span>
        <div class="me-level"><span class="big-badge" style="--lvl:${lvlColor(start)};width:120px;height:120px;border-radius:28px;font-size:2.8rem">${start}</span></div>
        <div>
          <span class="verdict v-pass">Placement result</span>
          <h2>${lvl ? `Your level is about ${lvl} ${INFO[lvl].name}` : "You're at the beginning: start with A1"}</h2>
          <p>${lvl ? INFO[lvl].can : "That's a great place to start. A1 gives you the basics fast."}</p>
          <p class="muted small">The placement test only checks grammar and vocabulary. Take the full ${start} test (reading, listening and writing too) to confirm it.</p>
          <div class="row">
            <button class="btn" data-intro="${start}">Take the full ${start} test <span class="arrow">→</span></button>
            ${nextL ? `<button class="btn ghost" data-intro="${nextL}">Challenge: ${nextL} test</button>` : ""}
          </div>
        </div>
      </div>
      <div class="card" style="margin-top:16px">
        <h3>How you did at each stage</h3>
        <div class="bars">${e.rounds.map(r => `<div class="bar-row"><span>${badge(r.level, "sm")}</span><div class="bar"><span style="width:${pct(r.correct, r.total)}%;background:${r.correct >= PLACEMENT_PASS ? "var(--good)" : "var(--bad)"}"></span></div><b>${r.correct}/${r.total}</b></div>`).join("")}</div>
        <p class="muted small" style="margin:12px 0 0">You needed ${PLACEMENT_PASS} of ${PLACEMENT_PER_LEVEL} correct to move up a stage.</p>
      </div>
      <section class="section">
        <div class="section-head"><h2>Resources for you</h2><p class="muted small">${nextL ? `To move up to ${nextL}` : `To build your ${start} English`}</p></div>
        <div class="res-list">${resourcesFor(nextL || start, []).join("")}</div>
      </section>`;
  }

  /* ---------- HISTORY ---------- */
  function renderHistory() {
    const h = history().slice().reverse();
    const me = currentLevel();
    const best = bestScores();
    app.innerHTML = `
      <p class="eyebrow">Saved on this device</p>
      <h1>My results</h1>
      ${h.length ? `
        <div class="grid-2" style="margin:20px 0 16px">
          <div class="card banner">
            <div class="me-level">
              <span class="big-badge" style="--lvl:${me.passed ? lvlColor(me.passed) : "var(--muted)"}">${me.passed || "–"}</span>
              <div><h3>${me.passed ? `Highest pass: ${INFO[me.passed].name}` : "No level passed yet"}</h3><p class="muted small">${plural(h.length, "test")} taken</p></div>
            </div>
          </div>
          <div class="card">
            <h3>Best score by level</h3>
            <div class="bars">${LV.map(l => { const b = best[l]; return `<div class="bar-row"><span>${badge(l, "sm")}</span><div class="bar"><span style="width:${b ? b.pct : 0}%;background:${b ? scoreColor(b.pct) : "none"}"></span></div><b>${b ? b.pct + "%" : "–"}</b></div>`; }).join("")}</div>
          </div>
        </div>
        <div class="card table-wrap">
          <table class="history"><thead><tr><th>Date</th><th>Test</th><th>Score</th><th>Result</th><th></th></tr></thead><tbody>
          ${h.map(e => e.type === "placement"
            ? `<tr><td>${fmtDate(e.date)}</td><td>${icon("compass")} Placement</td><td>–</td><td>${e.placed ? badge(e.placed, "sm") : "Below A1"}</td><td><button class="btn ghost small" data-view="${e.id}">View</button></td></tr>`
            : `<tr><td>${fmtDate(e.date)}</td><td>${badge(e.level, "sm")}</td><td><b>${e.pct}%</b></td><td><span class="verdict ${verdictOf(e.pct)[1]}">${verdictOf(e.pct)[0]}</span></td><td><button class="btn ghost small" data-view="${e.id}">View</button></td></tr>`).join("")}
          </tbody></table>
        </div>
        <p style="margin-top:16px"><button class="btn ghost small" id="clear">Delete all my results</button></p>`
      : `<div class="card empty" style="margin-top:20px">
          <div class="big">${icon("stairs")}</div>
          <h2>No results yet</h2>
          <p class="muted">Take a test and your scores will appear here, every time you come back.</p>
          <button class="btn" data-go="home">Choose a test <span class="arrow">→</span></button>
        </div>`}`;
    app.querySelectorAll("[data-view]").forEach(b => b.onclick = () => go("result", +b.dataset.view));
    const c = document.getElementById("clear");
    if (c) c.onclick = async () => { if (await ask("Delete all saved results? This can't be undone.", "Delete")) { store.del(HISTORY); renderHistory(); } };
  }

  if (!LV.length) { app.innerHTML = `<div class="card"><p>Question files are missing (data/*.js).</p></div>`; return; }
  go("home");
})();

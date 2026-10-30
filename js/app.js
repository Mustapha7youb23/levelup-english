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
  const words = t => (t.trim().match(/\S+/g) || []).length;
  // In-page confirm dialog (artifact viewers block window.confirm/alert).
  function ask(text, okLabel = "OK", cancelLabel = "Cancel") {
    const m = document.getElementById("modal");
    document.getElementById("modal-text").textContent = text;
    const ok = document.getElementById("modal-ok"), cancel = document.getElementById("modal-cancel");
    ok.textContent = okLabel; cancel.textContent = cancelLabel;
    m.hidden = false; ok.focus();
    return new Promise(res => {
      const done = v => { m.hidden = true; ok.onclick = cancel.onclick = null; res(v); };
      ok.onclick = () => done(true);
      cancel.onclick = () => done(false);
    });
  }
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
      if (el) { el.textContent = "⏱ " + fmtTime(current.remaining); el.classList.toggle("low", current.remaining < 300); }
      if (current.remaining % 5 === 0) save();
      if (current.remaining === 0) finishLevel();
    }, 1000);
  }
  function stopTimer() { clearInterval(timerId); timerId = null; }

  /* ---------- navigation ---------- */
  function go(view, arg) {
    stopTimer(); if (synth) synth.cancel();
    window.scrollTo(0, 0);
    ({ home: renderHome, history: renderHistory, level: renderTest, placement: renderPlacement, result: renderResult }[view] || renderHome)(arg);
  }

  document.addEventListener("click", e => {
    const g = e.target.closest("[data-go]");
    if (g) {
      e.preventDefault();
      if (current && !confirmLeave()) return;
      go(g.dataset.go);
    }
  });
  function confirmLeave() {
    if (!current) return true;
    save();
    current = null;
    return true; // progress is saved; user can continue from Home
  }

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
    const next = me.passed ? LV[Math.min(LV.indexOf(me.passed) + 1, LV.length - 1)] : (me.placement || "A1");

    app.innerHTML = `
      <section class="hero">
        <h1>${hist.length ? "Welcome back! 👋" : "Find your real English level"}</h1>
        <p>Full CEFR tests from A1 to C2 with grammar, vocabulary, reading, listening and writing — timed like a real exam. After every test you get study resources: to fix your weak points if you fail, or to reach the next level if you pass.</p>
      </section>

      <div class="stack">
        ${saved ? `
          <div class="card banner">
            <div><h3>Unfinished test: ${saved.type === "placement" ? "Placement test" : saved.level + " " + INFO[saved.level].name}</h3>
            <p class="muted small" style="margin:0">Your answers were saved. ${saved.type === "level" ? "Time left: " + fmtTime(saved.remaining) : ""}</p></div>
            <div class="row"><button class="btn" id="resume">Continue</button><button class="btn ghost" id="discard">Discard</button></div>
          </div>` : ""}

        ${hist.length ? `
          <div class="card banner">
            <div>
              <h3>Your level now: ${me.passed ? `<span class="level-badge" style="--lvl:${lvlColor(me.passed)}">${me.passed}</span> ${INFO[me.passed].name}` : me.placement ? `about <span class="level-badge" style="--lvl:${lvlColor(me.placement)}">${me.placement}</span> (placement)` : "not passed yet"}</h3>
              <p class="muted small" style="margin:0">${hist.length} test${hist.length > 1 ? "s" : ""} taken · Recommended next: <b>${next} test</b></p>
            </div>
            <div class="row"><button class="btn" data-start="${next}">Take ${next} test</button><button class="btn ghost" data-go="history">My results</button></div>
          </div>` : ""}

        <div class="card banner" style="border-left-color:var(--C1)">
          <div>
            <h3>Don't know your level? Start with the placement test</h3>
            <p class="muted small" style="margin:0">About 10 minutes. It starts easy (A1) and gets harder until it finds your level. Then take the full test for that level.</p>
          </div>
          <button class="btn" id="placement">Start placement test</button>
        </div>

        <h2 style="margin-top:28px">Full level tests</h2>
        <p class="muted">Each test: 15 grammar & vocabulary questions, 2 reading texts, 2 listening recordings (you can play each one only twice, like the real exam) and a writing task. You need ${PASS}% to pass.</p>
        <div class="levels">
          ${LV.map(l => {
            const b = best[l];
            const qn = TEST_SIZE.gv + LEVELS[l].reading[0].questions.length * TEST_SIZE.reading + LEVELS[l].listening[0].questions.length * TEST_SIZE.listening;
            return `<button class="card level-card" style="--lvl:${lvlColor(l)}" data-start="${l}">
              <span class="level-badge">${l}</span>
              ${b ? `<span class="best ${b.pct >= PASS ? "pass-chip" : "fail-chip"}">Best: ${b.pct}%</span>` : ""}
              <h3 style="margin:6px 0 0">${INFO[l].name}</h3>
              <span class="meta">${qn} questions + writing · ${INFO[l].minutes} min</span>
              <span class="meta">Like: ${INFO[l].exam}</span>
            </button>`;
          }).join("")}
        </div>

        <h2 style="margin-top:28px">Want an official certificate?</h2>
        <div class="res-list">${window.OFFICIAL_TESTS.map(resItem).join("")}</div>
      </div>`;

    app.querySelectorAll("[data-start]").forEach(b => b.onclick = () => startLevel(b.dataset.start));
    document.getElementById("placement").onclick = () => { store.del(CURRENT); current = newPlacement(); save(); go("placement"); };
    const r = document.getElementById("resume");
    if (r) {
      r.onclick = () => { current = saved; go(saved.type === "placement" ? "placement" : "level"); };
      document.getElementById("discard").onclick = () => { store.del(CURRENT); renderHome(); };
    }
  }

  async function startLevel(level) {
    const saved = store.get(CURRENT, null);
    if (saved && !(await ask("You have an unfinished test. Start a new one and lose it?", "Start new test"))) return;
    current = newLevelTest(level); save(); go("level");
  }

  /* ---------- LEVEL TEST ---------- */
  function questionHTML(q, id, n, chosen) {
    return `<div class="question" data-q="${id}">
      <div class="q-text"><span class="q-num">${n}.</span>${esc(q.q)}</div>
      <div class="options">${q.options.map((o, i) => `
        <label class="option ${chosen === i ? "selected" : ""}">
          <input type="radio" name="${id}" value="${i}" ${chosen === i ? "checked" : ""}>
          <span>${esc(o)}</span>
        </label>`).join("")}
      </div></div>`;
  }

  function renderTest() {
    const t = current;
    if (!t) return renderHome();
    const L = LEVELS[t.level];
    const part = t.parts[t.partIdx];
    const ids = allQuestions(t);
    const answered = ids.filter(id => t.answers[id] !== undefined).length;
    // Question numbers continue across parts, like a real paper.
    let n = t.parts.slice(0, t.partIdx).reduce((s, p) => s + partQuestions(t, p).length, 0);

    let body = "";
    if (part.kind === "gv") {
      body = `<p class="muted">Choose the word or phrase that best completes each sentence.</p>` +
        part.items.map(i => questionHTML(L.grammarVocab[i], `gv:${i}`, ++n, t.answers[`gv:${i}`])).join("");
    } else if (part.kind === "reading") {
      body = part.items.map((p, k) => {
        const R = L.reading[p];
        return `<div class="card" style="margin-bottom:18px">
          <h3>Text ${k + 1}: ${esc(R.title)}</h3>
          <div class="split">
            <div class="passage">${esc(R.text)}</div>
            <div>${R.questions.map((q, j) => questionHTML(q, `rd:${p}:${j}`, ++n, t.answers[`rd:${p}:${j}`])).join("")}</div>
          </div></div>`;
      }).join("");
    } else if (part.kind === "listening") {
      body = (synth ? `<p class="muted">Read the questions first, then press Play. You can listen to each recording <b>${MAX_PLAYS} times</b>. Turn your sound on.</p>`
                    : `<p class="tip">Your browser can't play audio speech. Open this site in Chrome, Edge or Safari to do the listening part.</p>`) +
        part.items.map((p, k) => {
          const S = L.listening[p], used = t.plays[p] || 0;
          return `<div class="card" style="margin-bottom:18px">
            <h3>Recording ${k + 1}: ${esc(S.title)}</h3>
            <div class="audio-box">
              <button class="btn" data-play="${p}" ${used >= MAX_PLAYS || !synth ? "disabled" : ""}>▶ ${used ? "Play again" : "Play"}</button>
              <span class="plays" id="plays-${p}">Plays left: ${MAX_PLAYS - used}</span>
            </div>
            ${S.questions.map((q, j) => questionHTML(q, `ls:${p}:${j}`, ++n, t.answers[`ls:${p}:${j}`])).join("")}
          </div>`;
        }).join("");
    } else {
      const W = L.writing;
      body = `<div class="card">
        <p class="muted small">Writing is not marked automatically here — but it's what real exams test. Write your answer, check it with the list below, then paste it into <a href="https://writeandimprove.com/" target="_blank" rel="noopener">Write & Improve</a> (free, by Cambridge) to get a real CEFR level for your writing.</p>
        <p class="passage">${esc(W.prompt)}</p>
        <p class="muted small">Length: ${esc(W.words)} · <span id="wc">${words(t.writing)} words</span></p>
        <textarea id="writing" placeholder="Write your answer here…">${esc(t.writing)}</textarea>
        <div class="checklist" style="margin-top:14px"><b>Check your writing:</b>
          ${W.checklist.map((c, i) => `<label><input type="checkbox" data-check="${i}" ${t.checks.includes(i) ? "checked" : ""}> ${esc(c)}</label>`).join("")}
        </div></div>`;
    }

    const last = t.partIdx === t.parts.length - 1;
    app.innerHTML = `
      <div class="test-head">
        <div class="row"><span class="level-badge" style="--lvl:${lvlColor(t.level)}">${t.level}</span><h2 style="margin:0">${INFO[t.level].name} test</h2></div>
        <span class="timer" id="timer">⏱ ${fmtTime(t.remaining)}</span>
      </div>
      <div class="steps">${t.parts.map((p, i) => `<span class="step ${i === t.partIdx ? "active" : i < t.partIdx ? "done" : ""}">${i + 1}. ${p.title}</span>`).join("")}</div>
      <div class="progress"><span style="width:${pct(answered, ids.length)}%"></span></div>
      <h2>Part ${t.partIdx + 1}: ${part.title}</h2>
      ${body}
      <div class="row spread" style="margin-top:24px">
        <button class="btn ghost" id="prev" ${t.partIdx === 0 ? "disabled" : ""}>← Back</button>
        <span class="muted small" id="answered">${answered} / ${ids.length} answered</span>
        <button class="btn" id="next">${last ? "Finish & see my score" : "Next part →"}</button>
      </div>`;

    app.querySelectorAll('input[type="radio"]').forEach(inp => inp.onchange = () => {
      t.answers[inp.name] = +inp.value; save();
      inp.closest(".options").querySelectorAll(".option").forEach(o => o.classList.toggle("selected", o.contains(inp)));
      const a = ids.filter(id => t.answers[id] !== undefined).length;
      document.getElementById("answered").textContent = `${a} / ${ids.length} answered`;
      app.querySelector(".progress > span").style.width = pct(a, ids.length) + "%";
    });
    app.querySelectorAll("[data-play]").forEach(b => b.onclick = () => {
      const p = +b.dataset.play;
      if ((t.plays[p] || 0) >= MAX_PLAYS) return;
      t.plays[p] = (t.plays[p] || 0) + 1; save();
      app.querySelectorAll("[data-play]").forEach(x => x.disabled = true);
      b.textContent = "🔊 Playing…";
      document.getElementById(`plays-${p}`).textContent = `Plays left: ${MAX_PLAYS - t.plays[p]}`;
      speak(L.listening[p].script, SPEECH_RATE[t.level], () => {
        app.querySelectorAll("[data-play]").forEach(x => { const k = +x.dataset.play; x.disabled = (t.plays[k] || 0) >= MAX_PLAYS; x.textContent = "▶ " + ((t.plays[k] || 0) ? "Play again" : "Play"); });
      });
    });
    const ta = document.getElementById("writing");
    if (ta) ta.oninput = () => { t.writing = ta.value; document.getElementById("wc").textContent = words(ta.value) + " words"; save(); };
    app.querySelectorAll("[data-check]").forEach(c => c.onchange = () => {
      const i = +c.dataset.check; t.checks = c.checked ? [...new Set([...t.checks, i])] : t.checks.filter(x => x !== i); save();
    });
    document.getElementById("prev").onclick = () => { t.partIdx--; save(); go("level"); };
    document.getElementById("next").onclick = async () => {
      if (!last) { t.partIdx++; save(); return go("level"); }
      const left = ids.length - ids.filter(id => t.answers[id] !== undefined).length;
      if (left && !(await ask(`You have ${left} unanswered question${left > 1 ? "s" : ""}. Finish anyway?`, "Finish", "Keep working"))) return;
      finishLevel();
    };
    startTimer();
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
    let n = t.stage * PLACEMENT_PER_LEVEL;
    app.innerHTML = `
      <div class="test-head"><h2 style="margin:0">Placement test</h2><span class="muted">Stage ${t.stage + 1} of ${t.rounds.length}</span></div>
      <div class="steps">${t.rounds.map((x, i) => `<span class="step ${i === t.stage ? "active" : i < t.stage ? "done" : ""}">${x.level}</span>`).join("")}</div>
      <div class="card">
        <p class="muted">Choose the best answer. Don't guess wildly — if you don't know, pick what feels most natural.</p>
        ${r.items.map(i => questionHTML(L.grammarVocab[i], `${r.level}:${i}`, ++n, t.answers[`${r.level}:${i}`])).join("")}
      </div>
      <div class="row spread" style="margin-top:20px"><span></span><button class="btn" id="next">Next →</button></div>`;
    app.querySelectorAll('input[type="radio"]').forEach(inp => inp.onchange = () => {
      t.answers[inp.name] = +inp.value; save();
      inp.closest(".options").querySelectorAll(".option").forEach(o => o.classList.toggle("selected", o.contains(inp)));
    });
    document.getElementById("next").onclick = async () => {
      const missing = r.items.filter(i => t.answers[`${r.level}:${i}`] === undefined).length;
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
    const inner = `<span class="tag ${weak ? "weak" : ""}">${weak ? "Fix: " : ""}${SKILL_LABEL[r.skill] || "Test"}</span><div><b>${esc(r.name)}</b><span class="d">${esc(r.desc)}</span></div>`;
    return r.url ? `<a class="res" href="${esc(r.url)}" target="_blank" rel="noopener">${inner}</a>` : `<div class="res">${inner}</div>`;
  }

  function resourcesFor(level, weakSkills, limit = 9) {
    const list = window.RESOURCES[level] || [];
    const weak = list.filter(r => weakSkills.includes(r.skill));
    const rest = list.filter(r => !weakSkills.includes(r.skill));
    return [...weak.map(r => resItem(r, true)), ...rest.map(r => resItem(r, false))].slice(0, Math.max(limit, weak.length));
  }

  function renderResult(id) {
    const e = history().find(h => h.id === id);
    if (!e) return renderHome();
    if (e.type === "placement") return renderPlacementResult(e);

    const [vText, vClass] = verdictOf(e.pct);
    const passed = e.pct >= PASS;
    const idx = LV.indexOf(e.level);
    const nextLevel = LV[idx + 1];
    const lowerLevel = LV[idx - 1];
    const weak = SKILLS.filter(s => e.sections[s][1] && pct(...e.sections[s]) < PASS);
    const t = e.test;
    const ringColor = passed ? "var(--good)" : e.pct >= PASS - 10 ? "var(--warn)" : "var(--bad)";

    let headline, advice, resHtml;
    if (passed) {
      headline = e.pct >= STRONG ? `Excellent — you are a solid ${e.level}!` : `You passed ${e.level}!`;
      advice = nextLevel
        ? `${INFO[e.level].can} Now build the skills for <b>${nextLevel} ${INFO[nextLevel].name}</b> with the resources below, then take the ${nextLevel} test.`
        : `${INFO[e.level].can} You're at the top of the scale. Keep your English sharp with authentic material and consider the official ${INFO.C2.exam} for a certificate.`;
      resHtml = `
        ${weak.length ? `<h3>First, fix your weak spots at ${e.level}</h3><div class="res-list">${resourcesFor(e.level, weak, 0).join("")}</div>` : ""}
        <h3 style="margin-top:18px">${nextLevel ? `Get stronger: move up to ${nextLevel}` : "Keep your C2 English sharp"}</h3>
        <div class="res-list">${resourcesFor(nextLevel || e.level, weak).join("")}</div>`;
    } else {
      headline = e.pct >= PASS - 10 ? `So close! You need ${PASS}% to pass ${e.level}.` : `${e.level} is not your level yet — and that's OK.`;
      advice = `Study the resources below (your weak skills come first), then try the ${e.level} test again.` +
        (lowerLevel && e.pct < PASS - 15 ? ` Try the <b>${lowerLevel} test</b> too, to make sure the basics are solid.` : "");
      resHtml = `<h3>Learn what you need for ${e.level}</h3><div class="res-list">${resourcesFor(e.level, weak).join("")}</div>`;
    }

    const review = t.parts.filter(p => p.kind !== "writing").map(p => {
      const L = LEVELS[t.level];
      let n = 0;
      const qs = partQuestions(t, p).map(qid => {
        const q = getQ(t.level, qid), a = t.answers[qid];
        n++;
        return `<div class="question">
          <div class="q-text"><span class="q-num">${n}.</span>${esc(q.q)} ${a === q.answer ? "✅" : a === undefined ? "⚪ (no answer)" : "❌"}</div>
          <div class="options">${q.options.map((o, i) => `<div class="option ${i === q.answer ? "correct" : i === a ? "wrong" : ""}">${esc(o)}</div>`).join("")}</div>
          <div class="explain">💡 ${esc(q.explain)}</div></div>`;
      }).join("");
      const texts = p.kind === "reading" ? p.items.map(i => `<details style="margin:10px 0"><summary>Text: ${esc(L.reading[i].title)}</summary><div class="passage" style="margin-top:8px">${esc(L.reading[i].text)}</div></details>`).join("")
        : p.kind === "listening" ? p.items.map(i => `<details style="margin:10px 0"><summary>Transcript: ${esc(L.listening[i].title)}</summary><div class="passage" style="margin-top:8px">${esc(L.listening[i].script)}</div></details>`).join("") : "";
      return `<details class="card"><summary>${p.title} — review answers</summary>${texts}${qs}</details>`;
    }).join("");

    app.innerHTML = `
      <div class="card">
        <div class="row" style="gap:24px;align-items:center">
          <div class="score-ring" style="--p:${e.pct};--ring:${ringColor}"><div><div><b>${e.pct}%</b><div class="muted small">${e.correct}/${e.total}</div></div></div></div>
          <div style="flex:1;min-width:240px">
            <span class="verdict ${vClass}">${vText}</span>
            <div class="row"><span class="level-badge" style="--lvl:${lvlColor(e.level)}">${e.level}</span><h2 style="margin:0">${headline}</h2></div>
            <p style="margin-top:10px">${advice}</p>
            <p class="muted small" style="margin:0">${fmtDate(e.date)} · Pass mark ${PASS}%</p>
          </div>
        </div>
      </div>

      <div class="card" style="margin-top:16px">
        <h3>Score by skill</h3>
        <div class="bars">${SKILLS.map(s => {
          const [c, n] = e.sections[s], p = pct(c, n);
          return `<div class="bar-row"><span>${SKILL_LABEL[s]}</span><div class="bar"><span style="width:${p}%;background:${p >= PASS ? "var(--good)" : p >= PASS - 10 ? "var(--warn)" : "var(--bad)"}"></span></div><b>${c}/${n}</b></div>`;
        }).join("")}</div>
        ${weak.length ? `<div class="stack" style="margin-top:16px">${weak.map(s => `<div class="tip"><b>${SKILL_LABEL[s]}:</b> ${esc(window.SKILL_TIPS[s])}</div>`).join("")}</div>` : `<p class="muted" style="margin:14px 0 0">No weak skills — every section is at ${PASS}% or more. 💪</p>`}
      </div>

      <div class="card stack" style="margin-top:16px">
        <h2 style="margin:0">📚 Your study plan</h2>
        ${resHtml}
      </div>

      ${t.writing.trim() ? `<div class="card" style="margin-top:16px">
        <h3>Your writing (${words(t.writing)} words)</h3>
        <div class="passage" id="mytext">${esc(t.writing)}</div>
        <p class="small">Self-check: ${t.checks.length}/${LEVELS[t.level].writing.checklist.length} points ticked. Get a real CEFR score for it — copy it into <a href="https://writeandimprove.com/" target="_blank" rel="noopener">Write & Improve</a>.</p>
        <button class="btn ghost" id="copyw">Copy my text</button></div>` : ""}

      <h2 style="margin-top:28px">Review your answers</h2>
      <div class="stack">${review}</div>

      <div class="row" style="margin-top:24px">
        <button class="btn" data-start="${passed && nextLevel ? nextLevel : e.level}">${passed && nextLevel ? `Take the ${nextLevel} test →` : `Try ${e.level} again (new questions)`}</button>
        <button class="btn ghost" data-go="home">Home</button>
      </div>`;

    app.querySelectorAll("[data-start]").forEach(b => b.onclick = () => startLevel(b.dataset.start));
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
      <div class="card">
        <span class="verdict v-pass">Placement result</span>
        <h1>${lvl ? `Your level is about <span class="level-badge" style="--lvl:${lvlColor(lvl)};font-size:1.4rem;height:44px">${lvl}</span> ${INFO[lvl].name}` : "You're at the beginning: start with A1"}</h1>
        <p>${lvl ? INFO[lvl].can : "That's a great place to start — A1 will give you the basics fast."}</p>
        <div class="bars" style="margin:16px 0">${e.rounds.map(r => `<div class="bar-row"><span>${r.level}</span><div class="bar"><span style="width:${pct(r.correct, r.total)}%;background:${r.correct >= PLACEMENT_PASS ? "var(--good)" : "var(--bad)"}"></span></div><b>${r.correct}/${r.total}</b></div>`).join("")}</div>
        <p class="muted small">The placement test only checks grammar and vocabulary. Take the full ${start} test (reading, listening and writing too) to confirm it.</p>
        <div class="row">
          <button class="btn" data-start="${start}">Take the full ${start} test →</button>
          ${nextL ? `<button class="btn ghost" data-start="${nextL}">Challenge: ${nextL} test</button>` : ""}
        </div>
      </div>
      <div class="card stack" style="margin-top:16px">
        <h2 style="margin:0">📚 Resources for you</h2>
        <h3>${nextL ? `Move up to ${nextL}` : `Build your ${start} English`}</h3>
        <div class="res-list">${resourcesFor(nextL || start, []).join("")}</div>
      </div>`;
    app.querySelectorAll("[data-start]").forEach(b => b.onclick = () => startLevel(b.dataset.start));
  }

  /* ---------- HISTORY ---------- */
  function renderHistory() {
    const h = history().slice().reverse();
    const me = currentLevel();
    app.innerHTML = `
      <h1>My results</h1>
      <p class="muted">Saved in this browser, so they are here every time you come back.</p>
      ${h.length ? `
        <div class="card" style="margin-bottom:16px">
          <h3>Progress by level</h3>
          <div class="bars">${LV.map(l => { const b = bestScores()[l]; return `<div class="bar-row"><span><span class="level-badge" style="--lvl:${lvlColor(l)};min-width:36px;height:24px;font-size:.8rem">${l}</span></span><div class="bar"><span style="width:${b ? b.pct : 0}%;background:${b && b.pct >= PASS ? "var(--good)" : "var(--bad)"}"></span></div><b>${b ? b.pct + "%" : "–"}</b></div>`; }).join("")}</div>
          <p class="muted small" style="margin:12px 0 0">Highest level passed: <b>${me.passed || "none yet"}</b></p>
        </div>
        <div class="card" style="overflow-x:auto">
          <table class="history"><thead><tr><th>Date</th><th>Test</th><th>Score</th><th>Result</th><th></th></tr></thead><tbody>
          ${h.map(e => e.type === "placement"
            ? `<tr><td>${fmtDate(e.date)}</td><td>Placement</td><td>–</td><td>${e.placed || "Below A1"}</td><td><button class="btn ghost" data-view="${e.id}">View</button></td></tr>`
            : `<tr><td>${fmtDate(e.date)}</td><td><span class="level-badge" style="--lvl:${lvlColor(e.level)};min-width:36px;height:24px;font-size:.8rem">${e.level}</span></td><td>${e.pct}%</td><td><span class="verdict ${verdictOf(e.pct)[1]}" style="margin:0">${verdictOf(e.pct)[0]}</span></td><td><button class="btn ghost" data-view="${e.id}">View</button></td></tr>`).join("")}
          </tbody></table>
        </div>
        <p style="margin-top:16px"><button class="btn ghost" id="clear">Delete all my results</button></p>`
      : `<div class="card"><p>No tests yet.</p><button class="btn" data-go="home">Take your first test</button></div>`}`;
    app.querySelectorAll("[data-view]").forEach(b => b.onclick = () => go("result", +b.dataset.view));
    const c = document.getElementById("clear");
    if (c) c.onclick = async () => { if (await ask("Delete all saved results? This can't be undone.", "Delete")) { store.del(HISTORY); renderHistory(); } };
  }

  if (!LV.length) { app.innerHTML = `<div class="card"><p>Question files are missing (data/*.js).</p></div>`; return; }
  renderHome();
})();

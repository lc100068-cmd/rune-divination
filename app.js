/* =========================================================
   銀河のルーン占い  -  アプリ本体
   ========================================================= */
(function () {
  "use strict";

  var GLYPHS = RUNES.map(function (r) { return r.s; });
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var el = function (id) { return document.getElementById(id); };
  var layer   = el("runeLayer");
  var potWrap = el("potWrap");

  var state = { mode: 1, question: "", result: null };

  /* ---------- ハートのボケ ---------- */
  (function hearts() {
    var box = el("hearts");
    for (var i = 0; i < 12; i++) {
      var h = document.createElement("span");
      h.className = "heart";
      h.textContent = i % 3 === 0 ? "♡" : "❤";
      h.style.left = Math.random() * 96 + "%";
      h.style.top = 60 + Math.random() * 40 + "%";
      h.style.fontSize = 9 + Math.random() * 14 + "px";
      h.style.animationDuration = 14 + Math.random() * 16 + "s";
      h.style.animationDelay = -Math.random() * 20 + "s";
      box.appendChild(h);
    }
  })();

  /* ---------- 壺から舞い上がるルーン ---------- */
  function spawnRune(opts) {
    opts = opts || {};
    var big = opts.big;
    var wrap = document.createElement("div");
    wrap.className = "fly";

    var amp = (14 + Math.random() * 30) * (Math.random() < 0.5 ? -1 : 1);
    var dur = (big ? 2.4 : 3.4) + Math.random() * 2.2;

    wrap.style.setProperty("--x", (Math.random() * (big ? 90 : 64) - (big ? 45 : 32)) + "px");
    wrap.style.setProperty("--rise", -(150 + Math.random() * 170) + "px");
    wrap.style.setProperty("--dur", dur + "s");
    wrap.style.setProperty("--delay", (opts.delay || 0) + "s");
    wrap.style.setProperty("--top", (30 + Math.random() * 5) + "%");

    var glyph = document.createElement("i");
    glyph.textContent = GLYPHS[(Math.random() * GLYPHS.length) | 0];
    glyph.style.setProperty("--size", (big ? 20 + Math.random() * 18 : 15 + Math.random() * 13) + "px");
    glyph.style.setProperty("--amp", amp + "px");
    glyph.style.setProperty("--sdur", (2.2 + Math.random() * 2) + "s");
    wrap.appendChild(glyph);

    var smoke = document.createElement("div");
    smoke.className = "smoke";
    smoke.style.setProperty("--x", (Math.random() * 40 - 20) + "px");
    smoke.style.setProperty("--dur", dur + "s");
    smoke.style.setProperty("--delay", (opts.delay || 0) + "s");

    layer.appendChild(smoke);
    layer.appendChild(wrap);
    setTimeout(function () { wrap.remove(); smoke.remove(); }, (dur + (opts.delay || 0)) * 1000 + 400);
  }

  /* 待機中はゆっくり漂わせる */
  if (!reduceMotion) {
    for (var k = 0; k < 5; k++) spawnRune({ delay: k * 0.7 });
    setInterval(function () { spawnRune({ delay: Math.random() * 0.6 }); }, 1100);
  }

  function burst(count) {
    for (var i = 0; i < count; i++) spawnRune({ big: true, delay: i * 0.07 });
  }

  /* ---------- 画面遷移 ---------- */
  function show(id) {
    ["stepIntro", "stepFocus", "stepCasting", "stepResult"].forEach(function (s) {
      el(s).classList.toggle("hidden", s !== id);
    });
  }

  function chipLabel(mode) {
    return (mode === 3 ? "ᚨᛉᛞ " : "ᚱ ") + SPREADS[mode].label;
  }

  /* ---------- ① スプレッド選択 ---------- */
  Array.prototype.forEach.call(document.querySelectorAll(".spread-card"), function (card) {
    card.addEventListener("click", function () {
      state.mode = parseInt(card.dataset.mode, 10);
      el("modeChip").textContent = chipLabel(state.mode);
      show("stepFocus");
      el("stepFocus").scrollIntoView({ behavior: "smooth", block: "center" });
    });
  });

  el("backBtn").addEventListener("click", function () { show("stepIntro"); });

  /* ---------- ② 占う ---------- */
  function drawRunes(n) {
    var pool = RUNES.slice();
    var picked = [];
    for (var i = 0; i < n; i++) {
      var idx = (Math.random() * pool.length) | 0;
      var r = pool.splice(idx, 1)[0];
      picked.push({ rune: r, reversed: r.noRv ? false : Math.random() < 0.38 });
    }
    return picked;
  }

  el("castBtn").addEventListener("click", function () {
    var btn = this;
    btn.disabled = true;
    state.question = el("q").value.trim();

    show("stepCasting");
    potWrap.classList.add("lit");
    if (!reduceMotion) potWrap.classList.add("shake");
    burst(state.mode === 3 ? 26 : 18);

    var msgs = ["壺のふたが、ひとりでに開きます…", "ルーンが宙をくるくると舞っています…", "文字たちが、あなたの問いに応えます…"];
    var step = 0;
    el("castingText").textContent = msgs[0];
    var timer = setInterval(function () {
      step++;
      if (step < msgs.length) el("castingText").textContent = msgs[step];
    }, 1100);

    setTimeout(function () {
      clearInterval(timer);
      potWrap.classList.remove("shake");
      potWrap.classList.remove("lit");
      state.result = drawRunes(state.mode);
      renderResult();
      btn.disabled = false;
    }, reduceMotion ? 600 : 3400);
  });

  /* ---------- ③ 結果表示 ---------- */
  function renderResult() {
    var positions = SPREADS[state.mode].positions;
    el("resultChip").textContent = chipLabel(state.mode);

    var echo = el("qEcho");
    if (state.question) {
      echo.innerHTML = "<span>あなたの問い：</span>" + escapeHtml(state.question);
      echo.classList.remove("hidden");
    } else {
      echo.classList.add("hidden");
    }

    var box = el("cards");
    box.innerHTML = "";
    state.result.forEach(function (item, i) {
      var r = item.rune;
      var card = document.createElement("div");
      card.className = "rune-card";
      card.style.animationDelay = (i * 0.45) + "s";
      card.innerHTML =
        '<div class="pos">' + positions[i] + "</div>" +
        '<div class="glyph' + (item.reversed ? " rev" : "") + '">' + r.s + "</div>" +
        '<div class="nm">' + r.ja + "</div>" +
        '<div class="en">' + r.en + "</div>" +
        '<div class="tag' + (item.reversed ? " reversed" : "") + '">' +
          (item.reversed ? "逆位置・" : "正位置・") + r.key + "</div>" +
        '<div class="msg">' + (item.reversed ? r.rv : r.up) + "</div>";
      box.appendChild(card);
    });

    var sum = el("summary");
    sum.innerHTML = '<h3>❖ 全体からのメッセージ</h3><p>' + buildSummary() + "</p>";
    sum.style.animation = "cardIn .7s ease-out " + (state.result.length * 0.45 + 0.2) + "s forwards";
    sum.style.opacity = 0;

    show("stepResult");
    el("stepResult").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function buildSummary() {
    var keys = state.result.map(function (x) { return x.rune.key.split("・")[0]; });
    var revCount = state.result.filter(function (x) { return x.reversed; }).length;
    var head = state.mode === 3
      ? "「" + keys[0] + "」から「" + keys[1] + "」へ、そして「" + keys[2] + "」へ。この流れが、いまのあなたの物語です。"
      : "いまのあなたのキーワードは「" + keys[0] + "」。";
    var tail;
    if (revCount === 0) {
      tail = "追い風が吹いています。感じたことをそのまま行動にうつして大丈夫。あなたの選択は守られています✨";
    } else if (revCount === state.result.length) {
      tail = "いまは内側を整える時間。急がずに休むことが、次の扉をひらく鍵になります。焦らなくて大丈夫ですよ🌙";
    } else {
      tail = "進む部分と、ゆるめる部分があります。無理をしているところに気づけたら、そこだけそっと手を離してみて🌿";
    }
    return head + tail;
  }

  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* ---------- ④ 結果のアクション ---------- */
  el("againBtn").addEventListener("click", function () {
    show("stepIntro");
    el("q").value = "";
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  el("copyBtn").addEventListener("click", function () {
    var positions = SPREADS[state.mode].positions;
    var lines = ["【銀河のルーン占い｜" + SPREADS[state.mode].label + "】"];
    if (state.question) lines.push("問い：" + state.question);
    state.result.forEach(function (item, i) {
      var r = item.rune;
      lines.push("");
      lines.push("◆ " + positions[i] + "：" + r.s + " " + r.ja + "（" + (item.reversed ? "逆位置" : "正位置") + "・" + r.key + "）");
      lines.push(item.reversed ? r.rv : r.up);
    });
    lines.push("");
    lines.push("― " + buildSummary());
    copy(lines.join("\n"));
  });

  function copy(text) {
    var done = function () { toast("結果をコピーしました ✨"); };
    var fail = function () { toast("コピーできませんでした"); };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done, fail);
    } else {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy") ? done() : fail(); } catch (e) { fail(); }
      ta.remove();
    }
  }

  var toastTimer;
  function toast(msg) {
    var t = el("toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove("show"); }, 2000);
  }
})();

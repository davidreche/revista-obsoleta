/* OBSOLETA · animações e interações */
document.documentElement.classList.add("js");
(function(){
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, el=document) => el.querySelector(s);
  const $$ = (s, el=document) => [...el.querySelectorAll(s)];
  const fmt = (n, dec) => n.toLocaleString("pt-BR", {minimumFractionDigits:dec, maximumFractionDigits:dec});

  /* ---------- digitação sem reflow ----------
     O texto inteiro é montado de uma vez, letra por letra escondida;
     as quebras de linha já ficam no lugar final e só a visibilidade muda. */
  function typeSetup(el, text){
    el.textContent = "";
    const chars = [];
    text.split(/(\s+)/).forEach(part => {
      if (!part) return;
      if (/^\s+$/.test(part)) { el.append(" "); return; }
      const w = document.createElement("span"); w.className = "tw-word";
      [...part].forEach(c => { const s = document.createElement("span"); s.className = "tw-ch"; s.textContent = c; w.append(s); chars.push(s); });
      el.append(w);
    });
    return chars;
  }
  function typeRun(chars, speed, done){
    let i = 0, timer;
    (function step(){
      if (i > 0) chars[i - 1].classList.remove("cur");
      if (i >= chars.length) { if (chars.length) chars[chars.length - 1].classList.add("cur"); done && done(); return; }
      chars[i].classList.add("vis", "cur"); i++;
      timer = setTimeout(step, typeof speed === "function" ? speed() : speed);
    })();
    return () => clearTimeout(timer);
  }

  /* ---------- títulos: quebra em palavras para subir uma a uma ---------- */
  $$(".split").forEach(h => {
    const nodes = [...h.childNodes];
    h.textContent = "";
    let i = 0;
    nodes.forEach(n => {
      if (n.nodeType === 3) {
        n.textContent.split(/(\s+)/).forEach(part => {
          if (!part) return;
          if (/^\s+$/.test(part)) { h.append(" "); return; }
          const w = document.createElement("span"); w.className = "w";
          const s = document.createElement("span"); s.textContent = part;
          s.style.transitionDelay = (i++ * 60) + "ms";
          w.append(s); h.append(w);
        });
      } else h.append(n);
    });
  });

  /* ---------- contadores ---------- */
  function countUp(el){
    const to = parseFloat(el.dataset.to), dec = +(el.dataset.dec || 0);
    el.dataset.started = "1";
    if (reduce) { el.textContent = fmt(to, dec); return; }
    const dur = 1600, t0 = performance.now();
    (function tick(t){
      const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 4);
      el.textContent = fmt(to * e, dec);
      if (p < 1) requestAnimationFrame(tick);
    })(t0);
  }
  function reserveCounts(){
    $$(".count").forEach(el => {
      if (el.dataset.done) return;
      const dec = +(el.dataset.dec || 0), shown = el.textContent;
      el.style.minWidth = "";
      el.textContent = fmt(parseFloat(el.dataset.to), dec);
      el.style.minWidth = el.getBoundingClientRect().width + "px";
      el.textContent = el.dataset.started ? shown : fmt(0, dec);
    });
  }
  reserveCounts();
  if (document.fonts) document.fonts.ready.then(reserveCounts);

  /* ---------- pontos: 100 pessoas, acende o percentual ---------- */
  $$(".dots").forEach(d => { d.innerHTML = "<i></i>".repeat(100); });
  function lightDots(d){
    const on = +d.dataset.on, dots = $$("i", d);
    dots.forEach((i, k) => {
      if (k >= on) return;
      if (reduce) i.classList.add("on");
      else setTimeout(() => i.classList.add("on"), 300 + k * 14);
    });
  }

  /* ---------- revelação ao rolar ---------- */
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      const el = en.target;
      el.classList.add("in");
      if (el.classList.contains("count")) countUp(el);
      if (el.classList.contains("meter")) { const i = $("i", el); i.style.width = i.dataset.w + "%"; }
      if (el.classList.contains("dots")) lightDots(el);
      if (el.id === "devbox") typeDevbox();
      if (el.classList.contains("terms")) autoTerms();
      io.unobserve(el);
    });
  }, {threshold:.18, rootMargin:"0px 0px -6% 0px"});
  $$(".reveal,.split,.photo,.chart,.count,.meter,.dots").forEach(el => io.observe(el));

  /* ---------- barra superior, progresso, rota dos capítulos, parallax ---------- */
  const bar = $("#bar"), prog = $("#progress"), cover = $("#capa");
  const para = $$("[data-parallax]");
  const rotaLinks = $$("#rota a"), chapters = rotaLinks.map(a => $(a.getAttribute("href")));
  let ticking = false;
  function onScroll(){
    const y = scrollY, h = document.documentElement.scrollHeight - innerHeight;
    prog.style.transform = `scaleX(${h > 0 ? y / h : 0})`;
    bar.classList.toggle("show", y > cover.offsetHeight * .6);
    let cur = -1;
    chapters.forEach((c, i) => { if (c.getBoundingClientRect().top < innerHeight * .4) cur = i; });
    rotaLinks.forEach((a, i) => { a.classList.toggle("on", i === cur); a.classList.toggle("done", i < cur); });
    if (!reduce) {
      para.forEach(img => {
        const r = img.parentElement.getBoundingClientRect();
        if (r.bottom > 0 && r.top < innerHeight) {
          const p = (r.top + r.height / 2 - innerHeight / 2) / innerHeight;
          img.style.transform = `translateY(${p * -40}px) scale(1.12)`;
        }
      });
    }
    ticking = false;
  }
  addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, {passive:true});
  onScroll();

  /* ---------- capa: brasas subindo ---------- */
  const cv = $("#embers");
  if (cv && !reduce) {
    const ctx = cv.getContext("2d");
    let W, H, dpr, parts = [], running = true;
    function size(){
      dpr = Math.min(devicePixelRatio || 1, 2);
      W = cv.clientWidth; H = cv.clientHeight;
      cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function spawn(initial){
      return {
        x: Math.random() * W, y: initial ? Math.random() * H : H + 10,
        r: Math.random() * 2.2 + .6, vy: -(Math.random() * 1.1 + .4), vx: (Math.random() - .5) * .4,
        ph: Math.random() * Math.PI * 2, life: Math.random() * .5 + .5, hue: 18 + Math.random() * 26
      };
    }
    size();
    const N = Math.round(Math.min(110, W / 12));
    for (let i = 0; i < N; i++) parts.push(spawn(true));
    addEventListener("resize", size);
    new IntersectionObserver(([e]) => { running = e.isIntersecting; if (running) requestAnimationFrame(draw); }).observe(cover);
    function draw(t){
      if (!running) return;
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = "lighter";
      parts.forEach((p, i) => {
        p.y += p.vy; p.x += p.vx + Math.sin(t / 900 + p.ph) * .35;
        const fade = Math.max(0, Math.min(1, p.y / H)) * p.life;
        const flick = .65 + Math.sin(t / 120 + p.ph * 7) * .35;
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 5);
        g.addColorStop(0, `hsla(${p.hue},100%,62%,${fade * flick})`);
        g.addColorStop(1, `hsla(${p.hue},100%,50%,0)`);
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 5, 0, Math.PI * 2); ctx.fill();
        if (p.y < -20) parts[i] = spawn(false);
      });
      ctx.globalCompositeOperation = "source-over";
      requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);
  }

  /* ---------- capa: janela de atualização ---------- */
  const dlg = $("#dialog"), dh = $("#dlg-h"), dp = $("#dlg-p"), dbar = $("#dlg-bar"), dpct = $("#dlg-pct");
  let stopTyping = null;
  function typeTitle(text, delay){
    if (stopTyping) stopTyping();
    const chars = typeSetup(dh, text);
    if (reduce) { chars.forEach(c => c.classList.add("vis")); return; }
    const t = setTimeout(() => { stopTyping = typeRun(chars, () => 38 + Math.random() * 40); }, delay || 0);
    stopTyping = () => clearTimeout(t);
  }
  function setProgress(target){
    dbar.style.width = target + "%";
    if (reduce) { dpct.textContent = `Instalando… ${target}%`; return; }
    const from = parseInt(dpct.dataset.v || "0", 10), t0 = performance.now();
    (function tick(t){
      const p = Math.min(1, (t - t0) / 1200), v = Math.round(from + (target - from) * (1 - Math.pow(1 - p, 3)));
      dpct.textContent = `Instalando… ${v}%`; dpct.dataset.v = v; $("#dlg-prog").dataset.tip = `Atualização do planeta: ${v}% instalada`;
      if (p < 1) requestAnimationFrame(tick);
    })(t0);
  }
  typeTitle(dh.dataset.text, 1700);
  setTimeout(() => setProgress(97), 2000);

  const msgs = [
    ["Lembrete adiado", "Enquanto você adiava, mais aparelhos foram para a gaveta. 85% dos entrevistados em uma pesquisa online disseram guardar algum eletrônico sem utilidade em casa.", "Fonte: Green Eletron e Radar Pesquisas, pesquisa de 2023 (2.640 pessoas, 21 estados)."],
    ["Adiado de novo", "72% dos entrevistados têm celulares guardados em casa. Entre quem guarda aparelhos, 31% disseram que eles estão parados há mais de um ano.", "Fonte: Green Eletron, pesquisa de 2021, divulgada por Convergência Digital (7 out. 2021)."],
    ["Não dá mais para adiar", "Até 2030, o mundo pode gerar 82 milhões de toneladas de lixo eletrônico por ano.", "Fonte: UNITAR/ITU, Global E-waste Monitor 2024 (projeção)."]
  ];
  const dsrc = $("#dlg-src");
  let later = 0;
  $("#dlg-later").addEventListener("click", () => {
    const m = msgs[Math.min(later, msgs.length - 1)];
    later++;
    dlg.classList.remove("shake"); void dlg.offsetWidth; dlg.classList.add("shake");
    typeTitle(m[0]); dp.textContent = m[1]; dsrc.textContent = m[2];
    setProgress(Math.max(10, 97 - later * 29));
  });
  dlg.addEventListener("animationend", e => {
    if (e.animationName === "pop") dlg.classList.add("shown");
    if (e.animationName === "shake") dlg.classList.remove("shake");
  });
  setTimeout(() => dlg.classList.add("shown"), 2100);
  $("#dlg-now").addEventListener("click", () => $("#editorial").scrollIntoView());

  /* ---------- cap. 4: conceitos sempre visíveis; passar o mouse destaca a frase no texto ---------- */
  const terms = $$(".term");
  function showTerm(t){
    terms.forEach(x => x.classList.toggle("lit", x.dataset.t === t));
    $$(".def").forEach(s => s.classList.toggle("lit", s.dataset.t === t));
  }
  terms.forEach(x => {
    ["mouseenter","focus"].forEach(ev => x.addEventListener(ev, () => showTerm(x.dataset.t)));
    ["mouseleave","blur"].forEach(ev => x.addEventListener(ev, () => showTerm(null)));
  });
  function autoTerms(){}

  /* ---------- Em vídeo: toca sozinho quando aparece na tela ---------- */
  const vids = $$(".vplayer video");
  if ("IntersectionObserver" in window) {
    const vio = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { const p = e.target.play(); if (p) p.catch(() => {}); }
      else e.target.pause();
    }), { threshold: .35 });
    vids.forEach(v => vio.observe(v));
  }
  $$(".vsound").forEach(btn => {
    const v = btn.parentElement.querySelector("video");
    const sync = () => { btn.setAttribute("aria-pressed", String(!v.muted)); btn.textContent = v.muted ? "Ativar som" : "Tirar som"; };
    btn.addEventListener("click", () => {
      v.muted = !v.muted;
      if (!v.muted) vids.forEach(o => { if (o !== v) o.muted = true; });
      const p = v.play(); if (p) p.catch(() => {});
    });
    v.addEventListener("volumechange", () => $$(".vsound").forEach(b => { const o = b.parentElement.querySelector("video"); b.setAttribute("aria-pressed", String(!o.muted)); b.textContent = o.muted ? "Ativar som" : "Tirar som"; }));
    sync();
  });

  /* ---------- cap. 10: caixa do desenvolvedor digitada ---------- */
  let typed = false;
  function typeDevbox(){
    if (typed) return; typed = true;
    if (reduce) return;
    const lines = $$("#devbox [data-type]").map(l => typeSetup(l, l.textContent));
    let li = 0;
    (function next(){
      if (li >= lines.length) return;
      if (li > 0) lines[li - 1].forEach(c => c.classList.remove("cur"));
      typeRun(lines[li++], 18, () => setTimeout(next, 260));
    })();
  }

  /* ---------- colunas laterais: só ficam fixas se couberem na tela ---------- */
  function fitAsides(){
    $$(".aside").forEach(a => {
      a.classList.remove("tall");
      if (a.offsetHeight > innerHeight - 110) a.classList.add("tall");
    });
  }
  fitAsides();
  addEventListener("resize", fitAsides);
  addEventListener("load", fitAsides);
  if (document.fonts) document.fonts.ready.then(fitAsides);

  /* ---------- tooltips dos gráficos ---------- */
  const tip = $("#tip");
  $$("g.m,[data-tip]").forEach(g => {
    g.addEventListener("mousemove", e => {
      e.stopPropagation();
      tip.textContent = g.dataset.tip; tip.hidden = false;
      tip.style.left = Math.min(e.clientX + 14, innerWidth - 270) + "px";
      tip.style.top = Math.min(e.clientY + 14, innerHeight - tip.offsetHeight - 8) + "px";
    });
    g.addEventListener("mouseleave", () => tip.hidden = true);
  });
})();

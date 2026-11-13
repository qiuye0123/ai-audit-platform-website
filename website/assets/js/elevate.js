/* 第 14 轮提升层动效：知识图谱提取 / 规则流水线 / 质量时间轴 / 条款矩阵入场。
   无 JS 时内容完整可见；JS 仅叠加顺序点亮与流动。尊重系统减弱动效。 */
(function () {
  "use strict";

  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function observe(el, cb, threshold) {
    if (!("IntersectionObserver" in window)) { cb(el); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { io.unobserve(e.target); cb(e.target); }
      });
    }, { threshold: threshold || 0.2 });
    io.observe(el);
  }

  /* 知识图谱：先描边，再点亮节点，最后逐个提取实体；循环 */
  function initKx(board) {
    if (board.dataset.kxInit) { return; }
    board.dataset.kxInit = "1";
    board.classList.add("is-ready");
    var edges = [].slice.call(board.querySelectorAll("[data-kx-edge]"));
    var nodes = [].slice.call(board.querySelectorAll("[data-kx-node]"));
    var entities = [].slice.call(board.querySelectorAll("[data-kx-entity]"));
    var all = edges.concat(nodes, entities);
    if (reduce) { all.forEach(function (n) { n.classList.add("is-lit"); }); return; }
    var timers = [];
    function run() {
      timers.forEach(clearTimeout); timers = [];
      all.forEach(function (n) { n.classList.remove("is-lit"); });
      var t = 0;
      edges.forEach(function (n) { timers.push(setTimeout(function () { n.classList.add("is-lit"); }, t)); t += 130; });
      t += 120;
      nodes.forEach(function (n) { timers.push(setTimeout(function () { n.classList.add("is-lit"); }, t)); t += 70; });
      t += 120;
      entities.forEach(function (n) { timers.push(setTimeout(function () { n.classList.add("is-lit"); }, t)); t += 170; });
      timers.push(setTimeout(run, t + 2600));
    }
    run();
  }

  /* 规则流水线：逐级激活，连接件 traveling pulse；循环 */
  function initRs(board) {
    if (board.dataset.rsInit) { return; }
    board.dataset.rsInit = "1";
    board.classList.add("is-ready");
    var stages = [].slice.call(board.querySelectorAll("[data-rs-stage]"));
    var links = [].slice.call(board.querySelectorAll("[data-rs-link]"));
    if (reduce) { stages.forEach(function (s) { s.classList.add("is-active"); }); return; }
    var timers = [];
    function run() {
      timers.forEach(clearTimeout); timers = [];
      stages.forEach(function (s) { s.classList.remove("is-active"); });
      links.forEach(function (l) { l.classList.remove("is-flow"); });
      var t = 0;
      stages.forEach(function (s, i) {
        timers.push(setTimeout(function () { s.classList.add("is-active"); }, t));
        if (links[i]) {
          timers.push(setTimeout(function () {
            links[i].classList.remove("is-flow");
            void links[i].offsetWidth;
            links[i].classList.add("is-flow");
          }, t + 280));
        }
        t += 620;
      });
      timers.push(setTimeout(run, t + 2400));
    }
    run();
  }

  /* 质量时间轴：横向轨道左→右填充 + 节点顺序点亮 + 卡片上升；窄屏由 CSS 转纵向 */
  function initQt(board) {
    if (board.dataset.qtInit) { return; }
    board.dataset.qtInit = "1";
    board.classList.add("is-ready");
    var fill = board.querySelector(".qt-spine-fill");
    var steps = [].slice.call(board.querySelectorAll("[data-qt-step]"));
    function progress(p) { if (fill) { fill.style.setProperty("--qt-p", String(p)); } }
    if (reduce) {
      steps.forEach(function (s) { s.classList.add("is-visible"); });
      progress(1);
      board.classList.add("is-done");
      return;
    }
    progress(0);
    var t = 0;
    steps.forEach(function (s, i) {
      setTimeout(function () {
        s.classList.add("is-visible");
        progress((i + 1) / steps.length);
      }, t);
      t += 420;
    });
    setTimeout(function () { board.classList.add("is-done"); }, t + 160);
  }

  /* 第三案例条款矩阵：滚动入场时逐列点亮（与第一案例纵向扫描区分） */
  function initCp(art) {
    if (art.dataset.cpInit) { return; }
    art.dataset.cpInit = "1";
    var svg = art.querySelector(".case-svg--clause");
    if (svg) { svg.classList.add("is-visible"); }
  }

  function boot() {
    [].forEach.call(document.querySelectorAll("[data-kx]"), function (el) { observe(el, initKx, 0.2); });
    [].forEach.call(document.querySelectorAll("[data-rs]"), function (el) { observe(el, initRs, 0.2); });
    [].forEach.call(document.querySelectorAll("[data-qt]"), function (el) { observe(el, initQt, 0.15); });
    [].forEach.call(document.querySelectorAll(".case-art--property"), function (el) { observe(el, initCp, 0.2); });
  }

  if (document.readyState === "loading") { document.addEventListener("DOMContentLoaded", boot); }
  else { boot(); }
})();
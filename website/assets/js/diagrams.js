/* 示意图交互层：本体图谱 / RSI 闭环 / 执行环 / 智能体流水线 / 执行泳道 */
(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* 单一 rAF 时钟 */
  var tickers = new Set();
  var running = false;
  function frame(now) {
    tickers.forEach(function (fn) { fn(now); });
    if (tickers.size) { requestAnimationFrame(frame); } else { running = false; }
  }
  function addTicker(fn) {
    tickers.add(fn);
    if (!running) { running = true; requestAnimationFrame(frame); }
  }
  function removeTicker(fn) { tickers.delete(fn); }

  function onScreen(el, cb) {
    if (!("IntersectionObserver" in window)) { cb(true); return; }
    new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { cb(e.isIntersecting); });
    }, { threshold: 0.18 }).observe(el);
  }

  function ease(t) { return 1 - Math.pow(1 - t, 3); }

  /* ---------------------------------------------------------
     1. 本体语义图谱
     --------------------------------------------------------- */
  var ONTO = {
    "src-a": {
      type: "证据来源", name: "杀菌工艺规程 v3",
      why: "规定值来自受控文件，带版本与原文坐标，回放时能回到当时的第 3 版",
      edges: ["src-a"],
      triples: [["杀菌工艺规程 v3", "规定", "中心温度 = 85"], ["中心温度", "原文定位", "页 12 · 行 7"], ["杀菌工艺规程", "适用批次", "B-2409"]]
    },
    "src-b": {
      type: "证据来源", name: "批记录 B-2409",
      why: "实测值来自另一份文件，字段名写法不同，靠本体别名才能对上同一个参数",
      edges: ["src-b"],
      triples: [["批记录 B-2409", "实测", "杀菌温度 = 86"], ["杀菌温度", "别名归一", "中心温度"], ["批记录 B-2409", "记录批次", "B-2409"]]
    },
    param: {
      type: "语义概念", name: "中心温度",
      why: "把两份文件里写法不同的字段指向同一个参数，跨文件比对才成立",
      edges: ["src-a", "src-b", "unit", "product"],
      triples: [["番茄沙司", "具有参数", "中心温度"], ["中心温度", "计量单位", "摄氏度"], ["中心温度", "判定方式", "跨文件一致"]]
    },
    unit: {
      type: "计量单位", name: "摄氏度 ℃",
      why: "先统一口径再比数值，否则 85 与 86 可能只是单位不同造成的假冲突",
      edges: ["unit"],
      triples: [["中心温度", "计量单位", "摄氏度"], ["86 ℃", "同口径", "85 ℃"], ["华氏度", "换算为", "摄氏度"]]
    },
    product: {
      type: "实体 · 产品", name: "番茄沙司",
      why: "产品是把规程、批记录、供货与采购串起来的主键，换一个产品就换一套参数",
      edges: ["product", "supplier", "customer"],
      triples: [["番茄沙司", "具有参数", "中心温度"], ["番茄沙司", "采购自", "番茄原料厂"], ["番茄沙司", "供货给", "连锁商超"]]
    },
    supplier: {
      type: "实体 · 供应商", name: "番茄原料厂",
      why: "供应商资质与原料标准挂在同一个实体上，资质过期能直接影响产品相关审核点",
      edges: ["supplier"],
      triples: [["番茄沙司", "采购自", "番茄原料厂"], ["番茄原料厂", "持有", "原料检验报告"], ["番茄原料厂", "资质有效期", "2026-12-31"]]
    },
    customer: {
      type: "实体 · 客户", name: "连锁商超",
      why: "客户约定的验收标准往往严于国标，本体让这条约定能覆盖到同一批产品",
      edges: ["customer"],
      triples: [["番茄沙司", "供货给", "连锁商超"], ["连锁商超", "约定", "验收标准"], ["验收标准", "严于", "国标限值"]]
    }
  };

  document.querySelectorAll("[data-onto]").forEach(function (root) {
    var nodes = Array.prototype.slice.call(root.querySelectorAll("[data-onto-node]"));
    var edges = Array.prototype.slice.call(root.querySelectorAll("[data-onto-edge]"));
    var rels = Array.prototype.slice.call(root.querySelectorAll("[data-onto-rel]"));
    var readType = root.querySelector("[data-onto-read-type]");
    var readName = root.querySelector("[data-onto-read-name]");
    var readWhy = root.querySelector("[data-onto-read-why]");
    var readTriples = root.querySelector("[data-onto-read-triples]");
    var pill = root.querySelector("[data-onto-pill]");
    var verdict = root.querySelector("[data-onto-verdict]");
    var verdictText = root.querySelector("[data-onto-verdict-text]");
    var alias = root.querySelector("[data-onto-alias]");
    var map = root.querySelector("[data-onto-map]");
    var paramName = root.querySelector("[data-onto-param-name]");
    var paramNote = root.querySelector("[data-onto-param-note]");
    var modeBtns = Array.prototype.slice.call(root.querySelectorAll("[data-onto-mode]"));
    var current = "param";
    var mode = "linked";

    var RAW_READ = {
      "src-b": {
        type: "证据来源", name: "批记录 B-2409",
        why: "字段名「杀菌温度」只在本文件内有意义，没有别名表就挂不到规程里的「中心温度」上",
        triples: [["批记录 B-2409", "实测", "杀菌温度 = 86"], ["杀菌温度", "别名归一", "无别名表"], ["批记录 B-2409", "记录批次", "B-2409"]]
      },
      param: {
        type: "未归一", name: "两个互不相认的字段",
        why: "没有本体这一层，「中心温度」与「杀菌温度」只是两个字符串，系统建不起共同概念，也就无从比对",
        triples: [["杀菌工艺规程 v3", "字段", "中心温度"], ["批记录 B-2409", "字段", "杀菌温度"], ["两个字段", "关联", "无"]]
      },
      unit: {
        type: "未归一", name: "口径未统一",
        why: "没有单位概念，两侧数值各按各的口径留档，85 与 86 谁大谁小、是否同一量纲，系统都判断不了",
        triples: [["中心温度 85", "单位", "未标注"], ["杀菌温度 86", "单位", "未标注"], ["两侧数值", "可比性", "不成立"]]
      },
      product: {
        type: "实体 · 产品", name: "番茄沙司",
        why: "产品实体还在，采购与供货关系也还在，但没有参数概念，两份文件的温度挂不到这个产品上",
        triples: [["番茄沙司", "具有参数", "未建立"], ["番茄沙司", "采购自", "番茄原料厂"], ["番茄沙司", "供货给", "连锁商超"]]
      }
    };

    function select(key) {
      var d = ONTO[key];
      if (!d) return;
      current = key;
      var read = (mode === "raw" && RAW_READ[key]) || d;
      nodes.forEach(function (n) {
        var on = n.dataset.ontoNode === key;
        n.classList.toggle("is-on", on);
        n.classList.toggle("is-dim", !on && d.edges.indexOf(n.dataset.ontoNode) === -1);
      });
      edges.forEach(function (e) {
        var hot = d.edges.indexOf(e.dataset.ontoEdge) !== -1;
        e.classList.toggle("is-hot", hot);
        e.classList.toggle("is-dim", !hot);
      });
      rels.forEach(function (r) {
        r.classList.toggle("is-dim", d.edges.indexOf(r.dataset.ontoRel) === -1);
      });
      readType.textContent = read.type;
      readName.textContent = read.name;
      readWhy.textContent = read.why;
      readTriples.innerHTML = "";
      read.triples.forEach(function (t, i) {
        var li = document.createElement("li");
        li.style.animationDelay = (i * 60) + "ms";
        var s1 = document.createElement("span"); s1.textContent = t[0];
        var em = document.createElement("em"); em.textContent = t[1];
        var s2 = document.createElement("span"); s2.textContent = t[2];
        li.appendChild(s1); li.appendChild(em); li.appendChild(s2);
        readTriples.appendChild(li);
      });
    }

    function setMode(next) {
      mode = next;
      root.dataset.mode = mode;
      modeBtns.forEach(function (b) {
        var on = b.dataset.ontoMode === mode;
        b.classList.toggle("is-on", on);
        b.setAttribute("aria-pressed", on ? "true" : "false");
      });
      var raw = mode === "raw";
      alias.textContent = "杀菌温度";
      map.textContent = raw ? "未匹配到本体概念" : "归一为 中心温度";
      paramName.textContent = raw ? "未归一" : "中心温度";
      paramNote.textContent = raw ? "两个字段互不相认" : "跨文件一致性判定";
      pill.innerHTML = raw ? "<b>无法比对</b><i>口径不明</i>" : "<b>85 ≠ 86</b><i>同口径可比</i>";
      verdict.dataset.state = mode;
      verdictText.textContent = raw
        ? "规程写「中心温度」，记录写「杀菌温度」，系统只当是两个不相干的字段，各自留档，既不会比对也不会报不一致，问题被漏掉"
        : "两份文件归一到同一参数、同一单位，85 与 86 直接可比，引擎判定「温度跨文件不一致」并附两处原文位置";
      select(current);
    }

    nodes.forEach(function (n) {
      n.addEventListener("click", function () { select(n.dataset.ontoNode); });
      n.addEventListener("pointerenter", function () { select(n.dataset.ontoNode); });
      n.addEventListener("focus", function () { select(n.dataset.ontoNode); });
    });
    modeBtns.forEach(function (b) {
      b.addEventListener("click", function () { setMode(b.dataset.ontoMode); });
    });

    setMode("linked");
    select("param");
  });

  /* ---------------------------------------------------------
     2. RSI 带门禁闭环
     --------------------------------------------------------- */
  var RSI = [
    { name: "复核结果", cap: "feedback.confirmed", desc: "审核员在复核台上把这条发现标为误报，并写明原因，系统只接受带原因的复核", kase: "「温度跨文件不一致」被标为误报：规程写 85 ℃，记录写 86 ℃，但记录用的是华氏换算前的口径" },
    { name: "误报归因", cap: "feedback.attribute", desc: "归因智能体判断问题出在规则、抽取还是输入缺失，只有归因清楚才会往下走", kase: "归因结果：单位口径未归一，不是规则阈值写错，也不是抽取错位" },
    { name: "候选规则", cap: "rule.generate", desc: "生成一条候选规则，写进候选表，已发布的 v12.4 一个字节都不动", kase: "候选 v12.5：比对前先把两侧数值统一换算到摄氏度，再判一致性" },
    { name: "测试与冲突", cap: "rule.test", desc: "跑正反例回归，再和已发布规则查冲突，任一项不过就退回，不进入草稿", kase: "12 条样本全部通过（含 4 条负向），与 v12.4 无覆盖冲突" },
    { name: "草稿入库", cap: "rule.draft", desc: "通过测试的候选写入草稿表并锁定版本号，线上跑的仍然是旧版本", kase: "草稿 v12.5 入库，线上生效版本仍为 v12.4，可随时丢弃草稿" },
    { name: "人工批准", cap: "rule.approve", desc: "业务负责人签字后候选才发布，发布动作写审计日志，进入下一轮复核", kase: "批准后 v12.5 生效，同类误报在下一轮复核中不再出现" }
  ];
  var RSI_STOPS = [0, 300, 600, 889.03, 1189.03, 1489.03];
  var RSI_TOTAL = 1778.06;

  document.querySelectorAll("[data-rsi]").forEach(function (root) {
    var path = root.querySelector(".dg-rsi-rail");
    var progress = root.querySelector("[data-rsi-progress]");
    var token = root.querySelector("[data-rsi-token]");
    var stations = Array.prototype.slice.call(root.querySelectorAll("[data-rsi-step]"));
    var gates = Array.prototype.slice.call(root.querySelectorAll("[data-rsi-gate]"));
    var readNo = root.querySelector("[data-rsi-read-no]");
    var readName = root.querySelector("[data-rsi-read-name]");
    var readCap = root.querySelector("[data-rsi-read-cap]");
    var readDesc = root.querySelector("[data-rsi-read-desc]");
    var readCase = root.querySelector("[data-rsi-read-case]");
    var playBtn = root.querySelector("[data-rsi-play]");
    var playLabel = root.querySelector("[data-rsi-play-label]");

    var len = path.getTotalLength ? path.getTotalLength() : RSI_TOTAL;
    var stops = RSI_STOPS.map(function (s) { return (s / RSI_TOTAL) * len; });
    progress.style.strokeDasharray = len;
    progress.style.strokeDashoffset = len;

    var idx = 0, playing = !reduced, visible = false, pinned = false;
    var animFrom = 0, animTo = 0, animStart = 0, animating = false, dwellStart = 0;
    var DWELL = 2200, TRAVEL = 900;

    function place(at) {
      if (!path.getPointAtLength) return;
      var p = path.getPointAtLength(at);
      token.setAttribute("cx", p.x);
      token.setAttribute("cy", p.y);
    }

    function render() {
      var d = RSI[idx];
      stations.forEach(function (s, i) {
        s.classList.toggle("is-on", i === idx);
        s.classList.toggle("is-done", i < idx);
      });
      gates.forEach(function (g) {
        g.classList.toggle("is-passed", Number(g.dataset.rsiGate) < idx);
      });
      progress.style.strokeDashoffset = len - stops[idx];
      readNo.textContent = String(idx + 1).padStart(2, "0") + " / 06";
      readName.textContent = d.name;
      readCap.textContent = d.cap;
      readDesc.textContent = d.desc;
      readCase.textContent = d.kase;
    }

    function go(next) {
      var from = stops[idx];
      idx = ((next % 6) + 6) % 6;
      var to = stops[idx];
      if (idx === 0) { to = len; }
      render();
      if (reduced) { place(stops[idx]); progress.style.strokeDashoffset = len - stops[idx]; dwellStart = performance.now(); return; }
      animFrom = from; animTo = to; animStart = performance.now(); animating = true;
    }

    function tick(now) {
      if (!visible || document.hidden) return;
      if (animating) {
        var t = Math.min(1, (now - animStart) / TRAVEL);
        place(animFrom + (animTo - animFrom) * ease(t));
        if (t >= 1) {
          animating = false;
          dwellStart = now;
          if (idx === 0) { progress.style.strokeDashoffset = len; place(0); }
        }
        return;
      }
      if (playing && !pinned && now - dwellStart > DWELL) { go(idx + 1); }
    }

    stations.forEach(function (s) {
      s.addEventListener("click", function () { go(Number(s.dataset.rsiStep)); });
      s.addEventListener("pointerenter", function () { pinned = true; });
      s.addEventListener("pointerleave", function () { pinned = false; dwellStart = performance.now(); });
    });
    root.querySelector("[data-rsi-prev]").addEventListener("click", function () { go(idx - 1); });
    root.querySelector("[data-rsi-next]").addEventListener("click", function () { go(idx + 1); });
    playBtn.addEventListener("click", function () {
      playing = !playing;
      playBtn.setAttribute("aria-pressed", playing ? "true" : "false");
      playLabel.textContent = playing ? "暂停" : "播放";
      dwellStart = performance.now();
    });
    if (reduced) { playBtn.setAttribute("aria-pressed", "false"); playLabel.textContent = "播放"; }

    render();
    place(0);
    dwellStart = performance.now();
    onScreen(root, function (vis) {
      visible = vis;
      if (vis) { dwellStart = performance.now(); addTicker(tick); } else { removeTicker(tick); }
    });
  });

  /* ---------------------------------------------------------
     3. 引擎执行环
     --------------------------------------------------------- */
  var CYCLE_READ = ["执行器 · 确定性优先", "JEV · 置信度分流", "证据 · 可回放", "RSI · 只出候选"];

  document.querySelectorAll("[data-cycle]").forEach(function (root) {
    var nodes = Array.prototype.slice.call(root.querySelectorAll("[data-cycle-node]"));
    var arcs = Array.prototype.slice.call(root.querySelectorAll("[data-cycle-arc]"));
    var flows = Array.prototype.slice.call(root.querySelectorAll("[data-cycle-flow]"));
    var coreRead = root.querySelector("[data-cycle-core-read]");
    var section = root.closest(".home-engine");
    var principles = section ? Array.prototype.slice.call(section.querySelectorAll(".engine-principles article")) : [];
    var idx = 0, pinned = false, visible = false, last = 0, PERIOD = 2900;

    function render() {
      nodes.forEach(function (n, i) { n.classList.toggle("is-on", i === idx); });
      arcs.forEach(function (a, i) { a.classList.toggle("is-on", i === idx); });
      flows.forEach(function (f, i) { f.classList.toggle("is-on", i === idx); });
      coreRead.textContent = CYCLE_READ[idx];
      var link = Number(nodes[idx].dataset.cycleLink);
      principles.forEach(function (p, i) { p.classList.toggle("is-linked", i === link); });
    }

    function tick(now) {
      if (!visible || document.hidden || pinned || reduced) return;
      if (now - last > PERIOD) { last = now; idx = (idx + 1) % 4; render(); }
    }

    nodes.forEach(function (n, i) {
      function pick() { idx = i; render(); last = performance.now(); }
      n.addEventListener("click", pick);
      n.addEventListener("pointerenter", function () { pinned = true; pick(); });
      n.addEventListener("pointerleave", function () { pinned = false; last = performance.now(); });
      n.addEventListener("focus", pick);
    });

    render();
    onScreen(root, function (vis) {
      visible = vis;
      if (vis) { last = performance.now(); addTicker(tick); } else { removeTicker(tick); }
    });
  });

  /* ---------------------------------------------------------
     4. 智能体流水线 + 证据总线
     --------------------------------------------------------- */
  var AGENT_READ = [
    "解析智能体把文件拆成页、段、表与单元格，保留原文位置，后面五个智能体都在这份结构上工作，不各自重新读文件",
    "事实抽取智能体在解析结构上认出产品、参数、日期与签字，每个事实都带回原文坐标，写进共享证据",
    "规则生成智能体把标准与复核经验变成结构化候选规则，只写候选表，不碰已发布版本",
    "冲突检查智能体拿候选和已发布规则对照，标出覆盖与矛盾，给出优先级建议，不自行裁决",
    "点位判定智能体用生效规则跑事实，产出判定候选与证据引用，置信度交给 JEV 决定分流",
    "误报归因智能体读人工复核结果，把误报归因到规则、抽取或输入缺失，标签回流到 RSI 闭环"
  ];

  document.querySelectorAll("[data-agents2]").forEach(function (root) {
    var rail = root.querySelector(".dg-agents-rail");
    var cards = Array.prototype.slice.call(root.querySelectorAll("[data-agent2]"));
    var packet = root.querySelector("[data-agents-packet]");
    var busItems = Array.prototype.slice.call(root.querySelectorAll("[data-agents-bus-item]"));
    var busFill = root.querySelector("[data-agents-bus-fill]");
    var busCount = root.querySelector("[data-agents-bus-count]");
    var read = root.querySelector("[data-agents-read]");
    var idx = 0, pinned = false, visible = false;
    var animStart = 0, animating = false, dwellStart = 0, from = null, to = null;
    var DWELL = 2300, TRAVEL = 700;

    function centerOf(el) {
      var r = el.getBoundingClientRect();
      var b = rail.getBoundingClientRect();
      return { x: r.left - b.left + r.width / 2, y: r.top - b.top + r.height / 2 };
    }

    function render() {
      cards.forEach(function (c, i) {
        c.classList.toggle("is-on", i === idx);
        c.classList.toggle("is-done", i < idx);
      });
      busItems.forEach(function (b, i) { b.classList.toggle("is-on", i <= idx); });
      busFill.style.setProperty("--fill", ((idx + 1) / 6 * 100) + "%");
      busCount.textContent = (idx + 1) + " / 6 已写入";
      read.textContent = AGENT_READ[idx];
    }

    function go(next) {
      var prev = idx;
      idx = ((next % 6) + 6) % 6;
      render();
      if (reduced) { dwellStart = performance.now(); return; }
      from = centerOf(cards[prev]);
      to = centerOf(cards[idx]);
      animStart = performance.now();
      animating = true;
      packet.classList.add("is-live");
    }

    function tick(now) {
      if (!visible || document.hidden) return;
      if (animating) {
        var t = Math.min(1, (now - animStart) / TRAVEL);
        var k = ease(t);
        packet.style.transform = "translate(" + (from.x + (to.x - from.x) * k - 5) + "px," + (from.y + (to.y - from.y) * k - 5) + "px)";
        if (t >= 1) { animating = false; dwellStart = now; packet.classList.remove("is-live"); }
        return;
      }
      if (!pinned && !reduced && now - dwellStart > DWELL) { go(idx + 1); }
    }

    cards.forEach(function (c, i) {
      function pick() { idx = i; render(); dwellStart = performance.now(); }
      c.addEventListener("click", pick);
      c.addEventListener("pointerenter", function () { pinned = true; pick(); });
      c.addEventListener("pointerleave", function () { pinned = false; dwellStart = performance.now(); });
      c.addEventListener("focus", pick);
    });

    render();
    onScreen(root, function (vis) {
      visible = vis;
      if (vis) { dwellStart = performance.now(); addTicker(tick); } else { removeTicker(tick); packet.classList.remove("is-live"); }
    });
    window.addEventListener("resize", function () { animating = false; packet.classList.remove("is-live"); });
  });

  /* ---------------------------------------------------------
     5. 执行泳道：进入视口再长出来
     --------------------------------------------------------- */
  document.querySelectorAll("[data-lanes]").forEach(function (root) {
    onScreen(root, function (vis) { if (vis) root.classList.add("is-live"); });
  });

  /* ---------------------------------------------------------
     6. 横向滚动区：只在真的溢出、且还没滑到底时提示
     --------------------------------------------------------- */
  document.querySelectorAll(".dg-onto-scroll, .dg-rsi-scroll, .dg-cycle-scroll").forEach(function (box) {
    var hint = box.parentElement.querySelector("[data-scrollhint]");
    if (!hint) return;
    function sync() {
      var over = box.scrollWidth - box.clientWidth;
      hint.hidden = over < 8 || box.scrollLeft >= over - 4;
    }
    box.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync, { passive: true });
    if ("ResizeObserver" in window) new ResizeObserver(sync).observe(box);
    sync();
  });
})();
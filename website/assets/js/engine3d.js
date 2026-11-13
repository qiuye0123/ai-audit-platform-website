/* AI 审核平台 — 局部动效层
   只做「让内容更好懂」的三件事：
   1. 首屏轨道呈现三维结构；2. 结论与原文之间画出证据链；3. 关键参数可以直接动手试
   无脚本或系统减弱动效时，全部信息仍以静态形式完整可读 */
(() => {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* 单一 rAF 时钟，避免多个循环各自跑 */
  const tickers = new Set();
  let clockId = null;

  const clock = (time) => {
    tickers.forEach((fn) => fn(time));
    clockId = tickers.size ? window.requestAnimationFrame(clock) : null;
  };

  const addTicker = (fn) => {
    tickers.add(fn);
    if (clockId === null) clockId = window.requestAnimationFrame(clock);
  };


  const onScreen = (el, callback) => {
    if (!("IntersectionObserver" in window)) {
      callback(true);
      return;
    }
    new IntersectionObserver((entries) => callback(entries[0].isIntersecting), {
      threshold: 0.15
    }).observe(el);
  };

  /* ---------- 1. 证据光束：把「结论指回原文」画出来 ---------- */
  const beam = document.querySelector("[data-evidence-beam]");

  if (beam && !reduceMotion) {
    const host = beam.closest(".stage-page-body--workbench");
    const page = beam.closest(".stage-page");
    const source = host && host.querySelector("[data-evidence-source]");
    const target = host && host.querySelector("[data-evidence-target]");
    const path = beam.querySelector("[data-beam-path]");
    const dot = beam.querySelector("[data-beam-dot]");

    if (host && page && source && target && path && dot) {
      let length = 0;
      let visible = false;
      let drawn = false;

      const draw = () => {
        const wide = window.innerWidth > 1060;
        const active = page.classList.contains("is-active");
        if (!wide || !active) {
          beam.classList.remove("is-ready");
          drawn = false;
          return;
        }

        const c = host.getBoundingClientRect();
        const s = source.getBoundingClientRect();
        const t = target.getBoundingClientRect();
        if (!c.width || !s.width || !t.width) return;

        const x1 = s.right - c.left + 3;
        const y1 = s.top - c.top + s.height / 2;
        const x2 = t.left - c.left - 5;
        const y2 = t.top - c.top + t.height / 2;
        const mx = (x1 + x2) / 2;

        beam.setAttribute("viewBox", `0 0 ${c.width} ${c.height}`);
        path.setAttribute("d", `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`);
        length = path.getTotalLength();
        drawn = true;
        beam.classList.add("is-ready");
      };

      const step = (time) => {
        if (!drawn || !length || !visible || document.hidden) return;
        const t = (time % 1900) / 1900;
        const point = path.getPointAtLength(t * length);
        dot.setAttribute("cx", point.x);
        dot.setAttribute("cy", point.y);
        dot.setAttribute("opacity", String(Math.sin(Math.PI * t).toFixed(3)));
      };

      const schedule = () => window.requestAnimationFrame(draw);

      draw();
      addTicker(step);
      onScreen(host, (state) => {
        visible = state;
        if (state) schedule();
      });

      window.addEventListener("resize", schedule, { passive: true });

      new MutationObserver(schedule).observe(page, {
        attributes: true,
        attributeFilter: ["class"]
      });

      if ("ResizeObserver" in window) {
        new ResizeObserver(schedule).observe(host);
      }

      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(schedule).catch(() => {});
      }
    }
  }

  /* ---------- 2. JEV：拖动置信度，看分流怎么变 ---------- */
  const dial = document.querySelector("[data-jev-dial]");

  if (dial) {
    const range = dial.querySelector("[data-jev-range]");
    const value = dial.querySelector("[data-jev-value]");
    const route = dial.querySelector("[data-jev-route]");
    const verdict = document.querySelector("[data-jev-verdict]");
    const console_ = dial.closest(".jev-console");
    const needle = console_ && console_.querySelector(".jev-needle");
    const arc = console_ && console_.querySelector(".jev-arc");
    const cards = console_ ? Array.from(console_.querySelectorAll("[data-jev-path]")) : [];

    const routes = {
      high: ["自动候选", "证据齐全且置信度高，生成候选结论，仍需人工签字"],
      mid: ["补充证据", "置信度落在中间段，先补齐缺口证据，再重新判断"],
      low: ["转人工", "置信度低或超出规则范围，直接转人工，不写成通过"]
    };

    const render = (v) => {
      const key = v >= 85 ? "high" : v >= 60 ? "mid" : "low";
      dial.dataset.route = key;
      if (value) value.textContent = String(v);
      if (route) route.textContent = routes[key][0];
      if (verdict) verdict.textContent = routes[key][1];
      if (needle) needle.style.setProperty("--jev-angle", `${(1.8 * v - 130.9).toFixed(2)}deg`);
      if (arc) arc.style.setProperty("--jev-offset", `${(283 * (1 - v / 100)).toFixed(1)}`);
      cards.forEach((card) => card.classList.toggle("is-active", card.dataset.jevPath === key));
    };

    if (range) {
      range.addEventListener("input", () => render(Number(range.value)));
      render(Number(range.value));
    }
  }
})();
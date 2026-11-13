/* AI 审核平台 — 深色官网交互与科技动效 */
(() => {
  "use strict";

  const body = document.body;
  const header = document.querySelector(".site-header");
  const menuButton = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".site-nav");
  const progressBar = document.querySelector(".scroll-progress span");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* 页头状态与阅读进度 */
  const updateScrollState = () => {
    if (header) header.classList.toggle("is-scrolled", window.scrollY > 8);
    if (progressBar) {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      progressBar.style.transform = `scaleX(${ratio})`;
    }
  };

  updateScrollState();
  window.addEventListener("scroll", updateScrollState, { passive: true });
  window.addEventListener("resize", updateScrollState);

  /* 移动菜单 */
  const closeMenu = () => {
    if (!header || !menuButton) return;
    header.classList.remove("is-menu-open");
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.setAttribute("aria-label", "打开菜单");
    body.style.overflow = "";
  };

  if (menuButton && header && nav) {
    menuButton.addEventListener("click", () => {
      const open = header.classList.toggle("is-menu-open");
      menuButton.setAttribute("aria-expanded", String(open));
      menuButton.setAttribute("aria-label", open ? "关闭菜单" : "打开菜单");
      body.style.overflow = open ? "hidden" : "";
    });

    nav.addEventListener("click", (event) => {
      if (event.target.closest("a")) closeMenu();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeMenu();
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 1060) closeMenu();
    });
  }

  /* 渐入 */
  const revealItems = Array.from(document.querySelectorAll("[data-reveal]"));
  const workbench = document.querySelector(".workbench");

  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealItems.forEach((item) => item.classList.add("is-visible"));
    if (workbench) workbench.classList.add("is-visible");
  } else {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -6% 0px" }
    );

    revealItems.forEach((item) => revealObserver.observe(item));
    if (workbench) revealObserver.observe(workbench);
  }

  /* 审核工作台自动轮播 */
  const audit = document.querySelector("[data-audit]");
  const findingButtons = Array.from(document.querySelectorAll("[data-finding-target]"));

  if (audit && findingButtons.length) {
    let activeIndex = 0;
    let timer = null;
    let hovering = false;

    const progressFill = document.querySelector(".finding-progress span");

    const setActive = (index, scanning = false) => {
      activeIndex = (index + findingButtons.length) % findingButtons.length;
      const key = findingButtons[activeIndex].dataset.findingTarget;
      audit.dataset.active = key;

      findingButtons.forEach((button, buttonIndex) => {
        button.setAttribute("aria-pressed", String(buttonIndex === activeIndex));
      });

      if (progressFill) {
        progressFill.style.width = `${((activeIndex + 1) / findingButtons.length) * 100}%`;
      }

      if (scanning && !reduceMotion) {
        audit.classList.remove("is-scanning");
        void audit.offsetWidth;
        audit.classList.add("is-scanning");
        window.setTimeout(() => audit.classList.remove("is-scanning"), 1650);
      }
    };

    const start = () => {
      if (reduceMotion || timer) return;
      timer = window.setInterval(() => {
        if (document.hidden || hovering) return;
        setActive(activeIndex + 1, true);
      }, 4300);
    };

    const stop = () => {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    };

    findingButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const index = findingButtons.indexOf(button);
        setActive(index, true);
        stop();
        start();
      });
    });

    audit.addEventListener("pointerenter", () => {
      hovering = true;
    });
    audit.addEventListener("pointerleave", () => {
      hovering = false;
    });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) stop();
      else start();
    });

    setActive(0, false);
    start();
  }

  /* 数字递增 */
  const counters = Array.from(document.querySelectorAll("[data-count]"));

  const animateCount = (el) => {
    const target = Number(el.dataset.count);
    if (!Number.isFinite(target)) return;
    const duration = 1200;
    const startTime = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - startTime) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.round(target * eased).toLocaleString("zh-CN");
      if (t < 1) window.requestAnimationFrame(step);
      else el.textContent = target.toLocaleString("zh-CN");
    };
    window.requestAnimationFrame(step);
  };

  if (counters.length) {
    if (reduceMotion || !("IntersectionObserver" in window)) {
      counters.forEach((el) => (el.textContent = Number(el.dataset.count).toLocaleString("zh-CN")));
    } else {
      const countObserver = new IntersectionObserver(
        (entries, observer) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            animateCount(entry.target);
            observer.unobserve(entry.target);
          });
        },
        { threshold: 0.6 }
      );
      counters.forEach((el) => countObserver.observe(el));
    }
  }

  /* 单开问答 */
  const faqItems = Array.from(document.querySelectorAll(".faq-item"));
  faqItems.forEach((item) => {
    item.addEventListener("toggle", () => {
      if (!item.open) return;
      faqItems.forEach((other) => {
        if (other !== item) other.open = false;
      });
    });
  });

  /* 背景星图、指针光晕与轻量拟态 */
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  if (!reduceMotion) {
    const canvas = document.createElement("canvas");
    canvas.className = "site-particle-field";
    canvas.setAttribute("aria-hidden", "true");
    document.body.prepend(canvas);

    const ctx = canvas.getContext("2d");
    if (ctx) {
      let width = 0;
      let height = 0;
      let dpr = 1;
      let particles = [];
      let frameId = null;
      let lastFrame = 0;
      let pointerX = -9999;
      let pointerY = -9999;

      const random = (min, max) => min + Math.random() * (max - min);

      const makeParticles = () => {
        const count = Math.max(24, Math.min(64, Math.round((width * height) / 28000)));
        particles = Array.from({ length: count }, (_, index) => ({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: random(-0.16, 0.16),
          vy: random(-0.12, 0.12),
          r: index % 11 === 0 ? random(1.4, 2.1) : random(0.65, 1.35),
          alpha: random(0.24, 0.68),
          blue: index % 7 === 0
        }));
      };

      const resize = () => {
        width = window.innerWidth;
        height = window.innerHeight;
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        makeParticles();
      };

      const draw = () => {
        ctx.clearRect(0, 0, width, height);

        for (let i = 0; i < particles.length; i += 1) {
          const p = particles[i];
          p.x += p.vx;
          p.y += p.vy;

          if (p.x < -20) p.x = width + 20;
          if (p.x > width + 20) p.x = -20;
          if (p.y < -20) p.y = height + 20;
          if (p.y > height + 20) p.y = -20;

          for (let j = i + 1; j < particles.length; j += 1) {
            const other = particles[j];
            const dx = p.x - other.x;
            const dy = p.y - other.y;
            const distance = Math.hypot(dx, dy);
            if (distance > 138) continue;
            ctx.beginPath();
            ctx.strokeStyle = `rgba(111, 163, 255, ${(1 - distance / 138) * 0.115})`;
            ctx.lineWidth = 0.65;
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(other.x, other.y);
            ctx.stroke();
          }

          if (finePointer) {
            const pdx = p.x - pointerX;
            const pdy = p.y - pointerY;
            const pointerDistance = Math.hypot(pdx, pdy);
            if (pointerDistance < 185) {
              ctx.beginPath();
              ctx.strokeStyle = `rgba(146, 196, 255, ${(1 - pointerDistance / 185) * 0.16})`;
              ctx.lineWidth = 0.7;
              ctx.moveTo(p.x, p.y);
              ctx.lineTo(pointerX, pointerY);
              ctx.stroke();
            }
          }

          ctx.beginPath();
          ctx.fillStyle = p.blue
            ? `rgba(132, 180, 255, ${p.alpha})`
            : `rgba(211, 229, 255, ${p.alpha * 0.76})`;
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
        }
      };

      const tick = (time) => {
        if (time - lastFrame > 32) {
          draw();
          lastFrame = time;
        }
        frameId = window.requestAnimationFrame(tick);
      };

      resize();
      window.addEventListener("resize", resize, { passive: true });

      document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
          if (frameId !== null) {
            window.cancelAnimationFrame(frameId);
            frameId = null;
          }
        } else if (frameId === null) {
          frameId = window.requestAnimationFrame(tick);
        }
      });

      frameId = window.requestAnimationFrame(tick);
    }
  }

  if (finePointer && !reduceMotion) {
    const aura = document.createElement("div");
    aura.className = "site-aura";
    aura.setAttribute("aria-hidden", "true");
    document.body.prepend(aura);

    let auraFrame = null;
    let targetX = 0;
    let targetY = 0;

    const moveAura = () => {
      aura.style.transform = `translate3d(${targetX}px, ${targetY}px, 0)`;
      auraFrame = null;
    };

    document.addEventListener(
      "pointermove",
      (event) => {
        targetX = event.clientX;
        targetY = event.clientY;
        aura.classList.add("is-visible");
        if (auraFrame === null) auraFrame = window.requestAnimationFrame(moveAura);
      },
      { passive: true }
    );

    document.documentElement.addEventListener("mouseleave", () => {
      aura.classList.remove("is-visible");
    });
  }


  /* 引擎执行轨迹自动轮换 */
  const traceRoots = Array.from(document.querySelectorAll("[data-trace]"));

  traceRoots.forEach((root) => {
    const lines = Array.from(root.querySelectorAll("[data-trace-line]"));
    const steps = Array.from(root.querySelectorAll("[data-trace-step]"));
    const pages = Array.from(root.querySelectorAll("[data-trace-page]"));
    const tabs = Array.from(root.querySelectorAll("[data-page-tab]"));
    const progress = root.querySelector(".engine-progress span");
    if (!lines.length) return;

    const pageForStep = [0, 0, 0, 1, 2, 3, 3, 3];
    const tabStep = [0, 3, 4, 5];
    let active = 0;
    let timer = null;
    let hovering = false;

    const setActive = (index) => {
      active = (index + lines.length) % lines.length;
      lines.forEach((line, lineIndex) => {
        line.classList.toggle("is-active", lineIndex === active);
      });
      steps.forEach((step, stepIndex) => {
        step.classList.toggle("is-active", stepIndex === active);
      });
      if (pages.length) {
        const pageIndex = pageForStep[active] ?? 0;
        pages.forEach((page, index) => {
          page.classList.toggle("is-active", index === pageIndex);
        });
        tabs.forEach((tab, index) => {
          const selected = index === pageIndex;
          tab.classList.toggle("is-active", selected);
          tab.setAttribute("aria-selected", String(selected));
        });
      }
      if (progress) {
        progress.style.width = `${((active + 1) / lines.length) * 100}%`;
      }
    };

    const stop = () => {
      if (timer !== null) {
        window.clearInterval(timer);
        timer = null;
      }
    };

    const start = () => {
      if (reduceMotion || timer !== null) return;
      timer = window.setInterval(() => {
        if (!hovering) setActive(active + 1);
      }, 2200);
    };

    root.addEventListener("pointerenter", () => {
      hovering = true;
    });
    root.addEventListener("pointerleave", () => {
      hovering = false;
    });

    tabs.forEach((tab, tabIndex) => {
      tab.addEventListener("click", () => {
        hovering = true;
        setActive(tabStep[tabIndex] ?? 0);
      });
    });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) stop();
      else start();
    });

    setActive(0);
    start();
  });

})();

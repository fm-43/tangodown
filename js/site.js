/* TangoDown website: the interactions.
   No libraries. Everything degrades to a readable page without this file. */

(() => {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");

  // SwiftUI's RoundedRectangle(style: .continuous): each corner as three cubics, in units of the radius.
  const CORNER = [[0, 1.528688], [0, 1.0885], [0, 0.868438], [0.0749375, 0.6315], [0.1690625, 0.3728125], [0.3728125, 0.1690625], [0.6315, 0.0749375], [0.868438, 0], [1.0885, 0], [1.528688, 0]];
  const contRect = (w, h, r) => {
    const corners = [[w, 0, [1, 0], [0, 1]], [w, h, [0, 1], [-1, 0]], [0, h, [-1, 0], [0, -1]], [0, 0, [0, -1], [1, 0]]];
    let d = "";
    corners.forEach(([cx, cy, e1, e2], i) => {
      const P = CORNER.map(([a, b]) => [+(cx + (a * e2[0] - b * e1[0]) * r).toFixed(3), +(cy + (a * e2[1] - b * e1[1]) * r).toFixed(3)].join(" "));
      d += (i ? "L" : "M") + P[0] + "C" + P[1] + " " + P[2] + " " + P[3] + "C" + P[4] + " " + P[5] + " " + P[6] + "C" + P[7] + " " + P[8] + " " + P[9];
    });
    return d + "Z";
  };

  // Words set from here, in the page's language (js/i18n.js), keyed by their English; English if that file is missing.
  const i18n = window.TDi18n;
  const T = (text, vars) => (i18n ? i18n.t(text, vars) : text.replace(/\{(\w+)\}/g, (m, k) => (vars && k in vars ? vars[k] : m)));
  const num = (n, digits = 0) => (i18n ? i18n.num(n, digits) : n.toFixed(digits));
  const onLanguage = (fn) => i18n && i18n.onChange(fn);

  /* One scroll loop for everything tied to the scroll position. */
  const onFrame = [];
  let queued = false;
  const schedule = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      for (const fn of onFrame) fn();
    });
  };
  addEventListener("scroll", schedule, { passive: true });
  addEventListener("resize", schedule);

  /* Watches whether an element is on screen. */
  const watchVisibility = (el, cb, options = {}) => {
    const io = new IntersectionObserver((entries) => {
      for (const entry of entries) cb(entry.isIntersecting, entry);
    }, options);
    io.observe(el);
    return io;
  };

  /* Navigation ---------------------------------------------------------------- */

  const nav = $(".nav");
  onFrame.push(() => nav.classList.toggle("is-scrolled", scrollY > 8));

  const navLinks = $$(".nav-links a");
  const sections = navLinks.map((a) => $(a.getAttribute("href")));
  let currentLink = -2;
  onFrame.push(() => {
    const line = innerHeight * 0.4;
    let current = -1;
    sections.forEach((section, i) => {
      if (section && section.getBoundingClientRect().top <= line) current = i;
    });
    if (current === currentLink) return;
    currentLink = current;
    navLinks.forEach((a, i) => (i === current ? a.setAttribute("aria-current", "true") : a.removeAttribute("aria-current")));
  });

  // The bar stays on one line. Where it doesn't fit (a phone, a narrow window, a language with longer words),
  // the language menu shows only its globe (is-tight), then the sections and the language menu fold into a
  // tray under the bar that the chevron opens, as on Apple's product pages (is-compact, is-open).
  const navInner = $(".nav-inner");
  const navMenu = $(".nav-menu");
  const menuButton = $(".nav-menu-btn");
  const curtain = document.createElement("div");
  curtain.className = "nav-curtain";
  nav.after(curtain);
  [...navLinks, $(".lang-switch")].forEach((el, i) => el.style.setProperty("--delay", `${0.06 + i * 0.03}s`));

  let menuOpen = false;
  let langOpen = false;
  let closeLangMenu = () => {};
  let positionLangMenu = () => {};
  const langSwitch = $(".lang-switch");
  const langTrigger = $(".lang-trigger");
  const langPopover = $(".lang-popover");

  const trayHeight = () => nav.style.setProperty("--tray-h", `${navMenu.offsetHeight}px`);
  const setMenu = (open, focusButton = false) => {
    if (open !== menuOpen) {
      menuOpen = open;
      if (!open && langOpen) closeLangMenu(false);
      if (open) trayHeight();
      nav.classList.toggle("is-open", open);
      menuButton.setAttribute("aria-expanded", String(open));
    }
    if (focusButton) menuButton.focus();
  };
  menuButton.addEventListener("click", () => setMenu(!menuOpen));
  curtain.addEventListener("click", () => setMenu(false));
  nav.addEventListener("click", (event) => {
    if (menuOpen && event.target.closest("a")) setMenu(false);
  });
  nav.addEventListener("focusout", (event) => {
    if (menuOpen && event.relatedTarget && !nav.contains(event.relatedTarget) && !(langPopover && langPopover.contains(event.relatedTarget))) setMenu(false);
  });
  addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (langOpen) {
      event.preventDefault();
      closeLangMenu(true);
    } else if (menuOpen) {
      setMenu(false, true);
    }
  });
  // Scrolling the page under the tray closes it. (Not any change of scroll position: a language switched
  // in the tray changes the page's height, and the browser keeps the place by scrolling.)
  const scrolledAway = () => setMenu(false);
  curtain.addEventListener("wheel", scrolledAway, { passive: true });
  curtain.addEventListener("touchmove", scrolledAway, { passive: true });
  nav.addEventListener("wheel", scrolledAway, { passive: true });

  // The language menu: a glass panel with continuous corners, a pill that glides to the hovered or
  // focused language, and a position that keeps it on screen, below the button or above it.
  if (langSwitch && langTrigger && langPopover) {
    const langBackdrop = $(".lang-backdrop", langPopover);
    const langSpecular = $(".lang-specular", langPopover);
    const langList = $(".lang-list", langPopover);
    const langLens = $(".lang-lens", langPopover);
    const langFrame = $(".lang-frame", langPopover);
    const langOptions = $$(".lang-option", langPopover);
    let closeTimer = 0;
    let activeIndex = 0;
    let frameKey = "";
    let pointerDown = false;

    // Moved to <body>. In the bar, the compact tray's clip-path would cut it off, and the tray's
    // fading items would cut its blur off from the page.
    document.body.append(langPopover);

    const selectedIndex = () => Math.max(0, langOptions.findIndex((opt) => opt.getAttribute("aria-selected") === "true"));

    const renderFrame = (w, h) => {
      const key = `${w}x${h}`;
      if (key === frameKey) return;
      frameKey = key;
      const d = contRect(w, h, 18);
      // Clip directly on the blurring surface (never on an ancestor), so Chromium and Safari both
      // blur what's behind the popover while keeping synchronous vector-crisp continuous corners.
      const clip = `path("${d}")`;
      langBackdrop.style.webkitClipPath = clip;
      langBackdrop.style.clipPath = clip;
      if (langSpecular) {
        langSpecular.style.webkitClipPath = clip;
        langSpecular.style.clipPath = clip;
      }
      langFrame.setAttribute("viewBox", `-1 -1 ${w + 2} ${h + 2}`);
      langFrame.setAttribute("width", String(w + 2));
      langFrame.setAttribute("height", String(h + 2));
      langFrame.innerHTML =
        `<defs>` +
        `<clipPath id="lang-clip"><path d="${d}"/></clipPath>` +
        `<mask id="lang-out" maskUnits="userSpaceOnUse" x="-1" y="-1" width="${w + 2}" height="${h + 2}"><rect x="-1" y="-1" width="${w + 2}" height="${h + 2}" fill="#fff"/><path d="${d}" fill="#000"/></mask>` +
        `<linearGradient id="lang-rim" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="${h}">` +
        `<stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset=".08" stop-color="#fff" stop-opacity=".52"/><stop offset=".28" stop-color="#fff" stop-opacity=".16"/><stop offset=".5" stop-color="#fff" stop-opacity=".08"/><stop offset=".76" stop-color="#fff" stop-opacity=".22"/><stop offset=".94" stop-color="#fff" stop-opacity=".58"/><stop offset="1" stop-color="#fff" stop-opacity=".72"/>` +
        `</linearGradient>` +
        `<linearGradient id="lang-prism" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="${w}" y2="${h}">` +
        `<stop offset="0" stop-color="#9fd8ff" stop-opacity=".34"/><stop offset=".24" stop-color="#fff" stop-opacity="0"/><stop offset=".76" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#ffe6be" stop-opacity=".28"/>` +
        `</linearGradient>` +
        `<linearGradient id="lang-edge" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="${h}">` +
        `<stop offset="0" stop-color="#000" stop-opacity=".08"/><stop offset=".16" stop-color="#000" stop-opacity=".10"/><stop offset=".5" stop-color="#000" stop-opacity=".145"/><stop offset=".84" stop-color="#000" stop-opacity=".11"/><stop offset="1" stop-color="#000" stop-opacity=".09"/>` +
        `</linearGradient>` +
        `</defs>` +
        `<path d="${d}" fill="none" stroke="url(#lang-rim)" stroke-width="2" clip-path="url(#lang-clip)"/>` +
        `<path d="${d}" fill="none" stroke="url(#lang-prism)" stroke-width="2.6" clip-path="url(#lang-clip)"/>` +
        `<path d="${d}" fill="none" stroke="url(#lang-edge)" stroke-width="1" mask="url(#lang-out)"/>`;
    };

    const moveLens = (index) => {
      const option = langOptions[index];
      if (!option) return;
      activeIndex = index;
      langOptions.forEach((opt, i) => opt.classList.toggle("is-active", i === index));
      langLens.style.setProperty("--lens-y", `${option.offsetTop}px`);
      langLens.style.setProperty("--lens-h", `${option.offsetHeight}px`);
      langLens.style.setProperty("--lens-o", "1");
    };

    positionLangMenu = () => {
      if (langPopover.hidden) return;
      const EDGE = 12;
      const rect = langTrigger.getBoundingClientRect();
      const vw = document.documentElement.clientWidth;
      const vv = window.visualViewport;
      const vh = vv ? Math.min(innerHeight, vv.height) : innerHeight;
      const isCompact = nav.classList.contains("is-compact");

      langList.style.maxHeight = "";
      const pw = langPopover.offsetWidth;
      const ph = langPopover.offsetHeight;

      const idealLeft = isCompact ? rect.left : rect.left + rect.width / 2 - pw / 2;
      const left = Math.round(clamp(idealLeft, EDGE, Math.max(EDGE, vw - pw - EDGE)));

      const belowTop = isCompact ? rect.bottom + 6 : Math.max(rect.bottom + 8, nav.getBoundingClientRect().bottom + 8);
      const spaceBelow = vh - belowTop - EDGE;
      const aboveBottom = rect.top - 6;
      const spaceAbove = aboveBottom - EDGE;
      const flip = ph > spaceBelow && spaceAbove > spaceBelow;
      const maxH = Math.max(120, Math.floor(flip ? spaceAbove : spaceBelow));
      let finalH = ph;
      if (ph > maxH) {
        langList.style.maxHeight = `${maxH}px`;
        finalH = langPopover.offsetHeight;
      }
      const top = Math.round(flip ? Math.max(EDGE, aboveBottom - finalH) : Math.min(belowTop, Math.max(EDGE, vh - finalH - EDGE)));

      langPopover.style.left = `${left}px`;
      langPopover.style.top = `${top}px`;
      const ox = clamp(rect.left + rect.width / 2 - left, 18, Math.max(18, pw - 18));
      langPopover.style.setProperty("--ox", `${ox.toFixed(1)}px`);
      langPopover.style.setProperty("--oy", `${flip ? finalH : 0}px`);
      langPopover.style.setProperty("--dy", flip ? "6px" : "-6px");
      renderFrame(pw, finalH);
      moveLens(activeIndex);
    };

    const openLangMenu = (viaKeyboard = false, focusIndex = null) => {
      if (langOpen) return;
      clearTimeout(closeTimer);
      langOpen = true;
      langPopover.hidden = false;
      langPopover.classList.remove("is-ready", "is-pressing", "has-pointer");
      activeIndex = focusIndex === null ? selectedIndex() : focusIndex;
      positionLangMenu();
      void langPopover.offsetWidth;
      langSwitch.classList.add("is-open");
      langPopover.classList.add("is-open");
      langTrigger.setAttribute("aria-expanded", "true");
      if (viaKeyboard) {
        langOptions[activeIndex]?.focus({ preventScroll: true });
        langOptions[activeIndex]?.scrollIntoView({ block: "nearest" });
      }
      requestAnimationFrame(() => {
        if (langOpen) langPopover.classList.add("is-ready");
      });
    };

    closeLangMenu = (returnFocus = false) => {
      if (!langOpen) return;
      langOpen = false;
      pointerDown = false;
      langSwitch.classList.remove("is-open");
      langPopover.classList.remove("is-open", "is-ready", "is-pressing", "has-pointer");
      langTrigger.setAttribute("aria-expanded", "false");
      if (returnFocus) langTrigger.focus({ preventScroll: true });
      clearTimeout(closeTimer);
      if (reducedMotion.matches) {
        langPopover.hidden = true;
      } else {
        closeTimer = setTimeout(() => {
          if (!langOpen) langPopover.hidden = true;
        }, 220);
      }
    };

    const chooseOption = (option, viaKeyboard = false) => {
      const next = option.dataset.lang;
      closeLangMenu(viaKeyboard);
      if (i18n && next) i18n.set(next);
    };

    // Guard against double-click selection leakage onto adjacent text.
    const preventDoubleSelect = (event) => {
      if (event.detail > 1) event.preventDefault();
    };
    langTrigger.addEventListener("mousedown", preventDoubleSelect);
    langPopover.addEventListener("mousedown", preventDoubleSelect);

    langTrigger.addEventListener("click", () => {
      if (langOpen) closeLangMenu(false);
      else openLangMenu(false);
    });
    langTrigger.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        if (langOpen) closeLangMenu(true);
        else openLangMenu(true);
      } else if (!langOpen && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
        event.preventDefault();
        openLangMenu(true);
      } else if (!langOpen && event.key === "Home") {
        event.preventDefault();
        openLangMenu(true, 0);
      } else if (!langOpen && event.key === "End") {
        event.preventDefault();
        openLangMenu(true, langOptions.length - 1);
      } else if (langOpen && event.key === "Tab") {
        closeLangMenu(false);
      }
    });

    langOptions.forEach((option, i) => {
      option.addEventListener("pointerenter", (event) => {
        if (event.pointerType === "touch") return;
        moveLens(i);
      });
      option.addEventListener("pointerdown", (event) => {
        if (event.pointerType === "mouse" && event.button !== 0) return;
        pointerDown = true;
        moveLens(i);
        langPopover.classList.add("is-pressing");
      });
      option.addEventListener("focus", () => moveLens(i));
      option.addEventListener("click", () => chooseOption(option, false));
    });

    const endPress = () => {
      if (!pointerDown) return;
      pointerDown = false;
      langPopover.classList.remove("is-pressing");
    };
    addEventListener("pointerup", endPress);
    addEventListener("pointercancel", endPress);

    langPopover.addEventListener("pointermove", (event) => {
      if (event.pointerType === "touch" || reducedMotion.matches) return;
      const r = langPopover.getBoundingClientRect();
      langPopover.style.setProperty("--mx", `${(event.clientX - r.left).toFixed(1)}px`);
      langPopover.style.setProperty("--my", `${(event.clientY - r.top).toFixed(1)}px`);
      langPopover.classList.add("has-pointer");
    });
    langPopover.addEventListener("pointerleave", (event) => {
      if (event.pointerType === "touch") return;
      langPopover.classList.remove("has-pointer");
      endPress();
      if (!langPopover.contains(document.activeElement)) moveLens(selectedIndex());
    });

    langPopover.addEventListener("keydown", (event) => {
      if (!langOpen) return;
      const n = langOptions.length;
      const move = (next) => {
        event.preventDefault();
        moveLens(next);
        langOptions[next].focus({ preventScroll: true });
        langOptions[next].scrollIntoView({ block: "nearest" });
      };
      if (event.key === "ArrowDown") move((activeIndex + 1) % n);
      else if (event.key === "ArrowUp") move((activeIndex - 1 + n) % n);
      else if (event.key === "Home") move(0);
      else if (event.key === "End") move(n - 1);
      else if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        chooseOption(langOptions[activeIndex], true);
      } else if (event.key === "Tab") {
        // Back to the button first, so Tab and Shift-Tab carry on from there. The menu is at the
        // end of <body>, so from inside it they would leave the page.
        closeLangMenu(true);
      } else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
        const ch = event.key.toLowerCase();
        for (let step = 1; step <= n; step++) {
          const idx = (activeIndex + step) % n;
          if (langOptions[idx].textContent.trim().toLowerCase().startsWith(ch)) return move(idx);
        }
      }
    });

    langPopover.addEventListener("focusout", (event) => {
      if (!langOpen || !event.relatedTarget) return;
      if (!langPopover.contains(event.relatedTarget) && !langTrigger.contains(event.relatedTarget)) {
        closeLangMenu(false);
        if (menuOpen && !nav.contains(event.relatedTarget)) setMenu(false);
      }
    });

    // Pointerdown (not click) so outside taps on non-clickable elements dismiss reliably on iOS Safari.
    document.addEventListener("pointerdown", (event) => {
      if (!langOpen) return;
      if (langPopover.contains(event.target) || langTrigger.contains(event.target)) return;
      closeLangMenu(false);
    });

    const repositionIfOpen = () => {
      if (langOpen) positionLangMenu();
    };
    addEventListener("resize", repositionIfOpen);
    window.visualViewport?.addEventListener("resize", repositionIfOpen);

    // The first open lays the menu out for the first time: about 30 ms in Edge, half of it finding
    // fonts for the Japanese and Chinese names, so the opening dropped frames. Do it once, unseen,
    // when the page is idle, or when the pointer or focus reaches the button, whichever is first.
    let prepared = false;
    const prepare = () => {
      if (prepared || langOpen || !langPopover.hidden) return;
      prepared = true;
      langPopover.style.visibility = "hidden";
      langPopover.hidden = false;
      positionLangMenu();
      langPopover.hidden = true;
      langPopover.style.visibility = "";
    };
    const whenIdle = () => (window.requestIdleCallback ? requestIdleCallback(prepare, { timeout: 3000 }) : setTimeout(prepare, 500));
    if (document.readyState === "complete") whenIdle();
    else addEventListener("load", whenIdle, { once: true });
    langTrigger.addEventListener("pointerenter", prepare);
    langTrigger.addEventListener("focus", prepare);
  }

  // How wide the bar is on one line: with the language's name, and with its globe alone.
  const narrow = matchMedia("(max-width: 760px)");
  let needs = null;
  const lineWidth = () => {
    const items = [...navInner.children]
      .flatMap((el) => (el === navMenu ? [...el.children] : [el]))
      .filter((el) => getComputedStyle(el).display !== "none");
    const gap = parseFloat(getComputedStyle(navInner).columnGap) || 0;
    return items.reduce((sum, el) => sum + el.getBoundingClientRect().width, gap * (items.length - 1));
  };
  const measureNav = () => {
    const kept = nav.className;
    nav.classList.add("is-measuring");
    nav.classList.remove("is-tight", "is-compact", "is-open");
    const full = lineWidth();
    nav.classList.add("is-tight");
    const tight = lineWidth();
    nav.className = `${kept} is-measuring`;
    void nav.offsetWidth;
    nav.classList.remove("is-measuring");
    return { full, tight };
  };
  const fitNav = () => {
    const wasCompact = nav.classList.contains("is-compact");
    let mode = "is-compact";
    if (!narrow.matches) {
      needs = needs || measureNav();
      const room = navInner.clientWidth + 0.5;
      mode = needs.full <= room ? "" : needs.tight <= room ? "is-tight" : "is-compact";
    }
    nav.classList.toggle("is-tight", mode === "is-tight");
    nav.classList.toggle("is-compact", mode === "is-compact");
    if (langOpen && wasCompact !== (mode === "is-compact")) closeLangMenu(false);
    if (mode !== "is-compact") setMenu(false);
    else if (menuOpen) trayHeight();
    if (langOpen) positionLangMenu();
  };
  const remeasureNav = () => {
    needs = null;
    fitNav();
  };
  let navQueued = false;
  const refitNav = () => {
    if (navQueued) return;
    navQueued = true;
    requestAnimationFrame(() => {
      navQueued = false;
      fitNav();
    });
  };
  fitNav();
  addEventListener("resize", refitNav);
  onLanguage(remeasureNav);
  if (document.fonts) document.fonts.ready.then(remeasureNav);

  /* Reveal on scroll ---------------------------------------------------------------- */

  const revealer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("in");
        revealer.unobserve(entry.target);
      }
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.1 }
  );
  $$(".reveal").forEach((el) => revealer.observe(el));

  /* Hero: the reticle locks onto "shot." ----------------------------------------------- */

  const target = $("#hero-target");
  if (target) {
    const fonts = document.fonts ? document.fonts.ready : Promise.resolve();
    fonts.then(() => setTimeout(() => target.classList.add("play"), 200));
    onLanguage(() => {
      const r = target.getBoundingClientRect();
      if (reducedMotion.matches || !target.classList.contains("play") || r.bottom < 0 || r.top > innerHeight) return;
      target.classList.remove("play");
      void target.offsetWidth;
      target.classList.add("play");
    });
  }

  /* Headlines that stay on one line: where another language's words are longer, they shrink to fit.
     --fit scales each one's font size; English never sets it. */
  const fitGroups = [];
  const ovLinesBox = $(".ov-lines");
  if (ovLinesBox) {
    fitGroups.push({
      host: ovLinesBox,
      // Each line at full size, its picture opened all the way, within its margins and at least the first
      // line's margin from the other edge too, so its drift never takes it off screen.
      need: () => {
        const lines = $$(".ov-line", ovLinesBox);
        const edge = parseFloat(getComputedStyle(lines[0]).marginLeft) || 0;
        return Math.min(
          ...lines.map((line) => {
            const cs = getComputedStyle(line);
            const pill = $(".pill", line);
            const full = line.offsetWidth - (pill ? pill.offsetWidth - 1.9 * parseFloat(cs.fontSize) : 0);
            const room = ovLinesBox.clientWidth - Math.max(edge, parseFloat(cs.marginLeft)) - Math.max(edge, parseFloat(cs.marginRight));
            return room / full;
          })
        );
      },
    });
  }
  const beatList = $(".ov-beats");
  if (beatList) {
    fitGroups.push({
      host: beatList,
      need: () => Math.min(...$$(".ov-beat h3 span", beatList).map((span) => span.clientWidth / span.scrollWidth)),
    });
  }
  const noticedTitle = $(".nt-title");
  if (noticedTitle) fitGroups.push({ host: noticedTitle, need: () => noticedTitle.clientWidth / noticedTitle.scrollWidth });

  const fitHeadlines = () => {
    for (const group of fitGroups) group.host.style.removeProperty("--fit");
    if (!i18n || i18n.lang === "en") return;
    const fits = fitGroups.map((group) => {
      const f = group.need();
      return Number.isFinite(f) && f > 0 && f < 1 ? f * 0.98 : 1;
    });
    fitGroups.forEach((group, i) => fits[i] < 1 && group.host.style.setProperty("--fit", fits[i].toFixed(4)));
  };
  if (fitGroups.length) {
    let fitQueued = false;
    const refit = () => {
      if (fitQueued) return;
      fitQueued = true;
      requestAnimationFrame(() => {
        fitQueued = false;
        fitHeadlines();
      });
    };
    fitHeadlines();
    addEventListener("resize", refit);
    onLanguage(fitHeadlines);
    if (document.fonts) document.fonts.ready.then(refit);
  }

  /* Hero: the desktop lies back, and comes up flat as you scroll to it. */
  const heroStage = $(".hero-stage");
  const desktop = $("#hero-desktop");
  if (heroStage && desktop) {
    onFrame.push(() => {
      if (reducedMotion.matches) {
        desktop.style.setProperty("--tilt", 0);
        desktop.style.setProperty("--scale", 1);
        return;
      }
      const top = heroStage.getBoundingClientRect().top;
      if (top > innerHeight * 1.2 || top < -innerHeight) return;
      const p = clamp((innerHeight * 0.92 - top) / (innerHeight * 0.62));
      desktop.style.setProperty("--tilt", ((1 - p) * 18).toFixed(2));
      desktop.style.setProperty("--scale", lerp(0.9, 1, p).toFixed(4));
    });
  }

  /* Overview: three lines drift apart as they pass, and the captures in them open up ---------- */

  const easeOut = (t) => 1 - Math.pow(1 - t, 3);

  const ovLines = $$(".ov-line").map((line) => ({ line, pill: $(".pill", line), dir: Number(line.dataset.drift) || 0 }));
  if (ovLines.length) {
    onFrame.push(() => {
      const vh = innerHeight;
      const still = reducedMotion.matches;
      const reach = Math.min(innerWidth * 0.06, 96);
      for (const { line, pill, dir } of ovLines) {
        const r = line.getBoundingClientRect();
        if (r.bottom < -vh * 0.5 || r.top > vh * 1.5) continue;
        const t = clamp((vh - r.top) / (vh + r.height)); // 0 as it enters at the bottom, 1 as it leaves at the top
        line.style.setProperty("--x", still ? "0px" : `${(dir * (0.5 - t) * 2 * reach).toFixed(1)}px`);
        if (!pill) continue;
        const g = still ? 1 : easeOut(clamp((t - 0.08) / 0.34));
        pill.style.setProperty("--pw", (0.14 + 0.86 * g).toFixed(4));
        pill.style.setProperty("--ps", (1.4 - 0.4 * g).toFixed(4));
      }
    });
  }

  /* Overview: four moves, played by the scroll --------------------------------------------
     Found: the captures sit out on XBOX network while a check sweeps round them.
     Saved: they line up as a library and download one after another, a cloud on each until
     its download starts and a ring while it runs, as on TangoDown's tiles.
     Filed: they gather into a stack for each game.
     Copied: the library steps aside and each destination takes a copy. */

  const ovScene = $("#ov-scene");
  if (ovScene) {
    const stage = $(".ov-stage", ovScene);
    const tiles = $$(".ov-tile", stage);
    const games = $$(".ov-game", stage);
    const copies = $$(".ov-copy", stage);
    const copyRings = copies.map((c) => $(".ring", c));
    const check = $(".ov-check", stage);
    const beats = $$(".ov-beat", ovScene);
    const count = $(".ov-count", ovScene);
    const rail = $$(".ov-rail i", ovScene);
    const path = $(".ov-path-text", ovScene);

    const groups = games.map(() => []);
    tiles.forEach((t, i) => groups[Number(t.dataset.game) || 0].push(i));

    // Where each capture floats while it's still on XBOX: centre x, centre y (shares of the
    // stage), size (a share of the library's tile) and tilt.
    const scatter = [
      [0.17, 0.15, 0.62, -4], [0.53, 0.09, 0.5, 3], [0.85, 0.2, 0.66, 5],
      [0.09, 0.45, 0.5, 2], [0.36, 0.38, 0.74, -2], [0.7, 0.45, 0.56, -5],
      [0.93, 0.6, 0.48, 3], [0.2, 0.74, 0.66, 4], [0.52, 0.67, 0.54, -3],
      [0.8, 0.84, 0.7, 2], [0.43, 0.93, 0.48, 5], [0.07, 0.91, 0.52, -4],
    ];
    const moves = [[0.21, 0.29], [0.46, 0.54], [0.71, 0.79]];
    const stagger = 0.003;

    let W = 0, H = 0, TW = 0, TH = 0;
    let layouts = null; // [scatter, grid, stacks, library]: {x, y, s, r} per tile, x and y its centre
    let labels = [];    // per game: {x, y} where its name sits, x its centre
    let copyFrom = [], copyTo = []; // per destination: {x, y, s}, x and y its top left
    let state = null;

    const measure = () => {
      W = stage.clientWidth;
      H = stage.clientHeight;
      if (!W || !H) return false;
      const portrait = W < 600 || W / H < 1.25;
      const gap = clamp(W * 0.024, 8, 16);
      const n = tiles.length;

      // Saved: the library, three or four across, whichever gives the larger tiles.
      let best = null;
      for (const c of [3, 4]) {
        const r = Math.ceil(n / c);
        const tw = Math.min((W - (c - 1) * gap) / c, (((H * 0.94 - (r - 1) * gap) / r) * 16) / 9);
        if (!best || tw > best.tw) best = { c, r, tw };
      }
      TW = best.tw;
      TH = (TW * 9) / 16;
      stage.style.setProperty("--tw", `${TW.toFixed(2)}px`);
      const gw = best.c * TW + (best.c - 1) * gap;
      const gh = best.r * TH + (best.r - 1) * gap;
      const gx = (W - gw) / 2;
      const gy = (H - gh) / 2;
      const grid = tiles.map((_, i) => ({
        x: gx + (i % best.c) * (TW + gap) + TW / 2,
        y: gy + Math.floor(i / best.c) * (TH + gap) + TH / 2,
        s: 1,
        r: 0,
      }));

      // Found: scattered, kept inside the stage.
      const loose = tiles.map((_, i) => {
        const [fx, fy, fs, fr] = scatter[i % scatter.length];
        const s = fs * (portrait ? 0.9 : 1);
        const hw = (TW * s) / 2 + 4;
        const hh = (TH * s) / 2 + 4;
        return { x: clamp(fx * W, hw, W - hw), y: clamp(fy * H, hh, H - hh), s, r: fr };
      });

      // Filed: a stack for each game, three across and two down, its name beneath it. A long
      // name wraps to its slot, and the rows leave room for the tallest.
      const cols = 3;
      const rows = Math.ceil(groups.length / cols);
      const slotW = (W - (cols - 1) * gap * 1.5) / cols;
      stage.style.setProperty("--slot", `${slotW.toFixed(2)}px`);
      const label = Math.max(34, 17 + Math.max(0, ...games.map((g) => g.offsetHeight)));
      const sw = Math.min(slotW * 0.84, (((H - (rows - 1) * gap * 2) / rows - label) / 1.3) * 16 / 9);
      const sh = (sw * 9) / 16;
      const pitch = sh * 1.3 + label + gap * 2;
      const top = (H - (rows * pitch - gap * 2)) / 2;
      const stacks = new Array(n);
      labels = groups.map((members, g) => {
        const cx = (g % cols) * (slotW + gap * 1.5) + slotW / 2;
        const cy = top + Math.floor(g / cols) * pitch + (sh * 1.3) / 2;
        const m = members.length;
        members.forEach((i, k) => {
          const o = k - (m - 1) / 2;
          stacks[i] = { x: cx + o * sw * 0.08, y: cy + o * sh * 0.05, s: sw / TW, r: o * 5 };
        });
        return { x: cx, y: cy + sh * 0.65 + 12 };
      });

      // Copied: three cards, beside the library on a wide stage and under it on a narrow one.
      let cw = portrait ? (W - 2 * gap) / 3 : Math.min(W * 0.42, 340);
      ovScene.style.setProperty("--cw", `${cw.toFixed(2)}px`);
      let ch = copies[0] ? copies[0].offsetHeight : cw * 0.55;
      if (!portrait && 3 * ch + 2 * gap > H) {
        const fixed = ch - cw * 0.44;
        cw = Math.max(120, (H - 2 * gap - 3 * fixed) / (3 * 0.44));
        ovScene.style.setProperty("--cw", `${cw.toFixed(2)}px`);
        ch = copies[0].offsetHeight;
      }

      // The library shrinks to make room, and the copies leave from its middle.
      let f, lx, ly;
      if (portrait) {
        f = Math.min((W * 0.58) / gw, ((H - ch - gap * 3) * 0.92) / gh);
        const block = gh * f + gap * 3 + ch;
        lx = (W - gw * f) / 2;
        ly = (H - block) / 2;
        copyTo = copies.map((_, j) => ({ x: j * (cw + gap), y: ly + gh * f + gap * 3, s: 1 }));
      } else {
        f = Math.min((W - cw - gap * 5) / gw, (H * 0.8) / gh);
        lx = (W - cw - gap * 5 - gw * f) / 2;
        ly = (H - gh * f) / 2;
        const top = (H - (3 * ch + 2 * gap)) / 2;
        copyTo = copies.map((_, j) => ({ x: W - cw, y: top + j * (ch + gap), s: 1 }));
      }
      const library = grid.map((t) => ({ x: lx + (t.x - gx) * f, y: ly + (t.y - gy) * f, s: f, r: 0 }));
      const mid = [lx + (gw * f) / 2, ly + (gh * f) / 2];
      copyFrom = copies.map(() => ({ x: mid[0] - (cw * 0.5) / 2, y: mid[1] - (ch * 0.5) / 2, s: 0.5 }));

      layouts = [loose, grid, stacks, library];
      games.forEach((g) => (g.dataset.w = g.offsetWidth));
      return true;
    };

    const place = (el, x, y, s, r, o) => {
      el.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) scale(${s.toFixed(4)}) rotate(${r.toFixed(2)}deg)`;
      el.style.opacity = o.toFixed(3);
    };

    const frame = () => {
      const rect = ovScene.getBoundingClientRect();
      const vh = innerHeight;
      if (rect.bottom < -vh * 0.25 || rect.top > vh * 1.25) return;
      if (!layouts || stage.clientWidth !== W || stage.clientHeight !== H) {
        if (!measure()) return;
      }
      const still = reducedMotion.matches;
      const p = clamp(-rect.top / Math.max(1, rect.height - vh));
      const entry = clamp(1 - rect.top / (vh * 0.8));
      const beat = p < 0.25 ? 0 : p < 0.5 ? 1 : p < 0.75 ? 2 : 3;

      if (beat !== state) {
        state = beat;
        beats.forEach((b, i) => {
          b.classList.toggle("is-active", i === beat);
          b.classList.toggle("is-past", i < beat);
        });
        if (count) count.style.setProperty("--beat", beat);
      }
      rail.forEach((bar, k) => bar.style.setProperty("--f", clamp((p - k * 0.25) / 0.25).toFixed(4)));
      if (path) path.style.setProperty("--type", still ? 1 : clamp((p - 0.56) / 0.12).toFixed(4));

      // The captures.
      tiles.forEach((tile, i) => {
        let from = 0, u = 0;
        if (still) from = beat;
        else {
          for (let k = 0; k < moves.length; k++) {
            const [t0, t1] = moves[k];
            const span = t1 - t0 - stagger * (tiles.length - 1);
            const v = clamp((p - t0 - i * stagger) / span);
            if (v <= 0) break;
            if (v < 1) { from = k; u = easeInOut(v); break; }
            from = k + 1;
          }
        }
        const a = layouts[from][i];
        const b = layouts[Math.min(from + 1, 3)][i];
        let x = lerp(a.x, b.x, u);
        let y = lerp(a.y, b.y, u);
        let s = lerp(a.s, b.s, u);
        const r = lerp(a.r, b.r, u);
        const shown = still ? (entry > 0.2 ? 1 : 0) : easeOut(clamp((entry - 0.12 - i * 0.035) / 0.3));
        if (!still) {
          y += (1 - shown) * 36;
          s *= 0.9 + 0.1 * shown;
        }
        place(tile, x - TW / 2, y - TH / 2, s, r, shown);
        tile.style.setProperty("--d", clamp((p - 0.295 - i * 0.011) / 0.03).toFixed(4));
      });

      // The check that finds them.
      if (check) {
        const o = still ? (beat === 0 ? 1 : 0) : clamp((entry - 0.2) / 0.4) * (1 - clamp((p - 0.19) / 0.06));
        check.style.opacity = o.toFixed(3);
        check.style.setProperty("--spin", still ? 0 : (-(p * 520 + entry * 40)).toFixed(2));
      }

      // The games' names under their stacks.
      games.forEach((g, i) => {
        const o = still ? (beat === 2 ? 1 : 0) : clamp((p - 0.53) / 0.04) * (1 - clamp((p - 0.7) / 0.03));
        const at = labels[i];
        g.style.transform = `translate3d(${(at.x - Number(g.dataset.w) / 2).toFixed(2)}px, ${(at.y + (1 - o) * 8).toFixed(2)}px, 0)`;
        g.style.opacity = o.toFixed(3);
      });

      // The copies, and each destination's ring as its copy goes up.
      copies.forEach((card, j) => {
        const v = still ? (beat === 3 ? 1 : 0) : clamp((p - 0.775 - j * 0.025) / 0.08);
        const e = easeInOut(v);
        const a = copyFrom[j];
        const b = copyTo[j];
        place(card, lerp(a.x, b.x, e), lerp(a.y, b.y, e), lerp(a.s, b.s, e), 0, clamp(v * 2.5));
        const start = 0.85 + j * 0.03;
        const ring = copyRings[j];
        if (!ring) return;
        ring.style.setProperty("--p", clamp((p - start) / 0.07).toFixed(4));
        ring.style.opacity = (clamp((v - 0.9) * 10) * (1 - clamp((p - start - 0.075) / 0.015))).toFixed(3);
      });
    };
    onFrame.push(frame);
    onLanguage(() => {
      layouts = null;
      schedule();
    });
  }

  /* Noticed: XBOX's 90 days as 90 dots ------------------------------------------------------
     Scrolling the dots up the screen spends the days until a week is left, with the dots in
     the middle of the screen, and TangoDown's warning arrives. The last four days then go by
     on their own while the dots are on screen, however fast the page is flicked, and at three
     days a second warning stacks on the first. Scrolling back before the week starts over.
     Download saves the captures, as the notification's button does in the app; Close puts
     the warnings away. Either lasts until the dots leave the screen. With Reduce Motion it
     stays at a week left. */

  const ntStage = $(".nt-stage");
  if (ntStage) {
    const ntDays = $(".nt-days", ntStage);
    const ntStack = $(".nt-stack", ntStage);
    const ntWeek = $(".nt-week", ntStage);
    const ntLast = $(".nt-last", ntStage);
    const ntStatus = $(".nt-status", ntStage);
    const dots = [...ntDays.children];
    const WEEK = 83; // the days a week and three days before the 90th
    const LAST = 87;
    const HOLD = 1100; // ms the first warning has to itself
    const TICK = 300; // ms a day after that
    let shown = -1;
    let scrolled = 0; // days spent by scrolling, up to WEEK
    let ticked = 0; // days gone by on their own since, up to LAST - WEEK
    let timer = 0;

    const show = (day) => {
      if (day === shown) return;
      shown = day;
      dots.forEach((dot, i) => {
        if (dot.classList.contains("is-mark")) dot.classList.toggle("is-due", i + 1 <= day);
        else dot.classList.toggle("is-gone", i + 1 <= day);
      });
      ntStage.classList.toggle("has-week", day >= WEEK);
      ntStage.classList.toggle("has-last", day >= LAST);
      // Keyboard focus follows the warning in front, or stays on the stage when none is.
      const front = day >= LAST ? ntLast : day >= WEEK ? ntWeek : null;
      const focused = [ntWeek, ntLast].find((banner) => banner.contains(document.activeElement));
      if (focused && focused !== front) (front ? $(".nt-action", front) : ntStage).focus({ preventScroll: true });
    };

    const halt = () => {
      clearTimeout(timer);
      timer = 0;
    };
    const tick = () => {
      if (timer || scrolled < WEEK || ticked === LAST - WEEK) return;
      timer = setTimeout(() => {
        timer = 0;
        ticked += 1;
        show(WEEK + ticked);
        tick();
      }, ticked ? TICK : HOLD);
    };

    // A week is left once the middle of the dots is 59% of the way down the screen, having
    // come in at the bottom. The clock runs only while every dot is on screen.
    onFrame.push(() => {
      if (reducedMotion.matches) {
        halt();
        return show(WEEK);
      }
      const r = ntDays.getBoundingClientRect();
      const vh = innerHeight;
      scrolled = Math.round(WEEK * clamp((vh * 0.95 - (r.top + r.height / 2)) / (vh * 0.36)));
      if (scrolled < WEEK) ticked = 0;
      show(scrolled + ticked);
      if (scrolled === WEEK && r.top >= 0 && r.bottom <= vh) tick();
      else halt();
    });

    const putAway = (state) => {
      const hadFocus = ntStack.contains(document.activeElement);
      ntStage.classList.add(state);
      if (hadFocus) ntStage.focus({ preventScroll: true });
    };
    ntStack.addEventListener("click", (event) => {
      if (event.target.closest(".nt-action")) {
        putAway("is-saved");
        ntStatus.textContent = T("3 captures downloaded.");
      } else if (event.target.closest(".nt-dismiss")) {
        putAway("is-dismissed");
      }
    });

    watchVisibility(ntStage, (isVisible) => {
      if (isVisible) return;
      ntStage.classList.remove("is-dismissed", "is-saved");
      ntStatus.textContent = "";
    });
    onLanguage(() => {
      if (ntStatus.textContent) ntStatus.textContent = T("3 captures downloaded.");
    });
  }

  /* Backups: one capture leaves the Mac, and each destination that's on takes a copy ---------- */

  const destCard = $("#destinations");
  const destStage = destCard && $(".dest-stage", destCard);
  if (destStage) {
    const canvas = $("canvas", destStage);
    const ctx = canvas.getContext("2d");
    const tiles = $$(".dest-tile", destCard);
    const ids = tiles.map((tile) => tile.dataset.dest);
    const parts = Object.fromEntries(
      tiles.map((tile) => [
        tile.dataset.dest,
        {
          tile,
          tab: $(".dest-tab", tile),
          ring: $(".dest-ring", tile),
          fill: $(".dest-ring-fill", tile),
          icon: $(".dest-icon", tile),
          check: $(".dest-check", tile),
          name: $(".dest-tab span", tile),
          shown: "",
        },
      ])
    );
    const panel = $("#dest-panel");
    const descs = $$(".dest-desc", panel);
    const toggleSwitch = $(".dest-switch", panel);
    const css = getComputedStyle(document.documentElement);
    const green = css.getPropertyValue("--app-green").trim() || "#107c10";
    const ink2 = css.getPropertyValue("--ink-2").trim() || "#6e6e73";
    const TAU = Math.PI * 2;

    // Each destination has its own queue in the app, so each copy keeps its own pace.
    const speeds = { icloud: 1, gdrive: 0.74, dropbox: 0.86, nas: 1.3, webdav: 0.94 };
    const macGlyph = new Path2D("M5 6.8A1.8 1.8 0 0 1 6.8 5h10.4A1.8 1.8 0 0 1 19 6.8V15H5ZM2.8 18.2h18.4");

    const easeOut = (p) => 1 - Math.pow(1 - p, 3);
    const backOut = (p) => {
      const s = 1.9, q = p - 1;
      return 1 + (s + 1) * q * q * q + s * q * q;
    };
    // How fast easeInOut moves at p, 0 to 1.
    const speedAt = (p) => (p < 0.5 ? 12 * p * p : 3 * Math.pow(2 - 2 * p, 2)) / 3;

    const on = Object.fromEntries(ids.map((id) => [id, true]));
    // g: how far its branch has grown; bump: its tile's spring as a copy lands; ringAt: when the last one landed.
    const nodes = Object.fromEntries(ids.map((id) => [id, { g: 1, gv: 0, bump: 0, bv: 0, ringAt: -1e9 }]));
    const macSpring = { bump: 0, bv: 0 };
    let picked = ids[0];
    let tokens = [];
    let now = 0; // ms, advancing only while the card is on screen
    let idleSince = -900;
    let forkAt = -1e9;
    let G = null;

    const makePath = (pts) => {
      const cum = [0];
      for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
      return { pts, cum, len: cum[cum.length - 1] };
    };

    // The point at distance d along a path, and the direction there.
    const at = (path, d) => {
      const { cum, pts } = path;
      if (d <= 0) return { x: pts[0].x, y: pts[0].y, a: Math.atan2(pts[1].y - pts[0].y, pts[1].x - pts[0].x) };
      let i = 1;
      while (i < cum.length - 1 && cum[i] < d) i++;
      const t = Math.min(1, (d - cum[i - 1]) / (cum[i] - cum[i - 1] || 1));
      const p = pts[i - 1], q = pts[i];
      return { x: lerp(p.x, q.x, t), y: lerp(p.y, q.y, t), a: Math.atan2(q.y - p.y, q.x - p.x) };
    };

    // Adds the stretch of a path between two distances to the canvas's current path.
    const trace = (path, from, to) => {
      if (to <= from) return;
      const { cum, pts } = path;
      const s = at(path, from);
      ctx.moveTo(s.x, s.y);
      for (let i = 1; i < pts.length; i++) {
        if (cum[i] <= from) continue;
        if (cum[i] >= to) {
          const e = at(path, to);
          ctx.lineTo(e.x, e.y);
          return;
        }
        ctx.lineTo(pts[i].x, pts[i].y);
      }
    };

    // The Mac at the top, and an S-curve down from the fork to the top of each tile.
    // A copy lands a little way into its tile, behind it. Offsets, not client rects, so the card's reveal doesn't skew them.
    const layout = (W, H) => {
      const ends = {}, pos = {};
      let top = H;
      for (const id of ids) {
        const { tile } = parts[id];
        const x = tile.offsetLeft + tile.offsetWidth / 2, y = tile.offsetTop;
        top = Math.min(top, y);
        ends[id] = { x, y: y - 3 };
        pos[id] = { x, y: y + 24 };
      }
      const mac = { x: W / 2, y: clamp(top * 0.26, 48, 66) };
      const fork = { x: mac.x, y: lerp(mac.y, top, 0.45) };
      const line = [];
      for (let i = 0; i <= 24; i++) line.push({ x: lerp(mac.x, fork.x, i / 24), y: lerp(mac.y, fork.y, i / 24) });
      const branches = {};
      for (const id of ids) {
        const end = ends[id], mid = (fork.y + end.y) / 2;
        const c1 = { x: fork.x, y: mid }, c2 = { x: end.x, y: mid };
        const pts = [];
        for (let i = 0; i <= 40; i++) {
          const t = i / 40, u = 1 - t;
          pts.push({
            x: u * u * u * fork.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t * t * t * end.x,
            y: u * u * u * fork.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t * t * t * end.y,
          });
        }
        branches[id] = makePath(pts);
      }
      const angle = Math.atan2(fork.y - mac.y, fork.x - mac.x);
      return { W, H, mac, fork, nodes: pos, trunk: makePath(line), branches, angle };
    };

    // Sizes the canvas to the stage and clears it; false while the stage has no size.
    const surface = () => {
      const W = destStage.clientWidth, H = destStage.clientHeight;
      if (!W || !H) return false;
      const dpr = Math.min(2, devicePixelRatio || 1);
      const w = Math.round(W * dpr), h = Math.round(H * dpr);
      if (canvas.width !== w) canvas.width = w;
      if (canvas.height !== h) canvas.height = h;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      if (!G || G.W !== W || G.H !== H) G = layout(W, H);
      return true;
    };

    // One capture leaves the Mac. With no targets, it goes to every destination that's on when it reaches the fork.
    const send = (targets) => {
      if (reducedMotion.matches) return;
      const leaving = tokens.find((k) => k.kind === "capture" && ["pop", "squash", "trunk"].includes(k.state));
      if (leaving) {
        if (!targets) leaving.targets = null;
        else if (leaving.targets) for (const id of targets) if (!leaving.targets.includes(id)) leaving.targets.push(id);
        return;
      }
      tokens.push({ kind: "capture", targets: targets ? [...targets] : null, state: "pop", t0: now, d: 0, scale: 0, st: 0, rot: 0, shake: 0, tail: 0, alpha: 1 });
      macSpring.bv -= 5;
    };

    const step = () => {
      const { trunk, branches } = G;
      const keep = [], born = [];
      for (const k of tokens) {
        let e = now - k.t0;
        if (k.kind === "capture") {
          if (k.state === "pop") {
            const p = Math.min(1, e / 380);
            k.scale = backOut(p);
            if (p >= 1) { k.state = "squash"; k.t0 = now; }
          } else if (k.state === "squash") {
            const p = Math.min(1, e / 170);
            k.st = -0.2 * Math.sin(p * Math.PI);
            if (p >= 1) { k.state = "trunk"; k.t0 = now; }
          } else if (k.state === "trunk") {
            const p = Math.min(1, e / Math.max(420, (trunk.len / 400) * 1000));
            k.d = easeInOut(p) * trunk.len;
            k.st = 0.18 * speedAt(p);
            k.tail = 14 + 130 * speedAt(p);
            if (p >= 1) {
              const list = (k.targets || ids).filter((id) => on[id]);
              if (list.length) {
                // At the fork it becomes one copy per destination.
                forkAt = now;
                list.forEach((id, i) => born.push({ kind: "copy", id, i, n: list.length, state: "fan", t0: now, d: 0, scale: 1, st: 0, rot: 0, off: 0, tail: 0, alpha: 1, x: G.fork.x, y: G.fork.y, a: 0 }));
                continue;
              }
              k.state = "refuse"; k.t0 = now; k.tail = 0;
            }
          } else if (k.state === "refuse") {
            // Nowhere to go: it shakes its head at the fork and heads home.
            const p = Math.min(1, e / 560);
            k.st = 0;
            k.shake = Math.sin(p * Math.PI * 6) * 6 * (1 - p);
            if (p >= 1) { k.state = "return"; k.t0 = now; k.shake = 0; }
          } else if (k.state === "return") {
            const p = Math.min(1, e / 560);
            k.d = trunk.len * (1 - easeInOut(p));
            k.st = 0.14 * speedAt(p);
            k.tail = 14 + 100 * speedAt(p);
            k.back = true;
            if (p >= 1) { k.state = "sink"; k.t0 = now; k.tail = 0; macSpring.bv += 4; }
          } else if (k.state === "sink") {
            const p = Math.min(1, e / 220);
            k.scale = 1 - p * p;
            if (p >= 1) continue;
          }
          const pt = at(trunk, k.d);
          k.a = pt.a;
          k.x = pt.x - Math.sin(pt.a) * k.shake;
          k.y = pt.y + Math.cos(pt.a) * k.shake;
          k.rot = k.shake * 0.035;
          keep.push(k);
          continue;
        }

        const path = branches[k.id];
        if (!on[k.id] && (k.state === "fan" || k.state === "branch")) { k.state = "poof"; k.t0 = now; e = 0; }
        const mid = (k.n - 1) / 2;
        const fanRot = (k.i - mid) * Math.min(0.24, 0.9 / k.n);
        const fanOff = (k.i - mid) * 7;
        if (k.state === "fan") {
          // The copies spread like a hand of cards, then set off one after another.
          const b = backOut(Math.min(1, e / 240));
          k.rot = fanRot * b;
          k.off = fanOff * b;
          if (e >= 240 + k.i * 85) { k.state = "branch"; k.t0 = now; }
        } else if (k.state === "branch") {
          const p = Math.min(1, e / Math.max(560, (path.len / (300 * speeds[k.id])) * 1000));
          const settle = Math.min(1, p * 2.5);
          k.d = easeInOut(p) * path.len;
          k.st = 0.18 * speedAt(p);
          k.tail = 12 + 110 * speedAt(p);
          k.rot = fanRot * (1 - settle) + Math.sin(p * Math.PI * 4) * 0.08 * (1 - p);
          k.off = fanOff * (1 - settle);
          if (p >= 1) {
            // landP starts at 0 here, since the copy is placed below before the land step has run.
            k.state = "land"; k.t0 = now; k.tail0 = k.tail; k.landP = 0;
            nodes[k.id].bv += 7;
            nodes[k.id].ringAt = now;
          }
        } else if (k.state === "land") {
          k.landP = Math.min(1, e / 200);
          k.tail = k.tail0 * (1 - k.landP);
          if (k.landP >= 1) continue;
        } else if (k.state === "poof") {
          const p = Math.min(1, e / 200);
          k.scale = 1 - p;
          k.alpha = 1 - p;
          k.tail = 0;
          if (p >= 1) continue;
        }
        const pt = at(path, k.d);
        k.a = pt.a;
        k.x = pt.x - Math.sin(G.angle) * k.off;
        k.y = pt.y + Math.cos(G.angle) * k.off;
        if (k.state === "land") {
          // Into its tile, shrinking as it goes.
          const n = G.nodes[k.id], q = k.landP * k.landP;
          k.x = lerp(k.x, n.x, q);
          k.y = lerp(k.y, n.y, q);
          k.scale = 1 - 0.75 * k.landP;
          k.alpha = 1 - k.landP;
          k.st = 0;
        }
        keep.push(k);
      }
      tokens = keep.concat(born);
    };

    // After a copy lands, its tile's ring fills, a check shows, then both fade.
    const ringState = (id) => {
      const e = now - nodes[id].ringAt;
      if (e < 0 || e > 1900) return { ring: 0, alpha: 0, check: 0 };
      return {
        ring: easeOut(Math.min(1, e / 460)),
        alpha: e < 1500 ? 1 : Math.max(0, 1 - (e - 1500) / 380),
        check: e < 380 || e > 1350 ? 0 : clamp(Math.min((e - 380) / 120, (1350 - e) / 160)),
      };
    };

    const roundRect = (x, y, w, h, r) => {
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(x, y, w, h, r);
      else ctx.rect(x, y, w, h);
    };

    // The green streak behind a capture: longer the faster it goes, thinning and fading toward its tail.
    const drawStreak = (path, tail, head, alpha) => {
      if (Math.abs(head - tail) < 1) return;
      ctx.strokeStyle = green;
      ctx.lineCap = "butt";
      ctx.lineJoin = "round";
      for (let j = 0; j < 16; j++) {
        const s0 = lerp(tail, head, j / 16), s1 = lerp(tail, head, (j + 1) / 16), f = (j + 1) / 16;
        ctx.globalAlpha = alpha * f * f;
        ctx.lineWidth = 0.6 + 1.6 * f;
        ctx.beginPath();
        trace(path, Math.min(s0, s1), Math.max(s0, s1));
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    };

    const drawMac = () => {
      const s = 1 + 0.08 * macSpring.bump;
      ctx.save();
      ctx.translate(G.mac.x, G.mac.y);
      ctx.scale(s, s);
      ctx.shadowColor = "rgba(0, 0, 0, 0.12)";
      ctx.shadowBlur = 16;
      ctx.shadowOffsetY = 5;
      ctx.fillStyle = "#fff";
      roundRect(-32, -32, 64, 64, 17);
      ctx.fill();
      ctx.shadowColor = "transparent";
      ctx.strokeStyle = "rgba(0, 0, 0, 0.07)";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.translate(-15, -15);
      ctx.scale(30 / 24, 30 / 24);
      ctx.strokeStyle = ink2;
      ctx.lineWidth = 1.5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke(macGlyph);
      ctx.restore();
    };

    // A capture: a small screenshot card, stretched along its way when it's quick.
    const drawCapture = (k) => {
      if (!(k.scale > 0.01 && k.alpha > 0.01 && Number.isFinite(k.x) && Number.isFinite(k.y))) return;
      ctx.save();
      ctx.globalAlpha = k.alpha;
      ctx.translate(k.x, k.y);
      if (k.st) {
        ctx.rotate(k.a);
        ctx.scale(1 + k.st, 1 - k.st * 0.6);
        ctx.rotate(-k.a);
      }
      ctx.rotate(k.rot || 0);
      ctx.scale(k.scale, k.scale);
      ctx.shadowColor = "rgba(0, 0, 0, 0.2)";
      ctx.shadowBlur = 12;
      ctx.shadowOffsetY = 4;
      ctx.fillStyle = "#fff";
      roundRect(-21, -16, 42, 32, 6);
      ctx.fill();
      ctx.shadowColor = "transparent";
      ctx.strokeStyle = "rgba(0, 0, 0, 0.12)";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = "#eceef1";
      roundRect(-17.5, -12.5, 35, 25, 3.5);
      ctx.fill();
      ctx.strokeStyle = "#8e8e93";
      ctx.lineWidth = 1.6;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(-14, 8);
      ctx.lineTo(-6, 0);
      ctx.lineTo(0, 6);
      ctx.lineTo(4, 2);
      ctx.lineTo(13, 9.5);
      ctx.stroke();
      ctx.fillStyle = "#8e8e93";
      ctx.beginPath();
      ctx.arc(8, -5, 2.2, 0, TAU);
      ctx.fill();
      ctx.restore();
    };

    const draw = () => {
      const { trunk, branches } = G;
      // The lines, in one stroke so they don't darken where they meet; the picked tile's branch a shade darker.
      ctx.beginPath();
      trace(trunk, 34, trunk.len);
      for (const id of ids) trace(branches[id], 0, branches[id].len * clamp(nodes[id].g));
      ctx.strokeStyle = "rgba(0, 0, 0, 0.11)";
      ctx.lineWidth = 1.5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();
      const grown = clamp(nodes[picked].g);
      if (grown > 0.001) {
        ctx.beginPath();
        trace(branches[picked], 0, branches[picked].len * grown);
        ctx.strokeStyle = "rgba(0, 0, 0, 0.13)";
        ctx.stroke();
      }
      for (const k of tokens) {
        if (!(k.tail >= 1)) continue;
        const path = k.kind === "capture" ? trunk : branches[k.id];
        const lo = k.kind === "capture" ? 34 : 0;
        const head = clamp(k.d, lo, path.len);
        const tail = k.back ? Math.min(path.len, k.d + k.tail) : Math.max(lo, k.d - k.tail);
        drawStreak(path, tail, head, k.alpha);
      }
      // The fork flashes green as the copies leave it.
      const flash = Math.max(0, 1 - (now - forkAt) / 500);
      ctx.beginPath();
      ctx.arc(G.fork.x, G.fork.y, 3 + 1.5 * flash, 0, TAU);
      ctx.fillStyle = "rgba(0, 0, 0, 0.18)";
      ctx.fill();
      if (flash > 0) {
        ctx.globalAlpha = flash;
        ctx.fillStyle = green;
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      // The canvas sits under the tiles, so a landing copy slips in behind its tile.
      for (const k of tokens) if (k.state === "land") drawCapture(k);
      drawMac();
      for (const k of tokens) if (k.state !== "land") drawCapture(k);
    };

    // A tile dips as its copy lands, its ring fills round the symbol, and the symbol turns into a check for a moment.
    const syncTiles = () => {
      for (const id of ids) {
        const n = nodes[id], r = ringState(id), t = parts[id];
        const key = `${n.bump.toFixed(2)} ${r.ring.toFixed(3)} ${r.alpha.toFixed(3)} ${r.check.toFixed(3)}`;
        if (t.shown === key) continue;
        t.shown = key;
        t.tab.style.transform = Math.abs(n.bump) < 0.005 ? "" : `translateY(${(n.bump * 10).toFixed(2)}px)`;
        t.ring.style.opacity = r.alpha.toFixed(3);
        t.fill.style.strokeDashoffset = (100 - 100 * r.ring).toFixed(2);
        t.icon.style.opacity = (1 - r.check).toFixed(3);
        t.check.style.opacity = r.check.toFixed(3);
        t.check.style.transform = r.check > 0 ? `scale(${(0.7 + 0.3 * backOut(r.check)).toFixed(3)})` : "";
      }
    };

    const frame = (dt) => {
      if (!surface()) return;
      // Springs: a branch grows out or draws back, and a tile bumps as a copy lands.
      for (const id of ids) {
        const n = nodes[id];
        n.gv += (190 * ((on[id] ? 1 : 0) - n.g) - 16 * n.gv) * dt;
        n.g += n.gv * dt;
        n.bv += (-320 * n.bump - 11 * n.bv) * dt;
        n.bump += n.bv * dt;
      }
      macSpring.bv += (-320 * macSpring.bump - 11 * macSpring.bv) * dt;
      macSpring.bump += macSpring.bv * dt;
      step();
      // The next capture leaves a little while after the last copy lands.
      if (tokens.length) idleSince = null;
      else if (idleSince === null) idleSince = now;
      else if (now - idleSince > 1800) {
        idleSince = null;
        send(null);
      }
      draw();
      syncTiles();
    };

    // Reduced motion: the routes as they stand, with nothing travelling.
    const drawStill = () => {
      tokens = [];
      for (const id of ids) Object.assign(nodes[id], { g: on[id] ? 1 : 0, gv: 0, bump: 0, bv: 0, ringAt: -1e9 });
      syncTiles();
      if (surface()) draw();
    };

    // The panel shows the picked destination: its description, and a switch for whether it gets copies.
    const showSwitch = () => {
      toggleSwitch.setAttribute("aria-checked", String(on[picked]));
      toggleSwitch.setAttribute("aria-label", T("Copy to {name}", { name: parts[picked].name.textContent.trim() }));
    };

    const pick = (id, focus) => {
      if (id !== picked) {
        picked = id;
        for (const other of ids) {
          const { tab } = parts[other];
          tab.setAttribute("aria-selected", String(other === id));
          tab.tabIndex = other === id ? 0 : -1;
        }
        for (const desc of descs) desc.classList.toggle("is-shown", desc.dataset.dest === id);
        panel.setAttribute("aria-labelledby", parts[id].tab.id);
        panel.style.setProperty("--i", ids.indexOf(id));
        showSwitch();
        if (reducedMotion.matches) drawStill();
      }
      if (focus) parts[id].tab.focus();
    };

    const toggle = (id) => {
      on[id] = !on[id];
      parts[id].tab.classList.toggle("is-off", !on[id]);
      if (id === picked) showSwitch();
      if (reducedMotion.matches) return drawStill();
      if (on[id]) send([id]);
    };

    for (const id of ids) {
      const { tab } = parts[id];
      tab.addEventListener("click", () => pick(id, false));
      tab.addEventListener("keydown", (e) => {
        const i = ids.indexOf(id);
        const to = { ArrowRight: i + 1, ArrowDown: i + 1, ArrowLeft: i - 1, ArrowUp: i - 1, Home: 0, End: ids.length - 1 }[e.key];
        if (to === undefined) return;
        e.preventDefault();
        pick(ids[(to + ids.length) % ids.length], true);
      });
    }
    toggleSwitch.addEventListener("click", () => toggle(picked));
    showSwitch();

    const onMac = (e) => {
      if (!G) return false;
      const b = destStage.getBoundingClientRect();
      const x = e.clientX - b.left, y = e.clientY - b.top;
      return Math.abs(x - G.mac.x) < 36 && Math.abs(y - G.mac.y) < 36;
    };
    // Clicking the Mac sends another capture. Click, not pointerdown, so a swipe that scrolls the page sends nothing.
    destStage.addEventListener("click", (e) => {
      if (reducedMotion.matches || !onMac(e)) return;
      macSpring.bv -= 6;
      send(null);
    });
    destStage.addEventListener("pointermove", (e) => {
      destStage.style.cursor = onMac(e) ? "pointer" : "";
    });

    let visible = false;
    let raf = 0;
    let last = null;
    const tick = (ts) => {
      raf = 0;
      if (!visible || reducedMotion.matches) return;
      raf = requestAnimationFrame(tick);
      const dt = last === null ? 16 : Math.min(50, ts - last);
      last = ts;
      now += dt;
      frame(dt / 1000);
    };
    const play = () => {
      if (reducedMotion.matches) return drawStill();
      if (raf) return;
      last = null;
      raf = requestAnimationFrame(tick);
    };
    watchVisibility(destStage, (isVisible) => {
      visible = isVisible;
      if (isVisible) play();
    });
    reducedMotion.addEventListener("change", () => {
      if (visible) play();
    });
    new ResizeObserver(() => {
      if (visible && reducedMotion.matches) drawStill();
    }).observe(destStage);
    onLanguage(() => {
      G = null;
      showSwitch();
      if (visible && reducedMotion.matches) drawStill();
    });
  }

  /* Library: the screen recording plays once, and only while it's on screen ------------------
     It loads when it first scrolls into view. At the end it stays on its last frame and offers
     Replay. Where it can't start by itself, with Reduce Motion or when the browser won't
     autoplay (a phone saving power), the same button offers Play. */

  $$(".recording").forEach((figure) => {
    const video = $("video", figure);
    const source = $("source[data-src]", video);
    const button = $(".recording-button", figure);
    const label = $("span", button);
    let loaded = false;
    let word = label.textContent.trim();
    label.textContent = T(word);
    onLanguage(() => (label.textContent = T(word)));

    // idle: not started; playing; stopped: waiting for Play; ended: waiting for Replay.
    const set = (state) => {
      figure.dataset.state = state;
      word = state === "ended" ? "Replay" : "Play";
      label.textContent = T(word);
    };
    const start = () =>
      video.play().then(
        () => set("playing"),
        (error) => {
          if (error.name === "NotAllowedError") set("stopped");
        }
      );

    video.addEventListener("ended", () => set("ended"));
    button.addEventListener("click", () => {
      const hadFocus = document.activeElement === button;
      start().then(() => {
        if (hadFocus && figure.dataset.state === "playing") video.focus({ preventScroll: true });
      });
    });

    watchVisibility(
      figure,
      (isVisible) => {
        if (!isVisible) return video.pause();
        if (!loaded && source) {
          loaded = true;
          source.src = source.dataset.src;
          video.load();
        }
        const state = figure.dataset.state;
        if (state === "ended" || state === "stopped") return;
        if (reducedMotion.matches) return set("stopped");
        start();
      },
      { threshold: 0.25 }
    );
  });

  /* Design: drawing the app's controls ---------------------------------------------------------
     The preview stage and its Liquid Glass buttons, and the Check Now button's glass and symbol,
     fitted to the app on screen. Used by the Design section below. */

  // The stage: build() draws it at a size in points, show() puts a capture on it.
  const makeStageKit = () => {
    let uid = 0;
    const r3 = (v) => +v.toFixed(3);
    const GLYPHS = {"xmark": {"w": 14, "h": 13, "d": "M747 3805 c-22 -7 -50 -24 -64 -37 -36 -33 -63 -95 -63 -148 0 -56 26 -113 75 -165 21 -22 71 -76 113 -120 41 -44 104 -112 141 -151 36 -38 95 -101 130 -140 35 -38 92 -98 126 -134 61 -65 525 -564 682 -735 46 -50 83 -94 83 -100 0 -5 -33 -44 -73 -86 -40 -42 -108 -116 -152 -164 -44 -48 -105 -113 -135 -144 -30 -32 -82 -87 -115 -122 -33 -36 -94 -101 -135 -145 -94 -101 -138 -148 -440 -473 -135 -145 -256 -279 -269 -297 -29 -40 -39 -124 -22 -175 14 -43 56 -91 98 -112 40 -21 115 -22 152 -2 29 15 82 71 806 850 224 242 441 475 481 517 l73 77 88 -97 c48 -53 104 -112 123 -132 19 -20 76 -81 125 -135 50 -54 115 -123 145 -155 30 -31 96 -100 145 -154 50 -54 110 -119 135 -145 25 -26 86 -91 135 -145 50 -54 131 -142 181 -195 50 -53 122 -130 160 -172 92 -101 135 -129 196 -129 27 0 62 7 77 14 60 31 111 115 111 181 0 46 -24 99 -67 148 -25 29 -77 86 -116 127 -39 41 -100 107 -136 146 -166 177 -218 233 -276 294 -52 55 -193 206 -650 700 -38 41 -80 87 -93 102 l-24 26 219 234 c800 854 1109 1192 1125 1231 32 80 17 158 -42 217 -60 60 -136 73 -211 34 -27 -13 -59 -48 -863 -914 -263 -283 -482 -516 -486 -518 -3 -1 -45 39 -92 90 -47 51 -101 109 -119 129 -106 112 -195 207 -279 298 -52 57 -115 124 -140 150 -70 73 -240 255 -375 402 -33 36 -124 133 -203 217 -112 118 -152 154 -180 162 -47 13 -58 12 -105 -5z"}, "chl": {"w": 9, "h": 13, "d": "M1976 3815 c-16 -8 -126 -114 -245 -234 -119 -120 -477 -482 -796 -804 -368 -373 -586 -601 -597 -624 -24 -53 -22 -112 5 -161 13 -24 321 -344 732 -759 390 -395 748 -756 795 -802 47 -46 99 -90 117 -97 80 -35 180 0 220 76 27 51 30 126 7 175 -8 19 -117 136 -241 262 -124 125 -376 381 -561 568 -185 187 -407 412 -495 501 l-159 161 242 244 c964 974 1197 1214 1212 1247 36 78 12 187 -53 233 -43 30 -140 38 -183 14z"}, "chr": {"w": 9, "h": 13, "d": "M728 3810 c-26 -14 -44 -35 -64 -75 -22 -46 -26 -64 -21 -105 3 -27 17 -66 30 -87 14 -21 58 -70 98 -109 118 -114 1334 -1345 1337 -1354 2 -5 -98 -112 -223 -237 -940 -949 -1203 -1218 -1222 -1255 -28 -50 -29 -108 -4 -163 25 -56 71 -92 127 -101 92 -13 107 -3 353 246 1002 1011 1378 1395 1394 1423 21 38 22 116 3 160 -8 18 -153 172 -323 344 -169 172 -528 536 -798 809 -269 273 -502 502 -517 510 -39 20 -126 17 -170 -6z"}};

    // Shapes take an offset, so a button's box can sit on a whole pixel with the shape the fraction in from
    // it: browsers draw these boxes at whole CSS pixels, half a point from where a half-point button is.
    const capsule = (w, h, ox, oy) => {
      const r = h / 2, x0 = ox || 0, y0 = oy || 0;
      return 'M' + r3(x0 + r) + ' ' + y0 + 'H' + r3(x0 + w - r) + 'A' + r + ' ' + r + ' 0 0 1 ' + r3(x0 + w - r) + ' ' + r3(y0 + h) + 'H' + r3(x0 + r) + 'A' + r + ' ' + r + ' 0 0 1 ' + r3(x0 + r) + ' ' + y0 + 'Z';
    };
    // Previous and Next as a GlassEffectContainer melts them: a smooth union, its radius fitted to the neck on screen.
    const pair = (w1, h, k, ox, oy) => {
      const x0 = ox || 0, y0 = oy || 0;
      const r = h / 2, W = 2 * w1, cy = h / 2;
      const cap = (x, y, x0) => Math.hypot(x - Math.min(Math.max(x, x0 + r), x0 + w1 - r), y) - r;
      const smin = (a, b) => { const q = Math.max(k - Math.abs(a - b), 0) / k; return Math.min(a, b) - q * q * k / 4; };
      const f = (x, y) => smin(cap(x, y, 0), cap(x, y, w1));
      const half = (x) => { let lo = 0, hi = r + k; for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; if (f(x, m) < 0) lo = m; else hi = m; } return lo; };
      const xs = []; for (let x = r; x < W - r; x += 0.25) xs.push(x); xs.push(W - r);
      const t = xs.map(half);
      let d = 'M' + r3(x0 + r) + ' ' + y0;
      xs.forEach((x, i) => { d += 'L' + r3(x0 + x) + ' ' + r3(y0 + cy - t[i]); });
      d += 'A' + r + ' ' + r + ' 0 0 1 ' + r3(x0 + W - r) + ' ' + r3(y0 + h);
      for (let i = xs.length - 1; i >= 0; i--) d += 'L' + r3(x0 + xs[i]) + ' ' + r3(y0 + cy + t[i]);
      return d + 'A' + r + ' ' + r + ' 0 0 1 ' + r3(x0 + r) + ' ' + y0 + 'Z';
    };
    // A box on whole pixels for a button at x, y, and the fraction its shape sits in from it.
    const box = (x, y, w, h) => {
      const ix = Math.floor(x), iy = Math.floor(y), ox = r3(x - ix), oy = r3(y - iy);
      return { ox, oy, style: 'left:' + ix + 'px;top:' + iy + 'px;width:' + Math.ceil(w + ox) + 'px;height:' + Math.ceil(h + oy) + 'px' };
    };
    // Liquid Glass over the stage, fitted to the app on screen at 2x (rms 2.4 levels round the buttons):
    //  fill  = the backdrop saturated 1.7x and dimmed to 0.78, under 18.5% white;
    //  glow  = light added in from the top and the bottom, by points from the nearer one;
    //  rim   = light added in a 1 pt band inside the edge and more on its outer half point, by the angle
    //          of the edge from level, so it runs round the ends;
    //  edge  = a half-point line outside, darkest where the edge stands upright.
    const GLOW = [[0, 8], [0.5, 9], [1, 13], [1.5, 8], [2, 6], [2.5, 5], [3, 3.5], [4, 2.2], [5, 1.4], [6, 1.2], [7, 1], [8, 0.8], [10, 0.6], [12.25, 0.5]];
    const RIM = [[0, 4], [15, 15], [30, 10], [45, 9], [60, 7.5], [75, 2], [90, 0]];
    const RIM_OUTER = [[0, 1], [15, 2.5], [30, 5], [45, 3], [60, 1], [75, 0.5], [90, 0.5]];
    const EDGE = [[0, 250], [15, 236], [30, 228], [45, 214], [60, 200], [75, 145], [90, 105]];
    const glass = (shape, w, h, ox, oy) => {
      const id = 'tdg' + (++uid), p = 2, d = shape(0, 0), placed = shape(ox, oy), r = h / 2;
      const W = Math.ceil(w + ox) + 2 * p, H = Math.ceil(h + oy) + 2 * p;
      const svg = (blend, inner) => '<svg aria-hidden="true" viewBox="' + (-p) + ' ' + (-p) + ' ' + W + ' ' + H + '" width="' + W + '" height="' + H + '" style="position:absolute;left:' + (-p) + 'px;top:' + (-p) + 'px;overflow:visible;pointer-events:none;mix-blend-mode:' + blend + '"><g transform="translate(' + ox + ' ' + oy + ')">' + inner + '</g></svg>';
      const grey = (v) => 'rgb(' + v + ',' + v + ',' + v + ')';
      const byAngle = (list) => list.map(([a, v]) => [r * (1 - Math.cos(a * Math.PI / 180)), v]);
      // Down to the middle and back up, from points in from the nearer of the top and the bottom.
      const mirror = (list) => {
        const half = list.filter(([y]) => y < r - 1e-6), mid = list.reduce((a, [y, v]) => (y <= r + 1e-6 ? v : a), list[0][1]);
        return half.map(([y, v]) => [y / h, v]).concat([[0.5, mid]], half.slice().reverse().map(([y, v]) => [(h - y) / h, v]));
      };
      const grad = (gid, list) => '<linearGradient id="' + gid + '" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="' + h + '">'
        + mirror(list).map(([o, v]) => '<stop offset="' + Math.min(1, Math.max(0, o)).toFixed(4) + '" stop-color="' + grey(v) + '"/>').join('') + '</linearGradient>';
      const fill = 'saturate(1.7) brightness(0.78)';
      return '<div style="position:absolute;inset:0;-webkit-backdrop-filter:' + fill + ';backdrop-filter:' + fill + ';background:rgba(255,255,255,.185);clip-path:path(\'' + placed + '\')"></div>'
        + svg('plus-lighter', '<defs>' + grad(id + 'g', GLOW) + '</defs><path d="' + d + '" fill="url(#' + id + 'g)"/>')
        + svg('plus-lighter', '<defs><clipPath id="' + id + 'c"><path d="' + d + '"/></clipPath>' + grad(id + 'r', byAngle(RIM)) + '</defs><path d="' + d + '" fill="none" stroke="url(#' + id + 'r)" stroke-width="2" clip-path="url(#' + id + 'c)"/>')
        + svg('plus-lighter', '<defs><clipPath id="' + id + 'd"><path d="' + d + '"/></clipPath>' + grad(id + 'o', byAngle(RIM_OUTER)) + '</defs><path d="' + d + '" fill="none" stroke="url(#' + id + 'o)" stroke-width="1" clip-path="url(#' + id + 'd)"/>')
        + svg('multiply', '<defs><mask id="' + id + 'm" maskUnits="userSpaceOnUse" x="' + (-p) + '" y="' + (-p) + '" width="' + W + '" height="' + H + '"><rect x="' + (-p) + '" y="' + (-p) + '" width="' + W + '" height="' + H + '" fill="#fff"/><path d="' + d + '" fill="#000"/></mask>' + grad(id + 'e', byAngle(EDGE)) + '</defs><path d="' + d + '" fill="none" stroke="url(#' + id + 'e)" stroke-width="1" mask="url(#' + id + 'm)"/>');
    };
    // SF Symbols traced from 32x renders at the sizes the stage draws them: xmark 13 pt, the chevrons 12 pt.
    // Centered on (cx, cy) in the button's box; on whole pixels too, the fraction moved into the drawing.
    const symbol = (g, cx, cy) => {
      const x = cx - g.w / 2, y = cy - g.h / 2, ix = Math.floor(x), iy = Math.floor(y);
      return '<svg aria-hidden="true" viewBox="0 0 ' + (g.w + 1) + ' ' + (g.h + 1) + '" width="' + (g.w + 1) + '" height="' + (g.h + 1) + '" style="position:absolute;left:' + ix + 'px;top:' + iy + 'px;fill:#fff"><path transform="matrix(0.003125 0 0 -0.003125 ' + r3(x - ix) + ' ' + r3(13 + y - iy) + ')" d="' + g.d + '"/></svg>';
    };
    const measure = (text, font) => {
      const c = document.createElement('canvas').getContext('2d');
      c.font = font;
      return c.measureText(text).width;
    };
    const build = (host, o) => {
      const w = o.w, h = o.h;
      // The media fits the room under the 56 pt header, 20 pt in from the sides and 28 pt clear at the bottom.
      const roomW = w - 40, roomH = h - 56 - 28;
      let mw = roomW, mh = roomW / o.aspect;
      if (mh > roomH) { mh = roomH; mw = roomH * o.aspect; }
      const mx = (w - mw) / 2, my = 56 + (roomH - mh) / 2;
      // The buttons, each centered on the header's middle, 28 pt down.
      const close = { x: 12, w: 41.5, h: 24.5 }, nav = { x: 61.5, w: 38, h: 25.5 }, finder = { w: 117.5, h: 28 };
      finder.x = w - 12 - finder.w;
      const bClose = box(close.x, 28 - close.h / 2, close.w, close.h), bNav = box(nav.x, 28 - nav.h / 2, nav.w * 2, nav.h), bFinder = box(finder.x, 28 - finder.h / 2, finder.w, finder.h);
      const media = 'left:' + r3(mx) + 'px;top:' + r3(my) + 'px;width:' + r3(mw) + 'px;height:' + r3(mh) + 'px';
      const mid = 'tdmc' + (++uid);
      // Previous and Next work as in the app; the picker under the stage is what keyboards and VoiceOver use.
      // Each is its half of the glass, cut at the neck: its press lights only glass, never the stage round it.
      const navShape = (x) => pair(nav.w, nav.h, 6.6, -x, 0);
      const hit = (side, x) => '<button type="button" tabindex="-1" aria-hidden="true" class="td-hit td-hit-' + side + '" style="left:' + r3(bNav.ox + x) + 'px;top:' + bNav.oy + 'px;width:' + nav.w + 'px;height:' + nav.h + 'px;clip-path:path(\'' + navShape(x) + '\')"></button>';
      host.innerHTML = '<div class="td-stage" style="--w:' + w + 'px;--h:' + h + 'px">'
        + '<div class="td-shadow"></div>'
        + '<div class="td-clip" style="clip-path:path(\'' + contRect(w, h, 16) + '\')">'
        + '<div class="td-tones"></div>'
        + '<div class="td-veil"></div>'
        + '<div class="td-mshadow" style="' + media + '"></div>'
        + '<img class="td-media" alt="" draggable="false" loading="lazy" decoding="async" style="' + media + ';clip-path:path(\'' + contRect(mw, mh, 8) + '\')">'
        + '<svg class="td-line" aria-hidden="true" style="' + media + '" viewBox="0 0 ' + r3(mw) + ' ' + r3(mh) + '"><defs><clipPath id="' + mid + '"><path d="' + contRect(mw, mh, 8) + '"/></clipPath></defs><path d="' + contRect(mw, mh, 8) + '" fill="none" stroke="rgba(255,255,255,.12)" stroke-width="1" clip-path="url(#' + mid + ')"/></svg>'
        + '<div class="td-header" aria-hidden="true">'
        + '<div class="td-btn" style="' + bClose.style + '">' + glass((x, y) => capsule(close.w, close.h, x, y), close.w, close.h, bClose.ox, bClose.oy)
        + symbol(GLYPHS.xmark, bClose.ox + 20.6, bClose.oy + 12.43) + '</div>'
        + '<div class="td-btn" style="' + bNav.style + '">' + glass((x, y) => pair(nav.w, nav.h, 6.6, x, y), nav.w * 2, nav.h, bNav.ox, bNav.oy)
        + symbol(GLYPHS.chl, bNav.ox + 18.625, bNav.oy + 13) + symbol(GLYPHS.chr, bNav.ox + 57.125, bNav.oy + 13)
        + hit('prev', 0) + hit('next', nav.w) + '</div>'
        + '<div class="td-title"><div class="td-t1"></div><div class="td-t2"></div></div>'
        + '<div class="td-btn td-finder" style="' + bFinder.style + '">' + glass((x, y) => capsule(finder.w, finder.h, x, y), finder.w, finder.h, bFinder.ox, bFinder.oy) + '<span class="td-label">Show in Finder</span></div>'
        + '</div>'
        + '<svg class="td-line" aria-hidden="true" viewBox="0 0 ' + w + ' ' + h + '"><path d="' + contRect(w, h, 16) + '" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="1"/></svg>'
        + '</div></div>';
      const el = host.firstElementChild;
      el.tdWidth = w;
      return el;
    };
    // Puts a capture on a built stage: its picture, and its title and date as the header lays them out.
    const show = (el, c) => {
      const w = el.tdWidth, close = 41.5, pairW = 76, finder = 117.5;
      // The header's row as ViewThatFits picks it: Show in Finder while the title fits between the sides at its
      // own width, the title truncating after that; the title takes its width first, the sides share the rest.
      const stack = '-apple-system,BlinkMacSystemFont,"SF Pro Text","Helvetica Neue",Helvetica,Arial,sans-serif';
      const ideal = Math.ceil(Math.max(measure(c.title, '700 13px ' + stack), measure(c.date, '400 11px ' + stack)));
      const leftSide = close + 8 + pairW, avail = w - 24;
      const showsFinder = leftSide + 8 + ideal + 8 + finder <= avail;
      const rightSide = showsFinder ? finder : 0;
      const titleW = Math.max(0, Math.min(ideal, avail - 16 - leftSide - rightSide));
      const rest = avail - 16 - titleW;
      const leftW = Math.min(Math.max(leftSide, rest / 2), rest - rightSide);
      const title = el.querySelector('.td-title');
      title.style.left = r3(12 + leftW + 8) + 'px';
      title.style.width = r3(titleW) + 'px';
      title.firstChild.textContent = c.title;
      title.lastChild.textContent = c.date;
      el.querySelector('.td-finder').style.display = showsFinder ? '' : 'none';
      const media = el.querySelector('.td-media');
      media.alt = c.alt;
      media.src = c.media;
    };
    return { build, show };
  };

  // The light toolbar's Liquid Glass round button, 36 pt, as measured on screen at 2x: a fill a little lighter
  // than the toolbar with a glow in from the top, a white rim strongest at the top and bottom, and a dark
  // half-point line outside, darkest at the sides.
  const lightGlass = (id, S) => {
    const fill = [[0, 247], [1, 246], [1.5, 245], [2, 244], [2.5, 243], [3.5, 242], [4, 241], [5.5, 240], [6, 239], [31, 239], [33.5, 241], [34.5, 242], [36, 243]];
    const rim = [[0, 1], [1, 1], [5.3, 0.5], [12, 0.1], [18, 0], [24, 0.05], [30.7, 0.25], [35, 0.7], [36, 0.7]];
    const edge = [[-0.5, 0.076], [5.3, 0.07], [12, 0.14], [18, 0.254], [24, 0.16], [30.7, 0.1], [36.5, 0.08]];
    const alpha = (list, c, y0, h) => list.map(([y, a]) => '<stop offset="' + ((y - y0) / h).toFixed(4) + '" stop-color="' + c + '" stop-opacity="' + a + '"/>').join('');
    return '<svg viewBox="-1 -1 38 38" width="' + (38 * S) + '" height="' + (38 * S) + '" style="position:absolute;left:' + (-S) + 'px;top:' + (-S) + 'px;overflow:visible"><defs>'
      + '<linearGradient id="' + id + 'f" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="36">' + fill.map(([y, v]) => '<stop offset="' + (y / 36).toFixed(4) + '" stop-color="rgb(' + v + ',' + v + ',' + (v + 4) + ')"/>').join('') + '</linearGradient>'
      + '<radialGradient id="' + id + 'h" gradientUnits="userSpaceOnUse" cx="18" cy="27" r="14"><stop offset="0" stop-color="#fff" stop-opacity=".19"/><stop offset=".6" stop-color="#fff" stop-opacity=".12"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>'
      + '<linearGradient id="' + id + 'r" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="36">' + alpha(rim, '#fff', 0, 36) + '</linearGradient>'
      + '<linearGradient id="' + id + 'e" gradientUnits="userSpaceOnUse" x1="0" y1="-0.5" x2="0" y2="36.5">' + alpha(edge, '#000', -0.5, 37) + '</linearGradient>'
      + '</defs><circle cx="18" cy="18" r="18" fill="url(#' + id + 'f)"/><circle cx="18" cy="18" r="18" fill="url(#' + id + 'h)"/>'
      + '<circle cx="18" cy="18" r="17.5" fill="none" stroke="url(#' + id + 'r)" stroke-width="1"/>'
      + '<circle cx="18" cy="18" r="18.25" fill="none" stroke="url(#' + id + 'e)" stroke-width="0.5"/></svg>';
  };

  // A line-for-line port of CheckNowButton.swift's OrbitMotion, OrbitShape and CheckShape. Units are the
  // symbol's points; angles are degrees clockwise from three o'clock.
  const makeOrbit = () => {
    const PI = Math.PI, N = 5;
    const ease = (() => {
      const x1 = 0.4, y1 = 0, x2 = 0.2, y2 = 1;
      const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
      const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
      const X = (t) => ((ax * t + bx) * t + cx) * t, Y = (t) => ((ay * t + by) * t + cy) * t, dX = (t) => (3 * ax * t + 2 * bx) * t + cx;
      return (x) => {
        if (!(x > 0)) return 0;
        if (x >= 1) return 1;
        let t = x;
        for (let i = 0; i < 8; i++) {
          const e = X(t) - x;
          if (Math.abs(e) < 1e-9) return Y(t);
          const d = dX(t);
          if (Math.abs(d) < 1e-7) break;
          t -= e / d;
        }
        let lo = 0, hi = 1;
        t = x;
        for (let i = 0; i < 50; i++) { const v = X(t); if (Math.abs(v - x) < 1e-9) break; if (v < x) lo = t; else hi = t; t = (lo + hi) / 2; }
        return Y(t);
      };
    })();
    const spring = (response, zeta) => {
      const w0 = 2 * PI / response, wd = w0 * Math.sqrt(1 - zeta * zeta);
      return (target, v0, t) => {
        const y0 = -target, c2 = (v0 + zeta * w0 * y0) / wd;
        return target + Math.exp(-zeta * w0 * t) * (y0 * Math.cos(wd * t) + c2 * Math.sin(wd * t));
      };
    };
    const hermite = (p0, m0, p1, m1, s) => { const s2 = s * s, s3 = s2 * s; return (2 * s3 - 3 * s2 + 1) * p0 + (s3 - 2 * s2 + s) * m0 + (3 * s2 - 2 * s3) * p1 + (s3 - s2) * m1; };
    const smoothstep = (a, b, x) => { const s = Math.min(1, Math.max(0, (x - a) / (b - a))); return s * s * (3 - 2 * s); };
    const remainder = (x, y) => x - y * Math.round(x / y);

    const REST = 291.1, FRAME = { w: 17.4375, h: 20.625 }, CENTER = { x: 8.7144, y: 11.9013 }, RADIUS = 6.5483, WIDTH = 1.3933;
    const TIP = { x: 11.900, y: 5.688 }, ARMS = [{ x: 8.385, y: 2.162 }, { x: 8.392, y: 9.207 }], ARM_W = 1.363;
    const CPTS = [{ x: 2.4592, y: 11.0215 }, { x: 6.9873, y: 16.6716 }, { x: 14.9993, y: 4.1086 }], CW = 1.667;
    const CLEN = [0, 1].map((i) => Math.hypot(CPTS[i + 1].x - CPTS[i].x, CPTS[i + 1].y - CPTS[i].y)), CTOTAL = CLEN[0] + CLEN[1];
    const EX_TOP = { x: 8.7144, y: 3.377 };
    // ExclamationShape: the bar's round top and its width there, its bottom and width there, where the dot rests
    // and how wide it is; how far the dot falls, and how much of that is along the bar.
    const EX = { top: EX_TOP, topWidth: 1.77, bottom: 12.771, bottomWidth: 1.6, rest: 16.9125, dotWidth: 2.38 };
    EX.drop = EX.rest - EX.top.y;
    EX.barShare = (EX.bottom - EX.top.y) / EX.drop;
    const exShape = (o) => Object.assign({ bar: [0, 1], fall: 1, dot: EX.dotWidth, trail: 0, squash: 0 }, o || {});

    const LAP = 1, SWING = 0.8, TOP_SPEED = 360 / LAP * (1 + SWING), STAGGER = 0.07, D = [2.5, 2.28, 2.06, 1.84, 1.62];
    const STREAK = 1 / 55, FLING = 0.4, WIND_BACK = 18, WIND_PEAK = 0.085, ROLL_UP = 0.3, LAUNCH = 0.1, BLEND = 10;
    const BRAKE = spring(0.5, 0.75), BRAKE_D = 2 * 0.75 / (2 * PI / 0.5), BRAKE_T = 0.7;
    const POP = spring(0.3, 0.6), POP_LEAD = 0.1, POP_T = 0.55;
    const VANISH = 0.3, DRAW = 0.55, DRAW_DELAY = 0.08, GT0 = 0.3, GT1 = 0.75, GATHER_SPEED = 960, TINT_T = 0.25;
    const MARK_DELAY = 0.12, CHECK_DRAW = 0.42, LEAVE = 0.24, DROP_FALL = 0.34, LANDING = 0.3, STEP = 1 / 240;

    const angle = (time) => { const laps = time / LAP; return REST + 360 * (laps - SWING * Math.sin(2 * PI * laps) / (2 * PI)); };
    const speed = (time) => 360 / LAP * (1 - SWING * Math.cos(2 * PI * time / LAP));
    const PAINT = (() => {
      let low = 0, high = LAP;
      for (let i = 0; i < 40; i++) { const m = (low + high) / 2; if (angle(m) < 360) low = m; else high = m; }
      return LAP - low - (N - 1) * STAGGER;
    })();

    const bead = (head, sweep, width, swell) => ({ head: head || 0, sweep: sweep || 0, width: width || 0, swell: swell || 0 });
    const fig = (beads, arrowhead, presence) => ({ beads, arrowhead, presence });
    const zero = () => fig(Array.from({ length: N }, () => bead()), 0, 0);
    const clone = (f) => fig(f.beads.map((b) => ({ head: b.head, sweep: b.sweep, width: b.width, swell: b.swell })), f.arrowhead, f.presence);
    const arrow = (length, presence) => {
      const l = length == null ? REST : length, p = presence == null ? 1 : presence;
      return fig(Array.from({ length: N }, (_, i) => bead(l * (N - i) / N, l / N, WIDTH)), 0.6 + 0.4 * p, p);
    };
    const add = (a, b) => fig(a.beads.map((x, i) => bead(x.head + b.beads[i].head, x.sweep + b.beads[i].sweep, x.width + b.beads[i].width, x.swell + b.beads[i].swell)), a.arrowhead + b.arrowhead, a.presence + b.presence);
    const scale = (a, k) => fig(a.beads.map((x) => bead(x.head * k, x.sweep * k, x.width * k, x.swell * k)), a.arrowhead * k, a.presence * k);
    const sub = (a, b) => add(a, scale(b, -1));
    const isZero = (f) => f.arrowhead === 0 && f.presence === 0 && f.beads.every((b) => b.head === 0 && b.sweep === 0 && b.width === 0 && b.swell === 0);

    const beadAt = (i, head, spd) => {
      const diameter = D[i], sweep = spd * STREAK, length = diameter + sweep * PI / 180 * RADIUS;
      return bead(head, sweep, diameter * Math.sqrt(diameter / length), FLING * spd / TOP_SPEED);
    };
    const beadClock = (i, time) => beadAt(i, angle(time), speed(time));
    const rolledUp = (progress) => {
      const a = arrow(), pinch = ease(Math.min(1, progress / 0.6)), f = clone(a);
      a.beads.forEach((from, i) => {
        const time = LAUNCH - i * STAGGER, to = beadClock(i, time);
        f.beads[i] = bead(hermite(from.head, 0, to.head, speed(time) * ROLL_UP, progress), from.sweep + (to.sweep - from.sweep) * pinch,
          from.width + (to.width - from.width) * pinch, to.swell * pinch);
      });
      f.arrowhead = 1 - smoothstep(0, 0.5, progress);
      return f;
    };
    const painted = (f0, stop, progress, arrowhead) => {
      const joined = ease(progress), tail = angle(stop) - REST, length = f0.beads[0].head - tail, f = clone(f0);
      f0.beads.forEach((b, i) => {
        const head = tail + length * (N - i) / N;
        f.beads[i] = bead(b.head + (head - b.head) * joined, b.sweep + (length / N - b.sweep) * joined, b.width + (WIDTH - b.width) * joined, b.swell * (1 - joined));
      });
      f.arrowhead = arrowhead;
      return f;
    };
    const gathering = (lead, spd, to) => {
      spd = Math.max(spd, 1);
      let distance = (to - lead.head) % 360;
      if (distance < 0) distance += 360;
      if (3 * distance / spd < GT0) distance += 360;
      return [distance, Math.min(3 * distance / spd, Math.min(Math.max(2 * distance / GATHER_SPEED, GT0), GT1))];
    };
    const polar = (p) => { const a = Math.atan2(p.y - CENTER.y, p.x - CENTER.x) * 180 / PI; return { angle: a < 0 ? a + 360 : a, radius: Math.hypot(p.x - CENTER.x, p.y - CENTER.y) }; };
    const segPoint = (i, f) => ({ x: CPTS[i].x + (CPTS[i + 1].x - CPTS[i].x) * f, y: CPTS[i].y + (CPTS[i + 1].y - CPTS[i].y) * f });
    const checkPoint = (fraction) => {
      let d = fraction * CTOTAL;
      for (let i = 0; i < 2; i++) { if (d <= CLEN[i] || i === 1) return segPoint(i, d / CLEN[i]); d -= CLEN[i]; }
      return CPTS[0];
    };

    class Motion {
      constructor() {
        this.stage = { k: 'still' };
        this.mark = null;
        this.start = 0;
        this.clock = 0;
        this.rollsUp = false;
        this.windUp = null;
        this.offset = zero();
        this.drift = zero();
        this.blendStart = 0;
      }
      get showsSymbol() { return this.stage.k === 'still' && !this.mark; }
      settlesAt() {
        const s = this.stage, ends = [];
        switch (s.k) {
          case 'whirling': return null;
          case 'landing': ends.push(s.braking + Math.max(BRAKE_T, POP_T - POP_LEAD)); break;
          case 'vanishing': ends.push(this.start + VANISH); break;
          case 'gathering': ends.push(this.start + s.duration); break;
          case 'drawing': ends.push(this.start + DRAW); break;
          default: break;
        }
        const m = this.mark;
        if (m && !m.isSettled) ends.push(m.leaves != null ? m.leaves + LEAVE : m.appears + m.appearing);
        if (!isZero(this.offset) || !isZero(this.drift)) ends.push(this.blendStart + 1);
        return ends.length ? Math.max.apply(null, ends) : null;
      }
      leave(t) { const m = this.mark; if (m && m.leaves == null) { m.leaves = t; m.isSettled = false; } }
      go(goal, t) {
        const s = this.stage;
        if (goal === 'checking') {
          this.leave(t);
          switch (s.k) {
            case 'whirling': break;
            case 'landing':
              if (this.clockAt(t) > s.stop - PAINT / 2) this.change({ k: 'whirling' }, t, { clock: LAUNCH - ROLL_UP, rollsUp: true });
              else this.change({ k: 'whirling' }, t, { clock: this.clockAt(t), rollsUp: this.rollsUp, windUp: this.windUp });
              break;
            case 'still':
              if (!this.mark) this.change({ k: 'whirling' }, t, { clock: LAUNCH - ROLL_UP, rollsUp: true, windUp: t });
              else this.change({ k: 'whirling' }, t, { clock: LAUNCH - ROLL_UP, rollsUp: true });
              break;
            case 'drawing': this.change({ k: 'whirling' }, t, { clock: LAUNCH - ROLL_UP, rollsUp: true }); break;
            default: this.change({ k: 'whirling' }, t);
          }
        } else if (goal === 'rest') {
          switch (s.k) {
            case 'whirling': this.land(t); break;
            case 'vanishing': case 'gathering': case 'gone': this.change({ k: 'drawing' }, t, { startingAt: t + (this.mark ? DRAW_DELAY : 0) }); break;
            default: break;
          }
          this.leave(t);
        } else {
          const result = goal.result, appearing = result === 'done' ? CHECK_DRAW : DROP_FALL + LANDING;
          switch (s.k) {
            case 'whirling': {
              const f = this.figure(t), v = this.velocity(t);
              const penDown = polar(result === 'done' ? checkPoint(0) : EX_TOP);
              const g = gathering(f.beads[0], v.beads[0].head, penDown.angle);
              this.stage = { k: 'gathering', from: f, velocity: v, distance: g[0], duration: g[1], swell: penDown.radius - RADIUS, pulse: this.pulse(t) };
              this.start = t;
              this.offset = zero();
              this.drift = zero();
              this.windUp = null;
              this.rollsUp = false;
              this.mark = { result, appears: t + g[1], appearing, leaves: null, isSettled: false, pen: D[0] };
              return;
            }
            case 'vanishing': case 'gathering': case 'gone': break;
            default: this.change({ k: 'vanishing', from: this.figure(t), velocity: this.velocity(t) }, t);
          }
          if (!this.mark || this.mark.result !== result || this.mark.leaves != null) {
            this.mark = { result, appears: t + MARK_DELAY, appearing, leaves: null, isSettled: false, pen: null };
          }
        }
      }
      settle() {
        switch (this.stage.k) {
          case 'landing': case 'drawing': this.stage = { k: 'still' }; break;
          case 'vanishing': case 'gathering': this.stage = { k: 'gone' }; break;
          default: break;
        }
        if (this.mark) { if (this.mark.leaves != null) this.mark = null; else this.mark.isSettled = true; }
        if (this.stage.k !== 'whirling') {
          this.offset = zero();
          this.drift = zero();
          this.windUp = null;
          this.rollsUp = false;
        }
      }
      change(stage, t, o) {
        o = o || {};
        const f = this.figure(t), v = this.velocity(t);
        const wasStill = this.stage.k === 'still' && isZero(this.offset) && isZero(this.drift);
        this.stage = stage;
        this.start = o.startingAt != null ? o.startingAt : t;
        this.clock = o.clock || 0;
        this.rollsUp = !!o.rollsUp;
        this.windUp = o.windUp != null ? o.windUp : null;
        const base = this.base(t);
        this.offset = sub(f, base);
        this.drift = wasStill ? zero() : sub(v, scale(sub(this.base(t + STEP), base), 1 / STEP));
        const hidden = f.presence < 0.01;
        this.offset.beads.forEach((b, i) => {
          b.head = hidden ? 0 : remainder(b.head, 360);
          if (hidden) this.drift.beads[i].head = 0;
        });
        if (hidden) { this.offset.arrowhead = 0; this.drift.arrowhead = 0; }
        this.blendStart = t;
      }
      land(t) {
        const now = this.clockAt(t);
        const stop = Math.max(1, Math.ceil((now + PAINT) / LAP)) * LAP;
        this.stage = { k: 'landing', stop, braking: t + stop - BRAKE_D - now };
      }
      figure(t) {
        let f = this.base(t);
        const elapsed = Math.max(0, t - this.blendStart);
        if ((!isZero(this.offset) || !isZero(this.drift)) && elapsed < 2) {
          f = add(f, scale(add(this.offset, scale(add(this.drift, scale(this.offset, BLEND)), elapsed)), Math.exp(-BLEND * elapsed)));
        }
        f.beads.forEach((b) => { b.sweep = Math.min(Math.max(b.sweep, 0), 340); b.width = Math.max(b.width, 0); });
        f.arrowhead = Math.max(f.arrowhead, 0);
        f.presence = Math.min(Math.max(f.presence, 0), 1);
        return f;
      }
      velocity(t) { return scale(sub(this.figure(t), this.figure(t - STEP)), 1 / STEP); }
      handoff(t) {
        const m = this.mark;
        if (!m || m.pen == null || m.isSettled) return 0;
        if (m.leaves == null) return smoothstep(m.appears - TINT_T, m.appears, t);
        if (!(m.leaves < m.appears)) return 0;
        return smoothstep(m.appears - TINT_T, m.appears, m.leaves) * (1 - ease(Math.min(1, (t - m.leaves) / LEAVE)));
      }
      tint(t) { return this.mark && this.mark.result === 'done' ? this.handoff(t) : 0; }
      pen(m, t) {
        const w = m.pen;
        if (w == null || m.isSettled || !(t >= m.appears) || !(t < m.appears + m.appearing) || !(m.leaves == null || m.leaves >= m.appears)) return 0;
        return w + (CW - w) * ease((t - m.appears) / m.appearing);
      }
      fade(m, t) {
        if (m.pen == null || m.leaves == null || !(m.leaves < m.appears + m.appearing)) return 1;
        return 1 - ease(Math.min(1, Math.max(0, t - m.leaves) / LEAVE));
      }
      base(t) {
        const s = this.stage, elapsed = Math.max(0, t - this.start);
        switch (s.k) {
          case 'still': return arrow();
          case 'whirling': return this.whirl(t);
          case 'landing': {
            const progress = (this.clockAt(t) - s.stop + PAINT) / PAINT;
            if (!(progress > 0)) return this.whirl(t);
            return painted(this.whirl(t), s.stop, Math.min(1, progress), POP(1, 0, Math.max(0, t - s.braking + POP_LEAD)));
          }
          case 'vanishing': {
            const progress = Math.min(1, elapsed / VANISH), from = s.from, v = s.velocity;
            const lead = from.beads[0].head, leadSpeed = Math.max(0, v.beads[0].head) * VANISH, end = lead + leadSpeed / 2;
            const f = clone(from);
            from.beads.forEach((b, i) => {
              f.beads[i].head = i === 0 ? lead + leadSpeed * (progress - progress * progress / 2) : hermite(b.head, Math.max(0, v.beads[i].head) * VANISH, end, 0, progress);
              f.beads[i].sweep = b.sweep * (1 - progress);
              f.beads[i].swell = b.swell * (1 - progress);
              f.beads[i].width = b.width * (1 - 0.4 * smoothstep(0.3, 1, progress));
            });
            f.arrowhead = from.arrowhead * (1 - smoothstep(0, 0.6, progress));
            f.presence = from.presence * (1 - smoothstep(0.45, 1, progress));
            return f;
          }
          case 'gathering': {
            const progress = elapsed / s.duration;
            if (!(progress < 1)) return arrow(0, 0);
            const end = s.from.beads[0].head + s.distance, p = progress, f = clone(s.from);
            s.from.beads.forEach((b, i) => {
              const distance = end - b.head, setOff = Math.min(Math.max(0, s.velocity.beads[i].head) * s.duration, 3 * distance);
              const spd = (setOff * (3 * p * p - 4 * p + 1) + distance * (6 * p - 6 * p * p)) / s.duration;
              f.beads[i] = beadAt(i, hermite(b.head, setOff, end, 0, p), spd);
              f.beads[i].swell += s.swell * smoothstep(0.5, 1, p);
            });
            return f;
          }
          case 'gone': return arrow(0, 0);
          case 'drawing': {
            const progress = Math.min(1, elapsed / DRAW);
            return arrow(REST * ease(progress), ease(Math.min(1, progress / 0.4)));
          }
          default: return arrow();
        }
      }
      whirl(t) {
        const clock = this.clockAt(t);
        const f = this.rollsUp && clock < LAUNCH ? rolledUp(1 + (clock - LAUNCH) / ROLL_UP)
          : fig(Array.from({ length: N }, (_, i) => beadClock(i, clock - i * STAGGER)), 0, 1);
        const w = this.wind(t);
        f.beads.forEach((b) => { b.head += w; });
        return f;
      }
      clockAt(t) {
        const s = this.stage;
        if (s.k === 'whirling') return this.clock + Math.max(0, t - this.start);
        if (s.k === 'landing') {
          if (!(t > s.braking)) return this.clock + Math.max(0, t - this.start);
          return s.stop - BRAKE_D + BRAKE(BRAKE_D, 1, t - s.braking);
        }
        return 0;
      }
      wind(t) {
        if (this.windUp == null) return 0;
        const x = Math.max(0, t - this.windUp) / WIND_PEAK;
        return x > 20 ? 0 : -WIND_BACK * x * Math.exp(1 - x);
      }
      pulse(t) {
        const s = this.stage;
        if (s.k === 'whirling' || s.k === 'landing') { const ph = Math.sin(PI * this.clockAt(t) / LAP); return 1 - 0.6 * ph * ph; }
        if (s.k === 'gathering') return s.pulse;
        return 1;
      }
      drawn(m, t) {
        if (m.isSettled) return [0, 1];
        const end = ease(Math.min(1, Math.max(0, t - m.appears) / m.appearing));
        if (m.pen != null && m.leaves != null && m.leaves < m.appears + m.appearing) return m.leaves < m.appears ? [0, 0] : [0, end];
        const start = m.leaves != null ? ease(Math.min(1, Math.max(0, t - m.leaves) / LEAVE)) : 0;
        return [Math.min(start, end), end];
      }
      // The exclamation mark at t, and how strongly it shows. Its dot sets off from the top of the bar and falls
      // faster and faster, drawing the bar as it goes and stretched as fast as it goes, then off the bar's end
      // to where it rests, squashing as it lands. It leaves from the top, the dot shrinking away last; one
      // still landing fades instead.
      warning(m, t) {
        if (m.isSettled) return { shape: exShape(), opacity: 1 };
        const elapsed = t - m.appears;
        if (!(elapsed > 0) || !(m.leaves == null || m.leaves >= m.appears)) return { shape: exShape(), opacity: 0 };
        const progress = Math.min(1, elapsed / DROP_FALL), fall = progress * progress;
        const pen = m.pen != null ? m.pen : EX.dotWidth;
        const shape = exShape({ bar: [0, Math.min(1, fall / EX.barShare)], fall, dot: pen + (EX.dotWidth - pen) * progress });
        if (progress < 1) shape.trail = 2 * progress / DROP_FALL * EX.drop * STREAK;
        else { const landed = elapsed - DROP_FALL; shape.squash = 0.3 * Math.sin(2 * PI * 5 * landed) * Math.exp(-9 * landed); }
        let opacity = m.pen == null ? Math.min(1, elapsed / 0.06) : 1;
        if (m.leaves != null) {
          const gone = ease(Math.min(1, Math.max(0, t - m.leaves) / LEAVE));
          if (m.leaves < m.appears + m.appearing) opacity *= 1 - gone;
          else { shape.bar = [Math.min(1, gone / 0.7), 1]; shape.dot *= 1 - smoothstep(0.4, 1, gone); }
        }
        return { shape, opacity };
      }
    }

    // Path.addStroke(from:to:width:endWidth:), wound the same way, so overlaps fill once.
    const addStroke = (p, a, b, width, endWidth) => {
      const half = width / 2, eh = (endWidth != null ? endWidth : width) / 2;
      const len = Math.hypot(b.x - a.x, b.y - a.y);
      const lean = len > Math.abs(half - eh) ? Math.asin((half - eh) / len) : 0;
      const out = Math.atan2(b.y - a.y, b.x - a.x) + lean - PI / 2;
      p.moveTo(b.x + eh * Math.cos(out), b.y + eh * Math.sin(out));
      p.arc(a.x, a.y, half, out, out - (PI + 2 * lean), true);
      p.arc(b.x, b.y, eh, out + PI - 2 * lean, out, true);
      p.closePath();
    };
    const addBead = (p, b) => {
      const r = RADIUS + b.swell, half = b.width / 2, head = b.head * PI / 180, tail = (b.head - b.sweep) * PI / 180, c = CENTER;
      p.moveTo(c.x + (r + half) * Math.cos(head), c.y + (r + half) * Math.sin(head));
      p.arc(c.x, c.y, r + half, head, tail, true);
      p.arc(c.x + r * Math.cos(tail), c.y + r * Math.sin(tail), half, tail, tail - PI, true);
      p.arc(c.x, c.y, Math.max(0, r - half), tail, head, false);
      p.arc(c.x + r * Math.cos(head), c.y + r * Math.sin(head), half, head + PI, head, true);
      p.closePath();
    };
    const orbitPath = (f) => {
      const p = new Path2D();
      let arc = null;
      for (const b of f.beads) {
        if (!(b.width > 0.01)) continue;
        if (arc && Math.abs(b.width - arc.width) < 0.01 && Math.abs(b.swell - arc.swell) < 0.01 && b.head >= arc.head - arc.sweep - 0.01) {
          arc.sweep = Math.max(arc.sweep, arc.head - b.head + b.sweep);
        } else {
          if (arc) addBead(p, arc);
          arc = { head: b.head, sweep: b.sweep, width: b.width, swell: b.swell };
        }
      }
      if (arc) addBead(p, arc);
      if (f.arrowhead > 0.01) {
        const s = f.arrowhead, th = (f.beads[0].head - REST) * PI / 180, cs = Math.cos(th), sn = Math.sin(th);
        const place = (q) => {
          const x = TIP.x + s * (q.x - TIP.x) - CENTER.x, y = TIP.y + s * (q.y - TIP.y) - CENTER.y;
          return { x: CENTER.x + x * cs - y * sn, y: CENTER.y + x * sn + y * cs };
        };
        const tip = place(TIP);
        for (const a of ARMS) addStroke(p, place(a), tip, ARM_W * s);
      }
      return p;
    };
    const checkPath = (drawn, pen) => {
      const p = new Path2D();
      let start = 0;
      CLEN.forEach((len, i) => {
        const from = Math.max(drawn[0] * CTOTAL - start, 0) / len, to = Math.min(drawn[1] * CTOTAL - start, len) / len;
        if (to >= from && to > 0 && from < 1) addStroke(p, segPoint(i, from), segPoint(i, to), CW);
        start += len;
      });
      if (pen > CW) { const tip = checkPoint(drawn[1]); addStroke(p, tip, tip, pen); }
      return p;
    };
    // ExclamationShape.path: the bar, narrowing a little to its bottom, drawn over `bar` of its length, and the
    // dot `fall` of the way down, trailing up behind itself and squashed onto its bottom.
    const exPath = (s) => {
      const p = new Path2D(), length = EX.bottom - EX.top.y;
      const at = (d) => ({ x: EX.top.x, y: EX.top.y + d });
      const width = (f) => EX.topWidth + (EX.bottomWidth - EX.topWidth) * f;
      if (s.bar[1] > s.bar[0]) {
        const narrow = s.bar[0] > 0 ? Math.min(1, (s.bar[1] - s.bar[0]) * length / EX.bottomWidth) : 1;
        addStroke(p, at(s.bar[0] * length), at(s.bar[1] * length), width(s.bar[0]) * narrow, width(s.bar[1]) * narrow);
      }
      if (s.dot > 0.01) {
        const head = at(EX.drop * s.fall), across = s.dot * Math.sqrt(s.dot / (s.dot + s.trail));
        const drop = new Path2D();
        addStroke(drop, { x: head.x, y: head.y - s.trail }, head, across);
        const bx = head.x, by = head.y + across / 2, sx = 1 + 0.8 * s.squash, sy = 1 - s.squash;
        p.addPath(drop, new DOMMatrix([sx, 0, 0, sy, bx - sx * bx, by - sy * by]));
      }
      return p;
    };

    // The Drawing view's layers: the beads in the foreground color, then the accent color over them as they
    // gather, then the check mark. With Reduce Motion the arrow stays upright and pulses, and the mark fades.
    const MARGIN = 3;
    const draw = (ctx, m, t, o) => {
      const fill = (path, color, opacity) => {
        if (!(opacity > 0)) return;
        ctx.globalAlpha = Math.min(1, opacity);
        ctx.fillStyle = color;
        ctx.fill(path, 'nonzero');
      };
      const reduce = !!o.reduceMotion;
      if (m.showsSymbol) {
        fill(orbitPath(arrow()), o.foreground, 1);
      } else {
        const f = m.figure(t);
        const opacity = reduce ? f.presence * m.pulse(t) * Math.min(1, 2 - 2 * m.handoff(t)) : f.presence * Math.min(1, 2 - 2 * m.tint(t));
        fill(orbitPath(reduce ? arrow(REST, f.presence) : f), o.foreground, opacity);
      }
      const tint = reduce ? 0 : m.tint(t);
      const f = tint > 0 ? m.figure(t) : zero();
      if (f.presence > 0) {
        fill(orbitPath(f), o.accent, f.presence * tint);
      } else if (m.mark && m.mark.result === 'done') {
        const mk = m.mark, d = m.drawn(mk, t), pen = reduce ? 0 : m.pen(mk, t);
        if (d[1] > d[0] || pen > 0) {
          const opacity = (reduce ? d[1] - d[0] : Math.min(1, mk.pen == null ? d[1] / 0.08 : 1, (1 - d[0]) / 0.08)) * m.fade(mk, t);
          fill(checkPath(reduce ? [0, 1] : d, pen), o.accent, opacity);
        }
      }
      // The exclamation mark, in the foreground color.
      if (m.mark && m.mark.result === 'failed') {
        const mk = m.mark, d = m.drawn(mk, t);
        const shown = reduce ? { shape: exShape(), opacity: (d[1] - d[0]) * m.fade(mk, t) } : m.warning(mk, t);
        if (shown.opacity > 0) fill(exPath(shown.shape), o.foreground, shown.opacity);
      }
      ctx.globalAlpha = 1;
    };
    return { Motion, draw, FRAME, MARGIN };
  };

  /* Design: the switch, pressed into Liquid Glass ------------------------------------------------
     macOS 26's switch as it was filmed off screen at 2x, frame by frame (54 × 24 pt there; 7/6 of
     that here, the knob 38 × 24 in a 64 × 28 track). A press turns the knob into a clear lens 1.63
     times its size over 180 ms while its white fades out, and dims the track a tenth. Through the
     lens the track and the card show smaller, drawn in from further out near the rim, inside a dark
     1 pt edge (darkest at the sides) with a cyan and amber fringe. Dragging moves the lens, and past
     the middle the track takes the other color. On release the knob springs across (response
     0.46 s, damping 0.78) as the lens springs back (0.5 s, 0.9), its white returns over 200 ms and
     the track settles over 170 ms. A keyboard press only springs it across (0.41 s, 0.66), as the
     app's does. A canvas over the knob draws the lens; the knob's soft shadow gives way to one
     below the lens. With Reduce Motion the knob just slides. */
  const makeGlassSwitch = (button, initial, onChange) => {
    const track = $(".td-sw", button);
    const knob = $("i", track);
    const canvas = document.createElement("canvas");
    canvas.className = "td-lens";
    canvas.setAttribute("aria-hidden", "true");
    track.append(canvas);
    const ctx = canvas.getContext("2d");
    // In the track's CSS pixels (site.css): the knob's centre at off, its travel and half size, and
    // the canvas's box, with room for the lens at either end.
    const KX = 21, KY = 14, TRAVEL = 22, HW = 19, HH = 12, GROW = 0.63, BODY = 4.5;
    const BOX = { x: -14, y: -8, w: 92, h: 44 };
    const OFF = [229, 229, 229], ON = [48, 107, 33];
    const now = () => performance.now();
    const smooth = (f) => f * f * (3 - 2 * f);
    const grow = (f) => 0.5 * f + 0.5 * smooth(f);
    const fade = (f) => 1 - Math.pow(1 - f, 1.3);
    const settleOut = (f) => 1 - (1 - f) * (1 - f);

    // Each value runs one curve at a time: a tween, or a spring that starts from its velocity.
    const value = (v) => ({ v, a: null });
    const at = (c, t) => {
      const a = c.a;
      if (!a) return c.v;
      if (t <= a.t0) return a.from;
      if (!a.spring) return a.from + (a.to - a.from) * a.ease(Math.min(1, (t - a.t0) / a.dur));
      const s = (t - a.t0) / 1000;
      return a.to + Math.exp(-a.k * s) * (a.y0 * Math.cos(a.wd * s) + a.c2 * Math.sin(a.wd * s));
    };
    const tween = (c, to, dur, ease, delay = 0) => {
      const t = now();
      c.a = { from: at(c, t), to, t0: t + delay, dur, ease, end: t + delay + dur };
    };
    const spring = (c, to, response, damping) => {
      const t = now(), from = at(c, t), v0 = (from - at(c, t - 8)) / 0.008;
      const w0 = (2 * Math.PI) / response, k = damping * w0, wd = w0 * Math.sqrt(1 - damping * damping);
      const y0 = from - to, c2 = (v0 + k * y0) / wd;
      // Done once the swing left is under a thousandth of the travel.
      const end = t + (1000 * Math.log(Math.max(1, (Math.abs(y0) + Math.abs(c2)) / 0.001))) / k;
      c.a = { spring: true, from, to, t0: t, k, wd, y0, c2, end };
    };
    const hold = (c, v) => {
      c.v = v;
      c.a = null;
    };

    let on = initial;
    const pos = value(on ? 1 : 0), lens = value(0), white = value(1), tint = value(on ? 1 : 0), dim = value(0);
    const all = [pos, lens, white, tint, dim];
    let press = null;
    let raf = 0;
    let quietUntil = 0;

    // The lens at its size and place, for each device pixel under it.
    const drawLens = (x, amount, fill, rgb) => {
      const dpr = Math.min(3, window.devicePixelRatio || 1);
      const W = Math.round(BOX.w * dpr), H = Math.round(BOX.h * dpr);
      if (canvas.width !== W || canvas.height !== H) {
        canvas.width = W;
        canvas.height = H;
      }
      const sx = W / BOX.w, sy = H / BOX.h;
      ctx.clearRect(0, 0, W, H);
      const s = 1 + GROW * amount, hw = HW * s, r = HH * s, flat = hw - r;
      const x0 = Math.max(0, Math.floor((x - hw - 1 - BOX.x) * sx)), x1 = Math.min(W, Math.ceil((x + hw + 1 - BOX.x) * sx));
      const y0 = Math.max(0, Math.floor((KY - r - 1 - BOX.y) * sy)), y1 = Math.min(H, Math.ceil((KY + r + 1 - BOX.y) * sy));
      if (x1 <= x0 || y1 <= y0) return;
      const img = ctx.createImageData(x1 - x0, y1 - y0), px = img.data;
      // How far in from the rim the glass bends, and how far out it looks at the rim itself: the
      // glass bends more as it swells.
      const reach = 0.87 * r, depth = 0.56 * r * amount;
      // The edge and its fringe come in as the white goes: 1 pt here is 7/6 px.
      const rim = Math.min(1, (1 - fill) / 0.4), line = 7 / 6, soft = 0.5 / sx, spread = 2.4;
      let p = 0;
      for (let j = y0; j < y1; j++) {
        const y = (j + 0.5) / sy + BOX.y, dy = y - KY;
        for (let i = x0; i < x1; i++, p += 4) {
          const X = (i + 0.5) / sx + BOX.x, dx = X - x, ax = Math.abs(dx) - flat;
          let e, nx, ny;
          if (ax > 0) {
            const d = Math.hypot(ax, dy) || 1e-6;
            e = r - d;
            nx = (dx < 0 ? -ax : ax) / d;
            ny = dy / d;
          } else {
            e = r - Math.abs(dy);
            nx = 0;
            ny = dy < 0 ? -1 : 1;
          }
          const cover = clamp(e * sx + 0.5);
          if (cover <= 0) continue;
          // Under the glass: the track on the white card, looked at from further out near the rim.
          const bend = e < reach ? depth * Math.pow(1 - e / reach, 1.43) : 0;
          const bx = X + nx * bend, by = y + ny * bend;
          const tx = Math.abs(bx - 32) - 18, ty = by - 14;
          const inTrack = clamp(0.5 - ((tx > 0 ? Math.hypot(tx, ty) : Math.abs(ty)) - 14) * sx);
          // The knob's white body sits 4 pt inside the rim; the glass round it is whiter only as the
          // body is (its white squared).
          const body = fill * (fill + (1 - fill) * clamp((e - BODY) * sx + 0.5));
          // Darker towards the sides near the rim, and across the upper half of the track.
          const shade = (1 - 0.05 * nx * nx * clamp((1 - e / r) / 0.6)) * (1 - 0.048 * inTrack * Math.exp(-(((dy / r + 0.35) / 0.22) ** 2)));
          // The edge, darker where it stands upright, and a fringe inside it: cyan towards one pair
          // of opposite corners, amber towards the other (cos(2θ − 60°), θ up from the right).
          const dark = rim * (0.2 + 0.16 * Math.abs(nx));
          const hue = 0.5 * (nx * nx - ny * ny) - 1.732 * nx * ny;
          const core = 1 - clamp((e - line + soft) / (2 * soft));
          for (let k = 0; k < 3; k++) {
            const ext = spread * (k === 0 ? Math.max(hue, 0) : k === 2 ? Math.max(-hue, 0) : 0.4 * Math.abs(hue));
            const fringe = ext > 0 && e > line ? 0.5 * (1 - smooth(clamp((e - line) / ext))) : 0;
            const under = 255 + (rgb[k] - 255) * (0.1 + 0.9 * inTrack); // the glass takes a little of the track's color
            const lit = under * shade + (255 - under * shade) * body;
            px[p + k] = lit * (1 - dark * Math.max(core, fringe));
          }
          px[p + 3] = 255 * cover;
        }
      }
      ctx.putImageData(img, x0, y0);
    };

    const paint = () => {
      raf = 0;
      const t = now();
      const p = at(pos, t), l = at(lens, t), w = at(white, t), c = at(tint, t), d = 1 - 0.09 * at(dim, t);
      const rgb = OFF.map((o, k) => (o + (ON[k] - o) * c) * d);
      track.style.backgroundColor = "rgb(" + rgb.map((v) => v.toFixed(2)).join(",") + ")";
      const s = 1 + GROW * l;
      knob.style.transform = "translateX(" + (TRAVEL * p).toFixed(3) + "px) scale(" + s.toFixed(4) + ")";
      const glass = l > 0.0005 || w < 0.9995;
      knob.style.background = glass ? "transparent" : "";
      // The knob's soft shadow all round gives way to the lens's, which falls only below it. In the
      // knob's own pixels, which the scale enlarges.
      const shadow = (y, blur, spread, alpha) =>
        "0 " + (y / s).toFixed(2) + "px " + (blur / s).toFixed(2) + "px " + (spread / s).toFixed(2) + "px rgba(0,0,0," + alpha.toFixed(4) + ")";
      knob.style.boxShadow = glass ? [shadow(0.5, 1, 0, 0.1 * (1 - l)), shadow(2, 20, 0, 0.12 * (1 - l)), shadow(14, 14, -6, 0.065 * l)].join(",") : "";
      canvas.style.display = glass ? "block" : "";
      if (glass) drawLens(KX + TRAVEL * p, l, w, rgb);
      let moving = false;
      for (const c2 of all) {
        if (c2.a && t >= c2.a.end) hold(c2, c2.a.to);
        if (c2.a) moving = true;
      }
      if (moving) raf = requestAnimationFrame(paint);
      else if (!press) rest();
    };
    const run = () => {
      track.classList.add("is-live");
      if (!raf) raf = requestAnimationFrame(paint);
    };
    // Back to the stylesheet's switch, which looks the same as the last frame.
    const rest = () => {
      track.style.backgroundColor = "";
      knob.style.transform = "";
      knob.style.background = "";
      knob.style.boxShadow = "";
      canvas.style.display = "";
      // Take the stylesheet's values while transitions are still off, or the browser may run one from
      // a frame it last styled (WebKit shrinks a full lens back over 0.25 s).
      void getComputedStyle(track).backgroundColor;
      void getComputedStyle(knob).transform;
      track.classList.remove("is-live");
    };

    const commit = (next) => {
      if (next === on) return;
      on = next;
      track.classList.toggle("on", on);
      onChange(on);
    };

    button.addEventListener("pointerdown", (e) => {
      if (press || reducedMotion.matches || !e.isPrimary || (e.pointerType === "mouse" && e.button !== 0)) return;
      press = { id: e.pointerId, x: e.clientX, from: 0, dragging: false, side: on };
      try {
        button.setPointerCapture(e.pointerId);
      } catch (err) {
        /* capture is a nicety */
      }
      tween(lens, 1, 180, grow, 25);
      tween(white, 0, 150, smooth, 25);
      tween(dim, 1, 160, grow, 60);
      run();
    });
    button.addEventListener("pointermove", (e) => {
      if (!press || e.pointerId !== press.id) return;
      if (!press.dragging) {
        if (Math.abs(e.clientX - press.x) < 3) return;
        press.dragging = true;
        press.x = e.clientX;
        press.from = at(pos, now());
      }
      hold(pos, clamp(press.from + (e.clientX - press.x) / TRAVEL));
      const side = pos.v >= 0.5;
      if (side !== press.side) {
        press.side = side;
        tween(tint, side ? 1 : 0, 170, settleOut);
      }
      run();
    });
    const release = (e, done) => {
      if (!press || e.pointerId !== press.id) return;
      const next = press.dragging ? pos.v >= 0.5 : done ? !on : on;
      press = null;
      quietUntil = now() + 400;
      spring(pos, next ? 1 : 0, 0.46, 0.78);
      spring(lens, 0, 0.5, 0.9);
      tween(white, 1, 205, fade, 35);
      tween(tint, next ? 1 : 0, 170, settleOut, 10);
      tween(dim, 0, 170, settleOut, 10);
      run();
      commit(next);
    };
    button.addEventListener("pointerup", (e) => release(e, true));
    button.addEventListener("pointercancel", (e) => release(e, false));
    button.addEventListener("lostpointercapture", (e) => release(e, false));
    // A press from the keyboard, or one the pointer handlers didn't see.
    button.addEventListener("click", () => {
      if (now() < quietUntil) return;
      const next = !on;
      if (reducedMotion.matches) {
        hold(pos, next ? 1 : 0);
        hold(tint, next ? 1 : 0);
        return commit(next);
      }
      spring(pos, next ? 1 : 0, 0.41, 0.66);
      tween(tint, next ? 1 : 0, 170, settleOut);
      run();
      commit(next);
    });
  };

  /* Design: the preview's stage, lit by the capture ---------------------------------------------
     TangoDown's stage as the app draws it, with its Liquid Glass buttons and its centred game and
     date. Under the capture is its light: the 64 × 36 picture TangoDown's AmbientTone.make gives for
     its 480-pixel thumbnail (assets/shots/ambient/*-tone.png), stretched 1.25 times under a 55% veil.
     A step shows the picture and its title at once and fades the new light in over 0.3 s, linear,
     as the app does; Previous and Next go round, as they do over a selection. */

  const ambient = $("#ambient");
  if (ambient) {
    const host = $(".td-stage-host", ambient);
    const lightSwitch = $(".td-switch", ambient);
    const group = $(".td-picks", ambient);
    const picks = $$(".td-pick", ambient);
    const kit = makeStageKit();
    const shots = picks.map((b) => ({
      title: b.getAttribute("aria-label"),
      get alt() {
        return T("{game} screenshot", { game: this.title });
      },
      date: b.dataset.date,
      media: b.dataset.media,
      tone: b.dataset.tone,
    }));
    // The capture picked, and the one on stage, which follows once its picture and light are ready.
    let index = Math.max(0, picks.findIndex((b) => b.getAttribute("aria-checked") === "true"));
    let shown = index;
    let token = 0;
    let lit = true;
    let stage = null;
    let stageW = 0;
    let lightAnim = null;
    const ready = [];
    const decoded = [];

    const load = (src) => {
      const img = new Image();
      img.decoding = "async";
      img.src = src;
      decoded.push(img);
      return (img.decode ? img.decode() : new Promise((done) => (img.onload = img.onerror = done))).catch(() => {});
    };
    const prepare = (i) => ready[i] || (ready[i] = Promise.all([load(shots[i].media), load(shots[i].tone)]));
    onLanguage(() => {
      const media = stage && $(".td-media", stage);
      if (media) media.alt = shots[shown].alt;
    });
    const lights = () => stage && $(".td-tones", stage);

    // As StageView shows a tone: on a layer of its own over the light on screen, in over 0.3 s,
    // linear; the layers under it go once it has been fully in for 0.1 s more.
    const pushLight = (src, fade) => {
      const tones = lights();
      if (!tones) return;
      const layer = document.createElement("img");
      layer.className = "td-tone";
      layer.alt = "";
      layer.draggable = false;
      layer.src = src;
      tones.appendChild(layer);
      const clearUnder = () => {
        while (layer.parentNode === tones && tones.firstChild !== layer) tones.removeChild(tones.firstChild);
      };
      // With the light off there's nothing to fade: the next one waits unseen.
      if (!fade || !lit || !layer.animate) return clearUnder();
      layer.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: "linear" }).finished.then(() => setTimeout(clearUnder, 100), () => {});
      while (tones.children.length > 6) tones.removeChild(tones.firstChild);
    };

    const mark = () =>
      picks.forEach((b, i) => {
        b.setAttribute("aria-checked", String(i === index));
        b.tabIndex = i === index ? 0 : -1;
      });

    const select = (i) => {
      if (i === index) return;
      index = i;
      mark();
      const t = ++token;
      if (i === shown) return;
      prepare(i).then(() => {
        if (t !== token || !stage) return;
        shown = i;
        kit.show(stage, shots[i]);
        pushLight(shots[i].tone, true);
      });
    };
    const step = (by) => select((index + by + shots.length) % shots.length);

    // Laid out at its own size down to 560 pt, so the buttons stay 1:1; narrower, the whole stage
    // scales. Its height keeps the capture 87% as wide as the stage, as a 1000 × 574 pt stage has it,
    // so a narrow stage isn't mostly margin.
    const layout = () => {
      const width = host.clientWidth;
      if (!width) return;
      const aspect = 16 / 9;
      const w = Math.max(width, 560);
      const h = Math.round((0.871 * w) / aspect + 84);
      if (w !== stageW) {
        stageW = w;
        stage = kit.build(host, { w, h, aspect });
        $(".td-hit-prev", stage).addEventListener("click", () => step(-1));
        $(".td-hit-next", stage).addEventListener("click", () => step(1));
        lightAnim = null;
        kit.show(stage, shots[shown]);
        pushLight(shots[shown].tone, false);
        lights().style.opacity = lit ? "1" : "0";
      }
      const k = Math.min(1, width / w);
      stage.style.transform = k < 1 ? `scale(${k})` : "";
      host.style.aspectRatio = "auto";
      host.style.height = `${h * k}px`;
    };
    layout();
    if (window.ResizeObserver) new ResizeObserver(layout).observe(host);
    else addEventListener("resize", layout);

    // The other captures load as the stage comes near, and are decoded ahead, so a step is instant.
    const preload = watchVisibility(
      host,
      (isVisible) => {
        if (!isVisible) return;
        preload.disconnect();
        shots.forEach((_, i) => prepare(i));
      },
      { rootMargin: "600px 0px" }
    );

    picks.forEach((b, i) => b.addEventListener("click", () => select(i)));
    // Safari on iPhone and iPad presses (:active) only what listens for touches.
    group.addEventListener("touchstart", () => {}, { passive: true });
    // One stop for Tab; the arrows move through the captures and go round, as Previous and Next do.
    group.addEventListener("keydown", (e) => {
      const n = shots.length;
      const by = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
      const i = by ? (index + by + n) % n : e.key === "Home" ? 0 : e.key === "End" ? n - 1 : -1;
      if (i < 0) return;
      e.preventDefault();
      select(i);
      picks[i].focus();
    });
    mark();

    // The light fades out or in from wherever it is, so a quick second click turns it back smoothly.
    makeGlassSwitch(lightSwitch, lit, (next) => {
      lit = next;
      lightSwitch.setAttribute("aria-checked", String(lit));
      const tones = lights();
      if (!tones) return;
      const from = Number(getComputedStyle(tones).opacity);
      const to = lit ? 1 : 0;
      if (lightAnim) lightAnim.cancel();
      tones.style.opacity = String(to);
      lightAnim = tones.animate
        ? tones.animate([{ opacity: from }, { opacity: to }], { duration: lit ? 600 : 450, easing: "cubic-bezier(0.4, 0, 0.2, 1)" })
        : null;
    });
  }

  /* Design: Check Now, redrawn -------------------------------------------------------------------
     The toolbar's Check Now button, its symbol drawn frame by frame as the app's OrbitShape and
     CheckShape draw it: the arrow breaks into beads while it checks, and they gather to draw the
     answer, a check mark or an exclamation mark, whichever result is picked. */

  const checkPanel = $(".td-panel");
  if (checkPanel) {
    const orbit = makeOrbit();
    const motion = new orbit.Motion();
    const checkButtons = $$(".td-check", checkPanel);
    const results = $$(".td-seg", checkPanel);
    const resultGroup = $(".td-result", checkPanel);
    const canvases = {};
    const LABELS = { idle: "Check with XBOX Now", checking: "Checking with XBOX", done: "Up to Date", failed: "Couldn’t Reach XBOX" };
    let phase = "idle";
    let outcome = "done";
    let checks = 0;
    let events = [];
    let raf = 0;

    const setPhase = (next) => {
      phase = next;
      checkButtons.forEach((b) => b.setAttribute("aria-label", T(LABELS[next])));
    };
    setPhase(phase);
    onLanguage(() => setPhase(phase));

    const drawOrbit = (t) => {
      for (const c of Object.values(canvases)) {
        c.ctx.setTransform(1, 0, 0, 1, 0, 0);
        c.ctx.clearRect(0, 0, c.canvas.width, c.canvas.height);
        c.ctx.setTransform(c.k, 0, 0, c.k, c.k * orbit.MARGIN, c.k * orbit.MARGIN);
        orbit.draw(c.ctx, motion, t, { foreground: "rgba(0,0,0,.83)", accent: "#107C10", reduceMotion: reducedMotion.matches });
      }
    };

    // The glass circle and a canvas for the symbol in a button, S times the toolbar's size; the
    // symbol's frame sits where the toolbar puts it in its 36 pt glass circle.
    const mount = (name, S) => {
      const dpr = Math.max(1, Math.min(3, devicePixelRatio || 1));
      const old = canvases[name];
      if (old && old.S === S && old.dpr === dpr) return;
      const button = $(`[data-check="${name}"]`, checkPanel);
      if (!button) return;
      const canvas = document.createElement("canvas");
      const cw = (orbit.FRAME.w + 2 * orbit.MARGIN) * S;
      const ch = (orbit.FRAME.h + 2 * orbit.MARGIN) * S;
      canvas.width = Math.round(cw * dpr);
      canvas.height = Math.round(ch * dpr);
      canvas.setAttribute("aria-hidden", "true");
      canvas.style.cssText = `position:absolute;left:${(18 - 8.7144 - orbit.MARGIN) * S}px;top:${(6.9 - orbit.MARGIN) * S}px;width:${cw}px;height:${ch}px;pointer-events:none`;
      button.style.width = button.style.height = `${36 * S}px`;
      button.innerHTML = `<span class="td-glass" aria-hidden="true" style="position:absolute;inset:0;pointer-events:none">${lightGlass(`tdl${name}${S}`, S)}</span>`;
      button.appendChild(canvas);
      canvases[name] = { S, dpr, canvas, ctx: canvas.getContext("2d"), k: dpr * S };
      drawOrbit(performance.now() / 1000);
    };
    // Four times the toolbar's size, or three where the panel is narrow, as on a phone.
    const size = () => {
      mount("small", 1);
      mount("big", checkPanel.clientWidth < 400 ? 3 : 4);
    };
    size();
    if (window.ResizeObserver) new ResizeObserver(size).observe(checkPanel);
    else addEventListener("resize", size);
    // Redrawn sharp when the window moves to a screen of another density.
    const watchDensity = () => {
      const query = matchMedia(`(resolution: ${devicePixelRatio || 1}dppx)`);
      const changed = () => {
        query.removeEventListener("change", changed);
        size();
        watchDensity();
      };
      query.addEventListener("change", changed);
    };
    if (matchMedia("(resolution: 1dppx)").addEventListener) watchDensity();

    const kick = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const tick = () => {
      raf = 0;
      const t = performance.now() / 1000;
      while (events.length && events[0].at <= t) {
        const e = events.shift();
        e.run(e.at);
      }
      const settles = motion.settlesAt();
      if (settles != null && t >= settles) motion.settle();
      drawOrbit(t);
      if (!motion.showsSymbol || events.length || phase !== "idle") kick();
    };

    // As AppModel.checkNow() runs a check in the app's sample library: 1.2 s of checking, then the
    // check mark for 1.6 s, or the exclamation mark for 3 s, then back to rest. A click while it
    // checks does nothing, as in the app; the answer is whichever result is picked when it ends.
    const press = () => {
      if (phase === "checking") return;
      const t = performance.now() / 1000;
      const id = ++checks;
      setPhase("checking");
      motion.go("checking", t);
      events = [
        {
          at: t + 1.2,
          run: (at) => {
            const result = outcome;
            setPhase(result);
            motion.go({ result }, at);
            events.push({
              at: at + (result === "done" ? 1.6 : 3),
              run: (end) => {
                if (id !== checks || phase === "idle") return;
                setPhase("idle");
                motion.go("rest", end);
              },
            });
          },
        },
      ];
      kick();
    };
    checkButtons.forEach((b) => b.addEventListener("click", press));

    // Picking a result shows it: a check runs and ends with it, or the one running does.
    const pick = (i) => {
      results.forEach((b, j) => {
        b.classList.toggle("on", i === j);
        b.setAttribute("aria-checked", String(i === j));
        b.tabIndex = i === j ? 0 : -1;
      });
      outcome = results[i].dataset.result;
      if (phase !== "checking") press();
    };
    results.forEach((b, i) => b.addEventListener("click", () => pick(i)));
    resultGroup.addEventListener("keydown", (e) => {
      const by = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
      if (!by) return;
      e.preventDefault();
      const i = (results.findIndex((b) => b.getAttribute("aria-checked") === "true") + by + results.length) % results.length;
      pick(i);
      results[i].focus();
    });

    // It checks once by itself the first time the big button is wholly on screen below the
    // navigation bar, half a second after, so the card has come in: not if a check has run
    // already, and not with Reduce Motion, where the page starts nothing by itself.
    let autoTimer = 0;
    const autoplay = watchVisibility(
      $('[data-check="big"]', checkPanel),
      (isVisible, entry) => {
        clearTimeout(autoTimer);
        if (!isVisible || entry.intersectionRatio < 0.99) return;
        autoTimer = setTimeout(() => {
          autoplay.disconnect();
          if (checks === 0 && phase === "idle" && !reducedMotion.matches) press();
        }, 500);
      },
      { rootMargin: "-52px 0px 0px 0px", threshold: [0, 0.99] }
    );
  }

  /* Design: the library reflowing as the window resizes -------------------------------------------
     The recording loads as it comes near and plays once while at least half of it is on screen,
     pausing when it isn't. At the end it stays on its last frame and offers Replay below. Where it
     can't start by itself, with Reduce Motion or when the browser won't autoplay, the same button
     offers Play. */

  const resizeDemo = $("#resize-demo");
  if (resizeDemo) {
    const video = $("video", resizeDemo);
    const source = $("source[data-src]", video);
    const button = $(".td-replay", resizeDemo);
    const label = $("span", button);
    let loaded = false;
    let word = label.textContent.trim();
    label.textContent = T(word);
    onLanguage(() => (label.textContent = T(word)));

    // idle: not started; playing; stopped: waiting for Play; ended: waiting for Replay.
    const set = (state) => {
      resizeDemo.dataset.state = state;
      word = state === "ended" ? "Replay" : "Play";
      label.textContent = T(word);
    };
    const load = () => {
      if (loaded || !source) return;
      loaded = true;
      source.src = source.dataset.src;
      video.load();
    };
    const start = () => {
      load();
      return video.play().then(
        () => set("playing"),
        (error) => {
          if (error.name === "NotAllowedError") set("stopped");
        }
      );
    };

    video.addEventListener("ended", () => set("ended"));
    button.addEventListener("click", () => {
      const hadFocus = document.activeElement === button;
      start().then(() => {
        if (hadFocus && resizeDemo.dataset.state === "playing") video.focus({ preventScroll: true });
      });
    });

    watchVisibility(
      video,
      (isVisible, entry) => {
        if (isVisible) load();
        if (!isVisible || entry.intersectionRatio < 0.5) return video.pause();
        const state = resizeDemo.dataset.state;
        if (state === "ended" || state === "stopped") return;
        if (reducedMotion.matches && state === "idle") return set("stopped");
        start();
      },
      { threshold: [0, 0.5] }
    );
  }

  /* Download: a field of points round the icon ------------------------------------------------
     Rings like the hero's reticle, a ping every few seconds that lights the points it
     crosses, and a little light under the pointer. Light, slow, and only while on screen. */

  const field = $(".download-field");
  if (field && field.getContext) {
    const section = field.parentElement;
    const icon = $(".download-icon", section);
    const ctx = field.getContext("2d");
    const base = document.createElement("canvas");
    const SPACING = 24;
    const INK = [29, 29, 31];
    const LEAF = [36, 150, 72];
    const PING_EVERY = 5600;
    const PING_LIFE = 7600;
    let w = 0, h = 0, dpr = 1, cx = 0, cy = 0, k = 1;
    let dots = new Float32Array(0);
    let running = false;
    let raf = 0;
    let pointer = null;
    const t0 = performance.now();

    const centre = () => {
      if (!icon) return [w / 2, h * 0.3];
      let x = icon.offsetWidth / 2, y = icon.offsetHeight / 2;
      for (let el = icon; el && el !== section; el = el.offsetParent) {
        x += el.offsetLeft;
        y += el.offsetTop;
      }
      return [x, y];
    };

    const rings = () => [128 * k, 236 * k, 372 * k];

    const drawBase = () => {
      base.width = field.width;
      base.height = field.height;
      const b = base.getContext("2d");
      b.setTransform(dpr, 0, 0, dpr, 0, 0);
      b.fillStyle = `rgba(${INK.join(",")}, 0.1)`;
      for (let i = 0; i < dots.length; i += 3) b.fillRect(dots[i] - 0.8, dots[i + 1] - 0.8, 1.6, 1.6);
      const [r1, , r3] = rings();
      b.lineWidth = 1;
      b.strokeStyle = `rgba(${LEAF.join(",")}, 0.16)`;
      b.beginPath();
      b.arc(cx, cy, r1, 0, Math.PI * 2);
      b.stroke();
      b.strokeStyle = `rgba(${LEAF.join(",")}, 0.08)`;
      b.beginPath();
      b.arc(cx, cy, r3, 0, Math.PI * 2);
      b.stroke();
      // Four ticks on the inner ring, as round the hero's word.
      b.strokeStyle = `rgba(${LEAF.join(",")}, 0.45)`;
      b.lineWidth = 1.5;
      b.lineCap = "round";
      for (let q = 0; q < 4; q++) {
        const a = (q * Math.PI) / 2;
        b.beginPath();
        b.moveTo(cx + Math.cos(a) * (r1 - 7), cy + Math.sin(a) * (r1 - 7));
        b.lineTo(cx + Math.cos(a) * (r1 + 7), cy + Math.sin(a) * (r1 + 7));
        b.stroke();
      }
    };

    const resize = () => {
      w = section.clientWidth;
      h = section.clientHeight;
      if (!w || !h) return;
      dpr = Math.min(2, devicePixelRatio || 1);
      field.width = Math.round(w * dpr);
      field.height = Math.round(h * dpr);
      [cx, cy] = centre();
      k = clamp(w / 1280, 0.62, 1.15);
      const list = [];
      const ox = (w % SPACING) / 2;
      for (let y = SPACING / 2; y < h; y += SPACING) {
        for (let x = ox; x < w; x += SPACING) list.push(x, y, Math.hypot(x - cx, y - cy));
      }
      dots = Float32Array.from(list);
      drawBase();
      draw(performance.now());
    };

    const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));

    function draw(now) {
      if (!w) return;
      const still = reducedMotion.matches;
      const t = now - t0;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, field.width, field.height);
      ctx.drawImage(base, 0, 0);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // The middle ring, dashed, turning once every two minutes.
      const [, r2] = rings();
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(still ? 0 : (t / 120000) * Math.PI * 2);
      ctx.setLineDash([2, 9]);
      ctx.lineWidth = 1.2;
      ctx.lineCap = "round";
      ctx.strokeStyle = `rgba(${LEAF.join(",")}, 0.3)`;
      ctx.beginPath();
      ctx.arc(0, 0, r2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      if (still) return;

      // Pings: two can be out at once.
      const reach = Math.hypot(Math.max(cx, w - cx), Math.max(cy, h - cy));
      const waves = [];
      for (let n = Math.floor(t / PING_EVERY); n >= 0 && waves.length < 2; n--) {
        const age = t - n * PING_EVERY;
        if (age > PING_LIFE) break;
        const u = age / PING_LIFE;
        const radius = rings()[0] + (reach - rings()[0]) * (1 - Math.pow(1 - u, 2.2));
        const strength = Math.pow(1 - u, 1.4);
        waves.push([radius, strength]);
        ctx.lineWidth = 1;
        ctx.strokeStyle = `rgba(${LEAF.join(",")}, ${(0.22 * strength).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Points the wave or the pointer is near, a little larger and greener.
      for (let i = 0; i < dots.length; i += 3) {
        const x = dots[i], y = dots[i + 1], d = dots[i + 2];
        let lit = 0;
        for (const [radius, strength] of waves) {
          const off = (d - radius) / 34;
          if (off > -3 && off < 3) lit = Math.max(lit, Math.exp(-off * off) * strength);
        }
        let near = 0;
        if (pointer) {
          const pd = Math.hypot(x - pointer[0], y - pointer[1]);
          if (pd < 150) near = Math.pow(1 - pd / 150, 2);
        }
        if (lit < 0.03 && near < 0.03) continue;
        const color = lit >= near ? mix(INK, LEAF, 0.85) : INK;
        const alpha = 0.1 + Math.max(lit * 0.5, near * 0.26);
        const size = 1.6 + Math.max(lit, near * 0.6) * 1.3;
        ctx.fillStyle = `rgba(${color.join(",")}, ${alpha.toFixed(3)})`;
        ctx.fillRect(x - size / 2, y - size / 2, size, size);
      }
    }

    const loop = (now) => {
      draw(now);
      raf = running ? requestAnimationFrame(loop) : 0;
    };
    const setRunning = (on) => {
      on = on && !reducedMotion.matches;
      if (on === running) return;
      running = on;
      if (on && !raf) raf = requestAnimationFrame(loop);
    };

    let onScreen = false;
    watchVisibility(section, (isVisible) => {
      onScreen = isVisible;
      setRunning(isVisible);
      if (isVisible) draw(performance.now());
    });
    section.addEventListener("pointermove", (e) => {
      if (e.pointerType !== "mouse") return;
      const r = section.getBoundingClientRect();
      pointer = [e.clientX - r.left, e.clientY - r.top];
    });
    section.addEventListener("pointerleave", () => (pointer = null));
    new ResizeObserver(resize).observe(section);
    reducedMotion.addEventListener?.("change", () => {
      setRunning(onScreen);
      draw(performance.now());
    });
  }

  /* Live Photo: trim a clip, pick the photo, press and hold to play ---------------------------- */

  const live = $("#live-demo");
  if (live) {
    const video = $("video", live);
    const phone = $(".phone", live);
    const track = $(".trim-track", live);
    const frames = $(".trim-frames", live);
    const handleL = $(".trim-handle-l", live);
    const handleR = $(".trim-handle-r", live);
    const keyFrame = $(".trim-key", live);
    const selection = $(".trim-sel", live);
    const lengthText = $(".trim-length", live);
    const photoText = $(".trim-photo", live);

    const MIN = 1;
    const MAX = 10;
    const WINDOW = 30; // the strip shows at most 30 seconds, as in TangoDown
    // The photo starts in the middle of frame 149 (4.967–5.000 s), which reads as 0:05.0, in the
    // middle of the three seconds selected round it. A time inside a frame, not on its edge, shows
    // that one frame in every browser.
    const PHOTO = 4.98;
    let span = 20; // seconds the strip shows
    let s = PHOTO - 1.5, e = PHOTO + 1.5, k = PHOTO;
    let videoOK = true;

    const fmt = (t) => {
      const m = Math.floor(t / 60);
      const sec = t - m * 60;
      return `${m}:${sec < 10 ? "0" : ""}${num(sec, 1)}`;
    };

    const render = () => {
      track.style.setProperty("--s", (s / span).toFixed(5));
      track.style.setProperty("--e", (e / span).toFixed(5));
      track.style.setProperty("--k", (k / span).toFixed(5));
      lengthText.textContent = T("{n} s", { n: num(e - s, 1) });
      photoText.textContent = T("photo at {t}", { t: fmt(k) });
      const aria = (el, now, min, max) => {
        el.setAttribute("aria-valuemin", min.toFixed(1));
        el.setAttribute("aria-valuemax", max.toFixed(1));
        el.setAttribute("aria-valuenow", now.toFixed(1));
        el.setAttribute("aria-valuetext", T("{n} seconds", { n: num(now, 1) }));
      };
      aria(handleL, s, Math.max(0, e - MAX), e - MIN);
      aria(handleR, e, s + MIN, Math.min(span, s + MAX));
      aria(keyFrame, k, s, e);
    };
    onLanguage(render);

    // One seek in flight, the latest one waiting.
    let seeking = false;
    let pendingSeek = null;
    const nextSeek = () => {
      if (pendingSeek === null || !videoOK || video.readyState < 1) return;
      const t = pendingSeek;
      pendingSeek = null;
      seeking = true;
      video.currentTime = t;
    };
    const seek = (t) => {
      pendingSeek = t;
      if (!seeking) nextSeek();
    };
    video.addEventListener("seeked", () => {
      seeking = false;
      nextSeek();
    });

    const setSpan = (duration) => {
      if (!isFinite(duration) || duration <= 0) return;
      const old = span;
      span = Math.min(WINDOW, duration);
      if (old !== span) {
        const length = Math.min(3, span);
        k = clamp(PHOTO, length / 2, span - length / 2);
        s = k - length / 2;
        e = s + length;
      }
      render();
      seek(k);
    };

    const fail = () => {
      videoOK = false;
      phone.classList.add("no-video");
    };
    video.addEventListener("loadedmetadata", () => setSpan(video.duration));
    video.addEventListener("error", fail);
    $("source", video)?.addEventListener("error", fail);
    if (video.readyState >= 1) setSpan(video.duration);
    render();

    // Dragging the handles, the photo frame and the selection itself.
    const drag = (el, apply) => {
      el.addEventListener("pointerdown", (down) => {
        if (down.button > 0) return;
        down.preventDefault();
        el.setPointerCapture(down.pointerId);
        el.focus({ preventScroll: true });
        stopPlaying(false);
        video.pause();
        const startX = down.clientX;
        const start = { s, e, k };
        const width = frames.getBoundingClientRect().width;
        const move = (ev) => {
          const dt = ((ev.clientX - startX) / width) * span;
          seek(apply(dt, start));
          render();
        };
        const up = () => {
          el.removeEventListener("pointermove", move);
          el.removeEventListener("pointerup", up);
          el.removeEventListener("pointercancel", up);
          seek(k);
        };
        el.addEventListener("pointermove", move);
        el.addEventListener("pointerup", up);
        el.addEventListener("pointercancel", up);
      });
    };

    const moveStart = (to) => {
      s = clamp(to, Math.max(0, e - MAX), e - MIN);
      k = clamp(k, s, e);
      return s;
    };
    const moveEnd = (to) => {
      e = clamp(to, s + MIN, Math.min(span, s + MAX));
      k = clamp(k, s, e);
      return e;
    };
    const movePhoto = (to) => (k = clamp(to, s, e));
    const moveAll = (to, start) => {
      const length = start.e - start.s;
      s = clamp(to, 0, span - length);
      e = s + length;
      k = start.k + (s - start.s);
      return k;
    };

    drag(handleL, (dt, st) => moveStart(st.s + dt));
    drag(handleR, (dt, st) => moveEnd(st.e + dt));
    drag(keyFrame, (dt, st) => movePhoto(st.k + dt));
    drag(selection, (dt, st) => moveAll(st.s + dt, st));

    const keys = (el, apply) => {
      el.addEventListener("keydown", (ev) => {
        const unit = ev.shiftKey ? 1 : 0.1;
        const step = { ArrowRight: unit, ArrowUp: unit, ArrowLeft: -unit, ArrowDown: -unit }[ev.key];
        let value;
        if (step) value = apply(step, false);
        else if (ev.key === "Home") value = apply(-Infinity, true);
        else if (ev.key === "End") value = apply(Infinity, true);
        else return;
        ev.preventDefault();
        render();
        seek(value);
      });
      el.addEventListener("blur", () => seek(k));
    };
    keys(handleL, (d, abs) => moveStart(abs ? d : s + d));
    keys(handleR, (d, abs) => moveEnd(abs ? d : e + d));
    keys(keyFrame, (d, abs) => movePhoto(abs ? d : k + d));

    // Press and hold the picture to play the Live Photo once, then back to the photo.
    let playing = false;
    let raf = 0;
    const watch = () => {
      if (!playing) return;
      if (video.currentTime >= e - 0.04 || video.ended) return stopPlaying(true);
      raf = requestAnimationFrame(watch);
    };
    const startPlaying = () => {
      if (playing) return;
      playing = true;
      phone.classList.add("is-playing");
      if (!videoOK || video.readyState < 1) return;
      pendingSeek = null;
      video.currentTime = s;
      video.play().then(watch, () => {});
    };
    function stopPlaying(backToPhoto = true) {
      if (!playing) return;
      playing = false;
      cancelAnimationFrame(raf);
      phone.classList.remove("is-playing");
      if (!videoOK) return;
      video.pause();
      if (backToPhoto) seek(k);
    }

    phone.addEventListener("pointerdown", (ev) => {
      if (ev.button > 0) return;
      startPlaying();
    });
    ["pointerup", "pointerleave", "pointercancel"].forEach((type) => phone.addEventListener(type, () => stopPlaying(true)));
    phone.addEventListener("contextmenu", (ev) => ev.preventDefault());
    phone.addEventListener("keydown", (ev) => {
      if (ev.key !== " " && ev.key !== "Enter") return;
      ev.preventDefault();
      if (!ev.repeat) startPlaying();
    });
    phone.addEventListener("keyup", (ev) => {
      if (ev.key === " " || ev.key === "Enter") stopPlaying(true);
    });
    phone.addEventListener("blur", () => stopPlaying(true));
  }

  schedule();
})();

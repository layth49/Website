// "49 in the car" preview. Steps through listen, heard, think and answer,
// then lets the bubble go and starts over. Only runs while the card is on
// screen and the tab is visible; with reduced motion it stays on the
// answer frame the markup already shows.
document.addEventListener("DOMContentLoaded", () => {
  const root = document.querySelector("[data-car49]");
  if (!root) return;

  const stage = root.querySelector(".c49-stage");
  const bubble = root.querySelector(".c49-bubble");
  const body = root.querySelector(".c49-body");
  const mark = root.querySelector(".c49-mark");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

  // [state, what the bubble shows, how long it holds in ms]. ~10s round trip.
  // "heard" only brings in the subtitle; the bubble keeps listening.
  const STEPS = [
    ["idle", null, 1400],
    ["listen", "listen", 1200],
    ["heard", "listen", 1600],
    ["think", "think", 1500],
    ["answer", "answer", 3400],
    ["out", null, 700],
  ];
  const SWAP = 100;

  let step = 0;
  let timer = null;
  let onScreen = false;
  let view = null;

  // Bubble size = its content plus padding. The body is positioned
  // from the top-right, so measuring it is independent of the bubble.
  const fit = (instant) => {
    const cs = getComputedStyle(bubble);
    const padX = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
    const padY = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
    const minH = mark.offsetTop + mark.offsetHeight + parseFloat(cs.paddingTop);
    if (instant) bubble.style.transition = "none";
    bubble.style.width = body.offsetWidth + padX + 2 + "px";
    bubble.style.height = Math.max(body.offsetHeight + padY, minH) + 2 + "px";
    if (instant) {
      void bubble.offsetWidth;
      bubble.style.transition = "";
    }
  };

  const next = () => {
    step = (step + 1) % STEPS.length;
    run();
  };

  const run = () => {
    clearTimeout(timer);
    const [state, shows, hold] = STEPS[step];
    const visible = view !== null;

    // Content change on a visible bubble: fade the text, swap, resize, fade back.
    if (shows && visible && shows !== view) {
      body.classList.add("is-swapping");
      timer = setTimeout(() => {
        stage.dataset.state = state;
        view = shows;
        fit(false);
        body.classList.remove("is-swapping");
        timer = setTimeout(next, hold - SWAP);
      }, SWAP);
      return;
    }

    stage.dataset.state = state;
    if (shows && !visible) fit(true);
    view = shows;
    timer = setTimeout(next, hold);
  };

  const stop = () => {
    clearTimeout(timer);
    timer = null;
    body.classList.remove("is-swapping");
  };

  const sync = () => {
    const live = !reduced.matches;
    root.classList.toggle("is-live", live);
    if (!live) {
      stop();
      stage.dataset.state = "answer";
      view = "answer";
      bubble.style.width = bubble.style.height = "";
      root.classList.remove("is-paused");
      return;
    }
    const playing = onScreen && !document.hidden;
    root.classList.toggle("is-paused", !playing);
    if (playing && !timer) run();
    else if (!playing) stop();
  };

  // Start from the plain home screen rather than the static answer frame.
  if (!reduced.matches) {
    stage.dataset.state = "idle";
    root.classList.add("is-live");
  }

  if ("IntersectionObserver" in window) {
    new IntersectionObserver((entries) => {
      onScreen = entries[entries.length - 1].isIntersecting;
      sync();
    }).observe(root);
  } else {
    onScreen = true;
  }

  document.addEventListener("visibilitychange", sync);
  reduced.addEventListener("change", sync);
  // Text is sized off the card width, so keep the bubble fitted to it.
  if ("ResizeObserver" in window) {
    new ResizeObserver(() => view && root.classList.contains("is-live") && fit(true)).observe(root);
  }
  sync();
});

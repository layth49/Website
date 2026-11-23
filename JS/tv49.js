// "49 on my TV" preview. Two short beats over a show that never stops: a
// weather question (listen, transcript, think, answer), then "49, pause."
// (confirmation, video freezes, overlay leaves, video resumes). Only runs
// while the card is on screen and the tab is visible; with reduced motion it
// stays on the answer frame the markup already shows. The bubble shell and
// fitting logic mirror JS/car49.js so both overlays move the same way.
document.addEventListener("DOMContentLoaded", () => {
  const root = document.querySelector("[data-tv49]");
  if (!root) return;

  const stage = root.querySelector(".t49-stage");
  const bubble = root.querySelector(".c49-bubble");
  const body = root.querySelector(".c49-body");
  const mark = root.querySelector(".c49-mark");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

  // state, beat, hold in ms, show (bubble up), freeze (video paused).
  // ~14s round trip. "out" keeps the content it had while the overlay leaves.
  const STEPS = [
    { state: "idle", beat: "weather", hold: 900 },
    { state: "listen", beat: "weather", hold: 1100, show: true },
    { state: "heard", beat: "weather", hold: 1800, show: true },
    { state: "think", beat: "weather", hold: 1300, show: true },
    { state: "answer", beat: "weather", hold: 3400, show: true },
    { state: "out", beat: "weather", hold: 500 },
    { state: "idle", beat: "pause", hold: 600 },
    { state: "listen", beat: "pause", hold: 900, show: true },
    { state: "heard", beat: "pause", hold: 1000, show: true },
    { state: "ack", beat: "pause", hold: 1200, show: true, freeze: true },
    { state: "out", beat: "pause", hold: 450, freeze: true },
    { state: "idle", beat: "pause", hold: 1100, freeze: true },
  ];

  let step = 0;
  let timer = null;
  let onScreen = false;
  let shown = false;

  // Bubble size = its content plus padding. The body is positioned from the
  // top-right, so measuring it is independent of the bubble, and the bubble
  // grows left and down with its right edge and top fixed.
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

  const apply = (s) => {
    stage.dataset.beat = s.beat;
    stage.dataset.state = s.state;
    stage.classList.toggle("is-frozen", !!s.freeze);
    if (s.show) fit(!shown);
    shown = !!s.show;
  };

  const run = () => {
    clearTimeout(timer);
    const s = STEPS[step];
    apply(s);
    timer = setTimeout(() => {
      step = (step + 1) % STEPS.length;
      run();
    }, s.hold);
  };

  const stop = () => {
    clearTimeout(timer);
    timer = null;
  };

  const sync = () => {
    const live = !reduced.matches;
    root.classList.toggle("is-live", live);
    if (!live) {
      stop();
      stage.dataset.beat = "weather";
      stage.dataset.state = "answer";
      stage.classList.remove("is-frozen");
      bubble.style.width = bubble.style.height = "";
      shown = false;
      root.classList.remove("is-paused");
      return;
    }
    const playing = onScreen && !document.hidden;
    root.classList.toggle("is-paused", !playing);
    if (playing && !timer) run();
    else if (!playing) stop();
  };

  // Start from the plain show rather than the static answer frame.
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
  // Text is sized off the TV's width, so keep the bubble fitted to it.
  if ("ResizeObserver" in window) {
    new ResizeObserver(() => shown && root.classList.contains("is-live") && fit(true)).observe(root);
  }
  sync();
});

document.addEventListener("DOMContentLoaded", () => {
  // Only play what's actually on screen. Phones cap how many videos can decode
  // at once, and loading all of them up front costs a lot of data for nothing.
  const vids = document.querySelectorAll("video");
  const MARGIN = 200;

  const start = (v) => {
    const p = v.play();
    if (p) p.catch(() => {});
  };

  const inView = (v) => {
    const r = v.getBoundingClientRect();
    return r.bottom > -MARGIN && r.top < window.innerHeight + MARGIN;
  };

  // Sweep synchronously so whatever is already on screen starts without waiting
  // on the observer, which doesn't fire while the tab isn't being painted.
  const sweep = () => vids.forEach((v) => (inView(v) ? start(v) : v.pause()));
  sweep();

  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => (e.isIntersecting ? start(e.target) : e.target.pause()));
      },
      { rootMargin: MARGIN + "px 0px" }
    );
    vids.forEach((v) => io.observe(v));
  } else {
    window.addEventListener("scroll", sweep, { passive: true });
    window.addEventListener("resize", sweep, { passive: true });
  }

  document.querySelectorAll(".ost-player").forEach((player) => {
    const audio = player.querySelector("audio");
    const playBtn = player.querySelector(".play-btn");
    const bar = player.querySelector(".progress .bar");
    const progress = player.querySelector(".progress");
    const cur = player.querySelector(".cur");
    const dur = player.querySelector(".dur");

    if (!audio || !playBtn || !bar || !progress) return;

    const fmt = (s) => {
      if (!isFinite(s) || s < 0) return "--:--";
      const total = Math.floor(s);
      const m = Math.floor(total / 60);
      const ss = String(total % 60).padStart(2, "0");
      return `${m}:${ss}`;
    };

    const setState = (state) => {
      playBtn.dataset.state = state;
      playBtn.setAttribute(
        "aria-label",
        state === "playing" ? "Pause" : "Play"
      );
    };

    audio.addEventListener("loadedmetadata", () => {
      dur.textContent = fmt(audio.duration);
    });

    playBtn.addEventListener("click", () => {
      if (audio.paused) audio.play();
      else audio.pause();
    });

    audio.addEventListener("play", () => setState("playing"));
    audio.addEventListener("pause", () => setState("paused"));
    audio.addEventListener("ended", () => {
      setState("paused");
      bar.style.width = "0%";
      cur.textContent = "0:00";
    });

    audio.addEventListener("timeupdate", () => {
      const pct = audio.duration
        ? (audio.currentTime / audio.duration) * 100
        : 0;
      bar.style.width = `${pct}%`;
      cur.textContent = fmt(audio.currentTime);
    });

    const seekFromEvent = (e) => {
      const rect = progress.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      if (isFinite(audio.duration)) audio.currentTime = ratio * audio.duration;
    };

    progress.addEventListener("click", seekFromEvent);
    progress.addEventListener("keydown", (e) => {
      if (!isFinite(audio.duration)) return;
      if (e.key === "ArrowLeft") {
        audio.currentTime = Math.max(0, audio.currentTime - 5);
        e.preventDefault();
      } else if (e.key === "ArrowRight") {
        audio.currentTime = Math.min(audio.duration, audio.currentTime + 5);
        e.preventDefault();
      } else if (e.key === " " || e.key === "Enter") {
        if (audio.paused) audio.play();
        else audio.pause();
        e.preventDefault();
      }
    });
  });
});

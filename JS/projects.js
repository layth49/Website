document.addEventListener("DOMContentLoaded", () => {
  // Graceful fallback for missing video sources
  document.querySelectorAll(".cards .card video").forEach((vid) => {
    const markMissing = () => {
      const media = vid.closest(".card-media");
      if (media && !media.classList.contains("no-media")) {
        media.classList.add("no-media");
        vid.remove();
      }
    };
    vid.addEventListener("error", markMissing, true);
    // <source> error bubbles in capture phase
    vid.querySelectorAll("source").forEach((s) =>
      s.addEventListener("error", markMissing)
    );
    // Edge-case: networkState NO_SOURCE after metadata fail
    vid.addEventListener("stalled", () => {
      if (vid.networkState === HTMLMediaElement.NETWORK_NO_SOURCE) markMissing();
    });
  });

  // Only play what's actually on screen. Phones cap how many videos can decode
  // at once, and loading all of them up front is ~49MB before anything moves.
  const vids = document.querySelectorAll(".cards .card video");
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

  // The autoplay attribute can fire after that sweep, and the observer won't
  // re-check a video whose visibility never changed. Catch it here instead.
  vids.forEach((v) =>
    v.addEventListener("play", () => {
      if (!inView(v)) v.pause();
    })
  );

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

  const chips = document.querySelectorAll(".chip[data-filter]");
  const cards = document.querySelectorAll(".cards .card[data-status]");

  if (!chips.length || !cards.length) return;

  // Every view gets a lead item. Under "all" the four featured cards are
  // already leads; a filter can hide all of them (Complete has thirteen
  // entries and none featured), so the first survivor is promoted instead.
  // Only ever the first, so it stays adjacent to the other spanners.
  const setLead = () => {
    cards.forEach((c) => c.classList.remove("lead"));
    const shown = [...cards].filter((c) => c.style.display !== "none");
    if (shown.some((c) => c.classList.contains("featured"))) return;
    if (shown.length) shown[0].classList.add("lead");
  };

  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      const filter = chip.dataset.filter;

      chips.forEach((c) => c.classList.toggle("active", c === chip));

      cards.forEach((card) => {
        const status = card.dataset.status;
        const show = filter === "all" || status === filter;

        if (show) {
          card.style.display = "";
          // fade-in
          card.style.opacity = "0";
          card.style.transform = "translateY(8px)";
          requestAnimationFrame(() => {
            card.style.transition =
              "opacity 280ms cubic-bezier(.22,1,.36,1), transform 280ms cubic-bezier(.22,1,.36,1)";
            card.style.opacity = "";
            card.style.transform = "";
          });
        } else {
          card.style.display = "none";
        }
      });

      setLead();
    });
  });
});

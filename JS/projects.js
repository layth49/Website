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

  const chips = document.querySelectorAll(".chip[data-filter]");
  const cards = document.querySelectorAll(".cards .card[data-status]");

  if (!chips.length || !cards.length) return;

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
    });
  });
});

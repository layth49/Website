const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".hackedEffect").forEach((link) => {
    // Set data-value to link text if not already set
    if (!link.dataset.value) {
      link.dataset.value = link.innerText;
    }

    // Each element owns its timer. One shared interval meant hovering a second
    // link cleared the first one's, leaving it stuck half-scrambled.
    let interval = null;

    link.onmouseover = () => {
      const value = link.dataset.value;
      let iteration = 0;

      // Lock the settled width before scrambling. The nav is monospaced so it
      // never moved, but the hero name is set in a proportional display face and
      // random letters have different advances, so the word would visibly wobble.
      // Measured on first hover, by which point webfonts have loaded.
      if (!link.style.width) {
        link.style.display = "inline-block";
        link.style.width = link.getBoundingClientRect().width + "px";
      }

      clearInterval(interval);

      interval = setInterval(() => {
        // Always rebuild from the real text, never from the scrambled copy
        // that's currently on screen.
        link.innerText = value
          .split("")
          .map((letter, index) =>
            index < iteration
              ? value[index]
              : letters[Math.floor(Math.random() * 26)]
          )
          .join("");

        if (iteration >= value.length) {
          clearInterval(interval);
          interval = null;
          link.innerText = value; // guarantee it lands on the real text
        }

        iteration += 1 / 3;
      }, 50);
    };
  });
});

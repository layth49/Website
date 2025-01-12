const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

let interval = null;

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".hackedEffect").forEach((link) => {
    // Set data-value to link text if not already set
    if (!link.dataset.value) {
      link.dataset.value = link.innerText;
    }

    link.onmouseover = (event) => {
      let iteration = 0;

      clearInterval(interval);

      interval = setInterval(() => {
        const value = event.target.dataset.value || event.target.innerText; // Fallback
        
        event.target.innerText = event.target.innerText
          .split("")
          .map((letter, index) => {
            if (index < iteration) {
              return value[index];
            }
            return letters[Math.floor(Math.random() * 26)];
          })
          .join("");

        if (iteration >= value.length) {
          clearInterval(interval);
        }

        iteration += 1 / 3;
      }, 50);
    };
  });
});
window.onload = function () {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let interval = null;
  let iteration = 0;

  const h2Element = document.querySelector("h2");

  // Initial jumbled animation on page load
  startJumbledAnimation();

  h2Element.onmouseover = (event) => {
    // Stop the jumbled animation on hover
    clearInterval(interval);

    // Start the normal animation on hover
    startNormalAnimation(event.target.dataset.value);
  };

  // Add a new function to restart the jumbled animation when the mouse stops hovering
  h2Element.onmouseout = () => {
    interval = null;
    iteration = 0;
    startJumbledAnimation();
  };

  function startJumbledAnimation() {
    interval = setInterval(() => {
      h2Element.innerText = h2Element.innerText
        .split("")
        .map(() => letters[Math.floor(Math.random() * 26)])
        .join("");
    }, 50);
  }

  function startNormalAnimation(targetValue) {
    clearInterval(interval);

    interval = setInterval(() => {
      h2Element.innerText = h2Element.innerText
        .split("")
        .map((letter, index) => {
          if (index < iteration) {
            return targetValue[index];
          }
          return letters[Math.floor(Math.random() * 26)];
        })
        .join("");

      if (iteration >= targetValue.length) {
        clearInterval(interval);
      }

      iteration += 1 / 3;
    }, 50);
  }
};

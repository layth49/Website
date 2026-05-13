window.onload = function () {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let interval = null;
  let iteration = 0;

  const animatedText = document.querySelector(".animate-text");

  // Initial jumbled animation on page load
  startJumbledAnimation();

  animatedText.onmouseover = (event) => {
    clearInterval(interval);
    startNormalAnimation(event.target.dataset.value);
  };

  animatedText.onmouseout = () => {
    interval = null;
    iteration = 0;
    startJumbledAnimation();
  };

  function startJumbledAnimation() {
    interval = setInterval(() => {
      animatedText.innerText = animatedText.innerText
        .split("")
        .map(() => letters[Math.floor(Math.random() * 26)])
        .join("");
    }, 50);
  }

  function startNormalAnimation(targetValue) {
    clearInterval(interval);

    interval = setInterval(() => {
      animatedText.innerText = animatedText.innerText
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

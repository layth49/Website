window.onload = function () {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const animatedText = document.querySelector(".animate-text");
  if (!animatedText) return;

  const targetValue = animatedText.dataset.value || animatedText.innerText;
  let iteration = 0;

  // Scramble on page load, then settle to the name. Runs once and stops.
  const interval = setInterval(() => {
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
      animatedText.innerText = targetValue;
      clearInterval(interval);
    }

    iteration += 1 / 3;
  }, 50);
};

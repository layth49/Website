const mediaItems = [...document.querySelectorAll(".mc-media")];
const visibleMedia = new Set();
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
let soloMedia = null;

function syncVideos() {
  mediaItems.forEach((media) => {
    const video = media.querySelector("video");
    const shouldPlay = document.visibilityState === "visible"
      && media.classList.contains("is-ready")
      && (soloMedia ? soloMedia === media : visibleMedia.has(media) && !reducedMotion.matches);

    if (shouldPlay) video.play().catch(() => {});
    else video.pause();
  });
}

function playSolo(media) {
  if (!media.classList.contains("is-ready")) return;
  soloMedia = media;
  media.querySelector("video").currentTime = 0;
  syncVideos();
}

function releaseSolo(media) {
  if (soloMedia !== media) return;
  soloMedia = null;
  syncVideos();
}

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.intersectionRatio >= 0.25) visibleMedia.add(entry.target);
    else {
      visibleMedia.delete(entry.target);
      releaseSolo(entry.target);
    }
  });
  syncVideos();
}, { threshold: [0, 0.25] });

mediaItems.forEach((media) => {
  const video = media.querySelector("video");

  video.addEventListener("loadeddata", () => {
    media.classList.add("is-ready");
    media.tabIndex = 0;
    syncVideos();
  });

  video.addEventListener("error", () => {
    media.classList.remove("is-ready");
    media.removeAttribute("tabindex");
    releaseSolo(media);
  });

  if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
    media.classList.add("is-ready");
    media.tabIndex = 0;
  }

  media.addEventListener("pointerenter", (event) => {
    if (event.pointerType === "mouse") playSolo(media);
  });
  media.addEventListener("pointerleave", (event) => {
    if (event.pointerType === "mouse") releaseSolo(media);
  });
  media.addEventListener("pointerup", (event) => {
    if (event.pointerType !== "touch") return;
    if (soloMedia === media) releaseSolo(media);
    else playSolo(media);
  });
  media.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    if (soloMedia === media) releaseSolo(media);
    else playSolo(media);
  });

  observer.observe(media);
});

document.addEventListener("pointerup", (event) => {
  if (event.pointerType === "touch" && !event.target.closest(".mc-media") && soloMedia) {
    releaseSolo(soloMedia);
  }
});
document.addEventListener("visibilitychange", syncVideos);
reducedMotion.addEventListener("change", syncVideos);
syncVideos();

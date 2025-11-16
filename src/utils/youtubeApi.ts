export function getSubtitlesButton() {
  return document.querySelector<HTMLButtonElement>('.ytp-subtitles-button');
}

export function getVideo() {
  return document.querySelector<HTMLVideoElement>('#player-container #ytd-player .html5-main-video');
}

export function isVideoReady() {
  const video = getVideo();
  if (!video) return false;
  return video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA;
}

export function getCaptionContainer() {
  return document.querySelector<HTMLDivElement>('#ytp-caption-window-container');
}

export function isSubtitlesEnabled() {
  return getSubtitlesButton()?.getAttribute('aria-pressed') === 'true';
}

export function enableSubtitles() {
  const btn = getSubtitlesButton();
  if(!btn) return;
  if (!isSubtitlesEnabled()) {
    btn.click();
  }
  btn.setAttribute('aria-disabled', 'true');
  btn.disabled = true;
  btn.style.opacity = "0.5";
  btn.style.cursor = "auto";
}

export function restoreSubtitlesButton() {
  const btn = getSubtitlesButton();
  if(!btn) return;
  btn.setAttribute('aria-disabled', 'false');
  btn.disabled = false;
  btn.style.opacity = "";
  btn.style.cursor = "";
}

export function hideOverlayTop() {
  const overlayTopRight = document.querySelector<HTMLDivElement>('#ytd-player .ytp-overlay-top-right');
  const overlayTopLeft = document.querySelector<HTMLDivElement>('#ytd-player .ytp-overlay-top-left');
  if (overlayTopRight) overlayTopRight.style.display = 'none';
  if (overlayTopLeft) overlayTopLeft.style.display = 'none';
}

export function showOverlayTop() {
  const overlayTopRight = document.querySelector<HTMLDivElement>('#ytd-player .ytp-overlay-top-right');
  const overlayTopLeft = document.querySelector<HTMLDivElement>('#ytd-player .ytp-overlay-top-left');
  if (overlayTopRight) overlayTopRight.style.display = 'block';
  if (overlayTopLeft) overlayTopLeft.style.display = 'block';
}

export function hideYouTubeSubtitles() {
  const container = document.querySelector<HTMLElement>('#ytp-caption-window-container');
  if (container) container.style.display = 'none';
}

export function showYouTubeSubtitles() {
  const container = document.querySelector<HTMLElement>('#ytp-caption-window-container');
  if (container) container.style.display = 'block';
}

import {atom} from 'nanostores';
import {
  enableSubtitles,
  getVideo,
  hideOverlayTop,
  hideYouTubeSubtitles,
  restoreSubtitlesButton,
  showOverlayTop,
  showYouTubeSubtitles
} from '@/utils/youtubeApi';
import {clearActiveSubtitleSegment, startSubtitleCapture, $exerciseSegment, clearSubtitle} from '@/store/subtitles';
import {
  clearActiveExerciseSegment,
  clearExercise,
  startExerciseListeners,
  stopExerciseListeners
} from '@/store/gapExercise';
import {debugLog} from "@/utils/debug.ts";

export const $exerciseActive = atom(false);

let cleanupCapture: (() => void) | null = null;
let buttonObserver: MutationObserver | null = null;
let cleanupSeekListener: (() => void) | null = null;

export function startExercise() {
  if ($exerciseActive.get()) return;

  debugLog('exercise', 'Starting exercise');
  hideOverlayTop();
  enableSubtitles();
  hideYouTubeSubtitles();
  tryStartCapture();
  watchSubtitlesButton();
  clearActiveExerciseSegment()
  startExerciseListeners();
  cleanupSeekListener = watchVideoSeeking();
  $exerciseActive.set(true);
  debugLog('exercise', 'Exercise started');
}

function tryStartCapture(attempt = 1) {
  const cleanup = startSubtitleCapture();

  if (!cleanup && attempt < 5) {
    setTimeout(() => tryStartCapture(attempt + 1), 300);
  } else {
    cleanupCapture = cleanup;
  }
}

function watchSubtitlesButton() {
  const button = document.querySelector('.ytp-subtitles-button');
  if (!button) return;

  buttonObserver = new MutationObserver(() => {
    const isEnabled = button.getAttribute('aria-pressed') === 'true';
    if (isEnabled) {
      cleanupCapture?.();
      setTimeout(() => {
        hideYouTubeSubtitles();
        tryStartCapture();
      }, 300);
    }
  });

  buttonObserver.observe(button, {attributes: true, attributeFilter: ['aria-pressed']});
}

export function stopExercise() {
  $exerciseActive.set(false);
  clearActiveExerciseSegment()
  showOverlayTop();
  cleanupCapture?.();
  cleanupCapture = null;
  buttonObserver?.disconnect();
  buttonObserver = null;
  cleanupSeekListener?.();
  cleanupSeekListener = null;
  stopExerciseListeners();
  clearExercise();
  showYouTubeSubtitles();
  restoreSubtitlesButton();
  debugLog('exercise', 'Exercise stopped');
}

function watchVideoSeeking() {
  const video = getVideo();
  if (!video) return null;

  const handleTimeJump = () => {
    const segment = $exerciseSegment.get();
    if (!segment) return;
    const tolerance = 1;
    const segStart = segment.startTime ?? 0;
    const segEnd = segment.endTime ?? segStart;
    const current = video.currentTime;
    if (current < segStart - tolerance || current > segEnd + tolerance) {
      clearActiveExerciseSegment();
      clearSubtitle();
      clearActiveSubtitleSegment();
      clearExercise();
    }
  };
  video.addEventListener('seeking', handleTimeJump);

  return () => {
    video.removeEventListener('seeking', handleTimeJump);
  };
}

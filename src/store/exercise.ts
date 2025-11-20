import {atom} from 'nanostores';
import {
  enableSubtitles,
  hideOverlayTop,
  hideYouTubeSubtitles,
  restoreSubtitlesButton,
  showOverlayTop,
  showYouTubeSubtitles
} from '@/utils/youtubeApi';
import {setExerciseSegment, startSubtitleCapture} from '@/store/subtitles';
import {
  clearActiveExerciseSegment,
  clearExercise,
  requestSkipNextSegment,
  startExerciseListeners,
  stopExerciseListeners
} from '@/store/gapExercise';
import {debugLog} from "@/utils/debug.ts";
import {getVideo} from "@/utils/youtubeApi";
import {isReplaySessionActive} from "@/store/replayState.ts";

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
  requestSkipNextSegment();
  tryStartCapture();
  watchSubtitlesButton();
  setExerciseSegment(null);
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
  showOverlayTop();
  cleanupCapture?.();
  cleanupCapture = null;
  buttonObserver?.disconnect();
  buttonObserver = null;
  cleanupSeekListener?.();
  cleanupSeekListener = null;
  stopExerciseListeners();
  $exerciseActive.set(false);
  clearExercise();
  showYouTubeSubtitles();
  restoreSubtitlesButton();
  debugLog('exercise', 'Exercise stopped');
}

function watchVideoSeeking() {
  const video = getVideo();
  if (!video) return null;

  let ignoreNextPlay = false;
  const markSkip = () => {
    ignoreNextPlay = true;
    requestSkipNextSegment();
  };

  const handlePlay = () => {
    if (isReplaySessionActive()) {
      return;
    }
    if (ignoreNextPlay) {
      ignoreNextPlay = false;
      return;
    }
    clearActiveExerciseSegment();
  };

  video.addEventListener('seeking', markSkip);
  video.addEventListener('play', handlePlay);

  return () => {
    video.removeEventListener('seeking', markSkip);
    video.removeEventListener('play', handlePlay);
  };
}

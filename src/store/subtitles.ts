import {atom} from 'nanostores';
import {processText, WordToken} from "@/utils/wordProcessor.ts";
import {getCaptionContainer, getVideo} from "@/utils/youtubeApi.ts";
import {debugLog, formatTime} from "@/utils/debug.ts";
import {endReplaySession, startReplaySession} from "@/store/replayState.ts";

export type Segment = {
  id: string;
  text: string;
  startTime: number;
  endTime?: number;
};

// Active segment - the one currently being filled with words by YouTube
export const $activeSegment = atom<Segment | null>(null);

// Previous completed segment - stored for replay functionality
export const $previousSegment = atom<Segment | null>(null);

// Currently displayed segment in exercise panel
export const $exerciseSegment = atom<Segment | null>(null);

export const $tokens = atom<WordToken[]>([]);

export function setExerciseSegment(segment: Segment | null, tokens?: WordToken[]) {
  $exerciseSegment.set(segment);
  if (segment) {
    debugLog('store', 'Exercise segment set', {
      segmentId: segment.id,
      text: segment.text,
      start: formatTime(segment.startTime),
      end: formatTime(segment.endTime)
    });
    $tokens.set(tokens ?? processText(segment.text, segment.id));
  } else {
    debugLog('store', 'Exercise segment cleared');
    $tokens.set([]);
  }
}

let currentObserver: MutationObserver | null = null;
let lastSegmentElement: Element | null = null;
let lastSegmentText = '';
let replayTimeUpdateHandler: ((e: Event) => void) | null = null;
const textStartTimes = new Map<string, number>();

function normalizeSegmentText(text: string) {
  return text.trim().replace(/\s+/g, ' ');
}

function getTextKey(text: string) {
  const normalized = normalizeSegmentText(text).toLowerCase();
  return normalized || null;
}

function rememberStartTime(text: string, fallback: number) {
  const key = getTextKey(text);
  if (!key) return fallback;
  const known = textStartTimes.get(key);
  if (known === undefined || fallback < known) {
    textStartTimes.set(key, fallback);
    return fallback;
  }
  return known;
}

function getRememberedStartTime(text: string, fallback: number) {
  const key = getTextKey(text);
  if (!key) return fallback;
  return textStartTimes.get(key) ?? fallback;
}

export function clearRememberedStart(text: string) {
  const key = getTextKey(text);
  if (!key) return;
  textStartTimes.delete(key);
}

function buildSegmentId(startTime: number) {
  return `segment-${Math.round(startTime * 1000)}`;
}

export function startSubtitleCapture() {
  return startDomObserverCapture();
}

function startDomObserverCapture() {
  const container = getCaptionContainer();
  if (!container) {
    console.warn('Caption container not found');
    return null;
  }

  debugLog('subtitles', 'Starting subtitle capture');

  currentObserver = new MutationObserver(() => {
    const segments = container.querySelectorAll('.ytp-caption-segment');
    if (segments.length === 0) {
      debugLog('subtitles', 'No caption segments found in DOM');
      return;
    }

    // YouTube always shows last 2 segments: [previous, active]
    const latestSegment = segments[segments.length - 1];
    const currentText = latestSegment.textContent?.trim() || '';
    const video = getVideo();
    const currentTime = video?.currentTime ?? 0;
    const elementRecreated = latestSegment !== lastSegmentElement;
    const textChanged = currentText !== lastSegmentText;

    debugLog('subtitles', 'DOM update', {
      segments: segments.length,
      elementRecreated,
      textChanged,
      text: currentText
    });

    // New active segment detected
    if (elementRecreated && textChanged) {
      const prevActive = $activeSegment.get();

      // If there was an active segment, move it to previous
      if (prevActive) {
        const safeEndTime = Math.max(currentTime, prevActive.startTime);
        const rememberedStart = rememberStartTime(prevActive.text, prevActive.startTime);
        const completedSegment: Segment = {
          ...prevActive,
          id: buildSegmentId(rememberedStart),
          startTime: rememberedStart,
          endTime: safeEndTime
        };
        debugLog('subtitles', 'Segment completed', {
          segmentId: completedSegment.id,
          text: completedSegment.text,
          start: formatTime(completedSegment.startTime),
          end: formatTime(completedSegment.endTime)
        });
        $previousSegment.set(completedSegment);
      }

      // Create new active segment
      const rememberedStart = rememberStartTime(currentText, currentTime);
      const newSegment: Segment = {
        id: buildSegmentId(rememberedStart),
        text: currentText,
        startTime: rememberedStart
      };

      debugLog('subtitles', 'New active segment', {
        segmentId: newSegment.id,
        text: newSegment.text,
        start: formatTime(newSegment.startTime)
      });
      $activeSegment.set(newSegment);
      lastSegmentElement = latestSegment;
      lastSegmentText = currentText;
    }
    // Update text of active segment as YouTube streams words
    else if (!elementRecreated && textChanged) {
      const activeSegment = $activeSegment.get();
      if (activeSegment) {
        debugLog('subtitles', 'Active segment text updated', {
          segmentId: activeSegment.id,
          text: currentText
        });
        $activeSegment.set({
          ...activeSegment,
          text: currentText
        });
        lastSegmentText = currentText;
      }
    }
    // YouTube sometimes recreates the element with the same text - treat as the same segment
    else if (elementRecreated && !textChanged) {
      debugLog('subtitles', 'Element recreated with same text (ignored)', currentText);
      lastSegmentElement = latestSegment;
    }
  });

  currentObserver.observe(container, {
    childList: true,
    subtree: true,
    characterData: true
  });

  return () => {
    currentObserver?.disconnect();
    currentObserver = null;
    lastSegmentElement = null;
    lastSegmentText = '';
    debugLog('subtitles', 'Stopped subtitle capture');
  };
}

export function startReplayMode(segmentId: string) {
  const video = getVideo();
  if (!video) {
    console.warn('Video element not found');
    return;
  }
  // Find segment to replay (prefer the one currently displayed in the exercise panel)
  const exerciseSegmentState = $exerciseSegment.get();
  const activeSegment = $activeSegment.get();
  const previousSegment = $previousSegment.get();

  const segment =
    exerciseSegmentState?.id === segmentId ? exerciseSegmentState :
      activeSegment?.id === segmentId ? activeSegment :
        previousSegment?.id === segmentId ? previousSegment :
          null;

  if (!segment) {
    console.warn('Cannot replay: segment not found');
    return;
  }

  const replayEndTime = segment.endTime ?? video.currentTime;
  const segmentStart = getRememberedStartTime(segment.text, segment.startTime);

  if (replayEndTime <= segmentStart) {
    console.warn('Cannot replay: segment missing end time information');
    return;
  }

  const replayStartTime = Math.max(segmentStart, 0);

  debugLog('replay', 'Replaying segment', {
    segmentId,
    text: segment.text,
    start: formatTime(replayStartTime),
    end: formatTime(replayEndTime)
  });

  // Clean up existing listener
  if (replayTimeUpdateHandler) {
    video.removeEventListener('timeupdate', replayTimeUpdateHandler);
  }

  replayTimeUpdateHandler = () => {
    if (video.currentTime >= replayEndTime) {
      debugLog('replay', 'Replay completed, pausing video', {
        segmentId,
        text: segment.text
      });
      video.pause();
      endReplaySession();

      if (replayTimeUpdateHandler) {
        video.removeEventListener('timeupdate', replayTimeUpdateHandler);
        replayTimeUpdateHandler = null;
      }
    }
  };

  const exerciseSegment: Segment = {...segment};
  setExerciseSegment(exerciseSegment);

  video.addEventListener('timeupdate', replayTimeUpdateHandler);
  video.currentTime = replayStartTime;
  startReplaySession();
  video.play().catch(() => console.warn('Video play failed'));
}

export function clearSubtitle() {
  $activeSegment.set(null);
  $previousSegment.set(null);
  setExerciseSegment(null);
  lastSegmentElement = null;
  lastSegmentText = '';
  textStartTimes.clear();
  debugLog('subtitles', 'Cleared subtitle stores');

  // Clean up replay listener
  if (replayTimeUpdateHandler) {
    const video = getVideo();
    if (video) {
      video.removeEventListener('timeupdate', replayTimeUpdateHandler);
    }
    replayTimeUpdateHandler = null;
  }
}

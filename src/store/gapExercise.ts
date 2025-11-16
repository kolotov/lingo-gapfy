import {atom, computed} from 'nanostores';
import {
  $exerciseSegment,
  $previousSegment,
  $tokens,
  setExerciseSegment,
  skipNextSubtitleCompletion,
  startReplayMode
} from './subtitles';
import {getVideo} from "@/utils/youtubeApi.ts";
import {processText} from "@/utils/wordProcessor.ts";
import {debugLog} from "@/utils/debug.ts";

type GapStatus = 'default' | 'correct' | 'error';

// Store statuses: { [segmentId]: { [gapIndex]: status } }
export const $gapStatuses = atom<Record<string, Record<number, GapStatus>>>({});

export function validateGap(segmentId: string, index: number, word: string, correctWord: string): boolean {
  const isCorrect = word.toLowerCase().trim() === correctWord.toLowerCase();

  const allStatuses = $gapStatuses.get();
  const segmentStatuses = allStatuses[segmentId] || {};

  $gapStatuses.set({
    ...allStatuses,
    [segmentId]: {
      ...segmentStatuses,
      [index]: isCorrect ? 'correct' : 'error'
    }
  });

  // Replay on error
  if (!isCorrect) {
    debugLog('replay', 'Gap validation failed, replaying segment', {segmentId, index});
    startReplayMode(segmentId);
  }

  return isCorrect;
}

export function resetGapStatus(segmentId: string, index: number) {
  const allStatuses = $gapStatuses.get();
  const segmentStatuses = allStatuses[segmentId] || {};

  $gapStatuses.set({
    ...allStatuses,
    [segmentId]: {
      ...segmentStatuses,
      [index]: 'default'
    }
  });
}

export function clearExercise() {
  $gapStatuses.set({});
}

export const $allGapsCompleted = computed(
  [$gapStatuses, $tokens, $exerciseSegment],
  (allStatuses, tokens, segment) => {
    if (!segment) return false;

    const gapTokens = tokens.filter((t: { type: string; }) => t.type === 'gap');
    if (gapTokens.length === 0) return false;

    const segmentStatuses = allStatuses[segment.id] || {};
    const completedCount = Object.values(segmentStatuses).filter(s => s === 'correct').length;
    return completedCount === gapTokens.length;
  }
);

let segmentChangeUnsubscribe: (() => void) | null = null;
let allGapsCompletedUnsubscribe: (() => void) | null = null;
let lastPausedSegmentId: string | null = null;

export function requestSkipNextSegment() {
  skipNextSubtitleCompletion();
}

export function clearActiveExerciseSegment() {
  if ($exerciseSegment.get()) {
    setExerciseSegment(null);
  }
}

export function startExerciseListeners() {
  // Pause when a completed segment becomes available (YouTube moved on to the next one)
  segmentChangeUnsubscribe = $previousSegment.listen((segment) => {
    if (!segment) return;

    if (segment.id === lastPausedSegmentId) {
      debugLog('exercise', 'Segment already handled, skipping', segment.id);
      return;
    }

    const tokens = processText(segment.text, segment.id);
    const gapTokens = tokens.filter(t => t.type === 'gap');

    // No gaps - nothing to do
    if (gapTokens.length === 0) {
      debugLog('exercise', 'No gaps in segment, skipping pause', segment.text);
      return;
    }

    const segmentStatuses = $gapStatuses.get()[segment.id] || {};
    const hasPendingGaps = gapTokens.some(token => segmentStatuses[token.index] !== 'correct');

    if (!hasPendingGaps) {
      debugLog('exercise', 'All gaps already completed, skipping pause', segment.text);
      return;
    }

    setExerciseSegment(segment, tokens);

    // Completed segment ready for exercise - pause playback
    debugLog('exercise', 'Completed segment ready, pausing video', {
      segmentId: segment.id,
      text: segment.text
    });
    const video = getVideo();
    video?.pause();

    lastPausedSegmentId = segment.id;
  });

  // Resume when all gaps completed
  allGapsCompletedUnsubscribe = $allGapsCompleted.listen((allCompleted) => {
    if (allCompleted) {
      debugLog('exercise', 'All gaps completed, resuming playback');
      const video = getVideo();
      video?.play();
    }
  });
}

export function stopExerciseListeners() {
  segmentChangeUnsubscribe?.();
  allGapsCompletedUnsubscribe?.();
  segmentChangeUnsubscribe = null;
  allGapsCompletedUnsubscribe = null;
  lastPausedSegmentId = null;
  debugLog('exercise', 'Exercise listeners stopped');
}

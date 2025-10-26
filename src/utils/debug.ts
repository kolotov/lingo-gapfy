const DEBUG_ENABLED = false;

type DebugCategory =
  | 'subtitles'
  | 'exercise'
  | 'replay'
  | 'video'
  | 'store';

export function debugLog(category: DebugCategory, ...args: unknown[]) {
  if (!DEBUG_ENABLED) return;
  console.log(`[lingo-gapfy:${category}]`, ...args);
}

export function formatTime(seconds: number | undefined) {
  if (seconds == null) return '-';
  return `${seconds.toFixed(3)}s`;
}

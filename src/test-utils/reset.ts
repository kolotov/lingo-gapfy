import {vi} from 'vitest';
import {clearSubtitle} from '@/store/subtitles';
import {clearExercise} from '@/store/gapExercise';
import {endReplaySession} from '@/store/replayState';

export function resetTestEnvironment(): void {
  vi.clearAllTimers();
  clearSubtitle();
  clearExercise();
  endReplaySession();
}

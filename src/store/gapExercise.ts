import {atom, computed} from 'nanostores';

type GapStatus = 'default' | 'correct' | 'error';

export const $gapStatuses = atom<Map<number, GapStatus>>(new Map());
export const $completedGaps = atom<Set<number>>(new Set());

export function validateGap(index: number, word: string, correctWord: string): boolean {
  const isCorrect = word.toLowerCase().trim() === correctWord.toLowerCase();

  const statuses = new Map($gapStatuses.get());
  statuses.set(index, isCorrect ? 'correct' : 'error');
  $gapStatuses.set(statuses);

  if (isCorrect) {
    const completed = new Set($completedGaps.get());
    completed.add(index);
    $completedGaps.set(completed);
  }

  return isCorrect;
}

export function resetGapStatus(index: number) {
  const statuses = new Map($gapStatuses.get());
  statuses.set(index, 'default');
  $gapStatuses.set(statuses);
}

export function clearExercise() {
  $gapStatuses.set(new Map());
  $completedGaps.set(new Set());
}

export const $allGapsCompleted = computed(
  [$completedGaps],
  (completed) => completed.size
);

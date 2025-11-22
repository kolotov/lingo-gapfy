import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest';
import {
  $allGapsCompleted,
  $gapStatuses,
  resetGapStatus,
  startExerciseListeners,
  stopExerciseListeners,
  validateGap,
  clearActiveExerciseSegment,
  clearExercise
} from '@/store/gapExercise';
import {startReplaySession, endReplaySession} from '@/store/replayState';
import {processText} from '@/utils/wordProcessor';
import * as youtubeApi from '@/utils/youtubeApi.ts';
import {createMockVideo, MockVideoElement} from '@/test-utils/createMockVideo';
import * as subtitlesModule from './subtitles';
import {$exerciseSegment, $previousSegment, setExerciseSegment, $tokens} from './subtitles';

let video: MockVideoElement;
let startReplayModeSpy: ReturnType<typeof vi.spyOn>;
let videoSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  vi.clearAllMocks();
  video = createMockVideo();
  videoSpy = vi.spyOn(youtubeApi, 'getVideo').mockReturnValue(video);
  startReplayModeSpy = vi.spyOn(subtitlesModule, 'startReplayMode').mockImplementation(() => {});
});

afterEach(() => {
  stopExerciseListeners();
  endReplaySession();
  startReplayModeSpy.mockRestore();
  videoSpy.mockRestore();
});

describe('validateGap', () => {
  test('validates gap as correct when input matches word case-insensitively', () => {
    // Act
    const result = validateGap('segment-1', 0, ' Word ', 'word');

    // Assert
    expect(result).toBe(true);
    expect($gapStatuses.get()['segment-1'][0]).toBe('correct');
  });

  test('marks gap as error when input mismatches and triggers replay', () => {
    // Act
    const result = validateGap('segment-2', 1, 'wrong', 'word');

    // Assert
    expect(result).toBe(false);
    expect($gapStatuses.get()['segment-2'][1]).toBe('error');
    expect(startReplayModeSpy).toHaveBeenCalledWith('segment-2');
  });
});

describe('resetGapStatus', () => {
  test('resets gap status to default after error', () => {
    // Arrange
    validateGap('segment-3', 0, 'wrong', 'word');

    // Act
    resetGapStatus('segment-3', 0);

    // Assert
    expect($gapStatuses.get()['segment-3'][0]).toBe('default');
  });

  test('clears all gap statuses with clearExercise', () => {
    // Arrange
    $gapStatuses.set({
      'segment-clear': {
        0: 'correct',
        1: 'error'
      }
    });

    // Act
    clearExercise();

    // Assert
    expect($gapStatuses.get()).toEqual({});
  });
});

describe('$allGapsCompleted', () => {
  test('returns true when every gap is marked correct', () => {
    // Arrange
    const segment = {id: 'segment-4', text: 'one two three four', startTime: 0};
    const tokens = processText(segment.text, segment.id);
    setExerciseSegment(segment, tokens);
    $gapStatuses.set({
      [segment.id]: {
        0: 'correct',
        1: 'correct'
      }
    });

    // Act
    const completed = $allGapsCompleted.get();

    // Assert
    expect(completed).toBe(true);
  });

  test.each([
    {label: 'no exercise segment', segment: null},
    {label: 'gap statuses missing', segment: {id: 'segment-4b', text: 'one two three four', startTime: 0}}
  ])('returns false when $label', ({segment}) => {
    // Arrange
    if (segment) {
      const tokens = processText(segment.text, segment.id);
      setExerciseSegment(segment, tokens);
      $gapStatuses.set({[segment.id]: {0: 'correct'}});
    }

    // Act
    const completed = $allGapsCompleted.get();

    // Assert
    expect(completed).toBe(false);
  });
});

describe('startExerciseListeners', () => {
  test('pauses video when previous segment has pending gaps', () => {
    // Arrange
    startExerciseListeners();
    const segment = {id: 'segment-5', text: 'one two three four', startTime: 0, endTime: 5};

    // Act
    $previousSegment.set(segment);

    // Assert
    expect(video.pause).toHaveBeenCalledTimes(1);
    expect($exerciseSegment.get()?.id).toBe('segment-5');
  });

  test('skips pause when segment has no gaps', () => {
    // Arrange
    startExerciseListeners();
    const segment = {id: 'segment-6', text: 'a be to', startTime: 0, endTime: 2};

    // Act
    $previousSegment.set(segment);

    // Assert
    expect(video.pause).not.toHaveBeenCalled();
    expect($exerciseSegment.get()).toBeNull();
  });

  test('skips handling when segment already paused previously', () => {
    // Arrange
    startExerciseListeners();
    const segment = {id: 'segment-5-repeat', text: 'one two three four', startTime: 0, endTime: 5};

    // Act
    $previousSegment.set(segment);
    $previousSegment.set({...segment});

    // Assert
    expect(video.pause).toHaveBeenCalledTimes(1);
  });

  test('skips pause when all gaps already correct', () => {
    // Arrange
    $gapStatuses.set({
      'segment-7': {
        0: 'correct'
      }
    });
    startExerciseListeners();
    const segment = {id: 'segment-7', text: 'one two three', startTime: 0, endTime: 3};

    // Act
    $previousSegment.set(segment);

    // Assert
    expect(video.pause).not.toHaveBeenCalled();
    expect($exerciseSegment.get()).toBeNull();
  });

  test('ignores segment updates during replay when segment differs', () => {
    // Arrange
    const exerciseSegment = {id: 'segment-8', text: 'keep', startTime: 0};
    setExerciseSegment(exerciseSegment);
    startReplaySession();
    startExerciseListeners();
    const incoming = {id: 'segment-9', text: 'new line two three', startTime: 1, endTime: 2};

    // Act
    $previousSegment.set(incoming);

    // Assert
    expect($exerciseSegment.get()?.id).toBe('segment-8');
    expect(video.pause).not.toHaveBeenCalled();
  });

  test('reuses replay segment without pausing when ids match', () => {
    // Arrange
    const segment = {id: 'segment-8b', text: 'one two three', startTime: 0};
    setExerciseSegment(segment);
    startReplaySession();
    startExerciseListeners();

    // Act
    $previousSegment.set({...segment, endTime: 1});

    // Assert
    expect(video.pause).not.toHaveBeenCalled();
  });

  test('resumes playback when all gaps become completed', () => {
    // Arrange
    startExerciseListeners();
    const segment = {id: 'segment-10', text: 'one two three four', startTime: 0, endTime: 4};
    $previousSegment.set(segment);
    const tokens = $tokens.get();
    const gapIndexes = tokens.filter(token => token.type === 'gap').map(token => token.index);
    const statuses: Record<number, 'correct' | 'default' | 'error'> = {};
    gapIndexes.forEach(index => {
      statuses[index] = 'correct';
    });

    // Act
    $gapStatuses.set({[segment.id]: statuses});

    // Assert
    expect(video.play).toHaveBeenCalledTimes(1);
  });

  test('clears active exercise segment when requested', () => {
    // Arrange
    const segment = {id: 'segment-clear', text: 'one two', startTime: 0};
    setExerciseSegment(segment);

    // Act
    clearActiveExerciseSegment();

    // Assert
    expect($exerciseSegment.get()).toBeNull();
  });

  test('attaches catch handler when play promise rejects', async () => {
    // Arrange
    let rejectPlay: (reason?: unknown) => void = () => {};
    const rejection = new Promise<never>((_, reject) => {
      rejectPlay = reject;
    });
    const catchSpy = vi.spyOn(rejection, 'catch');
    const failingVideo = createMockVideo();
    failingVideo.play.mockReturnValue(rejection as Promise<void>);
    videoSpy.mockReturnValue(failingVideo);
    startExerciseListeners();
    const segment = {id: 'segment-11', text: 'one two three four', startTime: 0, endTime: 4};
    $previousSegment.set(segment);
    const tokens = $tokens.get();
    const gapIndexes = tokens.filter(token => token.type === 'gap').map(token => token.index);
    const statuses: Record<number, 'correct' | 'default' | 'error'> = {};
    gapIndexes.forEach(index => {
      statuses[index] = 'correct';
    });

    // Act
    $gapStatuses.set({[segment.id]: statuses});
    rejectPlay(new Error('no interaction'));
    await rejection.catch(() => {});

    // Assert
    expect(failingVideo.play).toHaveBeenCalled();
    expect(catchSpy).toHaveBeenCalledWith(expect.any(Function));
  });

  test('keeps partial gap completions when moving to next segment', () => {
    // Arrange
    startExerciseListeners();
    const segment = {id: 'segment-12', text: 'one two three four five', startTime: 0, endTime: 5};
    $previousSegment.set(segment);
    const tokens = $tokens.get();
    const gapIndexes = tokens.filter(token => token.type === 'gap').map(token => token.index);
    const statuses: Record<number, 'correct' | 'default' | 'error'> = {};
    statuses[gapIndexes[0]] = 'correct';
    statuses[gapIndexes[1]] = 'correct';
    $gapStatuses.set({[segment.id]: statuses});

    // Act
    const nextSegment = {id: 'segment-13', text: 'next line here', startTime: 6, endTime: 8};
    $previousSegment.set(nextSegment);

    // Assert
    const storedStatuses = $gapStatuses.get()[segment.id];
    expect(storedStatuses[gapIndexes[0]]).toBe('correct');
    expect(storedStatuses[gapIndexes[1]]).toBe('correct');
    expect($exerciseSegment.get()?.id).toBe('segment-13');
  });
});

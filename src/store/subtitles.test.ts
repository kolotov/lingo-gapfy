import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest';
import {
  $activeSegment,
  $exerciseSegment,
  $previousSegment,
  clearSubtitle,
  $tokens,
  setExerciseSegment,
  startReplayMode,
  startSubtitleCapture
} from '@/store/subtitles';
import {isReplaySessionActive, startReplaySession} from '@/store/replayState';
import * as youtubeApi from '@/utils/youtubeApi.ts';
import {createMockVideo} from '@/test-utils/createMockVideo';
import {createCaptionDOM} from '@/test-utils/captionDom';

let cleanupObserver: (() => void) | null = null;
let captionSpy: ReturnType<typeof vi.spyOn>;
let videoSpy: ReturnType<typeof vi.spyOn>;
let triggerObservers: () => void;

beforeEach(() => {
  vi.clearAllMocks();
  captionSpy = vi.spyOn(youtubeApi, 'getCaptionContainer');
  videoSpy = vi.spyOn(youtubeApi, 'getVideo');
  cleanupObserver = null;
  const defaultContainer = document.createElement('div');
  captionSpy.mockReturnValue(defaultContainer);
  videoSpy.mockReturnValue(createMockVideo());

  const callbacks = new Set<MutationCallback>();
  triggerObservers = () => {
    const observer: MutationObserver = {
      observe: vi.fn(),
      disconnect: vi.fn(),
      takeRecords: vi.fn((): MutationRecord[] => [])
    };
    callbacks.forEach(cb => cb([], observer));
  };

  class TestMutationObserver implements MutationObserver {
    observe = vi.fn();
    disconnect = vi.fn(() => callbacks.delete(this.callback));
    takeRecords = vi.fn((): MutationRecord[] => []);
    private callback: MutationCallback;

    constructor(callback: MutationCallback) {
      this.callback = callback;
      callbacks.add(callback);
    }
  }

  vi.stubGlobal('MutationObserver', TestMutationObserver);
});

afterEach(() => {
  cleanupObserver?.();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('startSubtitleCapture', () => {
  test('returns null when container missing', () => {
    // Arrange
    captionSpy.mockReturnValue(null);

    // Act
    const cleanup = startSubtitleCapture();

    // Assert
    expect(cleanup).toBeNull();
  });

  test('sets new active segment when latest element is recreated with new text', () => {
    // Arrange
    const {container, addSegment} = createCaptionDOM();
    captionSpy.mockReturnValue(container);

    const video = createMockVideo(1.234);
    videoSpy.mockReturnValue(video);

    cleanupObserver = startSubtitleCapture();
    addSegment('First line');

    // Act
    triggerObservers();

    // Assert
    const active = $activeSegment.get();
    expect(active?.text).toBe('First line');
    expect(active?.startTime).toBeCloseTo(1.234);
    expect(active?.id).toBe('segment-1234');
  });

  test('updates active segment text when element is reused with changed content', () => {
    // Arrange
    const {container, addSegment} = createCaptionDOM();
    captionSpy.mockReturnValue(container);

    const video = createMockVideo(5);
    videoSpy.mockReturnValue(video);

    cleanupObserver = startSubtitleCapture();
    const segment = addSegment('Initial');
    triggerObservers();

    // Act
    segment.textContent = 'Updated text';
    video.currentTime = 7;
    triggerObservers();

    // Assert
    expect($activeSegment.get()?.text).toBe('Updated text');
    expect($activeSegment.get()?.startTime).toBe(5);
  });

  test('ignores DOM updates when replay session is active', () => {
    // Arrange
    const container = document.createElement('div');
    const bottom = document.createElement('div');
    bottom.className = 'ytp-caption-window-bottom';
    container.appendChild(bottom);
    captionSpy.mockReturnValue(container);

    const video = createMockVideo(3);
    videoSpy.mockReturnValue(video);
    startReplaySession();

    cleanupObserver = startSubtitleCapture();
    const segment = document.createElement('div');
    segment.className = 'ytp-caption-segment';
    segment.textContent = 'Replay should ignore';
    bottom.appendChild(segment);

    // Act
    triggerObservers();

    // Assert
    expect($activeSegment.get()).toBeNull();
  });

  test('moves previous active segment to previous store when new element appears', () => {
    // Arrange
    const {container, addSegment} = createCaptionDOM();
    captionSpy.mockReturnValue(container);

    const video = createMockVideo(10);
    videoSpy.mockReturnValue(video);

    cleanupObserver = startSubtitleCapture();
    addSegment('First line');
    triggerObservers();

    addSegment('Second line');
    video.currentTime = 12;

    // Act
    triggerObservers();

    // Assert
    expect($previousSegment.get()).toEqual({
      id: 'segment-10000',
      text: 'First line',
      startTime: 10,
      endTime: 12
    });
    expect($activeSegment.get()?.text).toBe('Second line');
  });

  test('handles rapid sequence of three segments updating previous correctly', () => {
    // Arrange
    const {container, addSegment} = createCaptionDOM();
    captionSpy.mockReturnValue(container);

    const video = createMockVideo(1);
    videoSpy.mockReturnValue(video);

    cleanupObserver = startSubtitleCapture();

    addSegment('First line');
    triggerObservers();

    addSegment('Second line');
    video.currentTime = 2;
    triggerObservers();

    addSegment('Third line');
    video.currentTime = 3;

    // Act
    triggerObservers();

    // Assert
    const previous = $previousSegment.get();
    expect(previous?.text).toBe('Second line');
    expect(previous?.startTime).toBeCloseTo(2);
    expect(previous?.endTime).toBeCloseTo(3);
    expect(previous?.id).toBe('segment-2000');
    expect($activeSegment.get()?.text).toBe('Third line');
  });

  test('ignores recreated element with same text without updating segment', () => {
    // Arrange
    const {container, addSegment} = createCaptionDOM();
    captionSpy.mockReturnValue(container);

    const video = createMockVideo(2);
    videoSpy.mockReturnValue(video);

    cleanupObserver = startSubtitleCapture();
    addSegment('Same text');
    triggerObservers();

    const initialActive = $activeSegment.get();

    addSegment('Same text');

    // Act
    triggerObservers();

    // Assert
    expect($activeSegment.get()).toEqual(initialActive);
    expect($previousSegment.get()).toBeNull();
  });

  test('uses remembered earliest start time when same text reappears with extra spaces', () => {
    // Arrange
    const {container, addSegment} = createCaptionDOM();
    captionSpy.mockReturnValue(container);

    const video = createMockVideo(5);
    videoSpy.mockReturnValue(video);

    cleanupObserver = startSubtitleCapture();
    addSegment('Repeat line');
    triggerObservers();

    addSegment('Repeat   line');
    video.currentTime = 7;

    // Act
    triggerObservers();

    // Assert
    const active = $activeSegment.get();
    expect(active?.startTime).toBeCloseTo(5);
    expect(active?.id).toBe('segment-5000');
  });

  test('assigns negative start time id when video time is before zero', () => {
    // Arrange
    const {container, addSegment} = createCaptionDOM();
    captionSpy.mockReturnValue(container);
    const video = createMockVideo(-2);
    videoSpy.mockReturnValue(video);

    // Act
    cleanupObserver = startSubtitleCapture();
    addSegment('Negative start');
    triggerObservers();

    // Assert
    const active = $activeSegment.get();
    expect(active?.startTime).toBe(-2);
    expect(active?.id).toBe('segment--2000');
  });
});

describe('startReplayMode', () => {
  test('starts replay with lead-in when exercise segment is present', async () => {
    // Arrange
    const segment = {id: 'segment-2000', text: 'Replay me', startTime: 2, endTime: 5};
    setExerciseSegment(segment);
    const video = createMockVideo(6);
    videoSpy.mockReturnValue(video);

    // Act
    await startReplayMode(segment.id);

    // Assert
    expect(video.currentTime).toBeCloseTo(1.5);
    expect(video.play).toHaveBeenCalledTimes(1);
    expect(video.addEventListener).toHaveBeenCalledWith('timeupdate', expect.any(Function));
  });

  test('uses remembered minimal start time when replaying normalized text variant', async () => {
    // Arrange
    const {container, addSegment} = createCaptionDOM();
    captionSpy.mockReturnValue(container);

    const video = createMockVideo(4);
    videoSpy.mockReturnValue(video);

    cleanupObserver = startSubtitleCapture();
    addSegment('  Repeat   me ');
    triggerObservers();

    const replaySegment = {id: 'segment-9000', text: 'repeat me', startTime: 9, endTime: 11};
    setExerciseSegment(replaySegment);

    // Act
    await startReplayMode(replaySegment.id);

    // Assert
    expect(video.currentTime).toBeCloseTo(3.5);
  });

  test('pauses playback and ends session when replay reaches end time', async () => {
    // Arrange
    const segment = {id: 'segment-3000', text: 'Replay end', startTime: 1, endTime: 3};
    setExerciseSegment(segment);
    const video = createMockVideo(3, {timeupdate: true});
    videoSpy.mockReturnValue(video);

    await startReplayMode(segment.id);

    // Act
    video.currentTime = 3;
    video.triggerTimeUpdate?.();

    // Assert
    expect(video.pause).toHaveBeenCalled();
    expect(video.removeEventListener).toHaveBeenCalledWith('timeupdate', expect.any(Function));
    expect(isReplaySessionActive()).toBe(false);
  });

  test('throws when start time is invalid', () => {
    // Arrange
    const segment = {id: 'segment-invalid', text: 'Bad start', startTime: Number.NaN, endTime: 2};
    setExerciseSegment(segment);
    const video = createMockVideo(0);
    let current = 0;
    Object.defineProperty(video, 'currentTime', {
      get: () => current,
      set: (value: number) => {
        if (!Number.isFinite(value)) throw new TypeError('invalid time');
        current = value;
      },
      configurable: true
    });
    videoSpy.mockReturnValue(video);

    // Act
    expect(() => startReplayMode(segment.id)).toThrow();

    // Assert
    expect(video.addEventListener).toHaveBeenCalledWith('timeupdate', expect.any(Function));
    expect(video.play).not.toHaveBeenCalled();
  });

  test('skips replay when video element is missing', async () => {
    // Arrange
    const segment = {id: 'segment-4000', text: 'No video', startTime: 1, endTime: 2};
    setExerciseSegment(segment);
    videoSpy.mockReturnValue(null);

    // Act
    await startReplayMode(segment.id);

    // Assert
    expect(isReplaySessionActive()).toBe(false);
  });

  test('skips replay when segment id cannot be resolved', async () => {
    // Arrange
    const video = createMockVideo(0);
    videoSpy.mockReturnValue(video);
    clearSubtitle();

    // Act
    await startReplayMode('unknown');

    // Assert
    expect(video.play).not.toHaveBeenCalled();
    expect(video.addEventListener).not.toHaveBeenCalled();
  });

  test('aborts replay when end time is not ahead of start time', async () => {
    // Arrange
    const segment = {id: 'segment-5000', text: 'Too short', startTime: 0, endTime: 0};
    setExerciseSegment(segment);
    const video = createMockVideo(0);
    videoSpy.mockReturnValue(video);

    // Act
    await startReplayMode(segment.id);

    // Assert
    expect(video.addEventListener).not.toHaveBeenCalled();
    expect(video.play).not.toHaveBeenCalled();
  });

  test('removes existing timeupdate listener before starting new replay', async () => {
    // Arrange
    const segment = {id: 'segment-6000', text: 'First', startTime: 1, endTime: 2};
    setExerciseSegment(segment);
    const video = createMockVideo(0);
    videoSpy.mockReturnValue(video);

    await startReplayMode(segment.id);
    const handlerEntry = video.addEventListener.mock.calls[0];
    if (!handlerEntry) throw new Error('listener not registered');
    const handler = handlerEntry[1];
    if (typeof handler !== 'function') throw new Error('handler not a function');

    const second = {id: 'segment-7000', text: 'Second', startTime: 3, endTime: 4};
    setExerciseSegment(second);

    // Act
    await startReplayMode(second.id);

    // Assert
    expect(video.removeEventListener).toHaveBeenCalledWith('timeupdate', handler);
  });

  test('handles play rejection when starting replay', async () => {
    // Arrange
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const segment = {id: 'segment-play-fail', text: 'Replay fail', startTime: 1, endTime: 2};
    setExerciseSegment(segment);
    const playError = new Error('autoplay blocked');
    const video = {
      ...createMockVideo(0),
      play: vi.fn(() => Promise.reject(playError))
    };
    videoSpy.mockReturnValue(video);

    // Act
    await startReplayMode(segment.id);
    await Promise.resolve();

    // Assert
    expect(video.play).toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledWith('Video play failed');
    warnSpy.mockRestore();
  });

  test('removes replay listener when clearing subtitle state', async () => {
    // Arrange
    const segment = {id: 'segment-clean', text: 'Replay clean', startTime: 1, endTime: 2};
    setExerciseSegment(segment);
    const video = createMockVideo(0, {timeupdate: true});
    videoSpy.mockReturnValue(video);

    await startReplayMode(segment.id);

    // Act
    clearSubtitle();

    // Assert
    expect(video.removeEventListener).toHaveBeenCalledWith('timeupdate', expect.any(Function));
  });

  test('cleans up timeupdate listeners across multiple replays', async () => {
    // Arrange
    const video = createMockVideo(0, {timeupdate: true});
    videoSpy.mockReturnValue(video);

    const first = {id: 'segment-multi-1', text: 'First replay', startTime: 0, endTime: 2};
    setExerciseSegment(first);
    await startReplayMode(first.id);

    const second = {id: 'segment-multi-2', text: 'Second replay', startTime: 3, endTime: 5};
    setExerciseSegment(second);

    // Act
    await startReplayMode(second.id);
    clearSubtitle();

    // Assert
    const addCalls = video.addEventListener.mock.calls.filter(call => call[0] === 'timeupdate').length;
    const removeCalls = video.removeEventListener.mock.calls.filter(call => call[0] === 'timeupdate').length;
    expect(addCalls).toBe(removeCalls);
  });
});

describe('setExerciseSegment', () => {
  test('updates exercise segment and generates tokens when segment provided', () => {
    // Arrange
    const segment = {id: 'segment-set-1', text: 'hello world test', startTime: 0};

    // Act
    setExerciseSegment(segment);

    // Assert
    expect($exerciseSegment.get()).toEqual(segment);
    expect($tokens.get().length).toBeGreaterThan(0);
  });

  test('clears exercise segment and tokens when segment is null', () => {
    // Arrange
    const segment = {id: 'segment-set-2', text: 'hello world', startTime: 0};
    setExerciseSegment(segment);

    // Act
    setExerciseSegment(null);

    // Assert
    expect($exerciseSegment.get()).toBeNull();
    expect($tokens.get()).toEqual([]);
  });
});

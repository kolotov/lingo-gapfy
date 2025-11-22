import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest';
import {startExercise, stopExercise, $exerciseActive} from '@/store/exercise';
import {
  clearActiveExerciseSegment,
  clearExercise,
  startExerciseListeners,
  stopExerciseListeners
} from '@/store/gapExercise';
import {
  clearActiveSubtitleSegment,
  clearSubtitle,
  startSubtitleCapture
} from '@/store/subtitles';
import * as subtitlesModule from '@/store/subtitles';
import {
  enableSubtitles,
  hideOverlayTop,
  hideYouTubeSubtitles,
  restoreSubtitlesButton,
  showOverlayTop,
  showYouTubeSubtitles
} from '@/utils/youtubeApi';
import * as youtubeApi from '@/utils/youtubeApi';
import * as gapExerciseModule from '@/store/gapExercise';
import {createMockVideo} from '@/test-utils/createMockVideo';

let startSubtitleCaptureSpy: ReturnType<typeof vi.spyOn>;
let getVideoSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  getVideoSpy = vi.spyOn(youtubeApi, 'getVideo').mockReturnValue(null);
  startSubtitleCaptureSpy = vi.spyOn(subtitlesModule, 'startSubtitleCapture').mockReturnValue(() => {});
});

afterEach(() => {
  stopExercise();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('startExercise', () => {
  test('invokes start sequence with overlays hidden and capture started', () => {
    // Arrange
    vi.spyOn(youtubeApi, 'hideOverlayTop').mockImplementation(() => {});
    vi.spyOn(youtubeApi, 'enableSubtitles').mockImplementation(() => {});
    vi.spyOn(youtubeApi, 'hideYouTubeSubtitles').mockImplementation(() => {});
    vi.spyOn(gapExerciseModule, 'startExerciseListeners').mockImplementation(() => {});
    const cleanupCapture = vi.fn();
    startSubtitleCaptureSpy.mockReturnValue(cleanupCapture);
    getVideoSpy.mockReturnValue(null);

    // Act
    startExercise();

    // Assert
    expect(hideOverlayTop).toHaveBeenCalled();
    expect(enableSubtitles).toHaveBeenCalled();
    expect(hideYouTubeSubtitles).toHaveBeenCalled();
    expect(startSubtitleCapture).toHaveBeenCalled();
    expect(startExerciseListeners).toHaveBeenCalled();
    expect($exerciseActive.get()).toBe(true);

  });

  test('retries subtitle capture when initial attempt returns null', () => {
    // Arrange
    vi.spyOn(youtubeApi, 'hideOverlayTop').mockImplementation(() => {});
    vi.spyOn(youtubeApi, 'enableSubtitles').mockImplementation(() => {});
    vi.spyOn(youtubeApi, 'hideYouTubeSubtitles').mockImplementation(() => {});
    vi.spyOn(gapExerciseModule, 'startExerciseListeners').mockImplementation(() => {});
    startSubtitleCaptureSpy
      .mockReturnValueOnce(null)
      .mockReturnValueOnce(null)
      .mockReturnValueOnce(() => {});
    getVideoSpy.mockReturnValue(null);

    // Act
    startExercise();
    vi.runAllTimers();

    // Assert
    expect(startSubtitleCapture).toHaveBeenCalledTimes(3);
  });

  test('stops scheduling retries when capture keeps failing', () => {
    // Arrange
    vi.spyOn(youtubeApi, 'hideOverlayTop').mockImplementation(() => {});
    vi.spyOn(youtubeApi, 'enableSubtitles').mockImplementation(() => {});
    vi.spyOn(youtubeApi, 'hideYouTubeSubtitles').mockImplementation(() => {});
    vi.spyOn(gapExerciseModule, 'startExerciseListeners').mockImplementation(() => {});
    startSubtitleCaptureSpy.mockReturnValue(null);
    getVideoSpy.mockReturnValue(null);

    // Act
    startExercise();
    vi.runAllTimers();

    // Assert
    expect(startSubtitleCapture).toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  test('restart capture when subtitles button toggled back on', () => {
    // Arrange
    vi.spyOn(youtubeApi, 'hideOverlayTop').mockImplementation(() => {});
    vi.spyOn(youtubeApi, 'enableSubtitles').mockImplementation(() => {});
    vi.spyOn(youtubeApi, 'hideYouTubeSubtitles').mockImplementation(() => {});
    vi.spyOn(gapExerciseModule, 'startExerciseListeners').mockImplementation(() => {});
    const cleanupCapture = vi.fn();
    startSubtitleCaptureSpy.mockReturnValue(cleanupCapture);
    const button = document.createElement('button');
    button.className = 'ytp-subtitles-button';
    document.body.appendChild(button);

    const observers: Array<{trigger: () => void}> = [];
    class MockObserver implements MutationObserver {
      observe = vi.fn();
      disconnect = vi.fn();
      takeRecords = vi.fn(() => []);
      private cb: MutationCallback;
      constructor(cb: MutationCallback) {
        this.cb = cb;
        observers.push({trigger: () => this.cb([], this)});
      }
    }
    vi.stubGlobal('MutationObserver', MockObserver);

    getVideoSpy.mockReturnValue(null);

    // Act
    startExercise();
    button.setAttribute('aria-pressed', 'true');
    observers.forEach(o => o.trigger());
    vi.runAllTimers();

    // Assert
    expect(cleanupCapture).toHaveBeenCalled();
    expect(hideYouTubeSubtitles).toHaveBeenCalled();
    expect(startSubtitleCapture).toHaveBeenCalledTimes(2);
  });

  test('does not restart capture after observer disconnected before toggle', () => {
    // Arrange
    vi.spyOn(youtubeApi, 'hideOverlayTop').mockImplementation(() => {});
    vi.spyOn(youtubeApi, 'enableSubtitles').mockImplementation(() => {});
    vi.spyOn(youtubeApi, 'hideYouTubeSubtitles').mockImplementation(() => {});
    vi.spyOn(gapExerciseModule, 'startExerciseListeners').mockImplementation(() => {});
    const cleanupCapture = vi.fn();
    startSubtitleCaptureSpy.mockReturnValue(cleanupCapture);
    const button = document.createElement('button');
    button.className = 'ytp-subtitles-button';
    document.body.appendChild(button);

    const observers: Array<{trigger: () => void; disconnect: () => void}> = [];
    class MockObserver implements MutationObserver {
      active = true;
      observe = vi.fn();
      disconnect = vi.fn(() => {
        this.active = false;
      });
      takeRecords = vi.fn(() => []);
      private cb: MutationCallback;
      constructor(cb: MutationCallback) {
        this.cb = cb;
        observers.push({
          trigger: () => {
            if (this.active) this.cb([], this);
          },
          disconnect: this.disconnect
        });
      }
    }
    vi.stubGlobal('MutationObserver', MockObserver);
    getVideoSpy.mockReturnValue(null);

    // Act
    startExercise();
    observers[0].disconnect();
    button.setAttribute('aria-pressed', 'true');
    observers[0].trigger();
    vi.runAllTimers();

    // Assert
    expect(startSubtitleCapture).toHaveBeenCalledTimes(1);
  });

  test('restarts capture for multiple consecutive subtitle toggles', () => {
    // Arrange
    vi.spyOn(youtubeApi, 'hideOverlayTop').mockImplementation(() => {});
    vi.spyOn(youtubeApi, 'enableSubtitles').mockImplementation(() => {});
    vi.spyOn(youtubeApi, 'hideYouTubeSubtitles').mockImplementation(() => {});
    vi.spyOn(gapExerciseModule, 'startExerciseListeners').mockImplementation(() => {});
    const cleanupFirst = vi.fn();
    const cleanupSecond = vi.fn();
    const cleanupThird = vi.fn();
    startSubtitleCaptureSpy
      .mockReturnValueOnce(cleanupFirst)
      .mockReturnValueOnce(cleanupSecond)
      .mockReturnValueOnce(cleanupThird);
    const button = document.createElement('button');
    button.className = 'ytp-subtitles-button';
    document.body.appendChild(button);

    const observers: Array<{trigger: () => void}> = [];
    class MockObserver implements MutationObserver {
      observe = vi.fn();
      disconnect = vi.fn();
      takeRecords = vi.fn(() => []);
      private cb: MutationCallback;
      constructor(cb: MutationCallback) {
        this.cb = cb;
        observers.push({
          trigger: () => this.cb([], this)
        });
      }
    }
    vi.stubGlobal('MutationObserver', MockObserver);
    getVideoSpy.mockReturnValue(null);

    // Act
    startExercise();
    button.setAttribute('aria-pressed', 'true');
    observers.forEach(o => o.trigger());
    vi.runAllTimers();
    button.setAttribute('aria-pressed', 'true');
    observers.forEach(o => o.trigger());
    vi.runAllTimers();

    // Assert
    expect(cleanupFirst).toHaveBeenCalledTimes(1);
    expect(cleanupSecond).toHaveBeenCalledTimes(1);
    expect(startSubtitleCapture).toHaveBeenCalledTimes(3);
  });
});

describe('stopExercise', () => {
  test('performs cleanup and restores overlays when stopping', () => {
    // Arrange
    vi.spyOn(gapExerciseModule, 'stopExerciseListeners').mockImplementation(() => {});
    vi.spyOn(gapExerciseModule, 'clearExercise');
    vi.spyOn(gapExerciseModule, 'clearActiveExerciseSegment');
    vi.spyOn(youtubeApi, 'showOverlayTop').mockImplementation(() => {});
    vi.spyOn(youtubeApi, 'showYouTubeSubtitles').mockImplementation(() => {});
    vi.spyOn(youtubeApi, 'restoreSubtitlesButton').mockImplementation(() => {});
    vi.spyOn(subtitlesModule, 'clearSubtitle');
    vi.spyOn(subtitlesModule, 'clearActiveSubtitleSegment');
    const cleanupCapture = vi.fn();
    startSubtitleCaptureSpy.mockReturnValue(cleanupCapture);
    getVideoSpy.mockReturnValue(null);
    startExercise();

    // Act
    stopExercise();

    // Assert
    expect(clearActiveExerciseSegment).toHaveBeenCalled();
    expect(showOverlayTop).toHaveBeenCalled();
    expect(cleanupCapture).toHaveBeenCalled();
    expect(stopExerciseListeners).toHaveBeenCalled();
    expect(clearExercise).toHaveBeenCalled();
    expect(showYouTubeSubtitles).toHaveBeenCalled();
    expect(restoreSubtitlesButton).toHaveBeenCalled();
    expect($exerciseActive.get()).toBe(false);

  });
});

describe('watchVideoSeeking', () => {
  test('clears exercise state when seeking moves outside segment bounds', async () => {
    // Arrange
    vi.spyOn(gapExerciseModule, 'clearExercise');
    vi.spyOn(gapExerciseModule, 'clearActiveExerciseSegment');
    vi.spyOn(subtitlesModule, 'clearSubtitle');
    vi.spyOn(subtitlesModule, 'clearActiveSubtitleSegment');
    const video = createMockVideo(0, {seeking: true});
    const triggerSeeking = video.triggerSeeking;
    if (!triggerSeeking) throw new Error('missing triggerSeeking');
    getVideoSpy.mockReturnValue(video);
    startSubtitleCaptureSpy.mockReturnValue(() => {});
    startExercise();

    const segment = {id: 'segment-seek-1', text: 'seek test', startTime: 5, endTime: 6};
    const subtitlesStore = await import('@/store/subtitles');
    subtitlesStore.$exerciseSegment.set(segment);

    // Act
    video.currentTime = 8;
    triggerSeeking();

    // Assert
    expect(clearActiveExerciseSegment).toHaveBeenCalled();
    expect(clearSubtitle).toHaveBeenCalled();
    expect(clearActiveSubtitleSegment).toHaveBeenCalled();
    expect(clearExercise).toHaveBeenCalled();
  });

  test('keeps exercise state when seeking within tolerance window', async () => {
    // Arrange
    vi.spyOn(gapExerciseModule, 'clearExercise');
    vi.spyOn(gapExerciseModule, 'clearActiveExerciseSegment');
    vi.spyOn(subtitlesModule, 'clearSubtitle');
    vi.spyOn(subtitlesModule, 'clearActiveSubtitleSegment');
    const video = createMockVideo(0, {seeking: true});
    const triggerSeeking = video.triggerSeeking;
    if (!triggerSeeking) throw new Error('missing triggerSeeking');
    getVideoSpy.mockReturnValue(video);
    startSubtitleCaptureSpy.mockReturnValue(() => {});
    startExercise();

    const segment = {id: 'segment-seek-2', text: 'seek tolerance', startTime: 5, endTime: 7};
    const subtitlesStore = await import('@/store/subtitles');
    subtitlesStore.$exerciseSegment.set(segment);

    // Act
    video.currentTime = 4; // within 1s tolerance before start
    triggerSeeking();
    vi.clearAllMocks();
    subtitlesStore.$exerciseSegment.set(segment); // restore state after clear maybe triggered
    video.currentTime = 8; // within 1s tolerance after end
    triggerSeeking();

    // Assert
    expect(clearActiveExerciseSegment).not.toHaveBeenCalled();
    expect(clearSubtitle).not.toHaveBeenCalled();
    expect(clearExercise).not.toHaveBeenCalled();
  });
});

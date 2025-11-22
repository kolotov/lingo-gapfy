import {mockDeep, type DeepMockProxy} from 'vitest-mock-extended';

export type MockVideoElement = DeepMockProxy<HTMLVideoElement> & {
  triggerTimeUpdate?: () => void;
  triggerSeeking?: () => void;
};

function toHandler(fn: EventListenerOrEventListenerObject): ((event: Event) => void) | null {
  if (typeof fn === 'function') return fn as (event: Event) => void;
  if (typeof fn.handleEvent === 'function') return (event: Event) => fn.handleEvent(event);
  return null;
}

export function createMockVideo(
  initialTime = 0,
  options: {timeupdate?: boolean; seeking?: boolean} = {}
): MockVideoElement {
  const {timeupdate = false, seeking = false} = options;
  const video = mockDeep<HTMLVideoElement>() as MockVideoElement;

  video.currentTime = initialTime;
  Object.defineProperty(video, 'readyState', {value: 4, writable: true});
  video.play.mockResolvedValue();
  video.pause.mockImplementation(() => {});

  const timeupdateHandlers = new Set<(e: Event) => void>();
  const seekingHandlers = new Set<() => void>();

  video.addEventListener.mockImplementation(((event: string, handler: EventListenerOrEventListenerObject) => {
    const fn = toHandler(handler);
    if (!fn) return;
    if (timeupdate && event === 'timeupdate') {
      timeupdateHandlers.add(fn);
    }
    if (seeking && event === 'seeking') {
      seekingHandlers.add(() => fn(new Event('seeking')));
    }
  }) as HTMLVideoElement['addEventListener']);

  video.removeEventListener.mockImplementation(((event: string, handler: EventListenerOrEventListenerObject) => {
    const fn = toHandler(handler);
    if (!fn) return;
    if (timeupdate && event === 'timeupdate') {
      timeupdateHandlers.delete(fn);
    }
    if (seeking && event === 'seeking') {
      seekingHandlers.delete(() => fn(new Event('seeking')));
    }
  }) as HTMLVideoElement['removeEventListener']);

  if (timeupdate) {
    video.triggerTimeUpdate = () => {
      const evt = new Event('timeupdate');
      timeupdateHandlers.forEach(fn => fn(evt));
    };
  }

  if (seeking) {
    video.triggerSeeking = () => {
      seekingHandlers.forEach(fn => fn());
    };
  }

  return video;
}

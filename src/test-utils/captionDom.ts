export type CaptionDom = {
  container: HTMLDivElement;
  bottom: HTMLDivElement;
  addSegment: (text: string) => HTMLDivElement;
};

export function createCaptionDOM(initialSegments: string[] = []): CaptionDom {
  const container = document.createElement('div');
  const bottom = document.createElement('div');
  bottom.className = 'ytp-caption-window-bottom';
  container.appendChild(bottom);

  const addSegment = (text: string): HTMLDivElement => {
    const segment = document.createElement('div');
    segment.className = 'ytp-caption-segment';
    segment.textContent = text;
    bottom.appendChild(segment);
    return segment;
  };

  initialSegments.forEach(addSegment);

  return {container, bottom, addSegment};
}

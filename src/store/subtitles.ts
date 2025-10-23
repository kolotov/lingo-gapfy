import {atom, computed} from 'nanostores';

export type Subtitle = {
  time: number;
  text: string;
  id: string;
};

export const $currentSubtitle = atom<Subtitle | null>(null);

export const $tokens = computed($currentSubtitle, (subtitle) => {
  if (!subtitle) return [];
  return processText(subtitle.text, subtitle.id);
});

const MOCK_PHRASES = [
  `Hello world how are you doing today`,
  'React is declarative and efficient framework',
  'Nanostores provides simple state management solution',
];

let phraseIndex = 0;
let maxPhrases = 1; // Показываем только первую фразу

export function startMockStream(): number {
  const intervalId = setInterval(() => {
    if (phraseIndex >= maxPhrases) {
      clearInterval(intervalId);
      return;
    }

    const subtitle: Subtitle = {
      id: `sub-${Date.now()}`,
      time: Date.now() / 1000,
      text: MOCK_PHRASES[phraseIndex]
    };
    $currentSubtitle.set(subtitle);
    phraseIndex++;
  }, 1000);

  return intervalId as unknown as number;
}

export function clearSubtitle() {
  $currentSubtitle.set(null);
  phraseIndex = 0;
}

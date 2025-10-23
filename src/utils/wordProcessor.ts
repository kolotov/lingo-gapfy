export type WordToken =
  | { type: 'text'; value: string; id: string }
  | { type: 'gap'; value: string; index: number; id: string };

export function processText(text: string, subtitleId: string): WordToken[] {
  const tokens: WordToken[] = [];
  const parts = text.split(/([\p{L}'']+)/u);

  let gapIndex = 0;
  let tokenId = 0;
  let wordCount = 0;

  parts.forEach((part) => {
    const isWord = /[\p{L}'']+/u.test(part);

    if (!isWord) {
      if (part) {
        tokens.push({
          type: 'text',
          value: part,
          id: `${subtitleId}-text-${tokenId++}`
        });
      }
      return;
    }

    const shouldBeGap = wordCount % 2 === 1 && part.length > 2;
    wordCount++;

    if (shouldBeGap) {
      tokens.push({
        type: 'gap',
        value: part,
        index: gapIndex++,
        id: `${subtitleId}-gap-${gapIndex}`
      });
    } else {
      tokens.push({
        type: 'text',
        value: part,
        id: `${subtitleId}-text-${tokenId++}`
      });
    }
  });

  return tokens;
}

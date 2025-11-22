import {describe, expect, test} from 'vitest';
import {processText} from '@/utils/wordProcessor';

describe('processText', () => {
  test('classifies punctuation as text tokens when mixed with words', () => {
    // Arrange
    const text = "Hello, world! It's fine.";
    const subtitleId = 'segment-1';

    // Act
    const tokens = processText(text, subtitleId);

    // Assert
    expect(tokens.map(token => token.value)).toEqual([
      'Hello',
      ', ',
      'world',
      '! ',
      "It's",
      ' ',
      'fine',
      '.'
    ]);
    expect(tokens.map(token => token.type)).toEqual([
      'text',
      'text',
      'gap',
      'text',
      'text',
      'text',
      'gap',
      'text'
    ]);
  });

  test('alternates gaps on every second long word when short words shift parity', () => {
    // Arrange
    const text = 'aa bbb cc ddd eee';
    const subtitleId = 'segment-2';

    // Act
    const tokens = processText(text, subtitleId);

    // Assert
    const gapTokens = tokens.filter(token => token.type === 'gap');
    expect(gapTokens.map(token => ({value: token.value, index: token.index}))).toEqual([
      {value: 'bbb', index: 0},
      {value: 'ddd', index: 1}
    ]);
  });

  test('generates sequential ids for text and gap tokens when multiple gaps exist', () => {
    // Arrange
    const text = 'one two three four';
    const subtitleId = 'segment-3';

    // Act
    const tokens = processText(text, subtitleId);

    // Assert
    const ids = tokens.map(token => token.id);
    expect(new Set(ids).size).toBe(ids.length);

    const textIds = tokens.filter(token => token.type === 'text').map(token => token.id);
    expect(textIds).toEqual([
      'segment-3-text-0',
      'segment-3-text-1',
      'segment-3-text-2',
      'segment-3-text-3',
      'segment-3-text-4'
    ]);

    const gapTokens = tokens.filter(token => token.type === 'gap');
    expect(gapTokens.map(token => token.id)).toEqual([
      'segment-3-gap-1',
      'segment-3-gap-2'
    ]);
    expect(gapTokens.map(token => token.index)).toEqual([0, 1]);
  });

  test('returns empty array when text is empty', () => {
    // Arrange
    const text = '';
    const subtitleId = 'segment-4';

    // Act
    const tokens = processText(text, subtitleId);

    // Assert
    expect(tokens).toEqual([]);
  });

  test('returns punctuation as text token when input has no words', () => {
    // Arrange
    const text = '...!!!';
    const subtitleId = 'segment-5';

    // Act
    const tokens = processText(text, subtitleId);

    // Assert
    expect(tokens).toHaveLength(1);
    expect(tokens[0]).toEqual({
      type: 'text',
      value: '...!!!',
      id: 'segment-5-text-0'
    });
  });

  test('keeps short words as text when length is below three characters', () => {
    // Arrange
    const text = 'a be to of in up';
    const subtitleId = 'segment-6';

    // Act
    const tokens = processText(text, subtitleId);

    // Assert
    const gapTokens = tokens.filter(token => token.type === 'gap');
    expect(gapTokens).toHaveLength(0);
  });

  test('handles unicode words with letters and diacritics', () => {
    // Arrange
    const text = 'Привет über 你好';
    const subtitleId = 'segment-7';

    // Act
    const tokens = processText(text, subtitleId);

    // Assert
    const gapTokens = tokens.filter(token => token.type === 'gap');
    expect(gapTokens).toHaveLength(1);
    expect(gapTokens[0]).toMatchObject({value: 'über', id: 'segment-7-gap-1'});
    const textTokens = tokens.filter(token => token.type === 'text').map(token => token.value);
    expect(textTokens).toEqual(['Привет', ' ', ' ', '你好']);
  });
});

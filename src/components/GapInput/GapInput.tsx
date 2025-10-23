import styles from './GapInput.module.scss';
import React, {useCallback} from 'react';

interface GapInputProps {
  word: string;
  index: number;
  onGapInput?: (detail: { index: number; value: string; word: string }) => void;
}

export const GapInput: React.FC<GapInputProps> = ({word, index, onGapInput}) => {
  const handleInput = useCallback(
    (e: React.FormEvent<HTMLInputElement>) => {
      onGapInput?.({index, value: e.currentTarget.value, word});
    },
    [index, word, onGapInput]
  );

  const inputId = `gap-${index}`;

  return (
    <input
      name={inputId}
      type="text"
      className={styles.gapInput}
      autoComplete="off"
      autoCapitalize="off"
      spellCheck={false}
      data-word={word}
      data-index={index}
      style={{width: `${word.length * 8 + 20}px`}}
      onKeyDown={(e) => e.stopPropagation()}
      onKeyUp={(e) => e.stopPropagation()}
      onInput={handleInput}
    />
  );
};

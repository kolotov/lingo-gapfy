import {forwardRef, useImperativeHandle, useRef} from 'react';
import {useStore} from '@nanostores/react';
import {$gapStatuses, resetGapStatus, validateGap} from '@/store/gapExercise';
import styles from './GapInput.module.scss';

interface GapInputProps {
  word: string;
  index: number;
  onMoveToNext?: (index: number) => void;
}

export interface GapInputHandle {
  focus: () => void;
}

export const GapInput = forwardRef<GapInputHandle, GapInputProps>(
  function GapInput({word, index, onMoveToNext}, ref) {
    const inputRef = useRef<HTMLInputElement>(null);
    const gapStatuses = useStore($gapStatuses);

    const status = gapStatuses.get(index) || 'default';
    const isDisabled = status === 'correct';

    useImperativeHandle(ref, () => ({
      focus: () => inputRef.current?.focus()
    }), []);

    const handleValidation = (value: string) => {
      const isCorrect = validateGap(index, value, word);

      if (isCorrect) {
        onMoveToNext?.(index);
      }
    };

    const handleInput = (e: React.FormEvent<HTMLInputElement>) => {
      const {value} = e.currentTarget;

      if (status === 'error') {
        resetGapStatus(index);
      }

      if (value.length === word.length) {
        handleValidation(value);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      e.stopPropagation();

      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();

        const value = e.currentTarget.value.trim();
        if (value) {
          handleValidation(value);
        }
      }
    };

    return (
      <input
        ref={inputRef}
        type="text"
        className={`${styles.gapInput} ${styles[status]}`}
        disabled={isDisabled}
        style={{width: `${word.length * 8 + 20}px`}}
        autoComplete="off"
        autoCapitalize="off"
        spellCheck={false}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onKeyUp={(e) => e.stopPropagation()}
      />
    );
  }
);

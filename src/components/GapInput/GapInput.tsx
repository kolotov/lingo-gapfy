import React, {useEffect, useImperativeHandle, useRef, useState} from 'react';
import {useStore} from '@nanostores/react';
import {$gapStatuses, resetGapStatus, validateGap} from '@/store/gapExercise';
import styles from './GapInput.module.scss';

interface GapInputProps {
  segmentId: string;
  word: string;
  index: number;
  onMoveToNext?: (index: number) => void;
  ref: React.Ref<GapInputHandle>;
}

export interface GapInputHandle {
  focus: () => void;
}

export function GapInput({segmentId, word, index, onMoveToNext, ref}: GapInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const allGapStatuses = useStore($gapStatuses);
  const [hintLevel, setHintLevel] = useState(0);

  const segmentStatuses = allGapStatuses[segmentId] || {};
  const status = segmentStatuses[index] ?? 'default';
  const isDisabled = status === 'correct';
  const maskedWord = word.length > 1
    ? `${word[0]}${'_'.repeat(Math.max(word.length - 2, 1))}${word[word.length - 1]}`
    : `${word[0] ?? ''}`;
  const hintPlaceholder = hintLevel === 1 ? maskedWord : hintLevel >= 2 ? word : '';

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus()
  }), []);

  useEffect(() => {
    setHintLevel(0);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }, [segmentId, index, word]);

  const handleValidation = (value: string) => {
    const isCorrect = validateGap(segmentId, index, value, word);

    if (isCorrect) {
      setHintLevel(0);
      onMoveToNext?.(index);
    } else {
      setHintLevel((level) => Math.min(level + 1, 2));
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  };

  const handleInput = (e: React.FormEvent<HTMLInputElement>) => {
    const {value} = e.currentTarget;

    if (status === 'error') {
      resetGapStatus(segmentId, index);
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
      placeholder={hintPlaceholder}
      spellCheck={false}
      onChange={handleInput}
      onKeyDown={handleKeyDown}
      onKeyUp={(e) => e.stopPropagation()}
    />
  );
}

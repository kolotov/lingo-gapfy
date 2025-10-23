import {useCallback, useRef} from 'react';
import {GapInputHandle} from '@/components/GapInput/GapInput';

export function useGapNavigation() {
  const inputRefs = useRef<Map<number, GapInputHandle>>(new Map());

  const registerInput = useCallback((index: number, element: GapInputHandle | null) => {
    if (element) {
      inputRefs.current.set(index, element);
    } else {
      inputRefs.current.delete(index);
    }
  }, []);

  const moveToNext = useCallback((currentIndex: number) => {
    const nextIndex = currentIndex + 1;
    const nextInput = inputRefs.current.get(nextIndex);
    nextInput?.focus();
  }, []);

  return {registerInput, moveToNext};
}

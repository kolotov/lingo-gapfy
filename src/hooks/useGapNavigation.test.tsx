import {describe, expect, test} from 'vitest';
import {renderHook} from '@testing-library/react';
import {useGapNavigation} from '@/hooks/useGapNavigation';

describe('useGapNavigation', () => {
  test('registers and unregisters inputs by index', () => {
    // Arrange
    const {result} = renderHook(() => useGapNavigation());
    const handle = {focus: () => {}};
    let focused = false;
    const next = {focus: () => { focused = true; }};

    // Act
    result.current.registerInput(0, handle);
    result.current.registerInput(1, next);
    result.current.registerInput(1, null);

    // Assert
    result.current.moveToNext(0);
    expect(focused).toBe(false);
  });

  test('focuses next input when moveToNext called', () => {
    // Arrange
    const {result} = renderHook(() => useGapNavigation());
    let focused = false;
    const next = {focus: () => { focused = true; }};
    result.current.registerInput(0, {focus: () => {}});
    result.current.registerInput(1, next);

    // Act
    result.current.moveToNext(0);

    // Assert
    expect(focused).toBe(true);
  });
});

import {describe, expect, test} from 'vitest';
import {endReplaySession, isReplaySessionActive, startReplaySession} from '@/store/replayState';

describe('replayState', () => {
  test('returns inactive status before session starts', () => {
    // Act
    const active = isReplaySessionActive();

    // Assert
    expect(active).toBe(false);
  });

  test('marks replay as active after start call', () => {
    // Act
    startReplaySession();

    // Assert
    expect(isReplaySessionActive()).toBe(true);
  });

  test('resets active flag after ending session', () => {
    // Arrange
    startReplaySession();

    // Act
    endReplaySession();

    // Assert
    expect(isReplaySessionActive()).toBe(false);
  });
});

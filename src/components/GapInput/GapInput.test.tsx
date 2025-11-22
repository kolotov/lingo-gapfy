import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest';
import {cleanup, render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {createRef} from 'react';
import {GapInput, GapInputHandle} from '@/components/GapInput/GapInput';
import {$gapStatuses} from '@/store/gapExercise';
import * as subtitlesStore from '@/store/subtitles';

beforeEach(() => {
  vi.spyOn(subtitlesStore, 'startReplayMode').mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
});

describe('GapInput', () => {
  test('advances hint from masked to full word after consecutive wrong inputs', async () => {
    // Arrange
    const ref = createRef<GapInputHandle>();
    render(<GapInput segmentId="seg-1" word="hello" index={0} ref={ref} />);
    const input = screen.getByRole('textbox') as HTMLInputElement;
    const user = userEvent.setup();
    expect(input.placeholder).toBe('');

    // Act
    await user.type(input, 'wrong');

    // Assert
    await waitFor(() => {
      expect(input.placeholder).toBe('h___o');
      expect(input.value).toBe('');
    });

    // Act
    await user.type(input, 'again');

    // Assert
    await waitFor(() => {
      expect(input.placeholder).toBe('hello');
    });
  });

  test('triggers validation on length match, disables on correct, and moves to next input', async () => {
    // Arrange
    const ref = createRef<GapInputHandle>();
    const moveNext = vi.fn();
    render(<GapInput segmentId="seg-2" word="Hello" index={1} onMoveToNext={moveNext} ref={ref} />);
    const input = screen.getByRole('textbox') as HTMLInputElement;
    const user = userEvent.setup();

    // Act
    await user.type(input, 'hello');

    // Assert
    await waitFor(() => {
      expect(input.disabled).toBe(true);
    });
    expect(moveNext).toHaveBeenCalledWith(1);
    expect($gapStatuses.get()['seg-2'][1]).toBe('correct');
  });

  test.each(['Enter', 'Tab'])('runs validation on %s key even when length is shorter', async (key) => {
    // Arrange
    const ref = createRef<GapInputHandle>();
    render(<GapInput segmentId="seg-3" word="cat" index={0} ref={ref} />);
    const input = screen.getByRole('textbox') as HTMLInputElement;
    const user = userEvent.setup();

    // Act
    await user.type(input, 'ca');
    await user.keyboard(`{${key.toLowerCase()}}`);

    // Assert
    await waitFor(() => {
      expect(input.placeholder).toBe('c_t');
    });
    expect($gapStatuses.get()['seg-3'][0]).toBe('error');
  });

  test('resets hint and input value when segment changes', async () => {
    // Arrange
    const ref = createRef<GapInputHandle>();
    const {rerender} = render(<GapInput segmentId="seg-4" word="hello" index={0} ref={ref} />);
    const input = screen.getByRole('textbox') as HTMLInputElement;
    const user = userEvent.setup();
    await user.type(input, 'wrong');
    await waitFor(() => {
      expect(input.placeholder).toBe('h___o');
    });

    // Act
    rerender(<GapInput segmentId="seg-5" word="hello" index={0} ref={ref} />);

    // Assert
    await waitFor(() => {
      expect(input.placeholder).toBe('');
      expect(input.value).toBe('');
    });
  });

  test('stops propagation on key events to prevent parent handlers', () => {
    // Arrange
    const ref = createRef<GapInputHandle>();
    const parentKeyHandler = vi.fn();
    render(
      <div onKeyDown={parentKeyHandler} onKeyUp={parentKeyHandler}>
        <GapInput segmentId="seg-6" word="word" index={0} ref={ref} />
      </div>
    );
    const input = screen.getByRole('textbox') as HTMLInputElement;

    // Act
    input.dispatchEvent(new KeyboardEvent('keydown', {key: 'Enter', bubbles: true}));
    input.dispatchEvent(new KeyboardEvent('keyup', {key: 'Enter', bubbles: true}));

    // Assert
    expect(parentKeyHandler).not.toHaveBeenCalled();
  });
});

import {useEffect, useRef} from 'react';
import {useStore} from '@nanostores/react';
import {$exerciseSegment, $tokens} from '@/store/subtitles';
import {isReplaySessionActive} from "@/store/replayState.ts";
import {$exerciseActive} from '@/store/exercise';
import {useGapNavigation} from '@/hooks/useGapNavigation';
import {GapInput} from '@/components/GapInput/GapInput';
import styles from './SubtitlesBoard.module.scss';
import {ReplayButton} from "@/components/ReplayButton/ReplayButton.tsx";
import mascot from "@/assets/lingo-gapfy.png"

export const SubtitlesBoard = () => {
  const tokens = useStore($tokens);
  const segment = useStore($exerciseSegment);
  const exerciseActive = useStore($exerciseActive);
  const {registerInput, moveToNext} = useGapNavigation();
  const fallbackSegmentRef = useRef<typeof segment | null>(null);
  const fallbackTokensRef = useRef<typeof tokens>([]);

  useEffect(() => {
    if (segment) {
      fallbackSegmentRef.current = segment;
    }
  }, [segment]);

  useEffect(() => {
    if (segment && tokens.length > 0) {
      fallbackTokensRef.current = tokens;
    }
  }, [segment, tokens]);

  if (!exerciseActive) {
    return null;
  }

  const isReplay = isReplaySessionActive();
  const displaySegment = segment ?? (isReplay ? fallbackSegmentRef.current : null);
  const displayTokens = segment
    ? tokens
    : isReplay
      ? fallbackTokensRef.current
      : [];
  const showExercise = displaySegment && displayTokens.length > 0;

  return (
    <div className={styles.board}>
      {showExercise ? (
        <>
          {displayTokens.map((token) =>
            token.type === 'gap' ? (
              <GapInput
                key={token.id}
                ref={(el) => registerInput(token.index, el)}
                segmentId={displaySegment.id}
                word={token.value}
                index={token.index}
                onMoveToNext={moveToNext}
              />
            ) : (
              <span key={token.id}>{token.value}</span>
            )
          )}
          <ReplayButton segmentId={displaySegment.id}/>
        </>
      ) : <img src={mascot} height='38px' width='38px' alt=''/>}
    </div>
  );
};

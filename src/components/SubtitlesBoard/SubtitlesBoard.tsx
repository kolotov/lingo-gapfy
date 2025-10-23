import {useStore} from '@nanostores/react';
import {$tokens} from '@/store/subtitles';
import {useGapNavigation} from '@/hooks/useGapNavigation';
import {GapInput} from '@/components/GapInput/GapInput';
import styles from './SubtitlesBoard.module.scss';

export const SubtitlesBoard = () => {
  const tokens = useStore($tokens);
  const {registerInput, moveToNext} = useGapNavigation();

  if (tokens.length === 0) {
    return <div className={styles.board}>Waiting for subtitles...</div>;
  }

  return (
    <div className={styles.board}>
      {tokens.map((token) => {
        if (token.type === 'gap') {
          return (
            <GapInput
              key={token.id}
              ref={(el) => registerInput(token.index, el)}
              word={token.value}
              index={token.index}
              onMoveToNext={moveToNext}
            />
          );
        }
        return <span key={token.id}>{token.value}</span>;
      })}
    </div>
  );
};

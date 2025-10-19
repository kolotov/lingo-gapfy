import styles from './StartButton.module.scss';
import React from "react";

const LABEL = 'Start exercise';
const YTP_BUTTON_GLOBAL_CLASS = 'ytp-button';

interface StartButtonProps {
  onClick?: () => void;
}

export const StartButton: React.FC<StartButtonProps> = ({onClick}) => {
  return (
    <>
      <button
        className={`${YTP_BUTTON_GLOBAL_CLASS} ${styles.button}`}
        aria-label={LABEL}
        data-tooltip-title={LABEL}
        title={LABEL}
        type="button"
        onClick={onClick}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36"
             width="100%"
             height="100%"
             fill="none"
             fillOpacity="1"
             stroke="currentColor"
             strokeWidth="2"
             strokeLinecap="round"
             strokeLinejoin="round">
          <polygon points="2,11 14,18 2,25"></polygon>
          <line x1="14" y1="25" x2="28" y2="25"></line>
        </svg>
      </button>
    </>
  );
};

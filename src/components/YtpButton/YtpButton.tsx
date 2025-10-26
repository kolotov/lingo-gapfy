import React from "react";

type YtpButtonProps = {
  label: string;
  onClick?: () => void;
  children?: React.ReactNode;
  className?: string;
}

export const YtpButton = ({label, className, onClick, children}: YtpButtonProps) => {
  return (
    <button
      className={`ytp-button ${className}`}
      aria-label={label}
      data-tooltip-title={label}
      title={label}
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
        {children}
      </svg>
    </button>
  );
}

import ReactDOM from "react-dom/client";
import {browser} from 'wxt/browser';
import {SubtitlesBoard} from "@/components/SubtitlesBoard/SubtitlesBoard.tsx";
import {clearSubtitle} from "@/store/subtitles.ts";
import {$exerciseActive, startExercise, stopExercise} from "@/store/exercise.ts";
import {isExerciseAvailable} from "@/utils/youtubeApi.ts";

function startVideoStateTracking() {
  let lastState = false;
  const notifyVideoState = () => {
    const available = isExerciseAvailable();
    if (available === lastState) return;
    lastState = available;
    browser.runtime.sendMessage({action: 'setIconState', isPlayerAvailable: available});
  };

  const checkInterval = setInterval(notifyVideoState, 500);
  notifyVideoState();

  return () => {
    lastState = false;
    // Ensure toolbar icon goes inactive when UI is torn down (e.g. navigating away).
    browser.runtime.sendMessage({action: 'setIconState', isPlayerAvailable: false});
    clearInterval(checkInterval);
  };
}

// noinspection JSUnusedGlobalSymbols
export default defineContentScript({
  matches: ['*://*.youtube.com/*'],
  cssInjectionMode: "ui",
  async main(ctx) {
    let stopTracking: (() => void);
    const boardUi = await createShadowRootUi(ctx, {
      name: "lingo-gapfy-board-host",
      position: "inline",
      append: "before",
      anchor: "#player-container #ytd-player",
      onMount: (container) => {
        const host = document.createElement('div');
        container.append(host);
        const root = ReactDOM.createRoot(host);
        root.render(<SubtitlesBoard/>);
        stopTracking = startVideoStateTracking();
        return root;
      },
      onRemove: (root) => {
        stopTracking();
        // Explicitly reset the icon when the board unmounts (e.g. navigating to non-player pages).
        browser.runtime.sendMessage({action: 'setIconState', isPlayerAvailable: false});
        stopExercise();
        clearSubtitle();
        root?.unmount();
      }
    });
    boardUi.autoMount();

    browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (message.action === 'toggleExercise') {
        const isActive = $exerciseActive.get();
        if (isActive) {
          stopExercise();
        } else if (isExerciseAvailable()) {
          startExercise();
        } else {
          console.warn('Exercise blocked: unavailable (ad or player not ready).');
        }
        sendResponse({success: true});
        return true;
      }
      return false;
    });
  },
});

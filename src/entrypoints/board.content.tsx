import ReactDOM from "react-dom/client";
import {browser} from 'wxt/browser';
import {SubtitlesBoard} from "@/components/SubtitlesBoard/SubtitlesBoard.tsx";
import {clearSubtitle} from "@/store/subtitles.ts";
import {$exerciseActive, startExercise, stopExercise} from "@/store/exercise.ts";
import {isVideoReady} from "@/utils/youtubeApi.ts";

function startVideoStateTracking() {
  let lastState = false;
  const notifyVideoState = () => {
    const currentState = isVideoReady();
    if (currentState == lastState) return
    lastState = currentState;
    browser.runtime.sendMessage({action: 'setIconState', isPlayerAvailable: currentState});
  };

  const checkInterval = setInterval(notifyVideoState, 500);
  notifyVideoState();

  return () => {
    lastState = false;
    clearInterval(checkInterval);
  };
}

// noinspection JSUnusedGlobalSymbols
export default defineContentScript({
  matches: ['https://*.youtube.com/*'],
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
        } else {
          startExercise();
        }
        sendResponse({success: true});
        return true;
      }
      return false;
    });
  },
});

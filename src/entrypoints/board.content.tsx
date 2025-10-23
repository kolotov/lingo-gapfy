import ReactDOM from "react-dom/client";
import {SubtitlesBoard} from "@/components/SubtitlesBoard/SubtitlesBoard.tsx";
import {clearSubtitle, startMockStream} from "@/store/subtitles.ts";

export default defineContentScript({
  matches: ['*://*.youtube.com/*'],
  cssInjectionMode: "ui",
  async main(ctx) {
    let intervalId: number | undefined;

    const boardUi = await createShadowRootUi(ctx, {
      name: "lingo-gapfy-board-host",
      position: "inline",
      append: "before",
      anchor: "#player-container #ytd-player",
      onMount: (container) => {
        const host = document.createElement('div');
        container.append(host);
        const root = ReactDOM.createRoot(host);
        root.render(<SubtitlesBoard/>)
        intervalId = startMockStream();
        return root;
      },
      onRemove: (root) => {
        if (intervalId !== undefined) {
          clearInterval(intervalId);
        }
        clearSubtitle();
        root?.unmount();
      }
    });
    boardUi.autoMount();
  },
});

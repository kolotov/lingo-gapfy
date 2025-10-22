import ReactDOM from "react-dom/client";
import {SubtitlesBoard} from "@/components/SubtitlesBoard/SubtitlesBoard.tsx";

export default defineContentScript({
  matches: ['*://*.youtube.com/*'],
  cssInjectionMode: "ui",
  async main(ctx) {

    const boardUi = await createShadowRootUi(ctx, {
      name: "lingo-gapfy-board-host",
      position: "overlay",
      anchor: "#ytd-player .html5-video-container",
      onMount: (container) => {
        const host = document.createElement('div');
        container.append(host);
        const root = ReactDOM.createRoot(host);
        root.render(<SubtitlesBoard/>)
        return root;
      },
      onRemove: (root) => {
        root?.unmount();
      }
    });
    boardUi.autoMount();
  },
});

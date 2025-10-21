import ReactDOM from "react-dom/client";
import {StartButton} from "@/components/StartButton/StartButton.tsx";
import {SubtitlesBoard} from "@/components/SubtitlesBoard/SubtitlesBoard.tsx";

export default defineContentScript({
  matches: ['*://*.youtube.com/*'],
  async main(ctx) {

    ctx.addEventListener(
      window,
      "start-button-click",
      (e) => {
        const detail = (e as CustomEvent<{ src: string }>).detail;
        console.log("Получено событие:", detail);
      }
    );

    const boardUi = await createShadowRootUi(ctx, {
      name: "lingo-gapfy-board-host",
      position: "overlay",
      anchor: "#player-container",
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

    const buttonUi = createIntegratedUi(ctx, {
      position: "inline",
      anchor: "#player-container .ytp-right-controls",
      append: "first",
      onMount: (container) => {
        container.style.display = "contents";
        const root = ReactDOM.createRoot(container);
        root.render(<StartButton/>);
        return root;
      },
      onRemove: (root) => {
        root?.unmount();
      },
    });
    buttonUi.autoMount();
  },
});

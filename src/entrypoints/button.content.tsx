import ReactDOM from "react-dom/client";
import {StartButton} from "@/components/StartButton/StartButton.tsx";

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

    const buttonUi = createIntegratedUi(ctx, {
      position: "inline",
      anchor: "#ytd-player .ytp-right-controls",
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

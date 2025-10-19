import ReactDOM from "react-dom/client";
import {StartButton} from "@/components/StartButton/StartButton.tsx";

export default defineContentScript({
  matches: ['*://*.youtube.com/*'],
  async main(ctx) {

    const buttonUI = createIntegratedUi(ctx, {
      position: "inline",
      anchor: ".ytp-right-controls",
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
    buttonUI.autoMount();
  },
});

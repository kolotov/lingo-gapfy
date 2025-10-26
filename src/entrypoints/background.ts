import {ICON_PATHS} from '@/utils/icon';

// noinspection JSUnusedGlobalSymbols
export default defineBackground(() => {
  const tabStates = new Map<number, boolean>();

  browser.runtime.onInstalled.addListener(() => {
    browser.action.setIcon({
      path: ICON_PATHS.inactive
    });
  });

  browser.tabs.onUpdated.addListener((tabId, changeInfo) => {
    if (changeInfo.status === 'loading') {
      tabStates.delete(tabId);
      browser.action.setIcon({
        tabId: tabId,
        path: ICON_PATHS.inactive
      });
    }
  });

  browser.tabs.onRemoved.addListener((tabId) => {
    tabStates.delete(tabId);
  });

  browser.runtime.onMessage.addListener((message, sender) => {
    if (message.action === 'setIconState' && sender.tab?.id) {
      tabStates.set(sender.tab.id, message.isPlayerAvailable);
      const iconPath = message.isPlayerAvailable ? ICON_PATHS.active : ICON_PATHS.inactive;
      browser.action.setIcon({
        tabId: sender.tab.id,
        path: iconPath
      });
    }
  });

  browser.action.onClicked.addListener(async (tab) => {
    if (!tab.id) return;
    try {
      await browser.tabs.sendMessage(tab.id, {
        action: 'toggleExercise'
      });
    } catch (error) {
      console.error('Failed to toggle exercise:', error);
    }
  });
});

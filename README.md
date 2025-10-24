# Lingo Gapfy

**Lingo Gapfy** is a Chrome extension that helps improve listening skills on YouTube.
It turns videos with subtitles into interactive listening exercises: the user listens to a short segment, fills in the missing words, receives feedback, and tracks progress.

## How it works

1. The user clicks the **Start** button on the YouTube control panel.
2. The extension plays a short video segment (5–10 seconds).
3. The video stops automatically.
4. Subtitles for this segment are displayed with missing words.
5. The user types the missing words into input fields.
6. After clicking **Check**:
  - if all words are correct — the next segment is played;
  - if there are mistakes — the user can listen again and try once more.
7. Mistakes are recorded in a personal dictionary of difficult words for further review.

## Technologies

- **React** — UI components (subtitles panel, input fields, start button)
- **WXT** — framework for Chrome Extension development
- **TypeScript** — strict type safety
- **Nano Stores** — reactive state management
- **SCSS Modules** — component-level styling
- **YouTube DOM API** — integration with the YouTube player interface

## Project structure


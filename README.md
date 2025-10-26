# Lingo Gapfy

**Lingo Gapfy** is a Chrome extension that turns any YouTube video with subtitles into a gap–filling exercise.  
It detects the currently spoken caption line, pauses the video, hides the native subtitles and renders its own panel where every second word becomes an input. Users type the missing words and can replay the segment until they succeed.

## How it works

1. Open a YouTube video with subtitles and click the extension’s toolbar icon — the custom subtitle board appears under the player.
2. When YouTube streams a new caption line, the extension automatically pauses playback and shows the line with gap inputs.
3. Type the missing words. Correct answers lock in and automatically focus the next gap.
4. Use the built‑in **Replay** button to rehear the last caption line as many times as needed.
5. Once all gaps are filled, playback resumes and the next line becomes the new exercise.

This workflow doesn’t require any extra UI on YouTube — the extension controls everything from the injected board.

## Tech stack

- **React 19 + SCSS modules** – subtitle board UI and styling
- **Nanostores** – light state management for segments, gaps and exercise state
- **TypeScript** – strict typing across content/background scripts and React
- **WXT (Vite)** – modern tooling for Chrome/Firefox extension builds
- **YouTube DOM hooks** – observe `.ytp-caption-segment` nodes, control `HTMLVideoElement`

## Key components

```
src/
  entrypoints/
    board.content.tsx   # mounts React board on YouTube pages
    background.ts       # toggles exercise via browser action
  components/
    SubtitlesBoard/     # renders tokens + replay button
    GapInput/           # gap field with validation + navigation
    ReplayButton/       # YouTube‑style button to replay segment
  store/
    subtitles.ts        # capture captions, manage segments, replay
    gapExercise.ts      # gap statuses, auto‑pause/resume logic
    exercise.ts         # lifecycle helpers and DOM plumbing
  utils/
    youtubeApi.ts       # DOM helpers for video + subtitles button
    wordProcessor.ts    # tokenizer that alternates words and gaps
```

## Development

```bash
pnpm install
pnpm dev        # starts WXT in watch mode
pnpm build      # produces extension bundle
pnpm typecheck  # run TypeScript without emit
```

Load `.output/chrome-mv3` as an unpacked extension in Chrome (or the Firefox bundle when building with `-b firefox`).

let replayActive = false;

export function startReplaySession() {
  replayActive = true;
}

export function endReplaySession() {
  replayActive = false;
}

export function isReplaySessionActive() {
  return replayActive;
}

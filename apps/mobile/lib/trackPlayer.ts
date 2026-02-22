import TrackPlayer, {
  AppKilledPlaybackBehavior,
  Capability,
  Event,
} from "react-native-track-player";

let isPlayerAvailable = false;

export function getPlayerAvailable() {
  return isPlayerAvailable;
}

export async function setupPlayer(): Promise<boolean> {
  try {
    await TrackPlayer.setupPlayer();
    await TrackPlayer.updateOptions({
      android: {
        appKilledPlaybackBehavior:
          AppKilledPlaybackBehavior.StopPlaybackAndRemoveNotification,
      },
      capabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.SeekTo,
        Capability.SkipToNext,
        Capability.SkipToPrevious,
      ],
      compactCapabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.SkipToNext,
      ],
    });
    isPlayerAvailable = true;
    return true;
  } catch {
    // Native module not available (e.g. Expo Go) or already set up
    console.warn("react-native-track-player not available — audio playback disabled");
    isPlayerAvailable = false;
    return false;
  }
}

export function registerPlaybackService() {
  try {
    TrackPlayer.registerPlaybackService(() => playbackService);
  } catch {
    // Native module not available
  }
}

async function playbackService() {
  TrackPlayer.addEventListener(Event.RemotePlay, () => TrackPlayer.play());
  TrackPlayer.addEventListener(Event.RemotePause, () => TrackPlayer.pause());
  TrackPlayer.addEventListener(Event.RemoteNext, () =>
    TrackPlayer.skipToNext(),
  );
  TrackPlayer.addEventListener(Event.RemotePrevious, () =>
    TrackPlayer.skipToPrevious(),
  );
  TrackPlayer.addEventListener(Event.RemoteSeek, (e) =>
    TrackPlayer.seekTo(e.position),
  );
}

export interface Track {
  id: string;
  userId: string;
  title: string;
  artist: string | null;
  duration: number | null;
  originalBpm: number | null;
  fileKey: string;
  fileSize: number | null;
  format: string | null;
  importedAt: Date;
  lastPlayedAt: Date | null;
}

export interface TrackInsert {
  id?: string;
  userId: string;
  title: string;
  artist?: string | null;
  duration?: number | null;
  originalBpm?: number | null;
  fileKey: string;
  fileSize?: number | null;
  format?: string | null;
}

export interface Playlist {
  id: string;
  userId: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PlaylistInsert {
  id?: string;
  userId: string;
  name: string;
}

export interface PlaylistTrack {
  id: string;
  playlistId: string;
  trackId: string;
  position: number;
}

export interface PlaylistTrackInsert {
  id?: string;
  playlistId: string;
  trackId: string;
  position: number;
}

export interface PlaybackState {
  id: string;
  userId: string;
  trackId: string;
  playbackRate: number;
  lastPosition: number;
  updatedAt: Date;
}

export interface PlaybackStateInsert {
  id?: string;
  userId: string;
  trackId: string;
  playbackRate?: number;
  lastPosition?: number;
}

import { tracks } from "@marko/db";
import type { Track } from "@marko/types";
import { useAuth } from "@clerk/clerk-expo";
import * as DocumentPicker from "expo-document-picker";
import {
  uploadAsync,
  FileSystemUploadType,
} from "expo-file-system/legacy";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { v4 as uuid } from "uuid";
import EditTrackModal from "../../components/EditTrackModal";
import TrackItem from "../../components/TrackItem";
import { db } from "../../lib/db";
import { buildFileKey, getUploadUrl } from "../../lib/r2";
import { type SortOption, useLibraryStore } from "../../store/library";

const AUDIO_TYPES = [
  "audio/mpeg",
  "audio/mp4",
  "audio/aac",
  "audio/wav",
  "audio/x-wav",
  "audio/flac",
  "audio/ogg",
];

function extFromName(name: string): string {
  const parts = name.split(".");
  return parts.length > 1 ? parts.pop()!.toLowerCase() : "mp3";
}

function contentTypeFromExt(ext: string): string {
  const map: Record<string, string> = {
    mp3: "audio/mpeg",
    m4a: "audio/mp4",
    aac: "audio/aac",
    wav: "audio/wav",
    flac: "audio/flac",
    ogg: "audio/ogg",
  };
  return map[ext] ?? "audio/mpeg";
}

const SORT_LABELS: Record<SortOption, string> = {
  date: "Date Added",
  title: "Title A–Z",
  bpm: "BPM",
};

export default function LibraryScreen() {
  const { userId } = useAuth();
  const router = useRouter();
  const {
    tracks: trackList,
    isLoading,
    sort,
    setSort,
    fetchTracks,
    addTrack,
    updateTrack,
    deleteTrack,
  } = useLibraryStore();

  const [importing, setImporting] = useState(false);
  const [editingTrack, setEditingTrack] = useState<Track | null>(null);

  useEffect(() => {
    if (userId) fetchTracks(userId);
  }, [userId]);

  const handleImport = useCallback(async () => {
    if (!userId) return;

    const result = await DocumentPicker.getDocumentAsync({
      type: AUDIO_TYPES,
      copyToCacheDirectory: true,
    });

    if (result.canceled || result.assets.length === 0) return;

    const file = result.assets[0]!;
    const ext = extFromName(file.name);
    const trackId = uuid();
    const fileKey = buildFileKey(userId, trackId, ext);
    const contentType = contentTypeFromExt(ext);

    setImporting(true);
    try {
      const uploadUrl = await getUploadUrl(fileKey, contentType);

      const uploadResult = await uploadAsync(uploadUrl, file.uri, {
        httpMethod: "PUT",
        headers: { "Content-Type": contentType },
        uploadType: FileSystemUploadType.BINARY_CONTENT,
      });

      if (uploadResult.status < 200 || uploadResult.status >= 300) {
        throw new Error(`Upload failed with status ${uploadResult.status}`);
      }

      const title = file.name.replace(/\.[^.]+$/, "");

      const [inserted] = await db
        .insert(tracks)
        .values({
          id: trackId,
          userId,
          title,
          fileKey,
          fileSize: file.size ?? null,
          format: ext,
        })
        .returning();

      addTrack(inserted as Track);
    } catch (err) {
      Alert.alert(
        "Import Failed",
        err instanceof Error ? err.message : "Something went wrong",
      );
    } finally {
      setImporting(false);
    }
  }, [userId]);

  function showTrackActions(track: Track) {
    const options = ["Edit Metadata", "Delete", "Cancel"];
    const destructiveIndex = 1;
    const cancelIndex = 2;

    function handleAction(index: number) {
      if (index === 0) {
        setEditingTrack(track);
      } else if (index === 1) {
        Alert.alert("Delete Track", `Delete "${track.title}"?`, [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: () => deleteTrack(track.id),
          },
        ]);
      }
    }

    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        { options, destructiveButtonIndex: destructiveIndex, cancelButtonIndex: cancelIndex },
        handleAction,
      );
    } else {
      Alert.alert("Track Options", track.title, [
        { text: "Edit Metadata", onPress: () => handleAction(0) },
        { text: "Delete", style: "destructive", onPress: () => handleAction(1) },
        { text: "Cancel", style: "cancel" },
      ]);
    }
  }

  function showSortPicker() {
    const options: SortOption[] = ["date", "title", "bpm"];
    const labels = options.map((o) => SORT_LABELS[o]);
    labels.push("Cancel");

    function handleSort(index: number) {
      if (index < options.length) setSort(options[index]!);
    }

    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: labels, cancelButtonIndex: labels.length - 1 },
        handleSort,
      );
    } else {
      Alert.alert("Sort By", undefined, [
        ...options.map((o, i) => ({ text: SORT_LABELS[o], onPress: () => handleSort(i) })),
        { text: "Cancel", style: "cancel" as const },
      ]);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Library</Text>
        <Pressable onPress={showSortPicker}>
          <Text style={styles.sortButton}>{SORT_LABELS[sort]} ▾</Text>
        </Pressable>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#fff" size="large" />
        </View>
      ) : trackList.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>No tracks yet</Text>
          <Text style={styles.emptySubtext}>
            Tap + to import audio files
          </Text>
        </View>
      ) : (
        <FlatList
          data={trackList}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TrackItem
              track={item}
              onPress={() => router.push(`/player/${item.id}`)}
              onLongPress={() => showTrackActions(item)}
            />
          )}
        />
      )}

      {importing ? (
        <View style={styles.fab}>
          <ActivityIndicator color="#000" />
        </View>
      ) : (
        <Pressable style={styles.fab} onPress={handleImport}>
          <Text style={styles.fabText}>+</Text>
        </Pressable>
      )}

      <EditTrackModal
        track={editingTrack}
        visible={editingTrack != null}
        onClose={() => setEditingTrack(null)}
        onSave={async (data) => {
          if (editingTrack) await updateTrack(editingTrack.id, data);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "700",
  },
  sortButton: {
    color: "#888",
    fontSize: 14,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "500",
    marginBottom: 6,
  },
  emptySubtext: {
    color: "#666",
    fontSize: 14,
  },
  fab: {
    position: "absolute",
    bottom: 32,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  fabText: {
    fontSize: 28,
    fontWeight: "400",
    color: "#000",
    marginTop: -2,
  },
});

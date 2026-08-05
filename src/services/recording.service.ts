import { AUDIO_EXPIRY_MS, DRAFT_AUDIO_RETENTION_MS } from '../utils/cronjob';
import { SupabaseConfig } from '../config';
import { PostStatus, RecordingStatus } from '../types/enums';

export interface CreateRecordingParams {
  userId: string;
  audioUrl: string;
  duration?: number;
}

export interface UpdateRecordingTranscriptParams {
  recordingId: string;
  transcript?: string;
  language?: string;
  duration?: number;
}

export interface UploadAudioParams {
  userId: string;
  fileName: string;
  buffer: Buffer;
  mimeType: string;
}

const SIGNED_URL_EXPIRY_SECONDS = 3 * 24 * 60 * 60; // 3 days

export class RecordingService {
  /**
   * Resolves the storage path from an audio_url field.
   * Handles both legacy full URLs and new path-only values.
   */
  private static extractPath(audioUrl: string): string {
    if (audioUrl.startsWith('http')) {
      const parts = decodeURIComponent(audioUrl).split('/recordings/');
      return parts.length > 1 ? parts[1] : audioUrl;
    }
    return audioUrl;
  }

  /**
   * Generates a signed URL for a given storage path.
   */
  static async getSignedAudioUrl(storagePath: string): Promise<string | null> {
    const path = this.extractPath(storagePath);
    const { data, error } = await SupabaseConfig.getAdmin()
      .storage.from('recordings')
      .createSignedUrl(path, SIGNED_URL_EXPIRY_SECONDS);

    if (error || !data?.signedUrl) return null;
    return data.signedUrl;
  }

  /**
   * Replaces audio_url with a fresh signed URL in a recording object.
   */
  static async withSignedUrl<T extends { audio_url?: string | null }>(recording: T): Promise<T> {
    if (!recording.audio_url) return recording;
    const signedUrl = await this.getSignedAudioUrl(recording.audio_url);
    return { ...recording, audio_url: signedUrl };
  }

  static async uploadAudio(params: UploadAudioParams): Promise<string> {
    const { userId, fileName, buffer, mimeType } = params;

    const filePath = `${userId}/${fileName}`;

    const { error: uploadError } = await SupabaseConfig.getAdmin()
      .storage.from('recordings')
      .upload(filePath, buffer, {
        contentType: mimeType,
        upsert: false,
      });

    if (uploadError) throw uploadError;

    return filePath;
  }

  static async createRecording(params: CreateRecordingParams) {
    const { userId, audioUrl, duration } = params;

    const { data: recording, error: insertError } = await SupabaseConfig.getAdmin()
      .from('recordings')
      .insert({
        user_id: userId,
        audio_url: audioUrl,
        duration: duration || null,
        status: RecordingStatus.PROCESSING,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return recording;
  }

  static async markAsFailed(recordingId: string): Promise<void> {
    const { error } = await SupabaseConfig.getAdmin()
      .from('recordings')
      .update({ status: RecordingStatus.FAILED })
      .eq('id', recordingId);

    if (error) throw error;
  }

  private static isExpiredByFilename(fileName: string): boolean {
    const timestamp = parseInt(fileName.split('-')[0], 10);
    return !isNaN(timestamp) && Date.now() - timestamp > AUDIO_EXPIRY_MS;
  }

  static async purgeExpiredAudio(): Promise<void> {
    const supabase = SupabaseConfig.getAdmin();

    // Fetch draft posts with a recording to apply extended retention
    const { data: drafts, error: draftsError } = await supabase
      .from('posts')
      .select('recording_id, updated_at')
      .eq('status', PostStatus.DRAFT)
      .not('recording_id', 'is', null);
    if (draftsError) throw draftsError;

    const draftRecordingMap = new Map<string, string>();
    if (drafts) {
      for (const d of drafts) {
        draftRecordingMap.set(d.recording_id, d.updated_at);
      }
    }

    // Fetch recordings to map audio paths to recording IDs
    const { data: allRecordings, error: recError } = await supabase
      .from('recordings')
      .select('id, audio_url')
      .not('audio_url', 'is', null);
    if (recError) throw recError;

    const pathToRecordingId = new Map<string, string>();
    if (allRecordings) {
      for (const r of allRecordings) {
        const path = this.extractPath(r.audio_url);
        if (path) pathToRecordingId.set(path, r.id);
      }
    }

    // List all user folders in the recordings bucket
    const { data: folders, error: foldersError } = await supabase.storage
      .from('recordings')
      .list('', { limit: 1000 });
    if (foldersError) throw foldersError;
    if (!folders) return;

    const expiredPaths: string[] = [];

    for (const folder of folders) {
      const userId = folder.name;
      const { data: files, error: filesError } = await supabase.storage
        .from('recordings')
        .list(userId);
      if (filesError) throw filesError;
      if (!files) continue;

      for (const file of files) {
        const filePath = `${userId}/${file.name}`;
        const recordingId = pathToRecordingId.get(filePath);
        const draftUpdatedAt = recordingId ? draftRecordingMap.get(recordingId) : undefined;

        if (draftUpdatedAt) {
          // Draft-linked recording: use extended retention from draft's updated_at
          const elapsed = Date.now() - new Date(draftUpdatedAt).getTime();
          if (elapsed > DRAFT_AUDIO_RETENTION_MS) {
            expiredPaths.push(filePath);
          }
        } else if (this.isExpiredByFilename(file.name)) {
          expiredPaths.push(filePath);
        }
      }
    }

    if (expiredPaths.length === 0) return;

    const { error: deleteError } = await supabase.storage.from('recordings').remove(expiredPaths);
    if (deleteError) throw deleteError;

    const { data: recordings, error: fetchError } = await supabase
      .from('recordings')
      .select('id, audio_url')
      .not('audio_url', 'is', null);

    if (fetchError) throw fetchError;

    if (recordings && recordings.length > 0) {
      const expiredSet = new Set(expiredPaths);
      const ids = recordings
        .filter((r: { id: string; audio_url: string }) =>
          expiredSet.has(this.extractPath(r.audio_url)),
        )
        .map((r: { id: string }) => r.id);

      if (ids.length > 0) {
        const { error: updateError } = await supabase
          .from('recordings')
          .update({ audio_url: null })
          .in('id', ids);
        if (updateError) throw updateError;
      }
    }

    console.log(`[purgeExpiredAudio] Purged ${expiredPaths.length} file(s)`);
  }

  static async updateRecording(params: UpdateRecordingTranscriptParams) {
    const { recordingId, transcript, language, duration } = params;

    const updateParams: {
      status: RecordingStatus;
      transcript?: string;
      language?: string;
      duration?: number;
    } = {
      status: RecordingStatus.COMPLETED,
    };

    if (transcript) updateParams.transcript = transcript;
    if (language) updateParams.language = language;
    if (duration) updateParams.duration = duration;

    const { data: completed, error: updateError } = await SupabaseConfig.getAdmin()
      .from('recordings')
      .update(updateParams)
      .eq('id', recordingId)
      .select()
      .single();

    if (updateError) throw updateError;

    return this.withSignedUrl(completed);
  }

  static async deleteRecording(recordingId: string) {
    const { error } = await SupabaseConfig.getAdmin()
      .from('recordings')
      .delete()
      .eq('id', recordingId);

    if (error) throw error;
  }

  static async getRecording(recordingId: string, userId: string) {
    const { data: recording, error: getError } = await SupabaseConfig.getAdmin()
      .from('recordings')
      .select()
      .eq('id', recordingId)
      .eq('user_id', userId)
      .maybeSingle();

    if (getError) throw getError;
    if (!recording) return recording;

    return this.withSignedUrl(recording);
  }

  static async listUserRecordings(userId: string) {
    const { data: recordings, error: listError } = await SupabaseConfig.getAdmin()
      .from('recordings')
      .select()
      .eq('user_id', userId);

    if (listError) throw listError;
    if (!recordings) return recordings;

    return Promise.all(recordings.map((r) => this.withSignedUrl(r)));
  }
}

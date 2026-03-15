import { SupabaseConfig } from '../config';
import { RecordingStatus } from '../types/enums';

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

export class RecordingService {
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

    const { data: urlData } = SupabaseConfig.getAdmin()
      .storage.from('recordings')
      .getPublicUrl(filePath);

    return urlData.publicUrl;
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

  private static readonly AUDIO_EXPIRY_MS = 15 * 60 * 1000;

  private static isExpiredByFilename(fileName: string): boolean {
    const timestamp = parseInt(fileName.split('-')[0], 10);
    return !isNaN(timestamp) && Date.now() - timestamp > this.AUDIO_EXPIRY_MS;
  }

  static async purgeExpiredAudio(): Promise<void> {
    const supabase = SupabaseConfig.getAdmin();
    const userId = '1558edb3-4dbf-46b0-b1da-c4add2d617bc';

    const expiredPaths: string[] = [];

    const { data: files, error: filesError } = await supabase.storage
      .from('recordings')
      .list(userId);
    if (filesError) throw filesError;
    if (!files) return;
    console.log({ files });

    for (const file of files) {
      console.log({ file });
      if (this.isExpiredByFilename(file.name)) {
        expiredPaths.push(`${userId}/${file.name}`);
      }
    }

    console.log({ expiredPaths });

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
          expiredSet.has(decodeURIComponent(r.audio_url).split('/recordings/')[1] ?? ''),
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

  static async completeRecording(params: UpdateRecordingTranscriptParams) {
    const { recordingId, transcript, language, duration } = params;

    const updateParams: Record<string, unknown> = {
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

    return completed;
  }
}

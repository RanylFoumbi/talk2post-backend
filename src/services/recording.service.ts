import { SupabaseConfig } from '../config';
import { RecordingStatus } from '../types/enums';

export interface CreateRecordingParams {
  userId: string;
  audioUrl: string;
  duration?: number;
  audioExpiresAt: string;
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
    const { userId, audioUrl, duration, audioExpiresAt } = params;

    const { data: recording, error: insertError } = await SupabaseConfig.getAdmin()
      .from('recordings')
      .insert({
        user_id: userId,
        audio_url: audioUrl,
        duration: duration || null,
        status: RecordingStatus.PROCESSING,
        audio_expires_at: audioExpiresAt,
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

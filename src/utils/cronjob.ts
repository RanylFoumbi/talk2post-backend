import schedule from 'node-schedule';
import { RecordingService } from '../services/recording.service';
import { Sentry } from '../config/sentry';

export const AUDIO_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes
const PURGE_JOB_NAME = 'purge-expired-audio';

export function startCronJob(): void {
  schedule.scheduleJob(PURGE_JOB_NAME, { second: AUDIO_EXPIRY_MS }, async () => {
    try {
      await RecordingService.purgeExpiredAudio();
    } catch (err) {
      Sentry.captureException(err);
      console.error(`cron job ${PURGE_JOB_NAME} failed:`, err);
    }
  });
}

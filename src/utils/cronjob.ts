import schedule from 'node-schedule';
import { RecordingService } from '../services/recording.service';
import { PostService } from '../services/post.service';
import { Sentry } from '../config/sentry';

export const AUDIO_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes
export const DRAFT_AUDIO_RETENTION_MS = 3 * 24 * 60 * 60 * 1000; // 3 days
export const DRAFT_MAX_AGE_DAYS = 30;

const PURGE_AUDIO_JOB = 'purge-expired-audio';
const PURGE_DRAFTS_JOB = 'purge-expired-drafts';

export function startCronJob(): void {
  schedule.scheduleJob(PURGE_AUDIO_JOB, { second: AUDIO_EXPIRY_MS }, async () => {
    try {
      await RecordingService.purgeExpiredAudio();
    } catch (err) {
      Sentry.captureException(err);
      console.error(`cron job ${PURGE_AUDIO_JOB} failed:`, err);
    }
  });

  // Purge drafts older than 30 days — runs daily at 3:00 AM
  schedule.scheduleJob(PURGE_DRAFTS_JOB, { hour: 3, minute: 0 }, async () => {
    try {
      await PostService.purgeExpiredDrafts(DRAFT_MAX_AGE_DAYS);
    } catch (err) {
      Sentry.captureException(err);
      console.error(`cron job ${PURGE_DRAFTS_JOB} failed:`, err);
    }
  });
}

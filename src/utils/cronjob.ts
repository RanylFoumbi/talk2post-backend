import schedule from 'node-schedule';
import { RecordingService } from '../services/recording.service';
import { Sentry } from '@config/sentry';

const PURGE_INTERVAL = 500000; 
const PURGE_JOB_NAME = 'purge-expired-audio';

export function startCronJob(): void {
  schedule.scheduleJob(PURGE_JOB_NAME, { second: PURGE_INTERVAL }, async () => {
    try {
      await RecordingService.purgeExpiredAudio();
    } catch (err) {
      Sentry.captureException(err);
      console.error(`cron job ${PURGE_JOB_NAME} failed:`, err);
    }
  });
}

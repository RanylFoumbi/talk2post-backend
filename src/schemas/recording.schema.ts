import { AllMimeTypes, MimeType } from 'types/enums';
import { z } from 'zod';


export const createTranscriptionSchema = z.object({
  language: z.string().min(2).max(10).optional(),
  audio: z.custom<Express.Multer.File>(
    (val) => val && AllMimeTypes.includes((val as Express.Multer.File).mimetype as MimeType),
    { message: `Must be an audio file of type ${AllMimeTypes.join(', ')}` },
  )
});

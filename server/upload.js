import multer from 'multer';
import config from './config.js';

// Files are parsed into memory and then stored in Postgres. Note: Vercel
// serverless functions cap the request body at ~4.5 MB, which is plenty for
// HTML tests and typical essay PDFs.
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.maxUploadBytes },
});

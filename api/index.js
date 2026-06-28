// Vercel Serverless Function entry. All /api/* requests are routed here by
// vercel.json and handled by the shared Express app.
import { createApp } from '../server/app.js';

const app = createApp();

export default app;

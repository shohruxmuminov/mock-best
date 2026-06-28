import { createApp } from './app.js';
import config from './config.js';
import { ensureSchema } from './db.js';

const app = createApp();

// Initialize schema on boot (non-fatal if the DB is briefly unavailable).
ensureSchema().catch((e) => console.warn('[db] schema init deferred:', e.message));

app.listen(config.port, () => {
  console.log(`IELTS Mock Test Platform listening on http://localhost:${config.port}`);
  console.log(`  Admin email      : ${config.adminEmail}`);
  console.log(`  Database         : ${config.databaseUrl ? 'configured' : 'MISSING (set DATABASE_URL)'}`);
  console.log(`  Admin code       : ${config.adminCode ? 'enabled' : 'disabled'}`);
  console.log(`  Google login     : ${config.googleClientId ? 'enabled' : 'disabled'}`);
  console.log(`  Password fallback: ${config.adminPassword ? 'enabled' : 'disabled'}`);
});

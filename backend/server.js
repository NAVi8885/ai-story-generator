/**
 * Express Server Bootstrapper for Mythos Studio (MVC Entrypoint)
 */

import dotenv from 'dotenv';
import { createApp } from './app.js';

dotenv.config({ path: '../.env' });
dotenv.config();

const app = createApp();
const PORT = process.env.PORT || 3001;

export { app };
export default app;

const isDirectRun = process.argv[1] && (process.argv[1].endsWith('server.js') || process.argv[1].includes('server.js'));

if (isDirectRun && process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log('════════════════════════════════════════════════');
    console.log('🚀 Mythos Studio API Server (MVC v3.0)');
    console.log(`📡 Running on: http://localhost:${PORT}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
    console.log('⚡ Zero-Cost Multi-Provider Router Active');
    console.log('════════════════════════════════════════════════');
  });
}

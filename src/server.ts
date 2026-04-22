import app from './app';
import { Config } from './config';

if (Config.NODE_ENV !== 'production') {
  app.listen(Config.PORT, () => {
    console.log(`
  ╔══════════════════════════════════════════════════════════╗
  ║  🚀 Talk2Post API Server                                 ║
  ║                                                          ║
  ║  Port:        ${String(Config.PORT).padEnd(30)}          ║
  ║  Environment: ${Config.NODE_ENV.padEnd(30)}              ║
  ║  Health:      http://localhost:${Config.PORT}/api/health ║
  ╚══════════════════════════════════════════════════════════╝
  `);
  });
}

export default app;

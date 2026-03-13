import { App } from './app';
import { Config } from './config';

const { app } = new App();

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

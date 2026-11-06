const env = require('./config/env');
const connectDB = require('./config/db');
const app = require('./app');
const claude = require('./services/ai/claudeService');
const videoService = require('./services/video');

async function start() {
  try {
    await connectDB();
  } catch (err) {
    console.error('[db] Could not connect to MongoDB:', err.message);
    process.exit(1);
  }

  const v = videoService.status();
  console.log(`[ai] Claude text generation: ${claude.isConfigured() ? 'configured' : 'NOT configured (set ANTHROPIC_API_KEY)'}`);
  console.log(`[ai] Video generation: ${v.configured ? `configured (${v.label})` : 'NOT configured (set VIDEO_PROVIDER + provider key)'}`);

  const server = app.listen(env.port, () => {
    console.log(`[api] SeriesLaunchKit AI API running on http://localhost:${env.port}/api`);
  });

  const shutdown = (signal) => {
    console.log(`[api] ${signal} received, shutting down`);
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

start();

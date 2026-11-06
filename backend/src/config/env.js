const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const int = (value, fallback) => {
  const n = parseInt(value, 10);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
};

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProd: process.env.NODE_ENV === 'production',
  port: int(process.env.PORT, 5000),
  clientOrigins: (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),

  mongoUri: process.env.MONGO_URI,

  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  cookieSameSite: (process.env.COOKIE_SAMESITE || 'lax').toLowerCase(),
  cookieSecure: process.env.COOKIE_SECURE === 'true',

  credits: {
    signup: int(process.env.SIGNUP_CREDITS, 100),
    seriesGeneration: int(process.env.COST_SERIES_GENERATION, 5),
    episodeScript: int(process.env.COST_EPISODE_SCRIPT, 2),
    promptEnhance: int(process.env.COST_PROMPT_ENHANCE, 1),
    videoGeneration: int(process.env.COST_VIDEO_GENERATION, 10),
  },

  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY || '',
    model: process.env.CLAUDE_MODEL || 'claude-sonnet-5-5',
  },

  video: {
    provider: (process.env.VIDEO_PROVIDER || '').toLowerCase(),
    kie: {
      apiKey: process.env.KIE_API_KEY || '',
      baseUrl: (process.env.KIE_BASE_URL || 'https://api.kie.ai').replace(/\/$/, ''),
      model: process.env.KIE_VIDEO_MODEL || 'veo3_fast',
    },
  },
};

// Fail fast on configuration that would make the app insecure or unusable.
const missing = [];
if (!env.mongoUri) missing.push('MONGO_URI');
if (!env.jwtSecret) missing.push('JWT_SECRET');
if (missing.length) {
  console.error(`\n[config] Missing required environment variables: ${missing.join(', ')}`);
  console.error('[config] Copy backend/.env.example to backend/.env and fill them in.\n');
  process.exit(1);
}
if (env.isProd && env.jwtSecret.length < 32) {
  console.error('[config] JWT_SECRET must be at least 32 characters in production.');
  process.exit(1);
}
if (env.cookieSameSite === 'none' && !env.cookieSecure) {
  console.warn('[config] COOKIE_SAMESITE=none requires COOKIE_SECURE=true (HTTPS). Browsers will reject the cookie otherwise.');
}

module.exports = env;

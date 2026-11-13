const fs = require('fs');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const env = require('./config/env');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middleware/error');

const app = express();

app.set('trust proxy', 1); // correct client IPs behind Render/Nginx/cPanel proxies for rate limiting
app.disable('x-powered-by');
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);
app.use(
  cors({
    origin(origin, cb) {
      // Allow same-origin / server-to-server requests (no Origin header) and configured frontends.
      if (!origin || env.clientOrigins.includes(origin)) return cb(null, true);
      const err = new Error('Origin not allowed');
      err.status = 403;
      return cb(err);
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '200kb' }));
app.use(cookieParser());
if (!env.isProd) app.use(morgan('dev'));
// Create storage directory if it does not exist
fs.mkdirSync(env.storage.uploadDir, { recursive: true });

// Serve generated images from server storage
app.use(
  '/uploads',
  express.static(env.storage.uploadDir, {
    maxAge: '1d',
  })
);

app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;

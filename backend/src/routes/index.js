const express = require('express');
const rateLimit = require('express-rate-limit');
const ah = require('../utils/asyncHandler');
const { requireAuth } = require('../middleware/auth');
const oid = require('../middleware/validateObjectId');

const auth = require('../controllers/authController');
const dashboard = require('../controllers/dashboardController');
const series = require('../controllers/seriesController');
const videos = require('../controllers/videoController');
const projects = require('../controllers/projectController');
const generations = require('../controllers/generationController');
const notifications = require('../controllers/notificationController');
const content = require('../controllers/contentController');

const router = express.Router();

// Brute-force protection on login/signup
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Too many attempts. Please wait 15 minutes and try again.' },
});

// Protects paid AI endpoints from runaway clients
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: (req) => String(req.user?._id || req.ip),
  message: { message: 'Too many AI requests. Please wait a minute.' },
});

router.get('/health', (req, res) => res.json({ ok: true }));

// ---- Auth ----
router.post('/auth/signup', authLimiter, ah(auth.signup));
router.post('/auth/login', authLimiter, ah(auth.login));
router.post('/auth/logout', ah(auth.logout));
router.get('/auth/me', requireAuth, ah(auth.me));

// Everything below requires a logged-in user
router.use(requireAuth);

router.get('/dashboard', ah(dashboard.getDashboard));

// ---- Series Studio ----
router.get('/series/fields', series.getFields);
router.get('/series', ah(series.list));
router.post('/series', aiLimiter, ah(series.create));
router.get('/series/:id', oid(), ah(series.get));
router.delete('/series/:id', oid(), ah(series.remove));
router.post('/series/:id/regenerate', oid(), aiLimiter, ah(series.regenerate));
router.get('/series/:id/pdf', oid(), ah(series.exportPdf));
router.patch('/series/:id/episodes/:episodeId', oid(), oid('episodeId'), ah(series.updateEpisode));
router.post('/series/:id/episodes/:episodeId/script', oid(), oid('episodeId'), aiLimiter, ah(series.generateScript));

// ---- Film Studio / My Videos ----
router.get('/videos/options', videos.options);
router.post('/videos/enhance-prompt', aiLimiter, ah(videos.enhancePrompt));
router.get('/videos', ah(videos.list));
router.post('/videos', aiLimiter, ah(videos.create));
router.get('/videos/:id', oid(), ah(videos.get));
router.get('/videos/:id/download', oid(), ah(videos.download));
router.delete('/videos/:id', oid(), ah(videos.remove));

// ---- My Projects ----
router.get('/projects', ah(projects.list));
router.post('/projects', ah(projects.create));
router.get('/projects/:id', oid(), ah(projects.get));
router.patch('/projects/:id', oid(), ah(projects.update));
router.delete('/projects/:id', oid(), ah(projects.remove));

// ---- Gen History ----
router.get('/generations', ah(generations.list));
router.get('/generations/:id', oid(), ah(generations.get));
router.delete('/generations/:id', oid(), ah(generations.remove));

// ---- Notifications ----
router.get('/notifications', ah(notifications.list));
router.post('/notifications/read-all', ah(notifications.markAllRead));

// ---- Training & Bonuses ----
router.get('/training', content.training);
router.get('/bonuses', content.bonuses);

module.exports = router;

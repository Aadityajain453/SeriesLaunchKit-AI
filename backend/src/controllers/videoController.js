const { Readable } = require('stream');
const Video = require('../models/Video');
const Project = require('../models/Project');
const Generation = require('../models/Generation');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');
const videoService = require('../services/video');
const claude = require('../services/ai/claudeService');
const { spendCredits, refundCredits } = require('../utils/credits');
const { logActivity, notify } = require('../utils/activity');

const POLL_MIN_INTERVAL_MS = 4000;
const MAX_PROCESSING_MS = 30 * 60 * 1000;

async function findOwned(req) {
  const video = await Video.findOne({ _id: req.params.id, user: req.user._id });
  if (!video) throw ApiError.notFound('Video not found');
  return video;
}

async function markFailed(video, message) {
  video.status = 'failed';
  video.error = message;
  if (!video.refunded && video.creditsUsed) {
    await refundCredits(video.user, video.creditsUsed);
    video.refunded = true;
  }
  await video.save();
  await notify(video.user, {
    title: 'Video generation failed',
    message: `${message}${video.refunded ? ` ${video.creditsUsed} credits were refunded.` : ''}`,
    variant: 'danger',
    link: '/my-videos',
  });
}

/** Asks the provider for the latest status of an in-flight video (throttled). */
async function refreshStatus(video) {
  if (!['queued', 'processing'].includes(video.status) || !video.providerTaskId) return video;
  if (video.lastCheckedAt && Date.now() - video.lastCheckedAt.getTime() < POLL_MIN_INTERVAL_MS) return video;

  const provider = videoService.getProvider();
  if (!provider || provider.capabilities.name !== video.provider || !provider.isConfigured()) return video;

  video.lastCheckedAt = new Date();
  try {
    const r = await provider.getTask(video.providerTaskId, video);
    if (r.status === 'completed') {
      video.status = 'completed';
      video.progress = 100;
      video.videoUrl = r.videoUrl;
      video.error = r.note || '';
      video.completedAt = new Date();
      await video.save();
      await logActivity(video.user, 'video_generated', `Generated video "${video.title || video.prompt.slice(0, 60)}"`, { model: 'Video', id: video._id });
      await notify(video.user, { title: 'Your video is ready', message: video.title || video.prompt.slice(0, 80), variant: 'success', link: '/my-videos' });
      if (video.project) await Project.updateOne({ _id: video.project }, { $set: { updatedAt: new Date() } });
      return video;
    }
    if (r.status === 'failed') {
      await markFailed(video, r.error || 'The provider could not generate this video.');
      return video;
    }
    video.status = 'processing';
    video.progress = r.progress ?? video.progress;
    if (Date.now() - video.createdAt.getTime() > MAX_PROCESSING_MS) {
      await markFailed(video, 'The provider did not finish within 30 minutes.');
      return video;
    }
    await video.save();
  } catch (err) {
    // Transient provider/network errors: keep the job alive and try again on the next poll.
    console.error('[video] status check failed', video._id.toString(), err.message);
    await video.save();
  }
  return video;
}

exports.options = (req, res) => {
  res.json({ ...videoService.status(), cost: env.credits.videoGeneration, enhanceCost: env.credits.promptEnhance, aiConfigured: claude.isConfigured() });
};

exports.create = async (req, res) => {
  const provider = videoService.requireProvider();
  const caps = provider.capabilities;
  const prompt = String(req.body.prompt || '').trim();
  const description = String(req.body.description || '').trim();
  const title = String(req.body.title || '').trim().slice(0, 120);
  const resolution = String(req.body.resolution || caps.resolutions[0]);
  const aspectRatio = String(req.body.aspectRatio || caps.aspectRatios[0]);
  const duration = String(req.body.duration || '15 seconds');
  const projectId = req.body.projectId || null;

  const errors = {};
  if (prompt.length < 10) errors.prompt = 'Describe your video in at least 10 characters';
  if (prompt.length > caps.maxPromptLength) errors.prompt = `Prompt must be ${caps.maxPromptLength} characters or fewer`;
  if (description.length > 2000) errors.description = 'Description must be 2000 characters or fewer';
  if (!caps.resolutions.includes(resolution)) errors.resolution = 'Choose a supported resolution';
  if (!caps.aspectRatios.includes(aspectRatio)) errors.aspectRatio = 'Choose a supported aspect ratio';

  const allowedDurations = ['15 seconds', '30 seconds', '60 seconds'];

  if (!allowedDurations.includes(duration)) {
    errors.duration = 'Choose a supported video duration';
  }
  if (Object.keys(errors).length) throw ApiError.badRequest('Please fix the highlighted fields', errors);

  let project = null;
  if (projectId) {
    project = await Project.findOne({ _id: projectId, user: req.user._id });
    if (!project) throw ApiError.badRequest('Selected project was not found', { projectId: 'Project not found' });
  }

  const cost = env.credits.videoGeneration;
  await spendCredits(req.user._id, cost);

  const video = await Video.create({
    user: req.user._id,
    project: project?._id,
    title,
    prompt,
    description,
    resolution,
    aspectRatio,
    duration,
    provider: caps.name,
    status: 'queued',
    creditsUsed: cost,
  });

  // The full prompt sent to the provider includes the optional scene description.
  const fullPrompt = description ? `${prompt}\n\n${description}`.slice(0, caps.maxPromptLength) : prompt;
  try {
    const { taskId } = await provider.createTask({ prompt: fullPrompt, resolution, aspectRatio,duration });
    video.providerTaskId = taskId;
    video.status = 'processing';
    video.progress = 2;
    await video.save();
  } catch (err) {
    console.error('[video] create failed', err.message);
    await refundCredits(req.user._id, cost);
    video.refunded = true;
    video.status = 'failed';
    video.error = err.message;
    await video.save();
    throw new ApiError(502, `The video provider rejected the request: ${err.message}. Your credits were refunded.`);
  }

  if (project) {
    if (project.status === 'draft') project.status = 'in_progress';
    await project.save();
  }
  res.status(201).json({ message: 'Video generation started', video });
};

exports.list = async (req, res) => {
  const filter = { user: req.user._id };
  if (['queued', 'processing', 'completed', 'failed'].includes(req.query.status)) filter.status = req.query.status;
  if (req.query.projectId) filter.project = req.query.projectId;
  const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
  const videos = await Video.find(filter).sort({ createdAt: -1 }).limit(limit).populate('project', 'title');
  // Refresh any in-flight jobs so lists stay current without a background worker.
  await Promise.all(videos.filter((v) => ['queued', 'processing'].includes(v.status)).slice(0, 5).map(refreshStatus));
  res.json({ videos });
};

exports.get = async (req, res) => {
  const video = await findOwned(req);
  await refreshStatus(video);
  res.json({ video });
};

/** Streams the finished file through the API so the browser downloads it with a proper filename. */
exports.download = async (req, res) => {
  const video = await findOwned(req);
  if (video.status !== 'completed' || !video.videoUrl) throw ApiError.badRequest('This video is not ready yet');
  let upstream;
  try {
    upstream = await fetch(video.videoUrl, { signal: AbortSignal.timeout(120000) });
  } catch {
    throw new ApiError(502, 'Could not reach the video file. It may have expired at the provider.');
  }
  if (!upstream.ok || !upstream.body) throw new ApiError(502, 'The video file is no longer available at the provider.');
  const name = (video.title || 'serieslaunchkit-video').replace(/[^a-z0-9]+/gi, '-').toLowerCase();
  res.setHeader('Content-Type', upstream.headers.get('content-type') || 'video/mp4');
  if (upstream.headers.get('content-length')) res.setHeader('Content-Length', upstream.headers.get('content-length'));
  res.setHeader('Content-Disposition', `attachment; filename="${name}.mp4"`);
  Readable.fromWeb(upstream.body).pipe(res);
};

exports.remove = async (req, res) => {
  const video = await findOwned(req);
  await Video.deleteOne({ _id: video._id });
  res.json({ message: 'Video removed from your library' });
};

/** Uses Claude to turn a rough idea into a detailed video prompt. */
exports.enhancePrompt = async (req, res) => {
  const prompt = String(req.body.prompt || '').trim();
  if (prompt.length < 3) throw ApiError.badRequest('Write a short idea first', { prompt: 'Write a short idea first' });
  if (prompt.length > 2000) throw ApiError.badRequest('Idea is too long', { prompt: 'Keep it under 2000 characters' });
  if (!claude.isConfigured()) throw ApiError.unavailable('AI text generation is not configured.');
  const cost = env.credits.promptEnhance;
  await spendCredits(req.user._id, cost);
  try {
    const result = await claude.enhanceVideoPrompt(prompt, { aspectRatio: req.body.aspectRatio });
    const gen = await Generation.create({
      user: req.user._id, type: 'prompt_enhance', title: 'Enhanced video prompt', model: result.model,
      input: prompt, output: result.prompt, status: 'success', creditsUsed: cost, usage: result.usage,
    });
    await logActivity(req.user._id, 'ai_generation', 'AI enhanced a video prompt', { model: 'Generation', id: gen._id });
    res.json({ prompt: result.prompt });
  } catch (err) {
    await refundCredits(req.user._id, cost);
    await Generation.create({ user: req.user._id, type: 'prompt_enhance', title: 'Enhanced video prompt', input: prompt, status: 'failed', error: err.message });
    throw err;
  }
};

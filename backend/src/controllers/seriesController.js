const Series = require('../models/Series');
const Project = require('../models/Project');
const Generation = require('../models/Generation');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');
const claude = require('../services/ai/claudeService');
const imageService = require('../services/ai/imageService');
const { streamSeriesPdf } = require('../services/pdf/seriesPdf');
const { SERIES_FIELDS, validateSeriesInput } = require('../config/seriesFields');
const { spendCredits, refundCredits } = require('../utils/credits');
const { logActivity, notify } = require('../utils/activity');

async function findOwned(req, id = req.params.id) {
  const series = await Series.findOne({ _id: id, user: req.user._id });
  if (!series) throw ApiError.notFound('Series not found');
  return series;
}

exports.getFields = (req, res) => {
  res.json({
    fields: SERIES_FIELDS,
    cost: env.credits.seriesGeneration,
    scriptCost: env.credits.episodeScript,
    aiConfigured: claude.isConfigured(),
  });
};

exports.list = async (req, res) => {
  const items = await Series.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .select('title status inputs.genre inputs.platform inputs.episodeCount content.logline content.episodes.number pdfExports project createdAt updatedAt')
    .lean();
  res.json({ series: items });
};

exports.get = async (req, res) => {
  const series = await findOwned(req);
  res.json({ series });
};

/**
 * Creates a series + its project, then runs the AI generation.
 * Credits are charged up-front and refunded if generation fails.
 */
exports.create = async (req, res) => {
  const { values, errors } = validateSeriesInput(req.body);
  if (Object.keys(errors).length) throw ApiError.badRequest('Please fix the highlighted fields', errors);
  if (!claude.isConfigured()) {
    throw ApiError.unavailable('AI text generation is not configured. Add OPENAI_API_KEY to the backend environment.');
  }

  const cost = env.credits.seriesGeneration;
  await spendCredits(req.user._id, cost);

  const project = await Project.create({
    user: req.user._id,
    title: values.title,
    description: values.premise?.slice(0, 1000) || '',
    kind: 'series',
    status: 'in_progress',
  });
  const series = await Series.create({
    user: req.user._id,
    project: project._id,
    title: values.title,
    inputs: values,
    status: 'generating',
  });
  project.series = series._id;
  await project.save();

  try {
    const result = await claude.generateSeriesBible(values);
    series.content = result.content;
    series.status = 'ready';
    series.error = '';
    await series.save();
    project.status = 'completed';
    await project.save();
    const gen = await Generation.create({
      user: req.user._id,
      type: 'series_bible',
      title: `Series plan: ${series.title}`,
      model: result.model,
      input: JSON.stringify(values),
      output: JSON.stringify(result.content, null, 2),
      status: 'success',
      creditsUsed: cost,
      usage: result.usage,
      series: series._id,
    });
    await logActivity(req.user._id, 'series_created', `Created series "${series.title}"`, { model: 'Series', id: series._id });
    await logActivity(req.user._id, 'ai_generation', `AI generated ${result.content.episodes.length} episodes for "${series.title}"`, { model: 'Generation', id: gen._id });
    res.status(201).json({ message: 'Your series is ready!', series });
  } catch (err) {
    // Nothing was produced: refund, roll back the empty series/project (the form keeps the user's input), keep a history record.
    await refundCredits(req.user._id, cost);
    await Promise.all([Series.deleteOne({ _id: series._id }), Project.deleteOne({ _id: project._id })]);
    await Generation.create({
      user: req.user._id, type: 'series_bible', title: `Series plan: ${series.title}`,
      input: JSON.stringify(values), status: 'failed', error: err.message,
    });
    await notify(req.user._id, { title: 'Series generation failed', message: `${err.message} Your ${cost} credits were refunded.`, variant: 'danger', link: '/series-studio/new' });
    throw err;
  }
};

/** Re-runs generation for a series that failed (or to regenerate). */
exports.regenerate = async (req, res) => {
  const series = await findOwned(req);
  if (series.status === 'generating') throw ApiError.conflict('This series is already being generated');
  const cost = env.credits.seriesGeneration;
  await spendCredits(req.user._id, cost);
  series.status = 'generating';
  await series.save();
  try {
    const result = await claude.generateSeriesBible(series.inputs);
    series.content = result.content;
    series.status = 'ready';
    series.error = '';
    await series.save();
    await Project.updateOne({ _id: series.project, user: req.user._id }, { status: 'completed' });
    const gen = await Generation.create({
      user: req.user._id, type: 'series_bible', title: `Series plan (regenerated): ${series.title}`,
      model: result.model, input: JSON.stringify(series.inputs), output: JSON.stringify(result.content, null, 2),
      status: 'success', creditsUsed: cost, usage: result.usage, series: series._id,
    });
    await logActivity(req.user._id, 'ai_generation', `AI regenerated "${series.title}"`, { model: 'Generation', id: gen._id });
    res.json({ message: 'Series regenerated', series });
  } catch (err) {
    await refundCredits(req.user._id, cost);
    series.status = series.content?.episodes?.length ? 'ready' : 'failed';
    series.error = err.message;
    await series.save();
    throw err;
  }
};



exports.generateImagePrompt = async (req, res) => {
  const series = await findOwned(req);
  const episode = series.content?.episodes?.id(req.params.episodeId);

  if (!episode) throw ApiError.notFound('Episode not found');
  if (!claude.isConfigured()) {
    throw ApiError.unavailable('AI text generation is not configured.');
  }

  const cost = env.credits.episodeScript;
  await spendCredits(req.user._id, cost);

  try {
    const result = await claude.generateEpisodeImagePrompt(series, episode);

    episode.imagePrompt = result.imagePrompt;
    await series.save();

    const gen = await Generation.create({
      user: req.user._id,
      type: 'episode_image_prompt',
      title: `Image Prompt: ${series.title} — Ep ${episode.number}`,
      model: result.model,
      input: episode.summary,
      output: result.imagePrompt,
      status: 'success',
      creditsUsed: cost,
      usage: result.usage,
      series: series._id,
    });

    await logActivity(
      req.user._id,
      'ai_generation',
      `AI generated the image prompt for "${series.title}" episode ${episode.number}`,
      { model: 'Generation', id: gen._id }
    );

    res.json({ message: 'Image prompt generated', episode });
  } catch (err) {
    await refundCredits(req.user._id, cost);
    throw err;
  }
};


/** Generates an image for an episode and saves its URL. */
exports.generateEpisodeImage = async (req, res) => {
  const series = await findOwned(req);
  const episode = series.content?.episodes?.id(req.params.episodeId);

  if (!episode) throw ApiError.notFound('Episode not found');

  if (!episode.imagePrompt?.trim()) {
    throw ApiError.badRequest('Please generate or write an image prompt first.');
  }

  const result = await imageService.generateAndSaveImage(episode.imagePrompt);

  try {
    episode.imageUrl = result.imageUrl;
    await series.save();

    const gen = await Generation.create({
      user: req.user._id,
      type: 'episode_image',
      title: `Episode Image: ${series.title} — Ep ${episode.number}`,
      model: result.model,
      input: episode.imagePrompt,
      output: result.imageUrl,
      status: 'success',
      creditsUsed: 0,
      series: series._id,
    });

    await logActivity(
      req.user._id,
      'ai_generation',
      `Generated an image for "${series.title}" episode ${episode.number}`,
      { model: 'Generation', id: gen._id }
    );

    res.json({
      message: 'Episode image generated successfully',
      episode,
    });
  } catch (err) {
    await imageService.deleteGeneratedImage(result.filename);
    throw err;
  }
};


exports.generateScript = async (req, res) => {
  const series = await findOwned(req);
  const episode = series.content?.episodes?.id(req.params.episodeId);
  if (!episode) throw ApiError.notFound('Episode not found');
  if (!claude.isConfigured()) throw ApiError.unavailable('AI text generation is not configured.');

  const cost = env.credits.episodeScript;
  await spendCredits(req.user._id, cost);
  try {
    const result = await claude.generateEpisodeScript(series, episode);
    episode.script = result.script;
    await series.save();
    const gen = await Generation.create({
      user: req.user._id, type: 'episode_script', title: `Script: ${series.title} — Ep ${episode.number}`,
      model: result.model, input: episode.summary, output: result.script, status: 'success',
      creditsUsed: cost, usage: result.usage, series: series._id,
    });
    await logActivity(req.user._id, 'ai_generation', `AI wrote the script for "${series.title}" episode ${episode.number}`, { model: 'Generation', id: gen._id });
    res.json({ message: 'Script generated', episode });
  } catch (err) {
    await refundCredits(req.user._id, cost);
    await Generation.create({
      user: req.user._id, type: 'episode_script', title: `Script: ${series.title} — Ep ${episode.number}`,
      input: episode.summary, status: 'failed', error: err.message, series: series._id,
    });
    throw err;
  }
};

/** Lets the user edit episode text (title, hook, summary, prompt, script). */
exports.updateEpisode = async (req, res) => {
  const series = await findOwned(req);
  const episode = series.content?.episodes?.id(req.params.episodeId);
  if (!episode) throw ApiError.notFound('Episode not found');
  const limits = {
    title: 200,
    hook: 500,
    summary: 3000,
    videoPrompt: 2000,
    imagePrompt: 4000,
    script: 20000,
  };
  for (const [key, max] of Object.entries(limits)) {
    if (typeof req.body[key] === 'string') episode[key] = req.body[key].slice(0, max);
  }
  await series.save();
  await Project.updateOne({ _id: series.project, user: req.user._id }, { $set: { updatedAt: new Date() } });
  await logActivity(req.user._id, 'project_updated', `Edited episode ${episode.number} of "${series.title}"`, { model: 'Series', id: series._id });
  res.json({ message: 'Episode saved', episode });
};

exports.exportPdf = async (req, res) => {
  const series = await findOwned(req);
  if (series.status !== 'ready') throw ApiError.badRequest('Generate the series before exporting a PDF');
  series.pdfExports += 1;
  await series.save();
  await logActivity(req.user._id, 'pdf_export', `Exported "${series.title}" as PDF`, { model: 'Series', id: series._id });

  const safe = series.title.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'series';
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${safe}-series-bible.pdf"`);
  streamSeriesPdf(series, res);
};

exports.remove = async (req, res) => {
  const series = await findOwned(req);
  await Series.deleteOne({ _id: series._id });
  await Project.updateOne({ _id: series.project, user: req.user._id }, { $unset: { series: 1 }, status: 'archived' });
  res.json({ message: 'Series deleted' });
};

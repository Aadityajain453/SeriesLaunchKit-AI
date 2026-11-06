const Project = require('../models/Project');
const Series = require('../models/Series');
const Video = require('../models/Video');
const ApiError = require('../utils/ApiError');
const { logActivity } = require('../utils/activity');

const KINDS = ['series', 'film', 'general'];
const STATUSES = ['draft', 'in_progress', 'completed', 'archived'];

function readBody(body, { partial }) {
  const values = {};
  const errors = {};
  if (body.title !== undefined || !partial) {
    const t = String(body.title || '').trim();
    if (t.length < 2) errors.title = 'Title must be at least 2 characters';
    else if (t.length > 120) errors.title = 'Title must be 120 characters or fewer';
    else values.title = t;
  }
  if (body.description !== undefined) {
    const d = String(body.description).trim();
    if (d.length > 1000) errors.description = 'Description must be 1000 characters or fewer';
    else values.description = d;
  }
  if (body.kind !== undefined) {
    if (!KINDS.includes(body.kind)) errors.kind = 'Invalid project type';
    else values.kind = body.kind;
  }
  if (body.status !== undefined) {
    if (!STATUSES.includes(body.status)) errors.status = 'Invalid status';
    else values.status = body.status;
  }
  if (Object.keys(errors).length) throw ApiError.badRequest('Please fix the highlighted fields', errors);
  return values;
}

async function findOwned(req) {
  const project = await Project.findOne({ _id: req.params.id, user: req.user._id });
  if (!project) throw ApiError.notFound('Project not found');
  return project;
}

exports.list = async (req, res) => {
  const filter = { user: req.user._id };
  if (STATUSES.includes(req.query.status)) filter.status = req.query.status;
  if (KINDS.includes(req.query.kind)) filter.kind = req.query.kind;
  if (req.query.q) filter.title = { $regex: String(req.query.q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&').slice(0, 80), $options: 'i' };

  const projects = await Project.find(filter).sort({ updatedAt: -1 }).populate('series', 'status content.episodes._id').lean();
  const counts = await Video.aggregate([
    { $match: { user: req.user._id, project: { $in: projects.map((p) => p._id) } } },
    { $group: { _id: '$project', count: { $sum: 1 } } },
  ]);
  const vc = Object.fromEntries(counts.map((c) => [String(c._id), c.count]));
  res.json({
    projects: projects.map((p) => ({
      ...p,
      series: undefined,
      seriesId: p.series?._id || null,
      seriesStatus: p.series?.status || null,
      episodes: p.series?.content?.episodes?.length || 0,
      videos: vc[String(p._id)] || 0,
    })),
  });
};

exports.get = async (req, res) => {
  const project = await findOwned(req);
  const [series, videos] = await Promise.all([
    project.series ? Series.findOne({ _id: project.series, user: req.user._id }).select('title status content.logline content.episodes.number content.episodes.title createdAt') : null,
    Video.find({ user: req.user._id, project: project._id }).sort({ createdAt: -1 }).limit(50),
  ]);
  res.json({ project, series, videos });
};

exports.create = async (req, res) => {
  const values = readBody(req.body, { partial: false });
  const project = await Project.create({ ...values, user: req.user._id });
  await logActivity(req.user._id, 'project_created', `Created project "${project.title}"`, { model: 'Project', id: project._id });
  res.status(201).json({ message: 'Project created', project });
};

exports.update = async (req, res) => {
  const project = await findOwned(req);
  const values = readBody(req.body, { partial: true });
  Object.assign(project, values);
  await project.save();
  await logActivity(req.user._id, 'project_updated', `Updated project "${project.title}"`, { model: 'Project', id: project._id });
  res.json({ message: 'Project updated', project });
};

/** Deletes the project and its series. Videos are kept in My Videos but unlinked. */
exports.remove = async (req, res) => {
  const project = await findOwned(req);
  await Promise.all([
    Series.deleteMany({ project: project._id, user: req.user._id }),
    Video.updateMany({ project: project._id, user: req.user._id }, { $unset: { project: 1 } }),
    Project.deleteOne({ _id: project._id }),
  ]);
  res.json({ message: 'Project deleted' });
};

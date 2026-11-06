const Generation = require('../models/Generation');
const ApiError = require('../utils/ApiError');

const TYPES = ['series_bible', 'episode_script', 'prompt_enhance'];

exports.list = async (req, res) => {
  const filter = { user: req.user._id };
  if (TYPES.includes(req.query.type)) filter.type = req.query.type;
  if (['success', 'failed'].includes(req.query.status)) filter.status = req.query.status;
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);
  const [items, total] = await Promise.all([
    Generation.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).select('-output -input').lean(),
    Generation.countDocuments(filter),
  ]);
  res.json({ generations: items, total, page, pages: Math.max(Math.ceil(total / limit), 1) });
};

exports.get = async (req, res) => {
  const gen = await Generation.findOne({ _id: req.params.id, user: req.user._id }).lean();
  if (!gen) throw ApiError.notFound('Generation not found');
  res.json({ generation: gen });
};

exports.remove = async (req, res) => {
  const r = await Generation.deleteOne({ _id: req.params.id, user: req.user._id });
  if (!r.deletedCount) throw ApiError.notFound('Generation not found');
  res.json({ message: 'Removed from history' });
};

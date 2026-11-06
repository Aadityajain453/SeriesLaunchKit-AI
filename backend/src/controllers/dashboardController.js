const Series = require('../models/Series');
const Project = require('../models/Project');
const Video = require('../models/Video');
const Generation = require('../models/Generation');
const Activity = require('../models/Activity');
const User = require('../models/User');

/** Everything on the dashboard comes from the authenticated user's own records. */
exports.getDashboard = async (req, res) => {
  const user = req.user._id;
  const [
    totalSeries,
    totalProjects,
    totalVideos,
    completedVideos,
    totalGenerations,
    totalPdfExports,
    fresh,
    recentActivity,
    recentProjects,
  ] = await Promise.all([
    Series.countDocuments({ user }),
    Project.countDocuments({ user }),
    Video.countDocuments({ user }),
    Video.countDocuments({ user, status: 'completed' }),
    Generation.countDocuments({ user, status: 'success' }),
    Activity.countDocuments({ user, type: 'pdf_export' }),
    User.findById(user),
    Activity.find({ user }).sort({ createdAt: -1 }).limit(12).lean(),
    Project.find({ user }).sort({ updatedAt: -1 }).limit(6).populate('series', 'status content.episodes').lean(),
  ]);

  const projectIds = recentProjects.map((p) => p._id);
  const videoCounts = await Video.aggregate([
    { $match: { user, project: { $in: projectIds } } },
    { $group: { _id: '$project', count: { $sum: 1 } } },
  ]);
  const vc = Object.fromEntries(videoCounts.map((v) => [String(v._id), v.count]));

  res.json({
    user: fresh.toPublic(),
    stats: {
      totalSeries,
      totalProjects,
      totalVideos,
      completedVideos,
      totalGenerations,
      totalPdfExports,
      credits: fresh.credits,
    },
    recentActivity,
    recentProjects: recentProjects.map((p) => ({
      _id: p._id,
      title: p.title,
      description: p.description,
      kind: p.kind,
      status: p.status,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      seriesId: p.series?._id || null,
      episodes: p.series?.content?.episodes?.length || 0,
      videos: vc[String(p._id)] || 0,
    })),
  });
};

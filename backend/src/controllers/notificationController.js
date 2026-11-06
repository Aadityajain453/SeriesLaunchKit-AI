const Notification = require('../models/Notification');

exports.list = async (req, res) => {
  const [notifications, unread] = await Promise.all([
    Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(20).lean(),
    Notification.countDocuments({ user: req.user._id, read: false }),
  ]);
  res.json({ notifications, unread });
};

exports.markAllRead = async (req, res) => {
  await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
  res.json({ message: 'All notifications marked as read' });
};

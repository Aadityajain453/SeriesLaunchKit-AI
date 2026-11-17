
const mongoose = require('mongoose');
const fs = require('fs/promises');
const path = require('path');

const User = require('../models/User');
const Project = require('../models/Project');
const Series = require('../models/Series');
const Video = require('../models/Video');
const Generation = require('../models/Generation');
const Activity = require('../models/Activity');
const Notification = require('../models/Notification');

const env = require('../config/env');
const ApiError = require('../utils/ApiError');
const { clearAuthCookie } = require('../middleware/auth');

async function getOwnedUploadPaths(userId) {
  const [videos, series] = await Promise.all([
    Video.find({ user: userId }).select('imageUrl').lean(),
    Series.find({ user: userId })
      .select('content.episodes.imageUrl')
      .lean(),
  ]);

  const baseUrl =
    env.storage.baseUrl ||
    (!env.isProd ? `http://localhost:${env.port}` : '');

  if (!baseUrl) return [];

  let base;

  try {
    base = new URL(baseUrl);
  } catch {
    return [];
  }

  const urls = [];

  videos.forEach((video) => {
    if (video.imageUrl) urls.push(video.imageUrl);
  });

  series.forEach((item) => {
    item.content?.episodes?.forEach((episode) => {
      if (episode.imageUrl) urls.push(episode.imageUrl);
    });
  });

  const files = new Set();

  for (const value of urls) {
    try {
      const parsed = new URL(value);

      if (parsed.origin !== base.origin) continue;
      if (!parsed.pathname.startsWith('/uploads/')) continue;

      const filename = path.basename(
        decodeURIComponent(
          parsed.pathname.slice('/uploads/'.length)
        )
      );

      // Only delete UUID-based files created by our upload middleware.
      if (
        !/^[a-f0-9-]{36}\.(jpg|jpeg|png|webp)$/i.test(filename)
      ) {
        continue;
      }

      files.add(path.join(env.storage.uploadDir, filename));
    } catch {
      // Ignore invalid or external URLs.
    }
  }

  return [...files];
}

exports.deleteAccount = async (req, res) => {
  const password = String(req.body.password || '');

  if (!password) {
    throw ApiError.badRequest(
      'Please enter your password to confirm deletion.'
    );
  }

  const user = await User.findById(req.user._id).select('+password');

  if (!user) {
    throw ApiError.notFound('Account not found.');
  }

  const passwordMatches = await user.comparePassword(password);

  if (!passwordMatches) {
    throw ApiError.badRequest(
      'Incorrect password. Your account was not deleted.'
    );
  }

  // Collect local image paths before deleting database records.
  const uploadPaths = await getOwnedUploadPaths(user._id);

  const session = await mongoose.startSession();

  try {
    // Delete all account data in one MongoDB transaction.
    await session.withTransaction(
      async () => {
        await Project.deleteMany(
          { user: user._id },
          { session }
        );

        await Series.deleteMany(
          { user: user._id },
          { session }
        );

        await Video.deleteMany(
          { user: user._id },
          { session }
        );

        await Generation.deleteMany(
          { user: user._id },
          { session }
        );

        await Activity.deleteMany(
          { user: user._id },
          { session }
        );

        await Notification.deleteMany(
          { user: user._id },
          { session }
        );

        const result = await User.deleteOne(
          { _id: user._id },
          { session }
        );

        if (result.deletedCount !== 1) {
          throw ApiError.notFound('Account not found.');
        }
      },
      {
        readPreference: 'primary',
        readConcern: { level: 'snapshot' },
        writeConcern: { w: 'majority' },
      }
    );
  } finally {
    await session.endSession();
  }

  // Database deletion succeeded. Now remove local uploaded images.
  const fileResults = await Promise.allSettled(
    uploadPaths.map((file) => fs.unlink(file))
  );

  const failedFileDeletes = fileResults.filter(
    (result) =>
      result.status === 'rejected' &&
      result.reason?.code !== 'ENOENT'
  );

  // End the authenticated session.
  clearAuthCookie(res);

  return res.json({
    message: 'Your account and application data have been deleted.',
    filesRemoved: fileResults.filter(
      (result) => result.status === 'fulfilled'
    ).length +
      fileResults.filter(
        (result) =>
          result.status === 'rejected' &&
          result.reason?.code === 'ENOENT'
      ).length,
    fileCleanupWarnings: failedFileDeletes.length,
  });
};

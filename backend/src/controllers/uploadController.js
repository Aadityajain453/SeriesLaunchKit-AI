
const ApiError = require('../utils/ApiError');
const env = require('../config/env');

exports.uploadImage = async (req, res) => {
  if (!req.file) {
    throw ApiError.badRequest('Please select an image to upload.');
  }

  const baseUrl =
    env.storage.baseUrl ||
    (env.isProd ? '' : `http://localhost:${env.port}`);

  if (!baseUrl) {
    return res.status(500).json({
      message: 'Image storage URL is not configured. Please set STORAGE_BASE_URL.',
    });
  }

  const imageUrl = `${baseUrl.replace(/\/$/, '')}/uploads/${req.file.filename}`;

  res.status(201).json({
    message: 'Image uploaded successfully.',
    imageUrl,
    filename: req.file.filename,
  });
};

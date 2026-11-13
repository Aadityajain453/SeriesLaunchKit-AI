
const OpenAI = require('openai');
const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');

const env = require('../../config/env');
const ApiError = require('../../utils/ApiError');

let client = null;

function getClient() {
  if (!env.openai.apiKey) {
    throw ApiError.unavailable(
      'OpenAI API key is not configured. Add OPENAI_API_KEY.'
    );
  }

  if (!client) {
    client = new OpenAI({ apiKey: env.openai.apiKey });
  }

  return client;
}

/**
 * Generates an image using OpenAI and saves it
 * to the backend server's storage directory.
 */
async function generateAndSaveImage(prompt) {
  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    throw ApiError.badRequest('Image prompt is required.');
  }

  try {
    const openai = getClient();

    const response = await openai.images.generate({
      model: env.openai.imageModel,
      prompt: prompt.trim(),
      size: '1024x1024',
    });

    const imageBase64 = response.data?.[0]?.b64_json;

    if (!imageBase64) {
      throw new Error('OpenAI returned no image data.');
    }

    // Convert Base64 image into a PNG buffer.
    const imageBuffer = Buffer.from(imageBase64, 'base64');

    // Ensure the storage directory exists.
    await fs.mkdir(env.storage.uploadDir, { recursive: true });

    // Generate a unique filename.
    const filename = `${crypto.randomUUID()}.png`;
    const filePath = path.join(env.storage.uploadDir, filename);

    // Save the image on the backend server.
    await fs.writeFile(filePath, imageBuffer);

    const baseUrl =
      env.storage.baseUrl ||
      (env.isProd ? '' : `http://localhost:${env.port}`);

    if (!baseUrl) {
      await fs.unlink(filePath);
      throw new Error('STORAGE_BASE_URL is not configured.');
    }

    const imageUrl = `${baseUrl.replace(/\/$/, '')}/uploads/${filename}`;

    return {
      imageUrl,
      filename,
      model: response.model || env.openai.imageModel,
    };
  } catch (err) {
    console.error('[image-service] Generation failed:', err.message);

    if (err.status === 401) {
      throw ApiError.unavailable('OpenAI rejected the API key. Check OPENAI_API_KEY.');
    }

    if (err.code === 'insufficient_quota') {
      throw ApiError.unavailable('OpenAI account has insufficient credits.');
    }

    if (err.status === 429) {
      throw new ApiError(429, 'OpenAI is rate limiting requests. Please try again.');
    }

    if (err.status === 400) {
      throw ApiError.badRequest('OpenAI could not process this image prompt.');
    }

    if (err instanceof ApiError) throw err;

    throw new ApiError(502, 'Image generation failed. Please try again.');
  }
}

async function deleteGeneratedImage(filename) {
  const safeFilename = path.basename(filename || '');

  if (!safeFilename || safeFilename !== filename) {
    return;
  }

  const filePath = path.join(env.storage.uploadDir, safeFilename);

  try {
    await fs.unlink(filePath);
  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.error('[image-service] Image cleanup failed:', err.message);
    }
  }
}

module.exports = {
  generateAndSaveImage,
  deleteGeneratedImage,
};

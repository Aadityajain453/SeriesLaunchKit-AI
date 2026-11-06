/**
 * Video provider registry. Pick the provider with VIDEO_PROVIDER in .env.
 * To add another provider (Replicate, SiliconFlow, …) create an adapter with the same
 * interface as kieProvider.js and register it below.
 */
const env = require('../../config/env');
const ApiError = require('../../utils/ApiError');

const providers = {
  kie: require('./kieProvider'),
};

function getProvider() {
  const p = providers[env.video.provider];
  return p || null;
}

function status() {
  const p = getProvider();
  return {
    configured: Boolean(p && p.isConfigured()),
    provider: p ? p.capabilities.name : null,
    label: p ? p.capabilities.label : null,
    resolutions: p ? p.capabilities.resolutions : [],
    aspectRatios: p ? p.capabilities.aspectRatios : [],
    notes: p ? p.capabilities.notes : '',
    maxPromptLength: p ? p.capabilities.maxPromptLength : 2000,
  };
}

function requireProvider() {
  const p = getProvider();
  if (!p || !p.isConfigured()) {
    throw ApiError.unavailable(
      'Video generation is not configured yet. Set VIDEO_PROVIDER and the provider API key in the backend .env file.'
    );
  }
  return p;
}

module.exports = { status, requireProvider, getProvider };

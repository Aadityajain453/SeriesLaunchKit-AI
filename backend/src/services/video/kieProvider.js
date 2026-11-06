/**
 * KIE.ai Veo 3.1 text-to-video adapter.
 * Docs: https://docs.kie.ai/veo3-api/generate-veo-3-video
 *       https://docs.kie.ai/veo3-api/get-veo-3-video-details
 *
 * Every provider adapter exposes the same interface:
 *   capabilities, createTask(input) -> { taskId }, getTask(taskId, input) -> { status, progress, videoUrl, error }
 */
const env = require('../../config/env');

const cfg = env.video.kie;

const capabilities = {
  name: 'kie',
  label: 'Veo 3.1 via KIE.ai',
  resolutions: ['720p', '1080p'],
  aspectRatios: ['16:9', '9:16'],
  // Veo only upgrades landscape videos to 1080p
  notes: '1080p is available for 16:9 videos only. Generation usually takes 1–3 minutes.',
  maxPromptLength: 2000,
};

function isConfigured() {
  return Boolean(cfg.apiKey);
}

async function kieFetch(path, { method = 'GET', body } = {}) {
  const res = await fetch(`${cfg.baseUrl}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${cfg.apiKey}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(30000),
  });
  let json = null;
  try { json = await res.json(); } catch { /* non-JSON */ }
  if (!res.ok || !json || (json.code && json.code !== 200)) {
    const msg = json?.msg || json?.message || `HTTP ${res.status}`;
    const err = new Error(`KIE.ai: ${msg}`);
    err.providerCode = json?.code || res.status;
    throw err;
  }
  return json.data;
}

async function createTask({ prompt, aspectRatio }) {
  const data = await kieFetch('/api/v1/veo/generate', {
    method: 'POST',
    body: {
      prompt,
      model: cfg.model,
      aspectRatio: capabilities.aspectRatios.includes(aspectRatio) ? aspectRatio : '16:9',
      enableTranslation: true,
    },
  });
  if (!data?.taskId) throw new Error('KIE.ai did not return a task id');
  return { taskId: data.taskId };
}

/** Maps KIE status to our status. successFlag: 0 generating, 1 success, 2/3 failed. */
async function getTask(taskId, { resolution, aspectRatio, createdAt }) {
  const data = await kieFetch(`/api/v1/veo/record-info?taskId=${encodeURIComponent(taskId)}`);
  const flag = Number(data?.successFlag);

  if (flag === 2 || flag === 3) {
    return { status: 'failed', error: data?.errorMessage || 'The video provider could not generate this video.' };
  }
  if (flag !== 1) {
    // Rough, time-based progress estimate while the provider is generating (provider gives no percentage).
    const elapsed = (Date.now() - new Date(createdAt).getTime()) / 1000;
    return { status: 'processing', progress: Math.min(90, Math.round((elapsed / 120) * 90)) };
  }

  const baseUrl = data?.response?.resultUrls?.[0];
  if (!baseUrl) return { status: 'failed', error: 'The provider finished but returned no video file.' };

  if (resolution === '1080p' && aspectRatio === '16:9') {
    try {
      const hd = await kieFetch(`/api/v1/veo/get-1080p-video?taskId=${encodeURIComponent(taskId)}&index=0`);
      if (hd?.resultUrl) return { status: 'completed', progress: 100, videoUrl: hd.resultUrl };
    } catch (err) {
      // The 1080p upgrade is still rendering or unavailable. Wait up to 10 minutes, then fall back to 720p.
      const elapsed = (Date.now() - new Date(createdAt).getTime()) / 1000;
      if (elapsed < 600) return { status: 'processing', progress: 95 };
      return { status: 'completed', progress: 100, videoUrl: baseUrl, note: '1080p upgrade unavailable; delivered in 720p.' };
    }
  }
  return { status: 'completed', progress: 100, videoUrl: baseUrl };
}

module.exports = { capabilities, isConfigured, createTask, getTask };

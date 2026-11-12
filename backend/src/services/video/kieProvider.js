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
  label: 'Grok Imagine via KIE.ai',
  resolutions: ['480p', '720p', '1080p'],
  aspectRatios: ['16:9', '9:16'],
  notes: 'Grok Imagine supports text-to-video generation from 6 to 30 seconds.',
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


async function createTask({ prompt, aspectRatio, resolution, duration }) {
  const durationSeconds = parseInt(duration, 10);

  if (!Number.isInteger(durationSeconds) || durationSeconds < 6 || durationSeconds > 30) {
    throw new Error('Grok Imagine supports video durations between 6 and 30 seconds per generation.');
  }

  if (resolution === '1080p' && durationSeconds > 15) {
    throw new Error('1080p supports a maximum video duration of 15 seconds. Choose 720p for longer videos.');
  }

  const data = await kieFetch('/api/v1/jobs/createTask', {
    method: 'POST',
    body: {
      model: cfg.model,
      input: {
        prompt,
        aspect_ratio: capabilities.aspectRatios.includes(aspectRatio) ? aspectRatio : '16:9',
        mode: 'normal',
        duration: durationSeconds,
        resolution: capabilities.resolutions.includes(resolution) ? resolution : '720p',
      },
    },
  });

  if (!data?.taskId) throw new Error('KIE.ai did not return a task id');

  return { taskId: data.taskId };
}


/** Maps KIE status to our status. successFlag: 0 generating, 1 success, 2/3 failed. */


async function getTask(taskId) {
  const data = await kieFetch(
    `/api/v1/jobs/recordInfo?taskId=${encodeURIComponent(taskId)}`
  );

  if (data?.state === 'fail') {
    return {
      status: 'failed',
      error: data?.failMsg || 'Grok Imagine could not generate this video.',
    };
  }

  if (data?.state !== 'success') {
    return {
      status: 'processing',
      progress: Number(data?.progress) || 10,
    };
  }

  let result;

  try {
    result = typeof data.resultJson === 'string'
      ? JSON.parse(data.resultJson)
      : data.resultJson;
  } catch {
    return {
      status: 'failed',
      error: 'Could not read the video result returned by KIE.ai.',
    };
  }

  const videoUrl = result?.resultUrls?.[0];

  if (!videoUrl) {
    return {
      status: 'failed',
      error: 'Grok Imagine finished but returned no video URL.',
    };
  }

  return {
    status: 'completed',
    progress: 100,
    videoUrl,
  };
}


module.exports = { capabilities, isConfigured, createTask, getTask };

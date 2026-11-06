/**
 * Anthropic Claude text-generation service.
 * All Claude calls go through here; the API key never leaves the backend.
 */
const Anthropic = require('@anthropic-ai/sdk');
const env = require('../../config/env');
const ApiError = require('../../utils/ApiError');
const { SERIES_FIELDS } = require('../../config/seriesFields');

let client = null;
function getClient() {
  if (!env.anthropic.apiKey) {
    throw ApiError.unavailable('AI text generation is not configured. Add ANTHROPIC_API_KEY to the backend .env file.');
  }
  if (!client) client = new Anthropic({ apiKey: env.anthropic.apiKey });
  return client;
}

function isConfigured() {
  return Boolean(env.anthropic.apiKey);
}

async function complete({ system, prompt, maxTokens = 4000, temperature = 0.8 }) {
  const anthropic = getClient();
  let response;
  try {
    response = await anthropic.messages.create({
      model: env.anthropic.model,
      max_tokens: maxTokens,
      temperature,
      system,
      messages: [{ role: 'user', content: prompt }],
    });
  } catch (err) {
    const status = err.status || 502;
    console.error('[claude] request failed', status, err.message);
    if (status === 401) throw ApiError.unavailable('The AI provider rejected the API key. Check ANTHROPIC_API_KEY.');
    if (status === 429) throw new ApiError(429, 'The AI provider is rate limiting requests. Please try again in a minute.');
    throw new ApiError(502, 'The AI provider could not complete the request. Please try again.');
  }
  const text = (response.content || [])
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('')
    .trim();
  if (!text) throw new ApiError(502, 'The AI provider returned an empty response.');
  return {
    text,
    model: response.model,
    stopReason: response.stop_reason,
    usage: { inputTokens: response.usage?.input_tokens, outputTokens: response.usage?.output_tokens },
  };
}

function parseJson(text) {
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('No JSON object in response');
  return JSON.parse(cleaned.slice(start, end + 1));
}

const str = (v, max = 4000) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const arr = (v, max = 20) => (Array.isArray(v) ? v.slice(0, max) : []);

function describeInputs(inputs) {
  return SERIES_FIELDS.filter((f) => inputs[f.key] !== undefined && inputs[f.key] !== '')
    .map((f) => `- ${f.label}: ${inputs[f.key]}`)
    .join('\n');
}

/** Generates a full series bible (overview, characters, episode outlines, marketing). */
async function generateSeriesBible(inputs) {
  const episodeCount = Number(inputs.episodeCount) || 5;
  const system =
    'You are an award-winning showrunner and short-form video strategist. ' +
    'You design binge-worthy episodic video series for social platforms. ' +
    'You always respond with a single valid JSON object and nothing else.';

  const prompt = `Create a complete series plan from this brief:
${describeInputs(inputs)}

Write all text in ${inputs.language || 'English'}.
Return ONLY JSON with exactly this shape:
{
  "logline": "one-sentence hook for the whole series",
  "synopsis": "2-3 paragraph series synopsis",
  "themes": ["theme", "..."],
  "characters": [{ "name": "", "role": "", "description": "" }],
  "episodes": [
    {
      "number": 1,
      "title": "",
      "hook": "the first 3 seconds that stop the scroll",
      "summary": "what happens in this episode",
      "keyBeats": ["beat 1", "beat 2", "beat 3"],
      "videoPrompt": "a single detailed text-to-video prompt (subject, action, setting, camera, lighting, ${inputs.visualStyle || 'cinematic'} style) for the key scene of this episode"
    }
  ],
  "marketing": { "tagline": "", "hashtags": ["#..."], "thumbnailIdeas": ["..."] }
}
Rules: exactly ${episodeCount} episodes numbered 1-${episodeCount}; each episode must end on a cliffhanger or reason to watch the next one; ${inputs.mainCharacters ? 'use the characters provided' : 'invent 2-5 memorable characters'}; episodes must fit a ${inputs.episodeDuration || '60 second'} runtime.`;

  const result = await complete({ system, prompt, maxTokens: 8000 });
  let data;
  try {
    data = parseJson(result.text);
  } catch (err) {
    console.error('[claude] could not parse series JSON', err.message, result.stopReason);
    throw new ApiError(502, 'The AI response could not be read. No credits were used — please try again.');
  }

  const content = {
    logline: str(data.logline, 500),
    synopsis: str(data.synopsis, 6000),
    themes: arr(data.themes, 10).map((t) => str(t, 120)).filter(Boolean),
    characters: arr(data.characters, 10).map((c) => ({
      name: str(c?.name, 120),
      role: str(c?.role, 200),
      description: str(c?.description, 1000),
    })).filter((c) => c.name),
    episodes: arr(data.episodes, 12).map((e, i) => ({
      number: Number(e?.number) || i + 1,
      title: str(e?.title, 200),
      hook: str(e?.hook, 500),
      summary: str(e?.summary, 3000),
      keyBeats: arr(e?.keyBeats, 10).map((b) => str(b, 400)).filter(Boolean),
      videoPrompt: str(e?.videoPrompt, 2000),
    })),
    marketing: {
      tagline: str(data.marketing?.tagline, 300),
      hashtags: arr(data.marketing?.hashtags, 20).map((h) => str(h, 60)).filter(Boolean),
      thumbnailIdeas: arr(data.marketing?.thumbnailIdeas, 10).map((t) => str(t, 300)).filter(Boolean),
    },
  };
  if (!content.episodes.length) {
    throw new ApiError(502, 'The AI response did not include any episodes. No credits were used — please try again.');
  }
  return { content, raw: result.text, model: result.model, usage: result.usage };
}

/** Writes a full production script for one episode. */
async function generateEpisodeScript(series, episode) {
  const inputs = series.inputs || {};
  const system =
    'You are a professional screenwriter for short-form vertical and horizontal video. ' +
    'Write tight, production-ready scripts with scene headings, visual directions, narration/dialogue and on-screen text.';
  const prompt = `Series: ${series.title}
Logline: ${series.content?.logline || ''}
Characters: ${(series.content?.characters || []).map((c) => `${c.name} (${c.role})`).join(', ') || 'n/a'}
Tone: ${inputs.tone || ''} | Visual style: ${inputs.visualStyle || ''} | Platform: ${inputs.platform || ''}
Runtime: ${inputs.episodeDuration || '60 seconds'} | Narration: ${inputs.narrationStyle || 'Narrator voice-over'}
Language: ${inputs.language || 'English'}

Episode ${episode.number}: ${episode.title}
Hook: ${episode.hook}
Summary: ${episode.summary}
Key beats: ${(episode.keyBeats || []).join(' | ')}
${inputs.callToAction ? `End with this call to action: ${inputs.callToAction}` : ''}

Write the complete script now in plain text (no markdown code fences). Use the format:
SCENE n — LOCATION
VISUAL: ...
NARRATION / DIALOGUE: ...
ON-SCREEN TEXT: ...`;
  const result = await complete({ system, prompt, maxTokens: 3000, temperature: 0.7 });
  return { script: result.text, model: result.model, usage: result.usage };
}

/** Rewrites a rough idea into a detailed text-to-video prompt. */
async function enhanceVideoPrompt(prompt, { aspectRatio, style } = {}) {
  const system =
    'You turn rough ideas into a single vivid text-to-video prompt. Describe subject, action, setting, camera movement, ' +
    'lens, lighting, mood and style in under 120 words. Reply with the prompt only — no preamble, no quotes.';
  const result = await complete({
    system,
    prompt: `Idea: ${prompt}\nAspect ratio: ${aspectRatio || '16:9'}${style ? `\nStyle: ${style}` : ''}`,
    maxTokens: 400,
    temperature: 0.7,
  });
  return { prompt: result.text.replace(/^"|"$/g, ''), model: result.model, usage: result.usage };
}

module.exports = { isConfigured, generateSeriesBible, generateEpisodeScript, enhanceVideoPrompt };

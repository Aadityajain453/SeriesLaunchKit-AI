/**
 * SERIES STUDIO FORM FIELDS — single source of truth.
 *
 * The frontend renders the Series Studio form from GET /api/series/fields,
 * and the backend validates submissions against this same list.
 * To match the Product Development PDF, edit ONLY this file:
 * add / remove / rename entries, and the form + validation + PDF export follow.
 *
 * Supported types: text, textarea, select, number
 * Optional keys: required, placeholder, help, options, min, max, maxLength, group, col (Bootstrap md width 1-12)
 */
const SERIES_FIELDS = [
  // ---- Series basics ----
  { key: 'title', label: 'Series Title', type: 'text', required: true, maxLength: 120, group: 'Series Basics', col: 8,
    placeholder: 'e.g. Midnight Mysteries of Old Delhi' },
  { key: 'genre', label: 'Genre', type: 'select', required: true, group: 'Series Basics', col: 4,
    options: ['Drama', 'Comedy', 'Thriller', 'Mystery', 'Horror', 'Sci-Fi', 'Fantasy', 'Romance', 'Action / Adventure',
      'Documentary', 'Educational', 'Kids & Family', 'Motivational', 'True Crime', 'History', 'Lifestyle'] },
  { key: 'niche', label: 'Niche / Topic', type: 'text', required: true, maxLength: 160, group: 'Series Basics', col: 6,
    placeholder: 'e.g. Unsolved urban legends' },
  { key: 'targetAudience', label: 'Target Audience', type: 'text', required: true, maxLength: 200, group: 'Series Basics', col: 6,
    placeholder: 'e.g. 18-35 mystery lovers on YouTube Shorts' },
  { key: 'premise', label: 'Series Premise / Concept', type: 'textarea', required: true, maxLength: 2000, group: 'Series Basics', col: 12,
    placeholder: 'Describe the core idea of the series in a few sentences…' },

  // ---- Story & world ----
  { key: 'mainCharacters', label: 'Main Characters', type: 'textarea', maxLength: 2000, group: 'Story & World', col: 6,
    placeholder: 'Names, roles and a line about each (leave blank to let AI create them)' },
  { key: 'setting', label: 'Setting / World', type: 'textarea', maxLength: 1500, group: 'Story & World', col: 6,
    placeholder: 'Where and when the story takes place' },
  { key: 'tone', label: 'Tone', type: 'select', required: true, group: 'Story & World', col: 4,
    options: ['Dark & Suspenseful', 'Light & Funny', 'Inspirational', 'Emotional', 'Epic', 'Educational & Clear', 'Calm & Relaxing', 'Energetic'] },
  { key: 'visualStyle', label: 'Visual Style', type: 'select', required: true, group: 'Story & World', col: 4,
    options: ['Cinematic Realistic', '3D Animation', '2D Cartoon', 'Anime', 'Stop Motion', 'Watercolor', 'Documentary Footage', 'Minimalist Motion Graphics'] },
  { key: 'language', label: 'Language', type: 'select', required: true, group: 'Story & World', col: 4,
    options: ['English', 'Hindi', 'Spanish', 'French', 'German', 'Portuguese', 'Arabic', 'Japanese'] },

  // ---- Format & distribution ----
  { key: 'platform', label: 'Primary Platform', type: 'select', required: true, group: 'Format & Distribution', col: 4,
    options: ['YouTube', 'YouTube Shorts', 'TikTok', 'Instagram Reels', 'Facebook', 'Multi-platform'] },
  { key: 'episodeCount', label: 'Number of Episodes', type: 'number', required: true, min: 1, max: 12, group: 'Format & Distribution', col: 4 },
  { key: 'episodeDuration', label: 'Episode Duration', type: 'select', required: true, group: 'Format & Distribution', col: 4,
    options: ['15 seconds', '30 seconds', '60 seconds', '2-3 minutes', '5 minutes', '10 minutes'] },
  { key: 'narrationStyle', label: 'Narration / Voice Style', type: 'select', group: 'Format & Distribution', col: 6,
    options: ['Narrator voice-over', 'Character dialogue', 'Narrator + dialogue', 'No narration (visual only)'] },
  { key: 'callToAction', label: 'Call to Action', type: 'text', maxLength: 200, group: 'Format & Distribution', col: 6,
    placeholder: 'e.g. Follow for Part 2' },
  { key: 'keywords', label: 'Keywords / Hashtags', type: 'text', maxLength: 300, group: 'Format & Distribution', col: 12,
    placeholder: 'Comma separated' },
];

/** Validates and normalises a submission. Returns { values, errors }. */
function validateSeriesInput(body = {}) {
  const values = {};
  const errors = {};
  for (const f of SERIES_FIELDS) {
    let v = body[f.key];
    if (typeof v === 'string') v = v.trim();
    const empty = v === undefined || v === null || v === '';
    if (empty) {
      if (f.required) errors[f.key] = `${f.label} is required`;
      continue;
    }
    if (f.type === 'number') {
      const n = Number(v);
      if (!Number.isInteger(n)) { errors[f.key] = `${f.label} must be a whole number`; continue; }
      if (f.min !== undefined && n < f.min) { errors[f.key] = `${f.label} must be at least ${f.min}`; continue; }
      if (f.max !== undefined && n > f.max) { errors[f.key] = `${f.label} must be at most ${f.max}`; continue; }
      values[f.key] = n;
      continue;
    }
    v = String(v);
    if (f.type === 'select' && f.options && !f.options.includes(v)) {
      errors[f.key] = `Choose a valid ${f.label}`;
      continue;
    }
    if (f.maxLength && v.length > f.maxLength) {
      errors[f.key] = `${f.label} must be ${f.maxLength} characters or fewer`;
      continue;
    }
    values[f.key] = v;
  }
  return { values, errors };
}

module.exports = { SERIES_FIELDS, validateSeriesInput };

/**
 * Training modules shown on the Training page.
 * Add a YouTube/Vimeo embed URL to `videoUrl` to show a video lesson above the steps.
 */
module.exports = [
  {
    id: 'getting-started',
    title: 'Getting Started with SeriesLaunchKit AI',
    level: 'Beginner',
    duration: '5 min read',
    videoUrl: '',
    summary: 'A quick tour of the dashboard, credits and where everything lives.',
    steps: [
      'Your Dashboard shows live totals for series, projects, videos, AI generations and PDF exports — all from your own account.',
      'Credits are shown in the top bar. Each AI action shows its credit cost before you run it, and failed jobs are refunded automatically.',
      'Use the Create New button in the top bar to jump straight into Series Studio, Film Studio or a new project.',
      'Recent Activity lists everything you have done so you can pick up where you left off.',
    ],
  },
  {
    id: 'series-studio',
    title: 'Plan a Complete Series in Series Studio',
    level: 'Beginner',
    duration: '8 min read',
    videoUrl: '',
    summary: 'Turn one idea into a full multi-episode series plan with characters, hooks and video prompts.',
    steps: [
      'Open Series Studio and click New Series.',
      'Fill in the series basics: title, genre, niche, target audience and a clear premise. The more specific the premise, the better the episodes.',
      'Add characters and a setting if you already have them — or leave them blank and the AI will invent them.',
      'Choose platform, number of episodes and episode duration so pacing matches where you will publish.',
      'Click Generate Series. In about a minute you get a logline, synopsis, characters, episode outlines and a marketing kit.',
      'Open any episode to edit it, generate a full production script, or send its video prompt to Film Studio.',
    ],
  },
  {
    id: 'film-studio',
    title: 'Generate Videos in Film Studio',
    level: 'Beginner',
    duration: '6 min read',
    videoUrl: '',
    summary: 'Write prompts that produce cinematic text-to-video results.',
    steps: [
      'Describe one scene: subject, action, setting, camera movement, lighting and style.',
      'Use Enhance with AI to expand a rough idea into a detailed prompt (costs 1 credit).',
      'Pick 9:16 for Shorts, Reels and TikTok; 16:9 for YouTube. 1080p is available for 16:9.',
      'Click Generate Video. Rendering usually takes 1–3 minutes; you can leave the page and find the result in My Videos.',
      'Download finished videos from the preview or from My Videos.',
    ],
  },
  {
    id: 'prompt-craft',
    title: 'Prompt Craft: Hooks That Stop the Scroll',
    level: 'Intermediate',
    duration: '7 min read',
    videoUrl: '',
    summary: 'Structure the first three seconds so viewers stay for the whole episode.',
    steps: [
      'Open on motion or a surprising image — never on a title card.',
      'State the stakes in one line of narration within the first two seconds.',
      'End every episode on an open question so the next episode is the answer.',
      'Keep one idea per shot in your video prompts; long multi-scene prompts produce muddy results.',
      'Reuse the same character description wording across prompts to keep characters consistent.',
    ],
  },
  {
    id: 'export-publish',
    title: 'Export, Organise and Publish',
    level: 'Intermediate',
    duration: '5 min read',
    videoUrl: '',
    summary: 'Use projects and PDF series bibles to manage production and share with clients or editors.',
    steps: [
      'Every series automatically gets a project. Create extra projects in My Projects for one-off films.',
      'Attach Film Studio videos to a project so all assets for a series stay together.',
      'Export a series as a PDF series bible to share with collaborators, clients or voice-over artists.',
      'Use the hashtags and thumbnail ideas from the marketing kit when you publish each episode.',
    ],
  },
];

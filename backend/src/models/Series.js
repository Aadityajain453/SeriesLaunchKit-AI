const mongoose = require('mongoose');

const characterSchema = new mongoose.Schema(
  { name: String, role: String, description: String },
  { _id: false }
);

const episodeSchema = new mongoose.Schema({
  number: Number,
  title: String,
  hook: String,
  summary: String,
  keyBeats: [String],
  videoPrompt: String,
  script: { type: String, default: '' },
  imagePrompt: { type: String, default: '' },
  imageUrl: { type: String, default: '' },
});

const seriesSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
    title: { type: String, required: true, trim: true },
    // Raw form values as defined in config/seriesFields.js
    inputs: { type: mongoose.Schema.Types.Mixed, required: true },
    status: { type: String, enum: ['draft', 'generating', 'ready', 'failed'], default: 'draft' },
    error: { type: String, default: '' },
    content: {
      logline: String,
      synopsis: String,
      themes: [String],
      characters: [characterSchema],
      episodes: [episodeSchema],
      marketing: {
        tagline: String,
        hashtags: [String],
        thumbnailIdeas: [String],
      },
    },
    pdfExports: { type: Number, default: 0 },
  },
  { timestamps: true }
);

seriesSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Series', seriesSchema);

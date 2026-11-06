const mongoose = require('mongoose');

/** Every AI text generation call made on behalf of a user. */
const generationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: ['series_bible', 'episode_script', 'prompt_enhance'], required: true },
    title: { type: String, default: '' },
    model: { type: String },
    input: { type: String, default: '' },
    output: { type: String, default: '' },
    status: { type: String, enum: ['success', 'failed'], required: true },
    error: { type: String, default: '' },
    creditsUsed: { type: Number, default: 0 },
    usage: { inputTokens: Number, outputTokens: Number },
    series: { type: mongoose.Schema.Types.ObjectId, ref: 'Series' },
  },
  { timestamps: true }
);

generationSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Generation', generationSchema);

const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
    title: { type: String, trim: true, maxlength: 120, default: '' },
    prompt: { type: String, required: true, maxlength: 4000 },
    description: { type: String, maxlength: 2000, default: '' },
    resolution: { type: String, default: '720p' },
    aspectRatio: { type: String, default: '16:9' },
    duration: { type: String, enum: ['15 seconds', '30 seconds', '60 seconds'], default: '15 seconds' },
    provider: { type: String, required: true },
    providerModel: { type: String },
    providerTaskId: { type: String, index: true },
    status: { type: String, enum: ['queued', 'processing', 'completed', 'failed', 'cancelled'], default: 'queued' },
    progress: { type: Number, default: 0 },
    videoUrl: { type: String, default: '' },
    error: { type: String, default: '' },
    creditsUsed: { type: Number, default: 0 },
    refunded: { type: Boolean, default: false },
    lastCheckedAt: { type: Date },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

videoSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Video', videoSchema);

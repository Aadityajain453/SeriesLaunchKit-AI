const mongoose = require('mongoose');

const ACTIVITY_TYPES = [
  'series_created',
  'project_created',
  'project_updated',
  'video_generated',
  'ai_generation',
  'pdf_export',
];

const activitySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: ACTIVITY_TYPES, required: true },
    message: { type: String, required: true },
    refModel: { type: String, enum: ['Series', 'Project', 'Video', 'Generation'] },
    refId: { type: mongoose.Schema.Types.ObjectId },
  },
  { timestamps: true }
);

activitySchema.index({ user: 1, createdAt: -1 });
activitySchema.index({ user: 1, type: 1 });

module.exports = mongoose.model('Activity', activitySchema);
module.exports.ACTIVITY_TYPES = ACTIVITY_TYPES;

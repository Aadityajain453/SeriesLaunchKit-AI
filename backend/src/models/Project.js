const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 1000, default: '' },
    kind: { type: String, enum: ['series', 'film', 'general'], default: 'general' },
    status: { type: String, enum: ['draft', 'in_progress', 'completed', 'archived'], default: 'draft' },
    series: { type: mongoose.Schema.Types.ObjectId, ref: 'Series' },
  },
  { timestamps: true }
);

projectSchema.index({ user: 1, updatedAt: -1 });

module.exports = mongoose.model('Project', projectSchema);

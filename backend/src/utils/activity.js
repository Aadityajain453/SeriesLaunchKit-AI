const Activity = require('../models/Activity');
const Notification = require('../models/Notification');

/** Activity logging must never break the main request, so errors are swallowed and logged. */
async function logActivity(user, type, message, ref = {}) {
  try {
    await Activity.create({ user, type, message, refModel: ref.model, refId: ref.id });
  } catch (err) {
    console.error('[activity] failed to log', err.message);
  }
}

async function notify(user, { title, message = '', variant = 'info', link = '' }) {
  try {
    await Notification.create({ user, title, message, variant, link });
  } catch (err) {
    console.error('[notify] failed', err.message);
  }
}

module.exports = { logActivity, notify };

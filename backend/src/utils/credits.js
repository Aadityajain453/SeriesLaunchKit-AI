const User = require('../models/User');
const ApiError = require('./ApiError');

/**
 * Atomically deducts credits. Fails with 402 if the balance is too low,
 * so two concurrent requests can never overspend.
 */
async function spendCredits(userId, amount) {
  if (!amount) return;
  const result = await User.updateOne(
    { _id: userId, credits: { $gte: amount } },
    { $inc: { credits: -amount } }
  );
  if (result.modifiedCount !== 1) {
    throw ApiError.paymentRequired(`This action needs ${amount} credit${amount === 1 ? '' : 's'}. You don't have enough credits.`);
  }
}

async function refundCredits(userId, amount) {
  if (!amount) return;
  await User.updateOne({ _id: userId }, { $inc: { credits: amount } });
}

module.exports = { spendCredits, refundCredits };

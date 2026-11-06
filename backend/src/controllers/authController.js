const User = require('../models/User');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');
const { signToken, setAuthCookie, clearAuthCookie } = require('../middleware/auth');
const { notify } = require('../utils/activity');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PASSWORD_RE = /^(?=.*[A-Za-z])(?=.*\d).{8,128}$/;

exports.signup = async (req, res) => {
  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  const confirmPassword = String(req.body.confirmPassword || '');

  const errors = {};
  if (name.length < 2) errors.name = 'Full name must be at least 2 characters';
  else if (name.length > 80) errors.name = 'Full name must be 80 characters or fewer';
  if (!EMAIL_RE.test(email)) errors.email = 'Enter a valid email address';
  if (!PASSWORD_RE.test(password)) errors.password = 'Password must be 8+ characters and include a letter and a number';
  if (password !== confirmPassword) errors.confirmPassword = 'Passwords do not match';
  if (Object.keys(errors).length) throw ApiError.badRequest('Please fix the highlighted fields', errors);

  if (await User.exists({ email })) {
    throw new ApiError(409, 'An account with this email already exists', { email: 'This email is already registered' });
  }

  const user = await User.create({ name, email, password, credits: env.credits.signup });
  await notify(user._id, {
    title: 'Welcome to SeriesLaunchKit AI',
    message: `Your account is ready with ${env.credits.signup} credits. Start in Series Studio.`,
    variant: 'success',
    link: '/series-studio',
  });
  res.status(201).json({ message: 'Account created successfully. Please log in.' });
};

exports.login = async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  const errors = {};
  if (!EMAIL_RE.test(email)) errors.email = 'Enter a valid email address';
  if (!password) errors.password = 'Password is required';
  if (Object.keys(errors).length) throw ApiError.badRequest('Please fix the highlighted fields', errors);

  const user = await User.findOne({ email }).select('+password');
  // Same message for unknown email and wrong password, so accounts can't be enumerated.
  if (!user || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized('Incorrect email or password');
  }
  user.lastLoginAt = new Date();
  await user.save();

  setAuthCookie(res, signToken(user._id));
  res.json({ message: `Welcome back, ${user.name.split(' ')[0]}!`, user: user.toPublic() });
};

exports.logout = async (req, res) => {
  clearAuthCookie(res);
  res.json({ message: 'You have been logged out' });
};

exports.me = async (req, res) => {
  res.json({ user: req.user.toPublic() });
};

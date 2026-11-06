const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');

const COOKIE_NAME = 'slk_token';

function cookieOptions() {
  return {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: env.cookieSameSite,
    path: '/',
  };
}

function signToken(userId) {
  return jwt.sign({ sub: String(userId) }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
}

function setAuthCookie(res, token) {
  const decoded = jwt.decode(token);
  res.cookie(COOKIE_NAME, token, {
    ...cookieOptions(),
    maxAge: decoded?.exp ? decoded.exp * 1000 - Date.now() : 7 * 24 * 3600 * 1000,
  });
}

function clearAuthCookie(res) {
  res.clearCookie(COOKIE_NAME, cookieOptions());
}

/** Protects routes: requires a valid JWT in the httpOnly cookie. */
async function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.[COOKIE_NAME];
    if (!token) throw ApiError.unauthorized();
    let payload;
    try {
      payload = jwt.verify(token, env.jwtSecret);
    } catch {
      clearAuthCookie(res);
      throw ApiError.unauthorized('Your session has expired. Please log in again.');
    }
    const user = await User.findById(payload.sub);
    if (!user) {
      clearAuthCookie(res);
      throw ApiError.unauthorized('Account not found. Please log in again.');
    }
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { requireAuth, signToken, setAuthCookie, clearAuthCookie };

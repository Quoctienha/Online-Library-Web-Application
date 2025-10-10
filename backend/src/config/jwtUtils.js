import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import RefreshToken from '../models/RefreshToken.js';
import ms from 'ms';

// Generate Access Token (short-lived)
export const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || '15m' }
  );
};

// Generate Refresh Token (long-lived)
export const generateRefreshToken = async (user, ipAddress) => {
  const token = crypto.randomBytes(40).toString('hex');

  // Parse REFRESH_TOKEN_EXPIRY (e.g. "5m", "7d")
  const expiryDuration = process.env.REFRESH_TOKEN_EXPIRY
    ? ms(process.env.REFRESH_TOKEN_EXPIRY)
    : ms('7d');

  const expiresAt = new Date(Date.now() + expiryDuration);

  await RefreshToken.create({
    token,
    user: user._id,
    expiresAt,
    createdByIp: ipAddress
  });

  return token;
};

// Set refresh token cookie
export const setRefreshTokenCookie = (res, token) => {
  // Parse same REFRESH_TOKEN_EXPIRY for cookie
  const expiryDuration = process.env.REFRESH_TOKEN_EXPIRY
    ? ms(process.env.REFRESH_TOKEN_EXPIRY)
    : ms('7d');

  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: expiryDuration,
    path: '/'
  });
};
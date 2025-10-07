import express from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import passport from 'passport';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import RefreshToken from '../models/RefreshToken.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Generate Access Token (short-lived)
const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || '15m' }
  );
};

// Generate Refresh Token (long-lived)
const generateRefreshToken = async (user, ipAddress) => {
  const token = crypto.randomBytes(40).toString('hex');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  
  await RefreshToken.create({
    token,
    user: user._id,
    expiresAt,
    createdByIp: ipAddress
  });

  return token;
};

// Set refresh token cookie
const setRefreshTokenCookie = (res, token) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/'
  });
};

// @route   POST /api/auth/register
router.post('/register', [
  body('email').isEmail().withMessage('Email không hợp lệ'),
  body('password').isLength({ min: 6 }).withMessage('Mật khẩu phải có ít nhất 6 ký tự'),
  body('name').notEmpty().withMessage('Tên không được để trống')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, name } = req.body;
    const existingUser = await User.findOne({ email });
    
    if (existingUser) {
      return res.status(400).json({ message: 'Email đã được sử dụng' });
    }

    const user = await User.create({ email, password, name, role: 'user' });
    const accessToken = generateAccessToken(user);
    const refreshToken = await generateRefreshToken(user, req.ip);

    setRefreshTokenCookie(res, refreshToken);

    res.status(201).json({
      message: 'Đăng ký thành công',
      accessToken,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// @route   POST /api/auth/login
router.post('/login', [
  body('email').isEmail().withMessage('Email không hợp lệ'),
  body('password').notEmpty().withMessage('Mật khẩu không được để trống')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = await generateRefreshToken(user, req.ip);

    setRefreshTokenCookie(res, refreshToken);

    res.json({
      message: 'Đăng nhập thành công',
      accessToken,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// @route   POST /api/auth/refresh-token
router.post('/refresh-token', async (req, res) => {
  try {
    const token = req.cookies.refreshToken;
    
    if (!token) {
      return res.status(401).json({ message: 'Refresh token không tồn tại' });
    }

    const refreshToken = await RefreshToken.findOne({ token }).populate('user');

    if (!refreshToken || !refreshToken.isActive) {
      return res.status(401).json({ message: 'Refresh token không hợp lệ' });
    }

    const newAccessToken = generateAccessToken(refreshToken.user);
    const newRefreshToken = await generateRefreshToken(refreshToken.user, req.ip);
    
    refreshToken.revoke(req.ip, newRefreshToken);
    await refreshToken.save();

    setRefreshTokenCookie(res, newRefreshToken);

    res.json({
      accessToken: newAccessToken,
      user: {
        id: refreshToken.user._id,
        email: refreshToken.user.email,
        name: refreshToken.user.name,
        role: refreshToken.user.role,
        avatar: refreshToken.user.avatar
      }
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// @route   POST /api/auth/logout
router.post('/logout', verifyToken, async (req, res) => {
  try {
    const token = req.cookies.refreshToken;
    
    if (token) {
      const refreshToken = await RefreshToken.findOne({ token });
      if (refreshToken) {
        refreshToken.revoke(req.ip);
        await refreshToken.save();
      }
    }

    res.clearCookie('refreshToken');
    res.json({ message: 'Đăng xuất thành công' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// @route   GET /api/auth/me
router.get('/me', verifyToken, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user._id,
        email: req.user.email,
        name: req.user.name,
        role: req.user.role,
        avatar: req.user.avatar
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// @route   GET /api/auth/google
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// @route   GET /api/auth/google/callback
router.get('/google/callback',
  passport.authenticate('google', { 
    session: false, 
    failureRedirect: `${process.env.CLIENT_URL}/login` 
  }),
  async (req, res) => {
    try {
      const accessToken = generateAccessToken(req.user);
      const refreshToken = await generateRefreshToken(req.user, req.ip);
      
      setRefreshTokenCookie(res, refreshToken);
      res.redirect(`${process.env.CLIENT_URL}/auth/success?token=${accessToken}`);
    } catch (error) {
      console.error('Google callback error:', error);
      res.redirect(`${process.env.CLIENT_URL}/login?error=auth_failed`);
    }
  }
);

export default router;
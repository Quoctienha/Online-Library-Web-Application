import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import RefreshToken from '../models/RefreshToken.js';
import { generateAccessToken, generateRefreshToken, setRefreshTokenCookie } from '../config/jwtUtils.js';

// Validation middleware for register and login
export const validateRegister = [
  body('email').isEmail().withMessage('Email không hợp lệ'),
  body('password').isLength({ min: 6 }).withMessage('Mật khẩu phải có ít nhất 6 ký tự'),
  body('name').notEmpty().withMessage('Tên không được để trống')
];

export const validateLogin = [
  body('email').isEmail().withMessage('Email không hợp lệ'),
  body('password').notEmpty().withMessage('Mật khẩu không được để trống')
];

// Register a new user
export const register = async (req, res) => {
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
};

// Login a user
export const login = async (req, res) => {
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
};

// Refresh access token
export const refreshToken = async (req, res) => {
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
    //const newRefreshToken = await generateRefreshToken(refreshToken.user, req.ip);

    //refreshToken.revoke(req.ip, newRefreshToken);
    //await refreshToken.save();

    //setRefreshTokenCookie(res, refreshToken);

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
};

// Logout a user
export const logout = async (req, res) => {
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
};

// Get current user
export const getCurrentUser = async (req, res) => {
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
};

// Handle Google callback
export const googleCallback = async (req, res) => {
  try {
    const accessToken = generateAccessToken(req.user);
    const refreshToken = await generateRefreshToken(req.user, req.ip);

    setRefreshTokenCookie(res, refreshToken);
    res.redirect(`${process.env.CLIENT_URL}/auth/success?token=${accessToken}`);
  } catch (error) {
    console.error('Google callback error:', error);
    res.redirect(`${process.env.CLIENT_URL}/login?error=auth_failed`);
  }
};
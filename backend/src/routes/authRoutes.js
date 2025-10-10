import express from 'express';
import passport from 'passport';
import { verifyToken } from '../middleware/auth.js';
import {
  validateRegister,
  validateLogin,
  register,
  login,
  refreshToken,
  logout,
  getCurrentUser,
  googleCallback
} from '../controllers/authController.js';

const router = express.Router();

// @route   POST /api/auth/register
router.post('/register', validateRegister, register);

// @route   POST /api/auth/login
router.post('/login', validateLogin, login);

// @route   POST /api/auth/refresh-token
router.post('/refresh-token', refreshToken);

// @route   POST /api/auth/logout
router.post('/logout', verifyToken, logout);

// @route   GET /api/auth/me
router.get('/me', verifyToken, getCurrentUser);

// @route   GET /api/auth/google
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// @route   GET /api/auth/google/callback
router.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${process.env.CLIENT_URL}/login`
  }),
  googleCallback
);

export default router;
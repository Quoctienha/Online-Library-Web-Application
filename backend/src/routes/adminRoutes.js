import express from 'express';
import { verifyToken, isAdmin } from '../middleware/auth.js';
import { upload } from '../config/multerConfig.js';
import { createBook, updateBook, deleteBook, getStats } from '../controllers/adminController.js';

const router = express.Router();

// Apply admin middleware to all routes
router.use(verifyToken, isAdmin);

// @route   POST /api/admin/books
router.post(
  '/books',
  upload.fields([
    { name: 'coverImage', maxCount: 1 },
    { name: 'pdfFile', maxCount: 1 }
  ]),
  createBook
);

// @route   PUT /api/admin/books/:id
router.put(
  '/books/:id',
  upload.fields([
    { name: 'coverImage', maxCount: 1 },
    { name: 'pdfFile', maxCount: 1 }
  ]),
  updateBook
);

// @route   DELETE /api/admin/books/:id
router.delete('/books/:id', deleteBook);

// @route   GET /api/admin/stats
router.get('/stats', getStats);

export default router;
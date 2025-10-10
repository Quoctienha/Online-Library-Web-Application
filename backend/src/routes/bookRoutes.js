import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import { getBooks, getCategories, getBookById, downloadBook } from '../controllers/bookController.js';

const router = express.Router();

// @route   GET /api/books
router.get('/', getBooks);

// @route   GET /api/books/categories/list
router.get('/categories/list', getCategories);

// @route   GET /api/books/:id
router.get('/:id', getBookById);

// @route   POST /api/books/:id/download
router.post('/:id/download', verifyToken, downloadBook);

export default router;
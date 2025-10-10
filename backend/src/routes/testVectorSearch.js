import express from 'express';
import {searchBooks, findSimilarBooks} from '../config/chatbot/bookSearchService.js';

const router = express.Router();

/**
 * POST /api/search/vector
 * Tìm kiếm sách bằng vector search - trả về 3 tài liệu điểm cao nhất
 */
router.post('/vector', async (req, res) => {
  try {
    const { query, limit = 3} = req.body;

    if (!query || query.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        message: 'Vui lòng nhập từ khóa tìm kiếm' 
      });
    }

    const results = await searchBooks(query,  Math.min(limit, 10)); // Giới hạn tối đa 10

    res.json({
      success: true,
      count: results.length,
      query: query,
      data: results
    });
  } catch (error) {
    console.error('Vector search error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tìm kiếm sách',
      error: error.message
    });
  }
});

/**
 * GET /api/search/similar/:bookId
 * Tìm 3 sách tương tự nhất
 */
router.get('/similar/:bookId', async (req, res) => {
  try {
    const { bookId } = req.params;
    const limit = parseInt(req.query.limit) || 3;

    const results = await findSimilarBooks(bookId, Math.min(limit, 10));

    res.json({
      success: true,
      count: results.length,
      data: results
    });
  } catch (error) {
    console.error('Similar books error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi tìm sách tương tự'
    });
  }
});


export default router;
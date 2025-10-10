import express from 'express';
import {chat, chatWithHistory,recommendBooks} from '../config/chatbot/ragChatbotService.js'
import Conversation from '../models/Conversation.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * POST /api/chatbot/ask
 * Hỏi chatbot (RAG) - không lưu lịch sử
 */
router.post('/ask', async (req, res) => {
  try {
    const { question, topK } = req.body;

    if (!question || question.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập câu hỏi'
      });
    }

    const result = await chat(question, {
      topK: topK || 3,
      stream: false
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Chatbot ask error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xử lý câu hỏi',
      error: error.message
    });
  }
});

/**
 * POST /api/chatbot/ask-stream
 * Hỏi chatbot với streaming response
 */
router.post('/ask-stream', async (req, res) => {
  try {
    const { question, topK } = req.body;

    if (!question || question.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập câu hỏi'
      });
    }

    const result = await chat(question, {
      topK: topK || 3,
      stream: true
    });

    // Set headers cho SSE (Server-Sent Events)
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Gửi thông tin sách liên quan trước
    res.write(`data: ${JSON.stringify({
      type: 'books',
      books: result.books
    })}\n\n`);

    // Stream response từ LLM
    for await (const chunk of result.stream) {
      if (chunk.message?.content) {
        res.write(`data: ${JSON.stringify({
          type: 'text',
          content: chunk.message.content
        })}\n\n`);
      }
    }

    // Kết thúc stream
    res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
    res.end();
  } catch (error) {
    console.error('Chatbot stream error:', error);
    res.write(`data: ${JSON.stringify({
      type: 'error',
      message: error.message
    })}\n\n`);
    res.end();
  }
});

/**
 * POST /api/chatbot/chat
 * Chat với lưu lịch sử (yêu cầu đăng nhập)
 */
router.post('/chat', verifyToken, async (req, res) => {
  try {
    const { question, conversationId } = req.body;

    if (!question || question.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập câu hỏi'
      });
    }

    let conversation;

    // Tìm hoặc tạo conversation mới
    if (conversationId) {
      conversation = await Conversation.findOne({
        _id: conversationId,
        userId: req.user._id
      });

      if (!conversation) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy cuộc hội thoại'
        });
      }
    } else {
      conversation = new Conversation({
        userId: req.user._id,
        title: question.substring(0, 50) + (question.length > 50 ? '...' : '')
      });
      await conversation.save();
    }

    // Lấy lịch sử chat
    const history = conversation.getHistory();

    // Gọi RAG với lịch sử
    const result = await chatWithHistory(question, history);

    // Lưu câu hỏi và câu trả lời vào conversation
    await conversation.addMessage('user', question);
    await conversation.addMessage('assistant', result.answer, result.books);

    res.json({
      success: true,
      data: {
        conversationId: conversation._id,
        answer: result.answer,
        books: result.books,
        messageCount: conversation.messages.length
      }
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi chat',
      error: error.message
    });
  }
});

/**
 * GET /api/chatbot/conversations
 * Lấy danh sách conversations của user
 */
router.get('/conversations', verifyToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const conversations = await Conversation.find({
      userId: req.user._id,
      isActive: true
    })
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('title messages createdAt updatedAt');

    const total = await Conversation.countDocuments({
      userId: req.user._id,
      isActive: true
    });

    res.json({
      success: true,
      data: {
        conversations: conversations.map(conv => ({
          _id: conv._id,
          title: conv.title,
          messageCount: conv.messages.length,
          lastMessage: conv.messages[conv.messages.length - 1]?.content.substring(0, 100),
          createdAt: conv.createdAt,
          updatedAt: conv.updatedAt
        })),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách hội thoại'
    });
  }
});

/**
 * GET /api/chatbot/conversations/:id
 * Lấy chi tiết một conversation
 */
router.get('/conversations/:id', verifyToken, async (req, res) => {
  try {
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      userId: req.user._id
    }).populate('messages.books.bookId', 'title author coverImage');

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy cuộc hội thoại'
      });
    }

    res.json({
      success: true,
      data: conversation
    });
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy chi tiết hội thoại'
    });
  }
});

/**
 * DELETE /api/chatbot/conversations/:id
 * Xóa conversation
 */
router.delete('/conversations/:id', verifyToken, async (req, res) => {
  try {
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy cuộc hội thoại'
      });
    }

    conversation.isActive = false;
    await conversation.save();

    res.json({
      success: true,
      message: 'Đã xóa cuộc hội thoại'
    });
  } catch (error) {
    console.error('Delete conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa hội thoại'
    });
  }
});

/**
 * POST /api/chatbot/recommend
 * Đề xuất sách dựa trên sở thích
 */
router.post('/recommend', async (req, res) => {
  try {
    const { preference, limit } = req.body;

    if (!preference || preference.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng mô tả sở thích của bạn'
      });
    }

    const result = await recommendBooks(preference, limit || 5);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Recommend error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi đề xuất sách'
    });
  }
});

/**
 * GET /api/chatbot/summarize/:bookId
 * Tóm tắt một cuốn sách
 */
// router.get('/summarize/:bookId', async (req, res) => {
//   try {
//     const result = await ragChatbotService.summarizeBook(req.params.bookId);

//     res.json({
//       success: true,
//       data: result
//     });
//   } catch (error) {
//     console.error('Summarize error:', error);
//     res.status(500).json({
//       success: false,
//       message: error.message || 'Lỗi khi tóm tắt sách'
//     });
//   }
// });

export default router;
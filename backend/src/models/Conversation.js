import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  books: [{
    bookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book'
    },
    title: String,
    author: String,
    score: Number
  }],
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const conversationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    default: 'Cuộc trò chuyện mới'
  },
  messages: [messageSchema],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index để tìm conversations của user nhanh hơn
conversationSchema.index({ userId: 1, createdAt: -1 });

// Method để thêm message
conversationSchema.methods.addMessage = function(role, content, books = []) {
  this.messages.push({
    role,
    content,
    books: books.map(book => ({
      bookId: book._id,
      title: book.title,
      author: book.author,
      score: book.score
    }))
  });
  
  // Update title nếu đây là message đầu tiên
  if (this.messages.length === 1) {
    this.title = content.substring(0, 50) + (content.length > 50 ? '...' : '');
  }
  
  return this.save();
};

// Method để lấy lịch sử chat cho RAG
conversationSchema.methods.getHistory = function(limit = 10) {
  return this.messages
    .slice(-limit)
    .map(msg => ({
      role: msg.role,
      content: msg.content
    }));
};

const Conversation = mongoose.model('Conversation', conversationSchema);
export default Conversation;
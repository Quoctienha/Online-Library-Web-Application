import mongoose from 'mongoose';

const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  author: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  coverImage: {
    type: String,
    required: true
  },
  pdfFile: {
    type: String,
    required: true
  },
  publishYear: {
    type: Number
  },
  pageCount: {
    type: Number
  },
  bookLanguage: {
    type: String,
    default: 'Vietnamese'
  },
  downloadCount: {
    type: Number,
    default: 0
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for search
//bookSchema.index({ title: 'text', author: 'text', description: 'text' });
bookSchema.index(
  { title: 'text', author: 'text', description: 'text' },
  { 
    default_language: 'none',  // Dùng 'none' để support tiếng Việt tốt hơn
    weights: {  // Tùy chọn: set trọng số cho từng field
      title: 10,
      author: 5,
      description: 1
    }
  }
);


const Book = mongoose.model('Book', bookSchema);
export default Book;
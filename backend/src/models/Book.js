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
  },
  //vector embedding
  embedding: { type: [Number], default: [] }

}, {
  timestamps: true
});

// Index for search
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

// Static method cho vector search - trả về 3 tài liệu điểm cao nhất
bookSchema.statics.vectorSearch = async function(queryVector, limit = 3) {
  const pipeline = [
    {
      $vectorSearch: {
        index: "vector_index",
        path: "embedding",
        queryVector: queryVector,
        numCandidates: limit * 50, // Tăng để có kết quả tốt hơn
        limit: limit
      }
    },
    {
      $project: {
        _id: 1,
        title: 1,
        author: 1,
        description: 1,
        category: 1,
        coverImage: 1,
        pdfFile: 1,
        publishYear: 1,
        pageCount: 1,
        bookLanguage: 1,
        downloadCount: 1,
        createdAt: 1,
        score: { $meta: "vectorSearchScore" }
      }
    }
  ];

  return await this.aggregate(pipeline);
};



const Book = mongoose.model('Book', bookSchema);
export default Book;
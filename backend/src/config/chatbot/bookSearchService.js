import Book from '../../models/Book.js';
import { generateEmbedding } from './embedding.js';

/**
 * Tìm kiếm sách bằng vector search - trả về 3 tài liệu điểm cao nhất
 */
export async function searchBooks(query, limit = 3) {
  try {
    // Tạo embedding từ query
    const queryVector = await generateEmbedding(query);

    // Thực hiện vector search
    const results = await Book.vectorSearch(queryVector, limit);

    return results;
  } catch (error) {
    console.error('Error in searchBooks:', error);
    throw error;
  }
}

/**
 * Tìm sách tương tự dựa trên bookId - trả về 3 sách tương tự nhất
 */
export async function findSimilarBooks(bookId, limit = 3) {
  try {
    const book = await Book.findById(bookId);
    if (!book) throw new Error('Không tìm thấy sách');

    if (!book.embedding || book.embedding.length === 0)
      throw new Error('Sách chưa có embedding vector');

    // Sử dụng embedding của book hiện tại để tìm sách tương tự
    const results = await Book.vectorSearch(book.embedding, limit + 1);

    // Loại bỏ chính sách đó ra khỏi kết quả
    return results
      .filter(result => result._id.toString() !== bookId.toString())
      .slice(0, limit);
  } catch (error) {
    console.error('Error in findSimilarBooks:', error);
    throw error;
  }
}

/**
 * Tạo embedding cho tất cả sách chưa có embedding
 */
export async function generateMissingEmbeddings() {
  try {
    const books = await Book.find({
      $or: [
        { embedding: { $exists: false } },
        { embedding: { $size: 0 } }
      ]
    });

    console.log(`Đang tạo embedding cho ${books.length} sách...`);

    let successCount = 0;
    let errorCount = 0;

    for (const book of books) {
      try {
        const context = `Title: ${book.title}\nAuthor: ${book.author}\nCategory: ${book.category}\nDescription: ${book.description}`;
        const embedding = await generateEmbedding(context);

        book.embedding = embedding;
        await book.save();

        successCount++;
        console.log(`✓ [${successCount}/${books.length}] ${book.title}`);
      } catch (error) {
        errorCount++;
        console.error(`✗ Lỗi khi tạo embedding cho "${book.title}":`, error.message);
      }
    }

    console.log(`\nHoàn thành! Thành công: ${successCount}, Lỗi: ${errorCount}`);
    return { success: successCount, errors: errorCount, total: books.length };
  } catch (error) {
    console.error('Error in generateMissingEmbeddings:', error);
    throw error;
  }
}

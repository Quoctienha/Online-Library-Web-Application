import ollama from 'ollama';
import Book from '../../models/Book.js';
import { generateEmbedding } from './embedding.js';
import { searchBooks } from './bookSearchService.js';

const CHAT_MODEL = process.env.OLLAMA_CHAT_MODEL || 'llama2';
const DEFAULT_TOP_K = 3;


/**
 * Tạo context từ các sách tìm được
 */
function buildContext(books) {
  if (!books || books.length === 0) {
    return 'Không tìm thấy tài liệu liên quan trong cơ sở dữ liệu.';
  }

  let context = 'Dưới đây là các tài liệu liên quan:\n\n';

  books.forEach((book, index) => {
    context += `[Tài liệu ${index + 1}]\n`;
    context += `Tiêu đề: ${book.title}\n`;
    context += `Tác giả: ${book.author}\n`;
    context += `Thể loại: ${book.category}\n`;
    context += `Mô tả: ${book.description}\n`;
    if (book.publishYear) context += `Năm xuất bản: ${book.publishYear}\n`;
    if (book.score) context += `Độ liên quan: ${(book.score * 100).toFixed(1)}%\n`;
    context += '\n';
  });

  return context;
}

/**
 * Tạo prompt cho RAG
 */
function createRAGPrompt(question, context) {
  return `Bạn là trợ lý AI thông minh của thư viện sách. Nhiệm vụ của bạn là trả lời câu hỏi của người dùng dựa trên các tài liệu được cung cấp.

NGUYÊN TẮC QUAN TRỌNG:
1. CHỈ sử dụng thông tin từ các tài liệu được cung cấp bên dưới
2. Nếu thông tin không có trong tài liệu, hãy nói rõ "Tôi không tìm thấy thông tin này trong cơ sở dữ liệu"
3. Trả lời bằng tiếng Việt, ngắn gọn, rõ ràng và thân thiện
4. Nếu có nhiều sách liên quan, hãy giới thiệu tất cả
5. Luôn đề cập đến tiêu đề sách và tác giả khi đưa ra đề xuất

${context}

Câu hỏi của người dùng: ${question}

Trả lời:`;
}

/**
 *  Chat với RAG - Hàm chính
 */
export async function chat(question, options = {}) {
  try {
    const {
      topK = DEFAULT_TOP_K,
      stream = false
    } = options;

    console.log('🔍 Đang tìm kiếm tài liệu liên quan...');

    //vector search
    const relevantBooks = await searchBooks(question, topK);

    console.log(`✓ Tìm thấy ${relevantBooks.length} tài liệu liên quan`);

    const context = buildContext(relevantBooks);
    const prompt = createRAGPrompt(question, context);

    console.log('Đang tạo câu trả lời...');

    if (stream) {
      return {
        books: relevantBooks,
        stream: await generateStreamResponse(prompt)
      };
    } else {
      const response = await ollama.chat({
        model: CHAT_MODEL,
        messages: [{ role: 'user', content: prompt }],
        stream: false
      });

      return {
        answer: response.message.content,
        books: relevantBooks,
        question: question
      };
    }
  } catch (error) {
    console.error('Error in RAG chat:', error);
    throw error;
  }
}

/**
 * Stream response cho real-time chat
 */
async function generateStreamResponse(prompt) {
  return ollama.chat({
    model: CHAT_MODEL,
    messages: [{ role: 'user', content: prompt }],
    stream: true
  });
}

/**
 * Chat với lịch sử hội thoại (multi-turn conversation)
 */
export async function chatWithHistory(question, conversationHistory = [], topK = DEFAULT_TOP_K) {
  try {

    //vector search
    const relevantBooks = await searchBooks(question, topK);
    const context = buildContext(relevantBooks);

    const messages = [
      {
        role: 'system',
        content: `Bạn là trợ lý AI thông minh của thư viện sách. CHỈ sử dụng thông tin từ các tài liệu được cung cấp.\n\n${context}`
      },
      ...conversationHistory,
      { role: 'user', content: question }
    ];

    const response = await ollama.chat({
      model: CHAT_MODEL,
      messages: messages,
      stream: false
    });

    return {
      answer: response.message.content,
      books: relevantBooks,
      question: question
    };
  } catch (error) {
    console.error('Error in chat with history:', error);
    throw error;
  }
}

/**
 * Đề xuất sách dựa trên sở thích
 */
export async function recommendBooks(userPreference, limit = 5) {
  try {
    //const embedding = await generateEmbedding(userPreference);
    //const books = await Book.vectorSearch(embedding, limit);

    //vector search
    const books = await searchBooks(userPreference, limit);

    return {
      recommendations: books,
      preference: userPreference
    };
  } catch (error) {
    console.error('Error recommending books:', error);
    throw error;
  }
}

/**
 *  Tóm tắt nội dung một cuốn sách
 */
// export async function summarizeBook(bookId) {
//   try {
//     const book = await Book.findById(bookId);
//     if (!book) throw new Error('Không tìm thấy sách');

//     const prompt = `Hãy tóm tắt ngắn gọn về cuốn sách sau:

// Tiêu đề: ${book.title}
// Tác giả: ${book.author}
// Thể loại: ${book.category}
// Mô tả: ${book.description}

// Tóm tắt (3-5 câu):`;

//     const response = await ollama.chat({
//       model: CHAT_MODEL,
//       messages: [{ role: 'user', content: prompt }],
//       stream: false
//     });

//     return {
//       book: {
//         _id: book._id,
//         title: book.title,
//         author: book.author,
//         category: book.category,
//         coverImage: book.coverImage
//       },
//       summary: response.message.content
//     };
//   } catch (error) {
//     console.error('Error summarizing book:', error);
//     throw error;
//   }
// }

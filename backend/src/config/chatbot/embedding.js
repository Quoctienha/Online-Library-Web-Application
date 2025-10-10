//import dotenv from 'dotenv';
import ollama from 'ollama';
//import path from 'path';

//dotenv.config({ path: path.resolve('../../../.env') }); // từ chatbot/ tới backend/.env

export async function generateEmbedding(text) {
  try {
    const response = await ollama.embed({
      model: process.env.OLLAMA_EMBEDDING_MODEL, // dùng biến môi trường
      input: text,
    });

    //console.log('Embedding vector length:', response.embeddings[0].length);
    return response.embeddings[0];
  } catch (err) {
    console.error('Lỗi khi generate embedding:', err);
    throw err;
  }
}

// Test
// (async () => {
//   const vec = await generateEmbedding("Xin chào Ollama!");
//   console.log(vec);
// })();

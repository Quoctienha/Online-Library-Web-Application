import ollama from 'ollama';

const MODEL_NAME = process.env.OLLAMA_CHAT_MODEL || "llama2";

export async function chatWithLLaMA(message) {
  try {
    const promptText = `System: You are a helpful assistant.\nUser: ${message}`;

    const response = await ollama.generate({
      model: MODEL_NAME,
      prompt: promptText,
      max_tokens: 200,
    });

    //console.log('Raw response:', response);
    return response.response;
  } catch (err) {
    console.error('Lỗi khi gọi LLM:', err);
    throw err;
  }
}

// Test
(async () => {
  const reply = await chatWithLLaMA("tên tui là gì");
  console.log('Assistant reply:', reply);
  
})();

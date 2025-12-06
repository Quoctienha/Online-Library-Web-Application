import React, { useEffect, useRef, useState } from "react";
import axiosInstance from "../services/axiosInstance";
import { useAuth } from "../context/AuthContext";

export default function ChatBox() {
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState([
    { role: "bot", text: "Xin chào! Hãy nhập tên sách, tác giả, thể loại hoặc mô tả để mình tìm/đề xuất nhé." }
  ]);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, open]);

  const send = async () => {
    const text = input.trim();
    if (!text) return;

    setMsgs(prev => [...prev, { role: "user", text }]);
    setInput("");

    try {
      // Sửa: gửi 'question' thay vì 'text'
      const { data } = await axiosInstance.post("/api/chatbot/ask", { 
        question: text,
        topK: 3 // lấy 6 sách để hiển thị
      });
      
      // Sửa: lấy từ data.data vì backend trả về { success, data }
      setMsgs(prev => [
        ...prev,
        { 
          role: "bot", 
          text: data.data.answer, 
          books: data.data.books 
        }
      ]);
    } catch (error) {
      console.error('Chat error:', error);
      setMsgs(prev => [
        ...prev,
        { role: "bot", text: "Xin lỗi, có lỗi xảy ra khi tìm sách." }
      ]);
    }
  };

  return (
    <>
      {/* FAB */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-5 right-5 z-50 rounded-full shadow-lg bg-indigo-600 text-white w-12 h-12 flex items-center justify-center"
        title="Trợ lý tìm sách"
      >💬</button>

      {/* Panel */}
      {open && (
        <div className="fixed bottom-20 right-5 z-50 w-96 max-w-[95vw] bg-white rounded-2xl shadow-2xl border p-3">
          <div className="font-semibold mb-2">Trợ lý thư viện</div>

          <div className="h-72 overflow-y-auto space-y-3 pr-1">
            {msgs.map((m, i) => (
              <div key={i} className={m.role === "user" ? "text-right" : "text-left"}>
                <div className={`inline-block px-3 py-2 rounded-xl ${m.role === "user" ? "bg-indigo-600 text-white" : "bg-gray-100"}`}>
                  {m.text}
                </div>

                {m.books?.length > 0 && (
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {m.books.slice(0, 6).map(b => (
                      <a
                        key={b._id || b.id}
                        href={`/books/${b._id || b.id}`}
                        className="border rounded-lg overflow-hidden hover:shadow"
                      >
                        {b.coverImage && (
                          <img
                            src={`http://localhost:3000/uploads/covers/${b.coverImage}`}
                            alt={b.title}
                            className="h-28 w-full object-cover"
                          />
                        )}
                        <div className="p-2">
                          <div className="text-sm font-medium line-clamp-2">{b.title}</div>
                          <div className="text-xs text-gray-500">{b.author}</div>
                          <div className="text-[11px] text-gray-400">{b.category}</div>
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div ref={endRef} />
          </div>

          <div className="mt-3 flex gap-2">
            <input
              disabled={!isAuthenticated}
              placeholder={
                isAuthenticated
                  ? "Tìm tên sách / gợi ý theo thể loại…"
                  : "Đăng nhập để sử dụng chat"
              }
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && send()}
              className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
            <button 
              onClick={send} 
              disabled={!isAuthenticated || !input.trim()}
              className="bg-indigo-600 text-white rounded-lg px-3 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Gửi
            </button>
          </div>
        </div>
      )}
    </>
  );
}
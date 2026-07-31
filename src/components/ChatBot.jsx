import { useState, useRef, useEffect } from "react";

const NURSERY_CONTEXT =
  "You are Fulbari AI, an assistant for Unique Fulbari Nursery in Nepal. " +
  "We sell ornamental & flowering plants (roses, marigolds, dahlias, seasonal flowers), " +
  "organic manure/compost, pots, soil mixes, and gardening tools. " +
  "We offer plant sales, manure supply, gardening consultation, plant care tips, and delivery across Nepal. " +
  "Contact: prabaladhakal@gmail.com | +977-9846263230. " +
  "Only answer questions about plants, flowers, gardening, manure, soil, or nursery services in Nepal. " +
  "If the question is unrelated, reply: " +
  "'For further inquiries, please contact us at prabaladhakal@gmail.com or call +977-9846263230 📱'.";

const SUGGESTIONS = [
  "🌹 Best flowers for Nepal?",
  "🌱 How to care for roses?",
  "💧 Watering tips for plants?",
  "🪴 Which manure is best?",
];

// Call Groq API (OpenAI-compatible) with retry
async function callGroq(userText) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_DASHBOARD_API_KEY}`,
          },
          body: JSON.stringify({
            model: "openai/gpt-oss-20b",
            messages: [
              { role: "system", content: NURSERY_CONTEXT },
              { role: "user", content: userText },
            ],
            temperature: 0.7,
            max_tokens: 512,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log("Groq response:", data);
        return data?.choices?.[0]?.message?.content || "Sorry, I didn't understand that.";
      } else {
        const err = await response.json();
        console.warn(`Groq attempt ${attempt + 1} failed:`, err);
        // Retry on rate limit or server overload
        if (response.status === 429 || response.status === 503) {
          await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
          continue;
        } else {
          throw new Error(err.error?.message || `HTTP ${response.status}`);
        }
      }
    } catch (e) {
      console.error(`Groq error attempt ${attempt + 1}:`, e);
      if (attempt === 2) throw e;
    }
  }
  throw new Error("Groq API failed after retries");
}

function formatTime(date) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function ChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "Namaste 🌿! I'm Fulbari AI, your plant & gardening assistant for Unique Fulbari Nursery. How can I help you today?",
      time: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open, loading]);

  const handleSend = async (text) => {
    const userText = (text || input).trim();
    if (!userText || loading) return;

    const userMsg = { sender: "user", text: userText, time: new Date() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const reply = await callGroq(userText);
      setMessages([...newMessages, { sender: "bot", text: reply, time: new Date() }]);
    } catch (error) {
      console.error("Groq error:", error);
      setMessages([
        ...newMessages,
        {
          sender: "bot",
          text: "Error connecting. Please try again or contact us at prabaladhakal@gmail.com 📧",
          time: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating toggle button */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close chat" : "Open chat"}
        style={{
          position: "fixed",
          bottom: "1.5rem",
          right: "1.5rem",
          zIndex: 1000,
          backgroundColor: "#2E7D32",
          color: "white",
          border: "none",
          borderRadius: "50px",
          padding: "0.7rem 1.3rem",
          fontSize: "0.9rem",
          fontWeight: "700",
          boxShadow: "0 4px 16px rgba(46,125,50,0.45)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "0.4rem",
        }}
        onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#1B5E20")}
        onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#2E7D32")}
      >
        {open ? "✕ Close" : "🌿 Ask Fulbari AI"}
      </button>

      {/* Chat window */}
      {open && (
        <div
          style={{
            position: "fixed",
            bottom: "5rem",
            right: "1.5rem",
            zIndex: 999,
            width: "310px",
            maxWidth: "calc(100vw - 2rem)",
            backgroundColor: "#fff",
            border: "1.5px solid #2E7D32",
            borderRadius: "14px",
            boxShadow: "0 8px 28px rgba(0,0,0,0.18)",
            display: "flex",
            flexDirection: "column",
            fontFamily: "'Segoe UI', sans-serif",
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div
            style={{
              backgroundColor: "#1B5E20",
              color: "white",
              padding: "0.6rem 0.9rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <span style={{ fontSize: "1.2rem" }}>🌿</span>
            <div>
              <div style={{ fontWeight: "700", fontSize: "0.9rem" }}>Fulbari AI</div>
              <div style={{ fontSize: "0.68rem", opacity: 0.8 }}>
                Unique Fulbari Nursery · Nepal
              </div>
            </div>
          </div>

          {/* Messages */}
          <div
            style={{
              padding: "0.6rem 0.7rem",
              overflowY: "auto",
              maxHeight: "200px",
              backgroundColor: "#a8cda8",
            }}
          >
            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: msg.sender === "user" ? "flex-end" : "flex-start",
                  marginBottom: "0.5rem",
                }}
              >
                <div
                  style={{
                    maxWidth: "85%",
                    padding: "0.45rem 0.7rem",
                    borderRadius:
                      msg.sender === "user"
                        ? "14px 14px 4px 14px"
                        : "14px 14px 14px 4px",
                    backgroundColor:
                      msg.sender === "user" ? "#2E7D32" : "#E8F5E9",
                    color: msg.sender === "user" ? "#fff" : "#1a1a1a",
                    fontSize: "0.83rem",
                    lineHeight: "1.5",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {msg.text}
                </div>
                <div
                  style={{
                    fontSize: "0.62rem",
                    color: "#aaa",
                    marginTop: "2px",
                  }}
                >
                  {formatTime(msg.time)}
                </div>
              </div>
            ))}

            {/* Typing indicator — green dots, clearly visible */}
            {loading && (
              <div style={{ display: "flex", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                <div
                  style={{
                    padding: "0.45rem 0.8rem",
                    borderRadius: "14px 14px 14px 4px",
                    backgroundColor: "#0e0f0e",
                    display: "flex",
                    gap: "5px",
                    alignItems: "center",
                  }}
                >
                  <span style={{ width: "7px", height: "7px", borderRadius: "50%", backgroundColor: "#2E7D32", display: "inline-block", animation: "blink 1.2s infinite 0s" }} />
                  <span style={{ width: "7px", height: "7px", borderRadius: "50%", backgroundColor: "#2E7D32", display: "inline-block", animation: "blink 1.2s infinite 0.3s" }} />
                  <span style={{ width: "7px", height: "7px", borderRadius: "50%", backgroundColor: "#2E7D32", display: "inline-block", animation: "blink 1.2s infinite 0.6s" }} />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick suggestion chips — shown only before first user message */}
          {messages.length <= 1 && !loading && (
            <div
              style={{
                padding: "0.3rem 0.6rem",
                display: "flex",
                flexWrap: "wrap",
                gap: "0.28rem",
                borderTop: "1px solid #e0ece0",
                backgroundColor: "#f4faf4",
              }}
            >
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(s)}
                  style={{
                    backgroundColor: "#fff",
                    border: "1px solid #4CAF50",
                    color: "#2E7D32",
                    borderRadius: "20px",
                    padding: "0.18rem 0.5rem",
                    fontSize: "0.7rem",
                    cursor: "pointer",
                    fontWeight: "500",
                    whiteSpace: "nowrap",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input bar */}
          <div
            style={{
              display: "flex",
              padding: "0.45rem",
              borderTop: "1px solid #d4e8d4",
              gap: "0.4rem",
              backgroundColor: "#c11b1b",
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              disabled={loading}
              placeholder="Ask about plants, care tips…"
              style={{
                flex: 1,
                padding: "0.45rem 0.7rem",
                borderRadius: "20px",
                border: "1px solid #0e0f0e",
                fontSize: "0.82rem",
                outline: "none",
                backgroundColor: loading ? "#1b1a1a" : "#0e0101",
              }}
            />
            <button
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              style={{
                backgroundColor: loading || !input.trim() ? "#a5d6a7" : "#2E7D32",
                color: "white",
                border: "none",
                borderRadius: "50%",
                width: "34px",
                height: "34px",
                fontSize: "0.95rem",
                cursor: loading || !input.trim() ? "default" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              ➤
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes blink {
          0%, 80%, 100% { opacity: 0.15; }
          40% { opacity: 1; }
        }
      `}</style>
    </>
  );
}

export default ChatBot;

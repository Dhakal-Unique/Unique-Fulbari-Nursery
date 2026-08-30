import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebase";
import { collection, onSnapshot } from "firebase/firestore";

// ── Module nav cards ────────────────────────────────────────────────────────
const MODULES = [
  { title: "Contact Messages", desc: "View and prioritize customer inquiries", path: "/messages",   icon: "📬", color: "#2E7D32" },
  { title: "Statistics",        desc: "Sales, customers, and inventory KPIs",   path: "/statistics", icon: "📈", color: "#1565C0" },
  { title: "Business Insights", desc: "AI-powered trends and recommendations",  path: "/insights",   icon: "📊", color: "#E65100" },
  { title: "Urgency Detection", desc: "AI tagging for high-priority issues",    path: "/urgency",    icon: "🚨", color: "#B71C1C" },
];

// ── Build a rich summary of Firestore messages for the AI ──────────────────
function buildSummary(messages) {
  const total   = messages.length;
  const high    = messages.filter((m) => m.urgency === "High").length;
  const medium  = messages.filter((m) => m.urgency === "Medium").length;
  const low     = messages.filter((m) => m.urgency === "Low").length;
  const done    = messages.filter((m) => m.done).length;
  const pending = total - done;

  // Sentiment
  const pos = messages.filter((m) => m.analysis?.sentiment === "Positive").length;
  const neg = messages.filter((m) => m.analysis?.sentiment === "Negative").length;

  // Top keywords
  const kwMap = {};
  messages.forEach((m) => (m.analysis?.keywords || []).forEach((k) => { kwMap[k] = (kwMap[k] || 0) + 1; }));
  const topKw = Object.entries(kwMap).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k]) => k).join(", ");

  // Top requests
  const reqMap = {};
  messages.forEach((m) => { if (m.analysis?.request) reqMap[m.analysis.request] = (reqMap[m.analysis.request] || 0) + 1; });
  const topReq = Object.entries(reqMap).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k, v]) => `${k} (×${v})`).join(", ");

  // Subjects
  const subjects = messages.slice(0, 15).map((m) => m.subject || m.message?.slice(0, 60)).filter(Boolean).join(" | ");

  // Complaints / delivery issues
  const complaints = messages.filter((m) => /complain|damage|late|delay|wrong|bad|not receiv/i.test(m.message || "")).length;
  const deliveryIssues = messages.filter((m) => /delivery|deliver|ship|courier|arrived/i.test(m.message || "")).length;
  const indoorQueries  = messages.filter((m) => /indoor|inside|room|apartment|office/i.test(m.message || "")).length;
  const bulkQueries    = messages.filter((m) => /bulk|wholesale|large order|quantity/i.test(m.message || "")).length;
  const faqCandidates  = messages.filter((m) => /how|what|when|where|price|cost|available|do you/i.test(m.message || "")).length;

  // Recent week: last 7 days
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recent  = messages.filter((m) => new Date(m.date) > weekAgo);
  const recentHigh = recent.filter((m) => m.urgency === "High").length;
  const recentComplaints = recent.filter((m) => /complain|damage|late|delay|wrong|bad/i.test(m.message || "")).length;

  return {
    summary: [
      `Total messages: ${total}. Pending: ${pending}. Resolved: ${done}.`,
      `Urgency — High: ${high}, Medium: ${medium}, Low: ${low}.`,
      `Sentiment — Positive: ${pos}, Negative: ${neg}.`,
      topKw   ? `Top keywords: ${topKw}.` : "",
      topReq  ? `Top customer requests: ${topReq}.` : "",
      subjects ? `Recent message subjects: ${subjects}.` : "",
      complaints     ? `Complaints/damaged goods mentions: ${complaints}.` : "",
      deliveryIssues ? `Delivery-related messages: ${deliveryIssues}.` : "",
      indoorQueries  ? `Indoor plant queries: ${indoorQueries}.` : "",
      bulkQueries    ? `Bulk/wholesale queries: ${bulkQueries}.` : "",
      faqCandidates  ? `Repeated question-style messages: ${faqCandidates}.` : "",
      recent.length  ? `Last 7 days: ${recent.length} messages, ${recentHigh} high-urgency, ${recentComplaints} complaints.` : "",
    ].filter(Boolean).join("\n"),
    stats: { total, high, medium, low, done, pending, pos, neg },
  };
}

// ── Stat card ──────────────────────────────────────────────────────────────
function KpiCard({ icon, label, value, accent }) {
  return (
    <div style={{ backgroundColor: "#fff", borderRadius: "10px", padding: "1rem 1.25rem", border: "1px solid #e8e8e8", flex: "1 1 120px", minWidth: "120px" }}>
      <div style={{ fontSize: "1.3rem", marginBottom: "4px" }}>{icon}</div>
      <div style={{ fontSize: "1.8rem", fontWeight: "800", color: accent, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: "0.72rem", color: "#aaa", marginTop: "4px", textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
function Dashboard() {
  const navigate  = useNavigate();
  const [messages, setMessages]   = useState([]);
  const [aiAdvice, setAiAdvice]   = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError]     = useState(null);
  const [lastRun, setLastRun]     = useState(null);
  const chatRef = useRef(null);

  // Live Firestore listener
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "contactMessages"), (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => new Date(b.date) - new Date(a.date));
      setMessages(data);
    });
    return () => unsub();
  }, []);

  // ── Groq: generate AI business advice ─────────────────────────────────
  const generateAdvice = async () => {
    if (messages.length === 0) return;
    setAiLoading(true);
    setAiError(null);

    const { summary } = buildSummary(messages);

    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_DASHBOARD_API_KEY}`,
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-20b",
          messages: [
            {
              role: "system",
              content:
                "You are a smart business advisor for Unique Fulbari Nursery, a plant nursery in Nepal. " +
                "Based on real customer message data, generate specific, actionable business suggestions. " +
                "Be concise and practical. Focus on what the nursery owner can actually do to improve sales, " +
                "customer satisfaction, and operations.",
            },
            {
              role: "user",
              content:
                `Here is a summary of our current customer message data:\n\n${summary}\n\n` +
                `Based on this, give me exactly 6 distinct, numbered, actionable business suggestions. ` +
                `Each suggestion must:\n` +
                `- Have a short bold title (5 words max)\n` +
                `- Have 1–2 sentences of explanation\n` +
                `- Be specific to the data (mention actual topics like indoor plants, delivery, FAQ etc. if relevant)\n` +
                `Format each as: "N. [TITLE]: [explanation]"\n` +
                `Do not use markdown bullets or headers, just numbered lines.`,
            },
          ],
          temperature: 0.6,
          max_tokens: 700,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const text = data.choices?.[0]?.message?.content?.trim() || "";

      // Parse numbered lines into { title, body }
      const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
      const parsed = [];
      for (const line of lines) {
        const m = line.match(/^\d+\.\s+\[?([^\]:]+)\]?:\s*(.+)/);
        if (m) {
          parsed.push({ title: m[1].trim(), body: m[2].trim() });
        } else if (line.match(/^\d+\.\s+/)) {
          const rest = line.replace(/^\d+\.\s+/, "");
          const colon = rest.indexOf(":");
          if (colon > 0) {
            parsed.push({ title: rest.slice(0, colon).replace(/\*\*/g, "").trim(), body: rest.slice(colon + 1).trim() });
          } else {
            parsed.push({ title: "Suggestion", body: rest });
          }
        }
      }

      setAiAdvice(parsed.length > 0 ? parsed : [{ title: "AI Response", body: text }]);
      setLastRun(new Date());
    } catch (e) {
      console.error("AI advice error:", e);
      setAiError("Could not generate advice. Check your Groq API key.");
    } finally {
      setAiLoading(false);
    }
  };

  const { stats } = messages.length > 0 ? buildSummary(messages) : { stats: { total: 0, high: 0, medium: 0, low: 0, done: 0, pending: 0 } };

  const ADVICE_ICONS = ["💡", "📋", "🚚", "🌿", "📣", "🛒"];
  const ADVICE_COLORS = ["#1565C0", "#2E7D32", "#E65100", "#6A1B9A", "#B71C1C", "#00695C"];

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#F4F6F4", fontFamily: "'Segoe UI', sans-serif" }}>

      {/* ── Top bar ── */}
      <div style={{ backgroundColor: "#1B5E20", color: "white", padding: "1rem 1.75rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
        <div>
          <div style={{ fontWeight: "800", fontSize: "1.15rem", letterSpacing: "-0.01em" }}>🌱 Unique Fulbari Nursery</div>
          <div style={{ fontSize: "0.72rem", opacity: 0.8, marginTop: "2px" }}>Business Dashboard · Admin Panel</div>
        </div>
        <div style={{ display: "flex", gap: "0.6rem", alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ backgroundColor: "rgba(255,255,255,0.15)", borderRadius: "20px", padding: "0.25rem 0.75rem", fontSize: "0.75rem" }}>
            {messages.length} messages
          </span>
          <a href="/" style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", color: "white", borderRadius: "6px", padding: "0.35rem 0.85rem", fontSize: "0.82rem", textDecoration: "none" }}>
            ← Back to Site
          </a>
        </div>
      </div>

      <div style={{ padding: "1.5rem 1.75rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>

        {/* ── KPI strip ── */}
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <KpiCard icon="📨" label="Total Messages"  value={stats.total}   accent="#1B5E20" />
          <KpiCard icon="🔴" label="High Urgency"    value={stats.high}    accent="#B71C1C" />
          <KpiCard icon="🟠" label="Medium Urgency"  value={stats.medium}  accent="#E65100" />
          <KpiCard icon="🟢" label="Low Urgency"     value={stats.low}     accent="#2E7D32" />
          <KpiCard icon="✅" label="Resolved"        value={stats.done}    accent="#1565C0" />
          <KpiCard icon="⏳" label="Pending"         value={stats.pending} accent="#888"    />
        </div>

        {/* ── Module nav cards ── */}
        <div>
          <div style={{ fontSize: "0.72rem", color: "#888", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: "600", marginBottom: "0.75rem" }}>Quick Access</div>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            {MODULES.map((mod) => (
              <div
                key={mod.path}
                onClick={() => navigate(mod.path)}
                style={{ flex: "1 1 180px", backgroundColor: mod.color, color: "white", borderRadius: "12px", padding: "1.1rem 1.25rem", cursor: "pointer", minWidth: "180px" }}
                onMouseOver={(e) => (e.currentTarget.style.opacity = "0.88")}
                onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
              >
                <div style={{ fontSize: "1.6rem", marginBottom: "6px" }}>{mod.icon}</div>
                <div style={{ fontWeight: "700", fontSize: "0.95rem", marginBottom: "4px" }}>{mod.title}</div>
                <div style={{ fontSize: "0.75rem", opacity: 0.85, lineHeight: 1.4 }}>{mod.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── AI Business Advisor ── */}
        <div style={{ backgroundColor: "#fff", borderRadius: "12px", border: "1px solid #e8e8e8", overflow: "hidden" }}>

          {/* Advisor header */}
          <div style={{ backgroundColor: "#1B5E20", padding: "1rem 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
            <div>
              <div style={{ color: "white", fontWeight: "700", fontSize: "1rem" }}>🤖 AI Business Advisor</div>
              <div style={{ color: "rgba(255,255,255,0.75)", fontSize: "0.72rem", marginTop: "2px" }}>
                Analyses your real customer messages and generates actionable business suggestions
              </div>
            </div>
            <div style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
              {lastRun && (
                <span style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.7rem" }}>
                  Last run: {lastRun.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              )}
              <button
                onClick={generateAdvice}
                disabled={aiLoading || messages.length === 0}
                style={{
                  backgroundColor: aiLoading ? "rgba(255,255,255,0.2)" : "#FBC02D",
                  color: aiLoading ? "rgba(255,255,255,0.6)" : "#1B5E20",
                  border: "none", borderRadius: "7px",
                  padding: "0.5rem 1.1rem",
                  fontSize: "0.85rem", fontWeight: "700",
                  cursor: aiLoading || messages.length === 0 ? "default" : "pointer",
                }}
              >
                {aiLoading ? "⚙️ Generating…" : aiAdvice.length > 0 ? "↻ Refresh Advice" : "✨ Generate Advice"}
              </button>
            </div>
          </div>

          {/* Advice body */}
          <div style={{ padding: "1.25rem 1.5rem" }}>
            {messages.length === 0 && (
              <div style={{ textAlign: "center", color: "#bbb", padding: "2rem", fontSize: "0.88rem" }}>
                No customer messages yet. Once your contact form receives messages, the AI advisor will analyse them.
              </div>
            )}

            {messages.length > 0 && aiAdvice.length === 0 && !aiLoading && !aiError && (
              <div style={{ textAlign: "center", color: "#aaa", padding: "2rem" }}>
                <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🌿</div>
                <div style={{ fontSize: "0.88rem", marginBottom: "0.35rem" }}>
                  You have <strong style={{ color: "#1B5E20" }}>{messages.length} customer messages</strong> ready to analyse.
                </div>
                <div style={{ fontSize: "0.78rem" }}>Click <strong>"✨ Generate Advice"</strong> to get AI-powered business suggestions.</div>
              </div>
            )}

            {aiLoading && (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} style={{ backgroundColor: "#f5f5f5", borderRadius: "8px", height: "62px", animation: "pulse 1.4s infinite" }} />
                ))}
              </div>
            )}

            {aiError && (
              <div style={{ backgroundColor: "#FFEBEE", borderRadius: "8px", padding: "0.85rem 1rem", color: "#B71C1C", fontSize: "0.85rem", border: "1px solid #FFCDD2" }}>
                ⚠️ {aiError}
              </div>
            )}

            {!aiLoading && aiAdvice.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                {aiAdvice.map((item, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex", gap: "1rem", alignItems: "flex-start",
                      backgroundColor: "#FAFAFA", borderRadius: "10px",
                      padding: "0.9rem 1rem",
                      border: `1px solid ${ADVICE_COLORS[i % ADVICE_COLORS.length]}22`,
                      borderLeft: `4px solid ${ADVICE_COLORS[i % ADVICE_COLORS.length]}`,
                    }}
                  >
                    <div style={{ fontSize: "1.4rem", flexShrink: 0, marginTop: "1px" }}>
                      {ADVICE_ICONS[i % ADVICE_ICONS.length]}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: "700", fontSize: "0.9rem", color: ADVICE_COLORS[i % ADVICE_COLORS.length], marginBottom: "4px" }}>
                        {item.title}
                      </div>
                      <div style={{ fontSize: "0.85rem", color: "#444", lineHeight: "1.6" }}>
                        {item.body}
                      </div>
                    </div>
                    <div style={{ fontSize: "0.7rem", color: "#ccc", flexShrink: 0, paddingTop: "2px" }}>#{i + 1}</div>
                  </div>
                ))}

                {/* Context summary */}
                <div style={{ backgroundColor: "#F1F8E9", borderRadius: "8px", padding: "0.75rem 1rem", border: "1px solid #C5E1A5", marginTop: "0.25rem" }}>
                  <div style={{ fontSize: "0.7rem", color: "#558B2F", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: "600", marginBottom: "6px" }}>
                    📋 Data used for this analysis
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "#555", lineHeight: "1.6" }}>
                    {buildSummary(messages).summary.split("\n").map((line, i) => (
                      <span key={i}>{line}<br /></span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Recent messages quick view ── */}
        <div style={{ backgroundColor: "#fff", borderRadius: "12px", border: "1px solid #e8e8e8", padding: "1.25rem 1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <div style={{ fontSize: "0.72rem", color: "#888", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: "600" }}>🕐 Recent Inquiries</div>
            <button onClick={() => navigate("/messages")} style={{ background: "none", border: "1px solid #c8e6c9", color: "#2E7D32", borderRadius: "6px", padding: "0.25rem 0.75rem", fontSize: "0.75rem", cursor: "pointer", fontWeight: "600" }}>
              View all →
            </button>
          </div>

          {messages.length === 0 ? (
            <div style={{ textAlign: "center", color: "#bbb", fontSize: "0.85rem", padding: "1.5rem 0" }}>No messages yet.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {messages.slice(0, 5).map((m, i) => {
                const uColor = m.urgency === "High" ? "#B71C1C" : m.urgency === "Medium" ? "#E65100" : m.urgency === "Low" ? "#2E7D32" : "#ccc";
                return (
                  <div
                    key={m.id}
                    onClick={() => navigate("/messages")}
                    style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", padding: "0.6rem 0", borderBottom: i < 4 ? "1px solid #f5f5f5" : "none", cursor: "pointer" }}
                  >
                    <div style={{ width: "7px", height: "7px", borderRadius: "50%", backgroundColor: uColor, marginTop: "5px", flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem" }}>
                        <span style={{ fontWeight: "600", fontSize: "0.83rem", color: "#1a1a1a" }}>{m.name || "Unknown"}</span>
                        <span style={{ fontSize: "0.68rem", color: "#ccc", flexShrink: 0 }}>
                          {m.date ? new Date(m.date).toLocaleDateString("en-NP", { day: "2-digit", month: "short" }) : ""}
                        </span>
                      </div>
                      <div style={{ fontSize: "0.78rem", color: "#888", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {m.subject || m.message?.slice(0, 70) || "—"}
                      </div>
                    </div>
                    {m.urgency && (
                      <span style={{ fontSize: "0.63rem", fontWeight: "700", color: uColor, backgroundColor: uColor + "18", borderRadius: "10px", padding: "1px 7px", flexShrink: 0 }}>
                        {m.urgency}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}

export default Dashboard;

import { useEffect, useState } from "react";
import { db } from "../../firebase";
import { collection, onSnapshot, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

const URGENCY_CONFIG = {
  High:    { color: "#D32F2F", bg: "#FFEBEE", label: "🔴 High" },
  Medium:  { color: "#E65100", bg: "#FFF3E0", label: "🟠 Medium" },
  Low:     { color: "#2E7D32", bg: "#E8F5E9", label: "🟢 Low" },
  Pending: { color: "#555",    bg: "#F5F5F5", label: "⏳ Pending" },
  Error:   { color: "#9E9E9E", bg: "#FAFAFA", label: "⚠️ Error" },
};

const TABS = ["All", "High", "Medium", "Low", "Done"];

function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-NP", { day: "2-digit", month: "short", year: "numeric" }) +
    " · " + d.toLocaleTimeString("en-NP", { hour: "2-digit", minute: "2-digit" });
}

function Messages() {
  const navigate = useNavigate();
  const [messages, setMessages]     = useState([]);
  const [queue, setQueue]           = useState([]);
  const [processing, setProcessing] = useState(false);
  const [selected, setSelected]     = useState(null);
  const [activeTab, setActiveTab]   = useState("All");
  const [search, setSearch]         = useState("");
  const [copied, setCopied]         = useState(false);

  // ── Firestore live listener ──────────────────────────────────────────────
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "contactMessages"), (snap) => {
      const data = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => new Date(b.date) - new Date(a.date));
      setMessages(data);

      // Queue only messages that haven't been classified yet
      const unclassified = data.filter((m) => !m.urgency && !m.reply);
      setQueue((prev) => {
        const existingIds = new Set(prev.map((m) => m.id));
        const fresh = unclassified.filter((m) => !existingIds.has(m.id));
        return [...prev, ...fresh];
      });
    });
    return () => unsub();
  }, []);

  // ── AI classification queue processor ───────────────────────────────────
  useEffect(() => {
    async function processQueue() {
      if (processing || queue.length === 0) return;
      setProcessing(true);
      const msg = queue[0];
      try {
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_DASHBOARD_API_KEY}`,
          },
          body: JSON.stringify({
            model: "llama3-8b-8192",
            messages: [
              {
                role: "user",
                content:
                  `You are a classifier for Unique Fulbari Nursery, a plant nursery in Nepal.\n` +
                  `Classify urgency:\n` +
                  `- High: customer wants to buy, order, or is urgent.\n` +
                  `- Medium: asks about availability, pricing, or general info.\n` +
                  `- Low: greetings, casual or non-urgent messages.\n\n` +
                  `Respond ONLY with valid JSON:\n{"urgency":"High|Medium|Low","reply":"..."}\n` +
                  `Where "reply" is a polite professional response on behalf of Unique Fulbari Nursery.\n\n` +
                  `Subject: ${msg.subject || "N/A"}\nMessage: ${msg.message}`,
              },
            ],
            temperature: 0.3,
          }),
        });

        if (res.status === 429) {
          setTimeout(() => setProcessing(false), 10000);
          return;
        }
        if (!res.ok) {
          console.error("Groq error:", await res.text());
          setProcessing(false);
          return;
        }

        const data = await res.json();
        const text = data.choices?.[0]?.message?.content?.trim() || "{}";
        let result;
        try {
          result = JSON.parse(text);
        } catch {
          const match = text.match(/\{[\s\S]*\}/);
          result = match ? JSON.parse(match[0]) : { urgency: "Error", reply: "Could not classify." };
        }

        await updateDoc(doc(db, "contactMessages", msg.id), {
          urgency: result.urgency || "Unknown",
          reply: result.reply || "No suggestion available.",
          done: false,
        });

        setQueue((prev) => prev.slice(1));
      } catch (err) {
        console.error("Classification error:", err);
      } finally {
        setProcessing(false);
      }
    }
    processQueue();
  }, [queue, processing]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const toggleDone = async (id, current) => {
    await updateDoc(doc(db, "contactMessages", id), { done: !current });
    if (selected?.id === id) setSelected((s) => ({ ...s, done: !current }));
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this message permanently?")) return;
    await deleteDoc(doc(db, "contactMessages", id));
    if (selected?.id === id) setSelected(null);
  };

  const copyReply = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Filtering ─────────────────────────────────────────────────────────────
  const filtered = messages.filter((m) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      m.name?.toLowerCase().includes(q) ||
      m.email?.toLowerCase().includes(q) ||
      m.subject?.toLowerCase().includes(q) ||
      m.message?.toLowerCase().includes(q);
    const matchTab =
      activeTab === "All" ? true :
      activeTab === "Done" ? m.done :
      m.urgency === activeTab;
    return matchSearch && matchTab;
  });

  const counts = {
    All:    messages.length,
    High:   messages.filter((m) => m.urgency === "High").length,
    Medium: messages.filter((m) => m.urgency === "Medium").length,
    Low:    messages.filter((m) => m.urgency === "Low").length,
    Done:   messages.filter((m) => m.done).length,
  };

  // ── Styles ────────────────────────────────────────────────────────────────
  const s = {
    page:       { display: "flex", flexDirection: "column", minHeight: "100vh", backgroundColor: "#F4F6F4", fontFamily: "'Segoe UI', sans-serif" },
    topbar:     { backgroundColor: "#1B5E20", color: "white", padding: "0.85rem 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between" },
    backBtn:    { background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", color: "white", borderRadius: "6px", padding: "0.35rem 0.85rem", cursor: "pointer", fontSize: "0.82rem" },
    body:       { display: "flex", flex: 1, overflow: "hidden" },
    sidebar:    { width: "320px", minWidth: "260px", backgroundColor: "#fff", borderRight: "1px solid #e0e0e0", display: "flex", flexDirection: "column", overflow: "hidden" },
    detail:     { flex: 1, padding: "2rem", overflowY: "auto" },
    tabBar:     { display: "flex", borderBottom: "1px solid #e0e0e0", backgroundColor: "#FAFAFA" },
    tab:        (active) => ({ flex: 1, padding: "0.55rem 0.25rem", border: "none", background: "none", cursor: "pointer", fontSize: "0.75rem", fontWeight: active ? "700" : "500", color: active ? "#1B5E20" : "#666", borderBottom: active ? "2px solid #1B5E20" : "2px solid transparent" }),
    searchBox:  { padding: "0.5rem 0.75rem", borderBottom: "1px solid #e0e0e0" },
    searchInp:  { width: "100%", padding: "0.4rem 0.65rem", borderRadius: "6px", border: "1px solid #c8e6c9", fontSize: "0.82rem", outline: "none", boxSizing: "border-box" },
    msgList:    { flex: 1, overflowY: "auto" },
    msgItem:    (sel, done) => ({ padding: "0.75rem 1rem", borderBottom: "1px solid #F0F0F0", cursor: "pointer", backgroundColor: sel ? "#E8F5E9" : done ? "#FAFAFA" : "#fff", borderLeft: sel ? "3px solid #2E7D32" : "3px solid transparent" }),
    badge:      (urgency) => { const c = URGENCY_CONFIG[urgency] || URGENCY_CONFIG.Pending; return { display: "inline-block", padding: "1px 8px", borderRadius: "12px", fontSize: "0.68rem", fontWeight: "600", color: c.color, backgroundColor: c.bg }; },
    emptyState: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#aaa", gap: "0.5rem" },
  };

  const urgencyKey = (m) => m.urgency || "Pending";

  return (
    <div style={s.page}>
      {/* ── Top bar ── */}
      <div style={s.topbar}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <button style={s.backBtn} onClick={() => navigate("/dashboard")}>← Dashboard</button>
          <div>
            <div style={{ fontWeight: "700", fontSize: "1rem" }}>📬 Contact Messages</div>
            <div style={{ fontSize: "0.72rem", opacity: 0.8 }}>Unique Fulbari Nursery · Inbox</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          {processing && (
            <span style={{ fontSize: "0.75rem", opacity: 0.85, backgroundColor: "rgba(255,255,255,0.15)", padding: "0.25rem 0.65rem", borderRadius: "12px" }}>
              ⚙️ Classifying…
            </span>
          )}
          <span style={{ fontSize: "0.78rem", opacity: 0.8 }}>{messages.length} total · {counts.Done} done</span>
        </div>
      </div>

      <div style={s.body}>
        {/* ── Left sidebar ── */}
        <div style={s.sidebar}>
          {/* Tabs */}
          <div style={s.tabBar}>
            {TABS.map((t) => (
              <button key={t} style={s.tab(activeTab === t)} onClick={() => setActiveTab(t)}>
                {t}
                <span style={{ display: "block", fontSize: "0.7rem", color: activeTab === t ? "#1B5E20" : "#999" }}>
                  {counts[t]}
                </span>
              </button>
            ))}
          </div>

          {/* Search */}
          <div style={s.searchBox}>
            <input
              style={s.searchInp}
              placeholder="🔍 Search name, email, subject…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Message list */}
          <div style={s.msgList}>
            {filtered.length === 0 ? (
              <div style={{ padding: "2rem", textAlign: "center", color: "#aaa", fontSize: "0.83rem" }}>
                No messages found.
              </div>
            ) : (
              filtered.map((m) => (
                <div
                  key={m.id}
                  style={s.msgItem(selected?.id === m.id, m.done)}
                  onClick={() => setSelected(m)}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "3px" }}>
                    <span style={{ fontWeight: "600", fontSize: "0.85rem", color: m.done ? "#aaa" : "#1a1a1a", textDecoration: m.done ? "line-through" : "none" }}>
                      {m.name || "Unknown"}
                    </span>
                    <span style={s.badge(urgencyKey(m))}>
                      {URGENCY_CONFIG[urgencyKey(m)]?.label || "Pending"}
                    </span>
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#888", marginBottom: "3px" }}>
                    {m.subject || m.email || "—"}
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "#555", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {m.message}
                  </div>
                  <div style={{ fontSize: "0.66rem", color: "#bbb", marginTop: "4px" }}>
                    {formatDate(m.date)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── Detail panel ── */}
        <div style={s.detail}>
          {!selected ? (
            <div style={s.emptyState}>
              <span style={{ fontSize: "2.5rem" }}>📭</span>
              <span style={{ fontSize: "0.9rem" }}>Select a message to view details</span>
            </div>
          ) : (
            <div style={{ maxWidth: "680px" }}>
              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem", flexWrap: "wrap", gap: "0.75rem" }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: "1.3rem", color: "#1a1a1a" }}>
                    {selected.subject || "No Subject"}
                  </h2>
                  <div style={{ fontSize: "0.8rem", color: "#888", marginTop: "4px" }}>
                    {formatDate(selected.date)}
                  </div>
                </div>
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  <span style={s.badge(urgencyKey(selected))}>
                    {URGENCY_CONFIG[urgencyKey(selected)]?.label}
                  </span>
                  <button
                    onClick={() => toggleDone(selected.id, selected.done)}
                    style={{
                      padding: "0.35rem 0.9rem", borderRadius: "6px", border: "1px solid #2E7D32",
                      backgroundColor: selected.done ? "#2E7D32" : "#fff",
                      color: selected.done ? "white" : "#2E7D32",
                      fontSize: "0.8rem", cursor: "pointer", fontWeight: "600",
                    }}
                  >
                    {selected.done ? "✓ Done" : "Mark Done"}
                  </button>
                  <button
                    onClick={() => handleDelete(selected.id)}
                    style={{ padding: "0.35rem 0.9rem", borderRadius: "6px", border: "1px solid #e53935", backgroundColor: "#fff", color: "#e53935", fontSize: "0.8rem", cursor: "pointer" }}
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Sender info card */}
              <div style={{ backgroundColor: "#fff", borderRadius: "10px", padding: "1rem 1.25rem", marginBottom: "1.25rem", border: "1px solid #e8e8e8", display: "flex", flexWrap: "wrap", gap: "1rem" }}>
                {[
                  { label: "Name",    value: selected.name    || "—" },
                  { label: "Email",   value: selected.email   || "—", href: `mailto:${selected.email}` },
                  { label: "Phone",   value: selected.phone   || "—", href: selected.phone ? `tel:${selected.phone}` : null },
                  { label: "Subject", value: selected.subject || "—" },
                ].map(({ label, value, href }) => (
                  <div key={label} style={{ minWidth: "140px" }}>
                    <div style={{ fontSize: "0.68rem", color: "#aaa", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "2px" }}>{label}</div>
                    {href ? (
                      <a href={href} style={{ fontSize: "0.88rem", color: "#1B5E20", textDecoration: "none", fontWeight: "500" }}>{value}</a>
                    ) : (
                      <div style={{ fontSize: "0.88rem", color: "#1a1a1a", fontWeight: "500" }}>{value}</div>
                    )}
                  </div>
                ))}
              </div>

              {/* Message body */}
              <div style={{ backgroundColor: "#fff", borderRadius: "10px", padding: "1.25rem", marginBottom: "1.25rem", border: "1px solid #e8e8e8" }}>
                <div style={{ fontSize: "0.72rem", color: "#aaa", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.6rem" }}>Message</div>
                <p style={{ margin: 0, fontSize: "0.9rem", lineHeight: "1.7", color: "#333", whiteSpace: "pre-wrap" }}>
                  {selected.message}
                </p>
              </div>

              {/* AI suggested reply */}
              <div style={{ backgroundColor: "#F1F8E9", borderRadius: "10px", padding: "1.25rem", border: "1px solid #C5E1A5" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem" }}>
                  <div style={{ fontSize: "0.72rem", color: "#558B2F", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: "600" }}>
                    🤖 AI Suggested Reply
                  </div>
                  {selected.reply && selected.reply !== "Pending classification" && (
                    <button
                      onClick={() => copyReply(selected.reply)}
                      style={{ padding: "0.25rem 0.75rem", borderRadius: "6px", border: "1px solid #558B2F", backgroundColor: "#fff", color: "#558B2F", fontSize: "0.75rem", cursor: "pointer", fontWeight: "600" }}
                    >
                      {copied ? "✓ Copied!" : "Copy"}
                    </button>
                  )}
                </div>
                <p style={{ margin: 0, fontSize: "0.88rem", lineHeight: "1.7", color: "#33691E", whiteSpace: "pre-wrap" }}>
                  {selected.reply || "⏳ Waiting for AI classification…"}
                </p>
                {selected.reply && (
                  <a
                    href={`mailto:${selected.email}?subject=Re: ${encodeURIComponent(selected.subject || "Your Inquiry")}&body=${encodeURIComponent(selected.reply)}`}
                    style={{ display: "inline-block", marginTop: "0.85rem", padding: "0.45rem 1.1rem", backgroundColor: "#2E7D32", color: "white", borderRadius: "7px", fontSize: "0.82rem", textDecoration: "none", fontWeight: "600" }}
                  >
                    ✉️ Reply via Email
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Messages;

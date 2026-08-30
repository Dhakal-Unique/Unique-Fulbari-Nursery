import { useState, useEffect } from "react";
import { db } from "../../firebase";
import { collection, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

const URGENCY_CONFIG = {
  High:    { color: "#B71C1C", bg: "#FFEBEE", border: "#EF9A9A", label: "🔴 High",   desc: "Needs immediate attention" },
  Medium:  { color: "#E65100", bg: "#FFF3E0", border: "#FFCC80", label: "🟠 Medium", desc: "Address within 24 hours" },
  Low:     { color: "#1B5E20", bg: "#E8F5E9", border: "#A5D6A7", label: "🟢 Low",    desc: "Address when available" },
  Pending: { color: "#555",    bg: "#F5F5F5", border: "#E0E0E0", label: "⏳ Pending", desc: "Awaiting classification" },
  Error:   { color: "#9E9E9E", bg: "#FAFAFA", border: "#E0E0E0", label: "⚠️ Error",  desc: "Classification failed" },
};

const COLUMNS = ["High", "Medium", "Low", "Pending"];

function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-NP", { day: "2-digit", month: "short" }) +
    " · " + d.toLocaleTimeString("en-NP", { hour: "2-digit", minute: "2-digit" });
}

function Urgency() {
  const navigate = useNavigate();
  const [messages, setMessages]     = useState([]);
  const [queue, setQueue]           = useState([]);
  const [processing, setProcessing] = useState(false);
  const [selected, setSelected]     = useState(null);
  const [copied, setCopied]         = useState(false);
  const [reclassifying, setReclassifying] = useState(null);

  // ── Firestore live listener ──────────────────────────────────────────────
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "contactMessages"), (snap) => {
      const data = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => new Date(b.date) - new Date(a.date));
      setMessages(data);

      // Auto-queue unclassified messages
      const unclassified = data.filter((m) => !m.urgency && !m.reply);
      setQueue((prev) => {
        const ids = new Set(prev.map((m) => m.id));
        return [...prev, ...unclassified.filter((m) => !ids.has(m.id))];
      });
    });
    return () => unsub();
  }, []);

  // ── Groq classifier ──────────────────────────────────────────────────────
  async function classifyMessage(msg) {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_DASHBOARD_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt‑oss‑20B",
        messages: [
          {
            role: "user",
            content:
              `You are a classifier for Unique Fulbari Nursery, a plant nursery in Nepal.\n` +
              `Classify urgency:\n` +
              `- High: customer wants to buy, order, is complaining, or is urgent.\n` +
              `- Medium: asks about availability, pricing, delivery, or general info.\n` +
              `- Low: greetings, casual or non-urgent messages.\n\n` +
              `Respond ONLY with valid JSON:\n{"urgency":"High|Medium|Low","reply":"..."}\n` +
              `Where "reply" is a polite professional response on behalf of Unique Fulbari Nursery.\n\n` +
              `Subject: ${msg.subject || "N/A"}\nMessage: ${msg.message}`,
          },
        ],
        temperature: 0.3,
      }),
    });

    if (res.status === 429) throw new Error("rate_limit");
    if (!res.ok) throw new Error(`http_${res.status}`);

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content?.trim() || "{}";
    try {
      return JSON.parse(text);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      return match ? JSON.parse(match[0]) : { urgency: "Error", reply: "Could not classify." };
    }
  }

  // ── Queue processor ──────────────────────────────────────────────────────
  useEffect(() => {
    async function processQueue() {
      if (processing || queue.length === 0) return;
      setProcessing(true);
      const msg = queue[0];
      try {
        const result = await classifyMessage(msg);
        await updateDoc(doc(db, "contactMessages", msg.id), {
          urgency: result.urgency || "Unknown",
          reply: result.reply || "No suggestion available.",
          done: msg.done || false,
        });
        setQueue((prev) => prev.slice(1));
      } catch (err) {
        if (err.message === "rate_limit") {
          setTimeout(() => setProcessing(false), 12000);
          return;
        }
        console.error("Classification error:", err);
        setQueue((prev) => prev.slice(1));
      } finally {
        setProcessing(false);
      }
    }
    processQueue();
  }, [queue, processing]);

  // ── Manual reclassify ────────────────────────────────────────────────────
  const handleReclassify = async (msg) => {
    setReclassifying(msg.id);
    try {
      const result = await classifyMessage(msg);
      await updateDoc(doc(db, "contactMessages", msg.id), {
        urgency: result.urgency || "Unknown",
        reply: result.reply || "No suggestion available.",
      });
      if (selected?.id === msg.id) {
        setSelected((s) => ({ ...s, urgency: result.urgency, reply: result.reply }));
      }
    } catch (err) {
      console.error("Reclassify error:", err);
    } finally {
      setReclassifying(null);
    }
  };

  // ── Handlers ─────────────────────────────────────────────────────────────
  const toggleDone = async (id, current) => {
    await updateDoc(doc(db, "contactMessages", id), { done: !current });
    if (selected?.id === id) setSelected((s) => ({ ...s, done: !current }));
  };

  const copyReply = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Derived data ─────────────────────────────────────────────────────────
  const byUrgency = (level) =>
    messages.filter((m) => (m.urgency || "Pending") === level);

  const counts = Object.fromEntries(
    COLUMNS.map((c) => [c, byUrgency(c).length])
  );

  // ── Styles ────────────────────────────────────────────────────────────────
  const cfg = (key) => URGENCY_CONFIG[key] || URGENCY_CONFIG.Pending;

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", backgroundColor: "#F4F6F4", fontFamily: "'Segoe UI', sans-serif" }}>

      {/* ── Top bar ── */}
      <div style={{ backgroundColor: "#1B5E20", color: "white", padding: "0.85rem 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <button
            onClick={() => navigate("/dashboard")}
            style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", color: "white", borderRadius: "6px", padding: "0.35rem 0.85rem", cursor: "pointer", fontSize: "0.82rem" }}
          >
            ← Dashboard
          </button>
          <div>
            <div style={{ fontWeight: "700", fontSize: "1rem" }}>📋 Urgency Detection</div>
            <div style={{ fontSize: "0.72rem", opacity: 0.8 }}>Unique Fulbari Nursery · AI-powered triage</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", fontSize: "0.78rem", opacity: 0.9 }}>
          {processing && (
            <span style={{ backgroundColor: "rgba(255,255,255,0.15)", padding: "0.25rem 0.65rem", borderRadius: "12px" }}>
              ⚙️ Classifying…
            </span>
          )}
          <span>{messages.length} messages</span>
        </div>
      </div>

      {/* ── Summary bar ── */}
      <div style={{ display: "flex", gap: "1rem", padding: "1rem 1.5rem", flexWrap: "wrap" }}>
        {COLUMNS.map((col) => {
          const c = cfg(col);
          return (
            <div key={col} style={{ backgroundColor: "#fff", borderRadius: "10px", padding: "0.75rem 1.25rem", border: `1px solid ${c.border}`, minWidth: "130px", flex: "1 1 130px" }}>
              <div style={{ fontSize: "0.72rem", color: "#888", textTransform: "uppercase", letterSpacing: "0.05em" }}>{c.label}</div>
              <div style={{ fontSize: "1.6rem", fontWeight: "700", color: c.color, lineHeight: 1.2 }}>{counts[col]}</div>
              <div style={{ fontSize: "0.7rem", color: "#aaa", marginTop: "2px" }}>{c.desc}</div>
            </div>
          );
        })}
      </div>

      {/* ── Main area ── */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden", gap: 0 }}>

        {/* Kanban columns */}
        <div style={{ flex: 1, display: "flex", gap: "1rem", padding: "0 1.5rem 1.5rem", overflowX: "auto" }}>
          {COLUMNS.map((col) => {
            const c = cfg(col);
            const colMessages = byUrgency(col);
            return (
              <div key={col} style={{ flex: "1 1 200px", minWidth: "200px", display: "flex", flexDirection: "column" }}>
                {/* Column header */}
                <div style={{ backgroundColor: c.bg, border: `1px solid ${c.border}`, borderRadius: "8px 8px 0 0", padding: "0.5rem 0.85rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: "700", fontSize: "0.82rem", color: c.color }}>{c.label}</span>
                  <span style={{ backgroundColor: c.color, color: "#fff", borderRadius: "10px", padding: "1px 8px", fontSize: "0.72rem", fontWeight: "700" }}>{colMessages.length}</span>
                </div>

                {/* Column cards */}
                <div style={{ flex: 1, overflowY: "auto", backgroundColor: "#EAEEEA", border: `1px solid ${c.border}`, borderTop: "none", borderRadius: "0 0 8px 8px", padding: "0.5rem", display: "flex", flexDirection: "column", gap: "0.5rem", maxHeight: "calc(100vh - 280px)" }}>
                  {colMessages.length === 0 ? (
                    <div style={{ textAlign: "center", color: "#bbb", fontSize: "0.78rem", padding: "1.5rem 0" }}>No messages</div>
                  ) : (
                    colMessages.map((m) => (
                      <div
                        key={m.id}
                        onClick={() => setSelected(m)}
                        style={{
                          backgroundColor: selected?.id === m.id ? c.bg : "#fff",
                          border: selected?.id === m.id ? `1.5px solid ${c.color}` : "1px solid #e8e8e8",
                          borderRadius: "8px",
                          padding: "0.65rem 0.75rem",
                          cursor: "pointer",
                          opacity: m.done ? 0.55 : 1,
                        }}
                      >
                        <div style={{ fontWeight: "600", fontSize: "0.82rem", color: m.done ? "#aaa" : "#1a1a1a", textDecoration: m.done ? "line-through" : "none", marginBottom: "3px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {m.name || "Unknown"}
                        </div>
                        <div style={{ fontSize: "0.73rem", color: "#888", marginBottom: "4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {m.subject || "No subject"}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "#555", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                          {m.message}
                        </div>
                        <div style={{ fontSize: "0.63rem", color: "#bbb", marginTop: "5px" }}>
                          {formatDate(m.date)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Detail panel ── */}
        {selected && (
          <div style={{ width: "340px", minWidth: "300px", backgroundColor: "#fff", borderLeft: "1px solid #e0e0e0", overflowY: "auto", padding: "1.25rem" }}>

            {/* Close */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <span style={{ fontWeight: "700", fontSize: "0.9rem", color: "#1a1a1a" }}>Message Detail</span>
              <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.1rem", color: "#aaa" }}>✕</button>
            </div>

            {/* Urgency badge */}
            <div style={{ backgroundColor: cfg(selected.urgency || "Pending").bg, border: `1px solid ${cfg(selected.urgency || "Pending").border}`, borderRadius: "8px", padding: "0.6rem 0.85rem", marginBottom: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: "0.68rem", color: "#888", textTransform: "uppercase", letterSpacing: "0.05em" }}>Urgency Level</div>
                <div style={{ fontWeight: "700", color: cfg(selected.urgency || "Pending").color, fontSize: "0.92rem", marginTop: "2px" }}>
                  {cfg(selected.urgency || "Pending").label}
                </div>
              </div>
              <button
                onClick={() => handleReclassify(selected)}
                disabled={reclassifying === selected.id}
                style={{ fontSize: "0.72rem", padding: "0.28rem 0.65rem", borderRadius: "6px", border: "1px solid #c8e6c9", backgroundColor: "#fff", color: "#2E7D32", cursor: "pointer" }}
              >
                {reclassifying === selected.id ? "…" : "↻ Re-classify"}
              </button>
            </div>

            {/* Sender info */}
            <div style={{ backgroundColor: "#FAFAFA", borderRadius: "8px", padding: "0.75rem", marginBottom: "1rem", border: "1px solid #eee" }}>
              {[
                { label: "Name",    value: selected.name    || "—" },
                { label: "Email",   value: selected.email   || "—", href: `mailto:${selected.email}` },
                { label: "Phone",   value: selected.phone   || "—", href: selected.phone ? `tel:${selected.phone}` : null },
                { label: "Subject", value: selected.subject || "—" },
                { label: "Date",    value: formatDate(selected.date) },
              ].map(({ label, value, href }) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "0.8rem" }}>
                  <span style={{ color: "#aaa", minWidth: "60px" }}>{label}</span>
                  {href ? (
                    <a href={href} style={{ color: "#1B5E20", textDecoration: "none", fontWeight: "500", textAlign: "right", wordBreak: "break-all" }}>{value}</a>
                  ) : (
                    <span style={{ color: "#1a1a1a", fontWeight: "500", textAlign: "right" }}>{value}</span>
                  )}
                </div>
              ))}
            </div>

            {/* Message */}
            <div style={{ marginBottom: "1rem" }}>
              <div style={{ fontSize: "0.68rem", color: "#aaa", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "5px" }}>Message</div>
              <div style={{ fontSize: "0.85rem", lineHeight: "1.65", color: "#333", whiteSpace: "pre-wrap", backgroundColor: "#FAFAFA", borderRadius: "8px", padding: "0.75rem", border: "1px solid #eee" }}>
                {selected.message}
              </div>
            </div>

            {/* AI Reply */}
            <div style={{ backgroundColor: "#F1F8E9", borderRadius: "8px", padding: "0.85rem", border: "1px solid #C5E1A5", marginBottom: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <span style={{ fontSize: "0.68rem", color: "#558B2F", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: "700" }}>🤖 AI Suggested Reply</span>
                {selected.reply && (
                  <button
                    onClick={() => copyReply(selected.reply)}
                    style={{ fontSize: "0.7rem", padding: "0.2rem 0.55rem", borderRadius: "5px", border: "1px solid #558B2F", backgroundColor: "#fff", color: "#558B2F", cursor: "pointer", fontWeight: "600" }}
                  >
                    {copied ? "✓ Copied" : "Copy"}
                  </button>
                )}
              </div>
              <div style={{ fontSize: "0.83rem", lineHeight: "1.65", color: "#33691E", whiteSpace: "pre-wrap" }}>
                {selected.reply || "⏳ Waiting for classification…"}
              </div>
              {selected.reply && (
                <a
                  href={`mailto:${selected.email}?subject=Re: ${encodeURIComponent(selected.subject || "Your Inquiry")}&body=${encodeURIComponent(selected.reply)}`}
                  style={{ display: "inline-block", marginTop: "0.75rem", padding: "0.4rem 1rem", backgroundColor: "#2E7D32", color: "white", borderRadius: "6px", fontSize: "0.78rem", textDecoration: "none", fontWeight: "600" }}
                >
                  ✉️ Reply via Email
                </a>
              )}
            </div>

            {/* Actions */}
            <button
              onClick={() => toggleDone(selected.id, selected.done)}
              style={{ width: "100%", padding: "0.55rem", borderRadius: "7px", border: "1px solid #2E7D32", backgroundColor: selected.done ? "#2E7D32" : "#fff", color: selected.done ? "white" : "#2E7D32", fontSize: "0.85rem", fontWeight: "600", cursor: "pointer" }}
            >
              {selected.done ? "✓ Marked as Done" : "Mark as Done"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Urgency;

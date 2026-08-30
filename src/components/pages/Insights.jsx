import { useEffect, useState } from "react";
import { db } from "../../firebase";
import { collection, onSnapshot, updateDoc, doc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

// ── Helpers ────────────────────────────────────────────────────────────────
function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-NP", { day: "2-digit", month: "short", year: "numeric" });
}

function pct(val, total) {
  return total === 0 ? 0 : Math.round((val / total) * 100);
}

// ── Mini bar chart (SVG) ───────────────────────────────────────────────────
function BarChart({ items, color }) {
  const max = Math.max(...items.map((i) => i.count), 1);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {items.map((item, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: "120px", fontSize: "0.78rem", color: "#555", textAlign: "right", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {item.label}
          </div>
          <div style={{ flex: 1, backgroundColor: "#f0f0f0", borderRadius: "4px", height: "14px", overflow: "hidden" }}>
            <div style={{ width: `${pct(item.count, max)}%`, backgroundColor: color, height: "100%", borderRadius: "4px", minWidth: "4px", transition: "width 0.6s ease" }} />
          </div>
          <div style={{ width: "28px", fontSize: "0.75rem", color: "#888", textAlign: "right" }}>{item.count}</div>
        </div>
      ))}
    </div>
  );
}

// ── Donut chart (SVG) ──────────────────────────────────────────────────────
function DonutChart({ segments }) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  if (total === 0) return <div style={{ textAlign: "center", color: "#bbb", fontSize: "0.8rem", padding: "1rem" }}>No data yet</div>;

  const r = 46, cx = 60, cy = 60, stroke = 22;
  const circ = 2 * Math.PI * r;
  let offset = 0;

  return (
    <svg viewBox="0 0 120 120" width="120" height="120">
      {segments.map((seg, i) => {
        const dash = (seg.value / total) * circ;
        const gap = circ - dash;
        const el = (
          <circle
            key={i}
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={seg.color}
            strokeWidth={stroke}
            strokeDasharray={`${dash} ${gap}`}
            strokeDashoffset={-offset}
            style={{ transform: "rotate(-90deg)", transformOrigin: "60px 60px" }}
          />
        );
        offset += dash;
        return el;
      })}
      <text x={cx} y={cy - 5} textAnchor="middle" fontSize="14" fontWeight="700" fill="#1a1a1a">{total}</text>
      <text x={cx} y={cy + 12} textAnchor="middle" fontSize="8" fill="#888">total</text>
    </svg>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, accent }) {
  return (
    <div style={{ backgroundColor: "#fff", borderRadius: "10px", padding: "1rem 1.25rem", border: "1px solid #e8e8e8", flex: "1 1 130px", minWidth: "130px" }}>
      <div style={{ fontSize: "0.7rem", color: "#aaa", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>{label}</div>
      <div style={{ fontSize: "1.7rem", fontWeight: "700", color: accent || "#1a1a1a", lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: "0.72rem", color: "#aaa", marginTop: "4px" }}>{sub}</div>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
function Insights() {
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [stats, setStats]       = useState(null);
  const [loading, setLoading]   = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [queueLen, setQueueLen]   = useState(0);

  // ── Firestore listener ──────────────────────────────────────────────────
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "contactMessages"), (snap) => {
      const data = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => new Date(b.date) - new Date(a.date));
      setMessages(data);
      computeStats(data);
    });
    return () => unsub();
  }, []);

  // ── Compute stats from cached analysis only (no AI call here) ──────────
  function computeStats(data) {
    let high = 0, medium = 0, low = 0;
    let positive = 0, negative = 0, neutral = 0;
    const keywordMap = {}, requestMap = {};
    const recent = [];

    for (const m of data) {
      // Urgency from Firestore field (set by Messages/Urgency page)
      const u = m.urgency;
      if (u === "High") high++;
      else if (u === "Medium") medium++;
      else if (u === "Low") low++;

      // Sentiment from analysis sub-document
      const a = m.analysis;
      if (a) {
        if (a.sentiment === "Positive") positive++;
        else if (a.sentiment === "Negative") negative++;
        else neutral++;
        (a.keywords || []).forEach((w) => { keywordMap[w] = (keywordMap[w] || 0) + 1; });
        if (a.request) requestMap[a.request] = (requestMap[a.request] || 0) + 1;
      }

      if (recent.length < 6) recent.push(m);
    }

    const trending = Object.entries(keywordMap)
      .sort((a, b) => b[1] - a[1]).slice(0, 6)
      .map(([label, count]) => ({ label, count }));

    const topRequests = Object.entries(requestMap)
      .sort((a, b) => b[1] - a[1]).slice(0, 5)
      .map(([label, count]) => ({ label, count }));

    const done    = data.filter((m) => m.done).length;
    const pending = data.filter((m) => !m.done).length;
    const unanalyzed = data.filter((m) => !m.analysis).length;

    setStats({ total: data.length, high, medium, low, positive, negative, neutral, trending, topRequests, recent, done, pending, unanalyzed });
    setLoading(false);
    setQueueLen(unanalyzed);
  }

  // ── Groq sentiment analysis for unanalyzed messages ────────────────────
  async function analyzeMessage(msg) {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_DASHBOARD_API_KEY}`,
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b",
        messages: [
          {
            role: "user",
            content:
              `Analyze this customer message for a plant nursery in Nepal.\n` +
              `Return ONLY valid JSON:\n` +
              `{"sentiment":"Positive|Negative|Neutral","keywords":["word1","word2"],"request":"main customer request"}\n\n` +
              `Subject: ${msg.subject || "N/A"}\nMessage: ${msg.message}`,
          },
        ],
        temperature: 0,
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content?.trim() || "{}";
    try { return JSON.parse(text); }
    catch {
      const m = text.match(/\{[\s\S]*\}/);
      return m ? JSON.parse(m[0]) : { sentiment: "Neutral", keywords: [], request: "" };
    }
  }

  const runAnalysis = async () => {
    const unanalyzed = messages.filter((m) => !m.analysis);
    if (unanalyzed.length === 0) return;
    setAnalyzing(true);
    for (const msg of unanalyzed) {
      try {
        const analysis = await analyzeMessage(msg);
        await updateDoc(doc(db, "contactMessages", msg.id), { analysis });
      } catch (e) {
        console.error("Analysis failed for", msg.id, e);
      }
      await new Promise((r) => setTimeout(r, 800)); // rate-limit buffer
    }
    setAnalyzing(false);
  };

  // ── Sentiment / urgency config ──────────────────────────────────────────
  const sentimentColor = { Positive: "#2E7D32", Neutral: "#E65100", Negative: "#B71C1C" };
  const urgencyColor   = { High: "#B71C1C", Medium: "#E65100", Low: "#2E7D32" };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", fontFamily: "'Segoe UI', sans-serif", color: "#888" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🌿</div>
          <div>Loading insights…</div>
        </div>
      </div>
    );
  }

  const s = stats;
  const sentimentSegments = [
    { color: "#2E7D32", value: s.positive },
    { color: "#E65100", value: s.neutral  },
    { color: "#B71C1C", value: s.negative },
  ];
  const urgencySegments = [
    { color: "#B71C1C", value: s.high   },
    { color: "#E65100", value: s.medium },
    { color: "#2E7D32", value: s.low    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", backgroundColor: "#F4F6F4", fontFamily: "'Segoe UI', sans-serif" }}>

      {/* ── Top bar ── */}
      <div style={{ backgroundColor: "#1B5E20", color: "white", padding: "0.85rem 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <button onClick={() => navigate("/dashboard")} style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", color: "white", borderRadius: "6px", padding: "0.35rem 0.85rem", cursor: "pointer", fontSize: "0.82rem" }}>
            ← Dashboard
          </button>
          <div>
            <div style={{ fontWeight: "700", fontSize: "1rem" }}>📊 Business Insights</div>
            <div style={{ fontSize: "0.72rem", opacity: 0.8 }}>Unique Fulbari Nursery · AI Analytics</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          {analyzing && (
            <span style={{ fontSize: "0.75rem", backgroundColor: "rgba(255,255,255,0.15)", padding: "0.25rem 0.65rem", borderRadius: "12px" }}>
              ⚙️ Analysing {queueLen} messages…
            </span>
          )}
          {!analyzing && s.unanalyzed > 0 && (
            <button
              onClick={runAnalysis}
              style={{ backgroundColor: "#FBC02D", color: "#1B5E20", border: "none", borderRadius: "6px", padding: "0.35rem 0.9rem", cursor: "pointer", fontSize: "0.82rem", fontWeight: "700" }}
            >
              ✨ Analyse {s.unanalyzed} new
            </button>
          )}
          <span style={{ fontSize: "0.78rem", opacity: 0.8 }}>{s.total} total messages</span>
        </div>
      </div>

      <div style={{ padding: "1.25rem 1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>

        {/* ── Row 1: KPI cards ── */}
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <StatCard label="Total Messages"   value={s.total}   sub="All time"             accent="#1B5E20" />
          <StatCard label="High Urgency"     value={s.high}    sub={`${pct(s.high, s.total)}% of total`}   accent="#B71C1C" />
          <StatCard label="Medium Urgency"   value={s.medium}  sub={`${pct(s.medium, s.total)}% of total`} accent="#E65100" />
          <StatCard label="Low Urgency"      value={s.low}     sub={`${pct(s.low, s.total)}% of total`}    accent="#2E7D32" />
          <StatCard label="Resolved"         value={s.done}    sub={`${pct(s.done, s.total)}% done`}       accent="#1565C0" />
          <StatCard label="Pending Reply"    value={s.pending} sub="Awaiting action"      accent="#888" />
        </div>

        {/* ── Row 2: Donut charts + sentiment detail ── */}
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>

          {/* Urgency donut */}
          <div style={{ flex: "1 1 220px", backgroundColor: "#fff", borderRadius: "10px", padding: "1.25rem", border: "1px solid #e8e8e8" }}>
            <div style={{ fontSize: "0.78rem", color: "#888", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "1rem", fontWeight: "600" }}>Urgency Breakdown</div>
            <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", flexWrap: "wrap" }}>
              <DonutChart segments={urgencySegments} />
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {[["🔴 High", s.high, "#B71C1C"], ["🟠 Medium", s.medium, "#E65100"], ["🟢 Low", s.low, "#2E7D32"]].map(([label, val, color]) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <div style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: color, flexShrink: 0 }} />
                    <span style={{ fontSize: "0.8rem", color: "#555" }}>{label}</span>
                    <span style={{ fontSize: "0.8rem", fontWeight: "700", color, marginLeft: "auto", paddingLeft: "8px" }}>{val} ({pct(val, s.total)}%)</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sentiment donut */}
          <div style={{ flex: "1 1 220px", backgroundColor: "#fff", borderRadius: "10px", padding: "1.25rem", border: "1px solid #e8e8e8" }}>
            <div style={{ fontSize: "0.78rem", color: "#888", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "1rem", fontWeight: "600" }}>Customer Sentiment</div>
            <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", flexWrap: "wrap" }}>
              <DonutChart segments={sentimentSegments} />
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {[["😊 Positive", s.positive, "#2E7D32"], ["😐 Neutral", s.neutral, "#E65100"], ["😞 Negative", s.negative, "#B71C1C"]].map(([label, val, color]) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <div style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: color, flexShrink: 0 }} />
                    <span style={{ fontSize: "0.8rem", color: "#555" }}>{label}</span>
                    <span style={{ fontSize: "0.8rem", fontWeight: "700", color, marginLeft: "auto", paddingLeft: "8px" }}>{val} ({pct(val, s.positive + s.neutral + s.negative)}%)</span>
                  </div>
                ))}
                {(s.positive + s.neutral + s.negative) === 0 && (
                  <div style={{ fontSize: "0.75rem", color: "#bbb" }}>Run analysis to see sentiment</div>
                )}
              </div>
            </div>
          </div>

          {/* Resolution rate */}
          <div style={{ flex: "1 1 180px", backgroundColor: "#fff", borderRadius: "10px", padding: "1.25rem", border: "1px solid #e8e8e8" }}>
            <div style={{ fontSize: "0.78rem", color: "#888", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "1rem", fontWeight: "600" }}>Resolution Rate</div>
            <div style={{ fontSize: "2.8rem", fontWeight: "800", color: "#1B5E20", lineHeight: 1 }}>{pct(s.done, s.total)}%</div>
            <div style={{ fontSize: "0.75rem", color: "#aaa", margin: "6px 0 12px" }}>{s.done} of {s.total} resolved</div>
            <div style={{ backgroundColor: "#e8e8e8", borderRadius: "4px", height: "8px", overflow: "hidden" }}>
              <div style={{ width: `${pct(s.done, s.total)}%`, backgroundColor: "#1B5E20", height: "100%", borderRadius: "4px", minWidth: s.done > 0 ? "4px" : "0" }} />
            </div>
          </div>
        </div>

        {/* ── Row 3: Trending keywords + top requests ── */}
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>

          {/* Trending keywords */}
          <div style={{ flex: "1 1 260px", backgroundColor: "#fff", borderRadius: "10px", padding: "1.25rem", border: "1px solid #e8e8e8" }}>
            <div style={{ fontSize: "0.78rem", color: "#888", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "1rem", fontWeight: "600" }}>🔥 Trending Keywords</div>
            {s.trending.length === 0 ? (
              <div style={{ color: "#bbb", fontSize: "0.8rem" }}>Run analysis to see trending keywords.</div>
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                {s.trending.map((item, i) => (
                  <span key={i} style={{ backgroundColor: "#E8F5E9", color: "#1B5E20", borderRadius: "20px", padding: "0.22rem 0.65rem", fontSize: "0.78rem", fontWeight: "600", border: "1px solid #A5D6A7" }}>
                    {item.label} <span style={{ opacity: 0.6 }}>×{item.count}</span>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Top customer requests */}
          <div style={{ flex: "1 1 260px", backgroundColor: "#fff", borderRadius: "10px", padding: "1.25rem", border: "1px solid #e8e8e8" }}>
            <div style={{ fontSize: "0.78rem", color: "#888", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "1rem", fontWeight: "600" }}>📦 Top Customer Requests</div>
            {s.topRequests.length === 0 ? (
              <div style={{ color: "#bbb", fontSize: "0.8rem" }}>Run analysis to see top requests.</div>
            ) : (
              <BarChart items={s.topRequests} color="#2E7D32" />
            )}
          </div>

          {/* Urgency bar chart */}
          <div style={{ flex: "1 1 220px", backgroundColor: "#fff", borderRadius: "10px", padding: "1.25rem", border: "1px solid #e8e8e8" }}>
            <div style={{ fontSize: "0.78rem", color: "#888", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "1rem", fontWeight: "600" }}>📬 Message Status</div>
            <BarChart
              items={[
                { label: "🔴 High urgency",  count: s.high },
                { label: "🟠 Medium urgency", count: s.medium },
                { label: "🟢 Low urgency",    count: s.low },
                { label: "✅ Resolved",        count: s.done },
                { label: "⏳ Pending",         count: s.pending },
              ]}
              color="#1B5E20"
            />
          </div>
        </div>

        {/* ── Row 4: Recent messages ── */}
        <div style={{ backgroundColor: "#fff", borderRadius: "10px", padding: "1.25rem", border: "1px solid #e8e8e8" }}>
          <div style={{ fontSize: "0.78rem", color: "#888", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "1rem", fontWeight: "600" }}>🕐 Recent Messages</div>
          {s.recent.length === 0 ? (
            <div style={{ color: "#bbb", fontSize: "0.8rem" }}>No messages yet.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
              {s.recent.map((m, i) => {
                const uColor = urgencyColor[m.urgency] || "#aaa";
                const sent   = m.analysis?.sentiment;
                const sColor = sentimentColor[sent] || "#aaa";
                return (
                  <div key={m.id} style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", padding: "0.65rem 0", borderBottom: i < s.recent.length - 1 ? "1px solid #f0f0f0" : "none" }}>
                    <div style={{ width: "7px", height: "7px", borderRadius: "50%", backgroundColor: uColor, marginTop: "5px", flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                        <span style={{ fontWeight: "600", fontSize: "0.85rem", color: "#1a1a1a" }}>{m.name || "Unknown"}</span>
                        <span style={{ fontSize: "0.68rem", color: "#bbb" }}>{formatDate(m.date)}</span>
                      </div>
                      <div style={{ fontSize: "0.78rem", color: "#888", marginTop: "2px", marginBottom: "3px" }}>{m.subject || m.email || "—"}</div>
                      <div style={{ fontSize: "0.8rem", color: "#555", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.message}</div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px", alignItems: "flex-end", flexShrink: 0 }}>
                      {m.urgency && (
                        <span style={{ fontSize: "0.65rem", fontWeight: "700", color: uColor, backgroundColor: uColor + "22", borderRadius: "10px", padding: "1px 7px" }}>{m.urgency}</span>
                      )}
                      {sent && (
                        <span style={{ fontSize: "0.65rem", fontWeight: "700", color: sColor, backgroundColor: sColor + "22", borderRadius: "10px", padding: "1px 7px" }}>{sent}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default Insights;

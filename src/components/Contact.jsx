import { useState } from "react";
import { db } from "../firebase";
import { collection, addDoc } from "firebase/firestore";

const INFO_ITEMS = [
  {
    icon: "📍",
    label: "Address",
    value: "Unique Fulbari Nursery, Nepal",
  },
  {
    icon: "📞",
    label: "Phone",
    value: "+977-9846263230",
    href: "tel:+9779846263230",
  },
  {
    icon: "✉️",
    label: "Email",
    value: "prabaladhakal@gmail.com",
    href: "mailto:prabaladhakal@gmail.com",
  },
  {
    icon: "🕗",
    label: "Business Hours",
    value: "Sun – Fri: 7:00 AM – 6:00 PM",
  },
];

const SUBJECTS = [
  "General Inquiry",
  "Plant Order",
  "Manure / Compost Supply",
  "Gardening Consultation",
  "Bulk / Wholesale Order",
  "Delivery Query",
  "Other",
];

function Contact() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [status, setStatus] = useState(null); // null | "sending" | "success" | "error"

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("sending");
    try {
      await addDoc(collection(db, "contactMessages"), {
        ...form,
        date: new Date().toISOString(),
      });
      setStatus("success");
      setForm({ name: "", email: "", phone: "", subject: "", message: "" });
    } catch (error) {
      console.error("Error submitting contact form:", error);
      setStatus("error");
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "0.6rem 0.85rem",
    borderRadius: "8px",
    border: "1px solid #c8e6c9",
    fontSize: "0.9rem",
    fontFamily: "inherit",
    backgroundColor: "#fff",
    outline: "none",
    boxSizing: "border-box",
    color: "#1a1a1a",
  };

  return (
    <section
      id="contact"
      style={{
        padding: "4rem 1.5rem",
        backgroundColor: "#F0F4F1",
        fontFamily: "'Segoe UI', sans-serif",
      }}
    >
      {/* Section heading */}
      <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
        <h2 style={{ color: "#1B5E20", fontSize: "2rem", margin: 0 }}>
          Get in Touch
        </h2>
        <p style={{ color: "#555", marginTop: "0.5rem", fontSize: "0.95rem" }}>
          Have a question about plants, orders, or services? We'd love to hear from you.
        </p>
      </div>

      <div
        style={{
          display: "flex",
          gap: "2rem",
          maxWidth: "900px",
          margin: "0 auto",
          flexWrap: "wrap",
          alignItems: "flex-start",
        }}
      >
        {/* ── Left: contact info ── */}
        <div
          style={{
            flex: "1 1 240px",
            backgroundColor: "#1B5E20",
            borderRadius: "12px",
            padding: "2rem 1.5rem",
            color: "white",
          }}
        >
          <h3 style={{ margin: "0 0 1.5rem", fontSize: "1.1rem", fontWeight: "700" }}>
            Contact Information
          </h3>

          {INFO_ITEMS.map((item) => (
            <div
              key={item.label}
              style={{ display: "flex", gap: "0.75rem", marginBottom: "1.2rem", alignItems: "flex-start" }}
            >
              <span style={{ fontSize: "1.1rem", marginTop: "1px" }}>{item.icon}</span>
              <div>
                <div style={{ fontSize: "0.7rem", opacity: 0.75, marginBottom: "2px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {item.label}
                </div>
                {item.href ? (
                  <a
                    href={item.href}
                    style={{ color: "#A5D6A7", fontSize: "0.88rem", textDecoration: "none", wordBreak: "break-all" }}
                  >
                    {item.value}
                  </a>
                ) : (
                  <div style={{ fontSize: "0.88rem" }}>{item.value}</div>
                )}
              </div>
            </div>
          ))}

          {/* Divider */}
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.2)", margin: "1.5rem 0" }} />

          <p style={{ fontSize: "0.8rem", opacity: 0.75, margin: 0, lineHeight: "1.6" }}>
            We deliver plants, manure, and accessories across Nepal. Wholesale and bulk orders welcome.
          </p>
        </div>

        {/* ── Right: contact form ── */}
        <div
          style={{
            flex: "2 1 340px",
            backgroundColor: "#fff",
            borderRadius: "12px",
            padding: "2rem 1.5rem",
            boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
          }}
        >
          {status === "success" ? (
            <div
              style={{
                textAlign: "center",
                padding: "2.5rem 1rem",
                color: "#1B5E20",
              }}
            >
              <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>✅</div>
              <h3 style={{ margin: "0 0 0.5rem", fontSize: "1.1rem" }}>Message Sent!</h3>
              <p style={{ color: "#555", fontSize: "0.88rem", margin: "0 0 1.5rem" }}>
                Thank you for reaching out. We'll get back to you within 24 hours.
              </p>
              <button
                onClick={() => setStatus(null)}
                style={{
                  backgroundColor: "#2E7D32",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  padding: "0.55rem 1.5rem",
                  fontSize: "0.88rem",
                  cursor: "pointer",
                }}
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <h3 style={{ margin: "0 0 0.25rem", color: "#1B5E20", fontSize: "1.05rem" }}>
                Send Us a Message
              </h3>

              {/* Name + Phone row */}
              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                <div style={{ flex: "1 1 140px" }}>
                  <label style={{ fontSize: "0.75rem", color: "#555", display: "block", marginBottom: "4px" }}>
                    Full Name <span style={{ color: "#c0392b" }}>*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Ram Bahadur"
                    required
                    style={inputStyle}
                  />
                </div>
                <div style={{ flex: "1 1 140px" }}>
                  <label style={{ fontSize: "0.75rem", color: "#555", display: "block", marginBottom: "4px" }}>
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="+977-98XXXXXXXX"
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label style={{ fontSize: "0.75rem", color: "#555", display: "block", marginBottom: "4px" }}>
                  Email Address <span style={{ color: "#c0392b" }}>*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  required
                  style={inputStyle}
                />
              </div>

              {/* Subject dropdown */}
              <div>
                <label style={{ fontSize: "0.75rem", color: "#555", display: "block", marginBottom: "4px" }}>
                  Subject <span style={{ color: "#c0392b" }}>*</span>
                </label>
                <select
                  name="subject"
                  value={form.subject}
                  onChange={handleChange}
                  required
                  style={{ ...inputStyle, appearance: "none", cursor: "pointer" }}
                >
                  <option value="" disabled>Select a subject…</option>
                  {SUBJECTS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Message */}
              <div>
                <label style={{ fontSize: "0.75rem", color: "#555", display: "block", marginBottom: "4px" }}>
                  Message <span style={{ color: "#c0392b" }}>*</span>
                </label>
                <textarea
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  placeholder="Tell us about your inquiry — plant type, quantity, location, etc."
                  required
                  rows={4}
                  style={{ ...inputStyle, resize: "vertical" }}
                />
              </div>

              {/* Error banner */}
              {status === "error" && (
                <div
                  style={{
                    backgroundColor: "#fdecea",
                    color: "#c0392b",
                    borderRadius: "8px",
                    padding: "0.6rem 0.85rem",
                    fontSize: "0.83rem",
                  }}
                >
                  ⚠️ Failed to send message. Please try again or email us directly at{" "}
                  <a href="mailto:prabaladhakal@gmail.com" style={{ color: "#c0392b" }}>
                    prabaladhakal@gmail.com
                  </a>
                </div>
              )}

              <button
                type="submit"
                disabled={status === "sending"}
                style={{
                  backgroundColor: status === "sending" ? "#81C784" : "#2E7D32",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  padding: "0.7rem",
                  fontSize: "0.92rem",
                  fontWeight: "600",
                  cursor: status === "sending" ? "default" : "pointer",
                  width: "100%",
                  fontFamily: "inherit",
                }}
              >
                {status === "sending" ? "Sending…" : "Send Message ➤"}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

export default Contact;

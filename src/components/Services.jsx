import { useState } from "react";

const SERVICES = [
  {
    icon: "🌸",
    title: "Plant Sales",
    subtitle: "Fresh from our nursery",
    description:
      "Hand-picked ornamental and flowering plants grown in-house. From roses and marigolds to seasonal varieties — healthy, vibrant, and ready for your garden or home.",
    features: [
      "Roses, dahlias, marigolds & more",
      "Seasonal and year-round varieties",
      "Indoor & outdoor plants",
      "Competitive, affordable prices",
    ],
    color: "#2E7D32",
    lightBg: "#E8F5E9",
    border: "#A5D6A7",
  },
  {
    icon: "🌱",
    title: "Organic Manure Supply",
    subtitle: "Sustainable soil enrichment",
    description:
      "Premium organic compost and manure sourced and processed for Nepal's climate. Improve soil fertility naturally and support long-term sustainable plant growth.",
    features: [
      "Certified organic compost",
      "Improves soil structure & fertility",
      "Safe for all plant types",
      "Bulk supply available",
    ],
    color: "#558B2F",
    lightBg: "#F1F8E9",
    border: "#C5E1A5",
  },
  {
    icon: "🧑‍🌾",
    title: "Gardening Consultation",
    subtitle: "Expert advice, personalised care",
    description:
      "Our experienced horticulturists offer one-on-one consultations for home gardens, commercial landscaping, and plant care. Get a custom plan that works for your space.",
    features: [
      "Personalised plant care plans",
      "Home & commercial garden design",
      "Pest & disease management",
      "Ongoing follow-up support",
    ],
    color: "#1565C0",
    lightBg: "#E3F2FD",
    border: "#90CAF9",
  },
  {
    icon: "🚚",
    title: "Delivery Across Nepal",
    subtitle: "Doorstep plant delivery",
    description:
      "We deliver fresh plants, manure, and accessories right to your door anywhere in Nepal. Careful packaging ensures your plants arrive healthy and ready to thrive.",
    features: [
      "Nationwide delivery service",
      "Safe & careful packaging",
      "Bulk order delivery",
      "Timely & reliable logistics",
    ],
    color: "#E65100",
    lightBg: "#FFF3E0",
    border: "#FFCC80",
  },
  {
    icon: "🎓",
    title: "Plant Care Workshops",
    subtitle: "Learn from the experts",
    description:
      "Join our seasonal workshops covering everything from seed sowing and composting to advanced floriculture techniques. Open to home gardeners and professionals alike.",
    features: [
      "Beginner to advanced levels",
      "Hands-on practical sessions",
      "Seasonal gardening tips",
      "Certificate of participation",
    ],
    color: "#6A1B9A",
    lightBg: "#F3E5F5",
    border: "#CE93D8",
  },
  {
    icon: "🏢",
    title: "Wholesale & Bulk Orders",
    subtitle: "For businesses & institutions",
    description:
      "Special pricing and dedicated account management for hotels, event planners, government projects, and large-scale landscapers. Contact us to discuss your requirements.",
    features: [
      "Discounted bulk pricing",
      "Dedicated account manager",
      "Custom order fulfilment",
      "Invoice & credit terms available",
    ],
    color: "#00695C",
    lightBg: "#E0F2F1",
    border: "#80CBC4",
  },
];

const STATS = [
  { value: "10+", label: "Years of Experience" },
  { value: "500+", label: "Happy Customers" },
  { value: "50+", label: "Plant Varieties" },
  { value: "77", label: "Districts Served" },
];

function ServiceCard({ service }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        backgroundColor: "#fff",
        borderRadius: "14px",
        border: `1px solid ${hovered ? service.border : "#e8e8e8"}`,
        padding: "1.75rem 1.5rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.85rem",
        transition: "box-shadow 0.2s, transform 0.2s, border-color 0.2s",
        boxShadow: hovered
          ? `0 8px 28px ${service.color}22`
          : "0 2px 8px rgba(0,0,0,0.05)",
        transform: hovered ? "translateY(-4px)" : "none",
      }}
    >
      {/* Icon + title */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <div
          style={{
            width: "48px", height: "48px", borderRadius: "12px",
            backgroundColor: service.lightBg,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "1.5rem", flexShrink: 0,
          }}
        >
          {service.icon}
        </div>
        <div>
          <div style={{ fontWeight: "700", fontSize: "1rem", color: "#1a1a1a" }}>
            {service.title}
          </div>
          <div style={{ fontSize: "0.72rem", color: service.color, fontWeight: "600", marginTop: "1px" }}>
            {service.subtitle}
          </div>
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: "1px", backgroundColor: "#f0f0f0" }} />

      {/* Description */}
      <p style={{ margin: 0, fontSize: "0.83rem", color: "#555", lineHeight: 1.65 }}>
        {service.description}
      </p>

      {/* Feature list */}
      <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "5px" }}>
        {service.features.map((f) => (
          <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: "6px", fontSize: "0.8rem", color: "#444" }}>
            <span style={{ color: service.color, fontWeight: "700", marginTop: "1px", flexShrink: 0 }}>✓</span>
            {f}
          </li>
        ))}
      </ul>

      {/* CTA */}
      <a
        href="#contact"
        style={{
          display: "block", textAlign: "center", marginTop: "auto",
          backgroundColor: hovered ? service.color : service.lightBg,
          color: hovered ? "white" : service.color,
          borderRadius: "8px", padding: "0.5rem",
          fontSize: "0.8rem", fontWeight: "600",
          textDecoration: "none",
          border: `1px solid ${service.border}`,
          transition: "background 0.2s, color 0.2s",
        }}
      >
        Learn More →
      </a>
    </div>
  );
}

function Services() {
  return (
    <section
      id="services"
      style={{
        padding: "5rem 1.5rem",
        backgroundColor: "#F0F4F1",
        fontFamily: "'Segoe UI', sans-serif",
      }}
    >
      {/* Section heading */}
      <div style={{ textAlign: "center", marginBottom: "3rem" }}>
        <div style={{ fontSize: "0.75rem", color: "#2E7D32", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.5rem" }}>
          What We Offer
        </div>
        <h2 style={{ color: "#1B5E20", fontSize: "2rem", margin: "0 0 0.6rem", lineHeight: 1.2 }}>
          Our Services
        </h2>
        <p style={{ color: "#666", fontSize: "0.95rem", maxWidth: "520px", margin: "0 auto", lineHeight: 1.6 }}>
          From plant sales and organic manure to expert consultation and nationwide delivery — everything your garden needs, in one place.
        </p>
      </div>

      {/* Stats strip */}
      <div style={{
        display: "flex", justifyContent: "center", flexWrap: "wrap",
        gap: "0", maxWidth: "700px", margin: "0 auto 3.5rem",
        backgroundColor: "#fff", borderRadius: "14px",
        border: "1px solid #e0ece0",
        boxShadow: "0 2px 12px rgba(46,125,50,0.08)",
        overflow: "hidden",
      }}>
        {STATS.map((stat, i) => (
          <div
            key={stat.label}
            style={{
              flex: "1 1 120px", textAlign: "center",
              padding: "1.25rem 1rem",
              borderRight: i < STATS.length - 1 ? "1px solid #e0ece0" : "none",
            }}
          >
            <div style={{ fontSize: "1.8rem", fontWeight: "800", color: "#1B5E20", lineHeight: 1 }}>
              {stat.value}
            </div>
            <div style={{ fontSize: "0.72rem", color: "#888", marginTop: "4px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Service cards grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        gap: "1.25rem",
        maxWidth: "1100px",
        margin: "0 auto",
      }}>
        {SERVICES.map((service) => (
          <ServiceCard key={service.title} service={service} />
        ))}
      </div>

      {/* Bottom CTA banner */}
      <div style={{
        marginTop: "3.5rem", maxWidth: "800px", margin: "3.5rem auto 0",
        backgroundColor: "#1B5E20", borderRadius: "16px",
        padding: "2rem 2rem",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: "1rem",
        color: "white",
      }}>
        <div>
          <div style={{ fontWeight: "700", fontSize: "1.1rem", marginBottom: "4px" }}>
            🌿 Ready to grow your garden?
          </div>
          <div style={{ fontSize: "0.85rem", opacity: 0.85 }}>
            Contact us today for a free consultation or to place an order.
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <a
            href="tel:+9779846263230"
            style={{
              backgroundColor: "rgba(255,255,255,0.15)", color: "white",
              border: "1px solid rgba(255,255,255,0.35)", borderRadius: "8px",
              padding: "0.55rem 1.25rem", fontSize: "0.85rem", fontWeight: "600",
              textDecoration: "none",
            }}
          >
            📞 Call Us
          </a>
          <a
            href="#contact"
            style={{
              backgroundColor: "#FBC02D", color: "#1B5E20",
              border: "none", borderRadius: "8px",
              padding: "0.55rem 1.5rem", fontSize: "0.85rem", fontWeight: "700",
              textDecoration: "none",
            }}
          >
            Get in Touch →
          </a>
        </div>
      </div>
    </section>
  );
}

export default Services;

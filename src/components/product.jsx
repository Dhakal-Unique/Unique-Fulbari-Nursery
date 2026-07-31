import { useState } from "react";
import rosePng     from "../assets/rose.png";
import marigoldPng from "../assets/marigold.png";
import daliaPng    from "../assets/dalia.png";
import sesionalJpg from "../assets/sesional.jpeg";
import heroPng     from "../assets/hero.png";

// ── Product catalogue ──────────────────────────────────────────────────────
const PRODUCTS = [
  {
    id: 1,
    category: "Flowers",
    name: "Rose",
    nepali: "गुलाफ",
    image: rosePng,
    description: "Vibrant, long-stemmed roses available in red, pink, white, and yellow varieties. Perfect for gardens, gifting, and ceremonies.",
    tags: ["Outdoor", "Fragrant", "Seasonal"],
    badge: "Best Seller",
    badgeColor: "#2E7D32",
  },
  {
    id: 2,
    category: "Flowers",
    name: "Marigold",
    nepali: "सयपत्री",
    image: marigoldPng,
    description: "Bright golden marigolds — Nepal's most loved flower for festivals, pujas, and garden borders. Low maintenance and long blooming.",
    tags: ["Festival", "Easy Care", "Outdoor"],
    badge: "Popular",
    badgeColor: "#E65100",
  },
  {
    id: 3,
    category: "Flowers",
    name: "Dahlia",
    nepali: "डेलिया",
    image: daliaPng,
    description: "Stunning dahlia blooms in a wide range of colours and sizes. A premium addition to any garden or floral arrangement.",
    tags: ["Premium", "Seasonal", "Ornamental"],
    badge: null,
    badgeColor: null,
  },
  {
    id: 4,
    category: "Flowers",
    name: "Seasonal Flowers",
    nepali: "मौसमी फूलहरू",
    image: sesionalJpg,
    description: "A curated selection of seasonal flowering plants that thrive in Nepal's climate. New varieties available each season.",
    tags: ["Seasonal", "Variety", "Outdoor"],
    badge: "New Arrivals",
    badgeColor: "#1565C0",
  },
  {
    id: 5,
    category: "Plants",
    name: "Ornamental Plants",
    nepali: "सजावटी बिरुवा",
    image: heroPng,
    description: "Beautiful ornamental plants for indoor and outdoor spaces. Enhance your home, office, or garden with lush greenery.",
    tags: ["Indoor", "Outdoor", "Decorative"],
    badge: null,
    badgeColor: null,
  },
  {
    id: 6,
    category: "Manure & Soil",
    name: "Organic Compost",
    nepali: "जैविक मल",
    image: null,
    description: "Premium organic compost and manure that enriches soil fertility, promotes healthy root growth, and supports sustainable gardening practices.",
    tags: ["Organic", "Eco-friendly", "Bulk Available"],
    badge: "Eco Pick",
    badgeColor: "#2E7D32",
  },
  {
    id: 7,
    category: "Accessories",
    name: "Pots & Planters",
    nepali: "गमला",
    image: null,
    description: "Wide range of clay, ceramic, and plastic pots in various sizes. Suitable for seedlings, flowering plants, and large outdoor trees.",
    tags: ["Clay", "Ceramic", "All Sizes"],
    badge: null,
    badgeColor: null,
  },
  {
    id: 8,
    category: "Accessories",
    name: "Soil Mixes & Tools",
    nepali: "माटो र औजार",
    image: null,
    description: "Ready-mix potting soil blended for Nepal's climate, plus essential gardening tools — trowels, pruners, watering cans, and more.",
    tags: ["Soil", "Tools", "Starter Kits"],
    badge: null,
    badgeColor: null,
  },
];

const CATEGORIES = ["All", "Flowers", "Plants", "Manure & Soil", "Accessories"];

const CATEGORY_ICONS = {
  Flowers:        "🌸",
  Plants:         "🌿",
  "Manure & Soil": "🌱",
  Accessories:    "🪴",
  All:            "✨",
};

// Fallback colour blocks for products without images
const FALLBACK_COLORS = {
  "Manure & Soil": "#E8F5E9",
  Accessories:     "#FFF8E1",
  Plants:          "#F1F8E9",
};
const FALLBACK_ICONS = {
  "Manure & Soil": "🌱",
  Accessories:     "🪴",
  Plants:          "🌿",
};

function ProductCard({ product }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        backgroundColor: "#fff",
        borderRadius: "14px",
        border: "1px solid #e8e8e8",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        transition: "box-shadow 0.2s, transform 0.2s",
        boxShadow: hovered ? "0 8px 28px rgba(46,125,50,0.15)" : "0 2px 8px rgba(0,0,0,0.06)",
        transform: hovered ? "translateY(-3px)" : "none",
        position: "relative",
      }}
    >
      {/* Badge */}
      {product.badge && (
        <div style={{
          position: "absolute", top: "10px", left: "10px", zIndex: 2,
          backgroundColor: product.badgeColor, color: "white",
          borderRadius: "20px", padding: "2px 10px",
          fontSize: "0.68rem", fontWeight: "700", letterSpacing: "0.03em",
        }}>
          {product.badge}
        </div>
      )}

      {/* Image / fallback */}
      <div style={{
        height: "190px", overflow: "hidden", backgroundColor: FALLBACK_COLORS[product.category] || "#F9FBF9",
        display: "flex", alignItems: "center", justifyContent: "center", position: "relative",
      }}>
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.3s", transform: hovered ? "scale(1.06)" : "scale(1)" }}
          />
        ) : (
          <span style={{ fontSize: "4rem", opacity: 0.5 }}>{FALLBACK_ICONS[product.category] || "🌿"}</span>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: "1rem 1.1rem", flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "4px" }}>
          <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: "700", color: "#1a1a1a" }}>{product.name}</h3>
          <span style={{ fontSize: "0.78rem", color: "#aaa", fontStyle: "italic" }}>{product.nepali}</span>
        </div>
        <p style={{ margin: "0 0 0.85rem", fontSize: "0.82rem", color: "#555", lineHeight: 1.6, flex: 1 }}>
          {product.description}
        </p>

        {/* Tags */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem", marginBottom: "0.9rem" }}>
          {product.tags.map((tag) => (
            <span key={tag} style={{
              backgroundColor: "#E8F5E9", color: "#2E7D32",
              borderRadius: "20px", padding: "2px 9px",
              fontSize: "0.68rem", fontWeight: "600", border: "1px solid #C8E6C9",
            }}>
              {tag}
            </span>
          ))}
        </div>

        {/* CTA */}
        <a
          href="#contact"
          style={{
            display: "block", textAlign: "center",
            backgroundColor: hovered ? "#1B5E20" : "#2E7D32",
            color: "white", borderRadius: "8px",
            padding: "0.5rem", fontSize: "0.82rem", fontWeight: "600",
            textDecoration: "none", transition: "background 0.2s",
          }}
        >
          Enquire Now
        </a>
      </div>
    </div>
  );
}

function Products() {
  const [activeCategory, setActiveCategory] = useState("All");

  const filtered = activeCategory === "All"
    ? PRODUCTS
    : PRODUCTS.filter((p) => p.category === activeCategory);

  return (
    <section
      id="products"
      style={{
        padding: "4rem 1.5rem",
        backgroundColor: "#FAFAF5",
        fontFamily: "'Segoe UI', sans-serif",
      }}
    >
      {/* Heading */}
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <h2 style={{ color: "#1B5E20", fontSize: "2rem", margin: "0 0 0.4rem" }}>
          Our Products
        </h2>
        <p style={{ color: "#666", fontSize: "0.95rem", margin: 0 }}>
          Explore our range of plants, flowers, organic manure, and gardening accessories
        </p>
      </div>

      {/* Category filter tabs */}
      <div style={{
        display: "flex", justifyContent: "center", flexWrap: "wrap",
        gap: "0.5rem", marginBottom: "2.5rem",
      }}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            style={{
              padding: "0.4rem 1rem",
              borderRadius: "20px",
              border: activeCategory === cat ? "none" : "1px solid #c8e6c9",
              backgroundColor: activeCategory === cat ? "#2E7D32" : "#fff",
              color: activeCategory === cat ? "white" : "#2E7D32",
              fontSize: "0.82rem", fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            {CATEGORY_ICONS[cat]} {cat}
          </button>
        ))}
      </div>

      {/* Product grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
        gap: "1.5rem",
        maxWidth: "1100px",
        margin: "0 auto",
      }}>
        {filtered.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {/* Bottom CTA */}
      <div style={{ textAlign: "center", marginTop: "3rem" }}>
        <p style={{ color: "#666", fontSize: "0.9rem", marginBottom: "0.75rem" }}>
          Looking for bulk orders or custom plant arrangements?
        </p>
        <a
          href="#contact"
          style={{
            display: "inline-block",
            backgroundColor: "#FBC02D", color: "#1B5E20",
            padding: "0.75rem 2rem", borderRadius: "50px",
            fontWeight: "700", fontSize: "0.95rem",
            textDecoration: "none", border: "none",
          }}
        >
          Contact Us for Wholesale →
        </a>
      </div>
    </section>
  );
}

export default Products;

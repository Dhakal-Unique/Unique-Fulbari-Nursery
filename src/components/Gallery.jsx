import { useState } from "react";
import rosePng     from "../assets/rose.png";
import daliaPng    from "../assets/dalia.png";
import marigoldPng from "../assets/marigold.png";
import sesionalJpg from "../assets/sesional.jpeg";
import heroPng     from "../assets/hero.png";

const IMAGES = [
  { src: rosePng,     alt: "Rose",             nepali: "गुलाफ",        tag: "Flowers" },
  { src: daliaPng,    alt: "Dahlia",            nepali: "डेलिया",       tag: "Flowers" },
  { src: marigoldPng, alt: "Marigold",          nepali: "सयपत्री",      tag: "Flowers" },
  { src: sesionalJpg, alt: "Seasonal Flowers",  nepali: "मौसमी फूल",   tag: "Seasonal" },
  { src: heroPng,     alt: "Nursery Garden",    nepali: "नर्सरी बगैंचा", tag: "Nursery" },
];

function Gallery() {
  const [lightbox, setLightbox] = useState(null); // index of open image

  const close = () => setLightbox(null);
  const prev  = (e) => { e.stopPropagation(); setLightbox((i) => (i - 1 + IMAGES.length) % IMAGES.length); };
  const next  = (e) => { e.stopPropagation(); setLightbox((i) => (i + 1) % IMAGES.length); };

  return (
    <section
      id="gallery"
      style={{
        padding: "4rem 1.5rem",
        backgroundColor: "#FAFAF5",
        fontFamily: "'Segoe UI', sans-serif",
      }}
    >
      {/* Heading */}
      <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
        <div style={{ fontSize: "0.75rem", color: "#2E7D32", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.5rem" }}>
          Our Garden
        </div>
        <h2 style={{ color: "#1B5E20", fontSize: "2rem", margin: "0 0 0.5rem" }}>
          Plant Gallery
        </h2>
        <p style={{ color: "#666", fontSize: "0.95rem", margin: 0 }}>
          A glimpse of the flowers and plants grown at Unique Fulbari Nursery
        </p>
      </div>

      {/* Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
        gap: "1rem",
        maxWidth: "1100px",
        margin: "0 auto",
      }}>
        {IMAGES.map((img, i) => (
          <GalleryCard
            key={img.alt}
            img={img}
            featured={i === 0}
            onClick={() => setLightbox(i)}
          />
        ))}
      </div>

      {/* Lightbox */}
      {lightbox !== null && (
        <div
          onClick={close}
          style={{
            position: "fixed", inset: 0, zIndex: 1000,
            backgroundColor: "rgba(0,0,0,0.88)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          {/* Prev */}
          <button
            onClick={prev}
            style={{
              position: "absolute", left: "1.25rem",
              background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.25)",
              color: "white", borderRadius: "50%", width: "44px", height: "44px",
              fontSize: "1.2rem", cursor: "pointer", zIndex: 1001,
            }}
          >‹</button>

          {/* Image */}
          <div onClick={(e) => e.stopPropagation()} style={{ textAlign: "center", maxWidth: "90vw" }}>
            <img
              src={IMAGES[lightbox].src}
              alt={IMAGES[lightbox].alt}
              style={{ maxWidth: "80vw", maxHeight: "75vh", borderRadius: "12px", objectFit: "contain" }}
            />
            <div style={{ marginTop: "0.85rem" }}>
              <div style={{ color: "white", fontWeight: "700", fontSize: "1.05rem" }}>
                {IMAGES[lightbox].alt}
              </div>
              <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.85rem", marginTop: "2px" }}>
                {IMAGES[lightbox].nepali} · {IMAGES[lightbox].tag}
              </div>
            </div>
          </div>

          {/* Next */}
          <button
            onClick={next}
            style={{
              position: "absolute", right: "1.25rem",
              background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.25)",
              color: "white", borderRadius: "50%", width: "44px", height: "44px",
              fontSize: "1.2rem", cursor: "pointer", zIndex: 1001,
            }}
          >›</button>

          {/* Close */}
          <button
            onClick={close}
            style={{
              position: "absolute", top: "1.25rem", right: "1.25rem",
              background: "rgba(255,255,255,0.12)", border: "none",
              color: "white", borderRadius: "50%", width: "36px", height: "36px",
              fontSize: "1rem", cursor: "pointer", zIndex: 1001,
            }}
          >✕</button>

          {/* Dots */}
          <div style={{ position: "absolute", bottom: "1.5rem", display: "flex", gap: "6px" }}>
            {IMAGES.map((_, i) => (
              <div
                key={i}
                onClick={(e) => { e.stopPropagation(); setLightbox(i); }}
                style={{
                  width: i === lightbox ? "20px" : "7px", height: "7px",
                  borderRadius: "20px", cursor: "pointer",
                  backgroundColor: i === lightbox ? "white" : "rgba(255,255,255,0.35)",
                  transition: "width 0.2s",
                }}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function GalleryCard({ img, featured, onClick }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderRadius: "12px",
        overflow: "hidden",
        cursor: "pointer",
        position: "relative",
        gridColumn: featured ? "span 2" : "span 1",
        height: featured ? "320px" : "220px",
        boxShadow: hovered ? "0 8px 24px rgba(0,0,0,0.18)" : "0 2px 8px rgba(0,0,0,0.08)",
        transition: "box-shadow 0.2s",
      }}
    >
      <img
        src={img.src}
        alt={img.alt}
        style={{
          width: "100%", height: "100%", objectFit: "cover",
          transform: hovered ? "scale(1.06)" : "scale(1)",
          transition: "transform 0.35s",
          display: "block",
        }}
      />

      {/* Overlay on hover */}
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(to top, rgba(27,94,32,0.75) 0%, transparent 55%)",
        opacity: hovered ? 1 : 0.55,
        transition: "opacity 0.25s",
      }} />

      {/* Tag chip */}
      <div style={{
        position: "absolute", top: "10px", right: "10px",
        backgroundColor: "rgba(255,255,255,0.18)",
        backdropFilter: "blur(4px)",
        border: "1px solid rgba(255,255,255,0.3)",
        color: "white", borderRadius: "20px",
        padding: "2px 10px", fontSize: "0.68rem", fontWeight: "600",
      }}>
        {img.tag}
      </div>

      {/* Caption */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        padding: "0.85rem 1rem",
        transform: hovered ? "translateY(0)" : "translateY(4px)",
        transition: "transform 0.25s",
      }}>
        <div style={{ color: "white", fontWeight: "700", fontSize: "0.95rem", lineHeight: 1.2 }}>
          {img.alt}
        </div>
        <div style={{ color: "rgba(255,255,255,0.75)", fontSize: "0.75rem", marginTop: "2px" }}>
          {img.nepali}
        </div>
        <div style={{
          display: "inline-block", marginTop: "6px",
          backgroundColor: "rgba(255,255,255,0.2)", color: "white",
          borderRadius: "6px", padding: "2px 8px", fontSize: "0.68rem",
          opacity: hovered ? 1 : 0, transition: "opacity 0.2s",
        }}>
          Click to enlarge
        </div>
      </div>
    </div>
  );
}

export default Gallery;

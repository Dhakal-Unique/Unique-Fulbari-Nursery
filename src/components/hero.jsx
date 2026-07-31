function Hero() {

  return (
    <section
      style={{
        backgroundImage: "url('https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=1600&q=80')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        color: "white",
        padding: "6rem 2rem",
        textAlign: "center",
        position: "relative",
      }}
    >
      {/* Overlay for readability */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundColor: "rgba(46, 125, 50, 0.7)",
          zIndex: 0,
        }}
      ></div>

      <div style={{ position: "relative", zIndex: 1 }}>
        <h1  style={{
    fontSize: "clamp(2rem, 5vw, 3rem)", // scales between 2rem and 3rem depending on screen width
    fontWeight: "700",
    marginBottom: "1rem",
    lineHeight: "1.2", // tighter spacing
  }}
>  Unique Fulbari Nursery 
        </h1>
        <p style={{ fontSize: "1.25rem", maxWidth: "600px", margin: "0 auto 2rem", lineHeight: "1.6" }}>
          Floriculture at its finest nurturing plants, organic manure, and sustainable growth for a greener tomorrow.
        </p>
        <button
          onClick={() =>
            document.getElementById("products").scrollIntoView({ behavior: "smooth" })
          }
          style={{
            backgroundColor: "#FBC02D",
            color: "#2E7D32",
            padding: "1rem 2.5rem",
            border: "none",
            borderRadius: "50px",
            fontSize: "1rem",
            fontWeight: "600",
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
            transition: "all 0.3s ease",
          }}
          onMouseOver={(e) => (e.target.style.backgroundColor = "#FDD835")}
          onMouseOut={(e) => (e.target.style.backgroundColor = "#FBC02D")}
        >
          Explore Our Products
        </button>
      </div>
    </section>
  );
}

export default Hero;


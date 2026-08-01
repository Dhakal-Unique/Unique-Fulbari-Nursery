import Hero from "./components/Hero";
import Products from "./components/Product";
import Services from "./components/Services";
import Contact from "./components/Contact";
import Footer from "./components/Footer";
import ChatBot from "./components/ChatBot";
import Gallery from "./components/Gallery";

import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./components/pages/Dashboard";
import Messages from "./components/pages/Messages";
import Statistics from "./components/pages/Statistics";
import Insights from "./components/pages/Insights";
import Urgency from "./components/pages/Urgency";

function Home() {
  return (
    <div style={{ fontFamily: "sans-serif", textAlign: "center", backgroundColor: "#FAFAF5", minHeight: "100vh" }}>
      <header style={{ backgroundColor: "#2E7D32", padding: "1rem", color: "white" }}>
        <h1>Unique Fulbari Nursery</h1>

        <nav>
          <a href="#gallery" style={{ margin: "0 1rem", color: "white"}}>Gallery</a>
          <a href="#products" style={{ margin: "0 1rem", color: "white" }}>Products</a>
          <a href="#services" style={{ margin: "0 1rem", color: "white" }}>Services</a>
          <a href="#contact" style={{ margin: "0 1rem", color: "white" }}>Contact</a>
        </nav>
      </header>

      <Hero />
      <Gallery />
      <Products />
      <Services />
      <Contact />
      <ChatBot />
      <Footer />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
         <Route path="/messages" element={<Messages />} />
        <Route path="/statistics" element={<Statistics />} />
        <Route path="/insights" element={<Insights />} />
        <Route path="/urgency" element={<Urgency />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;


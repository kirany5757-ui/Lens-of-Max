"use client";

import { useState, useEffect } from "react";

const menuCategories = [
  {
    id: "breakfast",
    name: "Breakfast & Mornings",
    items: [
      { name: "Small Breakfast", desc: "Egg, Bacon, Sausage, Toast, Tea/Coffee", price: 3.90 },
      { name: "Full Monty", desc: "Egg, Bacon, Sausage, Mushrooms, Tomatoes, Beans, Toast, Drink", price: 5.50 },
      { name: "Mega Monty", desc: "Double portions + Drink", price: 7.00 },
      { name: "Veggie Breakfast", desc: "", price: 4.50 },
      { name: "2 Fried Eggs or Scrambled on Toast", desc: "", price: 2.30 },
    ],
  },
  {
    id: "mains",
    name: "Hot Meals & Portuguese Specials",
    items: [
      { name: "Prego", desc: "Tender Sirloin Steak, Tomatoes, Lettuce in a roll", price: 4.00 },
      { name: "Prego Special", desc: "Steak, Ham, Cheese, Egg, Tomatoes, Lettuce", price: 5.00 },
      { name: "Bifana", desc: "Tender Pork Steak, Tomatoes, Lettuce", price: 4.00 },
      { name: "Bifana Special", desc: "Pork Steak, Ham, Cheese, Egg, Tomatoes", price: 5.00 },
      { name: "Bitoque", desc: "Sirloin or Pork Steak with Egg, Rice and Salad", price: 7.00 },
    ],
  },
  {
    id: "sandwiches",
    name: "Toasties & Hot Sandwiches",
    items: [
      { name: "Cheese & Tomato Toastie", desc: "", price: 2.65 },
      { name: "Ham & Cheese Toastie", desc: "", price: 3.10 },
      { name: "Bacon Hot Sandwich", desc: "", price: 2.20 },
      { name: "Sausage & Egg Hot Sandwich", desc: "", price: 2.90 },
      { name: "Chicken Escalope Sandwich", desc: "", price: 4.20 },
    ],
  },
];

const formatPrice = (price: number) => {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(price);
};

export default function CafeHome() {
  const [showIntro, setShowIntro] = useState(true);
  const [openCategory, setOpenCategory] = useState("breakfast");

  useEffect(() => {
    const timer = setTimeout(() => setShowIntro(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  const toggleCategory = (id: string) => {
    setOpenCategory(openCategory === id ? "" : id);
  };

  return (
    <>
      {/* Google LocalBusiness JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CafeOrCoffeeShop",
            "name": "Tia Maria Café",
            "image": "https://tiamariacafe.co.uk/image.jpeg",
            "url": "https://tiamariacafe.co.uk",
            "telephone": "+441932569192",
            "priceRange": "£",
            "address": {
              "@type": "PostalAddress",
              "streetAddress": "68 Guildford St",
              "addressLocality": "Chertsey",
              "postalCode": "KT16 9BB",
              "addressCountry": "GB"
            },
            "openingHoursSpecification": [
              {
                "@type": "OpeningHoursSpecification",
                "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
                "opens": "07:00",
                "closes": "16:00"
              },
              {
                "@type": "OpeningHoursSpecification",
                "dayOfWeek": "Saturday",
                "opens": "08:00",
                "closes": "16:00"
              },
              {
                "@type": "OpeningHoursSpecification",
                "dayOfWeek": "Sunday",
                "opens": "00:00",
                "closes": "00:00",
                "validFrom": "2026-01-01",
                "validThrough": "2026-12-31"
              }
            ]
          }),
        }}
      />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600&family=Playfair+Display:ital,wght@0,400;0,600;1,400&display=swap');        
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        
        body {
          background: #f4f1eb;
          color: #1a1a1a;
          font-family: 'Plus Jakarta Sans', sans-serif;
          min-height: 100vh;
        }

        /* ── INTRO LOADER (Fluid & Responsive via Friend's Math) ── */
        .intro-overlay {
          position: fixed;
          inset: 0;
          background: #f4f1eb; 
          z-index: 9999;
          display: flex;
          justify-content: center;
          align-items: center;
          transition: opacity 0.5s ease-in-out;
        }
        .intro-overlay.hidden {
          opacity: 0;
          pointer-events: none;
        }

        .physical-sign-board {
          position: relative;
          background: #c2e1ed; 
          padding: clamp(16px, 4vw, 40px) clamp(16px, 6vw, 80px);
          width: 92%;
          max-width: 800px;
          display: flex;
          justify-content: center;
          align-items: center;
          border-radius: 2px;
          box-shadow: 12px 12px 0px rgba(26, 26, 26, 0.1), inset 0 0 0 1px #a4c9d6; 
          opacity: 0;
          animation: signatureFade 2.5s forwards;
        }

        .signature-text {
          font-family: 'Playfair Display', serif;
          font-size: clamp(15px, 6vw, 56px);
          font-weight: 700;
          color: #16242c; 
          text-transform: uppercase;
          letter-spacing: clamp(0.5px, 0.6vw, 6px);
          z-index: 5;
          position: relative;
          text-align: center;
          white-space: nowrap;
          text-shadow: 1px 1px 0px rgba(255,255,255,0.6);
        }

        @keyframes signatureFade {
          0% { opacity: 0; transform: translateY(10px); }
          20% { opacity: 1; transform: translateY(0); }
          100% { opacity: 1; transform: translateY(0); }
        }

        /* ── MOBILE-OPTIMIZED HEADER ── */
        .cafe-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 2px solid #1a1a1a;
          background: #f4f1eb;
          position: sticky;
          top: 0;
          z-index: 10;
        }
        .cafe-logo {
          font-family: 'Playfair Display', serif;
          font-size: 18px;
          font-weight: 600;
          color: #1a1a1a;
        }
        .header-actions {
          display: flex;
          gap: 8px;
          align-items: center;
        }
        .call-btn {
          background: #31c4f3;
          color: #1a1a1a;
          padding: 6px 12px;
          border-radius: 20px;
          text-decoration: none;
          font-size: 11px;
          font-weight: 600;
          border: 1px solid #1a1a1a;
          white-space: nowrap;
          text-transform: uppercase;
          transition: all 0.2s;
        }
        .call-btn.deliveroo {
          background: #00CDBC;
          color: #fff;
          border-color: #00CDBC;
        }
        .call-btn:hover { 
          opacity: 0.9; 
        }

        @media (min-width: 768px) {
          .cafe-header { padding: 24px 40px; }
          .cafe-logo { font-size: 24px; }
          .call-btn { padding: 10px 20px; font-size: 14px; }
          .header-actions { gap: 12px; }
        }

        /* ── FULL SCREEN HERO SECTION ── */
        .hero {
          background-image: 
            linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.6)),
            url('/image_5b3749.jpg'); 
          background-size: cover;
          background-position: center;
          min-height: calc(100vh - 80px); 
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
          padding: 20px;
        }
        
        .hero-title {
          font-family: 'Playfair Display', serif;
          font-size: clamp(36px, 7vw, 72px);
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 24px;
          text-shadow: 2px 2px 8px rgba(0,0,0,0.5);
        }

        .hero-title::before {
          content: "“";
        }
        .hero-title::after {
          content: "”";
        }
        
        .hero-subtitle {
          font-size: 18px;
          color: #f4f1eb;
          line-height: 1.6;
          max-width: 600px;
          margin-bottom: 40px;
          font-weight: 500;
          text-shadow: 1px 1px 4px rgba(0,0,0,0.5);
        }

        .hero-cta {
          background: #ffffff;
          color: #1a1a1a;
          padding: 14px 36px;
          font-size: 14px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 2px;
          text-decoration: none;
          border: none;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .hero-cta:hover {
          background: #31c4f3;
          color: #1a1a1a;
        }

        /* ── SPLIT LAYOUT MENU ── */
        .menu-wrapper {
          max-width: 1200px;
          margin: 0 auto;
          padding: 60px 20px 120px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 60px;
          align-items: start;
        }
        
        @media (max-width: 768px) {
          .menu-wrapper {
            grid-template-columns: 1fr;
            padding: 40px 16px 80px;
            gap: 40px;
          }
          .menu-image-container {
            display: none;
          }
        }

        .massive-menu-title {
          font-family: 'Playfair Display', serif;
          font-size: clamp(50px, 10vw, 120px);
          font-weight: 400;
          color: #31c4f3;
          text-align: left;
          line-height: 0.8;
          margin-bottom: 40px;
          text-transform: uppercase;
        }

        .menu-image-container {
          position: sticky;
          top: 120px; 
        }

        .menu-side-image {
          width: 100%;
          height: 650px; 
          border: 2px solid #1a1a1a;
          box-shadow: 8px 8px 0px #1a1a1a;
          object-fit: cover; 
          border-radius: 4px; 
        }
        
        .accordion-item {
          border: 2px solid #1a1a1a;
          margin-bottom: 12px;
          background: #ffffff; 
          overflow: hidden;
          box-shadow: 4px 4px 0px #1a1a1a;
        }
        .accordion-header {
          width: 100%;
          padding: 20px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: transparent;
          border: none;
          color: #1a1a1a;
          font-family: 'Playfair Display', serif;
          font-size: 20px;
          text-transform: uppercase;
          cursor: pointer;
          font-weight: 600;
        }
        .accordion-icon {
          font-weight: 400;
          font-size: 24px;
          color: #31c4f3;
        }
        .accordion-content {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.4s ease-in-out;
          background: #ffffff;
        }
        .accordion-item.open .accordion-content {
          max-height: 1000px; 
        }
        .menu-item {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          padding: 18px 24px;
          border-top: 1px solid #e0e0e0;
        }
        .item-name {
          font-size: 15px;
          color: #1a1a1a;
          font-weight: 500;
          padding-right: 20px;
        }
        .item-price {
          font-family: 'Playfair Display', serif;
          font-size: 17px;
          color: #1a1a1a;
          font-weight: 600;
          white-space: nowrap;
        }
        
        /* ── EDITORIAL FOOTER ── */
        .footer {
          background: #1a1a1a;
          color: #f4f1eb;
          padding: 60px 20px 40px;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 40px;
          max-width: 1200px;
          margin: 0 auto;
        }
        
        .footer-wrapper {
          background: #1a1a1a;
          border-top: 4px solid #31c4f3;
        }

        .footer-col h3 {
          font-family: 'Playfair Display', serif;
          font-size: 18px;
          color: #31c4f3;
          margin-bottom: 16px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .footer-col p {
          font-size: 14px;
          line-height: 1.8;
          color: #c4c1bc;
          margin-bottom: 10px;
        }

        .footer-bottom {
          text-align: center;
          padding: 20px;
          background: #111111;
          color: #777;
          font-size: 12px;
        }
      `}</style>

      {/* ── INTRO LOADER ── */}
      <div className={`intro-overlay ${!showIntro ? "hidden" : ""}`}>
        <div className="physical-sign-board">
          <h2 className="signature-text">TIA MARIA CAFÉ</h2>
        </div>
      </div>

      {/* ── HEADER ── */}
      <header className="cafe-header">
        <span className="cafe-logo">Tia Maria Café</span>
        <div className="header-actions">
          <a 
            href="https://deliveroo.co.uk" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="call-btn deliveroo"
          >
            Order
          </a>
          <a href="tel:+441932569192" className="call-btn">
            Call
          </a>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="hero">
        <h1 className="hero-title">A Slice of Madeira in Chertsey</h1>
        <p className="hero-subtitle">
          Hearty food and warm smiles. Your cozy local spot for proper morning breakfasts, 
          freshly toasted sandwiches, and authentic Portuguese specialties.
        </p>
        <button 
          className="hero-cta"
          onClick={() => {
            document.querySelector('.menu-wrapper')?.scrollIntoView({ behavior: 'smooth' });
          }}
        >
          View Menu
        </button>
      </section>

      {/* ── MENU ── */}
      <section className="menu-wrapper">
        <div className="menu-left">
          <h2 className="massive-menu-title">Menu</h2>
          
          {menuCategories.map((cat) => {
            const isOpen = openCategory === cat.id;
            return (
              <div key={cat.id} className={`accordion-item ${isOpen ? "open" : ""}`}>
                <button 
                  className="accordion-header" 
                  onClick={() => toggleCategory(cat.id)}
                  aria-expanded={isOpen}
                  aria-controls={`panel-${cat.id}`}
                >
                  {cat.name}
                  <span className="accordion-icon" aria-hidden="true">{isOpen ? "−" : "+"}</span>
                </button>
                <div id={`panel-${cat.id}`} className="accordion-content" role="region">
                  {cat.items.map((item) => (
                    <div key={item.name} className="menu-item">
                      <div>
                        <div className="item-name">{item.name}</div>
                        {item.desc && <div style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>{item.desc}</div>}
                      </div>
                      <span className="item-price">{formatPrice(item.price)}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="menu-image-container">
          <img 
            src="/image.jpeg" 
            alt="Tia Maria Cafe Spread" 
            className="menu-side-image" 
            loading="lazy"
          />
        </div>
      </section>

      {/* ── FOOTER ── */}
      <div className="footer-wrapper">
        <footer className="footer">
          <div className="footer-col">
            <h3>Tia Maria Café</h3>
            <p>Sandwich, Patisserie & Coffee Bar.<br/><em>Seating available upstairs • Walk-ins welcome</em></p>
          </div>
          
          <div className="footer-col">
            <h3>Find Us</h3>
            <p>
              68 Guildford St<br/>
              Chertsey KT16 9BB<br/>
              United Kingdom
            </p>
            <p style={{ marginTop: '12px' }}>
              <a 
                href="https://maps.google.com/?q=68+Guildford+St,+Chertsey+KT16+9BB" 
                target="_blank" 
                rel="noopener noreferrer" 
                style={{ color: '#31c4f3', textDecoration: 'none', borderBottom: '1px solid #31c4f3' }}
              >
                Get Directions →
              </a>
            </p>
          </div>

          <div className="footer-col">
            <h3>Opening Hours</h3>
            <p>
              <strong style={{ color: '#f4f1eb' }}>Mon - Fri:</strong> 7:00 AM - 4:00 PM<br/>
              <strong style={{ color: '#f4f1eb' }}>Saturday:</strong> 8:00 AM - 4:00 PM<br/>
              <strong style={{ color: '#f4f1eb' }}>Sunday:</strong> Closed
            </p>
          </div>
        </footer>
        
        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} Tia Maria Café. All rights reserved.</p>
        </div>
      </div>
    </>
  );
}
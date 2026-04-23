"use client";

import { useState, useEffect } from "react";

const photos = [
  { id: 1, image: "https://images.unsplash.com/photo-1502877338535-766e1452684a?w=800", story: "I noticed this car while walking. Something about it felt calm.", tags: ["car", "street"] },
  { id: 2, image: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800", story: "Work day. People moving fast but I felt still.", tags: ["work", "people", "indoor"] },
  { id: 3, image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800", story: "Coffee moment. Quiet, warm, and slow.", tags: ["coffee", "latte"] },
  { id: 4, image: "https://images.unsplash.com/photo-1492724441997-5dc865305da7?w=800", story: "Late night street. Lights felt softer than usual.", tags: ["night", "street"] },
  { id: 5, image: "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?w=800", story: "Train window reflections. Everything moving, but I felt still.", tags: ["train", "reflection"] },
  { id: 6, image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800", story: "Clouds rolling in. Quiet before the rain.", tags: ["sky", "weather"] },
  { id: 7, image: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800", story: "Cold morning. Coffee tasted better than usual.", tags: ["coffee", "morning"] },
  { id: 8, image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800", story: "Waves repeating. Calming pattern.", tags: ["water", "beach"] },
  { id: 9, image: "https://images.unsplash.com/photo-1495567720989-cebdbdd97913?w=800", story: "Crosswalk moment. Everyone passing by.", tags: ["people", "street", "sun"] },
  { id: 10, image: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800", story: "Mountains far away. Felt small but peaceful.", tags: ["nature", "mountain"] },
  { id: 11, image: "https://images.unsplash.com/photo-1499084732479-de2c02d45fc4?w=800", story: "Books and silence. Time slowed down.", tags: ["indoor", "quiet"] },
  { id: 12, image: "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=800", story: "Road ahead. Didn't know where it leads.", tags: ["road", "travel"] },
  { id: 13, image: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=800", story: "Wide horizon, endless view.", tags: ["landscape", "wide"] },
  { id: 14, image: "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=800", story: "Water stretching endlessly.", tags: ["water", "wide"] },
  { id: 15, image: "https://images.unsplash.com/photo-1520975922323-5f1c1d0c3c8b?w=800", story: "Tall building stretching into the sky.", tags: ["architecture", "city"] },
  { id: 16, image: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800", story: "City lights bleeding into the night.", tags: ["city", "night"] },
  { id: 17, image: "https://images.unsplash.com/photo-1504701954957-2010ec3bcec1?w=800", story: "Minimal calm moment.", tags: ["minimal", "calm"] },
  { id: 18, image: "https://images.unsplash.com/photo-1444080748397-f442aa95c3e5?w=800", story: "Stars above. Everything else quiet.", tags: ["sky", "night"] },
];

type Photo = {
  id: number;
  image: string;
  story: string;
  tags: string[];
  aspect: number;
};

const aspects = [1.3, 0.7, 1.0, 1.5, 0.75, 1.2, 0.8, 0.65, 1.35, 1.1, 0.9, 1.4, 0.6, 1.0, 1.6, 0.72, 1.25, 0.85];
const photosWithAspect: Photo[] = photos.map((p, i) => ({ ...p, aspect: aspects[i] }));
const allTags = [...new Set(photos.flatMap((p) => p.tags))].sort();

function buildColumns(items: Photo[], numCols: number): Photo[][] {
  const cols: Photo[][] = Array.from({ length: numCols }, () => []);
  const heights = Array(numCols).fill(0);
  items.forEach((item) => {
    const shortest = heights.indexOf(Math.min(...heights));
    cols[shortest].push(item);
    heights[shortest] += item.aspect;
  });
  return cols;
}

function useNumCols(): number {
  const [cols, setCols] = useState(3);
  useEffect(() => {
    const update = () => {
      if (window.innerWidth < 560) setCols(2);
      else if (window.innerWidth < 900) setCols(3);
      else setCols(4);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return cols;
}

export default function Home() {
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const numCols = useNumCols();

  useEffect(() => { setTimeout(() => setLoaded(true), 100); }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const filtered = photosWithAspect.filter((photo) => {
    const matchSearch = search === "" || photo.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
    const matchTag = !activeTag || photo.tags.includes(activeTag);
    return matchSearch && matchTag;
  });

  const columns = buildColumns(filtered, numCols);

  const handleTagClick = (tag: string) => {
    setActiveTag(activeTag === tag ? null : tag);
    setSearch("");
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Inconsolata:wght@300;400&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body {
          background: #0a0a09;
          color: #e8e4dc;
          font-family: 'Inconsolata', monospace;
          min-height: 100vh;
        }

        .page { opacity: 0; transition: opacity 0.8s ease; }
        .page.visible { opacity: 1; }

        .site-header {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 50;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: transparent;
          transition: background 0.5s ease, backdrop-filter 0.5s ease, border-color 0.5s ease;
          border-bottom: 1px solid transparent;
          padding: 0 24px;
          pointer-events: none;
        }
        .site-header.scrolled {
          background: rgba(10,10,9,0.94);
          backdrop-filter: blur(16px);
          border-color: #1a1a1a;
          pointer-events: all;
        }

        .hero-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          text-align: center;
          padding: 60px 24px 100px;
          transition: min-height 0.5s ease, padding 0.5s ease;
          pointer-events: all;
        }
        .site-header.scrolled .hero-content {
          min-height: 64px;
          padding: 0 24px;
          flex-direction: row;
          justify-content: space-between;
          gap: 24px;
        }

        .hero-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(80px, 18vw, 180px);
          font-weight: 300;
          line-height: 0.88;
          letter-spacing: -0.03em;
          color: #e8e4dc;
          transition: font-size 0.5s ease, margin 0.5s ease;
          margin-bottom: 20px;
        }
        .site-header.scrolled .hero-title {
          font-size: 22px;
          margin-bottom: 0;
          letter-spacing: 0.02em;
        }

        .hero-eyebrow {
          font-size: 10px;
          letter-spacing: 0.35em;
          text-transform: uppercase;
          color: #444;
          margin-bottom: 20px;
          transition: opacity 0.3s ease, max-height 0.4s ease;
          overflow: hidden;
          max-height: 40px;
        }
        .site-header.scrolled .hero-eyebrow { opacity: 0; max-height: 0; margin: 0; }

        .hero-subtitle {
          font-family: 'Cormorant Garamond', serif;
          font-style: italic;
          font-size: 18px;
          color: #444;
          margin-bottom: 52px;
          transition: opacity 0.3s ease, max-height 0.4s ease;
          overflow: hidden;
          max-height: 40px;
        }
        .site-header.scrolled .hero-subtitle { opacity: 0; max-height: 0; margin: 0; }

        .search-wrap {
          position: relative;
          width: 100%;
          max-width: 400px;
          margin-bottom: 28px;
          transition: max-width 0.5s ease, margin 0.5s ease;
          flex-shrink: 0;
        }
        .site-header.scrolled .search-wrap { max-width: 220px; margin-bottom: 0; }

        .search-label {
          position: absolute;
          left: 0; top: 50%;
          transform: translateY(-50%);
          font-size: 10px;
          letter-spacing: 0.3em;
          color: #383838;
          text-transform: uppercase;
          pointer-events: none;
          transition: opacity 0.3s ease;
        }
        .site-header.scrolled .search-label { opacity: 0; }

        .search-input {
          background: transparent;
          border: none;
          border-bottom: 1px solid #222;
          width: 100%;
          padding: 14px 0 14px 72px;
          font-family: 'Inconsolata', monospace;
          font-size: 16px;
          color: #e8e4dc;
          outline: none;
          transition: font-size 0.4s ease, padding 0.4s ease, border-color 0.2s ease;
        }
        .site-header.scrolled .search-input { font-size: 12px; padding: 6px 0; }
        .search-input:focus { border-color: #555; }
        .search-input::placeholder { color: #2e2e2e; }

        .hero-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          justify-content: center;
          max-width: 560px;
          transition: opacity 0.3s ease, max-height 0.5s ease;
          max-height: 200px;
          overflow: hidden;
        }
        .site-header.scrolled .hero-tags { opacity: 0; max-height: 0; pointer-events: none; }

        .tag-btn {
          background: transparent;
          border: 1px solid #1e1e1e;
          color: #484848;
          padding: 4px 14px;
          font-family: 'Inconsolata', monospace;
          font-size: 11px;
          letter-spacing: 0.1em;
          cursor: pointer;
          transition: all 0.2s;
        }
        .tag-btn:hover { border-color: #444; color: #999; }
        .tag-btn.active { border-color: #e8e4dc; color: #e8e4dc; }

        .scroll-hint {
          position: fixed;
          bottom: 28px; left: 50%;
          transform: translateX(-50%);
          font-size: 9px;
          letter-spacing: 0.3em;
          color: #2e2e2e;
          text-transform: uppercase;
          white-space: nowrap;
          animation: pulse 2.8s ease-in-out infinite;
          transition: opacity 0.4s ease;
          pointer-events: none;
        }
        .scroll-hint.hidden { opacity: 0; }
        @keyframes pulse { 0%,100%{opacity:0.3} 50%{opacity:0.8} }

        .gallery-section {
          max-width: 1400px;
          margin: 0 auto;
          padding: 100vh 12px 120px;
        }
        .counter {
          font-size: 10px;
          letter-spacing: 0.2em;
          color: #2e2e2e;
          text-align: center;
          margin-bottom: 40px;
          text-transform: uppercase;
        }

        .masonry { display: flex; gap: 10px; align-items: flex-start; }
        .masonry-col { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 10px; }

        .card { cursor: pointer; position: relative; overflow: hidden; border-radius: 3px; display: block; }
        .card img {
          width: 100%; display: block; object-fit: cover;
          filter: grayscale(20%) brightness(0.88);
          transition: transform 0.7s cubic-bezier(0.25,0.46,0.45,0.94), filter 0.5s ease;
        }
        .card:hover img { transform: scale(1.06); filter: grayscale(0%) brightness(1.02); }
        .card-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.05) 55%, transparent 100%);
          opacity: 0; transition: opacity 0.35s ease;
          display: flex; flex-direction: column; justify-content: flex-end;
          padding: 20px 14px 14px;
        }
        .card:hover .card-overlay { opacity: 1; }
        .card-story {
          font-family: 'Cormorant Garamond', serif;
          font-style: italic; font-size: 14px;
          color: #e8e4dc; line-height: 1.45; margin-bottom: 8px;
          transform: translateY(6px); transition: transform 0.35s ease;
        }
        .card:hover .card-story { transform: translateY(0); }
        .card-tags {
          display: flex; gap: 6px; flex-wrap: wrap;
          transform: translateY(6px); transition: transform 0.35s ease 0.05s;
        }
        .card:hover .card-tags { transform: translateY(0); }
        .card-tag { font-size: 9px; letter-spacing: 0.15em; color: #888; text-transform: uppercase; }
        .card-tag::before { content: "#"; }

        .modal-backdrop {
          position: fixed; inset: 0;
          background: rgba(5,5,4,0.97);
          display: flex; align-items: center; justify-content: center;
          padding: 24px; z-index: 100;
          animation: fadeIn 0.2s ease;
        }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        .modal {
          background: #111; max-width: 900px; width: 100%;
          max-height: 90vh; overflow-y: auto;
          display: grid; grid-template-columns: 1fr;
          animation: slideUp 0.3s ease;
        }
        @media (min-width: 700px) { .modal { grid-template-columns: 3fr 2fr; } }
        @keyframes slideUp { from{transform:translateY(24px);opacity:0} to{transform:translateY(0);opacity:1} }
        .modal img { width: 100%; height: 100%; object-fit: cover; display: block; max-height: 55vh; }
        @media (min-width: 700px) { .modal img { max-height: none; min-height: 480px; } }
        .modal-info { padding: 40px 28px; display: flex; flex-direction: column; gap: 20px; }
        .modal-num { font-size: 10px; letter-spacing: 0.3em; color: #333; text-transform: uppercase; }
        .modal-story {
          font-family: 'Cormorant Garamond', serif;
          font-size: 21px; font-weight: 300; line-height: 1.55; color: #e8e4dc; flex: 1;
        }
        .modal-tags { display: flex; flex-wrap: wrap; gap: 8px; }
        .modal-tag-btn {
          background: transparent; border: 1px solid #1e1e1e; color: #555;
          padding: 4px 12px; font-family: 'Inconsolata', monospace;
          font-size: 11px; letter-spacing: 0.1em; cursor: pointer; transition: all 0.2s;
        }
        .modal-tag-btn:hover { border-color: #555; color: #aaa; }
        .modal-close {
          background: transparent; border: none; color: #333;
          font-size: 10px; letter-spacing: 0.25em;
          font-family: 'Inconsolata', monospace;
          cursor: pointer; text-transform: uppercase; transition: color 0.2s; text-align: left;
        }
        .modal-close:hover { color: #e8e4dc; }

        .empty { text-align: center; padding: 80px 0; color: #333; font-size: 12px; letter-spacing: 0.2em; text-transform: uppercase; }

        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-track { background: #0a0a09; }
        ::-webkit-scrollbar-thumb { background: #1e1e1e; }
      `}</style>

      <div className={`page ${loaded ? "visible" : ""}`}>

        <header className={`site-header ${scrolled ? "scrolled" : ""}`}>
          <div className="hero-content">
            <p className="hero-eyebrow">Visual journal</p>
            <h1 className="hero-title">Stills</h1>
            <p className="hero-subtitle">Moments caught before they disappear</p>

            <div className="search-wrap">
              <span className="search-label">Search</span>
              <input
                className="search-input"
                type="text"
                placeholder="car, night, coffee…"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setActiveTag(null); }}
              />
            </div>

            <div className="hero-tags">
              {allTags.map((tag) => (
                <button
                  key={tag}
                  className={`tag-btn ${activeTag === tag ? "active" : ""}`}
                  onClick={() => handleTagClick(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </header>

        <p className={`scroll-hint ${scrolled ? "hidden" : ""}`}>scroll to explore</p>

        <section className="gallery-section">
          <p className="counter">{filtered.length} / {photos.length} moments</p>

          {filtered.length === 0 ? (
            <div className="empty">No moments found</div>
          ) : (
            <div className="masonry">
              {columns.map((col, ci) => (
                <div key={ci} className="masonry-col">
                  {col.map((photo) => (
                    <div key={photo.id} className="card" onClick={() => setSelectedPhoto(photo)}>
                      <img
                        src={photo.image}
                        alt={photo.story}
                        loading="lazy"
                        style={{ aspectRatio: `1 / ${photo.aspect}` }}
                      />
                      <div className="card-overlay">
                        <p className="card-story">{photo.story}</p>
                        <div className="card-tags">
                          {photo.tags.map((t) => <span key={t} className="card-tag">{t}</span>)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {selectedPhoto && (
        <div className="modal-backdrop" onClick={() => setSelectedPhoto(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <img src={selectedPhoto.image} alt={selectedPhoto.story} />
            <div className="modal-info">
              <p className="modal-num">No. {String(selectedPhoto.id).padStart(2, "0")}</p>
              <p className="modal-story">{selectedPhoto.story}</p>
              <div className="modal-tags">
                {selectedPhoto.tags.map((tag) => (
                  <button
                    key={tag}
                    className="modal-tag-btn"
                    onClick={() => { setActiveTag(tag); setSearch(""); setSelectedPhoto(null); }}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
              <button className="modal-close" onClick={() => setSelectedPhoto(null)}>← close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
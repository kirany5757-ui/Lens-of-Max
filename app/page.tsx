"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { photos } from "./photosData";

type Photo = {
  id: number;
  image: string;
  story: string;
  tags: string[];
  group: string;
  isMain: boolean;
  aspect: number;
};

const aspects = [
  0.75, 0.75, 0.8, 0.75, 0.75, 0.75, 1.7, 1.7, 1.7, 1.35,
  1.1, 0.9, 0.7, 1.0, 1.5, 0.75, 1.2, 0.8, 0.65,
];

const photosWithAspect: Photo[] = photos.map((p, i) => ({
  ...p,
  aspect: aspects[i] ?? 1.0,
  group: p.group ?? "",
  isMain: p.isMain ?? true,
}));

const allTags = [...new Set(photos.flatMap((p) => p.tags))].sort();
const totalMain = photosWithAspect.filter((p) => p.isMain).length;

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
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [cursor, setCursor] = useState({ x: 0, y: 0, visible: false });
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const numCols = useNumCols();

  useEffect(() => { setTimeout(() => setLoaded(true), 100); }, []);

  const getRelatedPhotos = useCallback((current: Photo): Photo[] => {
    if (!current.group) return [];
    return photosWithAspect.filter(
      (p) => p.group === current.group && p.id !== current.id
    );
  }, []);

  const shuffleEngine = useCallback((arr: Photo[]) => {
    const shuffle = (list: Photo[]) => {
      const copy = [...list];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    };

    let batchSize = 6;
    if (arr.length >= 100) {
      batchSize = 10;
    } else {
      for (let b = 7; b >= 4; b--) {
        if (arr.length % b === 0) {
          batchSize = b;
          break;
        }
      }
    }

    const batched = [];
    for (let i = 0; i < arr.length; i += batchSize) {
      const chunk = arr.slice(i, i + batchSize);
      batched.push(...shuffle(chunk));
    }
    return batched;
  }, []);

  const [shuffledPhotos, setShuffledPhotos] = useState<Photo[]>(() => shuffleEngine(photosWithAspect));

  const handleRefresh = () => {
    setShuffledPhotos(shuffleEngine(photosWithAspect));
  };

  const filtered = shuffledPhotos.filter((photo) => {
    if (!photo.isMain) return false;
    const matchSearch = search === "" || photo.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
    const matchTags = activeTags.length === 0 || activeTags.every((t) => photo.tags.includes(t));
    return matchSearch && matchTags;
  });

  const handleTagClick = (tag: string) => {
    if (activeTags.includes(tag)) {
      setActiveTags(activeTags.filter((t) => t !== tag));
    } else {
      setActiveTags([...activeTags, tag]);
    }
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

        /* ── MINIMAL UTILITY STICKY HEADER (Search Only) ── */
        .site-header {
          position: sticky;
          top: 0;
          z-index: 50;
          background: rgba(10, 10, 9, 0.85);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          padding: 16px 40px;
          display: flex;
          justify-content: flex-end;
          align-items: center;
        }

        .header-search-wrap {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .header-search-icon { font-size: 13px; color: rgba(232,228,220,0.4); }
        .header-search {
          background: transparent;
          border: none;
          border-bottom: 1px solid rgba(255,255,255,0.12);
          padding: 4px 0;
          font-family: 'Inconsolata', monospace;
          font-size: 12px;
          color: #e8e4dc;
          outline: none;
          width: 160px;
          transition: border-color 0.2s, width 0.3s ease;
        }
        .header-search:focus { border-color: rgba(255,255,255,0.3); width: 210px; }
        .header-search::placeholder { color: rgba(232,228,220,0.25); }

        /* ── COMPACT EDITORIAL HERO (Sole Signature) ── */
        .hero-compact {
          max-width: 1400px;
          margin: 0 auto;
          padding: 50px 40px 30px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }

        .hero-eyebrow {
          font-size: 12px;
          opacity: 0.35;
          margin-bottom: -4px;
        }

        .hero-title-group h1 {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(40px, 6vw, 72px);
          font-weight: 300;
          letter-spacing: 0.04em;
          color: #e8e4dc;
          line-height: 1;
          margin-bottom: 8px;
        }

        .hero-title-group p {
          font-family: 'Cormorant Garamond', serif;
          font-style: italic;
          font-size: 16px;
          color: #7a7770;
        }

        .hero-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          max-width: 600px;
          margin-top: 4px;
        }
        .tag-btn {
          background: transparent;
          border: 1px solid #222;
          color: #666;
          padding: 4px 12px;
          font-family: 'Inconsolata', monospace;
          font-size: 11px;
          letter-spacing: 0.1em;
          cursor: pointer;
          transition: border-color 0.2s, color 0.2s;
        }
        .tag-btn:hover { border-color: #555; color: #aaa; }
        .tag-btn.active { border-color: #e8e4dc; color: #e8e4dc; }

        /* ── GALLERY ── */
        .gallery-section {
          max-width: 1400px;
          margin: 0 auto;
          padding: 40px 40px 120px;
        }
        .gallery-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 30px;
        }
        .counter {
          font-size: 10px;
          letter-spacing: 0.2em;
          color: #444;
          text-transform: uppercase;
        }
        .refresh-btn {
          background: transparent;
          border: 1px solid #222;
          color: #555;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 12px;
        }
        .refresh-btn:hover {
          border-color: #555;
          color: #e8e4dc;
          transform: rotate(180deg);
        }

        .card {
          cursor: none;
          position: relative;
          overflow: hidden;
          border-radius: 3px;
          display: block;
        }
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
          padding: 16px 14px 10px;
        }
        .card:hover .card-overlay { opacity: 1; }
        .card-story {
          font-family: 'Cormorant Garamond', serif;
          font-style: italic; font-size: 14px;
          color: #e8e4dc; line-height: 1.45; margin-bottom: 4px;
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

        /* ── CUSTOM CAMERA CURSOR ── */
        .camera-cursor {
          position: fixed;
          top: 0; left: 0;
          width: 28px; height: 28px;
          display: flex; align-items: center; justify-content: center;
          pointer-events: none; z-index: 9999;
          transform: translate(-9999px, -9999px);
          transition: opacity 0.18s ease;
        }
        .camera-cursor.hidden { opacity: 0; }
        .camera-cursor-icon { font-size: 12px; color: rgba(232,228,220,0.7); user-select: none; }

        /* ── MODAL ── */
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
        .modal-main-img { width: 100%; height: 100%; object-fit: cover; display: block; max-height: 55vh; cursor: none; }
        @media (min-width: 700px) { .modal-main-img { max-height: none; min-height: 480px; } }
        .modal-info { padding: 40px 28px; display: flex; flex-direction: column; gap: 20px; }
        .modal-num { font-size: 10px; letter-spacing: 0.3em; color: #888; text-transform: uppercase; }
        .modal-story { font-family: 'Cormorant Garamond', serif; font-size: 21px; font-weight: 300; line-height: 1.55; color: #e8e4dc; flex: 1; }
        .modal-tags { display: flex; flex-wrap: wrap; gap: 8px; }
        .modal-tag-btn { background: transparent; border: 1px solid #444; color: #aaa; padding: 4px 12px; font-family: 'Inconsolata', monospace; font-size: 11px; letter-spacing: 0.1em; cursor: pointer; transition: all 0.2s; }
        .modal-tag-btn:hover { border-color: #e8e4dc; color: #e8e4dc; }
        .related-label { font-size: 10px; letter-spacing: 0.2em; color: #888; text-transform: uppercase; margin-bottom: 10px; }
        .related-strip { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 4px; scrollbar-width: none; }
        .related-strip::-webkit-scrollbar { display: none; }
        .related-thumb { width: 90px; height: 120px; object-fit: cover; flex-shrink: 0; cursor: pointer; border-radius: 2px; filter: brightness(0.8) grayscale(15%); transition: filter 0.2s ease, transform 0.2s ease; border: 1px solid transparent; }
        .related-thumb:hover { filter: brightness(1) grayscale(0%); transform: scale(1.04); border-color: #666; }
        .modal-close { background: transparent; border: none; color: #888; font-family: 'Inconsolata', monospace; font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; cursor: pointer; text-align: left; margin-top: auto; padding-top: 10px; transition: color 0.2s; }
        .modal-close:hover { color: #e8e4dc; }

        .modal-float-btn { position: fixed; top: 50%; transform: translateY(-50%); background: transparent; border: none; color: rgba(232, 228, 220, 0.7); font-family: 'Cormorant Garamond', serif; font-size: 60px; font-weight: 300; cursor: pointer; z-index: 120; transition: color 0.2s ease; padding: 20px; line-height: 1; }
        .modal-float-btn:hover { color: #e8e4dc; }
        .modal-prev-btn { left: 40px; }
        .modal-next-btn { right: 40px; }

        .empty { text-align: center; padding: 80px 0; color: #888; font-size: 12px; letter-spacing: 0.2em; text-transform: uppercase; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-track { background: #0a0a09; }
        ::-webkit-scrollbar-thumb { background: #1e1e1e; }
      `}</style>

      <div className={`page ${loaded ? "visible" : ""}`}>
        {/* ── MINIMAL UTILITY STICKY HEADER ── */}
        <header className="site-header">
          <div className="header-search-wrap">
            <span className="header-search-icon">⌕</span>
            <input
              className="header-search"
              type="text"
              placeholder="search moments…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setActiveTags([]); }}
            />
          </div>
        </header>

        {/* ── COMPACT EDITORIAL HERO (Sole Signature) ── */}
        <section className="hero-compact">
          <p className="hero-eyebrow">🕊️</p>
          <div className="hero-title-group">
            <h1>Lens of Max</h1>
            <p>The beauty of my camera&apos;s wink</p>
          </div>
          <div className="hero-tags">
            {allTags.map((tag) => (
              <button
                key={tag}
                className={`tag-btn ${activeTags.includes(tag) ? "active" : ""}`}
                onClick={() => handleTagClick(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        </section>

        {/* ── GALLERY SECTION ── */}
        <section className="gallery-section">
          <div className="gallery-header">
            <p className="counter">{filtered.length} / {totalMain} moments</p>
            <button className="refresh-btn" onClick={handleRefresh} title="Reshuffle Grid">↻</button>
          </div>

          {filtered.length === 0 ? (
            <div className="empty">No moments found</div>
          ) : (
            <div style={{ columnCount: numCols, columnGap: '16px' }}>
              {filtered.map((photo) => (
                <div
                  key={photo.id}
                  className="card"
                  style={{
                    marginBottom: '16px', 
                    breakInside: 'avoid', 
                    display: 'inline-block',
                    width: '100%'
                  }}
                  onClick={() => setSelectedPhoto(photo)}
                  onMouseMove={(e) => {
                    if (cursorRef.current) {
                      cursorRef.current.style.transform =
                        `translate(${e.clientX - 14}px, ${e.clientY - 14}px)`;
                    }
                  }}
                  onMouseEnter={(e) => setCursor({ x: e.clientX, y: e.clientY, visible: true })}
                  onMouseLeave={() => setCursor((prev) => ({ ...prev, visible: false }))}
                >
                  <Image
                    src={photo.image}
                    alt={photo.story}
                    width={800}
                    height={800} 
                    quality={100}
                    style={{ width: "100%", height: "auto", display: "block" }} 
                  />
                  
                  <div className="card-overlay">
                    <p className="card-story">{photo.story}</p>
                    <div className="card-tags">
                      {photo.tags.map((t) => (
                        <span key={t} className="card-tag">{t}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <div ref={cursorRef} className={`camera-cursor ${cursor.visible ? "" : "hidden"}`}>
        <span className="camera-cursor-icon">📷</span>
      </div>

      {selectedPhoto && (
        <div className="modal-backdrop" onClick={() => setSelectedPhoto(null)}>
          <button 
            className="modal-float-btn modal-prev-btn" 
            onClick={(e) => {
              e.stopPropagation();
              const currentIndex = filtered.findIndex(p => p.id === selectedPhoto.id);
              const prevIndex = currentIndex === 0 ? filtered.length - 1 : currentIndex - 1;
              setSelectedPhoto(filtered[prevIndex]);
            }}
          >
            ‹
          </button>

          <button 
            className="modal-float-btn modal-next-btn" 
            onClick={(e) => {
              e.stopPropagation();
              const currentIndex = filtered.findIndex(p => p.id === selectedPhoto.id);
              const nextIndex = currentIndex === filtered.length - 1 ? 0 : currentIndex + 1;
              setSelectedPhoto(filtered[nextIndex]);
            }}
          >
            ›
          </button>

          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <Image
              className="modal-main-img"
              src={selectedPhoto.image}
              alt={selectedPhoto.story}
              width={1200}
              height={800}
              quality={100}
              onMouseMove={(e) => {
                if (cursorRef.current) {
                  cursorRef.current.style.transform =
                    `translate(${e.clientX - 17}px, ${e.clientY - 17}px)`;
                }
              }}
              onMouseEnter={(e) => setCursor({ x: e.clientX, y: e.clientY, visible: true })}
              onMouseLeave={() => setCursor((prev) => ({ ...prev, visible: false }))}
            />
            
            <div className="modal-info">
              <p className="modal-num">No. {String(selectedPhoto.id).padStart(2, "0")}</p>
              <p className="modal-story">{selectedPhoto.story}</p>
              <div className="modal-tags">
                {selectedPhoto.tags.map((tag) => (
                  <button
                    key={tag}
                    className="modal-tag-btn"
                    onClick={() => { setActiveTags([tag]); setSearch(""); setSelectedPhoto(null); }}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
              {getRelatedPhotos(selectedPhoto).length > 0 && (
                <div>
                  <p className="related-label">same moment, different frame</p>
                  <div className="related-strip">
                    {getRelatedPhotos(selectedPhoto).map((photo) => (
                      <img
                        key={photo.id}
                        src={photo.image}
                        alt={photo.story}
                        className="related-thumb"
                        style={{ cursor: 'none' }}
                        onClick={() => setSelectedPhoto(photo)}
                        onMouseMove={(e) => {
                          if (cursorRef.current) {
                            cursorRef.current.style.transform =
                              `translate(${e.clientX - 14}px, ${e.clientY - 14}px)`;
                          }
                        }}
                        onMouseEnter={(e) => setCursor({ x: e.clientX, y: e.clientY, visible: true })}
                        onMouseLeave={() => setCursor((prev) => ({ ...prev, visible: false }))}
                      />
                    ))}
                  </div>
                </div>
              )}
              
              <button className="modal-close" onClick={() => setSelectedPhoto(null)}>close ✕</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
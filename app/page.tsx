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
  const [scrolled, setScrolled] = useState(false);
  // 0 = fully in hero, 1 = fully scrolled — drives the morph
  const [morphProgress, setMorphProgress] = useState(0);
  const [cursor, setCursor] = useState({ x: 0, y: 0, visible: false });
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const numCols = useNumCols();
  const rafRef = useRef<number | null>(null);

  useEffect(() => { setTimeout(() => setLoaded(true), 100); }, []);

  useEffect(() => {
    const onScroll = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const y = window.scrollY;
        const progress = Math.min(1, Math.max(0, (y - 40) / 160));
        setMorphProgress(progress);
        setScrolled(y > 100);
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const getRelatedPhotos = useCallback((current: Photo): Photo[] => {
    if (!current.group) return [];
    return photosWithAspect.filter(
      (p) => p.group === current.group && p.id !== current.id
    );
  }, []);

  // ── BATCH SHUFFLE ENGINE ──
  const shuffleEngine = useCallback((arr: Photo[]) => {
    const shuffle = (list: Photo[]) => {
      const copy = [...list];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    };

    const batched = [];
    for (let i = 0; i < arr.length; i += 7) {
      const chunk = arr.slice(i, i + 7);
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

  const heroTitleOpacity = 1 - morphProgress;
  const heroTitleBlur = morphProgress * 8; 
  const heroTitleScale = 1 - morphProgress * 0.06;
  const navOpacity = morphProgress;
  const navBlur = (1 - morphProgress) * 12; 

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

        /* ── FIXED NAV BAR ── */
        .site-header {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 50;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          padding: 0 32px;
          pointer-events: none;
        }
        .site-header.scrolled {
          pointer-events: all;
        }

        .header-name {
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          font-family: 'Cormorant Garamond', serif;
          font-size: 22px;
          font-weight: 300;
          letter-spacing: 0.06em;
          color: #e8e4dc;
          white-space: nowrap;
          user-select: none;
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

        /* ── HERO ── */
        .hero {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          text-align: center;
          padding: 160px 24px 60px;
          position: relative;
        }
        .hero::after {
          content: '';
          position: absolute;
          bottom: 0; left: 50%;
          transform: translateX(-50%);
          width: 1px; height: 60px;
          background: linear-gradient(to bottom, #2a2a2a, transparent);
        }

        .hero-eyebrow {
          font-size: 1px;
          letter-spacing: 0.35em;
          text-transform: uppercase;
          color: #444;
          margin-bottom: 20px;
          transition: opacity 0.1s linear;
        }
        .hero-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(72px, 16vw, 160px);
          font-weight: 300;
          line-height: 0.9;
          letter-spacing: 0.06em;
          color: #e8e4dc;
          margin: 0 0 8px;
          position: relative;
          transform-origin: center top;
          will-change: opacity, filter, transform;
        }
        .hero-title::before,
        .hero-title::after {
          content: "";
          position: absolute;
          left: 50%; transform: translateX(-50%);
          width: 60%; height: 1px;
          background: #2a2a2a;
          transition: opacity 0.2s;
        }
        .hero-title::before { top: -14px; }
        .hero-title::after  { bottom: -14px; }

        .hero-subtitle {
          font-family: 'Cormorant Garamond', serif;
          font-style: italic;
          font-size: 17px;
          color: #5c5a56;
          margin: 28px 0 52px;
        }

        .hero-search-wrap {
          position: relative;
          width: 100%;
          max-width: 380px;
          margin-bottom: 28px;
        }
        .hero-search-label {
          position: absolute;
          left: 0; top: 50%;
          transform: translateY(-50%);
          font-size: 10px;
          letter-spacing: 0.3em;
          color: #3a3a3a;
          text-transform: uppercase;
          pointer-events: none;
        }
        .hero-search-input {
          background: transparent;
          border: none;
          border-bottom: 1px solid #333;
          width: 100%;
          padding: 12px 0 12px 68px;
          font-family: 'Inconsolata', monospace;
          font-size: 15px;
          color: #e8e4dc;
          outline: none;
          transition: border-color 0.2s;
        }
        .hero-search-input:focus { border-color: #666; }
        .hero-search-input::placeholder { color: #2e2e2e; }

        .hero-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          justify-content: center;
          max-width: 540px;
        }
        .tag-btn {
          background: transparent;
          border: 1px solid #222;
          color: #555;
          padding: 4px 14px;
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
          padding: 60px 12px 120px;
        }
        .gallery-header {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-bottom: 40px;
        }
        .counter {
          font-size: 10px;
          letter-spacing: 0.2em;
          color: #2e2e2e;
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
          margin-top: 0px;
          transform: translateY(6px); transition: transform 0.35s ease 0.05s;
        }
        .card:hover .card-tags { transform: translateY(0); }
        .card-tag { font-size: 9px; letter-spacing: 0.15em; color: #888; text-transform: uppercase; }
        .card-tag::before { content: "#"; }

        /* ── CUSTOM CAMERA CURSOR ── */
        .camera-cursor {
          position: fixed;
          top: 0;
          left: 0;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
          z-index: 9999;
          transform: translate(-9999px, -9999px);
          transition: opacity 0.18s ease;
          will-change: transform, opacity;
        }

        .camera-cursor.hidden { opacity: 0; }
        .camera-cursor-icon { font-size: 12px; color: rgba(232,228,220,0.7); line-height: 1; user-select: none; }

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
        .modal-main-img {
          width: 100%; height: 100%; object-fit: cover; display: block; max-height: 55vh; cursor: none;
        }
        @media (min-width: 700px) { .modal-main-img { max-height: none; min-height: 480px; } }
        .modal-info { padding: 40px 28px; display: flex; flex-direction: column; gap: 20px; }
        .modal-num { font-size: 10px; letter-spacing: 0.3em; color: #333; text-transform: uppercase; }
        .modal-story {
          font-family: 'Cormorant Garamond', serif;
          font-size: 21px; font-weight: 300; line-height: 1.55; color: #e8e4dc; flex: 1;
        }
        .modal-tags { display: flex; flex-wrap: wrap; gap: 8px; }
        .modal-tag-btn {
          background: transparent; border: 1px solid #2a2a2a; color: #555;
          padding: 4px 12px; font-family: 'Inconsolata', monospace;
          font-size: 11px; letter-spacing: 0.1em; cursor: pointer; transition: all 0.2s;
        }
        .modal-tag-btn:hover { border-color: #555; color: #aaa; }
        .related-label { font-size: 10px; letter-spacing: 0.2em; color: #444; text-transform: uppercase; margin-bottom: 10px; }
        .related-strip { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 4px; scrollbar-width: none; }
        .related-strip::-webkit-scrollbar { display: none; }
        .related-thumb {
          width: 90px; height: 120px; object-fit: cover; flex-shrink: 0;
          cursor: pointer; border-radius: 2px; filter: brightness(0.8) grayscale(15%);
          transition: filter 0.2s ease, transform 0.2s ease; border: 1px solid transparent;
        }
        .related-thumb:hover { filter: brightness(1) grayscale(0%); transform: scale(1.04); border-color: #444; }
        .modal-close {
          background: transparent; border: none; color: #333;
          font-size: 10px; letter-spacing: 0.25em; font-family: 'Inconsolata', monospace;
          cursor: pointer; text-transform: uppercase; transition: color 0.2s; text-align: left;
        }
        .modal-close:hover { color: #e8e4dc; }
        .empty { text-align: center; padding: 80px 0; color: #333; font-size: 12px; letter-spacing: 0.2em; text-transform: uppercase; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-track { background: #0a0a09; }
        ::-webkit-scrollbar-thumb { background: #1e1e1e; }
      `}</style>

      <div className={`page ${loaded ? "visible" : ""}`}>
        <header
          className={`site-header ${scrolled ? "scrolled" : ""}`}
          style={{
            opacity: navOpacity,
            background: `rgba(10,10,9,${0.6 * morphProgress})`,
            backdropFilter: `blur(${20 * morphProgress}px) saturate(${100 + 60 * morphProgress}%)`,
            WebkitBackdropFilter: `blur(${20 * morphProgress}px) saturate(${100 + 60 * morphProgress}%)`,
            borderBottom: `1px solid rgba(255,255,255,${0.06 * morphProgress})`,
            transform: `translateY(${(1 - morphProgress) * -8}px)`,
          }}
        >
          <span className="header-name" style={{ filter: `blur(${navBlur * 0.4}px)` }}>
            Lens of Max
          </span>
          <div className="header-search-wrap" style={{ filter: `blur(${navBlur * 0.6}px)` }}>
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

        <section className="hero">
          <p className="hero-eyebrow" style={{ opacity: heroTitleOpacity }}>🕊️</p>
          <h1
            className="hero-title"
            style={{
              opacity: heroTitleOpacity,
              filter: `blur(${heroTitleBlur}px)`,
              transform: `translateY(-${morphProgress * 220}px) scale(${heroTitleScale})`,
            }}
          >
            Lens of Max
          </h1>
          <p className="hero-subtitle" style={{ opacity: heroTitleOpacity }}>
            The beauty of my camera&apos;s wink
          </p>

          <div className="hero-search-wrap" style={{ opacity: Math.max(0, 1 - morphProgress * 2.2) }}>
            <span className="hero-search-label">Search</span>
            <input
              className="hero-search-input"
              type="text"
              placeholder="search moments…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setActiveTags([]); }}
            />
          </div>

          <div className="hero-tags" style={{ opacity: Math.max(0, 1 - morphProgress * 2.4) }}>
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
                  className="card relative w-full mb-4 overflow-hidden rounded-sm group cursor-pointer"
                  style={{
                    aspectRatio: photo.aspect,
                    breakInside: 'avoid',
                    display: 'inline-block' 
                  }}
                  onClick={() => setSelectedPhoto(photo)}
                >
                  <Image
                    src={photo.image}
                    alt={photo.story}
                    width={800}
                    height={800 / photo.aspect}
                    quality={100}
                    style={{ width: "100%", height: "auto" }}
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
                        onClick={() => setSelectedPhoto(photo)}
                      />
                    ))}
                  </div>
                </div>
              )}
              <button className="modal-close" onClick={() => setSelectedPhoto(null)}>← close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
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
      if (window.innerWidth < 768) setCols(1);
      else if (window.innerWidth < 1100) setCols(2);
      else setCols(3);
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
  const [navOpen, setNavOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [mounted, setMounted] = useState(false);

  const [introVisible, setIntroVisible] = useState(true);
  const [introMounted, setIntroMounted] = useState(true);

  const cursorRef = useRef<HTMLDivElement | null>(null);
  const [cursor, setCursor] = useState({ x: 0, y: 0, visible: false });
  const numCols = useNumCols();

  useEffect(() => {
    setMounted(true);
    setTimeout(() => setLoaded(true), 100);

    const fadeTimer = setTimeout(() => setIntroVisible(false), 1600);
    const unmountTimer = setTimeout(() => setIntroMounted(false), 2200);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(unmountTimer);
    };
  }, []);

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
    if (arr.length >= 100) batchSize = 10;
    else {
      for (let b = 7; b >= 4; b--) {
        if (arr.length % b === 0) {
          batchSize = b;
          break;
        }
      }
    }
    const batched = [];
    for (let i = 0; i < arr.length; i += batchSize) {
      batched.push(...shuffle(arr.slice(i, i + batchSize)));
    }
    return batched;
  }, []);

  const [shuffledPhotos, setShuffledPhotos] = useState<Photo[]>(photosWithAspect);

  useEffect(() => {
    if (mounted) {
      setShuffledPhotos(shuffleEngine(photosWithAspect));
    }
  }, [mounted, shuffleEngine]);

  const handleRefresh = () => {
    setShuffledPhotos(shuffleEngine(photosWithAspect));
  };

  const filtered = shuffledPhotos.filter((photo) => {
    if (!photo.isMain) return false;
    const matchSearch =
      search === "" ||
      photo.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
    const matchTags =
      activeTags.length === 0 || activeTags.every((t) => photo.tags.includes(t));
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
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Inconsolata:wght@300;400;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body {
          background: #080807;
          color: #e8e4dc;
          font-family: 'Inconsolata', monospace;
          min-height: 100vh;
        }

        .page { opacity: 0; transition: opacity 0.8s ease; }
        .page.visible { opacity: 1; }

        /* ── ONE-TIME SIGNATURE INTRO ── */
        .signature-intro {
          position: fixed;
          inset: 0;
          z-index: 200;
          background: #080807;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          opacity: 1;
          transition: opacity 0.6s ease;
          pointer-events: none;
        }
        .signature-intro.fade-out { opacity: 0; }

        .signature-intro h1 {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(48px, 8vw, 96px);
          font-weight: 300;
          letter-spacing: 0.05em;
          color: #e8e4dc;
          line-height: 1;
          margin-bottom: 12px;
        }
        .signature-intro p {
          font-family: 'Cormorant Garamond', serif;
          font-style: italic;
          font-size: 17px;
          color: #7a7770;
        }

        /* ── FIXED LEFT VERTICAL BRAND ── */
        .vertical-brand {
          position: fixed;
          left: 70px;
          bottom: 105px;
          transform: rotate(-90deg);
          transform-origin: left bottom;
          z-index: 40;
          font-family: 'Cormorant Garamond', serif;
          font-size: 44px;
          font-weight: 400;
          letter-spacing: 0.3em;
          color: rgba(232, 228, 220, 0.8);
          text-transform: uppercase;
          white-space: nowrap;
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.8s ease 0.9s;
        }
        .vertical-brand.visible { opacity: 1; }

        /* ── ARCHITECTURAL CORNER TAPE / SPLIT ACCENT LINES ── */
        .accent-line-top-left, .accent-line-bottom-left,
        .accent-line-top-right, .accent-line-bottom-right {
          position: fixed;
          width: 2px;
          background: rgba(232, 228, 220, 0.6);
          z-index: 39;
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.8s ease 0.9s;
        }
        .accent-line-top-left.visible, .accent-line-bottom-left.visible,
        .accent-line-top-right.visible, .accent-line-bottom-right.visible {
          opacity: 1;
        }

        /* Left side framing around "LENS OF MAX" */
        .accent-line-top-left {
          top: 0;
          left: 36px;
          height: calc(100vh - 540px);
        }
        .accent-line-bottom-left {
          bottom: 0;
          left: 36px;
          height: 90px;
        }

        /* Right side framing around "NAV / ALL" */
        .accent-line-top-right {
          top: 0;
          right: 40px;
          height: calc(100vh - 600px);
        }
        .accent-line-bottom-right {
          bottom: 0;
          right: 40px;
          height: 480px;
        }

        /* ── FIXED RIGHT VERTICAL NAV ── */
        .vertical-nav {
          position: fixed;
          right: 40px;
          top: 50%;
          transform: translateY(-50%) rotate(90deg);
          transform-origin: right center;
          z-index: 40;
          display: flex;
          align-items: center;
          gap: 24px;
          font-family: 'Inconsolata', monospace;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.35em;
          text-transform: uppercase;
        }
        .vertical-nav button {
          background: transparent;
          border: none;
          color: rgba(232, 228, 220, 0.6);
          font-family: 'Inconsolata', monospace;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.35em;
          cursor: pointer;
          transition: color 0.2s;
        }
        .vertical-nav button:hover, .vertical-nav button.active {
          color: #e8e4dc;
        }
        
        @media (max-width: 900px) {
          .vertical-brand, .accent-line-top-left, .accent-line-bottom-left,
          .accent-line-top-right, .accent-line-bottom-right { display: none; }
          .vertical-nav {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            transform: none;
            background: rgba(8, 8, 7, 0.9);
            backdrop-filter: blur(10px);
            padding: 16px 24px;
            justify-content: flex-end;
            border-bottom: 1px solid rgba(255, 255, 255, 0.06);
            z-index: 80;
          }
        }

        /* ── MAIN CONTAINER ── */
        .main-container {
          max-width: 1440px;
          margin: 0 auto;
          padding: 150px 46px 120px;
        }
        @media (max-width: 900px) {
          .main-container { padding: 100px 24px 80px; }
        }

        /* ── NAV DRAWER OVERLAY ── */
        .nav-drawer {
          position: fixed; inset: 0;
          background: rgba(8, 8, 7, 0.96);
          backdrop-filter: blur(12px);
          z-index: 90;
          display: flex; flex-direction: column; justify-content: center; align-items: center;
          padding: 40px;
          animation: fadeIn 0.25s ease;
        }
        .nav-drawer-content {
          max-width: 600px; width: 100%;
          display: flex; flex-direction: column; gap: 30px;
        }
        .nav-drawer-header {
          display: flex; justify-content: space-between; align-items: center;
          border-bottom: 1px solid rgba(255,255,255,0.1);
          padding-bottom: 16px;
        }
        .nav-drawer-title { font-size: 11px; letter-spacing: 0.3em; text-transform: uppercase; color: #888; }
        .nav-drawer-close { background: transparent; border: none; color: #888; font-size: 11px; letter-spacing: 0.2em; cursor: pointer; }
        .nav-drawer-close:hover { color: #e8e4dc; }
        .nav-tags-grid { display: flex; flex-wrap: wrap; gap: 10px; }
        .nav-tag-pill {
          background: transparent; border: 1px solid rgba(255,255,255,0.15); color: #aaa;
          padding: 8px 16px; font-family: 'Inconsolata', monospace; font-size: 12px;
          letter-spacing: 0.15em; cursor: pointer; transition: all 0.2s;
        }
        .nav-tag-pill:hover { border-color: #e8e4dc; color: #e8e4dc; }
        .nav-tag-pill.active { border-color: #e8e4dc; background: #e8e4dc; color: #080807; }

        /* ── GALLERY GRID ── */
        .gallery-header {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 30px; padding-bottom: 16px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .counter { font-size: 10px; letter-spacing: 0.25em; color: #555; text-transform: uppercase; }
        .refresh-btn {
          background: transparent; border: 1px solid rgba(255,255,255,0.12); color: #777;
          width: 26px; height: 26px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: all 0.3s ease; font-size: 12px;
        }
        .refresh-btn:hover { border-color: #e8e4dc; color: #e8e4dc; transform: rotate(180deg); }

        .card {
          cursor: none;
          position: relative;
          overflow: hidden;
          border-radius: 2px;
          background: #141412;
          margin-bottom: 20px;
          break-inside: avoid;
        }
        .card img {
          width: 100%; display: block; object-fit: cover;
          filter: grayscale(15%) brightness(0.9);
          transition: transform 0.7s cubic-bezier(0.25,0.46,0.45,0.94), filter 0.5s ease;
        }
        .card:hover img { transform: scale(1.04); filter: grayscale(0%) brightness(1.02); }
        .card-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.1) 60%, transparent 100%);
          opacity: 0; transition: opacity 0.35s ease;
          display: flex; flex-direction: column; justify-content: flex-end;
          padding: 20px 16px 14px;
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
          position: fixed; top: 0; left: 0;
          width: 28px; height: 28px;
          display: flex; align-items: center; justify-content: center;
          pointer-events: none; z-index: 9999;
          transform: translate(-9999px, -9999px);
          transition: opacity 0.18s ease;
        }
        .camera-cursor.hidden { opacity: 0; }
        .camera-cursor-icon { font-size: 12px; color: rgba(232,228,220,0.7); user-select: none; }

        /* ── MODAL VIEWER ── */
        .modal-backdrop {
          position: fixed; inset: 0;
          background: rgba(5,5,4,0.98);
          display: flex; align-items: center; justify-content: center;
          padding: 32px; z-index: 100;
          animation: fadeIn 0.25s ease;
        }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        .modal {
          background: #0e0e0d; max-width: 1000px; width: 100%;
          max-height: 88vh; overflow-y: auto;
          display: grid; grid-template-columns: 1fr;
          border: 1px solid rgba(255,255,255,0.06);
          animation: slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @media (min-width: 768px) { .modal { grid-template-columns: 1.6fr 1fr; } }
        @keyframes slideUp { from{transform:translateY(24px);opacity:0} to{transform:translateY(0);opacity:1} }
        .modal-main-img { width: 100%; height: 100%; object-fit: cover; display: block; max-height: 60vh; cursor: none; }
        @media (min-width: 768px) { .modal-main-img { max-height: none; min-height: 500px; } }
        .modal-info { padding: 48px 36px; display: flex; flex-direction: column; gap: 24px; justify-content: space-between; }
        .modal-num { font-size: 10px; letter-spacing: 0.3em; color: #666; text-transform: uppercase; }
        .modal-story { font-family: 'Cormorant Garamond', serif; font-size: 22px; font-weight: 300; line-height: 1.55; color: #e8e4dc; }
        .modal-tags { display: flex; flex-wrap: wrap; gap: 8px; }
        .modal-tag-btn { background: transparent; border: 1px solid rgba(255,255,255,0.12); color: #999; padding: 4px 12px; font-family: 'Inconsolata', monospace; font-size: 11px; letter-spacing: 0.1em; cursor: pointer; transition: all 0.2s; }
        .modal-tag-btn:hover { border-color: #e8e4dc; color: #e8e4dc; }
        .related-label { font-size: 10px; letter-spacing: 0.2em; color: #666; text-transform: uppercase; margin-bottom: 10px; }
        .related-strip { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 4px; scrollbar-width: none; }
        .related-strip::-webkit-scrollbar { display: none; }
        .related-thumb { width: 80px; height: 110px; object-fit: cover; flex-shrink: 0; cursor: pointer; border-radius: 2px; filter: brightness(0.8) grayscale(20%); transition: filter 0.2s ease, transform 0.2s ease; border: 1px solid transparent; }
        .related-thumb:hover { filter: brightness(1) grayscale(0%); transform: scale(1.03); border-color: #666; }
        .modal-close { background: transparent; border: none; color: #666; font-family: 'Inconsolata', monospace; font-size: 11px; letter-spacing: 0.25em; text-transform: uppercase; cursor: pointer; text-align: left; padding-top: 14px; border-top: 1px solid rgba(255,255,255,0.06); transition: color 0.2s; }
        .modal-close:hover { color: #e8e4dc; }

        .modal-float-btn { position: fixed; top: 50%; transform: translateY(-50%); background: transparent; border: none; color: rgba(232, 228, 220, 0.5); font-family: 'Cormorant Garamond', serif; font-size: 64px; font-weight: 300; cursor: pointer; z-index: 120; transition: color 0.2s ease; padding: 24px; line-height: 1; }
        .modal-float-btn:hover { color: #e8e4dc; }
        .modal-prev-btn { left: 32px; }
        .modal-next-btn { right: 32px; }

        .empty { text-align: center; padding: 100px 0; color: #666; font-size: 12px; letter-spacing: 0.25em; text-transform: uppercase; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-track { background: #080807; }
        ::-webkit-scrollbar-thumb { background: #222; }
      `}</style>

      {/* ── ONE-TIME SIGNATURE INTRO OVERLAY ── */}
      {introMounted && (
        <div className={`signature-intro ${!introVisible ? "fade-out" : ""}`}>
          <h1>Lens of Max</h1>
          <p>The beauty of my camera&apos;s wink</p>
        </div>
      )}

      <div className={`page ${loaded ? "visible" : ""}`}>
        {/* ── SPLIT ACCENT LINES FRAMING BOTH SIDES ── */}
        <div className={`accent-line-top-left ${!introVisible ? "visible" : ""}`} />
        <div className={`accent-line-bottom-left ${!introVisible ? "visible" : ""}`} />
        <div className={`accent-line-top-right ${!introVisible ? "visible" : ""}`} />
        <div className={`accent-line-bottom-right ${!introVisible ? "visible" : ""}`} />

        {/* ── FIXED LEFT VERTICAL BRAND ── */}
        <div className={`vertical-brand ${!introVisible ? "visible" : ""}`}>
          Lens of Max
        </div>

        {/* ── FIXED RIGHT VERTICAL NAV ── */}
        <nav className="vertical-nav">
          <button onClick={() => setNavOpen(true)}>
            NAV {activeTags.length > 0 ? `(${activeTags.length})` : ""}
          </button>
          <button onClick={() => { setActiveTags([]); setSearch(""); }}>ALL</button>
        </nav>

        {/* ── MAIN SCROLLABLE CONTENT ── */}
        <main className="main-container">
          <section className="gallery-section">
            <div className="gallery-header">
              <p className="counter">{filtered.length} / {totalMain} moments</p>
              <button className="refresh-btn" onClick={handleRefresh} title="Reshuffle Grid">↻</button>
            </div>

            {filtered.length === 0 ? (
              <div className="empty">No moments found</div>
            ) : (
              <div style={{ columnCount: numCols, columnGap: '20px' }}>
                {filtered.map((photo) => (
                  <div
                    key={photo.id}
                    className="card"
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
                      width={1000}
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
        </main>
      </div>

      {/* ── NAV OVERLAY DRAWER ── */}
      {navOpen && (
        <div className="nav-drawer" onClick={() => setNavOpen(false)}>
          <div className="nav-drawer-content" onClick={(e) => e.stopPropagation()}>
            <div className="nav-drawer-header">
              <span className="nav-drawer-title">Filter by Tags</span>
              <button className="nav-drawer-close" onClick={() => setNavOpen(false)}>CLOSE ✕</button>
            </div>
            <div className="nav-tags-grid">
              <button
                className={`nav-tag-pill ${activeTags.length === 0 ? "active" : ""}`}
                onClick={() => { setActiveTags([]); setNavOpen(false); }}
              >
                All Moments
              </button>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  className={`nav-tag-pill ${activeTags.includes(tag) ? "active" : ""}`}
                  onClick={() => { handleTagClick(tag); setNavOpen(false); }}
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── CUSTOM CAMERA CURSOR ── */}
      <div ref={cursorRef} className={`camera-cursor ${cursor.visible ? "" : "hidden"}`}>
        <span className="camera-cursor-icon">📷</span>
      </div>

      {/* ── MODAL VIEWER ── */}
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
              <div>
                <p className="modal-num">No. {String(selectedPhoto.id).padStart(2, "0")}</p>
                <p className="modal-story" style={{ marginTop: '16px' }}>{selectedPhoto.story}</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
              </div>

              <button className="modal-close" onClick={() => setSelectedPhoto(null)}>close ✕</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
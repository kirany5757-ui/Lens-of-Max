"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { photos } from "./photosData";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { gridContainer, getGridItem, getModalSlideVariants, modalTransition } from "./animations";
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
  const [filterMode, setFilterMode] = useState<"OR" | "AND">("OR");
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  
  // 1. The direction state for the slider
  const [direction, setDirection] = useState(1);

  // 1. Check if the user prefers reduced motion
  const shouldReduceMotion = useReducedMotion();

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
    return () => {
      clearTimeout(fadeTimer);
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setShuffledPhotos(shuffleEngine(photosWithAspect));
  };

  const handleTagClick = (tag: string) => {
    if (activeTags.includes(tag)) {
      setActiveTags(activeTags.filter((t) => t !== tag));
    } else {
      setActiveTags([...activeTags, tag]);
    }
    setSearch("");
  };

  const filtered = shuffledPhotos.filter(photo => {
  if (!photo.isMain) return false;
  
  const matchSearch = search === "" || 
    photo.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
    
  const matchTags = activeTags.length === 0 || (
    filterMode === "OR" 
      ? activeTags.some((t) => photo.tags.includes(t))
      : activeTags.every((t) => photo.tags.includes(t))
  );
  
  return matchSearch && matchTags;
});

// 2. The swipe navigation handlers
  const goNext = useCallback((e?: React.MouseEvent | React.TouchEvent | KeyboardEvent) => {
    if (e && 'stopPropagation' in e) e.stopPropagation();
    if (!selectedPhoto) return;
    const i = filtered.findIndex(p => p.id === selectedPhoto.id);
    setDirection(1);
    setSelectedPhoto(filtered[(i + 1) % filtered.length]);
  }, [selectedPhoto, filtered]);

  const goPrev = useCallback((e?: React.MouseEvent | React.TouchEvent | KeyboardEvent) => {
    if (e && 'stopPropagation' in e) e.stopPropagation();
    if (!selectedPhoto) return;
    const i = filtered.findIndex(p => p.id === selectedPhoto.id);
    setDirection(-1);
    setSelectedPhoto(filtered[(i - 1 + filtered.length) % filtered.length]);
  }, [selectedPhoto, filtered]);

// Keyboard Navigation for Modal
  useEffect(() => {
    if (!selectedPhoto) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedPhoto(null);
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedPhoto, goNext, goPrev]);

  // Body Scroll Lock when Modal is Open
  useEffect(() => {
    document.body.style.overflow = selectedPhoto ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [selectedPhoto]);

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

        /* ── FIXED LEFT VERTICAL BRAND (Click to Shuffle) ── */
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
          cursor: pointer;
          opacity: 0;
          transition: opacity 0.8s ease 0.9s, color 0.2s ease;
        }
        .vertical-brand:hover { color: #fff; }
        .vertical-brand.visible { opacity: 1; }

        /* ── ARCHITECTURAL CORNER TAPE / SPLIT ACCENT LINES ── */
        .accent-line-top-left, .accent-line-bottom-left,
        .accent-line-top-right, .accent-line-bottom-right {
          position: fixed;
          width: 5px;
          background: rgba(232, 228, 220, 0.6);
          z-index: 39;
          pointer-events: none;
        }
          
        .accent-line-top-left.visible, .accent-line-bottom-left.visible,
        .accent-line-top-right.visible, .accent-line-bottom-right.visible {
          opacity: 1;
        }

        .accent-line-top-left { top: 0; left: 36px; height: calc(100vh - 540px); }
        .accent-line-bottom-left { bottom: 0; left: 36px; height: 90px; }
        .accent-line-top-right { top: 0; right: 40px; height: calc(100vh - 600px); }
        .accent-line-bottom-right { bottom: 0; right: 40px; height: 480px; }

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
          opacity: 0;
          transition: opacity 0.8s ease 0.9s;
        }
        .vertical-nav.visible { opacity: 1; }

        .hidden-dove {
          position: fixed;
          right: 38px;
          top: calc(50% + 2px);
          font-size: 1px;
          line-height: 1;
          opacity: 0;
          z-index: 41;
          user-select: none;
          pointer-events: none;
          transition: opacity 0.8s ease 0.9s;
        }
        .hidden-dove.visible { opacity: 0.2; }

.nav-buttons {
  background: #080807; 
  padding: 20px 0; 
  position: relative;
  z-index: 10; 
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 30px; /* Adjust this number to make the gap bigger or smaller */
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

        .nav-brand { display: none; }
        .mobile-dove { display: none; }
        
        /* ── RESPONSIVE BREAKPOINT ALIGNED TO 1100px ── */
        @media (max-width: 1100px) {
          .vertical-brand { display: none; }
          .accent-line-top-left, .accent-line-bottom-left,
          .accent-line-top-right, .accent-line-bottom-right, .hidden-dove { display: none; }
          
          .nav-brand {
            display: block;
            font-family: 'Cormorant Garamond', serif;
            font-size: 22px;
            font-weight: 300;
            letter-spacing: 0.2em;
            color: #e8e4dc;
            white-space: nowrap;
            cursor: pointer;
          }

          .mobile-dove {
            display: inline-block;
            font-size: 2px;
            opacity: 0.1;
            user-select: none;
            pointer-events: none;
          }

          .vertical-nav {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            transform: none;
            background: rgba(8, 8, 7, 0.95);
            backdrop-filter: blur(10px);
            padding: 14px 20px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 1px solid rgba(255, 255, 255, 0.06);
            z-index: 80;
            opacity: 1;
            gap: 16px;
          }
          .nav-buttons {
            display: flex;
            align-items: center;
            gap: 16px;
          }
          .vertical-nav button {
            letter-spacing: 0.15em;
          }
        }

        /* ── MAIN CONTAINER ── */
        .main-container {
          max-width: 1440px;
          margin: 0 auto;
          padding: 60px 46px 120px;
        }
        @media (max-width: 1100px) {
          .main-container { padding: 90px 24px 80px; }
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
        .card {
          cursor: none;
          position: relative;
          overflow: hidden;
          border-radius: 2px;
          background: #141412;
          margin-bottom: 20px;
          break-inside: avoid;
        }
        .card:focus-visible {
          outline: 2px solid rgba(232, 228, 220, 0.6);
          outline-offset: 2px;
        }
        .card img {
          width: 100%; display: block; object-fit: cover;
          filter: grayscale(15%) brightness(0.9);
          transition: transform 0.7s cubic-bezier(0.25,0.46,0.45,0.94), filter 0.5s ease;
        }
        .card:hover img, .card:focus-visible img { transform: scale(1.04); filter: grayscale(0%) brightness(1.02); }
        .card-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.1) 60%, transparent 100%);
          opacity: 0; transition: opacity 0.35s ease;
          display: flex; flex-direction: column; justify-content: flex-end;
          padding: 20px 16px 14px;
        }
        .card:hover .card-overlay, .card:focus-visible .card-overlay { opacity: 1; }
        .card-story {
          font-family: 'Cormorant Garamond', serif;
          font-style: italic; font-size: 14px;
          color: #e8e4dc; line-height: 1.45; margin-bottom: 4px;
          transform: translateY(6px); transition: transform 0.35s ease;
        }
        .card:hover .card-story, .card:focus-visible .card-story { transform: translateY(0); }
        .card-tags {
          display: flex; gap: 6px; flex-wrap: wrap;
          transform: translateY(6px); transition: transform 0.35s ease 0.05s;
        }
        .card:hover .card-tags, .card:focus-visible .card-tags { transform: translateY(0); }
        .card-tag { font-size: 9px; letter-spacing: 0.15em; color: #888; text-transform: uppercase; }
        .card-tag::before { content: "#"; }

        /* ── CUSTOM CAMERA CURSOR & TOUCH HARDENING ── */
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

        @media (hover: none) and (pointer: coarse) {
          .camera-cursor { display: none !important; }
        }

        /* ── MODAL VIEWER ── */
        .modal-backdrop {
          position: fixed; inset: 0;
          background: rgba(5,5,4,0.98);
          display: flex; align-items: center; justify-content: center;
          padding: 32px; z-index: 100;
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
        .related-thumb:hover, .related-thumb:focus-visible { filter: brightness(1) grayscale(0%); transform: scale(1.03); border-color: #666; outline: none; }
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

{/* --- CINEMATIC SIGNATURE EXPAND INTRO --- */}
      {introMounted && (
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: introVisible ? 1 : 0 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          onAnimationComplete={() => {
            if (!introVisible) setIntroMounted(false);
          }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            backgroundColor: "#080807",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: introVisible ? "auto" : "none",
            textAlign: "center",
          }}
        >
          {/* The expanding center line anchor */}
          <motion.div
            initial={{ scaleX: 0, opacity: 1 }}
            animate={{ scaleX: introVisible ? 1 : 0, opacity: introVisible ? 1 : 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
            style={{
              width: "140px",
              height: "1px",
              backgroundColor: "rgba(232, 228, 220, 0.4)",
              transformOrigin: "center",
              marginBottom: "16px",
            }}
          />

          {/* "Lens of Max" expanding and fading in */}
          <motion.h1
            initial={{ scale: 0.92, opacity: 0, y: 10 }}
            animate={{ 
              scale: introVisible ? 1 : 1.03, 
              opacity: introVisible ? 1 : 0, 
              y: introVisible ? 0 : -10 
            }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.3 }}
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "clamp(48px, 8vw, 96px)",
              fontWeight: 300,
              letterSpacing: "0.05em",
              color: "#e8e4dc",
              lineHeight: 1,
              marginBottom: "12px",
            }}
          >
            Lens of Max
          </motion.h1>

          {/* Tagline: "The beauty of my camera's wink" */}
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: introVisible ? 1 : 0, y: introVisible ? 0 : -8 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.45 }}
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontStyle: "italic",
              fontSize: "17px",
              color: "#7a7770",
            }}
          >
            The beauty of my camera&apos;s wink
          </motion.p>
        </motion.div>
      )}

      <div className={`page ${loaded ? "visible" : ""}`}>
       {/* ── SPLIT ACCENT LINES FRAMING BOTH SIDES ── */}
        <motion.div 
          initial={{ scaleY: 0, opacity: 0 }}
          animate={{ scaleY: introVisible ? 0 : 1, opacity: introVisible ? 0 : 0.6 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
          style={{ transformOrigin: "top" }}
          className="accent-line-top-left" 
        />
        <motion.div 
          initial={{ scaleY: 0, opacity: 0 }}
          animate={{ scaleY: introVisible ? 0 : 1, opacity: introVisible ? 0 : 0.6 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
          style={{ transformOrigin: "bottom" }}
          className="accent-line-bottom-left" 
        />
        <motion.div 
          initial={{ scaleY: 0, opacity: 0 }}
          animate={{ scaleY: introVisible ? 0 : 1, opacity: introVisible ? 0 : 0.6 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
          style={{ transformOrigin: "top" }}
          className="accent-line-top-right" 
        />
        <motion.div 
          initial={{ scaleY: 0, opacity: 0 }}
          animate={{ scaleY: introVisible ? 0 : 1, opacity: introVisible ? 0 : 0.6 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
          style={{ transformOrigin: "bottom" }}
          className="accent-line-bottom-right" 
        />

        {/* ── FIXED LEFT VERTICAL BRAND (Desktop Only) ── */}
        <div 
          className={`vertical-brand ${!introVisible ? "visible" : ""}`}
          onClick={handleRefresh}
          title="Click to reshuffle moments"
        >
          Lens of Max
        </div>

        {/* ── FIXED RIGHT VERTICAL NAV & SIBLING DOVE (Synchronized Fade) ── */}
        <nav className={`vertical-nav ${!introVisible ? "visible" : ""}`}>
          <div 
            className="nav-brand"
            onClick={handleRefresh}
            title="Click to reshuffle moments"
          >
            Lens of Max
          </div>
          <div className="nav-buttons">
            <motion.button 
  onClick={() => setNavOpen(!navOpen)}
  layout
  transition={{ duration: 0.3, ease: "easeInOut" }}
>
  <AnimatePresence mode="wait" initial={false}>
    <motion.span
      key={navOpen ? "close" : "nav"}
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      transition={{ duration: 0.2 }}
      style={{ display: "inline-block" }}
    >
      {navOpen ? "CLOSE" : `NAV${activeTags.length > 0 ? ` (${activeTags.length})` : ""}`}
    </motion.span>
  </AnimatePresence>
</motion.button>
            <span className="mobile-dove">🕊️</span>
            <button onClick={() => { setActiveTags([]); setSearch(""); }}>ALL</button>
          </div>
        </nav>
        <span className={`hidden-dove ${!introVisible ? "visible" : ""}`}>🕊️</span>

        {/* ── MAIN SCROLLABLE CONTENT ── */}
        <main className="main-container">
          <section className="gallery-section">
            {filtered.length === 0 ? (
              <div className="empty">No moments found</div>
            ) : (
              <motion.div 
  style={{ columnCount: numCols, columnGap: '20px' }}
  variants={gridContainer}
  initial="hidden"
  animate="show"
>
                {filtered.map((photo, index) => (
<motion.div
        key={photo.id}
        className="card"
        variants={getGridItem(!!shouldReduceMotion)}
        layout
        whileHover={shouldReduceMotion ? {} : { scale: 1.02 }}
        whileFocus={shouldReduceMotion ? {} : { scale: 1.02 }}
        tabIndex={0}
        onClick={() => setSelectedPhoto(photo)}                    onKeyDown={(e) => {
                      if (e.key === 'Enter') setSelectedPhoto(photo);
                    }}
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
                      priority={index < 6}
                      sizes="(max-width: 768px) 100vw, (max-width: 1100px) 50vw, 33vw"
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
                  </motion.div>
                ))}
              </motion.div>
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
              <button className="nav-drawer-close" aria-label="Close filters" onClick={() => setNavOpen(false)}>CLOSE ✕</button>
            </div>

            {/* Staggered container */}
            <motion.div 
              className="nav-tags-grid"
              initial="hidden"
              animate="show"
              variants={{
                hidden: { opacity: 0 },
                show: {
                  opacity: 1,
                  transition: { staggerChildren: 0.03, delayChildren: 0.05 }
                }
              }}
            >
              {/* "All Moments" pill */}
              <motion.button
                variants={{
                  hidden: { opacity: 0, y: 12 },
                  show: { opacity: 1, y: 0, transition: { duration: 0.3 } }
                }}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                className={`nav-tag-pill ${activeTags.length === 0 ? "active" : ""}`}
                onClick={() => { setActiveTags([]); setNavOpen(false); }}
              >
                All Moments
              </motion.button>

              {/* Tag pills */}
              {allTags.map((tag) => (
                <motion.button
                  key={tag}
                  variants={{
                    hidden: { opacity: 0, y: 12 },
                    show: { opacity: 1, y: 0, transition: { duration: 0.3 } }
                  }}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  className={`nav-tag-pill ${activeTags.includes(tag) ? "active" : ""}`}
                  onClick={(e) => { 
                    if (e.metaKey || e.ctrlKey) {
                      setFilterMode("AND");
                    } else {
                      setFilterMode("OR");
                    }
                    handleTagClick(tag); 
                    setNavOpen(false); 
                  }}
                >
                  #{tag}
                </motion.button>
              ))}
            </motion.div>
          </div>
        </div>
      )}

      {/* ── CUSTOM CAMERA CURSOR ── */}
      <div ref={cursorRef} className={`camera-cursor ${cursor.visible ? "" : "hidden"}`}>
        <span className="camera-cursor-icon">📷</span>
      </div>

{/* --- MODAL VIEWER --- */}
<AnimatePresence>
  {selectedPhoto && (
    <motion.div 
      className="modal-backdrop" 
      onClick={() => setSelectedPhoto(null)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <button
        className="modal-float-btn modal-prev-btn"
        aria-label="Previous photo"
        onClick={goPrev}
      >
        ‹
      </button>

      <button
        className="modal-float-btn modal-next-btn"
        aria-label="Next photo"
        onClick={goNext}
      >
        ›
      </button>

      {/* --- THE MAIN MODAL CONTENT --- */}
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        
        {/* 1. The Sliding Image Wrapper using your imported variants */}
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={selectedPhoto.id}
            custom={direction}
            variants={getModalSlideVariants(!!shouldReduceMotion)}
            initial="enter"
            animate="center"
            exit="exit"
            transition={modalTransition}
            
            // The swipe physics        
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={(e, info) => {
              if (info.offset.x < -80) goNext();
              else if (info.offset.x > 80) goPrev();
            }}
            style={{ display: "flex", justifyContent: "center", touchAction: "pan-y", cursor: "grab" }}
          >
            {/* The actual Next.js Image with Cursor Tracking */}
            <Image 
              className="modal-main-img"
              src={selectedPhoto.image}
              alt={selectedPhoto.story}
              width={1200}
              height={800}
              quality={100}
              sizes="(max-width: 768px) 100vw, 70vw"
              draggable={false} // Prevents default browser image ghost-dragging
              onMouseMove={(e) => {
                if (cursorRef.current) {
                  cursorRef.current.style.transform = 
                    `translate(${e.clientX - 17}px, ${e.clientY - 17}px)`;
                }
              }}
              onMouseEnter={(e) => setCursor({ x: e.clientX, y: e.clientY, visible: true })}
              onMouseLeave={() => setCursor((prev) => ({ ...prev, visible: false }))}
            />
          </motion.div>
        </AnimatePresence>
        
        {/* 2. The Photo Info & Tags */}
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

            {/* 3. Related Photos Strip */}
            {getRelatedPhotos(selectedPhoto).length > 0 && (
              <div>
                <p className="related-label">same moment, different frame</p>
                <div className="related-strip">
                  {getRelatedPhotos(selectedPhoto).map((photo) => (
                    <Image
                      key={photo.id}
                      src={photo.image}
                      alt={photo.story}
                      width={80}
                      height={110}
                      className="related-thumb"
                      tabIndex={0}
                      style={{ cursor: 'none' }}
                      onClick={() => setSelectedPhoto(photo)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') setSelectedPhoto(photo);
                      }}
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

          {/* 4. Keyboard Navigation HUD & Close Button */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "14px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <span style={{ fontSize: "9px", letterSpacing: "0.2em", color: "#555", textTransform: "uppercase" }}>
              ← → navigate &bull; esc close
            </span>
            <button className="modal-close" aria-label="Close modal" onClick={() => setSelectedPhoto(null)} style={{ borderTop: "none", paddingTop: 0 }}>close ✕</button>
          </div>
        </div>

      </div>
    </motion.div>
  )}
</AnimatePresence>
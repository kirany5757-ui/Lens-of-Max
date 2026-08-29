"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { photos } from "./photosData";
import { motion, AnimatePresence, useReducedMotion, useSpring } from "framer-motion";
import { gridContainer, getGridItem, getModalSlideVariants, modalTransition } from "./animations";
import ShaderBackground from "./ShaderBackground";

type Photo = {
  id: number;
  image: string;
  story: string;
  tags: string[];
  group: string;
  isMain: boolean;
  aspect?: number;
};

const photosWithAspect: Photo[] = photos.map((p) => ({
  ...p,
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
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [filterMode, setFilterMode] = useState<"OR" | "AND">("OR");
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [direction, setDirection] = useState(1);
  const shouldReduceMotion = useReducedMotion();
  const [navOpen, setNavOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [introVisible, setIntroVisible] = useState(true);
  const [introMounted, setIntroMounted] = useState(true);
  const cursorX = useSpring(0, { stiffness: 300, damping: 25 });
  const cursorY = useSpring(0, { stiffness: 300, damping: 25 });
  const [cursorVisible, setCursorVisible] = useState(false);
  const numCols = useNumCols();

  useEffect(() => {
    setMounted(true);
    // Use requestAnimationFrame instead of a setTimeout hack
    const raf = requestAnimationFrame(() => setLoaded(true));
    const fadeTimer = setTimeout(() => setIntroVisible(false), 1600);
    return () => {
      cancelAnimationFrame(raf);
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
        if (arr.length % b === 0) { batchSize = b; break; }
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
    if (mounted) setShuffledPhotos(shuffleEngine(photosWithAspect));
  }, [mounted, shuffleEngine]);

  const handleRefresh = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setShuffledPhotos(shuffleEngine(photosWithAspect));
  };

  const handleTagClick = (tag: string) => {
    setActiveTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const filtered = shuffledPhotos.filter((photo) => {
    if (!photo.isMain) return false;
    const matchTags =
      activeTags.length === 0 ||
      (filterMode === "OR"
        ? activeTags.some((t) => photo.tags.includes(t))
        : activeTags.every((t) => photo.tags.includes(t)));
    return matchTags;
  });

  // Swipe / arrow navigation
  const goNext = useCallback(
    (e?: React.MouseEvent | React.TouchEvent | KeyboardEvent) => {
      if (e && "stopPropagation" in e) e.stopPropagation();
      if (!selectedPhoto) return;
      const i = filtered.findIndex((p) => p.id === selectedPhoto.id);
      setDirection(1);
      setSelectedPhoto(filtered[(i + 1) % filtered.length]);
    },
    [selectedPhoto, filtered]
  );

  const goPrev = useCallback(
    (e?: React.MouseEvent | React.TouchEvent | KeyboardEvent) => {
      if (e && "stopPropagation" in e) e.stopPropagation();
      if (!selectedPhoto) return;
      const i = filtered.findIndex((p) => p.id === selectedPhoto.id);
      setDirection(-1);
      setSelectedPhoto(filtered[(i - 1 + filtered.length) % filtered.length]);
    },
    [selectedPhoto, filtered]
  );

  // Keyboard navigation
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

  // Body scroll lock when modal is open
  useEffect(() => {
    document.body.style.overflow = selectedPhoto ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [selectedPhoto]);

  // Current photo index for modal counter
  const currentIndex = selectedPhoto
    ? filtered.findIndex((p) => p.id === selectedPhoto.id)
    : -1;

  return (
    <>
      <ShaderBackground />
      {/* ── CINEMATIC INTRO ── */}
      {introMounted && (
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: introVisible ? 1 : 0 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          onAnimationComplete={() => { if (!introVisible) setIntroMounted(false); }}
          style={{
            position: "fixed", inset: 0, zIndex: 9999,
            backgroundColor: "#080807",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            pointerEvents: introVisible ? "auto" : "none",
            textAlign: "center",
          }}
        >
          <motion.div
            initial={{ scaleX: 0, opacity: 1 }}
            animate={{ scaleX: introVisible ? 1 : 0, opacity: introVisible ? 1 : 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
            style={{
              width: "140px", height: "1px",
              backgroundColor: "rgba(232, 228, 220, 0.4)",
              transformOrigin: "center", marginBottom: "16px",
            }}
          />
          <motion.h1
            initial={{ scale: 0.92, opacity: 0, y: 10 }}
            animate={{ scale: introVisible ? 1 : 1.03, opacity: introVisible ? 1 : 0, y: introVisible ? 0 : -10 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.3 }}
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "clamp(48px, 8vw, 96px)",
              fontWeight: 300, letterSpacing: "0.05em",
              color: "#e8e4dc", lineHeight: 1, marginBottom: "12px",
            }}
          >
            Lens of Max
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: introVisible ? 1 : 0, y: introVisible ? 0 : -8 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.45 }}
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontStyle: "italic", fontSize: "17px", color: "#7a7770",
            }}
          >
            The beauty of my camera&apos;s wink
          </motion.p>
        </motion.div>
      )}

      <div className={`page ${loaded ? "visible" : ""}`}>
        {/* ── SPLIT ACCENT LINES ── */}
        <motion.div initial={{ scaleY: 0, opacity: 0 }} animate={{ scaleY: introVisible ? 0 : 1, opacity: introVisible ? 0 : 0.6 }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.2 }} style={{ transformOrigin: "top" }} className="accent-line-top-left" />
        <motion.div initial={{ scaleY: 0, opacity: 0 }} animate={{ scaleY: introVisible ? 0 : 1, opacity: introVisible ? 0 : 0.6 }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.3 }} style={{ transformOrigin: "bottom" }} className="accent-line-bottom-left" />
        <motion.div initial={{ scaleY: 0, opacity: 0 }} animate={{ scaleY: introVisible ? 0 : 1, opacity: introVisible ? 0 : 0.6 }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.2 }} style={{ transformOrigin: "top" }} className="accent-line-top-right" />
        <motion.div initial={{ scaleY: 0, opacity: 0 }} animate={{ scaleY: introVisible ? 0 : 1, opacity: introVisible ? 0 : 0.6 }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.3 }} style={{ transformOrigin: "bottom" }} className="accent-line-bottom-right" />

        {/* ── FIXED LEFT VERTICAL BRAND (Desktop Only) ── */}
        <div
          className={`vertical-brand ${!introVisible ? "visible" : ""}`}
          onClick={handleRefresh}
          title="Click to reshuffle moments"
        >
          Lens of Max
        </div>

        {/* ── FIXED RIGHT VERTICAL NAV ── */}
        <nav className={`vertical-nav ${!introVisible ? "visible" : ""}`}>
          <div className="nav-brand" onClick={handleRefresh} title="Click to reshuffle moments">
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
            <button onClick={() => { setActiveTags([]); }}>ALL</button>
          </div>
        </nav>
        <span className={`hidden-dove ${!introVisible ? "visible" : ""}`}>🕊️</span>

        {/* ── MAIN GALLERY ── */}
        <main className="main-container">
          <section className="gallery-section">
            {filtered.length === 0 ? (
              <div className="empty">No moments found</div>
            ) : (
              <motion.div
                style={{ columnCount: numCols, columnGap: "20px" }}
                variants={gridContainer}
                initial="hidden"
                animate="show"
              >
                {filtered.map((photo, index) => (
                  <motion.div
                    key={photo.id}
                    className="card"
                    variants={getGridItem(!!shouldReduceMotion)}
                    whileHover={shouldReduceMotion ? {} : { scale: 1.02 }}
                    whileFocus={shouldReduceMotion ? {} : { scale: 1.02 }}
                    tabIndex={0}
                    onClick={() => setSelectedPhoto(photo)}
                    onKeyDown={(e) => { if (e.key === "Enter") setSelectedPhoto(photo); }}
                    onMouseMove={(e) => {
                      cursorX.set(e.clientX - 14);
                      cursorY.set(e.clientY - 14);
                    }}
                    onMouseEnter={() => setCursorVisible(true)}
                    onMouseLeave={() => setCursorVisible(false)}
                  >
                    <Image
                      src={photo.image}
                      alt={photo.story || `${photo.group} - ${photo.tags.join(", ")}` || "Lens of Max Photography"}
                      width={1000}
                      height={800}
                      quality={100}
                      priority={index < 6}
                      sizes="(max-width: 768px) 100vw, (max-width: 1100px) 50vw, 33vw"
                      style={{ width: "100%", height: "auto", display: "block" }}
                    />
                    <div className="card-overlay">
                      {photo.story && <p className="card-story">{photo.story}</p>}
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

      {/* ── NAV DRAWER ── */}
      {navOpen && (
        <div className="nav-drawer" onClick={() => setNavOpen(false)}>
          <div className="nav-drawer-content" onClick={(e) => e.stopPropagation()}>
            <div className="nav-drawer-header">
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <span className="nav-drawer-title">Filter by Tags</span>
                {activeTags.length > 1 && (
                  <span style={{ fontSize: "10px", letterSpacing: "0.2em", color: "#555" }}>
                    Mode: {filterMode} &nbsp;·&nbsp; Cmd+Click to toggle AND
                  </span>
                )}
              </div>
              <button className="nav-drawer-close" aria-label="Close filters" onClick={() => setNavOpen(false)}>
                CLOSE ✕
              </button>
            </div>

            <motion.div
              className="nav-tags-grid"
              initial="hidden"
              animate="show"
              variants={{
                hidden: { opacity: 0 },
                show: { opacity: 1, transition: { staggerChildren: 0.03, delayChildren: 0.05 } },
              }}
            >
              <motion.button
                variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } }}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                className={`nav-tag-pill ${activeTags.length === 0 ? "active" : ""}`}
                onClick={() => { setActiveTags([]); setNavOpen(false); }}
              >
                All Moments
              </motion.button>

              {allTags.map((tag) => (
                <motion.button
                  key={tag}
                  variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } }}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  className={`nav-tag-pill ${activeTags.includes(tag) ? "active" : ""}`}
                  onClick={(e) => {
                    setFilterMode(e.metaKey || e.ctrlKey ? "AND" : "OR");
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
      <motion.div
        className={`camera-cursor ${cursorVisible ? "" : "hidden"}`}
        style={{ x: cursorX, y: cursorY }}
      >
        <span className="camera-cursor-icon">📷</span>
      </motion.div>

      {/* ── MODAL VIEWER ── */}
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div
            className="modal-backdrop"
            onClick={() => setSelectedPhoto(null)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button className="modal-float-btn modal-prev-btn" aria-label="Previous photo" onClick={goPrev}>‹</button>
            <button className="modal-float-btn modal-next-btn" aria-label="Next photo" onClick={goNext}>›</button>

            <div className="modal" onClick={(e) => e.stopPropagation()}>
              {/* Sliding Image */}
              <AnimatePresence custom={direction}>
                <motion.div
                  key={selectedPhoto.id}
                  custom={direction}
                  variants={getModalSlideVariants(!!shouldReduceMotion)}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={modalTransition}
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.2}
                  onDragEnd={(_, info) => {
                    if (info.offset.x < -80) goNext();
                    else if (info.offset.x > 80) goPrev();
                  }}
                  style={{ display: "flex", justifyContent: "center", touchAction: "pan-y", cursor: "grab", width: "100%" }}
                >
                  <Image
                    className="modal-main-img"
                    src={selectedPhoto.image}
                    alt={selectedPhoto.story || `${selectedPhoto.group} - ${selectedPhoto.tags.join(", ")}` || "Lens of Max Photography"}
                    width={1400}
                    height={950}
                    quality={100}
                    sizes="(max-width: 768px) 100vw, 75vw"
                    draggable={false}
                    onMouseMove={(e) => {
                      cursorX.set(e.clientX - 17);
                      cursorY.set(e.clientY - 17);
                    }}
                    onMouseEnter={() => setCursorVisible(true)}
                    onMouseLeave={() => setCursorVisible(false)}
                  />
                </motion.div>
              </AnimatePresence>

              {/* Photo Info */}
              <div className="modal-info">
                <div>
                  {/* Photo counter */}
                  <p className="modal-counter">
                    {currentIndex + 1} / {filtered.length}
                  </p>
                  {selectedPhoto.story && (
                    <p className="modal-story" style={{ marginTop: "12px" }}>{selectedPhoto.story}</p>
                  )}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  <div className="modal-tags">
                    {selectedPhoto.tags.map((tag) => (
                      <button
                        key={tag}
                        className="modal-tag-btn"
                        onClick={() => { setActiveTags([tag]); setSelectedPhoto(null); }}
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>

                  {/* Related Photos Strip */}
                  {getRelatedPhotos(selectedPhoto).length > 0 && (
                    <div>
                      <p className="related-label">same moment, different frame</p>
                      <div className="related-strip">
                        {getRelatedPhotos(selectedPhoto).map((photo) => (
                          <Image
                            key={photo.id}
                            src={photo.image}
                            alt={photo.story || `Related photo: ${photo.group}`}
                            width={80}
                            height={110}
                            className="related-thumb"
                            tabIndex={0}
                            style={{ cursor: "none" }}
                            onClick={() => setSelectedPhoto(photo)}
                            onKeyDown={(e) => { if (e.key === "Enter") setSelectedPhoto(photo); }}
                            onMouseMove={(e) => {
                              cursorX.set(e.clientX - 14);
                              cursorY.set(e.clientY - 14);
                            }}
                            onMouseEnter={() => setCursorVisible(true)}
                            onMouseLeave={() => setCursorVisible(false)}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <button className="modal-close" aria-label="Close modal" onClick={() => setSelectedPhoto(null)}>
                  close ✕
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

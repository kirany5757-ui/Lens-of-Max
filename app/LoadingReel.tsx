'use client';
import { useState, useEffect } from 'react';

export default function LoadingReel() {
  const [phase, setPhase] = useState('spinning'); 

  useEffect(() => {
    // Spin for 1.5 seconds, then trigger the "click" and expand
    const clickTimer = setTimeout(() => setPhase('clicking'), 1500);
    // Remove the component completely after the animation finishes
    const doneTimer = setTimeout(() => setPhase('done'), 2200);
    
    return () => { 
      clearTimeout(clickTimer); 
      clearTimeout(doneTimer); 
    };
  }, []);

  if (phase === 'done') return null;

  return (
    <div className={`reel-overlay ${phase === 'clicking' ? 'fade-out' : ''}`}>
      {/* The Shutter Flash Effect */}
      <div className={`shutter-flash ${phase === 'clicking' ? 'flash' : ''}`}></div>
      
      {/* The Spinning Reel */}
      <div className={`reel-icon ${phase === 'clicking' ? 'expand' : ''}`}></div>

      <style>{`
        .reel-overlay {
          position: fixed; inset: 0;
          background-color: #0a0a0a;
          z-index: 9999;
          display: flex; justify-content: center; align-items: center;
          transition: background-color 0.6s ease;
        }
        .reel-overlay.fade-out {
          background-color: transparent;
          pointer-events: none;
        }

        /* The Film Reel Design */
        .reel-icon {
          width: 64px; height: 64px;
          border-radius: 50%;
          border: 8px dashed #e8e4dc;
          position: relative;
          animation: spin 1.5s linear infinite;
          transition: transform 0.6s cubic-bezier(0.8, 0, 0.2, 1), opacity 0.5s ease;
        }
        .reel-icon::before {
          content: "";
          position: absolute; inset: 8px;
          border-radius: 50%;
          border: 3px solid #e8e4dc;
        }
        .reel-icon::after {
          content: "";
          position: absolute; inset: 20px;
          border-radius: 50%;
          background: #e8e4dc;
        }

        /* The Snap and Expand */
        .reel-icon.expand {
          animation: none; /* Stop spinning */
          transform: scale(40); /* Expand massively so user falls through the center */
          opacity: 0;
        }

        /* The White Camera Flash */
        .shutter-flash {
          position: absolute; inset: 0;
          background-color: white;
          opacity: 0;
          z-index: 10000;
          pointer-events: none;
        }
        .shutter-flash.flash {
          animation: flashAnim 0.4s ease-out forwards;
        }

        @keyframes spin { 
          100% { transform: rotate(360deg); } 
        }
        @keyframes flashAnim {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
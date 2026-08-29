import { Variants, Transition } from "framer-motion";

// 1. Staggered grid container rules
export const gridContainer: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.04 }
  }
};

// 2. Individual grid item reveal rules
export const getGridItem = (shouldReduceMotion: boolean): Variants => ({
  hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
});

// 3. Modal directional slider variants (respecting reduced motion)
export const getModalSlideVariants = (shouldReduceMotion: boolean): Variants => ({
  enter: (dir: number) => ({
    x: shouldReduceMotion ? 0 : (dir > 0 ? 60 : -60),
    opacity: 0
  }),
  center: { 
    x: 0, 
    opacity: 1 
  },
  exit: (dir: number) => ({
    x: shouldReduceMotion ? 0 : (dir > 0 ? -60 : 60),
    opacity: 0
  })
});

// 4. Modal transition timing
export const modalTransition: Transition = { duration: 0.25, ease: "easeInOut" };
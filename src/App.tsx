import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { Home } from './routes/Home';
import { Lobby } from './routes/Lobby';
import { Game } from './routes/Game';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

function SkipLink() {
  return (
    <a
      href="#main-content"
      className="skip-link"
      aria-label="Skip to main content"
      onClick={(e) => {
        e.preventDefault();
        const main = document.getElementById('main-content');
        if (main) {
          main.focus({ preventScroll: false });
        }
      }}
    >
      Skip to main content
    </a>
  );
}

function AnimatedRoutes() {
  const location = useLocation();
  const reduceMotion = useReducedMotion();
  const transition = reduceMotion ? { duration: 0 } : { duration: 0.18, ease: 'easeOut' as const };

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        initial={reduceMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={reduceMotion ? { opacity: 1 } : { opacity: 0, y: -8 }}
        transition={transition}
        className="h-full"
      >
        <Routes location={location}>
          <Route path="/" element={<Home />} />
          <Route path="/lobby/:id" element={<Lobby />} />
          <Route path="/game/:gameId" element={<Game />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <SkipLink />
        <AnimatedRoutes />
      </HashRouter>
    </AuthProvider>
  );
}

export default App;

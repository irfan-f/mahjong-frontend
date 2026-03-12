import { HashRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { Home } from './routes/Home';
import { Lobby } from './routes/Lobby';
import { Game } from './routes/Game';
import { Learn } from './routes/Learn';

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
          (main as HTMLElement).focus({ preventScroll: false });
        }
      }}
    >
      Skip to main content
    </a>
  );
}

function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <SkipLink />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/lobby/:id" element={<Lobby />} />
          <Route path="/game/:gameId" element={<Game />} />
          <Route path="/learn" element={<Learn />} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
}

export default App;

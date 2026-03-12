import { HashRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { Home } from './routes/Home';
import { Lobby } from './routes/Lobby';
import { Game } from './routes/Game';

function SkipLink() {
  return (
    <a
      href="#main-content"
      className="skip-link"
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
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
}

export default App;

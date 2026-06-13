import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { JournalProvider } from './store/useJournalStore';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { GameDetail } from './pages/GameDetail';
import { NoteDetail } from './pages/NoteDetail';
import { ResetPassword } from './pages/ResetPassword';

import { PlaythroughDetail } from './pages/PlaythroughDetail';


function App() {
  return (
    <AuthProvider>
      <JournalProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="game/:gameId" element={<GameDetail />} />
              <Route path="game/:gameId/playthrough/:playthroughId" element={<PlaythroughDetail />} />
              <Route path="game/:gameId/playthrough/:playthroughId/note/:noteId" element={<NoteDetail />} />
              <Route path="reset-password" element={<ResetPassword />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </JournalProvider>
    </AuthProvider>
  );
}

export default App;

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { JournalProvider } from './store/useJournalStore';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { GameDetail } from './pages/GameDetail';
import { NoteDetail } from './pages/NoteDetail';

import { PlaythroughDetail } from './pages/PlaythroughDetail';


function App() {
  return (
    <JournalProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="game/:gameId" element={<GameDetail />} />
            <Route path="game/:gameId/playthrough/:playthroughId" element={<PlaythroughDetail />} />
            <Route path="game/:gameId/playthrough/:playthroughId/note/:noteId" element={<NoteDetail />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </JournalProvider>
  );
}

export default App;

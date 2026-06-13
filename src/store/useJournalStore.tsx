import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '../auth/AuthContext';
import type { Game, Note, Playthrough } from '../interfaces/models';
import { loadCloudGames, loadLocalGames, saveCloudGames, saveLocalGames } from '../services/journalRepository';
import { parseJournalData } from '../services/journalValidation';

type StorageMode = 'local' | 'cloud';
type SyncState = 'idle' | 'loading' | 'saving' | 'saved' | 'error';

interface JournalState {
  games: Game[];
  storageMode: StorageMode;
  syncState: SyncState;
  syncError: string | null;
  addGame: (game: Omit<Game, 'id' | 'playthroughs'>) => void;
  updateGame: (id: string, game: Partial<Omit<Game, 'id' | 'playthroughs'>>) => void;
  deleteGame: (id: string) => void;
  addPlaythrough: (gameId: string, playthrough: Omit<Playthrough, 'id' | 'gameId' | 'notes' | 'longestStreak'>) => void;
  updatePlaythrough: (gameId: string, playthroughId: string, data: Partial<Omit<Playthrough, 'id' | 'gameId' | 'notes'>>) => void;
  deletePlaythrough: (gameId: string, playthroughId: string) => void;
  addNote: (gameId: string, playthroughId: string, note: Omit<Note, 'id'>) => void;
  updateNote: (gameId: string, playthroughId: string, noteId: string, data: Partial<Omit<Note, 'id'>>) => void;
  deleteNote: (gameId: string, playthroughId: string, noteId: string) => void;
  importData: (gamesData: Game[]) => void;
  exportPlaythroughData: (gameId: string, playthroughId: string) => string;
  exportAllData: () => string;
  importAllData: (jsonData: string) => void;
}

const JournalContext = createContext<JournalState | undefined>(undefined);

const calculateStreak = (notes: Note[]) => {
  if (notes.length === 0) return 0;
  const sortedDates = Array.from(new Set(notes.map((note) => new Date(note.date).toISOString().split('T')[0]))).sort();
  if (sortedDates.length === 0) return 0;

  let longest = 1;
  let current = 1;
  for (let index = 1; index < sortedDates.length; index++) {
    const previousValue = sortedDates[index - 1];
    const currentValue = sortedDates[index];
    if (!previousValue || !currentValue) continue;
    const previous = new Date(previousValue);
    const currentDate = new Date(currentValue);
    const diffDays = Math.ceil(Math.abs(currentDate.getTime() - previous.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) {
      current += 1;
      longest = Math.max(longest, current);
    } else {
      current = 1;
    }
  }
  return longest;
};

export const JournalProvider = ({ children }: { children: ReactNode }) => {
  const { user, isPending } = useAuth();
  const [games, setGames] = useState<Game[]>(loadLocalGames);
  const [storageMode, setStorageMode] = useState<StorageMode>('local');
  const [syncState, setSyncState] = useState<SyncState>('idle');
  const [syncError, setSyncError] = useState<string | null>(null);
  const hydratedRef = useRef(true);
  const cloudReadyRef = useRef(false);
  const saveTimerRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (isPending) return;

    let cancelled = false;
    hydratedRef.current = false;
    window.clearTimeout(saveTimerRef.current);

    if (!user) {
      cloudReadyRef.current = false;
      setStorageMode('local');
      setGames(loadLocalGames());
      setSyncState('idle');
      setSyncError(null);
      hydratedRef.current = true;
      return;
    }

    setStorageMode('cloud');
    cloudReadyRef.current = false;
    setSyncState('loading');
    setSyncError(null);
    loadCloudGames()
      .then((cloudGames) => {
        if (cancelled) return;
        setGames(cloudGames);
        cloudReadyRef.current = true;
        setSyncState('saved');
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setStorageMode('local');
        setGames(loadLocalGames());
        setSyncState('error');
        setSyncError(error instanceof Error ? error.message : 'Cloud journal could not be loaded.');
      })
      .finally(() => {
        if (!cancelled) hydratedRef.current = true;
      });

    return () => {
      cancelled = true;
    };
  }, [isPending, user?.id]);

  useEffect(() => {
    if (!hydratedRef.current || isPending) return;

    if (storageMode === 'local') {
      saveLocalGames(games);
      return;
    }

    if (!cloudReadyRef.current) return;

    window.clearTimeout(saveTimerRef.current);
    setSyncState('saving');
    saveTimerRef.current = window.setTimeout(() => {
      saveCloudGames(games)
        .then(() => {
          setSyncState('saved');
          setSyncError(null);
        })
        .catch((error: unknown) => {
          setSyncState('error');
          setSyncError(error instanceof Error ? error.message : 'Cloud journal could not be saved.');
        });
    }, 700);

    return () => window.clearTimeout(saveTimerRef.current);
  }, [games, isPending, storageMode]);

  const addGame = (gameData: Omit<Game, 'id' | 'playthroughs'>) => {
    setGames((previous) => [{ ...gameData, id: uuidv4(), playthroughs: [] }, ...previous]);
  };

  const updateGame = (id: string, data: Partial<Omit<Game, 'id' | 'playthroughs'>>) => {
    setGames((previous) => previous.map((game) => game.id === id ? { ...game, ...data } : game));
  };

  const deleteGame = (id: string) => {
    setGames((previous) => previous.filter((game) => game.id !== id));
  };

  const addPlaythrough = (gameId: string, data: Omit<Playthrough, 'id' | 'gameId' | 'notes' | 'longestStreak'>) => {
    setGames((previous) => previous.map((game) => game.id === gameId ? {
      ...game,
      playthroughs: [{ ...data, id: uuidv4(), gameId, notes: [], longestStreak: 0 }, ...game.playthroughs],
    } : game));
  };

  const updatePlaythrough = (gameId: string, playthroughId: string, data: Partial<Omit<Playthrough, 'id' | 'gameId' | 'notes'>>) => {
    setGames((previous) => previous.map((game) => game.id === gameId ? {
      ...game,
      playthroughs: game.playthroughs.map((playthrough) => playthrough.id === playthroughId ? { ...playthrough, ...data } : playthrough),
    } : game));
  };

  const deletePlaythrough = (gameId: string, playthroughId: string) => {
    setGames((previous) => previous.map((game) => game.id === gameId ? {
      ...game,
      playthroughs: game.playthroughs.filter((playthrough) => playthrough.id !== playthroughId),
    } : game));
  };

  const addNote = (gameId: string, playthroughId: string, data: Omit<Note, 'id'>) => {
    setGames((previous) => previous.map((game) => {
      if (game.id !== gameId) return game;
      return {
        ...game,
        lastNoteDate: new Date().toISOString(),
        playthroughs: game.playthroughs.map((playthrough) => {
          if (playthrough.id !== playthroughId) return playthrough;
          const updatedNotes = [{ ...data, id: uuidv4() }, ...playthrough.notes];
          return { ...playthrough, notes: updatedNotes, longestStreak: calculateStreak(updatedNotes) };
        }),
      };
    }));
  };

  const updateNote = (gameId: string, playthroughId: string, noteId: string, data: Partial<Omit<Note, 'id'>>) => {
    setGames((previous) => previous.map((game) => game.id === gameId ? {
      ...game,
      playthroughs: game.playthroughs.map((playthrough) => {
        if (playthrough.id !== playthroughId) return playthrough;
        const updatedNotes = playthrough.notes.map((note) => note.id === noteId ? { ...note, ...data } : note);
        return { ...playthrough, notes: updatedNotes, longestStreak: calculateStreak(updatedNotes) };
      }),
    } : game));
  };

  const deleteNote = (gameId: string, playthroughId: string, noteId: string) => {
    setGames((previous) => previous.map((game) => game.id === gameId ? {
      ...game,
      playthroughs: game.playthroughs.map((playthrough) => {
        if (playthrough.id !== playthroughId) return playthrough;
        const updatedNotes = playthrough.notes.filter((note) => note.id !== noteId);
        return { ...playthrough, notes: updatedNotes, longestStreak: calculateStreak(updatedNotes) };
      }),
    } : game));
  };

  const importData = (importedGames: Game[]) => {
    setGames((previous) => {
      const merged = [...previous];
      importedGames.forEach((importedGame) => {
        const index = merged.findIndex((game) => game.id === importedGame.id);
        if (index >= 0) merged[index] = importedGame;
        else merged.unshift(importedGame);
      });
      return merged;
    });
  };

  const exportPlaythroughData = (gameId: string, playthroughId: string) => {
    const playthrough = games.find((game) => game.id === gameId)?.playthroughs.find((item) => item.id === playthroughId);
    return playthrough ? JSON.stringify(playthrough, null, 2) : '';
  };

  const exportAllData = () => JSON.stringify(games, null, 2);

  const importAllData = (json: string) => {
    const data = JSON.parse(json) as unknown;
    setGames(parseJournalData(data));
  };

  return (
    <JournalContext.Provider value={{
      games,
      storageMode,
      syncState,
      syncError,
      addGame,
      updateGame,
      deleteGame,
      addPlaythrough,
      updatePlaythrough,
      deletePlaythrough,
      addNote,
      updateNote,
      deleteNote,
      importData,
      exportPlaythroughData,
      exportAllData,
      importAllData,
    }}>
      {children}
    </JournalContext.Provider>
  );
};

export const useJournal = () => {
  const context = useContext(JournalContext);
  if (!context) throw new Error('useJournal must be used within JournalProvider');
  return context;
};

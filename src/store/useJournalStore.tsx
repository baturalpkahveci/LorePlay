import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { Game, Playthrough, Note } from '../interfaces/models';

interface JournalState {
  games: Game[];
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

const LOCAL_STORAGE_KEY = 'game-journal-data';

// Helper to generate UUID-like string since we might not actually have uuid package correctly typed or ready. 
// We did install uuid, so we can use it.
import { v4 as uuidv4 } from 'uuid';

export const JournalProvider = ({ children }: { children: ReactNode }) => {
  const [games, setGames] = useState<Game[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(games));
  }, [games]);

  const addGame = (gameData: Omit<Game, 'id' | 'playthroughs'>) => {
    const newGame: Game = {
      ...gameData,
      id: uuidv4(),
      playthroughs: []
    };
    setGames(prev => [newGame, ...prev]);
  };

  const updateGame = (id: string, data: Partial<Omit<Game, 'id' | 'playthroughs'>>) => {
    setGames(prev => prev.map(g => g.id === id ? { ...g, ...data } : g));
  };

  const deleteGame = (id: string) => {
    setGames(prev => prev.filter(g => g.id !== id));
  };

  // Kalkülasyon: longest streak hesaplama basiti
  const calculateStreak = (notes: Note[]) => {
    if (notes.length === 0) return 0;
    // Benzersiz tarihleri al ve sırala
    const sortedDates = Array.from(new Set(notes.map(n => new Date(n.date).toISOString().split('T')[0]))).sort();
    if (sortedDates.length === 0) return 0;
    
    let longest = 1;
    let current = 1;
    for (let i = 1; i < sortedDates.length; i++) {
      const prev = new Date(sortedDates[i-1]);
      const curr = new Date(sortedDates[i]);
      const diffTime = Math.abs(curr.getTime() - prev.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        current++;
        longest = Math.max(longest, current);
      } else {
        current = 1;
      }
    }
    return longest;
  };

  const addPlaythrough = (gameId: string, data: Omit<Playthrough, 'id' | 'gameId' | 'notes' | 'longestStreak'>) => {
    setGames(prev => prev.map(g => {
      if (g.id === gameId) {
        return {
          ...g,
          playthroughs: [{
            ...data,
            id: uuidv4(),
            gameId,
            notes: [],
            longestStreak: 0
          }, ...g.playthroughs]
        };
      }
      return g;
    }));
  };

  const updatePlaythrough = (gameId: string, playthroughId: string, data: Partial<Omit<Playthrough, 'id' | 'gameId' | 'notes'>>) => {
    setGames(prev => prev.map(g => {
      if (g.id === gameId) {
        return {
          ...g,
          playthroughs: g.playthroughs.map(p => p.id === playthroughId ? { ...p, ...data } : p)
        };
      }
      return g;
    }));
  };

  const deletePlaythrough = (gameId: string, playthroughId: string) => {
    setGames(prev => prev.map(g => {
      if (g.id === gameId) {
        return { ...g, playthroughs: g.playthroughs.filter(p => p.id !== playthroughId) };
      }
      return g;
    }));
  };

  const addNote = (gameId: string, playthroughId: string, data: Omit<Note, 'id'>) => {
    setGames(prev => prev.map(g => {
      if (g.id === gameId) {
        return {
          ...g,
          lastNoteDate: new Date().toISOString(),
          playthroughs: g.playthroughs.map(p => {
            if (p.id === playthroughId) {
              const updatedNotes = [{ ...data, id: uuidv4() }, ...p.notes];
              return { ...p, notes: updatedNotes, longestStreak: calculateStreak(updatedNotes) };
            }
            return p;
          })
        };
      }
      return g;
    }));
  };

  const updateNote = (gameId: string, playthroughId: string, noteId: string, data: Partial<Omit<Note, 'id'>>) => {
    setGames(prev => prev.map(g => {
      if (g.id === gameId) {
        return {
          ...g,
          playthroughs: g.playthroughs.map(p => {
            if (p.id === playthroughId) {
              const updatedNotes = p.notes.map(n => n.id === noteId ? { ...n, ...data } : n);
              return { ...p, notes: updatedNotes, longestStreak: calculateStreak(updatedNotes) };
            }
            return p;
          })
        };
      }
      return g;
    }));
  };

  const deleteNote = (gameId: string, playthroughId: string, noteId: string) => {
    setGames(prev => prev.map(g => {
      if (g.id === gameId) {
        return {
          ...g,
          playthroughs: g.playthroughs.map(p => {
            if (p.id === playthroughId) {
              const updatedNotes = p.notes.filter(n => n.id !== noteId);
              return { ...p, notes: updatedNotes, longestStreak: calculateStreak(updatedNotes) };
            }
            return p;
          })
        };
      }
      return g;
    }));
  };

  const importData = (importedGames: Game[]) => {
    // Basic merge based on game IDs
    setGames(prev => {
      const newGames = [...prev];
      importedGames.forEach(ig => {
        const existingGameIndex = newGames.findIndex(g => g.id === ig.id);
        if (existingGameIndex >= 0) {
          // just override for simplicity or try deep merge
          newGames[existingGameIndex] = ig;
        } else {
          newGames.unshift(ig);
        }
      });
      return newGames;
    });
  };

  const exportPlaythroughData = (gameId: string, playthroughId: string) => {
    const game = games.find(g => g.id === gameId);
    const playthrough = game?.playthroughs.find(p => p.id === playthroughId);
    if (!playthrough) return '';
    return JSON.stringify(playthrough, null, 2);
  };

  const exportAllData = () => {
    return JSON.stringify(games, null, 2);
  };

  const importAllData = (json: string) => {
    try {
      const data = JSON.parse(json);
      if (Array.isArray(data)) {
        setGames(data); // Overwrites previous state entirely
      } else {
        throw new Error('Import data is not a valid list of games');
      }
    } catch (err) {
      console.error('Failed to import data', err);
      throw err;
    }
  };

  return (
    <JournalContext.Provider value={{
      games, addGame, updateGame, deleteGame,
      addPlaythrough, updatePlaythrough, deletePlaythrough,
      addNote, updateNote, deleteNote,
      importData, exportPlaythroughData,
      exportAllData, importAllData
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

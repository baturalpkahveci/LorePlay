export interface Note {
  id: string;
  title: string;
  description?: string;
  date: string;
  color: string;
  tags: string[];
}

export type PlaythroughStatus = 'Playing' | 'Completed' | 'Dropped';

export interface Playthrough {
  id: string;
  gameId: string;
  title: string;
  description?: string;
  date: string;
  status: PlaythroughStatus;
  longestStreak: number;
  notes: Note[];
}

export interface Game {
  id: string;
  title: string;
  description?: string;
  coverImageUrl?: string;
  lastNoteDate?: string;
  playthroughs: Playthrough[];
}

export interface Stats {
  totalGames: number;
  totalPlaythroughs: number;
  totalNotes: number;
}

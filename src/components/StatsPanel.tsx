import React from 'react';
import { useJournal } from '../store/useJournalStore';
import { Gamepad2, PlaySquare, FileText } from 'lucide-react';

export const StatsPanel = () => {
  const { games } = useJournal();
  
  const totalGames = games.length;
  const totalPlaythroughs = games.reduce((acc, game) => acc + game.playthroughs.length, 0);
  const totalNotes = games.reduce((acc, game) => {
    return acc + game.playthroughs.reduce((pAcc, p) => pAcc + p.notes.length, 0);
  }, 0);

  return (
    <div className="flex bg-[var(--bg-surface)] p-4 rounded-xl border border-[var(--border-color)] gap-6 items-center shadow-lg w-fit">
      <div className="flex flex-col items-center">
        <div className="flex items-center gap-2 text-[var(--color-brand)] mb-1">
          <Gamepad2 size={20} />
          <span className="font-semibold text-sm">Games</span>
        </div>
        <span className="text-2xl font-bold text-[var(--text-primary)]">{totalGames}</span>
      </div>
      
      <div className="w-px h-10 bg-[var(--border-color)]"></div>
      
      <div className="flex flex-col items-center">
        <div className="flex items-center gap-2 text-[var(--color-success-custom)] mb-1">
          <PlaySquare size={20} />
          <span className="font-semibold text-sm">Plays</span>
        </div>
        <span className="text-2xl font-bold text-[var(--text-primary)]">{totalPlaythroughs}</span>
      </div>

      <div className="w-px h-10 bg-[var(--border-color)]"></div>
      
      <div className="flex flex-col items-center">
        <div className="flex items-center gap-2 text-[var(--color-warning-custom)] mb-1">
          <FileText size={20} />
          <span className="font-semibold text-sm">Notes</span>
        </div>
        <span className="text-2xl font-bold text-[var(--text-primary)]">{totalNotes}</span>
      </div>
    </div>
  );
};

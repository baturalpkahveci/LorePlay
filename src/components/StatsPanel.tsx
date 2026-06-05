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
    <div className="hidden md:flex items-center gap-1 rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)]/50 p-1">
      <div className="flex items-center gap-2 rounded-md px-3 py-2">
        <div className="text-[var(--color-brand)]">
          <Gamepad2 size={16} />
        </div>
        <span className="text-sm font-semibold text-[var(--text-primary)]">{totalGames}</span>
        <span className="text-xs text-[var(--text-secondary)]">Games</span>
      </div>

      <div className="h-6 w-px bg-[var(--border-color)]"></div>

      <div className="flex items-center gap-2 rounded-md px-3 py-2">
        <div className="text-[var(--color-success-custom)]">
          <PlaySquare size={16} />
        </div>
        <span className="text-sm font-semibold text-[var(--text-primary)]">{totalPlaythroughs}</span>
        <span className="text-xs text-[var(--text-secondary)]">Plays</span>
      </div>

      <div className="h-6 w-px bg-[var(--border-color)]"></div>

      <div className="flex items-center gap-2 rounded-md px-3 py-2">
        <div className="text-[var(--color-warning-custom)]">
          <FileText size={16} />
        </div>
        <span className="text-sm font-semibold text-[var(--text-primary)]">{totalNotes}</span>
        <span className="text-xs text-[var(--text-secondary)]">Notes</span>
      </div>
    </div>
  );
};

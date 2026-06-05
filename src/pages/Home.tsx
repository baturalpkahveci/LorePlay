import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock3, Edit, FileText, Gamepad2, Plus, Search, Trash2, Type } from 'lucide-react';
import { useJournal } from '../store/useJournalStore';
import type { Game } from '../interfaces/models';

const emptyGameForm = { title: '', description: '', coverImageUrl: '' };

const getRelativeTime = (dateValue?: string) => {
  if (!dateValue) return 'No notes yet';

  const date = new Date(dateValue);
  const diffMs = Date.now() - date.getTime();
  if (Number.isNaN(diffMs)) return 'No notes yet';
  if (diffMs < 60_000) return 'just now';

  const units = [
    { label: 'year', ms: 365 * 24 * 60 * 60 * 1000 },
    { label: 'month', ms: 30 * 24 * 60 * 60 * 1000 },
    { label: 'week', ms: 7 * 24 * 60 * 60 * 1000 },
    { label: 'day', ms: 24 * 60 * 60 * 1000 },
    { label: 'hour', ms: 60 * 60 * 1000 },
    { label: 'minute', ms: 60 * 1000 }
  ];

  const unit = units.find((item) => diffMs >= item.ms);
  if (!unit) return 'just now';

  const value = Math.floor(diffMs / unit.ms);
  return `${value} ${unit.label}${value > 1 ? 's' : ''} ago`;
};

export const Home = () => {
  const { games, addGame, updateGame, deleteGame } = useJournal();
  const [search, setSearch] = useState('');
  const [sortParam, setSortParam] = useState<'date' | 'name'>('date');
  const [isAdding, setIsAdding] = useState(false);
  const [newGameForm, setNewGameForm] = useState(emptyGameForm);

  const [editingGameId, setEditingGameId] = useState<string | null>(null);
  const [editGameForm, setEditGameForm] = useState(emptyGameForm);

  const totalPlaythroughs = games.reduce((acc, game) => acc + game.playthroughs.length, 0);
  const totalNotes = games.reduce((acc, game) => acc + game.playthroughs.reduce((sum, play) => sum + play.notes.length, 0), 0);
  const latestNoteDate = useMemo(() => {
    const noteDates = games.flatMap((game) => game.playthroughs.flatMap((play) => play.notes.map((note) => note.date)));
    const latestTime = noteDates.reduce((latest, date) => Math.max(latest, new Date(date).getTime()), 0);

    return latestTime ? new Date(latestTime).toISOString() : undefined;
  }, [games]);

  const sortedGames = useMemo(() => {
    const filteredGames = games.filter((game) => game.title.toLowerCase().includes(search.toLowerCase()));

    return [...filteredGames].sort((a, b) => {
      if (sortParam === 'name') {
        return a.title.localeCompare(b.title);
      }

      const dateA = a.lastNoteDate ? new Date(a.lastNoteDate).getTime() : 0;
      const dateB = b.lastNoteDate ? new Date(b.lastNoteDate).getTime() : 0;
      return dateB - dateA;
    });
  }, [games, search, sortParam]);

  const handleAddGame = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGameForm.title.trim()) return;
    addGame(newGameForm);
    setNewGameForm(emptyGameForm);
    setIsAdding(false);
  };

  const handleEditClick = (e: React.MouseEvent, game: Game) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingGameId(game.id);
    setEditGameForm({ title: game.title, description: game.description || '', coverImageUrl: game.coverImageUrl || '' });
  };

  const handleUpdateGame = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editGameForm.title.trim() || !editingGameId) return;
    updateGame(editingGameId, editGameForm);
    setEditingGameId(null);
  };

  const handleDeleteClick = (e: React.MouseEvent, gameId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this game and all its playthroughs?')) {
      deleteGame(gameId);
    }
  };

  return (
    <div className="space-y-8">
      <section className="rounded-lg border border-[var(--border-color)] bg-[linear-gradient(135deg,_rgba(56,189,248,0.12),_rgba(52,211,153,0.06)_45%,_rgba(24,28,35,0.94))] p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-[var(--color-brand)]">Library</p>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Games</h2>
            <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
              Track playthroughs, notes, tags and backups from one tidy local journal.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:min-w-[26rem] sm:grid-cols-4">
            <div className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)]/55 p-3">
              <div className="text-xs text-[var(--text-secondary)]">Games</div>
              <div className="mt-1 text-2xl font-bold">{games.length}</div>
            </div>
            <div className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)]/55 p-3">
              <div className="text-xs text-[var(--text-secondary)]">Plays</div>
              <div className="mt-1 text-2xl font-bold">{totalPlaythroughs}</div>
            </div>
            <div className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)]/55 p-3">
              <div className="text-xs text-[var(--text-secondary)]">Notes</div>
              <div className="mt-1 text-2xl font-bold">{totalNotes}</div>
            </div>
            <div className="rounded-lg border border-[var(--color-brand)]/30 bg-[var(--color-brand)]/10 p-3">
              <div className="flex items-center gap-1.5 text-xs text-[var(--color-brand)]">
                <Clock3 size={13} /> Last note
              </div>
              <div className="mt-1 text-sm font-semibold text-[var(--text-primary)]">{getRelativeTime(latestNoteDate)}</div>
            </div>
          </div>
        </div>
      </section>

      <div className="flex flex-col gap-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)]/80 p-3 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={18} />
          <input
            type="text"
            placeholder="Search games..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)] py-2.5 pl-10 pr-4 outline-none transition focus:border-[var(--color-brand)]"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setSortParam((s) => s === 'date' ? 'name' : 'date')}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)] px-4 py-2.5 transition hover:border-[var(--color-brand)] md:flex-none"
          >
            {sortParam === 'date' ? <Calendar size={18} /> : <Type size={18} />}
            <span>{sortParam === 'date' ? 'Last Updated' : 'Name'}</span>
          </button>
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center justify-center gap-2 rounded-lg bg-[var(--color-brand)] px-4 py-2.5 font-semibold text-slate-950 transition hover:bg-[var(--color-brand-hover)]"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">Add Game</span>
          </button>
        </div>
      </div>

      {isAdding && (
        <form onSubmit={handleAddGame} className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] p-4 shadow-xl shadow-black/10">
          <h3 className="mb-4 text-xl font-semibold">New Game</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <input
              type="text"
              placeholder="Title*"
              required
              value={newGameForm.title}
              onChange={(e) => setNewGameForm({ ...newGameForm, title: e.target.value })}
              className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)] p-3 outline-none transition focus:border-[var(--color-brand)]"
            />
            <input
              type="url"
              placeholder="Cover Image URL"
              value={newGameForm.coverImageUrl}
              onChange={(e) => setNewGameForm({ ...newGameForm, coverImageUrl: e.target.value })}
              className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)] p-3 outline-none transition focus:border-[var(--color-brand)]"
            />
            <textarea
              placeholder="Description"
              value={newGameForm.description}
              onChange={(e) => setNewGameForm({ ...newGameForm, description: e.target.value })}
              className="h-24 rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)] p-3 outline-none transition focus:border-[var(--color-brand)] md:col-span-2"
            />
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" onClick={() => setIsAdding(false)} className="rounded-lg px-4 py-2 text-[var(--text-secondary)] transition hover:text-white">Cancel</button>
            <button type="submit" className="rounded-lg bg-[var(--color-brand)] px-4 py-2 font-semibold text-slate-950 transition hover:bg-[var(--color-brand-hover)]">Save</button>
          </div>
        </form>
      )}

      {sortedGames.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[var(--border-color)] bg-[var(--bg-surface)]/50 py-16 text-center">
          <Gamepad2 className="mx-auto mb-4 text-[var(--color-brand)]" size={44} />
          <h3 className="text-xl font-semibold">{search ? 'No matching games' : 'Your journal is empty'}</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-[var(--text-secondary)]">
            {search ? 'Try a different search term or clear the filter.' : 'Add your first game to start collecting playthroughs and notes.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {sortedGames.map((game) => (
            <div key={game.id} className="relative group">
              {editingGameId === game.id ? (
                <form onSubmit={handleUpdateGame} className="flex h-full flex-col gap-3 rounded-lg border border-[var(--color-brand)] bg-[var(--bg-surface)] p-4 shadow-lg">
                  <h3 className="text-lg font-semibold">Edit Game</h3>
                  <input
                    type="text"
                    placeholder="Title*"
                    required
                    value={editGameForm.title}
                    onChange={(e) => setEditGameForm({ ...editGameForm, title: e.target.value })}
                    className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)] p-2.5 outline-none transition focus:border-[var(--color-brand)]"
                  />
                  <input
                    type="url"
                    placeholder="Cover Image URL"
                    value={editGameForm.coverImageUrl}
                    onChange={(e) => setEditGameForm({ ...editGameForm, coverImageUrl: e.target.value })}
                    className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)] p-2.5 outline-none transition focus:border-[var(--color-brand)]"
                  />
                  <textarea
                    placeholder="Description"
                    value={editGameForm.description}
                    onChange={(e) => setEditGameForm({ ...editGameForm, description: e.target.value })}
                    className="h-24 rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)] p-2.5 outline-none transition focus:border-[var(--color-brand)]"
                  />
                  <div className="mt-auto flex justify-end gap-2">
                    <button type="button" onClick={() => setEditingGameId(null)} className="rounded-lg px-3 py-1.5 text-sm text-[var(--text-secondary)] transition hover:text-white">Cancel</button>
                    <button type="submit" className="rounded-lg bg-[var(--color-brand)] px-3 py-1.5 text-sm font-semibold text-slate-950 transition hover:bg-[var(--color-brand-hover)]">Update</button>
                  </div>
                </form>
              ) : (
                <Link to={`/game/${game.id}`} className="flex h-full flex-col overflow-hidden rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] transition hover:-translate-y-0.5 hover:border-[var(--color-brand)] hover:shadow-xl hover:shadow-black/20">
                  <div className="relative aspect-[16/11] overflow-hidden bg-[var(--bg-main)]">
                    {game.coverImageUrl ? (
                      <img src={game.coverImageUrl} alt={game.title} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,_rgba(56,189,248,0.16),_rgba(52,211,153,0.08))]">
                        <Gamepad2 size={48} className="text-[var(--color-brand)] opacity-80" />
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/70 to-transparent" />
                    <div className="absolute right-2 top-2 flex gap-1 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
                      <button onClick={(e) => handleEditClick(e, game)} className="rounded-lg border border-white/10 bg-black/65 p-1.5 text-white transition hover:text-[var(--color-brand)]" aria-label={`Edit ${game.title}`}><Edit size={16} /></button>
                      <button onClick={(e) => handleDeleteClick(e, game.id)} className="rounded-lg border border-white/10 bg-black/65 p-1.5 text-white transition hover:text-[var(--color-danger-custom)]" aria-label={`Delete ${game.title}`}><Trash2 size={16} /></button>
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <h3 className="mb-1 text-lg font-bold line-clamp-1">{game.title}</h3>
                    <p className="mb-4 flex-1 text-sm leading-6 text-[var(--text-secondary)] line-clamp-3">{game.description || 'No description yet.'}</p>
                    <div className="flex items-center justify-between gap-3 border-t border-[var(--border-color)] pt-3 text-xs text-[var(--text-secondary)]">
                      <span className="inline-flex items-center gap-1.5"><FileText size={14} />{game.playthroughs.length} Plays</span>
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-color)] bg-[var(--bg-main)] px-2 py-1">
                        <Clock3 size={13} />
                        {getRelativeTime(game.lastNoteDate)}
                      </span>
                    </div>
                  </div>
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

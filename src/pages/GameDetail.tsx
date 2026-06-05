import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock3, Edit, FileText, Flame, Gamepad2, Plus, Search, SlidersHorizontal, Trash2 } from 'lucide-react';
import { useJournal } from '../store/useJournalStore';
import type { Playthrough, PlaythroughStatus } from '../interfaces/models';

type PlaythroughSort = 'date' | 'name' | 'notes' | 'streak' | 'lastNote';
type PlaythroughFilter = 'All' | PlaythroughStatus;

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

const getPlaythroughLastNoteDate = (playthrough: Playthrough) => {
  const latestTime = playthrough.notes.reduce((latest, note) => Math.max(latest, new Date(note.date).getTime()), 0);
  return latestTime ? new Date(latestTime).toISOString() : undefined;
};

export const GameDetail = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const { games, addPlaythrough, updatePlaythrough, deletePlaythrough, deleteGame } = useJournal();

  const game = games.find((g) => g.id === gameId);

  const [sortParam, setSortParam] = useState<PlaythroughSort>('date');
  const [statusFilter, setStatusFilter] = useState<PlaythroughFilter>('All');
  const [playthroughSearch, setPlaythroughSearch] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<PlaythroughStatus>('Playing');

  const [editingPlayId, setEditingPlayId] = useState<string | null>(null);
  const [editPlayForm, setEditPlayForm] = useState({ title: '', description: '', status: 'Playing' as PlaythroughStatus });

  const sortedPlaythroughs = useMemo(() => {
    if (!game) return [];

    return game.playthroughs
      .filter((playthrough) => {
        const matchesStatus = statusFilter === 'All' || playthrough.status === statusFilter;
        const searchText = `${playthrough.title} ${playthrough.description || ''}`.toLowerCase();
        const matchesSearch = searchText.includes(playthroughSearch.toLowerCase());
        return matchesStatus && matchesSearch;
      })
      .sort((a, b) => {
        if (sortParam === 'name') return a.title.localeCompare(b.title);
        if (sortParam === 'notes') return b.notes.length - a.notes.length;
        if (sortParam === 'streak') return b.longestStreak - a.longestStreak;
        if (sortParam === 'lastNote') {
          const dateA = getPlaythroughLastNoteDate(a) ? new Date(getPlaythroughLastNoteDate(a) || '').getTime() : 0;
          const dateB = getPlaythroughLastNoteDate(b) ? new Date(getPlaythroughLastNoteDate(b) || '').getTime() : 0;
          return dateB - dateA;
        }
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
  }, [game, playthroughSearch, sortParam, statusFilter]);

  if (!game) {
    return (
      <div className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] p-10 text-center">
        <Gamepad2 className="mx-auto mb-3 text-[var(--color-brand)]" size={40} />
        <h2 className="text-xl font-semibold">Game not found</h2>
        <Link to="/" className="mt-4 inline-flex items-center gap-2 text-[var(--color-brand)] hover:underline">
          <ArrowLeft size={16} /> Back to games
        </Link>
      </div>
    );
  }

  const totalNotes = game.playthroughs.reduce((acc, play) => acc + play.notes.length, 0);

  const handleAddPlaythrough = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !gameId) return;
    addPlaythrough(gameId, {
      title,
      description,
      status,
      date: new Date().toISOString()
    });
    setTitle('');
    setDescription('');
    setStatus('Playing');
    setIsAdding(false);
  };

  const handleEditClick = (e: React.MouseEvent, p: Playthrough) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingPlayId(p.id);
    setEditPlayForm({ title: p.title, description: p.description || '', status: p.status });
  };

  const handleUpdatePlaythrough = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPlayForm.title.trim() || !gameId || !editingPlayId) return;
    updatePlaythrough(gameId, editingPlayId, editPlayForm);
    setEditingPlayId(null);
  };

  const handleDeletePlaythrough = (e: React.MouseEvent, pId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm('Delete this playthrough?')) {
      deletePlaythrough(game.id, pId);
    }
  };

  const handleDeleteGame = () => {
    if (window.confirm('Are you sure you want to delete this game and all its playthroughs?')) {
      deleteGame(game.id);
      navigate('/');
    }
  };

  const getStatusColor = (s: PlaythroughStatus) => {
    switch (s) {
      case 'Playing':
        return 'text-[var(--color-brand)] bg-[var(--color-brand)]/10 border-[var(--color-brand)]/25';
      case 'Completed':
        return 'text-[var(--color-success-custom)] bg-[var(--color-success-custom)]/10 border-[var(--color-success-custom)]/25';
      case 'Dropped':
        return 'text-[var(--color-danger-custom)] bg-[var(--color-danger-custom)]/10 border-[var(--color-danger-custom)]/25';
    }
  };

  const getStatusAccent = (s: PlaythroughStatus) => {
    switch (s) {
      case 'Playing':
        return 'from-sky-400/22 via-sky-400/7 to-transparent';
      case 'Completed':
        return 'from-emerald-400/22 via-emerald-400/7 to-transparent';
      case 'Dropped':
        return 'from-rose-400/22 via-rose-400/7 to-transparent';
    }
  };

  return (
    <div className="space-y-7">
      <Link to="/" className="inline-flex items-center gap-2 text-[var(--text-secondary)] transition hover:text-white">
        <ArrowLeft size={16} /> Back to Games
      </Link>

      <section className="overflow-hidden rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)]">
        <div className="grid gap-0 md:grid-cols-[240px_1fr]">
          <div className="relative min-h-64 bg-[var(--bg-main)]">
            {game.coverImageUrl ? (
              <img src={game.coverImageUrl} alt={game.title} className="h-full min-h-64 w-full object-cover" />
            ) : (
              <div className="flex h-full min-h-64 items-center justify-center bg-[linear-gradient(135deg,_rgba(56,189,248,0.16),_rgba(52,211,153,0.08))]">
                <Gamepad2 size={58} className="text-[var(--color-brand)]" />
              </div>
            )}
          </div>

          <div className="flex flex-col gap-5 p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-[var(--color-brand)]">Game Detail</p>
                <h2 className="text-3xl font-bold tracking-tight">{game.title}</h2>
              </div>
              <button onClick={handleDeleteGame} className="rounded-lg border border-[var(--color-danger-custom)]/30 bg-[var(--color-danger-custom)]/10 p-2 text-[var(--color-danger-custom)] transition hover:bg-[var(--color-danger-custom)]/20" aria-label={`Delete ${game.title}`}>
                <Trash2 size={20} />
              </button>
            </div>

            <p className="max-w-3xl flex-1 text-sm leading-6 text-[var(--text-secondary)]">{game.description || 'No description provided.'}</p>

            <div className="grid grid-cols-3 gap-2 border-t border-[var(--border-color)] pt-4">
              <div>
                <div className="text-xs text-[var(--text-secondary)]">Playthroughs</div>
                <div className="mt-1 text-xl font-bold">{game.playthroughs.length}</div>
              </div>
              <div>
                <div className="text-xs text-[var(--text-secondary)]">Notes</div>
                <div className="mt-1 text-xl font-bold">{totalNotes}</div>
              </div>
              <div>
                <div className="text-xs text-[var(--text-secondary)]">Updated</div>
                <div className="mt-1 text-sm font-semibold">{game.lastNoteDate ? new Date(game.lastNoteDate).toLocaleDateString() : 'No notes'}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)]/80 p-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-2xl font-bold">Playthroughs</h3>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">{sortedPlaythroughs.length} shown from {game.playthroughs.length}</p>
          </div>
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center justify-center gap-2 rounded-lg bg-[var(--color-brand)] px-4 py-2.5 font-semibold text-slate-950 transition hover:bg-[var(--color-brand-hover)]"
          >
            <Plus size={18} /> <span>Add Play</span>
          </button>
        </div>

        <div className="mt-4 grid gap-3 xl:grid-cols-[minmax(0,1fr)_auto_auto] xl:items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={17} />
            <input
              type="text"
              placeholder="Search playthroughs..."
              value={playthroughSearch}
              onChange={(e) => setPlaythroughSearch(e.target.value)}
              className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)] py-2.5 pl-10 pr-4 outline-none transition focus:border-[var(--color-brand)]"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {(['All', 'Playing', 'Completed', 'Dropped'] as PlaythroughFilter[]).map((filter) => (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                  statusFilter === filter
                    ? 'border-[var(--color-brand)] bg-[var(--color-brand)]/12 text-[var(--color-brand)]'
                    : 'border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-secondary)] hover:border-[var(--color-brand)] hover:text-white'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          <label className="flex items-center gap-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)] px-3 py-2 text-sm text-[var(--text-secondary)]">
            <SlidersHorizontal size={16} />
            <select
              value={sortParam}
              onChange={(e) => setSortParam(e.target.value as PlaythroughSort)}
              className="bg-transparent text-[var(--text-primary)] outline-none"
            >
              <option value="date">Created date</option>
              <option value="lastNote">Last note</option>
              <option value="name">Name</option>
              <option value="notes">Most notes</option>
              <option value="streak">Best streak</option>
            </select>
          </label>
        </div>
      </div>

      {isAdding && (
        <form onSubmit={handleAddPlaythrough} className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] p-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <input
              type="text"
              placeholder="Playthrough Name*"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)] p-3 outline-none transition focus:border-[var(--color-brand)]"
            />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as PlaythroughStatus)}
              className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)] p-3 text-[var(--text-primary)] outline-none transition focus:border-[var(--color-brand)]"
            >
              <option value="Playing">Playing</option>
              <option value="Completed">Completed</option>
              <option value="Dropped">Dropped</option>
            </select>
            <textarea
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-24 rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)] p-3 outline-none transition focus:border-[var(--color-brand)] md:col-span-2"
            />
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" onClick={() => setIsAdding(false)} className="rounded-lg px-4 py-2 text-[var(--text-secondary)] transition hover:text-white">Cancel</button>
            <button type="submit" className="rounded-lg bg-[var(--color-brand)] px-4 py-2 font-semibold text-slate-950 transition hover:bg-[var(--color-brand-hover)]">Create</button>
          </div>
        </form>
      )}

      {sortedPlaythroughs.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[var(--border-color)] bg-[var(--bg-surface)]/50 py-12 text-center text-[var(--text-secondary)]">
          <FileText className="mx-auto mb-3 text-[var(--color-brand)]" size={40} />
          No playthroughs yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {sortedPlaythroughs.map((p) => (
            <div key={p.id} className="relative group block h-full">
              {editingPlayId === p.id ? (
                <form onSubmit={handleUpdatePlaythrough} className="flex h-full flex-col gap-3 rounded-lg border border-[var(--color-brand)] bg-[var(--bg-surface)] p-4 shadow-lg">
                  <h4 className="font-semibold">Edit Playthrough</h4>
                  <input
                    type="text"
                    required
                    value={editPlayForm.title}
                    onChange={(e) => setEditPlayForm({ ...editPlayForm, title: e.target.value })}
                    className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)] p-2.5 outline-none transition focus:border-[var(--color-brand)]"
                  />
                  <select
                    value={editPlayForm.status}
                    onChange={(e) => setEditPlayForm({ ...editPlayForm, status: e.target.value as PlaythroughStatus })}
                    className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)] p-2.5 outline-none transition focus:border-[var(--color-brand)]"
                  >
                    <option value="Playing">Playing</option>
                    <option value="Completed">Completed</option>
                    <option value="Dropped">Dropped</option>
                  </select>
                  <textarea
                    value={editPlayForm.description}
                    onChange={(e) => setEditPlayForm({ ...editPlayForm, description: e.target.value })}
                    className="h-20 rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)] p-2.5 outline-none transition focus:border-[var(--color-brand)]"
                  />
                  <div className="mt-auto flex justify-end gap-2">
                    <button type="button" onClick={() => setEditingPlayId(null)} className="rounded-lg px-3 py-1.5 text-sm text-[var(--text-secondary)] transition hover:text-white">Cancel</button>
                    <button type="submit" className="rounded-lg bg-[var(--color-brand)] px-3 py-1.5 text-sm font-semibold text-slate-950 transition hover:bg-[var(--color-brand-hover)]">Update</button>
                  </div>
                </form>
              ) : (
                <Link to={`/game/${game.id}/playthrough/${p.id}`} className="block h-full cursor-pointer">
                  <div className="relative flex h-full min-h-56 overflow-hidden rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] transition hover:-translate-y-0.5 hover:border-[var(--color-brand)] hover:shadow-xl hover:shadow-black/20">
                    <div className={`absolute inset-x-0 top-0 h-24 bg-gradient-to-b ${getStatusAccent(p.status)}`} />
                    <div className="absolute inset-y-0 left-0 w-1" style={{ backgroundColor: p.status === 'Playing' ? 'var(--color-brand)' : p.status === 'Completed' ? 'var(--color-success-custom)' : 'var(--color-danger-custom)' }} />

                    <div className="relative flex min-w-0 flex-1 flex-col p-4 sm:p-5">
                      <div className="mb-4 pr-14">
                        <div className="min-w-0">
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
                              <Gamepad2 size={14} />
                              Playthrough
                            </span>
                            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${getStatusColor(p.status)}`}>{p.status}</span>
                          </div>
                          <h4 className="text-xl font-bold line-clamp-2">{p.title}</h4>
                        </div>
                      </div>

                      <p className="mb-5 flex-1 text-sm leading-6 text-[var(--text-secondary)] line-clamp-3">{p.description || 'No description yet.'}</p>

                      <div className="grid grid-cols-3 gap-2 border-t border-[var(--border-color)] pt-4">
                        <div className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)]/65 p-2">
                          <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]"><FileText size={13} /> Notes</div>
                          <div className="mt-1 text-sm font-bold text-[var(--text-primary)]">{p.notes.length}</div>
                        </div>
                        <div className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)]/65 p-2">
                          <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]"><Flame size={13} /> Streak</div>
                          <div className="mt-1 text-sm font-bold text-[var(--text-primary)]">{p.longestStreak}</div>
                        </div>
                        <div className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)]/65 p-2">
                          <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]"><Clock3 size={13} /> Last</div>
                          <div className="mt-1 text-sm font-bold text-[var(--text-primary)] line-clamp-1">{getRelativeTime(getPlaythroughLastNoteDate(p))}</div>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-3 text-xs text-[var(--text-secondary)]">
                        <span className="inline-flex items-center gap-1.5"><Calendar size={13} /> Created {new Date(p.date).toLocaleDateString()}</span>
                        <span className="text-[var(--color-brand)] opacity-0 transition group-hover:opacity-100">Open</span>
                      </div>
                    </div>

                    <div className="absolute right-3 top-3 z-10 flex gap-1 rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)]/90 p-1 shadow transition sm:opacity-0 sm:group-hover:opacity-100">
                      <button onClick={(e) => handleEditClick(e, p)} className="rounded-md p-1.5 text-[var(--text-secondary)] transition hover:bg-[var(--bg-surface-hover)] hover:text-[var(--color-brand)]" aria-label={`Edit ${p.title}`}><Edit size={14} /></button>
                      <button onClick={(e) => handleDeletePlaythrough(e, p.id)} className="rounded-md p-1.5 text-[var(--text-secondary)] transition hover:bg-[var(--bg-surface-hover)] hover:text-[var(--color-danger-custom)]" aria-label={`Delete ${p.title}`}><Trash2 size={14} /></button>
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

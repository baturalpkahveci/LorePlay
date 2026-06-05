import React, { useState } from 'react';
import { useJournal } from '../store/useJournalStore';
import { Link } from 'react-router-dom';
import { Plus, Search, Calendar, Type, Gamepad2, Edit, Trash2 } from 'lucide-react';

export const Home = () => {
  const { games, addGame, updateGame, deleteGame } = useJournal();
  const [search, setSearch] = useState('');
  const [sortParam, setSortParam] = useState<'date' | 'name'>('date');
  const [isAdding, setIsAdding] = useState(false);
  const [newGameForm, setNewGameForm] = useState({ title: '', description: '', coverImageUrl: '' });

  const [editingGameId, setEditingGameId] = useState<string | null>(null);
  const [editGameForm, setEditGameForm] = useState({ title: '', description: '', coverImageUrl: '' });

  const handleAddGame = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGameForm.title.trim()) return;
    addGame(newGameForm);
    setNewGameForm({ title: '', description: '', coverImageUrl: '' });
    setIsAdding(false);
  };

  const handleEditClick = (e: React.MouseEvent, game: any) => {
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

  const filteredGames = games.filter(g => g.title.toLowerCase().includes(search.toLowerCase()));

  const sortedGames = [...filteredGames].sort((a, b) => {
    if (sortParam === 'name') {
      return a.title.localeCompare(b.title);
    }
    const dateA = a.lastNoteDate ? new Date(a.lastNoteDate).getTime() : 0;
    const dateB = b.lastNoteDate ? new Date(b.lastNoteDate).getTime() : 0;
    return dateB - dateA;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h2 className="text-3xl font-bold">Games</h2>
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={18} />
            <input 
              type="text"
              placeholder="Search games..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-[var(--color-brand)] transition"
            />
          </div>
          <button 
            onClick={() => setSortParam(s => s === 'date' ? 'name' : 'date')}
            className="flex items-center gap-2 bg-[var(--bg-surface)] border border-[var(--border-color)] px-4 py-2 rounded-lg hover:border-[var(--color-brand)] transition"
          >
            {sortParam === 'date' ? <Calendar size={18} /> : <Type size={18} />}
            <span>{sortParam === 'date' ? 'By Last Updated' : 'By Name'}</span>
          </button>
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="bg-[var(--color-brand)] hover:bg-[var(--color-brand-hover)] text-white p-2 md:px-4 rounded-lg flex items-center gap-2 transition"
          >
            <Plus size={18} />
            <span className="hidden md:inline">Add Game</span>
          </button>
        </div>
      </div>

      {isAdding && (
        <form onSubmit={handleAddGame} className="bg-[var(--bg-surface)] p-4 rounded-xl border border-[var(--border-color)] flex flex-col gap-4">
          <h3 className="text-xl font-semibold">New Game</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input 
              type="text" placeholder="Title*" required
              value={newGameForm.title} onChange={e => setNewGameForm({...newGameForm, title: e.target.value})}
              className="bg-[var(--bg-main)] border border-[var(--border-color)] p-2 rounded focus:outline-none focus:border-[var(--color-brand)]"
            />
            <input 
              type="url" placeholder="Cover Image URL (optional)" 
              value={newGameForm.coverImageUrl} onChange={e => setNewGameForm({...newGameForm, coverImageUrl: e.target.value})}
              className="bg-[var(--bg-main)] border border-[var(--border-color)] p-2 rounded focus:outline-none focus:border-[var(--color-brand)]"
            />
            <textarea 
              placeholder="Description (optional)"
              value={newGameForm.description} onChange={e => setNewGameForm({...newGameForm, description: e.target.value})}
              className="bg-[var(--bg-main)] border border-[var(--border-color)] p-2 rounded focus:outline-none focus:border-[var(--color-brand)] md:col-span-2 h-20"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 rounded text-[var(--text-secondary)] hover:text-white">Cancel</button>
            <button type="submit" className="bg-[var(--color-brand)] text-white px-4 py-2 rounded hover:opacity-90">Save</button>
          </div>
        </form>
      )}

      {sortedGames.length === 0 ? (
        <div className="text-center text-[var(--text-secondary)] py-12">No games found. Add some to get started!</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {sortedGames.map(game => (
            <div key={game.id} className="relative group">
              {editingGameId === game.id ? (
                <form onSubmit={handleUpdateGame} className="bg-[var(--bg-surface)] p-4 rounded-xl border border-[var(--color-brand)] flex flex-col gap-4 shadow-lg my-0">
                  <h3 className="text-xl font-semibold">Edit Game</h3>
                  <input 
                    type="text" placeholder="Title*" required
                    value={editGameForm.title} onChange={e => setEditGameForm({...editGameForm, title: e.target.value})}
                    className="bg-[var(--bg-main)] border border-[var(--border-color)] p-2 rounded focus:outline-none focus:border-[var(--color-brand)]"
                  />
                  <input 
                    type="url" placeholder="Cover Image URL" 
                    value={editGameForm.coverImageUrl} onChange={e => setEditGameForm({...editGameForm, coverImageUrl: e.target.value})}
                    className="bg-[var(--bg-main)] border border-[var(--border-color)] p-2 rounded focus:outline-none focus:border-[var(--color-brand)]"
                  />
                  <textarea 
                    placeholder="Description"
                    value={editGameForm.description} onChange={e => setEditGameForm({...editGameForm, description: e.target.value})}
                    className="bg-[var(--bg-main)] border border-[var(--border-color)] p-2 rounded focus:outline-none focus:border-[var(--color-brand)] h-20"
                  />
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setEditingGameId(null)} className="px-3 py-1.5 rounded text-[var(--text-secondary)] hover:text-white text-sm">Cancel</button>
                    <button type="submit" className="bg-[var(--color-brand)] text-white px-3 py-1.5 rounded hover:opacity-90 text-sm">Update</button>
                  </div>
                </form>
              ) : (
                <Link to={`/game/${game.id}`} className="flex flex-col bg-[var(--bg-surface)] rounded-xl overflow-hidden border border-[var(--border-color)] hover:border-[var(--color-brand)] transition hover:shadow-lg h-full">
                  <div className="relative">
                    {game.coverImageUrl ? (
                      <img src={game.coverImageUrl} alt={game.title} className="w-full h-48 object-cover group-hover:scale-105 transition duration-300" />
                    ) : (
                      <div className="w-full h-48 bg-[var(--border-color)] flex items-center justify-center">
                        <Gamepad2 size={48} className="text-[var(--text-secondary)] opacity-50" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                      <button onClick={(e) => handleEditClick(e, game)} className="bg-black/60 p-1.5 rounded text-white hover:text-[var(--color-brand)] transition"><Edit size={16}/></button>
                      <button onClick={(e) => handleDeleteClick(e, game.id)} className="bg-black/60 p-1.5 rounded text-white hover:text-[var(--color-danger-custom)] transition"><Trash2 size={16}/></button>
                    </div>
                  </div>
                  <div className="p-4 flex-1 flex flex-col z-10 bg-[var(--bg-surface)]">
                    <h3 className="text-lg font-bold mb-1 line-clamp-1">{game.title}</h3>
                    <p className="text-sm text-[var(--text-secondary)] line-clamp-2 mb-4 flex-1">{game.description || 'No description'}</p>
                    <div className="flex justify-between items-center text-xs text-[var(--text-secondary)]">
                      <span>{game.playthroughs.length} Playthroughs</span>
                      {game.lastNoteDate && <span>Updated {new Date(game.lastNoteDate).toLocaleDateString()}</span>}
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

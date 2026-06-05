import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useJournal } from '../store/useJournalStore';
import { ArrowLeft, Plus, Calendar, Type, Trash2, Edit } from 'lucide-react';
import type { PlaythroughStatus } from '../interfaces/models';

export const GameDetail = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const { games, addPlaythrough, updatePlaythrough, deletePlaythrough, deleteGame } = useJournal();
  
  const game = games.find(g => g.id === gameId);
  
  const [sortParam, setSortParam] = useState<'date' | 'name'>('date');
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<PlaythroughStatus>('Playing');

  const [editingPlayId, setEditingPlayId] = useState<string | null>(null);
  const [editPlayForm, setEditPlayForm] = useState({ title: '', description: '', status: 'Playing' as PlaythroughStatus });

  if (!game) {
    return <div className="text-center py-10">Game not found</div>;
  }

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

  const handleEditClick = (e: React.MouseEvent, p: any) => {
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

  const sortedPlaythroughs = [...game.playthroughs].sort((a, b) => {
    if (sortParam === 'name') return a.title.localeCompare(b.title);
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  const getStatusColor = (s: PlaythroughStatus) => {
    switch (s) {
      case 'Playing': return 'text-[var(--color-brand)] bg-[var(--color-brand)]/10 border-[var(--color-brand)]/20';
      case 'Completed': return 'text-[var(--color-success-custom)] bg-[var(--color-success-custom)]/10 border-[var(--color-success-custom)]/20';
      case 'Dropped': return 'text-[var(--color-danger-custom)] bg-[var(--color-danger-custom)]/10 border-[var(--color-danger-custom)]/20';
    }
  };

  return (
    <div className="space-y-6">
      <Link to="/" className="inline-flex items-center gap-2 text-[var(--text-secondary)] hover:text-white transition">
        <ArrowLeft size={16} /> Back to Games
      </Link>
      
      <div className="flex flex-col md:flex-row gap-6 bg-[var(--bg-surface)] p-6 rounded-xl border border-[var(--border-color)]">
        {game.coverImageUrl && (
          <img src={game.coverImageUrl} alt={game.title} className="w-full md:w-48 h-64 object-cover rounded-lg shadow-md" />
        )}
        <div className="flex-1 flex flex-col items-start gap-4">
          <div className="w-full flex justify-between items-start">
            <h2 className="text-3xl font-bold">{game.title}</h2>
            <button onClick={handleDeleteGame} className="text-[var(--color-danger-custom)] hover:opacity-80 p-2"><Trash2 size={20}/></button>
          </div>
          <p className="text-[var(--text-secondary)] flex-1">{game.description || 'No description provided.'}</p>
          <div className="text-sm text-[var(--text-secondary)] pt-4 border-t border-[var(--border-color)] w-full">
            Added on: {game.lastNoteDate ? new Date(game.lastNoteDate).toLocaleString() : 'No notes yet'}
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center pt-4">
        <h3 className="text-2xl font-bold">Playthroughs</h3>
        <div className="flex gap-2">
          <button 
            onClick={() => setSortParam(s => s === 'date' ? 'name' : 'date')}
            className="flex items-center gap-2 bg-[var(--bg-surface)] border border-[var(--border-color)] px-4 py-2 rounded-lg hover:border-[var(--color-brand)] transition"
          >
            {sortParam === 'date' ? <Calendar size={18} /> : <Type size={18} />}
            <span className="hidden md:inline">{sortParam === 'date' ? 'By Date' : 'By Name'}</span>
          </button>
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="bg-[var(--color-brand)] hover:bg-[var(--color-brand-hover)] text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
          >
            <Plus size={18} /> <span className="hidden md:inline">Add Play</span>
          </button>
        </div>
      </div>

      {isAdding && (
        <form onSubmit={handleAddPlaythrough} className="bg-[var(--bg-surface)] p-4 rounded-xl border border-[var(--border-color)] flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input 
              type="text" placeholder="Playthrough Name*" required
              value={title} onChange={e => setTitle(e.target.value)}
              className="bg-[var(--bg-main)] border border-[var(--border-color)] p-2 rounded focus:outline-none focus:border-[var(--color-brand)]"
            />
            <select 
              value={status} onChange={e => setStatus(e.target.value as PlaythroughStatus)}
              className="bg-[var(--bg-main)] border border-[var(--border-color)] p-2 rounded focus:outline-none focus:border-[var(--color-brand)] text-[var(--text-primary)]"
            >
              <option value="Playing">Playing</option>
              <option value="Completed">Completed</option>
              <option value="Dropped">Dropped</option>
            </select>
            <textarea 
              placeholder="Description (optional)"
              value={description} onChange={e => setDescription(e.target.value)}
              className="bg-[var(--bg-main)] border border-[var(--border-color)] p-2 rounded focus:outline-none focus:border-[var(--color-brand)] md:col-span-2 h-20"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 rounded text-[var(--text-secondary)] hover:text-white">Cancel</button>
            <button type="submit" className="bg-[var(--color-brand)] text-white px-4 py-2 rounded hover:opacity-90">Create</button>
          </div>
        </form>
      )}

      {sortedPlaythroughs.length === 0 ? (
        <div className="text-center text-[var(--text-secondary)] py-8">No playthroughs yet.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sortedPlaythroughs.map(p => (
            <div key={p.id} className="relative group block h-full">
              {editingPlayId === p.id ? (
                <form onSubmit={handleUpdatePlaythrough} className="bg-[var(--bg-surface)] p-4 rounded-xl border border-[var(--color-brand)] flex flex-col gap-3 shadow-lg">
                  <h4 className="font-semibold">Edit Playthrough</h4>
                  <input 
                    type="text" required value={editPlayForm.title} onChange={e => setEditPlayForm({...editPlayForm, title: e.target.value})}
                    className="bg-[var(--bg-main)] border border-[var(--border-color)] p-2 rounded focus:outline-none focus:border-[var(--color-brand)]"
                  />
                  <select 
                    value={editPlayForm.status} onChange={e => setEditPlayForm({...editPlayForm, status: e.target.value as PlaythroughStatus})}
                    className="bg-[var(--bg-main)] border border-[var(--border-color)] p-2 rounded focus:outline-none focus:border-[var(--color-brand)]"
                  >
                    <option value="Playing">Playing</option>
                    <option value="Completed">Completed</option>
                    <option value="Dropped">Dropped</option>
                  </select>
                  <textarea 
                    value={editPlayForm.description} onChange={e => setEditPlayForm({...editPlayForm, description: e.target.value})}
                    className="bg-[var(--bg-main)] border border-[var(--border-color)] p-2 rounded focus:outline-none focus:border-[var(--color-brand)] h-16"
                  />
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setEditingPlayId(null)} className="px-3 py-1.5 rounded text-[var(--text-secondary)] hover:text-white text-sm">Cancel</button>
                    <button type="submit" className="bg-[var(--color-brand)] text-white px-3 py-1.5 rounded hover:opacity-90 text-sm">Update</button>
                  </div>
                </form>
              ) : (
                <Link to={`/game/${game.id}/playthrough/${p.id}`} className="block h-full cursor-pointer">
                  <div className="bg-[var(--bg-surface)] p-4 rounded-xl border border-[var(--border-color)] hover:border-[var(--color-brand)] transition flex flex-col h-full gap-2 relative">
                    <div className="absolute top-2 right-2 flex gap-1 bg-[var(--bg-main)] rounded opacity-0 group-hover:opacity-100 transition z-10 shadow border border-[var(--border-color)]">
                      <button onClick={(e) => handleEditClick(e, p)} className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--color-brand)] transition"><Edit size={14}/></button>
                      <button onClick={(e) => handleDeletePlaythrough(e, p.id)} className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--color-danger-custom)] transition"><Trash2 size={14}/></button>
                    </div>
                    <div className="flex justify-between items-start mr-12">
                      <h4 className="text-xl font-bold">{p.title}</h4>
                      <span className={`px-2 py-1 rounded text-xs border ${getStatusColor(p.status)}`}>{p.status}</span>
                    </div>
                    <p className="text-sm text-[var(--text-secondary)] flex-1">{p.description}</p>
                    <div className="flex justify-between text-xs text-[var(--text-secondary)] pt-2 border-t border-[var(--border-color)] mt-2">
                      <span>{new Date(p.date).toLocaleDateString()}</span>
                      <span>{p.notes.length} Notes • Streak: {p.longestStreak}</span>
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

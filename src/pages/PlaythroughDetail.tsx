import React, { useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useJournal } from '../store/useJournalStore';
import { ArrowLeft, Plus, Download, Upload, Trash2, Filter, Edit } from 'lucide-react';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import { MarkdownHelpPanel } from '../components/MarkdownHelpPanel';
import { appColors } from '../theme/appColors';

export const PlaythroughDetail = () => {
  // Temporary: this file is kept as-is; actual UI uses PlaythroughDetail_fixed.tsx

  const { gameId, playthroughId } = useParams();
  const navigate = useNavigate();
  const { games, addNote, updateNote, deleteNote, deletePlaythrough, exportPlaythroughData, importData } = useJournal();
  
  const game = games.find(g => g.id === gameId);
  const playthrough = game?.playthroughs.find(p => p.id === playthroughId);
  
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(appColors.noteColors[0]);
  const [tagsText, setTagsText] = useState('');

  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editColor, setEditColor] = useState('');
  const [editTagsText, setEditTagsText] = useState('');

  const [filterColor, setFilterColor] = useState<string | null>(null);
  const [filterTag, setFilterTag] = useState<string>('');
  const [showMarkdownHelp, setShowMarkdownHelp] = useState(false);

  if (!game || !playthrough) return <div className="text-center py-10">Playthrough not found</div>;

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !gameId || !playthroughId) return;
    
    const tags = tagsText.split(',').map(t => t.trim()).filter(Boolean);
    
    addNote(gameId, playthroughId, {
      title,
      description,
      color,
      tags,
      date: new Date().toISOString()
    });
    
    setTitle('');
    setDescription('');
    setColor(appColors.noteColors[0]);
    setTagsText('');
    setIsAdding(false);
  };

  const startEditingNote = (note: any) => {
    setEditingNoteId(note.id);
    setEditTitle(note.title);
    setEditDescription(note.description || '');
    setEditColor(note.color);
    setEditTagsText(note.tags.join(', '));
  };

  const handleUpdateNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle.trim() || !gameId || !playthroughId || !editingNoteId) return;

    const tags = editTagsText.split(',').map(t => t.trim()).filter(Boolean);
    
    updateNote(gameId, playthroughId, editingNoteId, {
      title: editTitle,
      description: editDescription,
      color: editColor,
      tags
    });
    setEditingNoteId(null);
  };

  const handleDeletePlaythrough = () => {
    if (window.confirm('Delete this playthrough and all its notes?')) {
      deletePlaythrough(game.id, playthrough.id);
      navigate(`/game/${game.id}`);
    }
  };

  const handleExport = () => {
    const data = exportPlaythroughData(game.id, playthrough.id);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `playthrough-${playthrough.title}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import requires merging Playthrough data back into the game - for simplicity we just read it and do a crude fix.
  // The system requested just export/import for Notes, let's refine this easily:
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
     const file = e.target.files?.[0];
     if (!file) return;
     const reader = new FileReader();
     reader.onload = (ev) => {
        try {
           const parsed = JSON.parse(ev.target?.result as string);
           if (parsed.notes && Array.isArray(parsed.notes)) {
              // Just add imported notes
              parsed.notes.forEach((n: any) => {
                 addNote(game.id, playthrough.id, {
                   title: n.title,
                   description: n.description,
                   color: n.color,
                   tags: n.tags,
                   date: n.date
                 });
              });
              alert('Notes imported successfully');
           }
        } catch (err) {
           alert('Invalid JSON file');
        }
     };
     reader.readAsText(file);
  };

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    playthrough.notes.forEach(n => n.tags.forEach(t => tags.add(t)));
    return Array.from(tags);
  }, [playthrough.notes]);

  const filteredNotes = playthrough.notes.filter(n => {
    let matchColor = filterColor ? n.color === filterColor : true;
    let matchTag = filterTag ? n.tags.includes(filterTag) : true;
    return matchColor && matchTag;
  });

  return (
    <div className="space-y-6">
      <Link to={`/game/${game.id}`} className="inline-flex items-center gap-2 text-[var(--text-secondary)] hover:text-white transition">
        <ArrowLeft size={16} /> Back to {game.title}
      </Link>

      <div className="bg-[var(--bg-surface)] p-6 rounded-xl border border-[var(--border-color)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold mb-1">{playthrough.title}</h2>
          <p className="text-[var(--text-secondary)]">{playthrough.description}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
           <button onClick={handleExport} className="flex items-center gap-2 px-3 py-2 bg-[var(--bg-surface-hover)] rounded border border-[var(--border-color)] hover:text-white" title="Export Notes">
             <Download size={16} />
           </button>
           <label className="flex items-center gap-2 px-3 py-2 bg-[var(--bg-surface-hover)] rounded border border-[var(--border-color)] hover:text-white cursor-pointer" title="Import Notes">
             <Upload size={16} />
             <input type="file" accept=".json" onChange={handleImport} className="hidden" />
           </label>
           <button onClick={handleDeletePlaythrough} className="flex items-center gap-2 px-3 py-2 bg-[var(--color-danger-custom)]/20 text-[var(--color-danger-custom)] rounded border border-[var(--color-danger-custom)] hover:opacity-80">
             <Trash2 size={16} />
           </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-[var(--bg-surface)] p-4 rounded-xl border border-[var(--border-color)]">
        <div className="flex items-center gap-4 w-full md:w-auto overflow-x-auto">
          <Filter size={18} className="text-[var(--text-secondary)]" />
          <select 
            value={filterTag} onChange={e => setFilterTag(e.target.value)}
            className="bg-[var(--bg-main)] border border-[var(--border-color)] p-1.5 rounded focus:outline-none focus:border-[var(--color-brand)] text-sm"
          >
            <option value="">All Tags</option>
            {allTags.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setFilterColor(null)}
              className={`w-6 h-6 rounded-full border-2 ${!filterColor ? 'border-white' : 'border-transparent'} flex items-center justify-center text-xs bg-[var(--bg-surface-hover)]`}
              title="All Colors"
            >All</button>
            {appColors.noteColors.map(c => (
              <button 
                key={c}
                onClick={() => setFilterColor(c)}
                className={`w-6 h-6 rounded-full border-2 ${filterColor === c ? 'border-white' : 'border-transparent'}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="bg-[var(--color-brand)] hover:bg-[var(--color-brand-hover)] text-white px-4 py-2 rounded-lg flex items-center gap-2 w-full md:w-auto justify-center transition"
        >
          <Plus size={18} /> Add Note
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAddNote} className="bg-[var(--bg-surface)] p-4 rounded-xl border border-[var(--border-color)] flex flex-col gap-4">
          <input 
            type="text" placeholder="Note Title*" required
            value={title} onChange={e => setTitle(e.target.value)}
            className="bg-[var(--bg-main)] border border-[var(--border-color)] p-2 rounded focus:outline-none focus:border-[var(--color-brand)] text-lg font-semibold"
          />

          <div className="relative">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-[var(--text-secondary)]">Description (Markdown Supported)</span>
              <MarkdownHelpPanel
                isOpen={showMarkdownHelp}
                onToggle={() => setShowMarkdownHelp(!showMarkdownHelp)}
              />
            </div>

            <textarea 
              placeholder="Your note..."
              value={description} onChange={e => setDescription(e.target.value)}
              className="bg-[var(--bg-main)] border border-[var(--border-color)] p-2 rounded focus:outline-none focus:border-[var(--color-brand)] font-mono text-sm h-40 w-full"
            />
          </div>

          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <input 
              type="text" placeholder="Tags (comma separated)" 
              value={tagsText} onChange={e => setTagsText(e.target.value)}
              className="bg-[var(--bg-main)] border border-[var(--border-color)] p-2 rounded focus:outline-none focus:border-[var(--color-brand)] w-full md:w-64"
            />
            <div className="flex items-center gap-2">
              <span className="text-[var(--text-secondary)] text-sm">Color:</span>
              {appColors.noteColors.map(c => (
                <button 
                  key={c} type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full border-2 ${color === c ? 'border-white scale-110' : 'border-transparent'} transition`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 rounded text-[var(--text-secondary)] hover:text-white">Cancel</button>
            <button type="submit" className="bg-[var(--color-brand)] text-white px-4 py-2 rounded hover:opacity-90">Save Note</button>
          </div>
        </form>
      )}

      <div className="space-y-6">
        {filteredNotes.length === 0 ? (
          <div className="text-center text-[var(--text-secondary)] py-8">No notes found.</div>
        ) : (
          filteredNotes.map((note) => (
            <div key={note.id} className="relative bg-[var(--bg-surface)] p-6 rounded-xl border-l-[6px] shadow-sm transform transition duration-300 hover:shadow-md" style={{ borderLeftColor: note.color }}>
              {editingNoteId === note.id ? (
                <form onSubmit={handleUpdateNote} className="flex flex-col gap-4">
                  <input 
                    type="text" required value={editTitle} onChange={e => setEditTitle(e.target.value)}
                    className="bg-[var(--bg-main)] border border-[var(--border-color)] p-2 rounded focus:outline-none focus:border-[var(--color-brand)] text-lg font-semibold"
                  />
                  <div className="relative">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-[var(--text-secondary)]">Description (Markdown Supported)</span>
                      <MarkdownHelpPanel
                        isOpen={showMarkdownHelp}
                        onToggle={() => setShowMarkdownHelp(!showMarkdownHelp)}
                      />
                    </div>



                    <textarea 
                      value={editDescription} onChange={e => setEditDescription(e.target.value)}
                      className="bg-[var(--bg-main)] border border-[var(--border-color)] p-2 rounded focus:outline-none focus:border-[var(--color-brand)] font-mono text-sm h-40 w-full"
                    />
                  </div>
                  <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                    <input 
                      type="text" placeholder="Tags (comma separated)" 
                      value={editTagsText} onChange={e => setEditTagsText(e.target.value)}
                      className="bg-[var(--bg-main)] border border-[var(--border-color)] p-2 rounded focus:outline-none focus:border-[var(--color-brand)] w-full md:w-64"
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-[var(--text-secondary)] text-sm">Color:</span>
                      {appColors.noteColors.map(c => (
                        <button 
                          key={c} type="button"
                          onClick={() => setEditColor(c)}
                          className={`w-8 h-8 rounded-full border-2 ${editColor === c ? 'border-white scale-110' : 'border-transparent'} transition`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-2">
                    <button type="button" onClick={() => setEditingNoteId(null)} className="px-4 py-2 rounded text-[var(--text-secondary)] hover:text-white">Cancel</button>
                    <button type="submit" className="bg-[var(--color-brand)] text-white px-4 py-2 rounded hover:opacity-90">Update Note</button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-xl font-bold" style={{ color: note.color }}>{note.title}</h4>
                      <span className="text-xs text-[var(--text-secondary)]">{new Date(note.date).toLocaleString()}</span>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => startEditingNote(note)}
                        className="text-[var(--text-secondary)] hover:text-[var(--color-brand)] p-1"
                      >
                        <Edit size={18} />
                      </button>
                      <button 
                        onClick={() => {
                          if (window.confirm('Delete note?')) deleteNote(game.id, playthrough.id, note.id);
                        }}
                        className="text-[var(--text-secondary)] hover:text-[var(--color-danger-custom)] p-1"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                  
                  {note.description && (
                    <div className="mb-4 text-[var(--text-primary)]">
                      <MarkdownRenderer content={note.description} />
                    </div>
                  )}

                  {note.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-[var(--border-color)]">
                      {note.tags.map(t => (
                        <span key={t} className="px-2 py-1 bg-[var(--bg-main)] text-xs text-[var(--text-secondary)] rounded border border-[var(--border-color)]">
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

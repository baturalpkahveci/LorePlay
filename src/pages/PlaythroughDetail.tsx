import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Download, Edit, FileText, Filter, Plus, Trash2, Upload } from 'lucide-react';
import { MarkdownHelpPanel } from '../components/MarkdownHelpPanel';
import { useJournal } from '../store/useJournalStore';
import { appColors } from '../theme/appColors';
import type { Note } from '../interfaces/models';

type ImportedNote = Partial<Omit<Note, 'id'>>;

export const PlaythroughDetail = () => {
  const { gameId, playthroughId } = useParams();
  const navigate = useNavigate();
  const { games, addNote, updateNote, deleteNote, deletePlaythrough, exportPlaythroughData } = useJournal();

  const game = games.find((g) => g.id === gameId);
  const playthrough = game?.playthroughs.find((p) => p.id === playthroughId);

  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [color, setColor] = useState(appColors.noteColors[0]);
  const [tagsText, setTagsText] = useState('');

  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCoverImageUrl, setEditCoverImageUrl] = useState('');
  const [editColor, setEditColor] = useState('');
  const [editTagsText, setEditTagsText] = useState('');

  const [filterColor, setFilterColor] = useState<string | null>(null);
  const [filterTag, setFilterTag] = useState('');
  const [showMarkdownHelp, setShowMarkdownHelp] = useState(false);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    playthrough?.notes.forEach((note) => note.tags.forEach((tag) => tags.add(tag)));
    return Array.from(tags).sort((a, b) => a.localeCompare(b));
  }, [playthrough?.notes]);

  const filteredNotes = useMemo(() => {
    if (!playthrough) return [];

    return playthrough.notes.filter((note) => {
      const matchColor = filterColor ? note.color === filterColor : true;
      const matchTag = filterTag ? note.tags.includes(filterTag) : true;
      return matchColor && matchTag;
    });
  }, [filterColor, filterTag, playthrough]);

  if (!game || !playthrough) {
    return (
      <div className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] p-10 text-center">
        <FileText className="mx-auto mb-3 text-[var(--color-brand)]" size={40} />
        <h2 className="text-xl font-semibold">Playthrough not found</h2>
        <Link to="/" className="mt-4 inline-flex items-center gap-2 text-[var(--color-brand)] hover:underline">
          <ArrowLeft size={16} /> Back to games
        </Link>
      </div>
    );
  }

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !gameId || !playthroughId) return;

    const tags = tagsText.split(',').map((tag) => tag.trim()).filter(Boolean);

    addNote(gameId, playthroughId, {
      title,
      description,
      coverImageUrl,
      color,
      tags,
      date: new Date().toISOString()
    });

    setTitle('');
    setDescription('');
    setCoverImageUrl('');
    setColor(appColors.noteColors[0]);
    setTagsText('');
    setIsAdding(false);
  };

  const startEditingNote = (note: Note) => {
    setEditingNoteId(note.id);
    setEditTitle(note.title);
    setEditDescription(note.description || '');
    setEditCoverImageUrl(note.coverImageUrl || '');
    setEditColor(note.color);
    setEditTagsText(note.tags.join(', '));
  };

  const handleUpdateNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle.trim() || !gameId || !playthroughId || !editingNoteId) return;

    const tags = editTagsText.split(',').map((tag) => tag.trim()).filter(Boolean);

    updateNote(gameId, playthroughId, editingNoteId, {
      title: editTitle,
      description: editDescription,
      coverImageUrl: editCoverImageUrl,
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

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string) as { notes?: ImportedNote[] };
        if (parsed.notes && Array.isArray(parsed.notes)) {
          parsed.notes.forEach((note) => {
            if (!note.title) return;
            addNote(game.id, playthrough.id, {
              title: note.title,
              description: note.description || '',
              coverImageUrl: note.coverImageUrl || '',
              color: note.color || appColors.noteColors[0],
              tags: note.tags || [],
              date: note.date || new Date().toISOString()
            });
          });
          alert('Notes imported successfully');
        }
      } catch (err) {
        alert('Invalid JSON file');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const renderColorPicker = (selectedColor: string, onPick: (value: string) => void) => (
    <div className="min-w-0">
      <span className="mb-2 block text-sm text-[var(--text-secondary)]">Color</span>
      <div className="grid grid-cols-8 gap-1.5">
        {appColors.noteColors.map((noteColor) => (
          <button
            key={noteColor}
            type="button"
            onClick={() => onPick(noteColor)}
            className={`h-8 w-8 rounded-full border-2 transition ${selectedColor === noteColor ? 'border-white scale-105' : 'border-transparent'}`}
            style={{ backgroundColor: noteColor }}
            aria-label={`Pick note color ${noteColor}`}
          />
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-7">
      <Link to={`/game/${game.id}`} className="inline-flex items-center gap-2 text-[var(--text-secondary)] transition hover:text-white">
        <ArrowLeft size={16} /> Back to {game.title}
      </Link>

      <section className="rounded-lg border border-[var(--border-color)] bg-[linear-gradient(135deg,_rgba(56,189,248,0.11),_rgba(24,28,35,0.96)_52%)] p-5 sm:p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div className="max-w-3xl">
            <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-[var(--color-brand)]">{game.title}</p>
            <h2 className="text-3xl font-bold tracking-tight">{playthrough.title}</h2>
            <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">{playthrough.description || 'No description yet.'}</p>
            <div className="mt-5 flex flex-wrap gap-2 text-xs text-[var(--text-secondary)]">
              <span className="rounded-full border border-[var(--border-color)] bg-[var(--bg-main)]/55 px-3 py-1">{playthrough.status}</span>
              <span className="rounded-full border border-[var(--border-color)] bg-[var(--bg-main)]/55 px-3 py-1">{playthrough.notes.length} Notes</span>
              <span className="rounded-full border border-[var(--border-color)] bg-[var(--bg-main)]/55 px-3 py-1">Streak: {playthrough.longestStreak}</span>
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={handleExport} className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface-hover)] p-2 transition hover:border-[var(--color-brand)] hover:text-[var(--color-brand)]" title="Export Notes" aria-label="Export notes">
              <Download size={17} />
            </button>
            <label className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface-hover)] p-2 transition hover:border-[var(--color-warning-custom)] hover:text-[var(--color-warning-custom)] cursor-pointer" title="Import Notes" aria-label="Import notes">
              <Upload size={17} />
              <input type="file" accept=".json" onChange={handleImport} className="hidden" />
            </label>
            <button onClick={handleDeletePlaythrough} className="rounded-lg border border-[var(--color-danger-custom)]/30 bg-[var(--color-danger-custom)]/10 p-2 text-[var(--color-danger-custom)] transition hover:bg-[var(--color-danger-custom)]/20" aria-label="Delete playthrough">
              <Trash2 size={17} />
            </button>
          </div>
        </div>
      </section>

      <div className="flex flex-col gap-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)]/80 p-3 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 flex-1 items-center gap-3 overflow-x-auto">
          <Filter size={18} className="shrink-0 text-[var(--text-secondary)]" />
          <select
            value={filterTag}
            onChange={(e) => setFilterTag(e.target.value)}
            className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)] p-2 text-sm outline-none transition focus:border-[var(--color-brand)]"
          >
            <option value="">All Tags</option>
            {allTags.map((tag) => <option key={tag} value={tag}>{tag}</option>)}
          </select>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setFilterColor(null)}
              className={`h-8 min-w-10 rounded-full border px-2 text-xs ${!filterColor ? 'border-white text-white' : 'border-[var(--border-color)] text-[var(--text-secondary)]'}`}
              title="All Colors"
            >
              All
            </button>
            {appColors.noteColors.map((noteColor) => (
              <button
                key={noteColor}
                onClick={() => setFilterColor(noteColor)}
                className={`h-8 w-8 shrink-0 rounded-full border-2 ${filterColor === noteColor ? 'border-white' : 'border-transparent'}`}
                style={{ backgroundColor: noteColor }}
                aria-label={`Filter by color ${noteColor}`}
              />
            ))}
          </div>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--color-brand)] px-4 py-2.5 font-semibold text-slate-950 transition hover:bg-[var(--color-brand-hover)] md:w-auto"
        >
          <Plus size={18} /> Add Note
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAddNote} className="flex flex-col gap-4 rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] p-4">
          <input
            type="text"
            placeholder="Note Title*"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)] p-3 text-lg font-semibold outline-none transition focus:border-[var(--color-brand)]"
          />

          <input
            type="url"
            placeholder="Cover Image URL"
            value={coverImageUrl}
            onChange={(e) => setCoverImageUrl(e.target.value)}
            className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)] p-3 outline-none transition focus:border-[var(--color-brand)]"
          />

          <div className="relative">
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="text-sm text-[var(--text-secondary)]">Description (Markdown Supported)</span>
            </div>
            <MarkdownHelpPanel isOpen={showMarkdownHelp} onToggle={() => setShowMarkdownHelp(!showMarkdownHelp)} />
            <textarea
              placeholder="Your note..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-40 w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)] p-3 font-mono text-sm outline-none transition focus:border-[var(--color-brand)]"
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <input
              type="text"
              placeholder="Tags (comma separated)"
              value={tagsText}
              onChange={(e) => setTagsText(e.target.value)}
              className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)] p-3 outline-none transition focus:border-[var(--color-brand)]"
            />
            {renderColorPicker(color, setColor)}
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setIsAdding(false)} className="rounded-lg px-4 py-2 text-[var(--text-secondary)] transition hover:text-white">Cancel</button>
            <button type="submit" className="rounded-lg bg-[var(--color-brand)] px-4 py-2 font-semibold text-slate-950 transition hover:bg-[var(--color-brand-hover)]">Save Note</button>
          </div>
        </form>
      )}

      <div>
        {filteredNotes.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[var(--border-color)] bg-[var(--bg-surface)]/50 py-12 text-center text-[var(--text-secondary)]">
            <FileText className="mx-auto mb-3 text-[var(--color-brand)]" size={40} />
            No notes found.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredNotes.map((note) => (
            <article key={note.id} className="relative overflow-hidden rounded-lg border border-[var(--border-color)] border-l-[6px] bg-[var(--bg-surface)] shadow-sm transition hover:border-r-[var(--color-brand)] hover:shadow-lg hover:shadow-black/15" style={{ borderLeftColor: note.color }}>
              {editingNoteId === note.id ? (
                <form onSubmit={handleUpdateNote} className="flex flex-col gap-3 p-5">
                  <input
                    type="text"
                    required
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)] p-3 text-base font-semibold outline-none transition focus:border-[var(--color-brand)]"
                  />
                  <input
                    type="url"
                    placeholder="Cover Image URL"
                    value={editCoverImageUrl}
                    onChange={(e) => setEditCoverImageUrl(e.target.value)}
                    className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)] p-3 outline-none transition focus:border-[var(--color-brand)]"
                  />
                  <div className="relative">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <span className="text-sm text-[var(--text-secondary)]">Description (Markdown Supported)</span>
                    </div>
                    <MarkdownHelpPanel isOpen={showMarkdownHelp} onToggle={() => setShowMarkdownHelp(!showMarkdownHelp)} />
                    <textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      className="h-36 w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)] p-3 font-mono text-sm outline-none transition focus:border-[var(--color-brand)]"
                    />
                  </div>
                  <div className="grid gap-3">
                    <input
                      type="text"
                      placeholder="Tags (comma separated)"
                      value={editTagsText}
                      onChange={(e) => setEditTagsText(e.target.value)}
                      className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)] p-3 outline-none transition focus:border-[var(--color-brand)]"
                    />
                    {renderColorPicker(editColor, setEditColor)}
                  </div>
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setEditingNoteId(null)} className="rounded-lg px-4 py-2 text-[var(--text-secondary)] transition hover:text-white">Cancel</button>
                    <button type="submit" className="rounded-lg bg-[var(--color-brand)] px-4 py-2 font-semibold text-slate-950 transition hover:bg-[var(--color-brand-hover)]">Update Note</button>
                  </div>
                </form>
              ) : (
                <>
                  <Link to={`/game/${game.id}/playthrough/${playthrough.id}/note/${note.id}`} className="block h-full">
                    {note.coverImageUrl ? (
                      <img src={note.coverImageUrl} alt={note.title} className="h-40 w-full object-cover" loading="lazy" />
                    ) : (
                      <div className="flex h-28 w-full items-center justify-center bg-[linear-gradient(135deg,_rgba(56,189,248,0.14),_rgba(52,211,153,0.08))]">
                        <FileText size={34} style={{ color: note.color }} />
                      </div>
                    )}

                    <div className="flex min-h-56 flex-col p-5">
                      <div className="mb-4 pr-16">
                        <h4 className="text-xl font-bold line-clamp-2" style={{ color: note.color }}>{note.title}</h4>
                        <span className="text-xs text-[var(--text-secondary)]">{new Date(note.date).toLocaleString()}</span>
                      </div>

                      <p className="flex-1 text-sm leading-6 text-[var(--text-secondary)] line-clamp-4">
                        {note.description || 'No note content yet.'}
                      </p>

                      {note.tags.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2 border-t border-[var(--border-color)] pt-4">
                          {note.tags.slice(0, 4).map((tag) => (
                            <span key={tag} className="rounded-full border border-[var(--border-color)] bg-[var(--bg-main)] px-2.5 py-1 text-xs text-[var(--text-secondary)]">
                              #{tag}
                            </span>
                          ))}
                          {note.tags.length > 4 && (
                            <span className="rounded-full border border-[var(--border-color)] bg-[var(--bg-main)] px-2.5 py-1 text-xs text-[var(--text-secondary)]">
                              +{note.tags.length - 4}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </Link>

                  <div className="absolute right-3 top-3 flex gap-1 rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)]/90 p-1 shadow">
                      <button onClick={() => startEditingNote(note)} className="rounded-md p-1.5 text-[var(--text-secondary)] transition hover:bg-[var(--bg-surface-hover)] hover:text-[var(--color-brand)]" aria-label={`Edit ${note.title}`}>
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm('Delete note?')) deleteNote(game.id, playthrough.id, note.id);
                        }}
                        className="rounded-md p-1.5 text-[var(--text-secondary)] transition hover:bg-[var(--bg-surface-hover)] hover:text-[var(--color-danger-custom)]"
                        aria-label={`Delete ${note.title}`}
                      >
                        <Trash2 size={18} />
                      </button>
                  </div>
                </>
              )}
            </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

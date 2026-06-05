import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Edit, FileText, Trash2 } from 'lucide-react';
import { MarkdownHelpPanel } from '../components/MarkdownHelpPanel';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import { useJournal } from '../store/useJournalStore';
import { appColors } from '../theme/appColors';

export const NoteDetail = () => {
  const { gameId, playthroughId, noteId } = useParams();
  const navigate = useNavigate();
  const { games, deleteNote, updateNote } = useJournal();

  const game = games.find((item) => item.id === gameId);
  const playthrough = game?.playthroughs.find((item) => item.id === playthroughId);
  const note = playthrough?.notes.find((item) => item.id === noteId);

  const [isEditing, setIsEditing] = useState(false);
  const [showMarkdownHelp, setShowMarkdownHelp] = useState(false);
  const [title, setTitle] = useState(note?.title || '');
  const [description, setDescription] = useState(note?.description || '');
  const [coverImageUrl, setCoverImageUrl] = useState(note?.coverImageUrl || '');
  const [color, setColor] = useState(note?.color || appColors.noteColors[0]);
  const [tagsText, setTagsText] = useState(note?.tags.join(', ') || '');

  if (!game || !playthrough || !note) {
    return (
      <div className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] p-10 text-center">
        <FileText className="mx-auto mb-3 text-[var(--color-brand)]" size={40} />
        <h2 className="text-xl font-semibold">Note not found</h2>
        <Link to="/" className="mt-4 inline-flex items-center gap-2 text-[var(--color-brand)] hover:underline">
          <ArrowLeft size={16} /> Back to games
        </Link>
      </div>
    );
  }

  const startEditing = () => {
    setTitle(note.title);
    setDescription(note.description || '');
    setCoverImageUrl(note.coverImageUrl || '');
    setColor(note.color);
    setTagsText(note.tags.join(', '));
    setIsEditing(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    updateNote(game.id, playthrough.id, note.id, {
      title,
      description,
      coverImageUrl,
      color,
      tags: tagsText.split(',').map((tag) => tag.trim()).filter(Boolean)
    });
    setIsEditing(false);
  };

  const handleDeleteNote = () => {
    if (window.confirm('Delete note?')) {
      deleteNote(game.id, playthrough.id, note.id);
      navigate(`/game/${game.id}/playthrough/${playthrough.id}`);
    }
  };

  const renderColorPicker = () => (
    <div>
      <span className="mb-2 block text-sm text-[var(--text-secondary)]">Color</span>
      <div className="flex flex-wrap gap-1.5">
        {appColors.noteColors.map((noteColor) => (
          <button
            key={noteColor}
            type="button"
            onClick={() => setColor(noteColor)}
            className={`h-8 w-8 rounded-full border-2 transition ${color === noteColor ? 'scale-105 border-white' : 'border-transparent'}`}
            style={{ backgroundColor: noteColor }}
            aria-label={`Pick note color ${noteColor}`}
          />
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-7">
      <Link to={`/game/${game.id}/playthrough/${playthrough.id}`} className="inline-flex items-center gap-2 text-[var(--text-secondary)] transition hover:text-white">
        <ArrowLeft size={16} /> Back to {playthrough.title}
      </Link>

      <article className="overflow-hidden rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)]">
        {isEditing ? (
          <form onSubmit={handleSave} className="space-y-5 p-5 sm:p-7">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="mb-1 text-sm font-semibold uppercase tracking-wide text-[var(--color-brand)]">{game.title} / {playthrough.title}</p>
                <h2 className="text-2xl font-bold tracking-tight">Edit Note</h2>
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setIsEditing(false)} className="rounded-lg px-4 py-2 text-[var(--text-secondary)] transition hover:text-white">Cancel</button>
                <button type="submit" className="rounded-lg bg-[var(--color-brand)] px-4 py-2 font-semibold text-slate-950 transition hover:bg-[var(--color-brand-hover)]">Save</button>
              </div>
            </div>

            <div className="grid gap-4">
              <input
                type="text"
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
            </div>

            <div>
              <div className="mb-2 text-sm text-[var(--text-secondary)]">Description (Markdown Supported)</div>
              <MarkdownHelpPanel isOpen={showMarkdownHelp} onToggle={() => setShowMarkdownHelp(!showMarkdownHelp)} />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-2 h-72 w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)] p-3 font-mono text-sm outline-none transition focus:border-[var(--color-brand)]"
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
              {renderColorPicker()}
            </div>
          </form>
        ) : (
          <>
            {note.coverImageUrl ? (
              <img src={note.coverImageUrl} alt={note.title} className="max-h-[420px] w-full object-cover" loading="lazy" />
            ) : (
              <div className="flex h-52 w-full items-center justify-center bg-[linear-gradient(135deg,_rgba(56,189,248,0.14),_rgba(52,211,153,0.08))]">
                <FileText size={52} style={{ color: note.color }} />
              </div>
            )}

            <div className="p-5 sm:p-7">
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-[var(--color-brand)]">{game.title} / {playthrough.title}</p>
                  <h2 className="text-3xl font-bold tracking-tight" style={{ color: note.color }}>{note.title}</h2>
                  <p className="mt-2 text-sm text-[var(--text-secondary)]">{new Date(note.date).toLocaleString()}</p>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={startEditing}
                    className="inline-flex items-center gap-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)] px-3 py-2 text-sm text-[var(--text-secondary)] transition hover:border-[var(--color-brand)] hover:text-[var(--color-brand)]"
                  >
                    <Edit size={16} /> Edit
                  </button>
                  <button onClick={handleDeleteNote} className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-danger-custom)]/30 bg-[var(--color-danger-custom)]/10 px-3 py-2 text-sm text-[var(--color-danger-custom)] transition hover:bg-[var(--color-danger-custom)]/20">
                    <Trash2 size={16} /> Delete
                  </button>
                </div>
              </div>

              {note.tags.length > 0 && (
                <div className="mb-6 flex flex-wrap gap-2 border-b border-[var(--border-color)] pb-5">
                  {note.tags.map((tag) => (
                    <span key={tag} className="rounded-full border border-[var(--border-color)] bg-[var(--bg-main)] px-2.5 py-1 text-xs text-[var(--text-secondary)]">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {note.description ? (
                <MarkdownRenderer content={note.description} />
              ) : (
                <p className="text-[var(--text-secondary)]">No note content yet.</p>
              )}
            </div>
          </>
        )}
      </article>
    </div>
  );
};

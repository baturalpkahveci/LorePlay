import { Outlet, Link } from 'react-router-dom';
import { Cloud, CloudOff, Download, Gamepad2, HardDrive, LoaderCircle, Upload } from 'lucide-react';
import { useAppColors } from '../theme/useAppColors';
import { StatsPanel } from './StatsPanel';
import { useJournal } from '../store/useJournalStore';
import { AuthControls } from './AuthControls';
import { parseJournalData } from '../services/journalValidation';

export const Layout = () => {
  useAppColors();
  const { exportAllData, importAllData, storageMode, syncState, syncError } = useJournal();

  const handleExportAll = () => {
    const data = exportAllData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `game-journal-backup.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const rawData = ev.target?.result as string;
        const parsed = parseJournalData(JSON.parse(rawData) as unknown);

        const firstApproval = window.confirm(
          `Import will replace every game, playthrough and note in your ${storageMode === 'cloud' ? 'Neon cloud journal' : 'local guest journal'}.\n\nThe selected backup contains ${parsed.length} game(s). Continue?`
        );
        if (!firstApproval) return;

        const secondApproval = window.confirm(
          'This cannot be undone inside the app. LorePlay will download a safety backup of your current journal first, but the active data will still be overwritten. Continue to the final confirmation?'
        );
        if (!secondApproval) return;

        const typedApproval = window.prompt('Final confirmation: type OVERWRITE to replace your current journal.');
        if (typedApproval !== 'OVERWRITE') {
          alert('Import cancelled. Your current data was not changed.');
          return;
        }

        handleExportAll();
        importAllData(rawData);
        alert('Import completed. A pre-import safety backup was downloaded.');
      } catch {
        alert('Import failed. The file is not a valid LorePlay backup and no data was changed.');
      } finally {
        e.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] font-sans flex flex-col">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.16),_transparent_32rem),linear-gradient(180deg,_rgba(24,28,35,0.7),_rgba(16,19,24,0))]" />

      <header className="sticky top-0 z-50 border-b border-[var(--border-color)] bg-[var(--bg-surface)]/90 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition">
            <div className="bg-[var(--color-brand)] p-2 rounded-lg shadow-lg shadow-sky-500/20">
              <Gamepad2 size={22} className="text-slate-950" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold tracking-tight text-white">LorePlay</h1>
              <p className="text-xs text-[var(--text-secondary)]">Log your playthroughs, with style.</p>
            </div>
          </Link>
          
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <StatsPanel />
            <div className="w-px h-8 bg-[var(--border-color)] hidden md:block"></div>
            <div
              className="hidden items-center gap-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-main)] px-2.5 py-2 text-xs text-[var(--text-secondary)] xl:flex"
              title={syncError || (storageMode === 'cloud' ? 'Stored in Neon' : 'Stored in this browser')}
            >
              {syncState === 'error' ? <CloudOff size={15} className="text-[var(--color-danger-custom)]" /> : storageMode === 'local' ? <HardDrive size={15} /> : syncState === 'saving' || syncState === 'loading' ? <LoaderCircle size={15} className="animate-spin text-[var(--color-brand)]" /> : <Cloud size={15} className="text-[var(--color-success-custom)]" />}
              {syncState === 'error' ? 'Local fallback' : storageMode === 'local' ? 'Local' : syncState === 'saving' ? 'Saving' : syncState === 'loading' ? 'Loading' : 'Cloud'}
            </div>
            <div className="flex gap-2">
              <button 
                onClick={handleExportAll}
                className="p-2 bg-[var(--bg-surface-hover)] border border-[var(--border-color)] rounded-lg hover:text-[var(--color-brand)] hover:border-[var(--color-brand)] transition"
                title="Export Entire Profile"
                aria-label="Export entire profile"
              >
                <Download size={18} />
              </button>
              <label 
                className="p-2 bg-[var(--bg-surface-hover)] border border-[var(--border-color)] rounded-lg hover:text-[var(--color-warning-custom)] hover:border-[var(--color-warning-custom)] transition cursor-pointer"
                title="Import Profile Backup"
                aria-label="Import profile backup"
              >
                <Upload size={18} />
                <input type="file" accept=".json" onChange={handleImportAll} className="hidden" />
              </label>
            </div>
            <AuthControls />
          </div>
        </div>
      </header>
      
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8 sm:py-10">
        <Outlet />
      </main>

      <footer className="border-t border-[var(--border-color)] bg-[var(--bg-surface)]/70">
        <div className="max-w-6xl mx-auto flex flex-col gap-3 px-4 py-6 text-sm text-[var(--text-secondary)] sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="font-semibold text-[var(--text-primary)]">Game Journal</span>
            <span className="mx-2 text-[var(--border-color)]">/</span>
            Keep your saves, sessions and notes in one place.
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            <span>Local-first data</span>
            <span>Markdown notes</span>
            <span>Backup ready</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

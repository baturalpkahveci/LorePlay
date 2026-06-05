import { Outlet, Link } from 'react-router-dom';
import { Download, Gamepad2, Upload } from 'lucide-react';
import { useAppColors } from '../theme/useAppColors';
import { StatsPanel } from './StatsPanel';
import { useJournal } from '../store/useJournalStore';

export const Layout = () => {
  useAppColors();
  const { exportAllData, importAllData } = useJournal();

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
    
    if (!window.confirm("Warning: Importing will OVERWRITE all your current data. Are you sure you want to proceed?")) {
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        if (ev.target?.result) {
          importAllData(ev.target.result as string);
          alert("All data imported successfully!");
        }
      } catch (err) {
        alert("Failed to import. Please make sure the JSON file is valid.");
      }
      e.target.value = ''; // reset
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
              <h1 className="text-lg font-bold tracking-tight text-white">Game Journal</h1>
              <p className="text-xs text-[var(--text-secondary)]">Play notes, runs and memories</p>
            </div>
          </Link>
          
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <StatsPanel />
            <div className="w-px h-8 bg-[var(--border-color)] hidden md:block"></div>
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

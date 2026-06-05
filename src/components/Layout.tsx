import { Outlet, Link } from 'react-router-dom';
import { Gamepad2, Settings, Download, Upload } from 'lucide-react';
import { useAppColors } from '../theme/useAppColors';
import { StatsPanel } from './StatsPanel';
import { useJournal } from '../store/useJournalStore';

export const Layout = () => {
  useAppColors(); // Initialize custom colors
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
      <header className="bg-[var(--bg-surface)] border-b border-[var(--border-color)] sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition">
            <div className="bg-[var(--color-brand)] p-2 rounded-lg">
              <Gamepad2 size={24} className="text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white hidden sm:block">Game Journal</h1>
          </Link>
          
          <div className="flex items-center gap-4">
            <StatsPanel />
            <div className="w-px h-8 bg-[var(--border-color)] mx-2 hidden sm:block"></div>
            <div className="flex gap-2">
              <button 
                onClick={handleExportAll}
                className="p-2 bg-[var(--bg-surface-hover)] border border-[var(--border-color)] rounded-lg hover:text-[var(--color-brand)] transition"
                title="Export Entire Profile"
              >
                <Download size={18} />
              </button>
              <label 
                className="p-2 bg-[var(--bg-surface-hover)] border border-[var(--border-color)] rounded-lg hover:text-[var(--color-warning-custom)] transition cursor-pointer"
                title="Import Profile Backup"
              >
                <Upload size={18} />
                <input type="file" accept=".json" onChange={handleImportAll} className="hidden" />
              </label>
            </div>
          </div>
        </div>
      </header>
      
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
};

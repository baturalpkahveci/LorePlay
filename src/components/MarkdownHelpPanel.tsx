import React from 'react';
import { HelpCircle } from 'lucide-react';

interface MarkdownHelpPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  size?: number;
}

export const MarkdownHelpPanel: React.FC<MarkdownHelpPanelProps> = ({
  isOpen,
  onToggle,
  size = 14
}) => {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        className="text-[var(--text-secondary)] hover:text-white flex items-center gap-1 text-sm bg-[var(--bg-main)] px-2 py-1 rounded"
      >
        <HelpCircle size={size} /> Help
      </button>

      {isOpen && (
        <div className="absolute z-10 right-0 top-full mt-2 w-[min(420px,90vw)] mb-0 p-3 bg-[var(--bg-main)] border border-[var(--color-brand)]/50 rounded-lg text-sm text-[var(--text-secondary)] grid grid-cols-1 gap-2 shadow-lg">
          <div className="flex flex-wrap gap-3">
            <div>
              <code>**bold**</code>
            </div>
            <div>
              <code>*italic*</code>
            </div>
            <div>
              <code>[link](https://...)</code>
            </div>
          </div>

          <div>
            <code>![alt|300x200](url)</code>{' '}
            <span className="text-[var(--text-secondary)]">Resized image</span>
          </div>

          <div className="pt-2 border-t border-[var(--border-color)] text-xs leading-relaxed">
            <strong>Image URL:</strong> Tek satıra direkt resim URL’si yapıştır → otomatik olarak resim görünür.
            (Örn: <code>https://.../img.jpg</code>)
          </div>
        </div>
      )}
    </div>
  );
};


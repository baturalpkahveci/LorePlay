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
    <div className="w-full">
      <button
        type="button"
        onClick={onToggle}
        className="mb-2 ml-auto flex items-center gap-1 rounded-md bg-[var(--bg-main)] px-2 py-1 text-xs text-[var(--text-secondary)] transition hover:text-white"
      >
        <HelpCircle size={size} /> Help
      </button>

      {isOpen && (
        <div className="mt-2 w-full rounded-lg border border-[var(--color-brand)]/40 bg-[var(--bg-main)] p-3 text-xs leading-5 text-[var(--text-secondary)] shadow-lg shadow-black/10">
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-md bg-[var(--bg-surface)] px-2 py-1"><code>**bold**</code></div>
            <div className="rounded-md bg-[var(--bg-surface)] px-2 py-1"><code>*italic*</code></div>
            <div className="rounded-md bg-[var(--bg-surface)] px-2 py-1"><code>[text](url)</code></div>
            <div className="rounded-md bg-[var(--bg-surface)] px-2 py-1"><code>![alt|320x180](url)</code></div>
          </div>

          <div className="mt-2 border-t border-[var(--border-color)] pt-2">
            Paste a Steam screenshot or image URL on its own line to show it inline. Use <code>|widthxheight</code> in image alt text to size it.
          </div>
        </div>
      )}
    </div>
  );
};

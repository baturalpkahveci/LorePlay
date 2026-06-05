import { useEffect } from 'react';
import { appColors } from './appColors';

export function useAppColors() {
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--bg-main', appColors.background);
    root.style.setProperty('--bg-surface', appColors.surface);
    root.style.setProperty('--bg-surface-hover', appColors.surfaceHover);
    root.style.setProperty('--border-color', appColors.border);
    root.style.setProperty('--text-primary', appColors.textPrimary);
    root.style.setProperty('--text-secondary', appColors.textSecondary);
    root.style.setProperty('--color-primary', appColors.primary);
    root.style.setProperty('--color-primary-hover', appColors.primaryHover);
    root.style.setProperty('--color-danger', appColors.danger);
    root.style.setProperty('--color-success', appColors.success);
    root.style.setProperty('--color-warning', appColors.warning);
  }, []);
}

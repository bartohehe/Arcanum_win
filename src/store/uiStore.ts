import { create } from 'zustand';
import type { ElementId, Toast } from '../types';

interface UiState {
  activeCategory: ElementId | null;
  settingsOpen: boolean;
  toasts: Toast[];
  activeQuestBucket: 'daily' | 'weekly' | 'epic';
  theme: string;

  setActiveCategory: (id: ElementId | null) => void;
  setSettingsOpen: (open: boolean) => void;
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  setActiveQuestBucket: (bucket: 'daily' | 'weekly' | 'epic') => void;
  setTheme: (theme: string) => void;
}

export const useUiStore = create<UiState>((set) => ({
  activeCategory: null,
  settingsOpen: false,
  toasts: [],
  activeQuestBucket: 'daily',
  theme: localStorage.getItem('arcanum-theme') ?? 'elements',

  setActiveCategory: (id) => set({ activeCategory: id }),
  setSettingsOpen: (open) => set({ settingsOpen: open }),
  addToast: (toast) => {
    const id = crypto.randomUUID();
    set((s) => ({
      toasts: [...s.toasts, { ...toast, id }],
    }));
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 5000);
  },
  removeToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  setActiveQuestBucket: (bucket) => set({ activeQuestBucket: bucket }),
  setTheme: (theme) => {
    localStorage.setItem('arcanum-theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    set({ theme });
  },
}));

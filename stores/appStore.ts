import { create } from 'zustand';

type Module = 'wallet' | 'tokens' | 'perps' | 'flow';

interface AppState {
  activeModule: Module;
  setActiveModule: (m: Module) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  sidebarOpen: boolean;
  toggleSidebar: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeModule: 'wallet',
  setActiveModule: (activeModule) => set({ activeModule }),
  searchQuery: '',
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
}));

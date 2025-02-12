import { create } from 'zustand';
import { newTab } from '../_utils/tabs';

interface NavigationState {
  tabs: Partial<FileNode>[];
  activeTab: number;

  selectedNode: FileNode | null;

  addTab: (tab?: Partial<FileNode>) => void;
  setTab: (tab: Partial<FileNode>) => void;
  removeTab: (index: number) => void;
  resetTabs: () => void;

  setActive: (path: string) => void;

  selectNode: (node: FileNode) => void;
}

const useNavigationStore = create<NavigationState>((set) => ({
  tabs: [newTab],
  activeTab: 0,
  selectedNode: null,

  addTab: (tab) =>
    set((state) => {
      return {
        tabs: [...state.tabs, tab ? tab : newTab],
        activeTab: state.tabs.length,
      };
    }),
  setTab: (tab) =>
    set((state) => {
      const tabs = [...state.tabs];
      tabs[state.activeTab] = tab;

      return {
        tabs,
      };
    }),
  removeTab: (index) =>
    set((state) => {
      const tabs = [...state.tabs];

      tabs.splice(index, 1);
      if (tabs.length === 0) tabs.push(newTab);

      const activeTab =
        state.activeTab >= tabs.length ? state.activeTab - 1 : state.activeTab;

      return { tabs, activeTab };
    }),
  resetTabs: () => set(() => ({ tabs: [newTab], activeTab: 0 })),

  setActive: (path) =>
    set((state) => {
      const index = state.tabs.findIndex((t) => t.path === decodeURI(path));
      if (index < 0) return state;
      return { activeTab: index };
    }),

  selectNode: (node) => set(() => ({ selectedNode: node })),
}));

export default useNavigationStore;

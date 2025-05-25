import { create } from 'zustand';
import { useBlocksStore } from '@/stores/blocksStore';
import { useMetadataStore } from '@/stores/metadataStore';
import tabUtils from '@/utils/tabUtils';
import type { PlaybackState } from '@/types';

interface UIState {
  // UI state
  activeBlockId: string | null;
  playback: PlaybackState;
  exportOpen: boolean;
  importOpen: boolean;
  exportText: string;
  importText: string;
  settingsOpen: boolean;

  // UI actions
  setActiveBlockId: (id: string | null) => void;
  setPlayback: (updates: Partial<PlaybackState>) => void;
  stopPlayback: () => void;

  setExportOpen: (open: boolean) => void;
  setImportOpen: (open: boolean) => void;
  setExportText: (text: string) => void;
  setImportText: (text: string) => void;
  setSettingsOpen: (open: boolean) => void;

  // UI with domain logic interaction
  handleExport: () => void;
  handleImport: () => void;
  handleCopyExport: () => void;
  handleDownloadExport: () => void;
  handleBlockAction: (
    action: 'add' | 'delete' | 'duplicate',
    blockType?: 'text' | 'tab',
    blockId?: string,
    afterBlockId?: string | null
  ) => void;
}

export const useUIStore = create<UIState>()((set, get) => ({
  // Initial state
  activeBlockId: '1',
  playback: {
    isPlaying: false,
    currentBlock: null,
    currentBar: 0,
    playingAll: false,
  },
  exportOpen: false,
  importOpen: false,
  exportText: '',
  importText: '',
  settingsOpen: false,

  // UI Actions
  setActiveBlockId: (id) => set({ activeBlockId: id }),

  setPlayback: (updates) =>
    set((state) => ({
      playback: { ...state.playback, ...updates },
    })),

  stopPlayback: () =>
    set({
      playback: {
        isPlaying: false,
        currentBlock: null,
        currentBar: 0,
        playingAll: false,
      },
    }),

  // UI state actions
  setExportOpen: (open) => set({ exportOpen: open }),
  setImportOpen: (open) => set({ importOpen: open }),
  setExportText: (text) => set({ exportText: text }),
  setImportText: (text) => set({ importText: text }),
  setSettingsOpen: (open) => set({ settingsOpen: open }),

  // Actions that interact with domain state
  handleExport: () => {
    const blocks = useBlocksStore.getState().blocks;
    const metadata = useMetadataStore.getState().metadata;
    const exportStr = tabUtils.createExport(blocks, metadata);
    set({ exportText: exportStr, exportOpen: true });
  },

  handleImport: () => {
    const { importText } = get();
    try {
      const importedData = tabUtils.parseImport(importText);
      if (importedData) {
        // Update the blocks and metadata in their respective stores
        useBlocksStore.getState().setBlocks(importedData.blocks);
        useMetadataStore.getState().updateMetadata(importedData.metadata);

        // Close the import dialog and reset text
        set({
          importOpen: false,
          importText: '',
          activeBlockId: importedData.blocks[0]?.id || null,
        });
      } else {
        alert('Invalid import format.');
      }
    } catch (error) {
      console.error('Import error:', error);
      alert('Error importing data. Please check the format.');
    }
  },

  handleCopyExport: () => {
    const { exportText } = get();
    navigator.clipboard.writeText(exportText);
  },

  handleDownloadExport: () => {
    const { exportText } = get();
    const metadata = useMetadataStore.getState().metadata;
    const blob = new Blob([exportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${metadata.title.replace(/\s+/g, '_')}.gtab`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  // Handle block actions and update active block
  handleBlockAction: (action, blockType, blockId, afterBlockId) => {
    const blocksStore = useBlocksStore.getState();
    let newActiveBlockId: string | null = null;

    switch (action) {
      case 'add':
        if (!blockType) return;
        newActiveBlockId = blocksStore.addBlock(blockType, afterBlockId);
        set({ activeBlockId: newActiveBlockId });
        break;

      case 'delete':
        if (!blockId) return;
        blocksStore.deleteBlock(blockId);

        // Update active block if we deleted the active one
        if (get().activeBlockId === blockId) {
          const remainingBlocks = blocksStore.blocks;
          newActiveBlockId = remainingBlocks[0]?.id || null;
          set({ activeBlockId: newActiveBlockId });
        }
        break;

      case 'duplicate':
        if (!blockId) return;
        newActiveBlockId = blocksStore.duplicateBlock(blockId);
        if (newActiveBlockId) {
          set({ activeBlockId: newActiveBlockId });
        }
        break;
    }
  },
}));

// Helper function that ensures a block is active
export const ensureActiveBlock = () => {
  const { activeBlockId } = useUIStore.getState();
  const { blocks } = useBlocksStore.getState();

  if (!activeBlockId || !blocks.some((b) => b.id === activeBlockId)) {
    // If no active block or the active block doesn't exist, select the first one
    const newActiveId = blocks[0]?.id || null;
    useUIStore.getState().setActiveBlockId(newActiveId);
  }
};

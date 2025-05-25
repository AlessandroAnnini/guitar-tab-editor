import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import tabUtils from '@/utils/tabUtils';
import type { Block, TabMetadata, PlaybackState } from '@/types';

// Define the store's state type
interface TabStore {
  // State
  blocks: Block[];
  metadata: TabMetadata;
  playback: PlaybackState;
  activeBlockId: string | null;
  exportOpen: boolean;
  importOpen: boolean;
  exportText: string;
  importText: string;
  settingsOpen: boolean;

  // Actions
  setBlocks: (blocks: Block[]) => void;
  updateBlock: (id: string, updates: Partial<Block>) => void;
  addBlock: (type: 'text' | 'tab', afterBlockId?: string | null) => void;
  deleteBlock: (id: string) => void;
  duplicateBlock: (id: string) => void;
  moveBlock: (id: string, direction: 'up' | 'down') => void;

  updateMetadata: (updates: Partial<TabMetadata>) => void;

  setActiveBlockId: (id: string | null) => void;

  setPlayback: (updates: Partial<PlaybackState>) => void;
  playBlock: (blockId: string) => Promise<void>;
  playAll: () => Promise<void>;
  stopPlayback: () => void;

  setExportOpen: (open: boolean) => void;
  setImportOpen: (open: boolean) => void;
  setExportText: (text: string) => void;
  setImportText: (text: string) => void;
  setSettingsOpen: (open: boolean) => void;

  handleExport: () => void;
  handleImport: () => void;
  handleCopyExport: () => void;
  handleDownloadExport: () => void;
}

// Create the store
export const useTabStore = create<TabStore>()(
  persist(
    (set, get) => ({
      // Initial state
      blocks: [
        {
          id: '1',
          type: 'text',
          content:
            '# My Guitar Tab\n\nThis is an example tab in notebook format.',
        },
        {
          id: '2',
          type: 'tab',
          content: `e|--------------------|\nB|--------------------|\nG|--------------------|\nD|--------------------|\nA|--------------------|\nE|--------------------|\n`,
          tempo: 120,
          duration: '1/4',
          bars: 1,
        },
      ],
      metadata: {
        title: 'Untitled Tab',
        tuning: 'E A D G B E',
        spacing: 1,
        instrument: 'acoustic',
      },
      playback: {
        isPlaying: false,
        currentBlock: null,
        currentBar: 0,
        playingAll: false,
      },
      activeBlockId: '1',
      exportOpen: false,
      importOpen: false,
      exportText: '',
      importText: '',
      settingsOpen: false,

      // Actions to modify state
      setBlocks: (blocks) => set({ blocks }),

      updateBlock: (id, updates) =>
        set((state) => ({
          blocks: state.blocks.map((block) =>
            block.id === id ? ({ ...block, ...updates } as Block) : block
          ),
        })),

      addBlock: (type, afterBlockId = null) => {
        const { metadata, blocks } = get();

        // Create the base block
        const baseBlock = {
          id: Date.now().toString(),
          content:
            type === 'tab' ? tabUtils.generateEmptyTab(1, metadata.tuning) : '',
        };

        // Create a properly typed block depending on the type
        const newBlock: Block =
          type === 'tab'
            ? {
                ...baseBlock,
                type: 'tab',
                tempo: 120,
                duration: '1/4',
                bars: 1,
              }
            : {
                ...baseBlock,
                type: 'text',
              };

        // Add the block to the list
        set((state) => {
          const newBlocks = [...state.blocks];
          if (afterBlockId) {
            // Find index of the block to insert after
            const index = newBlocks.findIndex(
              (block) => block.id === afterBlockId
            );
            if (index >= 0) {
              newBlocks.splice(index + 1, 0, newBlock);
              return { blocks: newBlocks, activeBlockId: newBlock.id };
            }
          }
          // If no specific block to insert after or not found, add to the end
          newBlocks.push(newBlock);
          return { blocks: newBlocks, activeBlockId: newBlock.id };
        });
      },

      deleteBlock: (id) =>
        set((state) => {
          // Don't delete the last block
          if (state.blocks.length <= 1) {
            return state;
          }

          // Create filtered blocks
          const newBlocks = state.blocks.filter((block) => block.id !== id);

          // Update active block if needed
          let activeBlockId = state.activeBlockId;
          if (state.activeBlockId === id) {
            activeBlockId = newBlocks[0]?.id || null;
          }

          return { blocks: newBlocks, activeBlockId };
        }),

      duplicateBlock: (id) =>
        set((state) => {
          const blockToDuplicate = state.blocks.find(
            (block) => block.id === id
          );
          if (!blockToDuplicate) return state;

          // Create a new ID for the duplicate
          const newId = Date.now().toString();

          // Create a duplicate with the same properties
          const duplicateBlock = {
            ...blockToDuplicate,
            id: newId,
          };

          // Insert the duplicate after the original block
          const index = state.blocks.findIndex((block) => block.id === id);
          if (index < 0) return state;

          const newBlocks = [...state.blocks];
          newBlocks.splice(index + 1, 0, duplicateBlock);

          return { blocks: newBlocks, activeBlockId: newId };
        }),

      moveBlock: (id, direction) =>
        set((state) => {
          const index = state.blocks.findIndex((block) => block.id === id);
          if (
            (direction === 'up' && index === 0) ||
            (direction === 'down' && index === state.blocks.length - 1)
          ) {
            return state;
          }

          const newBlocks = [...state.blocks];
          const newIndex = direction === 'up' ? index - 1 : index + 1;
          const [movedBlock] = newBlocks.splice(index, 1);
          newBlocks.splice(newIndex, 0, movedBlock);

          return { blocks: newBlocks };
        }),

      updateMetadata: (updates) =>
        set((state) => ({
          metadata: { ...state.metadata, ...updates },
        })),

      setActiveBlockId: (id) => set({ activeBlockId: id }),

      setPlayback: (updates) =>
        set((state) => ({
          playback: { ...state.playback, ...updates },
        })),

      // Audio playback functions
      playBlock: async (blockId) => {
        const { blocks } = get();
        const block = blocks.find((b) => b.id === blockId);
        if (!block || block.type !== 'tab') return;

        // Will be implemented in audioUtils.ts
        // This is a placeholder that provides the Zustand store interface
        set({
          playback: {
            isPlaying: true,
            currentBlock: blockId,
            currentBar: 0,
            playingAll: false,
          },
        });
      },

      playAll: async () => {
        // Will be implemented in audioStore.ts
        // This is a placeholder that provides the Zustand store interface
        set({
          playback: {
            isPlaying: true,
            currentBlock: null,
            currentBar: 0,
            playingAll: true,
          },
        });
      },

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

      // Export/Import actions
      handleExport: () => {
        const { blocks, metadata } = get();
        const exportStr = tabUtils.createExport(blocks, metadata);
        set({ exportText: exportStr, exportOpen: true });
      },

      handleImport: () => {
        const { importText } = get();
        try {
          const importedData = tabUtils.parseImport(importText);
          if (importedData) {
            set({
              blocks: importedData.blocks,
              metadata: importedData.metadata,
              importOpen: false,
              importText: '',
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
        const { exportText, metadata } = get();
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
    }),
    {
      name: 'guitar-tab-storage',
      // Only persist these fields
      partialize: (state) => ({
        blocks: state.blocks,
        metadata: state.metadata,
      }),
    }
  )
);

// Helper to check if there are tab blocks
export const hasTabBlocks = () => {
  const blocks = useTabStore.getState().blocks;
  return blocks.some((block) => block.type === 'tab');
};

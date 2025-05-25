import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import tabUtils from '@/utils/tabUtils';
import type { Block } from '@/types';
import { useMetadataStore } from '@/stores/metadataStore';

interface BlocksState {
  // State
  blocks: Block[];

  // Actions
  setBlocks: (blocks: Block[]) => void;
  updateBlock: (id: string, updates: Partial<Block>) => void;
  addBlock: (type: 'text' | 'tab', afterBlockId?: string | null) => string;
  deleteBlock: (id: string) => void;
  duplicateBlock: (id: string) => string | null;
  moveBlock: (id: string, direction: 'up' | 'down') => void;
}

export const useBlocksStore = create<BlocksState>()(
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

      // Actions for block management
      setBlocks: (blocks) => set({ blocks }),

      updateBlock: (id, updates) =>
        set((state) => ({
          blocks: state.blocks.map((block) =>
            block.id === id ? ({ ...block, ...updates } as Block) : block
          ),
        })),

      addBlock: (type, afterBlockId = null) => {
        // Get tuning from metadata store
        const tuning = useMetadataStore.getState().metadata.tuning;

        // Create the base block
        const baseBlock = {
          id: Date.now().toString(),
          content: type === 'tab' ? tabUtils.generateEmptyTab(1, tuning) : '',
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
              return { blocks: newBlocks };
            }
          }
          // If no specific block to insert after or not found, add to the end
          newBlocks.push(newBlock);
          return { blocks: newBlocks };
        });

        // Return the ID so UI store can set it as active
        return newBlock.id;
      },

      deleteBlock: (id) =>
        set((state) => {
          // Don't delete the last block
          if (state.blocks.length <= 1) {
            return state;
          }

          // Create filtered blocks
          const newBlocks = state.blocks.filter((block) => block.id !== id);
          return { blocks: newBlocks };
        }),

      duplicateBlock: (id) => {
        const blockToDuplicate = get().blocks.find((block) => block.id === id);
        if (!blockToDuplicate) return null;

        // Create a new ID for the duplicate
        const newId = Date.now().toString();

        // Create a duplicate with the same properties
        const duplicateBlock = {
          ...blockToDuplicate,
          id: newId,
        };

        // Insert the duplicate after the original block
        set((state) => {
          const index = state.blocks.findIndex((block) => block.id === id);
          if (index < 0) return state;

          const newBlocks = [...state.blocks];
          newBlocks.splice(index + 1, 0, duplicateBlock);

          return { blocks: newBlocks };
        });

        // Return the new ID so the UI can set it as active
        return newId;
      },

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
    }),
    {
      name: 'guitar-tab-blocks',
      partialize: (state) => ({
        blocks: state.blocks,
      }),
    }
  )
);

// Helper function to check if there are tab blocks
export const hasTabBlocks = () => {
  const blocks = useBlocksStore.getState().blocks;
  return blocks.some((block) => block.type === 'tab');
};

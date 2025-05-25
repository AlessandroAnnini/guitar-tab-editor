import { create } from 'zustand';
import audioUtils from '@/audio-utils';
import type { InstrumentType } from '@/audio-utils';
import tabUtils from '@/utils/tabUtils';
import { useBlocksStore } from '@/stores/blocksStore';
import { useUIStore } from '@/stores/uiStore';

interface AudioStore {
  // State
  isInitialized: boolean;
  currentInstrument: InstrumentType;

  // Actions
  initAudio: () => Promise<void>;
  playBlock: (blockId: string) => Promise<void>;
  playAll: () => Promise<void>;
  stopPlayback: () => void;
  setInstrument: (instrument: InstrumentType) => void;
}

// Create the audio store
export const useAudioStore = create<AudioStore>()((set, get) => ({
  isInitialized: false,
  currentInstrument: 'acoustic',

  // Initialize the audio engine
  initAudio: async () => {
    try {
      await audioUtils.initInstruments();
      set({ isInitialized: true });
    } catch (error) {
      console.error('Failed to initialize audio:', error);
      set({ isInitialized: false });
    }
  },

  // Set current instrument
  setInstrument: (instrument: InstrumentType) => {
    audioUtils.setInstrument(instrument);
    set({ currentInstrument: instrument });
  },

  // Play a single block
  playBlock: async (blockId: string) => {
    const { isInitialized } = get();
    const blocksStore = useBlocksStore.getState();
    const uiStore = useUIStore.getState();
    const block = blocksStore.blocks.find((b) => b.id === blockId);

    if (!block || block.type !== 'tab') return;

    try {
      // Set playback state
      uiStore.setPlayback({
        isPlaying: true,
        currentBlock: blockId,
        currentBar: 0,
        playingAll: false,
      });

      // Initialize audio if needed
      if (!isInitialized) {
        await get().initAudio();
      }

      const parsedTab = tabUtils.parseTab(block.content);
      if (!parsedTab || !parsedTab.notes || parsedTab.notes.length === 0) {
        console.log('No notes to play in this block');
        uiStore.stopPlayback();
        return;
      }

      // Play each bar in sequence
      for (let barIndex = 0; barIndex < parsedTab.notes.length; barIndex++) {
        // Check if playback was stopped
        if (!useUIStore.getState().playback.isPlaying) {
          console.log('Playback was stopped before completion');
          break;
        }

        // Update current bar
        uiStore.setPlayback({ currentBar: barIndex });

        // Play the bar
        const barNotes = parsedTab.notes[barIndex];
        await audioUtils.playBar(barNotes, block.duration, block.tempo);
      }
    } catch (error) {
      console.error('Playback error:', error);
    } finally {
      // Ensure we properly clean up on completion or error
      console.log('Playback complete, cleaning up');
      audioUtils.stopPlayback();
      uiStore.stopPlayback();
    }
  },

  // Play all tab blocks
  playAll: async () => {
    const { isInitialized } = get();
    const blocksStore = useBlocksStore.getState();
    const uiStore = useUIStore.getState();

    try {
      // Set initial playback state
      uiStore.setPlayback({
        isPlaying: true,
        currentBlock: null,
        currentBar: 0,
        playingAll: true,
      });

      // Initialize audio if needed
      if (!isInitialized) {
        await get().initAudio();
      }

      // Make sure transport is clean at the start
      audioUtils.stopPlayback();
      console.log('Starting "Play All" sequence');

      // Play each tab block in sequence
      for (let i = 0; i < blocksStore.blocks.length; i++) {
        // Check if playback was stopped
        if (!useUIStore.getState().playback.isPlaying) {
          console.log('Playback was stopped before completion');
          break;
        }

        const block = blocksStore.blocks[i];
        if (block.type !== 'tab') {
          console.log('Skipping non-tab block', block.id);
          continue;
        }

        // Update current block
        console.log(
          `Playing block ${i + 1}/${blocksStore.blocks.length}: ${block.id}`
        );
        uiStore.setPlayback({
          currentBlock: block.id,
          currentBar: 0,
        });

        const parsedTab = tabUtils.parseTab(block.content);
        if (!parsedTab || !parsedTab.notes || parsedTab.notes.length === 0) {
          console.log('Block has no valid notes, skipping');
          continue;
        }

        // Play each bar in the block
        for (let barIndex = 0; barIndex < parsedTab.notes.length; barIndex++) {
          // Check if playback was stopped
          if (!useUIStore.getState().playback.isPlaying) {
            console.log('Playback was stopped before completion');
            break;
          }

          // Update current bar
          uiStore.setPlayback({ currentBar: barIndex });
          console.log(
            `Block ${block.id}: Playing bar ${barIndex + 1}/${
              parsedTab.notes.length
            }`
          );

          // Play the bar
          const barNotes = parsedTab.notes[barIndex];

          // Wait for the bar to complete before moving to next
          await audioUtils.playBar(barNotes, block.duration, block.tempo);

          // Short delay between bars to avoid audio conflicts
          if (barIndex < parsedTab.notes.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, 100));
          }
        }

        // Reset transport after each block to avoid conflicts
        audioUtils.stopPlayback();

        // Slight pause between blocks for clarity
        if (i < blocksStore.blocks.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 300));
        }
      }
    } catch (error) {
      console.error('Playback error:', error);
    } finally {
      // Ensure we properly clean up on completion or error
      console.log('Play All complete, cleaning up');
      audioUtils.stopPlayback();
      uiStore.stopPlayback();
    }
  },

  // Stop playback
  stopPlayback: () => {
    // Stop any audio playback
    audioUtils.stopPlayback();

    // Update UI state
    useUIStore.getState().stopPlayback();
  },
}));

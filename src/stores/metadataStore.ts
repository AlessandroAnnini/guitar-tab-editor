import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TabMetadata } from '@/types';
import { useAudioStore } from './audioStore';
import type { InstrumentType } from '@/audio-utils';

interface MetadataState {
  // State
  metadata: TabMetadata;

  // Actions
  updateMetadata: (updates: Partial<TabMetadata>) => void;
}

export const useMetadataStore = create<MetadataState>()(
  persist(
    (set) => ({
      // Initial state
      metadata: {
        title: 'Untitled Tab',
        tuning: 'E A D G B E',
        spacing: 1,
        instrument: 'acoustic',
      },

      // Actions
      updateMetadata: (updates) => {
        // If instrument is changing, also update the audioStore
        if (updates.instrument) {
          // Use only valid instrument types
          const validInstruments: InstrumentType[] = [
            'acoustic',
            'electric',
            'bass',
            'piano',
          ];

          if (validInstruments.includes(updates.instrument as InstrumentType)) {
            useAudioStore
              .getState()
              .setInstrument(updates.instrument as InstrumentType);
          }
        }

        set((state) => ({
          metadata: { ...state.metadata, ...updates },
        }));
      },
    }),
    {
      name: 'guitar-tab-metadata',
      partialize: (state) => ({
        metadata: state.metadata,
      }),
    }
  )
);

// Helper function to get the current tuning
export const getCurrentTuning = () => {
  return useMetadataStore.getState().metadata.tuning;
};

import { useCallback } from 'react';
import {
  useBlocksStore,
  useMetadataStore,
  useUIStore,
  useAudioStore,
} from './index';
import { useStoreWithEqualityFn } from 'zustand/traditional';
import { shallow } from 'zustand/shallow';
import type { Block } from '@/types';

/**
 * Custom hook that returns block-related state and actions with optimal re-render behavior
 */
export const useBlockManager = () => {
  // Get blocks state from blocks store
  const blocksState = useStoreWithEqualityFn(
    useBlocksStore,
    (state) => ({
      blocks: state.blocks,
      updateBlock: state.updateBlock,
      moveBlock: state.moveBlock,
    }),
    shallow
  );

  // Get active block from UI store
  const uiState = useStoreWithEqualityFn(
    useUIStore,
    (state) => ({
      activeBlockId: state.activeBlockId,
      setActiveBlockId: state.setActiveBlockId,
      handleBlockAction: state.handleBlockAction,
    }),
    shallow
  );

  // Return a combined interface
  return {
    ...blocksState,
    ...uiState,
    deleteBlock: (id: string) =>
      uiState.handleBlockAction('delete', undefined, id),
    addBlock: (type: 'text' | 'tab', afterBlockId?: string | null) =>
      uiState.handleBlockAction('add', type, undefined, afterBlockId),
    duplicateBlock: (id: string) =>
      uiState.handleBlockAction('duplicate', undefined, id),
  };
};

/**
 * Custom hook that returns metadata-related state and actions
 */
export const useTabMetadata = () => {
  return useStoreWithEqualityFn(
    useMetadataStore,
    (state) => ({
      metadata: state.metadata,
      updateMetadata: state.updateMetadata,
    }),
    shallow
  );
};

/**
 * Custom hook that returns playback-related state and actions
 */
export const usePlayback = () => {
  // Get playback UI state
  const uiState = useStoreWithEqualityFn(
    useUIStore,
    (state) => ({
      playback: state.playback,
      setPlayback: state.setPlayback,
      stopPlayback: state.stopPlayback,
    }),
    shallow
  );

  // Get audio playback actions
  const audioState = useStoreWithEqualityFn(
    useAudioStore,
    (state) => ({
      playBlock: state.playBlock,
      playAll: state.playAll,
      stopAudio: state.stopPlayback,
      isAudioInitialized: state.isInitialized,
    }),
    shallow
  );

  return {
    ...uiState,
    ...audioState,
  };
};

/**
 * Custom hook that returns export/import and settings-related state and actions
 */
export const useExportImport = () => {
  return useStoreWithEqualityFn(
    useUIStore,
    (state) => ({
      exportOpen: state.exportOpen,
      importOpen: state.importOpen,
      exportText: state.exportText,
      importText: state.importText,
      settingsOpen: state.settingsOpen,
      setExportOpen: state.setExportOpen,
      setImportOpen: state.setImportOpen,
      setExportText: state.setExportText,
      setImportText: state.setImportText,
      setSettingsOpen: state.setSettingsOpen,
      handleExport: state.handleExport,
      handleImport: state.handleImport,
      handleCopyExport: state.handleCopyExport,
      handleDownloadExport: state.handleDownloadExport,
    }),
    shallow
  );
};

/**
 * Custom hook to check if there are tab blocks
 */
export const useHasTabBlocks = () => {
  return useStoreWithEqualityFn(
    useBlocksStore,
    (state) => state.blocks.some((block) => block.type === 'tab'),
    (a, b) => a === b
  );
};

/**
 * Custom hook to subscribe to changes in a specific block
 */
export const useBlockContent = (blockId: string) => {
  const selector = useCallback(
    (state: { blocks: Block[] }) =>
      state.blocks.find((b: Block) => b.id === blockId) || null,
    [blockId]
  );

  return useStoreWithEqualityFn(useBlocksStore, selector, shallow);
};

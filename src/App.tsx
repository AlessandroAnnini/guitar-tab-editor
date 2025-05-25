import React, { memo, useEffect } from 'react';
import { ThemeProvider } from '@/components/theme-provider';
import TabToolbar from './components/TabToolbar';
import BlockList from './components/BlockList';
import {
  useBlockManager,
  useTabMetadata,
  usePlayback,
  useExportImport,
  useHasTabBlocks,
} from './stores/hooks';
import { useAudioStore } from './stores/audioStore';

// Main application component
const App: React.FC = () => {
  // Initialize audio engine when app loads
  useEffect(() => {
    const initAudio = async () => {
      await useAudioStore.getState().initAudio();
      console.log('Audio engine initialized');
    };

    initAudio();
  }, []);

  // Use custom hooks that leverage shallow equality for optimal re-renders
  const {
    blocks,
    activeBlockId,
    updateBlock,
    deleteBlock,
    moveBlock,
    addBlock,
    duplicateBlock,
    setActiveBlockId,
  } = useBlockManager();

  const { metadata, updateMetadata } = useTabMetadata();

  const { playback, playBlock, playAll, stopPlayback } = usePlayback();

  const {
    exportOpen,
    importOpen,
    exportText,
    importText,
    settingsOpen,
    setExportOpen,
    setImportOpen,
    setImportText,
    handleExport,
    handleImport,
    handleCopyExport,
    handleDownloadExport,
    setSettingsOpen,
  } = useExportImport();

  // Check if there are tab blocks for controlling play button state
  const hasTabBlocksValue = useHasTabBlocks();

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <div className="container mx-auto py-4 max-w-4xl">
        <MemoizedTabToolbar
          title={metadata.title}
          tuning={metadata.tuning}
          instrument={metadata.instrument}
          onUpdateMetadata={updateMetadata}
          onExport={handleExport}
          onImport={handleImport}
          onPlayAll={playAll}
          onStopPlayback={stopPlayback}
          importOpen={importOpen}
          setImportOpen={setImportOpen}
          exportOpen={exportOpen}
          setExportOpen={setExportOpen}
          settingsOpen={settingsOpen}
          setSettingsOpen={setSettingsOpen}
          importText={importText}
          setImportText={setImportText}
          exportText={exportText}
          handleImport={handleImport}
          handleCopyExport={handleCopyExport}
          handleDownloadExport={handleDownloadExport}
          isPlaying={playback.isPlaying}
          hasTabBlocks={hasTabBlocksValue}
        />

        <MemoizedBlockList
          blocks={blocks}
          activeBlockId={activeBlockId}
          setActiveBlockId={setActiveBlockId}
          playback={playback}
          onPlayBlock={playBlock}
          onStopPlayback={stopPlayback}
          onUpdateBlock={updateBlock}
          onDeleteBlock={deleteBlock}
          onMoveBlock={moveBlock}
          onAddBlock={addBlock}
          onDuplicateBlock={duplicateBlock}
          tuning={metadata.tuning}
        />
      </div>
    </ThemeProvider>
  );
};

// Memoized components for better performance
const MemoizedTabToolbar = memo(TabToolbar);
const MemoizedBlockList = memo(BlockList);

export default memo(App);

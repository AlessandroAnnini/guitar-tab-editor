import React, { useState, useEffect, useRef, useCallback } from 'react';
import TabToolbar from './TabToolbar';
import BlockList from './BlockList';
import tabUtils from '../utils/tabUtils';
import audioUtils from '@/audio-utils';
import type { Block, TabMetadata, PlaybackState } from '../types';

// Main application component
const TabEditor: React.FC = () => {
  // State for the application
  const [blocks, setBlocks] = useState<Block[]>([
    {
      id: '1',
      type: 'text',
      content: '# My Guitar Tab\n\nThis is an example tab in notebook format.',
    },
    {
      id: '2',
      type: 'tab',
      content: `e|--------------------|\nB|--------------------|\nG|--------------------|\nD|--------------------|\nA|--------------------|\nE|--------------------|\n`,
      tempo: 120,
      duration: '1/4',
      bars: 1,
    },
  ]);

  const [metadata, setMetadata] = useState<TabMetadata>({
    title: 'Untitled Tab',
    tuning: 'E A D G B E',
    spacing: 1,
    instrument: 'acoustic',
  });

  const [playback, setPlayback] = useState<PlaybackState>({
    isPlaying: false,
    currentBlock: null,
    currentBar: 0,
    playingAll: false,
  });

  // Track which block is active/focused
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);

  const [exportOpen, setExportOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [exportText, setExportText] = useState('');
  const [importText, setImportText] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Track playback with a ref to avoid hook issues
  const playbackRef = useRef(playback);
  useEffect(() => {
    playbackRef.current = playback;
  }, [playback]);

  // Effect to handle active block selection after block changes
  useEffect(() => {
    if (blocks.length > 0) {
      // If active block no longer exists or no active block is set
      const activeBlockExists = blocks.some(
        (block) => block.id === activeBlockId
      );
      if (!activeBlockExists) {
        setActiveBlockId(blocks[0].id);
      }
    }
  }, [blocks, activeBlockId]);

  // Memoized delete function that doesn't directly reference blocks
  const deleteBlock = useCallback((id: string) => {
    // Only modify blocks through the setter function to avoid closure issues
    setBlocks((prevBlocks) => {
      // Don't delete the last block
      if (prevBlocks.length <= 1) {
        return prevBlocks;
      }

      // Create filtered blocks
      return prevBlocks.filter((block) => block.id !== id);
    });
  }, []);

  // Memoize key functions to prevent unnecessary re-renders and closure issues
  const duplicateBlock = useCallback((id: string) => {
    // Find the block to duplicate
    setBlocks((prevBlocks) => {
      const blockToDuplicate = prevBlocks.find((block) => block.id === id);
      if (!blockToDuplicate) return prevBlocks;

      // Create a new ID for the duplicate
      const newId = Date.now().toString();

      // Create a duplicate with the same properties
      const duplicateBlock = {
        ...blockToDuplicate,
        id: newId,
      };

      // Insert the duplicate after the original block
      const index = prevBlocks.findIndex((block) => block.id === id);
      if (index < 0) return prevBlocks;

      const newBlocks = [...prevBlocks];
      newBlocks.splice(index + 1, 0, duplicateBlock);

      // Set the duplicate as the active block
      setTimeout(() => {
        setActiveBlockId(newId);
      }, 0);

      return newBlocks;
    });
  }, []);

  // Memoized function to move blocks
  const moveBlock = useCallback((id: string, direction: 'up' | 'down') => {
    setBlocks((prevBlocks) => {
      const index = prevBlocks.findIndex((block) => block.id === id);
      if (
        (direction === 'up' && index === 0) ||
        (direction === 'down' && index === prevBlocks.length - 1)
      ) {
        return prevBlocks;
      }

      const newBlocks = [...prevBlocks];
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      const [movedBlock] = newBlocks.splice(index, 1);
      newBlocks.splice(newIndex, 0, movedBlock);

      return newBlocks;
    });
  }, []);

  // Memoized function to update a specific block
  const updateBlock = useCallback((id: string, updates: Partial<Block>) => {
    setBlocks((prevBlocks) =>
      prevBlocks.map((block) =>
        block.id === id ? ({ ...block, ...updates } as Block) : block
      )
    );
  }, []);

  // Ensure a clean and safe way to add blocks
  const addBlock = useCallback(
    (type: 'text' | 'tab', afterBlockId: string | null = null) => {
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
      setBlocks((prevBlocks) => {
        const newBlocks = [...prevBlocks];
        if (afterBlockId) {
          // Find index of the block to insert after
          const index = newBlocks.findIndex(
            (block) => block.id === afterBlockId
          );
          if (index >= 0) {
            newBlocks.splice(index + 1, 0, newBlock);
            return newBlocks;
          }
        }
        // If no specific block to insert after or not found, add to the end
        newBlocks.push(newBlock);
        return newBlocks;
      });

      // Set new block as active - use setTimeout to ensure it runs after state update
      setTimeout(() => {
        setActiveBlockId(newBlock.id);
      }, 0);
    },
    [metadata.tuning]
  );

  const updateMetadata = (updates: Partial<TabMetadata>) => {
    setMetadata((prev) => ({ ...prev, ...updates }));
  };

  // Load state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem('tabEditorState');
    if (savedState) {
      try {
        const state = JSON.parse(savedState);
        setBlocks(state.blocks || []);
        setMetadata(state.metadata || {});
        setPlayback({
          isPlaying: false,
          currentBlock: null,
          currentBar: 0,
          playingAll: false,
        });
      } catch (error) {
        console.error('Error loading saved state:', error);
      }
    }
  }, []);

  // Effect to auto-save to localStorage
  useEffect(() => {
    const saveState = () => {
      const state = {
        blocks,
        metadata,
        playback: {
          isPlaying: false,
          currentBlock: null,
          currentBar: 0,
          playingAll: false,
        },
      };
      localStorage.setItem('tabEditorState', JSON.stringify(state));
    };

    // Save state when component unmounts
    window.addEventListener('beforeunload', saveState);

    // Also save every 30 seconds
    const intervalId = setInterval(saveState, 30000);

    return () => {
      window.removeEventListener('beforeunload', saveState);
      clearInterval(intervalId);
    };
  }, [blocks, metadata]);

  // Playback functions
  const playBlock = async (blockId: string) => {
    const block = blocks.find((b) => b.id === blockId);
    if (!block || block.type !== 'tab') return;

    // Update playback state
    setPlayback({
      isPlaying: true,
      currentBlock: blockId,
      currentBar: 0,
      playingAll: false,
    });

    try {
      // Initialize audio engine
      await audioUtils.initInstruments();

      const parsedTab = tabUtils.parseTab(block.content);
      if (!parsedTab || !parsedTab.notes || parsedTab.notes.length === 0) {
        setPlayback({
          isPlaying: false,
          currentBlock: null,
          currentBar: 0,
          playingAll: false,
        });
        return;
      }

      // Play each bar in sequence
      for (let barIndex = 0; barIndex < parsedTab.notes.length; barIndex++) {
        // Check if playback was stopped
        if (!playbackRef.current.isPlaying) break;

        // Update current bar
        setPlayback((prev) => ({ ...prev, currentBar: barIndex }));

        // Play the bar
        const barNotes = parsedTab.notes[barIndex];
        await audioUtils.playBar(barNotes, block.tempo);
      }
    } catch (error) {
      console.error('Playback error:', error);
    } finally {
      // Reset playback state when done
      setPlayback({
        isPlaying: false,
        currentBlock: null,
        currentBar: 0,
        playingAll: false,
      });
    }
  };

  const playAll = async () => {
    // Update playback state
    setPlayback({
      isPlaying: true,
      currentBlock: null,
      currentBar: 0,
      playingAll: true,
    });

    try {
      // Initialize audio engine
      await audioUtils.initInstruments();

      // Play each tab block in sequence
      for (let i = 0; i < blocks.length; i++) {
        // Check if playback was stopped
        if (!playbackRef.current.isPlaying) break;

        const block = blocks[i];
        if (block.type !== 'tab') continue;

        // Update current block
        setPlayback((prev) => ({
          ...prev,
          currentBlock: block.id,
          currentBar: 0,
        }));

        const parsedTab = tabUtils.parseTab(block.content);
        if (!parsedTab || !parsedTab.notes || parsedTab.notes.length === 0)
          continue;

        // Play each bar in the block
        for (let barIndex = 0; barIndex < parsedTab.notes.length; barIndex++) {
          // Check if playback was stopped
          if (!playbackRef.current.isPlaying) break;

          // Update current bar
          setPlayback((prev) => ({ ...prev, currentBar: barIndex }));

          // Play the bar
          const barNotes = parsedTab.notes[barIndex];
          await audioUtils.playBar(barNotes, block.tempo);
        }
      }
    } catch (error) {
      console.error('Playback error:', error);
    } finally {
      // Reset playback state
      setPlayback({
        isPlaying: false,
        currentBlock: null,
        currentBar: 0,
        playingAll: false,
      });
    }
  };

  const stopPlayback = () => {
    setPlayback({
      isPlaying: false,
      currentBlock: null,
      currentBar: 0,
      playingAll: false,
    });
  };

  // Handle export
  const handleExport = () => {
    const exportStr = tabUtils.createExport(blocks, metadata);
    setExportText(exportStr);
    setExportOpen(true);
  };

  // Handle import
  const handleImport = () => {
    try {
      const importedData = tabUtils.parseImport(importText);
      if (importedData) {
        setBlocks(importedData.blocks);
        setMetadata(importedData.metadata);
        setImportOpen(false);
        setImportText('');
      } else {
        alert('Invalid import format.');
      }
    } catch (error) {
      console.error('Import error:', error);
      alert('Error importing data. Please check the format.');
    }
  };

  // Handle copying export text to clipboard
  const handleCopyExport = () => {
    navigator.clipboard.writeText(exportText);
  };

  // Handle downloading export as file
  const handleDownloadExport = () => {
    const blob = new Blob([exportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${metadata.title.replace(/\s+/g, '_')}.gtab`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Check if there are tab blocks for controlling play button state
  const hasTabBlocks = blocks.some((block) => block.type === 'tab');

  return (
    <div className="container mx-auto py-4 max-w-4xl">
      <TabToolbar
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
        hasTabBlocks={hasTabBlocks}
      />

      <BlockList
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
  );
};

export default TabEditor;

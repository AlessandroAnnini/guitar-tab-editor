import React from 'react';
import type { BlockListProps } from '@/types';
import TabBlock from '@/components/TabBlock';
import TextBlock from '@/components/TextBlock';

// BlockList component to render and manage the list of blocks
const BlockList: React.FC<BlockListProps> = ({
  blocks,
  activeBlockId,
  setActiveBlockId,
  playback,
  onPlayBlock,
  onStopPlayback,
  onUpdateBlock,
  onDeleteBlock,
  onMoveBlock,
  onAddBlock,
  onDuplicateBlock,
  tuning,
}) => {
  return (
    <div className="space-y-1 mt-4">
      {blocks.map((block) =>
        block.type === 'tab' ? (
          <TabBlock
            key={block.id}
            block={block}
            onUpdate={onUpdateBlock}
            onDelete={onDeleteBlock}
            onMove={onMoveBlock}
            isPlaying={playback.isPlaying && playback.currentBlock === block.id}
            onPlay={onPlayBlock}
            onStop={onStopPlayback}
            isActive={activeBlockId === block.id}
            setActive={setActiveBlockId}
            onAddBlock={onAddBlock}
            tuning={tuning}
            onDuplicate={onDuplicateBlock}
          />
        ) : (
          <TextBlock
            key={block.id}
            block={block}
            onUpdate={onUpdateBlock}
            onDelete={onDeleteBlock}
            onMove={onMoveBlock}
            isActive={activeBlockId === block.id}
            setActive={setActiveBlockId}
            onAddBlock={onAddBlock}
            onDuplicate={onDuplicateBlock}
          />
        )
      )}
    </div>
  );
};

// Custom comparison function to optimize re-renders
const areEqual = (prevProps: BlockListProps, nextProps: BlockListProps) => {
  // Check if blocks array has changed (shallow compare of IDs and content)
  if (prevProps.blocks.length !== nextProps.blocks.length) {
    return false;
  }

  // Check if block contents have changed
  for (let i = 0; i < prevProps.blocks.length; i++) {
    const prevBlock = prevProps.blocks[i];
    const nextBlock = nextProps.blocks[i];

    if (
      prevBlock.id !== nextBlock.id ||
      prevBlock.type !== nextBlock.type ||
      prevBlock.content !== nextBlock.content ||
      (prevBlock.type === 'tab' &&
        nextBlock.type === 'tab' &&
        (prevBlock.tempo !== nextBlock.tempo ||
          prevBlock.duration !== nextBlock.duration ||
          prevBlock.bars !== nextBlock.bars))
    ) {
      return false;
    }
  }

  // Check if active block ID has changed
  if (prevProps.activeBlockId !== nextProps.activeBlockId) {
    return false;
  }

  // Check if playback state has changed in a way that affects this component
  if (
    prevProps.playback.isPlaying !== nextProps.playback.isPlaying ||
    prevProps.playback.currentBlock !== nextProps.playback.currentBlock
  ) {
    return false;
  }

  // Check if tuning has changed
  if (prevProps.tuning !== nextProps.tuning) {
    return false;
  }

  // If none of the above conditions triggered a re-render, components are equal
  return true;
};

export default React.memo(BlockList, areEqual);

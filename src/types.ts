// Note type for audio playback
export interface Note {
  string: number;
  fret: number;
  position: number;
}

// Block types
export interface BaseBlock {
  id: string;
  type: string;
  content: string;
}

export interface TextBlock extends BaseBlock {
  type: 'text';
}

export interface TabBlock extends BaseBlock {
  type: 'tab';
  tempo: number;
  duration: string;
  bars: number;
}

export type Block = TextBlock | TabBlock;

// Metadata interfaces
export interface TabMetadata {
  title: string;
  tuning: string;
  spacing: number;
  instrument: string;
}

// Playback state
export interface PlaybackState {
  isPlaying: boolean;
  currentBlock: string | null;
  currentBar: number;
  playingAll: boolean;
}

// Component props types
export interface TabToolbarProps {
  title: string;
  tuning: string;
  instrument: string;
  onUpdateMetadata: (updates: Partial<TabMetadata>) => void;
  onExport: () => void;
  onImport: () => void;
  onPlayAll: () => void;
  onStopPlayback: () => void;
  importOpen: boolean;
  setImportOpen: (open: boolean) => void;
  exportOpen: boolean;
  setExportOpen: (open: boolean) => void;
  settingsOpen: boolean;
  setSettingsOpen: (open: boolean) => void;
  importText: string;
  setImportText: (text: string) => void;
  exportText: string;
  handleImport: () => void;
  handleCopyExport: () => void;
  handleDownloadExport: () => void;
  isPlaying: boolean;
  hasTabBlocks: boolean;
}

export interface BlockListProps {
  blocks: Block[];
  activeBlockId: string | null;
  setActiveBlockId: (id: string) => void;
  playback: PlaybackState;
  onPlayBlock: (id: string) => void;
  onStopPlayback: () => void;
  onUpdateBlock: (id: string, updates: Partial<Block>) => void;
  onDeleteBlock: (id: string) => void;
  onMoveBlock: (id: string, direction: 'up' | 'down') => void;
  onAddBlock: (type: 'text' | 'tab', afterBlockId?: string | null) => void;
  onDuplicateBlock: (id: string) => void;
  tuning: string;
}

export interface TabBlockProps {
  block: TabBlock;
  onUpdate: (id: string, updates: Partial<Block>) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, direction: 'up' | 'down') => void;
  isPlaying: boolean;
  onPlay: (id: string) => void;
  onStop: () => void;
  isActive: boolean;
  setActive: (id: string) => void;
  onAddBlock: (type: 'text' | 'tab', afterBlockId?: string | null) => void;
  tuning: string;
  onDuplicate: (id: string) => void;
}

export interface TextBlockProps {
  block: TextBlock;
  onUpdate: (id: string, updates: Partial<Block>) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, direction: 'up' | 'down') => void;
  isActive: boolean;
  setActive: (id: string) => void;
  onAddBlock: (type: 'text' | 'tab', afterBlockId?: string | null) => void;
  onDuplicate: (id: string) => void;
}
